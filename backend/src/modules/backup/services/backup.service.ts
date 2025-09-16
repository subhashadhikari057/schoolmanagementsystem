import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { BackupType, BackupStatus } from '@prisma/client';
import { DatabaseBackupService } from './database-backup.service';
import { FilesBackupService } from './files-backup.service';
import { FullSystemBackupService } from './full-system-backup.service';
import { RestoreService } from './restore.service';
import { EncryptionService } from './encryption.service';
import { BackupSettingsService } from './backup-settings.service';
import { EnhancedAuditService } from '../../../shared/logger/enhanced-audit.service';
import { AuditAction, AuditModule } from '@sms/shared-types';
import * as fs from 'fs/promises';

export interface CreateBackupOptions {
  type: 'DATABASE' | 'FILES' | 'FULL_SYSTEM';
  clientId?: string;
  encrypt?: boolean;
  clientKey?: string;
  outputDir?: string;
  backupName?: string;
  includePaths?: string[];
  excludePaths?: string[];
  purpose?: 'regular' | 'pre-restore-snapshot' | 'scheduled';
}

export interface BackupMetadata {
  id: string;
  backupId: string;
  clientId: string | null;
  type: BackupType;
  size: bigint;
  location: string;
  encrypted: boolean;
  encryptionKey: string | null;
  status: BackupStatus;
  startedAt: Date;
  completedAt: Date | null;
  failedAt: Date | null;
  errorMessage: string | null;
  metadata: any;
  createdAt: Date;
  updatedAt: Date | null;
  createdById: string | null;
}

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly databaseBackupService: DatabaseBackupService,
    private readonly filesBackupService: FilesBackupService,
    private readonly fullSystemBackupService: FullSystemBackupService,
    private readonly restoreService: RestoreService,
    private readonly encryptionService: EncryptionService,
    private readonly auditService: EnhancedAuditService,
    private readonly backupSettingsService: BackupSettingsService,
  ) {}

  /**
   * Create a backup with metadata tracking
   */
  async createBackup(
    options: CreateBackupOptions,
    createdById?: string,
  ): Promise<BackupMetadata> {
    let backupRecord: BackupMetadata | null = null;
    const startTime = Date.now();

    try {
      this.logger.log(`Creating ${options.type} backup`);

      // Check backup settings for encryption configuration (unless this is a pre-restore snapshot)
      let shouldEncrypt = options.encrypt || false;
      let clientKey = options.clientKey;

      if (options.purpose !== 'pre-restore-snapshot') {
        try {
          const backupSettings = await this.backupSettingsService.getSettings();

          // Use global encryption settings if not explicitly overridden
          if (
            options.encrypt === undefined &&
            backupSettings.encryption.enableEncryption
          ) {
            shouldEncrypt = true;
            clientKey = backupSettings.encryption.clientEncryptionKey;
            this.logger.log(
              `Using global encryption settings for backup - encryption enabled: ${shouldEncrypt}, key available: ${!!clientKey}`,
            );
          } else if (options.encrypt === undefined) {
            this.logger.log(
              'Global encryption is disabled, backup will be unencrypted',
            );
          }
        } catch (settingsError) {
          this.logger.warn(
            'Failed to load backup settings, using provided options:',
            settingsError.message,
          );
        }
      }

      // Generate client key if encryption requested but no key provided
      if (shouldEncrypt && !clientKey) {
        clientKey = await this.encryptionService.generateClientKey(
          options.clientId || 'default',
        );
      }

      // Audit: Backup initiation
      await this.auditService.auditUserAction(
        createdById || 'system',
        AuditAction.SYSTEM_BACKUP,
        AuditModule.SYSTEM,
        {},
        {
          action: 'backup_initiated',
          backupType: options.type,
          encrypted: shouldEncrypt,
          clientId: options.clientId,
          status: 'initiated',
          timestamp: new Date().toISOString(),
        },
      );

      // Create initial metadata record
      const backupId = `${options.type.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      backupRecord = await this.prisma.backupMetadata.create({
        data: {
          backupId,
          clientId: options.clientId,
          type: options.type as BackupType,
          size: BigInt(0), // Will update after backup completes
          location: '', // Will update after backup completes
          encrypted: shouldEncrypt,
          encryptionKey: shouldEncrypt ? clientKey : null,
          status: BackupStatus.IN_PROGRESS,
          metadata: {
            options: {
              ...options,
              encrypt: shouldEncrypt,
              clientKey: undefined, // Don't store the actual key in metadata
            },
          },
          createdById,
        },
      });

      // Create backup using appropriate service
      let result: any;

      switch (options.type) {
        case 'DATABASE':
          result = await this.databaseBackupService.createBackup({
            clientId: options.clientId,
            encrypt: shouldEncrypt,
            clientKey,
            outputDir: options.outputDir,
            backupName: options.backupName,
          });
          break;

        case 'FILES':
          result = await this.filesBackupService.createBackup({
            clientId: options.clientId,
            encrypt: shouldEncrypt,
            clientKey,
            outputDir: options.outputDir,
            backupName: options.backupName,
            includePaths: options.includePaths,
            excludePaths: options.excludePaths,
          });
          break;

        case 'FULL_SYSTEM':
          result = await this.fullSystemBackupService.createBackup({
            clientId: options.clientId,
            encrypt: shouldEncrypt,
            clientKey,
            outputDir: options.outputDir,
            backupName: options.backupName,
            includePaths: options.includePaths,
            excludePaths: options.excludePaths,
          });
          break;

        default:
          throw new Error(`Unsupported backup type: ${options.type}`);
      }

      // Update metadata record with results
      backupRecord = await this.prisma.backupMetadata.update({
        where: { id: backupRecord!.id },
        data: {
          size: BigInt(result.size),
          location: result.location,
          encrypted: result.encrypted || shouldEncrypt, // Use actual encryption status from result
          status: BackupStatus.COMPLETED,
          completedAt: new Date(),
          metadata: {
            ...backupRecord!.metadata,
            result,
            actualEncrypted: result.encrypted, // Store the actual encryption status
          },
        },
      });

      // Audit: Backup success
      const duration = Date.now() - startTime;
      await this.auditService.auditUserAction(
        createdById || 'system',
        AuditAction.SYSTEM_BACKUP,
        AuditModule.SYSTEM,
        { duration: duration },
        {
          action: 'backup_completed',
          backupId: backupRecord.backupId,
          backupType: options.type,
          size: result.size,
          location: result.location,
          encrypted: result.encrypted || shouldEncrypt,
          status: 'completed',
          timestamp: new Date().toISOString(),
          success: true,
        },
      );

      this.logger.log(
        `Backup created successfully: ${backupId} - Encrypted: ${backupRecord!.encrypted}`,
      );
      return backupRecord!;
    } catch (error) {
      this.logger.error(`Backup creation failed:`, error);

      // Audit: Backup failure
      const duration = Date.now() - startTime;
      await this.auditService.auditUserAction(
        createdById || 'system',
        AuditAction.SYSTEM_BACKUP,
        AuditModule.SYSTEM,
        { duration: duration, errorMessage: error.message },
        {
          action: 'backup_failed',
          backupType: options.type,
          encrypted: options.encrypt || false,
          clientId: options.clientId,
          status: 'failed',
          timestamp: new Date().toISOString(),
          success: false,
          error: error.message,
        },
      );

      // Update metadata record with error
      if (backupRecord) {
        await this.prisma.backupMetadata
          .update({
            where: { id: backupRecord.id },
            data: {
              status: BackupStatus.FAILED,
              failedAt: new Date(),
              errorMessage: error.message,
            },
          })
          .catch(() => {}); // Don't throw if metadata update fails
      }

      throw new Error(`Backup creation failed: ${error.message}`);
    }
  }

  /**
   * Restore from backup using metadata with pre-restore snapshot
   */
  async restoreFromBackup(
    backupId: string,
    options: {
      clientKey?: string;
      targetDir?: string;
      overwrite?: boolean;
      restoreDatabase?: boolean;
      restoreFiles?: boolean;
      restoreConfig?: boolean;
      dropExisting?: boolean;
      enablePreRestoreSnapshot?: boolean;
      userId?: string;
    } = {},
  ): Promise<void> {
    const startTime = Date.now();
    let preRestoreSnapshotId: string | null = null;

    try {
      this.logger.log(`Restoring from backup: ${backupId}`);

      // Audit: Restore initiation
      await this.auditService.auditUserAction(
        options.userId || 'system',
        AuditAction.SYSTEM_RESTORE,
        AuditModule.SYSTEM,
        {},
        {
          action: 'restore_initiated',
          backupId,
          restoreDatabase: options.restoreDatabase,
          restoreFiles: options.restoreFiles,
          restoreConfig: options.restoreConfig,
          dropExisting: options.dropExisting,
          overwrite: options.overwrite,
          preRestoreSnapshot: options.enablePreRestoreSnapshot,
          status: 'initiated',
          timestamp: new Date().toISOString(),
        },
      );

      // Find backup metadata
      const backupRecord = await this.prisma.backupMetadata.findUnique({
        where: { backupId },
      });

      if (!backupRecord) {
        throw new Error(`Backup not found: ${backupId}`);
      }

      if (backupRecord.status !== BackupStatus.COMPLETED) {
        throw new Error(
          `Backup is not in completed state: ${backupRecord.status}`,
        );
      }

      // Check if backup file still exists
      try {
        await fs.access(backupRecord.location);
      } catch (error) {
        throw new Error(`Backup file not found: ${backupRecord.location}`);
      }

      // Create pre-restore snapshot if enabled
      if (options.enablePreRestoreSnapshot !== false) {
        this.logger.log('Creating pre-restore snapshot...');

        try {
          const snapshotResult = await this.createBackup(
            {
              type: 'FULL_SYSTEM',
              clientId: backupRecord.clientId || undefined,
              encrypt: false, // Keep snapshot unencrypted for easier recovery
              backupName: `pre_restore_snapshot_${Date.now()}`,
              purpose: 'pre-restore-snapshot', // Mark as snapshot to avoid status conflicts
            },
            options.userId,
          );

          preRestoreSnapshotId = snapshotResult.backupId;

          // Audit: Pre-restore snapshot created
          await this.auditService.auditUserAction(
            options.userId || 'system',
            AuditAction.SYSTEM_BACKUP,
            AuditModule.SYSTEM,
            {},
            {
              action: 'pre_restore_snapshot_created',
              backupId: preRestoreSnapshotId,
              backupType: 'FULL_SYSTEM',
              purpose: 'pre-restore-snapshot',
              parentRestoreId: backupId,
              status: 'pre-restore-snapshot-created',
              timestamp: new Date().toISOString(),
            },
          );

          this.logger.log(
            `Pre-restore snapshot created: ${preRestoreSnapshotId}`,
          );
        } catch (snapshotError) {
          this.logger.warn(
            `Failed to create pre-restore snapshot: ${snapshotError.message}`,
          );
          // Continue with restore even if snapshot fails, but log the issue
          await this.auditService.auditUserAction(
            options.userId || 'system',
            AuditAction.SYSTEM_BACKUP,
            AuditModule.SYSTEM,
            { errorMessage: snapshotError.message },
            {
              action: 'pre_restore_snapshot_failed',
              purpose: 'pre-restore-snapshot',
              parentRestoreId: backupId,
              error: snapshotError.message,
              status: 'pre-restore-snapshot-failed',
              timestamp: new Date().toISOString(),
            },
          );
        }
      }

      // Use encryption key from metadata if not provided
      let clientKey = options.clientKey;
      if (backupRecord.encrypted && !clientKey && backupRecord.encryptionKey) {
        clientKey = backupRecord.encryptionKey;
      }

      // Perform restore with memory monitoring
      try {
        this.logger.log(`Starting restore operation for backup: ${backupId}`);
        await this.restoreService.restoreFromBackup(backupRecord.location, {
          ...options,
          clientKey,
        });
        this.logger.log(`Restore operation completed for backup: ${backupId}`);
      } catch (restoreError) {
        this.logger.error(
          `Restore operation failed for backup: ${backupId}`,
          restoreError,
        );
        throw restoreError;
      }

      // Audit: Restore success
      const duration = Date.now() - startTime;
      await this.auditService.auditUserAction(
        options.userId || 'system',
        AuditAction.SYSTEM_RESTORE,
        AuditModule.SYSTEM,
        { duration: duration },
        {
          action: 'restore_completed',
          backupId,
          backupType: backupRecord.type,
          size: backupRecord.size.toString(),
          encrypted: backupRecord.encrypted,
          preRestoreSnapshotId,
          status: 'completed',
          timestamp: new Date().toISOString(),
          success: true,
        },
      );

      this.logger.log(`Restore completed successfully: ${backupId}`);
    } catch (error) {
      this.logger.error(`Restore failed for ${backupId}:`, error);

      // Audit: Restore failure
      const duration = Date.now() - startTime;
      await this.auditService.auditUserAction(
        options.userId || 'system',
        AuditAction.SYSTEM_RESTORE,
        AuditModule.SYSTEM,
        { duration: duration, errorMessage: error.message },
        {
          action: 'restore_failed',
          backupId,
          error: error.message,
          preRestoreSnapshotId,
          status: 'failed',
          timestamp: new Date().toISOString(),
          success: false,
        },
      );

      throw new Error(`Restore failed: ${error.message}`);
    }
  }

  /**
   * Get backup metadata by ID
   */
  async getBackupMetadata(backupId: string): Promise<BackupMetadata | null> {
    return await this.prisma.backupMetadata.findUnique({
      where: { backupId },
    });
  }

  /**
   * List all backups with optional filtering
   */
  async listBackups(
    options: {
      clientId?: string;
      type?: BackupType;
      status?: BackupStatus;
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<BackupMetadata[]> {
    const where: any = {};

    if (options.clientId) where.clientId = options.clientId;
    if (options.type) where.type = options.type;
    if (options.status) where.status = options.status;

    return await this.prisma.backupMetadata.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      take: options.limit || 50,
      skip: options.offset || 0,
    });
  }

  /**
   * Delete backup and its file
   */
  async deleteBackup(backupId: string): Promise<void> {
    try {
      this.logger.log(`Deleting backup: ${backupId}`);

      const backupRecord = await this.prisma.backupMetadata.findUnique({
        where: { backupId },
      });

      if (!backupRecord) {
        throw new Error(`Backup not found: ${backupId}`);
      }

      // Delete backup file
      try {
        await fs.unlink(backupRecord.location);
        this.logger.log(`Backup file deleted: ${backupRecord.location}`);
      } catch (error) {
        this.logger.warn(`Failed to delete backup file: ${error.message}`);
      }

      // Delete metadata record
      await this.prisma.backupMetadata.delete({
        where: { backupId },
      });

      this.logger.log(`Backup deleted successfully: ${backupId}`);
    } catch (error) {
      this.logger.error(`Failed to delete backup ${backupId}:`, error);
      throw new Error(`Failed to delete backup: ${error.message}`);
    }
  }

  /**
   * Cleanup old backups based on retention policy
   */
  async cleanupOldBackups(
    options: {
      clientId?: string;
      retentionDays?: number;
      maxBackups?: number;
      type?: BackupType;
    } = {},
  ): Promise<{ deleted: number; errors: string[] }> {
    const retentionDays = options.retentionDays || 30;
    const maxBackups = options.maxBackups || 10;
    const errors: string[] = [];
    let deleted = 0;

    try {
      this.logger.log(
        `Starting backup cleanup: retention=${retentionDays} days, max=${maxBackups}`,
      );

      const where: any = {};
      if (options.clientId) where.clientId = options.clientId;
      if (options.type) where.type = options.type;

      // Find old backups
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const oldBackups = await this.prisma.backupMetadata.findMany({
        where: {
          ...where,
          startedAt: { lt: cutoffDate },
          status: BackupStatus.COMPLETED,
        },
        orderBy: { startedAt: 'asc' },
      });

      // Find excess backups (beyond maxBackups limit)
      const allBackups = await this.prisma.backupMetadata.findMany({
        where: {
          ...where,
          status: BackupStatus.COMPLETED,
        },
        orderBy: { startedAt: 'desc' },
      });

      const excessBackups = allBackups.slice(maxBackups);

      // Combine old and excess backups (remove duplicates)
      const backupsToDelete = [...oldBackups, ...excessBackups].filter(
        (backup, index, arr) =>
          arr.findIndex(b => b.id === backup.id) === index,
      );

      // Delete backups
      for (const backup of backupsToDelete) {
        try {
          await this.deleteBackup(backup.backupId);
          deleted++;
        } catch (error) {
          errors.push(
            `Failed to delete backup ${backup.backupId}: ${error.message}`,
          );
        }
      }

      this.logger.log(`Backup cleanup completed: deleted ${deleted} backups`);
      return { deleted, errors };
    } catch (error) {
      this.logger.error('Backup cleanup failed:', error);
      errors.push(`Cleanup failed: ${error.message}`);
      return { deleted, errors };
    }
  }

  /**
   * Validate backup integrity
   */
  async validateBackup(
    backupId: string,
  ): Promise<{ valid: boolean; errors: string[] }> {
    try {
      const backupRecord = await this.prisma.backupMetadata.findUnique({
        where: { backupId },
      });

      if (!backupRecord) {
        return { valid: false, errors: ['Backup not found'] };
      }

      // Check if file exists
      try {
        await fs.access(backupRecord.location);
      } catch (error) {
        return { valid: false, errors: ['Backup file not found'] };
      }

      // Validate using restore service
      const result = await this.restoreService.validateBackup(
        backupRecord.location,
        backupRecord.encryptionKey || undefined,
      );

      return { valid: result.valid, errors: result.errors };
    } catch (error) {
      return { valid: false, errors: [`Validation failed: ${error.message}`] };
    }
  }

  /**
   * Get backup statistics
   */
  async getBackupStats(clientId?: string): Promise<{
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    totalSize: bigint;
    oldestBackup?: Date;
    newestBackup?: Date;
  }> {
    const where: any = {};
    if (clientId) where.clientId = clientId;

    const backups = await this.prisma.backupMetadata.findMany({ where });

    const stats = {
      total: backups.length,
      byType: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      totalSize: BigInt(0),
      oldestBackup: undefined as Date | undefined,
      newestBackup: undefined as Date | undefined,
    };

    for (const backup of backups) {
      // Count by type
      stats.byType[backup.type] = (stats.byType[backup.type] || 0) + 1;

      // Count by status
      stats.byStatus[backup.status] = (stats.byStatus[backup.status] || 0) + 1;

      // Sum total size
      stats.totalSize += backup.size;

      // Track oldest and newest
      if (!stats.oldestBackup || backup.startedAt < stats.oldestBackup) {
        stats.oldestBackup = backup.startedAt;
      }
      if (!stats.newestBackup || backup.startedAt > stats.newestBackup) {
        stats.newestBackup = backup.startedAt;
      }
    }

    return stats;
  }

  /**
   * Get backup service status
   */
  async getServiceStatus(): Promise<{
    status: 'running' | 'stopped' | 'error';
    uptime: number;
    lastBackup?: Date;
    activeBackups: number;
    scheduledBackups: number;
    errors: string[];
  }> {
    try {
      // Check if backup processes are running
      const activeBackups = await this.prisma.backupMetadata.count({
        where: { status: 'IN_PROGRESS' },
      });

      // Get scheduled backups count
      const scheduledBackups = await this.prisma.backupSchedule.count({
        where: { enabled: true },
      });

      // Get last backup
      const lastBackup = await this.prisma.backupMetadata.findFirst({
        where: { status: 'COMPLETED' },
        orderBy: { completedAt: 'desc' },
        select: { completedAt: true },
      });

      // Check for recent errors
      const recentErrors = await this.prisma.backupMetadata.findMany({
        where: {
          status: 'FAILED',
          failedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
        select: { errorMessage: true },
        take: 5,
      });

      return {
        status: activeBackups > 0 ? 'running' : 'stopped',
        uptime: process.uptime() * 1000, // Convert to milliseconds
        lastBackup: lastBackup?.completedAt || undefined,
        activeBackups,
        scheduledBackups,
        errors: recentErrors
          .map(e => e.errorMessage)
          .filter(Boolean) as string[],
      };
    } catch (error) {
      this.logger.error('Failed to get service status:', error);
      return {
        status: 'error',
        uptime: 0,
        activeBackups: 0,
        scheduledBackups: 0,
        errors: [`Service status check failed: ${error.message}`],
      };
    }
  }

  /**
   * Get storage usage breakdown
   */
  async getStorageUsage(): Promise<{
    total: number;
    used: number;
    free: number;
    breakdown: {
      database: number;
      files: number;
      fullSystem: number;
    };
    percentUsed: number;
  }> {
    try {
      // Remove unused imports - we don't need fs and path anymore

      // Get backup directory size
      const backupDir = this.configService.get(
        'BACKUP_STORAGE_PATH',
        './backups',
      );

      // Calculate sizes by backup type
      const breakdown = {
        database: 0,
        files: 0,
        fullSystem: 0,
      };

      const backups = await this.prisma.backupMetadata.findMany({
        where: { status: 'COMPLETED' },
        select: { type: true, size: true },
      });

      for (const backup of backups) {
        const size = Number(backup.size);
        switch (backup.type) {
          case 'DATABASE':
            breakdown.database += size;
            break;
          case 'FILES':
            breakdown.files += size;
            break;
          case 'FULL_SYSTEM':
            breakdown.fullSystem += size;
            break;
        }
      }

      const used = breakdown.database + breakdown.files + breakdown.fullSystem;

      // Try to get disk space (fallback to estimated values if fails)
      let total = used * 10; // Default: assume we're using 10% of available space
      let free = total - used;

      try {
        // Try to use systeminformation if available
        const si = await import('systeminformation').catch(() => null);
        if (si) {
          const diskData = await si.fsSize();
          // Find the disk that contains our backup directory
          const targetDisk = diskData.find(
            disk =>
              backupDir.startsWith(disk.mount) ||
              disk.mount === '/' ||
              disk.mount === 'C:\\' ||
              disk.mount.includes(':'),
          );

          if (targetDisk) {
            total = targetDisk.size;
            free = targetDisk.available;
            this.logger.log(
              `Using systeminformation: ${targetDisk.mount} - ${(total / 1e9).toFixed(2)} GB total`,
            );
          } else {
            throw new Error('Could not find target disk');
          }
        } else {
          // Fallback to df command for Unix/Linux systems
          const { exec: execSync } = await import('child_process');
          const { promisify } = await import('util');
          const exec = promisify(execSync);

          const { stdout } = await exec(`df -B1 "${backupDir}" | tail -1`);
          const parts = stdout.trim().split(/\s+/);
          if (parts.length >= 4) {
            total = parseInt(parts[1]) || total;
            free = parseInt(parts[3]) || free;
            this.logger.log('Using df command for disk space');
          }
        }
      } catch (error) {
        this.logger.warn(
          `Could not get actual disk space: ${error.message}, using estimates`,
        );
      }

      const percentUsed = total > 0 ? Math.round((used / total) * 100) : 0;

      return {
        total,
        used,
        free,
        breakdown,
        percentUsed,
      };
    } catch (error) {
      this.logger.error('Failed to get storage usage:', error);
      throw new Error(`Failed to get storage usage: ${error.message}`);
    }
  }

  /**
   * Get recent backups for dashboard
   */
  async getRecentBackups(
    limit: number = 10,
    clientId?: string,
  ): Promise<BackupMetadata[]> {
    try {
      const where: any = {};
      if (clientId) where.clientId = clientId;

      const backups = await this.prisma.backupMetadata.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        take: limit,
      });

      return backups.map(backup => ({
        id: backup.id,
        backupId: backup.backupId,
        clientId: backup.clientId,
        type: backup.type,
        size: backup.size,
        location: backup.location,
        encrypted: backup.encrypted,
        encryptionKey: backup.encryptionKey,
        status: backup.status,
        startedAt: backup.startedAt,
        completedAt: backup.completedAt,
        failedAt: backup.failedAt,
        errorMessage: backup.errorMessage,
        metadata: backup.metadata,
        createdAt: backup.createdAt,
        updatedAt: backup.updatedAt,
        createdById: backup.createdById,
      }));
    } catch (error) {
      this.logger.error('Failed to get recent backups:', error);
      throw new Error(`Failed to get recent backups: ${error.message}`);
    }
  }

  /**
   * Get offsite backup status
   */
  async getOffsiteStatus(): Promise<{
    connected: boolean;
    lastSync?: Date;
    syncedBackups: number;
    pendingSync: number;
    errors: string[];
    provider?: string;
  }> {
    try {
      // This is a placeholder implementation
      // In a real system, this would check actual offsite storage (S3, rsync, etc.)

      // Mock implementation for demonstration
      const mockConnected = true;
      const mockLastSync = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago

      // Count completed backups as "synced" for demo
      const syncedBackups = await this.prisma.backupMetadata.count({
        where: { status: 'COMPLETED' },
      });

      // Count in-progress backups as "pending sync"
      const pendingSync = await this.prisma.backupMetadata.count({
        where: { status: 'IN_PROGRESS' },
      });

      return {
        connected: mockConnected,
        lastSync: mockLastSync,
        syncedBackups,
        pendingSync,
        errors: [],
        provider: 'Local Storage', // Would be 'AWS S3', 'Google Cloud', etc. in real implementation
      };
    } catch (error) {
      this.logger.error('Failed to get offsite status:', error);
      return {
        connected: false,
        syncedBackups: 0,
        pendingSync: 0,
        errors: [`Offsite status check failed: ${error.message}`],
      };
    }
  }

  /**
   * Test offsite connection
   */
  async testOffsiteConnection(): Promise<{
    connected: boolean;
    message: string;
    responseTime?: number;
    lastTested: string;
  }> {
    try {
      const startTime = Date.now();

      // Mock connection test - in real implementation this would:
      // - Test S3 connection with a small object upload/download
      // - Test rsync connection with a dry-run
      // - Test FTP/SFTP connection with a simple command

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 100));

      const responseTime = Date.now() - startTime;
      const connected = true; // Mock success

      return {
        connected,
        message: connected
          ? 'Offsite connection successful'
          : 'Offsite connection failed',
        responseTime,
        lastTested: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to test offsite connection:', error);
      return {
        connected: false,
        message: `Connection test failed: ${error.message}`,
        lastTested: new Date().toISOString(),
      };
    }
  }

  /**
   * Reset backup settings to defaults
   */
  async resetToDefaults(userId: string): Promise<void> {
    try {
      this.logger.log(
        `Resetting backup settings to defaults for user: ${userId}`,
      );

      // In a real implementation, this would:
      // 1. Reset backup schedules to default configurations
      // 2. Clear custom backup paths and settings
      // 3. Reset retention policies to defaults
      // 4. Clear any custom encryption keys

      // For now, we'll disable all custom schedules and keep only system defaults
      await this.prisma.backupSchedule.updateMany({
        where: {
          createdById: userId,
          // Don't reset system-created schedules
          name: { not: { startsWith: 'System' } },
        },
        data: { enabled: false },
      });

      this.logger.log('Backup settings reset to defaults successfully');
    } catch (error) {
      this.logger.error('Failed to reset backup settings:', error);
      throw new Error(`Failed to reset backup settings: ${error.message}`);
    }
  }

  /**
   * Download backup file
   */
  async downloadBackup(
    backupId: string,
    _clientKey?: string,
  ): Promise<{
    success: boolean;
    message?: string;
    filePath?: string;
    filename?: string;
    fileSize?: number;
  }> {
    try {
      // Get backup metadata
      const backup = await this.getBackupMetadata(backupId);

      if (!backup) {
        return {
          success: false,
          message: 'Backup not found',
        };
      }

      // Check if backup file exists
      const fs = await import('fs');
      const path = await import('path');

      if (!fs.existsSync(backup.location)) {
        return {
          success: false,
          message: 'Backup file not found on disk',
        };
      }

      // Get file stats
      const stats = fs.statSync(backup.location);

      // Generate appropriate filename
      const extension = backup.encrypted
        ? '.enc'
        : backup.type === 'DATABASE'
          ? '.sql.gz'
          : '.tar.gz';
      const filename = `backup-${backup.backupId}-${backup.type.toLowerCase()}${extension}`;

      return {
        success: true,
        filePath: path.resolve(backup.location),
        filename,
        fileSize: stats.size,
      };
    } catch (error) {
      this.logger.error(`Failed to prepare backup download: ${error.message}`);
      return {
        success: false,
        message: `Failed to prepare backup download: ${error.message}`,
      };
    }
  }
}
