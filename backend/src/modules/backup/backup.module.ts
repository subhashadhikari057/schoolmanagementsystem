import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BackupService } from './services/backup.service';
import { BackupSchedulerService } from './services/backup-scheduler.service';
import { BackupSettingsService } from './services/backup-settings.service';
import { OffsiteBackupService } from './services/offsite-backup.service';
import { DatabaseBackupService } from './services/database-backup.service';
import { FilesBackupService } from './services/files-backup.service';
import { FullSystemBackupService } from './services/full-system-backup.service';
import { RestoreService } from './services/restore.service';
import { EncryptionService } from './services/encryption.service';
import { ProgressTrackingService } from './services/progress-tracking.service';
import { BackupController } from './controllers/backup.controller';
import { BackupScheduleController } from './controllers/backup-schedule.controller';
import { BackupSettingsController } from './controllers/backup-settings.controller';
import { BackupProgressController } from './controllers/backup-progress.controller';
import { BackupStatsController } from './controllers/backup-stats.controller';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { EnhancedAuditService } from '../../shared/logger/enhanced-audit.service';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [
    BackupSettingsController,
    BackupScheduleController,
    BackupController,
    BackupProgressController,
    BackupStatsController,
  ],
  providers: [
    BackupService,
    BackupSchedulerService,
    BackupSettingsService,
    OffsiteBackupService,
    DatabaseBackupService,
    FilesBackupService,
    FullSystemBackupService,
    RestoreService,
    EncryptionService,
    ProgressTrackingService,
    EnhancedAuditService,
  ],
  exports: [
    BackupService,
    BackupSchedulerService,
    BackupSettingsService,
    DatabaseBackupService,
    FilesBackupService,
    FullSystemBackupService,
    RestoreService,
    EncryptionService,
    ProgressTrackingService,
  ],
})
export class BackupModule {}
