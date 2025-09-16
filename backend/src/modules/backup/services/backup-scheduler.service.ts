/**
 * =============================================================================
 * Backup Scheduler Service
 * =============================================================================
 * Manages scheduled backup operations using cron jobs
 * =============================================================================
 */

import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { BackupService } from './backup.service';
import { BackupType, BackupStatus, ScheduleFrequency } from '@prisma/client';
import * as cron from 'node-cron';

export interface CreateScheduleOptions {
  name: string;
  type: BackupType;
  frequency: ScheduleFrequency;
  time: string; // HH:mm format
  dayOfWeek?: number; // 0-6, Sunday = 0
  dayOfMonth?: number; // 1-31
  clientId?: string;
  encrypt?: boolean;
  clientKey?: string;
  retentionDays?: number;
  maxBackups?: number;
  enabled?: boolean;
}

export interface BackupScheduleMetadata {
  id: string;
  name: string;
  type: BackupType;
  enabled: boolean;
  frequency: ScheduleFrequency;
  time: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  clientId?: string;
  encrypt: boolean;
  clientKey?: string;
  retentionDays: number;
  maxBackups: number;
  lastRun?: Date;
  nextRun?: Date;
  lastStatus?: BackupStatus;
  lastBackupId?: string;
  createdAt: Date;
  updatedAt?: Date;
  createdById?: string;
}

@Injectable()
export class BackupSchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BackupSchedulerService.name);
  private readonly scheduledJobs = new Map<string, cron.ScheduledTask>();
  private isInitialized = false;

  // Configuration constants - initialized in constructor
  private readonly DEFAULT_RETENTION_DAYS: number;
  private readonly DEFAULT_MAX_BACKUPS: number;
  private readonly DEFAULT_TIMEZONE: string;
  private readonly SYSTEM_USER_ID: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly backupService: BackupService,
  ) {
    // Initialize configuration constants
    this.DEFAULT_RETENTION_DAYS = this.configService.get<number>(
      'BACKUP_DEFAULT_RETENTION_DAYS',
      30,
    );
    this.DEFAULT_MAX_BACKUPS = this.configService.get<number>(
      'BACKUP_DEFAULT_MAX_BACKUPS',
      10,
    );
    this.DEFAULT_TIMEZONE = this.configService.get<string>(
      'BACKUP_TIMEZONE',
      'UTC',
    );
    this.SYSTEM_USER_ID = this.configService.get<string>(
      'SYSTEM_USER_ID',
      'system',
    );
  }

  async onModuleInit() {
    try {
      this.logger.log('Initializing backup scheduler...');
      await this.loadAndScheduleAllJobs();
      this.isInitialized = true;
      this.logger.log('Backup scheduler initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize backup scheduler:', error);
    }
  }

  async onModuleDestroy() {
    this.logger.log('Shutting down backup scheduler...');
    this.stopAllJobs();
  }

  /**
   * Create a new backup schedule
   */
  async createSchedule(
    options: CreateScheduleOptions,
    userId: string,
  ): Promise<BackupScheduleMetadata> {
    try {
      this.logger.log(`Creating backup schedule: ${options.name}`);

      // Validate schedule configuration
      this.validateScheduleOptions(options);

      // Calculate next run time
      const nextRun = this.calculateNextRun(options);

      // Create database record
      const schedule = await this.prisma.backupSchedule.create({
        data: {
          name: options.name,
          type: options.type,
          frequency: options.frequency,
          time: options.time,
          dayOfWeek: options.dayOfWeek,
          dayOfMonth: options.dayOfMonth,
          clientId: options.clientId,
          encrypt: options.encrypt || false,
          clientKey: options.clientKey,
          retentionDays: options.retentionDays || this.DEFAULT_RETENTION_DAYS,
          maxBackups: options.maxBackups || this.DEFAULT_MAX_BACKUPS,
          enabled: options.enabled !== false,
          nextRun,
          createdById: userId,
        },
      });

      // Schedule the job if enabled
      if (schedule.enabled) {
        await this.scheduleJob(schedule);
      }

      this.logger.log(`Backup schedule created successfully: ${schedule.id}`);
      return this.mapToScheduleMetadata(schedule);
    } catch (error) {
      this.logger.error(`Failed to create backup schedule:`, error);
      throw new Error(`Failed to create backup schedule: ${error.message}`);
    }
  }

  /**
   * Update an existing backup schedule
   */
  async updateSchedule(
    scheduleId: string,
    updates: Partial<CreateScheduleOptions>,
  ): Promise<BackupScheduleMetadata> {
    try {
      this.logger.log(`Updating backup schedule: ${scheduleId}`);

      const existingSchedule = await this.prisma.backupSchedule.findUnique({
        where: { id: scheduleId },
      });

      if (!existingSchedule) {
        throw new Error(`Backup schedule not found: ${scheduleId}`);
      }

      // Stop existing job
      this.stopJob(scheduleId);

      // Calculate new next run time if schedule changed
      let nextRun = existingSchedule.nextRun;
      if (
        updates.frequency ||
        updates.time ||
        updates.dayOfWeek ||
        updates.dayOfMonth
      ) {
        const scheduleOptions = {
          ...existingSchedule,
          ...updates,
        } as CreateScheduleOptions;
        nextRun = this.calculateNextRun(scheduleOptions);
      }

      // Update database record
      const updatedSchedule = await this.prisma.backupSchedule.update({
        where: { id: scheduleId },
        data: {
          ...updates,
          nextRun,
          updatedAt: new Date(),
        },
      });

      // Reschedule if enabled
      if (updatedSchedule.enabled) {
        await this.scheduleJob(updatedSchedule);
      }

      this.logger.log(`Backup schedule updated successfully: ${scheduleId}`);
      return this.mapToScheduleMetadata(updatedSchedule);
    } catch (error) {
      this.logger.error(`Failed to update backup schedule:`, error);
      throw new Error(`Failed to update backup schedule: ${error.message}`);
    }
  }

  /**
   * Delete a backup schedule
   */
  async deleteSchedule(scheduleId: string): Promise<void> {
    try {
      this.logger.log(`Deleting backup schedule: ${scheduleId}`);

      // Stop the job
      this.stopJob(scheduleId);

      // Delete from database
      await this.prisma.backupSchedule.delete({
        where: { id: scheduleId },
      });

      this.logger.log(`Backup schedule deleted successfully: ${scheduleId}`);
    } catch (error) {
      this.logger.error(`Failed to delete backup schedule:`, error);
      throw new Error(`Failed to delete backup schedule: ${error.message}`);
    }
  }

  /**
   * Get all backup schedules
   */
  async getSchedules(): Promise<BackupScheduleMetadata[]> {
    try {
      const schedules = await this.prisma.backupSchedule.findMany({
        orderBy: { createdAt: 'desc' },
      });

      return schedules.map(schedule => this.mapToScheduleMetadata(schedule));
    } catch (error) {
      this.logger.error('Failed to get backup schedules:', error);
      throw new Error(`Failed to get backup schedules: ${error.message}`);
    }
  }

  /**
   * Get a specific backup schedule
   */
  async getSchedule(
    scheduleId: string,
  ): Promise<BackupScheduleMetadata | null> {
    try {
      const schedule = await this.prisma.backupSchedule.findUnique({
        where: { id: scheduleId },
      });

      return schedule ? this.mapToScheduleMetadata(schedule) : null;
    } catch (error) {
      this.logger.error(`Failed to get backup schedule:`, error);
      throw new Error(`Failed to get backup schedule: ${error.message}`);
    }
  }

  /**
   * Enable/disable a backup schedule
   */
  async toggleSchedule(
    scheduleId: string,
    enabled: boolean,
  ): Promise<BackupScheduleMetadata> {
    try {
      this.logger.log(
        `${enabled ? 'Enabling' : 'Disabling'} backup schedule: ${scheduleId}`,
      );

      const schedule = await this.prisma.backupSchedule.update({
        where: { id: scheduleId },
        data: { enabled },
      });

      if (enabled) {
        await this.scheduleJob(schedule);
      } else {
        this.stopJob(scheduleId);
      }

      return this.mapToScheduleMetadata(schedule);
    } catch (error) {
      this.logger.error(`Failed to toggle backup schedule:`, error);
      throw new Error(`Failed to toggle backup schedule: ${error.message}`);
    }
  }

  /**
   * Run a schedule immediately (manual trigger)
   */
  async runScheduleNow(scheduleId: string): Promise<void> {
    try {
      this.logger.log(`Running backup schedule immediately: ${scheduleId}`);

      const schedule = await this.prisma.backupSchedule.findUnique({
        where: { id: scheduleId },
      });

      if (!schedule) {
        throw new Error(`Backup schedule not found: ${scheduleId}`);
      }

      await this.executeScheduledBackup(schedule);
    } catch (error) {
      this.logger.error(`Failed to run backup schedule:`, error);
      throw new Error(`Failed to run backup schedule: ${error.message}`);
    }
  }

  /**
   * Clean up old backups based on retention policies
   */
  async cleanupOldBackups(): Promise<{
    totalSchedules: number;
    cleanedBackups: number;
    errors: string[];
  }> {
    try {
      this.logger.log('Starting backup cleanup based on retention policies...');

      const schedules = await this.prisma.backupSchedule.findMany({
        where: { enabled: true },
      });

      let totalCleaned = 0;
      const errors: string[] = [];

      for (const schedule of schedules) {
        try {
          const cleaned = await this.cleanupScheduleBackups(schedule);
          totalCleaned += cleaned;
        } catch (error) {
          const errorMsg = `Failed to cleanup schedule ${schedule.name}: ${error.message}`;
          errors.push(errorMsg);
          this.logger.warn(errorMsg);
        }
      }

      this.logger.log(
        `Backup cleanup completed. Cleaned ${totalCleaned} backups from ${schedules.length} schedules`,
      );

      return {
        totalSchedules: schedules.length,
        cleanedBackups: totalCleaned,
        errors,
      };
    } catch (error) {
      this.logger.error('Failed to cleanup old backups:', error);
      throw error;
    }
  }

  /**
   * Get scheduler health status
   */
  async getSchedulerHealth(): Promise<{
    isInitialized: boolean;
    activeJobs: number;
    enabledSchedules: number;
    lastCleanup?: Date;
    uptime: number;
    errors: string[];
  }> {
    try {
      const enabledSchedules = await this.prisma.backupSchedule.count({
        where: { enabled: true },
      });

      // Get recent errors from backup metadata
      const recentErrors = await this.prisma.backupMetadata.findMany({
        where: {
          status: 'FAILED',
          startedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
        select: { errorMessage: true },
        take: 5,
      });

      return {
        isInitialized: this.isInitialized,
        activeJobs: this.scheduledJobs.size,
        enabledSchedules,
        uptime: process.uptime(),
        errors: recentErrors
          .map(e => e.errorMessage)
          .filter(Boolean) as string[],
      };
    } catch (error) {
      this.logger.error('Failed to get scheduler health:', error);
      throw error;
    }
  }

  /**
   * Perform scheduler maintenance
   */
  async performMaintenance(): Promise<{
    reloadedJobs: number;
    cleanedBackups: number;
    updatedNextRuns: number;
  }> {
    try {
      this.logger.log('Starting scheduler maintenance...');

      // Stop all current jobs
      this.stopAllJobs();

      // Reload all jobs
      await this.loadAndScheduleAllJobs();
      const reloadedJobs = this.scheduledJobs.size;

      // Update next run times for all schedules
      const schedules = await this.prisma.backupSchedule.findMany({
        where: { enabled: true },
      });

      let updatedNextRuns = 0;
      for (const schedule of schedules) {
        const nextRun = this.calculateNextRun(schedule);
        await this.prisma.backupSchedule.update({
          where: { id: schedule.id },
          data: { nextRun },
        });
        updatedNextRuns++;
      }

      // Run cleanup
      const cleanupResult = await this.cleanupOldBackups();

      this.logger.log('Scheduler maintenance completed');

      return {
        reloadedJobs,
        cleanedBackups: cleanupResult.cleanedBackups,
        updatedNextRuns,
      };
    } catch (error) {
      this.logger.error('Failed to perform maintenance:', error);
      throw error;
    }
  }

  /**
   * Load and schedule all active jobs from database
   */
  private async loadAndScheduleAllJobs(): Promise<void> {
    const schedules = await this.prisma.backupSchedule.findMany({
      where: { enabled: true },
    });

    this.logger.log(`Loading ${schedules.length} backup schedules...`);

    for (const schedule of schedules) {
      try {
        await this.scheduleJob(schedule);
      } catch (error) {
        this.logger.error(`Failed to schedule job ${schedule.id}:`, error);
      }
    }
  }

  /**
   * Schedule a cron job for a backup schedule
   */
  private async scheduleJob(schedule: any): Promise<void> {
    const cronExpression = this.buildCronExpression(schedule);

    this.logger.debug(
      `Scheduling backup job ${schedule.id} with cron: ${cronExpression}`,
    );

    const task = cron.schedule(
      cronExpression,
      async () => {
        await this.executeScheduledBackup(schedule);
      },
      {
        timezone: this.DEFAULT_TIMEZONE,
      },
    );

    task.start();

    this.scheduledJobs.set(schedule.id, task);
  }

  /**
   * Execute a scheduled backup
   */
  private async executeScheduledBackup(schedule: any): Promise<void> {
    try {
      this.logger.log(
        `Executing scheduled backup: ${schedule.name} (${schedule.id})`,
      );

      // Update last run time
      await this.prisma.backupSchedule.update({
        where: { id: schedule.id },
        data: {
          lastRun: new Date(),
          nextRun: this.calculateNextRun(schedule),
        },
      });

      // Create backup
      const backup = await this.backupService.createBackup(
        {
          type: schedule.type,
          clientId: schedule.clientId,
          encrypt: schedule.encrypt,
          clientKey: schedule.clientKey,
        },
        schedule.createdById || this.SYSTEM_USER_ID,
      );

      // Update schedule with backup result
      await this.prisma.backupSchedule.update({
        where: { id: schedule.id },
        data: {
          lastStatus: backup.status,
          lastBackupId: backup.backupId,
        },
      });

      // Log success (frontend will show toasts for manual operations)
      this.logger.log(
        `✅ Scheduled backup "${schedule.name}" completed successfully`,
      );

      // Cleanup old backups
      await this.cleanupScheduleBackups(schedule);

      this.logger.log(
        `Scheduled backup completed successfully: ${schedule.name}`,
      );
    } catch (error) {
      this.logger.error(`Scheduled backup failed: ${schedule.name}`, error);

      // Update schedule with failure
      await this.prisma.backupSchedule.update({
        where: { id: schedule.id },
        data: {
          lastStatus: BackupStatus.FAILED,
        },
      });

      // Log failure (frontend will show toasts for manual operations)
      this.logger.error(
        `❌ Scheduled backup "${schedule.name}" failed: ${error.message}`,
      );
    }
  }

  /**
   * Clean up old backups for a specific schedule
   */
  private async cleanupScheduleBackups(schedule: any): Promise<number> {
    try {
      // Get backups for this schedule type and client
      const backups = await this.prisma.backupMetadata.findMany({
        where: {
          type: schedule.type,
          clientId: schedule.clientId,
          status: BackupStatus.COMPLETED,
        },
        orderBy: { startedAt: 'desc' },
      });

      const now = new Date();
      const retentionDate = new Date(
        now.getTime() - schedule.retentionDays * 24 * 60 * 60 * 1000,
      );

      let toDelete: string[] = [];

      // Delete by age
      const oldBackups = backups.filter(
        backup => backup.startedAt < retentionDate,
      );
      toDelete.push(...oldBackups.map(b => b.id));

      // Delete by count (keep only maxBackups)
      if (backups.length > schedule.maxBackups) {
        const excessBackups = backups.slice(schedule.maxBackups);
        toDelete.push(...excessBackups.map(b => b.id));
      }

      // Remove duplicates
      toDelete = [...new Set(toDelete)];

      if (toDelete.length > 0) {
        this.logger.log(
          `Cleaning up ${toDelete.length} old backups for schedule ${schedule.name}`,
        );

        // Delete backup files and metadata
        for (const backupId of toDelete) {
          try {
            await this.backupService.deleteBackup(backupId);
          } catch (error) {
            this.logger.warn(`Failed to delete backup ${backupId}:`, error);
          }
        }

        // Log cleanup
        this.logger.log(
          `🧹 Cleaned up ${toDelete.length} old backups for "${schedule.name}"`,
        );
        return toDelete.length;
      }

      return 0;
    } catch (error) {
      this.logger.error(
        `Failed to cleanup backups for schedule ${schedule.id}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Build cron expression from schedule configuration
   */
  private buildCronExpression(schedule: any): string {
    const [hours, minutes] = schedule.time.split(':').map(Number);

    switch (schedule.frequency) {
      case ScheduleFrequency.DAILY:
        return `${minutes} ${hours} * * *`;

      case ScheduleFrequency.WEEKLY: {
        const dayOfWeek = schedule.dayOfWeek || 0;
        return `${minutes} ${hours} * * ${dayOfWeek}`;
      }

      case ScheduleFrequency.MONTHLY: {
        const dayOfMonth = schedule.dayOfMonth || 1;
        return `${minutes} ${hours} ${dayOfMonth} * *`;
      }

      default:
        throw new Error(
          `Unsupported schedule frequency: ${schedule.frequency}`,
        );
    }
  }

  /**
   * Calculate next run time for a schedule
   */
  private calculateNextRun(schedule: CreateScheduleOptions | any): Date {
    const now = new Date();
    const [hours, minutes] = schedule.time.split(':').map(Number);

    const nextRun = new Date(now);
    nextRun.setHours(hours, minutes, 0, 0);

    switch (schedule.frequency) {
      case ScheduleFrequency.DAILY:
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        break;

      case ScheduleFrequency.WEEKLY: {
        const targetDay = schedule.dayOfWeek || 0;
        const currentDay = nextRun.getDay();
        let daysUntilTarget = (targetDay - currentDay + 7) % 7;

        if (daysUntilTarget === 0 && nextRun <= now) {
          daysUntilTarget = 7;
        }

        nextRun.setDate(nextRun.getDate() + daysUntilTarget);
        break;
      }

      case ScheduleFrequency.MONTHLY: {
        const targetDate = schedule.dayOfMonth || 1;
        nextRun.setDate(targetDate);

        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1);
          nextRun.setDate(targetDate);
        }
        break;
      }
    }

    return nextRun;
  }

  /**
   * Validate schedule options
   */
  private validateScheduleOptions(options: CreateScheduleOptions): void {
    if (!options.name?.trim()) {
      throw new Error('Schedule name is required');
    }

    if (!options.time?.match(/^\d{2}:\d{2}$/)) {
      throw new Error('Time must be in HH:mm format');
    }

    const [hours, minutes] = options.time.split(':').map(Number);
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      throw new Error('Invalid time format');
    }

    if (options.frequency === ScheduleFrequency.WEEKLY) {
      if (
        options.dayOfWeek == null ||
        options.dayOfWeek < 0 ||
        options.dayOfWeek > 6
      ) {
        throw new Error('Day of week must be 0-6 for weekly schedules');
      }
    }

    if (options.frequency === ScheduleFrequency.MONTHLY) {
      if (
        options.dayOfMonth == null ||
        options.dayOfMonth < 1 ||
        options.dayOfMonth > 31
      ) {
        throw new Error('Day of month must be 1-31 for monthly schedules');
      }
    }

    if (options.retentionDays && options.retentionDays < 1) {
      throw new Error('Retention days must be at least 1');
    }

    if (options.maxBackups && options.maxBackups < 1) {
      throw new Error('Max backups must be at least 1');
    }
  }

  /**
   * Stop a specific scheduled job
   */
  private stopJob(scheduleId: string): void {
    const task = this.scheduledJobs.get(scheduleId);
    if (task) {
      task.stop();
      this.scheduledJobs.delete(scheduleId);
      this.logger.debug(`Stopped scheduled job: ${scheduleId}`);
    }
  }

  /**
   * Stop all scheduled jobs
   */
  private stopAllJobs(): void {
    for (const [scheduleId, task] of this.scheduledJobs.entries()) {
      task.stop();
      this.logger.debug(`Stopped scheduled job: ${scheduleId}`);
    }
    this.scheduledJobs.clear();
  }

  /**
   * Map database record to metadata interface
   */
  private mapToScheduleMetadata(schedule: any): BackupScheduleMetadata {
    return {
      id: schedule.id,
      name: schedule.name,
      type: schedule.type,
      enabled: schedule.enabled,
      frequency: schedule.frequency,
      time: schedule.time,
      dayOfWeek: schedule.dayOfWeek,
      dayOfMonth: schedule.dayOfMonth,
      clientId: schedule.clientId,
      encrypt: schedule.encrypt,
      clientKey: schedule.clientKey,
      retentionDays: schedule.retentionDays,
      maxBackups: schedule.maxBackups,
      lastRun: schedule.lastRun,
      nextRun: schedule.nextRun,
      lastStatus: schedule.lastStatus,
      lastBackupId: schedule.lastBackupId,
      createdAt: schedule.createdAt,
      updatedAt: schedule.updatedAt,
      createdById: schedule.createdById,
    };
  }
}
