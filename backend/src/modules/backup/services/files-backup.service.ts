import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { EncryptionService } from './encryption.service';

const execAsync = promisify(exec);

export interface FilesBackupOptions {
  clientId?: string;
  encrypt?: boolean;
  clientKey?: string;
  outputDir?: string;
  backupName?: string;
  includePaths?: string[];
  excludePaths?: string[];
}

export interface FilesBackupResult {
  backupId: string;
  location: string;
  size: number;
  encrypted: boolean;
  timestamp: Date;
  includedPaths: string[];
}

@Injectable()
export class FilesBackupService {
  private readonly logger = new Logger(FilesBackupService.name);
  private readonly backupDir: string;
  private readonly defaultIncludePaths = ['uploads', 'config', 'logs', '.env'];

  constructor(private readonly encryptionService: EncryptionService) {
    this.backupDir = path.join(process.cwd(), 'backups', 'files');
    this.ensureBackupDirectory();
  }

  private async ensureBackupDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.backupDir, { recursive: true });
    } catch (error) {
      this.logger.error('Failed to create backup directory:', error);
    }
  }

  /**
   * Create a files backup using tar
   */
  async createBackup(
    options: FilesBackupOptions = {},
  ): Promise<FilesBackupResult> {
    const backupId = `files_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date();

    try {
      this.logger.log(`Starting files backup: ${backupId}`);

      // Determine paths to include
      const includePaths = options.includePaths || this.defaultIncludePaths;
      const excludePaths = options.excludePaths || [
        'node_modules',
        'dist',
        '.git',
        'backups',
        '*.tmp',
        '*.log',
        'coverage',
      ];

      // Validate that include paths exist
      const validIncludePaths: string[] = [];
      for (const includePath of includePaths) {
        const fullPath = path.resolve(process.cwd(), includePath);
        try {
          await fs.access(fullPath);
          validIncludePaths.push(includePath);
          this.logger.log(`Including path: ${includePath}`);
        } catch (error) {
          this.logger.warn(`Path does not exist, skipping: ${includePath}`);
        }
      }

      if (validIncludePaths.length === 0) {
        throw new Error('No valid paths found to backup');
      }

      // Create backup file paths
      const outputDir = options.outputDir || this.backupDir;
      const backupName = options.backupName || `${backupId}.tar.gz`;
      const tarFilePath = path.join(outputDir, backupName);

      // Ensure output directory exists
      await fs.mkdir(outputDir, { recursive: true });

      // Build tar command
      const excludeArgs = excludePaths
        .map(pattern => `--exclude='${pattern}'`)
        .join(' ');
      const includeArgs = validIncludePaths.join(' ');

      const tarCmd = [
        'tar',
        '-czf',
        `"${tarFilePath}"`,
        excludeArgs,
        '-C',
        `"${process.cwd()}"`,
        includeArgs,
      ].join(' ');

      this.logger.log(`Executing tar command: ${tarCmd}`);

      // Execute tar command
      const { stdout, stderr } = await execAsync(tarCmd, {
        maxBuffer: 1024 * 1024 * 100, // 100MB buffer
        cwd: process.cwd(),
      });

      if (stderr) {
        this.logger.warn(`tar stderr: ${stderr}`);
      }

      this.logger.log('Files backup completed');

      let finalPath = tarFilePath;
      let encrypted = false;

      // Encrypt if requested
      if (options.encrypt && options.clientKey) {
        const encryptedPath = `${tarFilePath}.enc`;
        await this.encryptionService.encryptFile(
          tarFilePath,
          encryptedPath,
          options.clientKey,
        );
        await fs.unlink(tarFilePath); // Remove unencrypted file
        finalPath = encryptedPath;
        encrypted = true;
        this.logger.log('Files backup encrypted');
      }

      // Get final file size
      const stats = await fs.stat(finalPath);
      const size = stats.size;

      this.logger.log(`Files backup completed: ${finalPath} (${size} bytes)`);

      return {
        backupId,
        location: finalPath,
        size,
        encrypted,
        timestamp,
        includedPaths: validIncludePaths,
      };
    } catch (error) {
      this.logger.error(`Files backup failed for ${backupId}:`, error);
      throw new Error(`Files backup failed: ${error.message}`);
    }
  }

  /**
   * Restore files from backup
   */
  async restoreFromBackup(
    backupFilePath: string,
    options: {
      clientKey?: string;
      targetDir?: string;
      overwrite?: boolean;
    } = {},
  ): Promise<void> {
    try {
      this.logger.log(`Starting files restore from: ${backupFilePath}`);

      let tarFilePath = backupFilePath;
      const targetDir = options.targetDir || process.cwd();

      // Decrypt if needed
      if (backupFilePath.endsWith('.enc') && options.clientKey) {
        const decryptedPath = backupFilePath.replace('.enc', '');
        await this.encryptionService.decryptFile(
          backupFilePath,
          decryptedPath,
          options.clientKey,
        );
        tarFilePath = decryptedPath;
        this.logger.log('Backup file decrypted');
      }

      // Validate it's a tar archive (allow files without extension for pre-restore snapshots)
      const isValidTarFile =
        tarFilePath.endsWith('.tar.gz') ||
        tarFilePath.endsWith('.tar') ||
        !tarFilePath.includes('.') ||
        path.basename(tarFilePath).includes('pre_restore_snapshot_');

      if (!isValidTarFile) {
        throw new Error(
          'Invalid backup file format. Expected tar archive file',
        );
      }

      // Build tar extract command
      const tarCmd = [
        'tar',
        '-xzf',
        `"${tarFilePath}"`,
        '-C',
        `"${targetDir}"`,
        options.overwrite ? '--overwrite' : '--keep-newer-files',
      ].join(' ');

      this.logger.log(`Executing tar extract command: ${tarCmd}`);

      // Execute tar command
      const { stdout, stderr } = await execAsync(tarCmd, {
        maxBuffer: 1024 * 1024 * 100,
        cwd: targetDir,
      });

      if (stderr) {
        this.logger.warn(`tar stderr: ${stderr}`);
      }

      // Clean up temporary decrypted file
      if (tarFilePath !== backupFilePath) {
        await fs.unlink(tarFilePath);
      }

      this.logger.log('Files restore completed successfully');
    } catch (error) {
      this.logger.error(`Files restore failed:`, error);
      throw new Error(`Files restore failed: ${error.message}`);
    }
  }

  /**
   * Validate if a backup file is a valid files backup
   */
  async validateBackup(
    backupFilePath: string,
    clientKey?: string,
  ): Promise<boolean> {
    try {
      let tarFilePath = backupFilePath;

      // Decrypt if needed
      if (backupFilePath.endsWith('.enc') && clientKey) {
        const tempDecryptPath = `${backupFilePath}.temp_decrypt`;
        await this.encryptionService.decryptFile(
          backupFilePath,
          tempDecryptPath,
          clientKey,
        );
        tarFilePath = tempDecryptPath;
      }

      // Test tar file validity
      const testCmd = `tar -tzf "${tarFilePath}" | head -5`;
      const { stdout, stderr } = await execAsync(testCmd);

      // Clean up temp file
      if (tarFilePath !== backupFilePath) {
        await fs.unlink(tarFilePath);
      }

      // If we can list contents, it's a valid tar file
      return stdout.trim().length > 0 && !stderr.includes('Error');
    } catch (error) {
      this.logger.error('Files backup validation failed:', error);
      return false;
    }
  }

  /**
   * List contents of a backup file
   */
  async listBackupContents(
    backupFilePath: string,
    clientKey?: string,
  ): Promise<string[]> {
    try {
      let tarFilePath = backupFilePath;

      // Decrypt if needed
      if (backupFilePath.endsWith('.enc') && clientKey) {
        const tempDecryptPath = `${backupFilePath}.temp_decrypt`;
        await this.encryptionService.decryptFile(
          backupFilePath,
          tempDecryptPath,
          clientKey,
        );
        tarFilePath = tempDecryptPath;
      }

      // List tar file contents
      const listCmd = `tar -tzf "${tarFilePath}"`;
      const { stdout } = await execAsync(listCmd);

      // Clean up temp file
      if (tarFilePath !== backupFilePath) {
        await fs.unlink(tarFilePath);
      }

      return stdout
        .trim()
        .split('\n')
        .filter(line => line.length > 0);
    } catch (error) {
      this.logger.error('Failed to list backup contents:', error);
      return [];
    }
  }

  /**
   * List available files backups
   */
  async listBackups(): Promise<
    Array<{ path: string; size: number; created: Date; encrypted: boolean }>
  > {
    try {
      const files = await fs.readdir(this.backupDir);
      const backups: Array<{
        path: string;
        size: number;
        created: Date;
        encrypted: boolean;
      }> = [];

      for (const file of files) {
        if (
          file.includes('files_') &&
          (file.endsWith('.tar.gz') || file.endsWith('.tar.gz.enc'))
        ) {
          const filePath = path.join(this.backupDir, file);
          const stats = await fs.stat(filePath);

          backups.push({
            path: filePath,
            size: stats.size,
            created: stats.birthtime,
            encrypted: file.endsWith('.enc'),
          });
        }
      }

      return backups.sort((a, b) => b.created.getTime() - a.created.getTime());
    } catch (error) {
      this.logger.error('Failed to list files backups:', error);
      return [];
    }
  }

  /**
   * Get estimated backup size before creating backup
   */
  async estimateBackupSize(includePaths?: string[]): Promise<number> {
    try {
      const pathsToCheck = includePaths || this.defaultIncludePaths;
      let totalSize = 0;

      for (const includePath of pathsToCheck) {
        const fullPath = path.resolve(process.cwd(), includePath);
        try {
          const stats = await fs.stat(fullPath);
          if (stats.isDirectory()) {
            // Use du command to get directory size
            const duCmd = `du -sb "${fullPath}" | cut -f1`;
            const { stdout } = await execAsync(duCmd);
            totalSize += parseInt(stdout.trim()) || 0;
          } else {
            totalSize += stats.size;
          }
        } catch (error) {
          this.logger.warn(
            `Cannot access path for size estimation: ${includePath}`,
          );
        }
      }

      // Estimate compression ratio (tar.gz typically achieves 60-80% compression)
      return Math.ceil(totalSize * 0.3); // Assume 70% compression
    } catch (error) {
      this.logger.error('Failed to estimate backup size:', error);
      return 0;
    }
  }
}
