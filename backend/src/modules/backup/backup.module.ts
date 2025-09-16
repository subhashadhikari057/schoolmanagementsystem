import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BackupService } from './services/backup.service';
import { BackupSchedulerService } from './services/backup-scheduler.service';
import { BackupSettingsService } from './services/backup-settings.service';
import { DatabaseBackupService } from './services/database-backup.service';
import { FilesBackupService } from './services/files-backup.service';
import { FullSystemBackupService } from './services/full-system-backup.service';
import { RestoreService } from './services/restore.service';
import { EncryptionService } from './services/encryption.service';
import { BackupController } from './controllers/backup.controller';
import { BackupScheduleController } from './controllers/backup-schedule.controller';
import { BackupSettingsController } from './controllers/backup-settings.controller';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { EnhancedAuditService } from '../../shared/logger/enhanced-audit.service';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [
    BackupSettingsController,
    BackupScheduleController,
    BackupController,
  ],
  providers: [
    BackupService,
    BackupSchedulerService,
    BackupSettingsService,
    DatabaseBackupService,
    FilesBackupService,
    FullSystemBackupService,
    RestoreService,
    EncryptionService,
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
  ],
})
export class BackupModule {}
