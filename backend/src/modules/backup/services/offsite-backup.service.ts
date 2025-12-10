/**
 * =============================================================================
 * Offsite Backup Service
 * =============================================================================
 * Handles transferring backups to remote servers via SSH
 * =============================================================================
 */

import { Injectable, Logger } from '@nestjs/common';
import { BackupSettingsService } from './backup-settings.service';
import { ProgressTrackingService } from './progress-tracking.service';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import { Client as SSHClient } from 'ssh2';

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
      } catch {
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
   * Transfer backup via SSH using ssh2 library (cross-platform)
   */
  private async transferViaSSH(
    options: OffsiteTransferOptions,
    offsiteConfig: any,
    operationId?: string,
  ): Promise<OffsiteTransferResult> {
    return new Promise((resolve, reject) => {
      const fileName =
        options.remoteFileName || path.basename(options.localFilePath);
      const remotePath = path.posix.join(offsiteConfig.remotePath, fileName);

      this.logger.log(
        `Transferring via SSH to: ${offsiteConfig.username}@${offsiteConfig.remoteHost}:${remotePath}`,
      );

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

      const conn = new SSHClient();
      const transferTimeout = setTimeout(
        () => {
          conn.end();
          reject(new Error('File transfer timeout (5 minutes)'));
        },
        5 * 60 * 1000,
      ); // 5 minutes timeout

      conn.on('ready', () => {
        this.logger.log(`✅ SSH connected, starting SFTP transfer`);

        conn.sftp((err, sftp) => {
          if (err) {
            clearTimeout(transferTimeout);
            conn.end();
            reject(new Error(`SFTP initialization failed: ${err.message}`));
            return;
          }

          // Get file stats for progress tracking
          const fileStats = fsSync.statSync(options.localFilePath);
          const totalSize = fileStats.size;
          let uploadedBytes = 0;

          this.logger.log(
            `📤 Uploading ${fileName} (${(totalSize / 1024 / 1024).toFixed(2)} MB)`,
          );

          // Create read stream from local file
          const readStream = fsSync.createReadStream(options.localFilePath);

          // Create write stream to remote file
          const writeStream = sftp.createWriteStream(remotePath);

          // Track progress
          readStream.on('data', chunk => {
            uploadedBytes += chunk.length;
            const percentComplete = Math.floor(
              (uploadedBytes / totalSize) * 100,
            );

            // Update progress (88% -> 95%)
            if (operationId && percentComplete % 10 === 0) {
              const mappedProgress =
                88 + Math.floor((percentComplete / 100) * 7);
              this.progressTrackingService.updateProgress(
                operationId,
                'backup',
                'transferring_offsite' as any,
                mappedProgress,
                `Transferring... ${percentComplete}%`,
              );
            }
          });

          // Handle errors
          readStream.on('error', error => {
            clearTimeout(transferTimeout);
            sftp.end();
            conn.end();
            reject(new Error(`File read error: ${error.message}`));
          });

          writeStream.on('error', error => {
            clearTimeout(transferTimeout);
            sftp.end();
            conn.end();
            reject(new Error(`File write error: ${error.message}`));
          });

          // Handle completion
          writeStream.on('close', async () => {
            clearTimeout(transferTimeout);
            this.logger.log(`✅ File uploaded successfully: ${remotePath}`);

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

            sftp.end();
            conn.end();

            resolve({
              success: true,
              remotePath,
              localFileDeleted,
            });
          });

          // Pipe the file
          readStream.pipe(writeStream);
        });
      });

      conn.on('error', error => {
        clearTimeout(transferTimeout);
        this.logger.error(`❌ SSH connection error: ${error.message}`);
        reject(new Error(`SSH connection failed: ${error.message}`));
      });

      // Connect with password
      const connConfig: any = {
        host: offsiteConfig.remoteHost,
        port: 22,
        username: offsiteConfig.username,
        password: offsiteConfig.sshConfig?.password,
        readyTimeout: 30000,
      };

      this.logger.log(
        `🔑 Connecting with password authentication to ${offsiteConfig.remoteHost}`,
      );
      conn.connect(connConfig);
    });
  }

  /**
   * Test offsite connection (delegated to backup-settings.service.ts)
   */
  async testConnection(): Promise<{
    connected: boolean;
    message?: string;
    details?: Record<string, unknown>;
  }> {
    return this.backupSettingsService.testOffsiteConnection();
  }

  /**
   * Create remote backup directory (delegated to backup-settings.service.ts)
   */
  async createRemoteDirectory(): Promise<{
    success: boolean;
    message: string;
  }> {
    const settings = await this.backupSettingsService.getSettings();
    const { offsite } = settings;

    if (
      !offsite.remoteHost ||
      !offsite.username ||
      !offsite.sshConfig?.password ||
      !offsite.remotePath
    ) {
      return {
        success: false,
        message: 'Missing offsite configuration',
      };
    }

    return this.backupSettingsService.createRemoteFolder(
      offsite.remoteHost,
      offsite.username,
      offsite.sshConfig.password,
      offsite.remotePath,
    );
  }

  /**
   * List remote backup files using ssh2
   */
  async listRemoteBackups(): Promise<{
    success: boolean;
    files?: string[];
    error?: string;
  }> {
    try {
      const settings = await this.backupSettingsService.getSettings();
      const { offsite } = settings;

      return new Promise(resolve => {
        if (
          !offsite.enableOffsiteBackup ||
          !offsite.remoteHost ||
          !offsite.username ||
          !offsite.remotePath ||
          !offsite.sshConfig?.password
        ) {
          resolve({
            success: false,
            error: 'Missing offsite configuration',
          });
          return;
        }

        const conn = new SSHClient();
        const connectionTimeout = setTimeout(() => {
          conn.end();
          resolve({
            success: false,
            error: 'Connection timeout',
          });
        }, 10000);

        conn.on('ready', () => {
          clearTimeout(connectionTimeout);

          conn.sftp((err, sftp) => {
            if (err) {
              conn.end();
              resolve({
                success: false,
                error: `SFTP error: ${err.message}`,
              });
              return;
            }

            sftp.readdir(offsite.remotePath || '/backups', (err, list) => {
              conn.end();

              if (err) {
                resolve({
                  success: false,
                  error: `Failed to list directory: ${err.message}`,
                });
                return;
              }

              const files = list.map(file => file.filename);
              resolve({
                success: true,
                files,
              });
            });
          });
        });

        conn.on('error', error => {
          clearTimeout(connectionTimeout);
          resolve({
            success: false,
            error: `SSH error: ${error.message}`,
          });
        });

        conn.connect({
          host: offsite.remoteHost,
          port: 22,
          username: offsite.username,
          password: offsite.sshConfig?.password || '',
          readyTimeout: 10000,
        });
      });
    } catch (error) {
      return {
        success: false,
        error: `Failed to list remote backups: ${error.message}`,
      };
    }
  }

  /**
   * Download a backup from offsite storage using ssh2
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

      return new Promise(resolve => {
        if (
          !offsite.enableOffsiteBackup ||
          !offsite.remoteHost ||
          !offsite.username ||
          !offsite.remotePath ||
          !offsite.sshConfig?.password
        ) {
          resolve({
            success: false,
            error: 'Missing offsite configuration',
            transferTime: Date.now() - startTime,
          });
          return;
        }

        const remotePath = path.posix.join(offsite.remotePath, remoteFileName);

        this.logger.log(
          `Downloading from ${offsite.remoteHost}:${remotePath} to ${localDestinationPath}`,
        );

        // Ensure local destination directory exists
        const localDir = path.dirname(localDestinationPath);
        fs.mkdir(localDir, { recursive: true }).catch(() => {
          // Directory might already exist, ignore error
        });

        const conn = new SSHClient();
        const downloadTimeout = setTimeout(
          () => {
            conn.end();
            resolve({
              success: false,
              error: 'Download timeout (5 minutes)',
              transferTime: Date.now() - startTime,
            });
          },
          5 * 60 * 1000,
        );

        conn.on('ready', () => {
          this.logger.log(`✅ SSH connected, starting SFTP download`);

          conn.sftp((err, sftp) => {
            if (err) {
              clearTimeout(downloadTimeout);
              conn.end();
              resolve({
                success: false,
                error: `SFTP error: ${err.message}`,
                transferTime: Date.now() - startTime,
              });
              return;
            }

            // Create read stream from remote file
            const readStream = sftp.createReadStream(remotePath);

            // Create write stream to local file
            const writeStream = fsSync.createWriteStream(localDestinationPath);

            readStream.on('error', error => {
              clearTimeout(downloadTimeout);
              sftp.end();
              conn.end();
              resolve({
                success: false,
                error: `Failed to read remote file: ${error.message}`,
                transferTime: Date.now() - startTime,
              });
            });

            writeStream.on('error', error => {
              clearTimeout(downloadTimeout);
              sftp.end();
              conn.end();
              resolve({
                success: false,
                error: `Failed to write local file: ${error.message}`,
                transferTime: Date.now() - startTime,
              });
            });

            writeStream.on('close', () => {
              clearTimeout(downloadTimeout);
              this.logger.log(
                `✅ File downloaded successfully: ${localDestinationPath}`,
              );

              sftp.end();
              conn.end();

              resolve({
                success: true,
                localPath: localDestinationPath,
                transferTime: Date.now() - startTime,
              });
            });

            // Pipe the download
            readStream.pipe(writeStream);
          });
        });

        conn.on('error', error => {
          clearTimeout(downloadTimeout);
          resolve({
            success: false,
            error: `SSH connection failed: ${error.message}`,
            transferTime: Date.now() - startTime,
          });
        });

        conn.connect({
          host: offsite.remoteHost,
          port: 22,
          username: offsite.username,
          password: offsite.sshConfig?.password || '',
          readyTimeout: 30000,
        });
      });
    } catch (error) {
      return {
        success: false,
        error: `Download failed: ${error.message}`,
        transferTime: Date.now() - startTime,
      };
    }
  }
}
