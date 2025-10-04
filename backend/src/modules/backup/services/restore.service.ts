import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { DatabaseBackupService } from './database-backup.service';
import { FilesBackupService } from './files-backup.service';
import { FullSystemBackupService } from './full-system-backup.service';
import { EncryptionService } from './encryption.service';
import { ProgressTrackingService } from './progress-tracking.service';

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
    private readonly progressTrackingService: ProgressTrackingService,
  ) {}

  /**
   * Check if a file appears to be encrypted by examining its content
   */
  private async isFileEncrypted(filePath: string): Promise<boolean> {
    try {
      // Read first 16 bytes to check for binary/encrypted content
      const fileHandle = await fs.open(filePath, 'r');
      const buffer = Buffer.alloc(16);
      await fileHandle.read(buffer, 0, 16, 0);
      await fileHandle.close();

      // Check if content looks like encrypted binary data
      // Encrypted files typically have high entropy and non-printable characters
      const nonPrintableCount = buffer.filter(
        byte => byte < 32 && byte !== 9 && byte !== 10 && byte !== 13,
      ).length;
      const highEntropyThreshold = 8; // More than half should be non-printable for encrypted content

      return nonPrintableCount > highEntropyThreshold;
    } catch (_error) {
      // If we can't read the file, assume it's not encrypted
      return false;
    }
  }

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

      // Check if file appears to be encrypted (either .enc extension or binary content)
      const isEncryptedFile =
        backupFilePath.endsWith('.enc') ||
        (await this.isFileEncrypted(backupFilePath));

      if (isEncryptedFile && !clientKey) {
        throw new Error(
          'This backup file is encrypted. Please provide the encryption key to restore.',
        );
      }

      // Decrypt if needed for inspection
      if (isEncryptedFile && clientKey) {
        const tempPath = `${backupFilePath}.temp_inspect`;
        try {
          await this.encryptionService.decryptFile(
            backupFilePath,
            tempPath,
            clientKey,
          );
          inspectionPath = tempPath;
          needsCleanup = true;
        } catch (_decryptError) {
          throw new Error(
            'Failed to decrypt backup file. Please check your encryption key.',
          );
        }
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

      // Don't crash the process, return UNKNOWN instead
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
    operationId?: string,
  ): Promise<{ operationId: string }> {
    // Generate operation ID for progress tracking if not provided
    if (!operationId) {
      operationId = `restore_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Create progress tracker
    this.progressTrackingService.createProgressTracker(operationId, 'restore');

    try {
      this.logger.log(
        `Starting restore from: ${backupFilePath} (operationId: ${operationId})`,
      );

      // Emit initial progress
      this.progressTrackingService.initiateRestore(operationId, backupFilePath);

      // Check file exists and get size for memory management
      try {
        const stats = await fs.stat(backupFilePath);
        const fileSizeGB = stats.size / (1024 * 1024 * 1024);
        if (fileSizeGB > 5) {
          this.logger.warn(
            `Large backup file detected: ${fileSizeGB.toFixed(2)}GB - restore may take longer`,
          );
        }
      } catch (_statError) {
        throw new Error(`Backup file not accessible: ${backupFilePath}`);
      }

      // Emit validation progress
      this.progressTrackingService.startValidation(operationId);

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

      // Check if file is encrypted and needs decryption
      const isEncrypted = await this.isFileEncrypted(backupFilePath);
      if (isEncrypted && options.clientKey) {
        this.progressTrackingService.startDecryption(operationId);
      }

      // Route to appropriate restore service
      switch (backupType) {
        case BackupType.DATABASE:
          this.progressTrackingService.startDatabaseRestore(operationId);

          await this.databaseBackupService.restoreFromBackup(backupFilePath, {
            clientKey: options.clientKey,
            dropExisting: options.dropExisting,
          });
          break;

        case BackupType.FILES:
          this.progressTrackingService.startFileRestore(operationId);

          await this.filesBackupService.restoreFromBackup(backupFilePath, {
            clientKey: options.clientKey,
            targetDir: options.targetDir,
            overwrite: options.overwrite,
          });
          break;

        case BackupType.FULL_SYSTEM:
          // Full system has both database and files
          this.progressTrackingService.startUncompressing(operationId);
          this.progressTrackingService.startDatabaseRestore(operationId);

          await this.fullSystemBackupService.restoreFromBackup(backupFilePath, {
            clientKey: options.clientKey,
            targetDir: options.targetDir,
            restoreDatabase: options.restoreDatabase,
            restoreFiles: options.restoreFiles,
            restoreConfig: options.restoreConfig,
            overwrite: options.overwrite,
          });

          this.progressTrackingService.startFileRestore(operationId);
          break;

        default:
          throw new Error(`Unsupported backup type: ${backupType}`);
      }

      // Emit completion progress
      this.progressTrackingService.completeRestore(operationId);

      // Complete progress tracker
      this.progressTrackingService.completeProgressTracker(operationId);

      this.logger.log('Restore completed successfully');

      return { operationId };
    } catch (error) {
      this.logger.error(`Restore failed: ${error.message}`);

      // Emit failure progress
      this.progressTrackingService.failRestore(operationId!, error.message);

      // Complete progress tracker
      this.progressTrackingService.completeProgressTracker(operationId!);

      // Force garbage collection to free memory after failed restore
      if (global.gc) {
        try {
          global.gc();
        } catch (_gcError) {
          // Ignore GC errors
        }
      }

      // Re-throw with more specific error message
      if (
        error.message.includes('ENOMEM') ||
        error.message.includes('out of memory')
      ) {
        throw new Error(
          'Restore failed: Insufficient memory. Try with a smaller backup file or restart the server.',
        );
      } else if (error.message.includes('ENOSPC')) {
        throw new Error('Restore failed: Insufficient disk space.');
      } else {
        throw new Error(`Restore failed: ${error.message}`);
      }
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
