import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { DatabaseBackupService } from './database-backup.service';
import { FilesBackupService } from './files-backup.service';
import { FullSystemBackupService } from './full-system-backup.service';
import { EncryptionService } from './encryption.service';

const execAsync = promisify(exec);

export enum BackupType {
  DATABASE = 'DATABASE',
  FILES = 'FILES',
  FULL_SYSTEM = 'FULL_SYSTEM',
  UNKNOWN = 'UNKNOWN',
}

export interface RestoreOptions {
  clientKey?: string;
  targetDir?: string;
  overwrite?: boolean;
  restoreDatabase?: boolean;
  restoreFiles?: boolean;
  restoreConfig?: boolean;
  dropExisting?: boolean;
}

export interface BackupInfo {
  type: BackupType;
  encrypted: boolean;
  size: number;
  created: Date;
  metadata?: any;
}

@Injectable()
export class RestoreService {
  private readonly logger = new Logger(RestoreService.name);

  constructor(
    private readonly databaseBackupService: DatabaseBackupService,
    private readonly filesBackupService: FilesBackupService,
    private readonly fullSystemBackupService: FullSystemBackupService,
    private readonly encryptionService: EncryptionService,
  ) {}

  /**
   * Detect backup type from file path and contents
   */
  async detectBackupType(
    backupFilePath: string,
    clientKey?: string,
  ): Promise<BackupType> {
    try {
      this.logger.log(`Detecting backup type for: ${backupFilePath}`);

      // Check file existence
      await fs.access(backupFilePath);
      const fileName = path.basename(backupFilePath);

      // Quick detection based on filename patterns
      if (fileName.includes('db_') && fileName.includes('.sql')) {
        return BackupType.DATABASE;
      }

      if (fileName.includes('files_') && fileName.includes('.tar.gz')) {
        return BackupType.FILES;
      }

      // Check for full system backups including pre-restore snapshots
      if (
        (fileName.includes('full_') ||
          fileName.includes('pre_restore_snapshot_')) &&
        (fileName.includes('.tar.gz') || !fileName.includes('.'))
      ) {
        return BackupType.FULL_SYSTEM;
      }

      // For encrypted files or ambiguous names, inspect contents
      let inspectionPath = backupFilePath;
      let needsCleanup = false;

      // Decrypt if needed for inspection
      if (backupFilePath.endsWith('.enc') && clientKey) {
        const tempPath = `${backupFilePath}.temp_inspect`;
        await this.encryptionService.decryptFile(
          backupFilePath,
          tempPath,
          clientKey,
        );
        inspectionPath = tempPath;
        needsCleanup = true;
      }

      let detectedType = BackupType.UNKNOWN;

      try {
        // Check if it's a tar archive (files or full system)
        // Try to list archive contents even if extension is missing
        const isTarFile =
          inspectionPath.endsWith('.tar.gz') ||
          inspectionPath.endsWith('.tar') ||
          !inspectionPath.includes('.') || // Files without extension might be tar archives
          fileName.includes('pre_restore_snapshot_');

        if (isTarFile) {
          try {
            // Use tar -tzf without head command for Windows compatibility
            const listCmd = `tar -tzf "${inspectionPath}"`;
            const { stdout } = await execAsync(listCmd, {
              maxBuffer: 1024 * 1024 * 10, // 10MB buffer limit for large archives
              timeout: 30000, // 30 second timeout
            });

            // Take only first 20 lines equivalent by splitting and slicing
            const fileList = stdout.split('\n').slice(0, 20).join('\n');

            if (
              fileList.includes('system-info.json') &&
              (fileList.includes('database.sql.gz') ||
                fileList.includes('database.sql')) &&
              fileList.includes('files.tar.gz')
            ) {
              detectedType = BackupType.FULL_SYSTEM;
            } else {
              detectedType = BackupType.FILES;
            }
          } catch (tarError) {
            // If tar command fails, fall back to other detection methods
            this.logger.warn(`Tar inspection failed: ${tarError.message}`);
          }
        }
        // Check if it's a SQL dump (database backup)
        else if (
          inspectionPath.endsWith('.sql') ||
          inspectionPath.endsWith('.sql.gz')
        ) {
          detectedType = BackupType.DATABASE;
        }
        // Try to read first few bytes to determine format
        else {
          const buffer = Buffer.alloc(1024);
          const fd = await fs.open(inspectionPath, 'r');
          await fd.read(buffer, 0, 1024, 0);
          await fd.close();

          const content = buffer.toString();

          if (
            content.includes('PostgreSQL database dump') ||
            content.includes('CREATE TABLE') ||
            content.includes('INSERT INTO')
          ) {
            detectedType = BackupType.DATABASE;
          } else if (
            content.includes('ustar') ||
            (buffer[0] === 0x1f && buffer[1] === 0x8b)
          ) {
            // Check for tar signature or gzip signature
            detectedType = BackupType.FILES;
          }
        }
      } catch (error) {
        this.logger.warn(`Failed to inspect backup contents: ${error.message}`);
      }

      // Clean up temporary file
      if (needsCleanup) {
        await fs.unlink(inspectionPath).catch(() => {});
      }

      this.logger.log(`Detected backup type: ${detectedType}`);
      return detectedType;
    } catch (error) {
      this.logger.error(`Failed to detect backup type: ${error.message}`);
      return BackupType.UNKNOWN;
    }
  }

  /**
   * Get backup information
   */
  async getBackupInfo(
    backupFilePath: string,
    clientKey?: string,
  ): Promise<BackupInfo> {
    try {
      const stats = await fs.stat(backupFilePath);
      const type = await this.detectBackupType(backupFilePath, clientKey);
      const encrypted = backupFilePath.endsWith('.enc');

      let metadata: any = {};

      // Try to extract metadata for full system backups
      if (type === BackupType.FULL_SYSTEM) {
        try {
          const tempDir = path.join(
            path.dirname(backupFilePath),
            `temp_info_${Date.now()}`,
          );
          await fs.mkdir(tempDir, { recursive: true });

          let archivePath = backupFilePath;

          // Decrypt if needed
          if (encrypted && clientKey) {
            const decryptedPath = `${backupFilePath}.temp_decrypt`;
            await this.encryptionService.decryptFile(
              backupFilePath,
              decryptedPath,
              clientKey,
            );
            archivePath = decryptedPath;
          }

          // Extract system-info.json
          const extractCmd = `tar -xzf "${archivePath}" -C "${tempDir}" system-info.json`;
          await execAsync(extractCmd);

          const systemInfoPath = path.join(tempDir, 'system-info.json');
          const systemInfoContent = await fs.readFile(systemInfoPath, 'utf-8');
          metadata = JSON.parse(systemInfoContent);

          // Clean up
          if (archivePath !== backupFilePath) {
            await fs.unlink(archivePath);
          }
          await fs.rm(tempDir, { recursive: true, force: true });
        } catch (error) {
          this.logger.warn(
            'Failed to extract metadata from full system backup',
          );
        }
      }

      return {
        type,
        encrypted,
        size: stats.size,
        created: stats.birthtime,
        metadata,
      };
    } catch (error) {
      this.logger.error(`Failed to get backup info: ${error.message}`);
      throw new Error(`Failed to get backup info: ${error.message}`);
    }
  }

  /**
   * Restore from backup - automatically detects type and uses appropriate service
   */
  async restoreFromBackup(
    backupFilePath: string,
    options: RestoreOptions = {},
  ): Promise<void> {
    try {
      this.logger.log(`Starting restore from: ${backupFilePath}`);

      // Detect backup type
      const backupType = await this.detectBackupType(
        backupFilePath,
        options.clientKey,
      );

      if (backupType === BackupType.UNKNOWN) {
        throw new Error(
          'Unable to determine backup type. Please check the backup file.',
        );
      }

      this.logger.log(`Backup type detected: ${backupType}`);

      // Route to appropriate restore service
      switch (backupType) {
        case BackupType.DATABASE:
          await this.databaseBackupService.restoreFromBackup(backupFilePath, {
            clientKey: options.clientKey,
            dropExisting: options.dropExisting,
          });
          break;

        case BackupType.FILES:
          await this.filesBackupService.restoreFromBackup(backupFilePath, {
            clientKey: options.clientKey,
            targetDir: options.targetDir,
            overwrite: options.overwrite,
          });
          break;

        case BackupType.FULL_SYSTEM:
          await this.fullSystemBackupService.restoreFromBackup(backupFilePath, {
            clientKey: options.clientKey,
            targetDir: options.targetDir,
            restoreDatabase: options.restoreDatabase,
            restoreFiles: options.restoreFiles,
            restoreConfig: options.restoreConfig,
            overwrite: options.overwrite,
          });
          break;

        default:
          throw new Error(`Unsupported backup type: ${backupType}`);
      }

      this.logger.log('Restore completed successfully');
    } catch (error) {
      this.logger.error(`Restore failed: ${error.message}`);
      throw new Error(`Restore failed: ${error.message}`);
    }
  }

  /**
   * Validate backup file
   */
  async validateBackup(
    backupFilePath: string,
    clientKey?: string,
  ): Promise<{ valid: boolean; type: BackupType; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Check file existence
      await fs.access(backupFilePath);

      // Detect type
      const type = await this.detectBackupType(backupFilePath, clientKey);

      if (type === BackupType.UNKNOWN) {
        errors.push('Unable to determine backup type');
        return { valid: false, type, errors };
      }

      // Validate using appropriate service
      let valid = false;

      switch (type) {
        case BackupType.DATABASE:
          valid = await this.databaseBackupService.validateBackup(
            backupFilePath,
            clientKey,
          );
          if (!valid) errors.push('Invalid database backup format');
          break;

        case BackupType.FILES:
          valid = await this.filesBackupService.validateBackup(
            backupFilePath,
            clientKey,
          );
          if (!valid) errors.push('Invalid files backup format');
          break;

        case BackupType.FULL_SYSTEM:
          valid = await this.fullSystemBackupService.validateBackup(
            backupFilePath,
            clientKey,
          );
          if (!valid) errors.push('Invalid full system backup format');
          break;

        default:
          errors.push(`Unsupported backup type: ${type}`);
          break;
      }

      return { valid, type, errors };
    } catch (error) {
      errors.push(`Validation error: ${error.message}`);
      return { valid: false, type: BackupType.UNKNOWN, errors };
    }
  }

  /**
   * List contents of backup file
   */
  async listBackupContents(
    backupFilePath: string,
    clientKey?: string,
  ): Promise<string[]> {
    try {
      const type = await this.detectBackupType(backupFilePath, clientKey);

      switch (type) {
        case BackupType.FILES:
          return await this.filesBackupService.listBackupContents(
            backupFilePath,
            clientKey,
          );

        case BackupType.FULL_SYSTEM: {
          // List contents of the full system archive
          let archivePath = backupFilePath;
          let needsCleanup = false;

          if (backupFilePath.endsWith('.enc') && clientKey) {
            const tempPath = `${backupFilePath}.temp_list`;
            await this.encryptionService.decryptFile(
              backupFilePath,
              tempPath,
              clientKey,
            );
            archivePath = tempPath;
            needsCleanup = true;
          }

          const listCmd = `tar -tzf "${archivePath}"`;
          const { stdout } = await execAsync(listCmd);

          if (needsCleanup) {
            await fs.unlink(archivePath);
          }

          return stdout
            .trim()
            .split('\n')
            .filter(line => line.length > 0);
        }

        case BackupType.DATABASE:
          return ['database.sql (compressed)'];

        default:
          return [];
      }
    } catch (error) {
      this.logger.error('Failed to list backup contents:', error);
      return [];
    }
  }

  /**
   * Get restore preview - what would be restored
   */
  async getRestorePreview(
    backupFilePath: string,
    clientKey?: string,
  ): Promise<{
    type: BackupType;
    size: number;
    contents: string[];
    willRestore: {
      database: boolean;
      files: string[];
      config: string[];
    };
  }> {
    try {
      const info = await this.getBackupInfo(backupFilePath, clientKey);
      const contents = await this.listBackupContents(backupFilePath, clientKey);

      const preview = {
        type: info.type,
        size: info.size,
        contents,
        willRestore: {
          database: false,
          files: [] as string[],
          config: [] as string[],
        },
      };

      // Analyze what will be restored based on type
      switch (info.type) {
        case BackupType.DATABASE:
          preview.willRestore.database = true;
          break;

        case BackupType.FILES:
          preview.willRestore.files = contents.filter(
            item => !item.endsWith('/') && !item.includes('node_modules'),
          );
          break;

        case BackupType.FULL_SYSTEM:
          preview.willRestore.database = true;
          preview.willRestore.files = contents.filter(
            item =>
              item.startsWith('files.tar.gz') || item.includes('uploads/'),
          );
          preview.willRestore.config = contents.filter(
            item =>
              item.includes('.env') ||
              item.includes('package.json') ||
              item.includes('config'),
          );
          break;
      }

      return preview;
    } catch (error) {
      this.logger.error('Failed to get restore preview:', error);
      throw new Error(`Failed to get restore preview: ${error.message}`);
    }
  }
}
