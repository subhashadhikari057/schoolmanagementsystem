/**
 * =============================================================================
 * Offsite Backup Service
 * =============================================================================
 * Handles transferring backups to remote servers via SSH/rsync
 * =============================================================================
 */

import { Injectable, Logger } from '@nestjs/common';
import { BackupSettingsService } from './backup-settings.service';
import { ProgressTrackingService } from './progress-tracking.service';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface OffsiteTransferOptions {
  localFilePath: string;
  remoteFileName?: string;
  deleteLocalAfterTransfer?: boolean;
  operationId?: string; // For progress tracking
}

export interface OffsiteTransferResult {
  success: boolean;
  remotePath?: string;
  transferTime?: number;
  error?: string;
  localFileDeleted?: boolean;
}

@Injectable()
export class OffsiteBackupService {
  private readonly logger = new Logger(OffsiteBackupService.name);

  constructor(
    private readonly backupSettingsService: BackupSettingsService,
    private readonly progressTrackingService: ProgressTrackingService,
  ) {}

  /**
   * Transfer a backup file to offsite storage
   */
  async transferBackup(
    options: OffsiteTransferOptions,
  ): Promise<OffsiteTransferResult> {
    const startTime = Date.now();
    const operationId = options.operationId;

    try {
      this.logger.log(`Starting offsite transfer: ${options.localFilePath}`);

      // Emit progress: Initiating transfer
      if (operationId) {
        this.progressTrackingService.updateProgress(
          operationId,
          'backup',
          'transferring_offsite' as any,
          82,
          'Initiating offsite transfer...',
        );
      }

      // Get offsite settings
      const settings = await this.backupSettingsService.getSettings();
      const { offsite } = settings;

      if (!offsite.enableOffsiteBackup) {
        this.logger.log('Offsite backup is disabled, skipping transfer');
        return { success: true }; // Not an error, just disabled
      }

      // Validate settings
      if (!offsite.remoteHost || !offsite.username || !offsite.remotePath) {
        throw new Error(
          'Offsite backup is enabled but missing required configuration (remoteHost, username, or remotePath)',
        );
      }

      // Check if local file exists
      try {
        await fs.access(options.localFilePath);
      } catch (error) {
        throw new Error(
          `Local backup file not found: ${options.localFilePath}`,
        );
      }

      // Emit progress: Validating connection
      if (operationId) {
        this.progressTrackingService.updateProgress(
          operationId,
          'backup',
          'transferring_offsite' as any,
          85,
          `Connecting to ${offsite.remoteHost}...`,
        );
      }

      let result: OffsiteTransferResult;

      switch (offsite.provider) {
        case 'ssh':
          result = await this.transferViaSSH(options, offsite, operationId);
          break;
        case 's3':
          throw new Error('S3 provider not yet implemented');
        case 'azure':
          throw new Error('Azure provider not yet implemented');
        case 'gcp':
          throw new Error('GCP provider not yet implemented');
        default:
          throw new Error(`Unsupported offsite provider: ${offsite.provider}`);
      }

      result.transferTime = Date.now() - startTime;

      this.logger.log(`Offsite transfer completed in ${result.transferTime}ms`);
      return result;
    } catch (error) {
      this.logger.error('Offsite transfer failed:', error);
      return {
        success: false,
        error: error.message,
        transferTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Transfer backup via SSH/rsync
   */
  private async transferViaSSH(
    options: OffsiteTransferOptions,
    offsiteConfig: any,
    operationId?: string,
  ): Promise<OffsiteTransferResult> {
    try {
      const fileName =
        options.remoteFileName || path.basename(options.localFilePath);
      const remotePath = path.posix.join(offsiteConfig.remotePath, fileName);
      const remoteTarget = `${offsiteConfig.username}@${offsiteConfig.remoteHost}:${remotePath}`;

      this.logger.log(`Transferring via SSH to: ${remoteTarget}`);

      // Emit progress: Starting transfer
      if (operationId) {
        this.progressTrackingService.updateProgress(
          operationId,
          'backup',
          'transferring_offsite' as any,
          88,
          `Transferring to ${offsiteConfig.remoteHost}...`,
        );
      }

      // Build rsync command
      const rsyncCmd = [
        'rsync',
        '-avz',
        '--progress',
        '--partial',
        '--inplace',
        `"${options.localFilePath}"`,
        `"${remoteTarget}"`,
      ].join(' ');

      this.logger.log(`Executing rsync command: ${rsyncCmd}`);

      // Execute rsync
      const { stdout, stderr } = await execAsync(rsyncCmd, {
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer for progress output
      });

      if (
        stderr &&
        !stderr.includes('Warning') &&
        !stderr.includes('building file list')
      ) {
        this.logger.warn(`rsync stderr: ${stderr}`);
      }

      if (stdout) {
        this.logger.log(`rsync output: ${stdout}`);

        // Parse rsync output for progress
        // Typical rsync output includes lines like: "1,234,567  50%  1.23MB/s    0:00:05"
        const progressMatch = stdout.match(/(\d+)%/);
        if (progressMatch && operationId) {
          const percentComplete = parseInt(progressMatch[1], 10);
          // Map rsync % to our progress scale (88-95%)
          const mappedProgress = 88 + Math.floor((percentComplete / 100) * 7);
          this.progressTrackingService.updateProgress(
            operationId,
            'backup',
            'transferring_offsite' as any,
            mappedProgress,
            `Transferring... ${percentComplete}%`,
          );
        }
      }

      // Emit progress: Transfer complete
      if (operationId) {
        this.progressTrackingService.updateProgress(
          operationId,
          'backup',
          'transferring_offsite' as any,
          95,
          'Offsite transfer completed',
        );
      }

      // Delete local file if requested
      let localFileDeleted = false;
      if (options.deleteLocalAfterTransfer) {
        try {
          await fs.unlink(options.localFilePath);
          localFileDeleted = true;
          this.logger.log(`Local file deleted: ${options.localFilePath}`);
        } catch (deleteError) {
          this.logger.warn(
            `Failed to delete local file: ${deleteError.message}`,
          );
        }
      }

      return {
        success: true,
        remotePath,
        localFileDeleted,
      };
    } catch (error) {
      this.logger.error('SSH transfer failed:', error);
      throw new Error(`SSH transfer failed: ${error.message}`);
    }
  }

  /**
   * Test offsite connection
   */
  async testConnection(): Promise<{
    connected: boolean;
    message: string;
    details?: any;
  }> {
    try {
      const settings = await this.backupSettingsService.getSettings();
      const { offsite } = settings;

      if (!offsite.enableOffsiteBackup) {
        return {
          connected: false,
          message: 'Offsite backup is disabled',
        };
      }

      if (!offsite.remoteHost || !offsite.username) {
        return {
          connected: false,
          message: 'Missing required offsite configuration',
        };
      }

      // Test SSH connection
      const testCmd = `ssh -o ConnectTimeout=10 -o BatchMode=yes ${offsite.username}@${offsite.remoteHost} "echo 'Connection test successful'"`;

      const { stdout } = await execAsync(testCmd);

      if (stdout.includes('Connection test successful')) {
        return {
          connected: true,
          message: 'SSH connection successful',
          details: {
            host: offsite.remoteHost,
            username: offsite.username,
          },
        };
      } else {
        return {
          connected: false,
          message: 'SSH connection failed - unexpected response',
        };
      }
    } catch (error) {
      return {
        connected: false,
        message: `Connection test failed: ${error.message}`,
      };
    }
  }

  /**
   * Create remote backup directory if it doesn't exist
   */
  async createRemoteDirectory(): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const settings = await this.backupSettingsService.getSettings();
      const { offsite } = settings;

      if (
        !offsite.enableOffsiteBackup ||
        !offsite.remoteHost ||
        !offsite.username ||
        !offsite.remotePath
      ) {
        return {
          success: false,
          message: 'Missing offsite configuration',
        };
      }

      const createDirCmd = `ssh ${offsite.username}@${offsite.remoteHost} "mkdir -p '${offsite.remotePath}'"`;

      await execAsync(createDirCmd);

      return {
        success: true,
        message: `Remote directory created: ${offsite.remotePath}`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to create remote directory: ${error.message}`,
      };
    }
  }

  /**
   * List remote backup files
   */
  async listRemoteBackups(): Promise<{
    success: boolean;
    files?: string[];
    error?: string;
  }> {
    try {
      const settings = await this.backupSettingsService.getSettings();
      const { offsite } = settings;

      if (
        !offsite.enableOffsiteBackup ||
        !offsite.remoteHost ||
        !offsite.username ||
        !offsite.remotePath
      ) {
        return {
          success: false,
          error: 'Missing offsite configuration',
        };
      }

      const listCmd = `ssh ${offsite.username}@${offsite.remoteHost} "ls -la '${offsite.remotePath}'"`;

      const { stdout } = await execAsync(listCmd);

      const files = stdout
        .split('\n')
        .filter(
          line =>
            line.trim() &&
            !line.startsWith('total') &&
            !line.includes(' . ') &&
            !line.includes(' .. '),
        )
        .map(line => {
          const parts = line.trim().split(/\s+/);
          return parts[parts.length - 1]; // Get filename
        });

      return {
        success: true,
        files,
      };
    } catch (error) {
      return {
        success: false,
        error: `Failed to list remote backups: ${error.message}`,
      };
    }
  }

  /**
   * Download a backup from offsite storage
   */
  async downloadFromOffsite(
    remoteFileName: string,
    localDestinationPath: string,
  ): Promise<{
    success: boolean;
    localPath?: string;
    error?: string;
    transferTime?: number;
  }> {
    const startTime = Date.now();

    try {
      this.logger.log(`Downloading from offsite: ${remoteFileName}`);

      const settings = await this.backupSettingsService.getSettings();
      const { offsite } = settings;

      if (
        !offsite.enableOffsiteBackup ||
        !offsite.remoteHost ||
        !offsite.username ||
        !offsite.remotePath
      ) {
        return {
          success: false,
          error: 'Missing offsite configuration',
        };
      }

      const remotePath = path.posix.join(offsite.remotePath, remoteFileName);
      const remoteSource = `${offsite.username}@${offsite.remoteHost}:${remotePath}`;

      this.logger.log(
        `Downloading from ${remoteSource} to ${localDestinationPath}`,
      );

      // Ensure local destination directory exists
      const localDir = path.dirname(localDestinationPath);
      await fs.mkdir(localDir, { recursive: true });

      // Build rsync command for download
      const rsyncCmd = [
        'rsync',
        '-avz',
        '--progress',
        '--partial',
        `"${remoteSource}"`,
        `"${localDestinationPath}"`,
      ].join(' ');

      this.logger.log(`Executing download: ${rsyncCmd}`);

      const { stdout, stderr } = await execAsync(rsyncCmd, {
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      });

      if (
        stderr &&
        !stderr.includes('Warning') &&
        !stderr.includes('building file list')
      ) {
        this.logger.warn(`rsync stderr: ${stderr}`);
      }

      if (stdout) {
        this.logger.log(`rsync output: ${stdout}`);
      }

      // Verify downloaded file exists
      try {
        await fs.access(localDestinationPath);
      } catch (error) {
        throw new Error('Download completed but file not found at destination');
      }

      const transferTime = Date.now() - startTime;

      return {
        success: true,
        localPath: localDestinationPath,
        transferTime,
      };
    } catch (error) {
      this.logger.error('Download from offsite failed:', error);
      return {
        success: false,
        error: `Download failed: ${error.message}`,
        transferTime: Date.now() - startTime,
      };
    }
  }
}
