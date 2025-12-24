-- CreateEnum
CREATE TYPE "public"."ScheduleFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "public"."NotificationType" AS ENUM ('BACKUP_SUCCESS', 'BACKUP_FAILURE', 'BACKUP_WARNING', 'RETENTION_CLEANUP');

-- CreateTable
CREATE TABLE "public"."backup_schedules" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."BackupType" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "frequency" "public"."ScheduleFrequency" NOT NULL,
    "time" TEXT NOT NULL,
    "dayOfWeek" INTEGER,
    "dayOfMonth" INTEGER,
    "clientId" TEXT,
    "encrypt" BOOLEAN NOT NULL DEFAULT false,
    "clientKey" TEXT,
    "retentionDays" INTEGER NOT NULL DEFAULT 30,
    "maxBackups" INTEGER NOT NULL DEFAULT 10,
    "lastRun" TIMESTAMP(3),
    "nextRun" TIMESTAMP(3),
    "lastStatus" "public"."BackupStatus",
    "lastBackupId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "createdById" TEXT,

    CONSTRAINT "backup_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."backup_notifications" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT,
    "backupId" TEXT NOT NULL,
    "type" "public"."NotificationType" NOT NULL,
    "status" "public"."BackupStatus" NOT NULL,
    "message" TEXT NOT NULL,
    "details" JSONB DEFAULT '{}',
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "emailTo" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "backup_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "backup_schedules_enabled_idx" ON "public"."backup_schedules"("enabled");

-- CreateIndex
CREATE INDEX "backup_schedules_nextRun_idx" ON "public"."backup_schedules"("nextRun");

-- CreateIndex
CREATE INDEX "backup_schedules_type_idx" ON "public"."backup_schedules"("type");

-- CreateIndex
CREATE INDEX "backup_schedules_frequency_idx" ON "public"."backup_schedules"("frequency");

-- CreateIndex
CREATE INDEX "backup_notifications_scheduleId_idx" ON "public"."backup_notifications"("scheduleId");

-- CreateIndex
CREATE INDEX "backup_notifications_backupId_idx" ON "public"."backup_notifications"("backupId");

-- CreateIndex
CREATE INDEX "backup_notifications_type_idx" ON "public"."backup_notifications"("type");

-- CreateIndex
CREATE INDEX "backup_notifications_status_idx" ON "public"."backup_notifications"("status");
