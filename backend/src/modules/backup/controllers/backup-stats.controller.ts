/**
 * =============================================================================
 * Backup Stats Controller
 * =============================================================================
 * Provides comprehensive statistics for the Overview tab
 * =============================================================================
 */

import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../../../shared/decorators/roles.decorator';
import { UserRole } from '@sms/shared-types';
import { BackupService } from '../services/backup.service';
import { BackupSchedulerService } from '../services/backup-scheduler.service';
import { BackupSettingsService } from '../services/backup-settings.service';

@ApiTags('Backup Stats')
@Controller('api/v1/backup/stats')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BackupStatsController {
  constructor(
    private readonly backupService: BackupService,
    private readonly schedulerService: BackupSchedulerService,
    private readonly settingsService: BackupSettingsService,
  ) {}

  @Get('overview')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get comprehensive backup overview statistics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getOverviewStats(@Query('clientId') clientId?: string) {
    try {
      // Get backup statistics
      const backupStats = await this.backupService.getBackupStats(clientId);

      // Get scheduled backups
      const schedules = await this.schedulerService.getSchedules();
      const enabledSchedules = schedules.filter(s => s.enabled);

      // Get recent backups (last 10)
      const recentBackups = await this.backupService.getRecentBackups(
        10,
        clientId,
      );

      // Get scheduler health
      const schedulerHealth = await this.schedulerService.getSchedulerHealth();

      // Get storage usage
      const storageUsage = await this.backupService.getStorageUsage();

      // Get service status
      const serviceStatus = await this.backupService.getServiceStatus();

      // Get settings
      const settings = await this.settingsService.getSettings();

      // Calculate statistics
      const totalBackups = backupStats.total;
      const manualBackups = recentBackups.filter(
        b => !b.metadata?.purpose || b.metadata?.purpose === 'regular',
      ).length;
      const scheduledBackups = enabledSchedules.length;
      const encryptedBackups = recentBackups.filter(b => b.encrypted).length;
      const offsiteBackups = recentBackups.filter(
        b => b.metadata?.offsite?.transferred === true,
      ).length;

      // Recent activities (backup and restore operations)
      const recentActivities = recentBackups.map(backup => ({
        id: backup.backupId,
        type: 'backup',
        operation: `${backup.type} Backup`,
        status: backup.status,
        timestamp: backup.startedAt,
        size: Number(backup.size),
        encrypted: backup.encrypted,
        offsite: backup.metadata?.offsite?.transferred || false,
      }));

      // Last backup time
      const lastBackup =
        recentBackups.length > 0
          ? recentBackups[0].completedAt || recentBackups[0].startedAt
          : null;

      // Next scheduled backup
      const nextSchedule = enabledSchedules
        .filter(s => s.nextRun)
        .sort(
          (a, b) =>
            new Date(a.nextRun!).getTime() - new Date(b.nextRun!).getTime(),
        )[0];

      return {
        success: true,
        data: {
          summary: {
            totalBackups,
            manualBackups,
            scheduledBackups,
            encryptedBackups,
            offsiteBackups,
            lastBackupTime: lastBackup,
            nextScheduledBackup: nextSchedule
              ? {
                  time: nextSchedule.nextRun,
                  type: nextSchedule.type,
                  name: nextSchedule.name,
                }
              : null,
          },
          storage: {
            total: storageUsage.total,
            used: storageUsage.used,
            free: storageUsage.free,
            percentUsed: storageUsage.percentUsed,
            breakdown: {
              database: storageUsage.breakdown.database,
              files: storageUsage.breakdown.files,
              fullSystem: storageUsage.breakdown.fullSystem,
            },
          },
          byType: {
            DATABASE: backupStats.byType['DATABASE'] || 0,
            FILES: backupStats.byType['FILES'] || 0,
            FULL_SYSTEM: backupStats.byType['FULL_SYSTEM'] || 0,
          },
          byStatus: {
            COMPLETED: backupStats.byStatus['COMPLETED'] || 0,
            IN_PROGRESS: backupStats.byStatus['IN_PROGRESS'] || 0,
            FAILED: backupStats.byStatus['FAILED'] || 0,
          },
          recentActivities: recentActivities.slice(0, 10),
          scheduler: {
            isInitialized: schedulerHealth.isInitialized,
            activeJobs: schedulerHealth.activeJobs,
            enabledSchedules: schedulerHealth.enabledSchedules,
            errors: schedulerHealth.errors,
          },
          service: {
            status: serviceStatus.status,
            uptime: serviceStatus.uptime,
            activeBackups: serviceStatus.activeBackups,
            errors: serviceStatus.errors,
          },
          settings: {
            encryptionEnabled: settings.encryption.enableEncryption,
            offsiteEnabled: settings.offsite.enableOffsiteBackup,
            offsiteProvider: settings.offsite.provider,
            offsiteConnectionStatus: settings.offsite.connectionStatus,
            backupLocation: settings.offsite.backupLocation || 'local',
          },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('summary')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get backup summary' })
  async getSummary(@Query('clientId') clientId?: string) {
    try {
      const stats = await this.backupService.getBackupStats(clientId);
      return {
        success: true,
        data: {
          total: stats.total,
          byType: stats.byType,
          byStatus: stats.byStatus,
          totalSize: Number(stats.totalSize),
          oldestBackup: stats.oldestBackup,
          newestBackup: stats.newestBackup,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('recent-activities')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get recent backup and restore activities' })
  async getRecentActivities(
    @Query('limit') limit?: number,
    @Query('clientId') clientId?: string,
  ) {
    try {
      const recentBackups = await this.backupService.getRecentBackups(
        limit || 20,
        clientId,
      );

      const activities = recentBackups.map(backup => ({
        id: backup.backupId,
        type: 'backup' as const,
        operation: `${backup.type} Backup`,
        status: backup.status,
        timestamp: backup.startedAt,
        completedAt: backup.completedAt,
        size: Number(backup.size),
        encrypted: backup.encrypted,
        offsite: backup.metadata?.offsite?.transferred || false,
        duration: backup.completedAt
          ? new Date(backup.completedAt).getTime() -
            new Date(backup.startedAt).getTime()
          : null,
        errorMessage: backup.errorMessage,
      }));

      return {
        success: true,
        data: activities,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('storage')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get storage usage statistics' })
  async getStorageStats() {
    try {
      const storage = await this.backupService.getStorageUsage();
      return {
        success: true,
        data: storage,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('scheduler-health')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get scheduler health status' })
  async getSchedulerHealth() {
    try {
      const health = await this.schedulerService.getSchedulerHealth();
      return {
        success: true,
        data: health,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('service-status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get backup service status' })
  async getServiceStatus() {
    try {
      const status = await this.backupService.getServiceStatus();
      return {
        success: true,
        data: status,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
