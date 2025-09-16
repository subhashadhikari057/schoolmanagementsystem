import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  DatabaseBackupService,
  DatabaseBackupResult,
} from './database-backup.service';
import { FilesBackupService, FilesBackupResult } from './files-backup.service';
import { EncryptionService } from './encryption.service';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface FullSystemBackupOptions {
  clientId?: string;
  encrypt?: boolean;
  clientKey?: string;
  outputDir?: string;
  backupName?: string;
  includePaths?: string[];
  excludePaths?: string[];
}

export interface FullSystemBackupResult {
  backupId: string;
  location: string;
  size: number;
  encrypted: boolean;
  timestamp: Date;
  components: {
    database: DatabaseBackupResult;
    files: FilesBackupResult;
    config: {
      location: string;
      size: number;
    };
  };
}

@Injectable()
export class FullSystemBackupService {
  private readonly logger = new Logger(FullSystemBackupService.name);
  private readonly backupDir: string;

  constructor(
    private readonly databaseBackupService: DatabaseBackupService,
    private readonly filesBackupService: FilesBackupService,
    private readonly encryptionService: EncryptionService,
    private readonly prisma: PrismaService,
  ) {
    this.backupDir = path.join(process.cwd(), 'backups', 'full-system');
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
   * Create a full system backup combining database, files, and configuration
   */
  async createBackup(
    options: FullSystemBackupOptions = {},
  ): Promise<FullSystemBackupResult> {
    const backupId = `full_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date();

    try {
      this.logger.log(`Starting full system backup: ${backupId}`);

      // Create temporary directory for this backup
      const tempDir = path.join(this.backupDir, `temp_${backupId}`);
      await fs.mkdir(tempDir, { recursive: true });

      const results: FullSystemBackupResult['components'] = {
        database: {
          backupId: '',
          location: '',
          size: 0,
          encrypted: false,
          timestamp: new Date(),
        },
        files: {
          backupId: '',
          location: '',
          size: 0,
          encrypted: false,
          timestamp: new Date(),
          includedPaths: [],
        },
        config: { location: '', size: 0 },
      };

      // 1. Create database backup
      this.logger.log('Creating database backup...');
      const dbBackup = await this.databaseBackupService.createBackup({
        clientId: options.clientId,
        encrypt: false, // We'll encrypt the final archive
        outputDir: tempDir,
        backupName: 'database.sql.gz',
      });
      results.database = dbBackup;

      // 2. Create files backup
      this.logger.log('Creating files backup...');
      const filesBackup = await this.filesBackupService.createBackup({
        clientId: options.clientId,
        encrypt: false, // We'll encrypt the final archive
        outputDir: tempDir,
        backupName: 'files.tar.gz',
        includePaths: options.includePaths,
        excludePaths: options.excludePaths,
      });
      results.files = filesBackup;

      // 3. Create configuration backup (includes system settings)
      this.logger.log('Creating configuration backup...');
      const configBackup = await this.createConfigBackup(tempDir);
      results.config = configBackup;

      // 4. Create system settings backup
      this.logger.log('Creating system settings backup...');
      await this.createSystemSettingsBackup(tempDir);

      // 5. Create system info file
      await this.createSystemInfo(tempDir, {
        backupId,
        timestamp,
        components: results,
      });

      // 6. Combine everything into a single archive
      this.logger.log('Combining components into final archive...');
      const outputDir = options.outputDir || this.backupDir;
      const backupName = options.backupName || `${backupId}.tar`;
      const finalArchivePath = path.join(outputDir, backupName);

      await fs.mkdir(outputDir, { recursive: true });

      // Create final tar archive (no compression since components are already compressed)
      const tarCmd = [
        'tar',
        '-cf',
        `"${finalArchivePath}"`,
        '-C',
        `"${tempDir}"`,
        '.',
      ].join(' ');

      const { stderr } = await execAsync(tarCmd);
      if (stderr) {
        this.logger.warn(`tar stderr: ${stderr}`);
      }

      let finalPath = finalArchivePath;
      let encrypted = false;

      // 7. Encrypt if requested
      if (options.encrypt && options.clientKey) {
        const encryptedPath = `${finalArchivePath}.enc`;
        await this.encryptionService.encryptFile(
          finalArchivePath,
          encryptedPath,
          options.clientKey,
        );
        await fs.unlink(finalArchivePath); // Remove unencrypted file
        finalPath = encryptedPath;
        encrypted = true;
        this.logger.log('Full system backup encrypted');
      }

      // 7. Get final file size
      const stats = await fs.stat(finalPath);
      const size = stats.size;

      // 8. Clean up temporary directory
      await this.cleanupTempDirectory(tempDir);

      this.logger.log(
        `Full system backup completed: ${finalPath} (${size} bytes)`,
      );

      return {
        backupId,
        location: finalPath,
        size,
        encrypted,
        timestamp,
        components: results,
      };
    } catch (error) {
      this.logger.error(`Full system backup failed for ${backupId}:`, error);

      // Clean up on error
      const tempDir = path.join(this.backupDir, `temp_${backupId}`);
      await this.cleanupTempDirectory(tempDir).catch(() => {});

      throw new Error(`Full system backup failed: ${error.message}`);
    }
  }

  /**
   * Restore from full system backup
   */
  async restoreFromBackup(
    backupFilePath: string,
    options: {
      clientKey?: string;
      targetDir?: string;
      restoreDatabase?: boolean;
      restoreFiles?: boolean;
      restoreConfig?: boolean;
      overwrite?: boolean;
    } = {},
  ): Promise<void> {
    try {
      this.logger.log(`Starting full system restore from: ${backupFilePath}`);

      const tempDir = path.join(this.backupDir, `temp_restore_${Date.now()}`);
      await fs.mkdir(tempDir, { recursive: true });

      let archivePath = backupFilePath;

      // Decrypt if needed
      if (backupFilePath.endsWith('.enc') && options.clientKey) {
        const decryptedPath = backupFilePath.replace('.enc', '');
        await this.encryptionService.decryptFile(
          backupFilePath,
          decryptedPath,
          options.clientKey,
        );
        archivePath = decryptedPath;
        this.logger.log('Backup archive decrypted');
      }

      // Extract archive (handle both .tar and .tar.gz for backward compatibility)
      const isGzipped = archivePath.endsWith('.gz');
      const extractCmd = isGzipped
        ? `tar -xzf "${archivePath}" -C "${tempDir}"`
        : `tar -xf "${archivePath}" -C "${tempDir}"`;
      await execAsync(extractCmd);
      this.logger.log('Backup archive extracted');

      // Read system info
      const systemInfoPath = path.join(tempDir, 'system-info.json');
      const systemInfo = JSON.parse(await fs.readFile(systemInfoPath, 'utf-8'));
      this.logger.log(
        `Restoring backup: ${systemInfo.backupId} from ${systemInfo.timestamp}`,
      );

      // Restore components based on options
      if (options.restoreDatabase !== false) {
        this.logger.log('Restoring database...');
        const dbBackupPath = path.join(tempDir, 'database.sql.gz');
        await this.databaseBackupService.restoreFromBackup(dbBackupPath, {
          dropExisting: options.overwrite,
        });
      }

      if (options.restoreFiles !== false) {
        this.logger.log('Restoring files...');
        const filesBackupPath = path.join(tempDir, 'files.tar.gz');
        await this.filesBackupService.restoreFromBackup(filesBackupPath, {
          targetDir: options.targetDir || process.cwd(),
          overwrite: options.overwrite,
        });
      }

      if (options.restoreConfig !== false) {
        this.logger.log('Restoring configuration...');
        await this.restoreConfigBackup(
          tempDir,
          options.targetDir || process.cwd(),
          options.overwrite || false,
        );
      }

      // Clean up temporary files
      if (archivePath !== backupFilePath) {
        await fs.unlink(archivePath);
      }
      await this.cleanupTempDirectory(tempDir);

      this.logger.log('Full system restore completed successfully');
    } catch (error) {
      this.logger.error('Full system restore failed:', error);
      throw new Error(`Full system restore failed: ${error.message}`);
    }
  }

  /**
   * Create system settings backup including school information
   */
  private async createSystemSettingsBackup(tempDir: string): Promise<void> {
    try {
      this.logger.log('Backing up system settings...');

      const systemSettingsPath = path.join(tempDir, 'system-settings.json');
      const systemSettings: any = {};

      // Backup school information
      try {
        const schoolInfo = await this.prisma.schoolInformation.findFirst();
        systemSettings.schoolInformation = schoolInfo;
      } catch (error) {
        this.logger.warn('Failed to backup school information:', error);
        systemSettings.schoolInformation = null;
      }

      // Backup academic years
      try {
        const academicYears = await this.prisma.academicYear.findMany({
          orderBy: { createdAt: 'desc' },
        });
        systemSettings.academicYears = academicYears;
      } catch (error) {
        this.logger.warn('Failed to backup academic years:', error);
        systemSettings.academicYears = [];
      }

      // Backup grading scales
      try {
        const gradingScales = await this.prisma.gradingScale.findMany();
        systemSettings.gradingScales = gradingScales;
      } catch (error) {
        this.logger.warn('Failed to backup grading scales:', error);
        systemSettings.gradingScales = [];
      }

      // Add backup metadata
      systemSettings.metadata = {
        backupDate: new Date().toISOString(),
        version: '1.0',
        type: 'system-settings',
      };

      await fs.writeFile(
        systemSettingsPath,
        JSON.stringify(systemSettings, null, 2),
      );
      this.logger.log('System settings backup completed');
    } catch (error) {
      this.logger.error('Failed to create system settings backup:', error);
      throw error;
    }
  }

  /**
   * Create configuration backup
   */
  private async createConfigBackup(
    outputDir: string,
  ): Promise<{ location: string; size: number }> {
    const configBackupPath = path.join(outputDir, 'config.tar.gz');

    const configPaths = [
      '.env',
      'prisma/schema.prisma',
      'package.json',
      'tsconfig.json',
      'nest-cli.json',
    ];

    const validPaths: string[] = [];
    for (const configPath of configPaths) {
      const fullPath = path.resolve(process.cwd(), configPath);
      try {
        await fs.access(fullPath);
        validPaths.push(configPath);
      } catch (error) {
        this.logger.warn(`Config file not found, skipping: ${configPath}`);
      }
    }

    if (validPaths.length > 0) {
      const tarCmd = [
        'tar',
        '-czf',
        `"${configBackupPath}"`,
        '-C',
        `"${process.cwd()}"`,
        ...validPaths,
      ].join(' ');

      await execAsync(tarCmd);
    } else {
      // Create empty archive if no config files found
      await execAsync(`tar -czf "${configBackupPath}" --files-from /dev/null`);
    }

    const stats = await fs.stat(configBackupPath);
    return {
      location: configBackupPath,
      size: stats.size,
    };
  }

  /**
   * Restore configuration backup
   */
  private async restoreConfigBackup(
    tempDir: string,
    targetDir: string,
    overwrite: boolean,
  ): Promise<void> {
    const configBackupPath = path.join(tempDir, 'config.tar.gz');

    try {
      await fs.access(configBackupPath);

      const extractCmd = [
        'tar',
        '-xzf',
        `"${configBackupPath}"`,
        '-C',
        `"${targetDir}"`,
        overwrite ? '--overwrite' : '--keep-newer-files',
      ].join(' ');

      await execAsync(extractCmd);
    } catch (error) {
      this.logger.warn(
        'No configuration backup found or failed to restore config',
      );
    }
  }

  /**
   * Create system information file
   */
  private async createSystemInfo(outputDir: string, info: any): Promise<void> {
    const systemInfoPath = path.join(outputDir, 'system-info.json');

    const systemInfo = {
      ...info,
      version: '1.0.0',
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      createdBy: 'School Management System Backup Engine',
    };

    await fs.writeFile(systemInfoPath, JSON.stringify(systemInfo, null, 2));
  }

  /**
   * Clean up temporary directory
   */
  private async cleanupTempDirectory(tempDir: string): Promise<void> {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      this.logger.warn(`Failed to clean up temp directory ${tempDir}:`, error);
    }
  }

  /**
   * Validate full system backup
   */
  async validateBackup(
    backupFilePath: string,
    clientKey?: string,
  ): Promise<boolean> {
    try {
      const tempDir = path.join(this.backupDir, `temp_validate_${Date.now()}`);
      await fs.mkdir(tempDir, { recursive: true });

      let archivePath = backupFilePath;

      // Decrypt if needed
      if (backupFilePath.endsWith('.enc') && clientKey) {
        const tempDecryptPath = `${backupFilePath}.temp_decrypt`;
        await this.encryptionService.decryptFile(
          backupFilePath,
          tempDecryptPath,
          clientKey,
        );
        archivePath = tempDecryptPath;
      }

      // Test extract
      const testCmd = `tar -tzf "${archivePath}" | head -10`;
      const { stdout } = await execAsync(testCmd);

      // Check for expected files
      const hasSystemInfo = stdout.includes('system-info.json');
      const hasDatabase = stdout.includes('database.sql.gz');
      const hasFiles = stdout.includes('files.tar.gz');

      // Clean up
      if (archivePath !== backupFilePath) {
        await fs.unlink(archivePath);
      }
      await this.cleanupTempDirectory(tempDir);

      return hasSystemInfo && hasDatabase && hasFiles;
    } catch (error) {
      this.logger.error('Full system backup validation failed:', error);
      return false;
    }
  }

  /**
   * List available full system backups
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
          file.includes('full_') &&
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
      this.logger.error('Failed to list full system backups:', error);
      return [];
    }
  }
}
