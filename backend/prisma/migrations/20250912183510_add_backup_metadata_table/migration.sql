-- CreateEnum
CREATE TYPE "public"."BackupType" AS ENUM ('DATABASE', 'FILES', 'FULL_SYSTEM', 'CONFIGURATION');

-- CreateEnum
CREATE TYPE "public"."BackupStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "public"."backup_metadata" (
    "id" TEXT NOT NULL,
    "backupId" TEXT NOT NULL,
    "clientId" TEXT,
    "type" "public"."BackupType" NOT NULL,
    "size" BIGINT NOT NULL,
    "location" TEXT NOT NULL,
    "encrypted" BOOLEAN NOT NULL DEFAULT false,
    "encryptionKey" TEXT,
    "status" "public"."BackupStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "createdById" UUID,

    CONSTRAINT "backup_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "backup_metadata_backupId_key" ON "public"."backup_metadata"("backupId");

-- CreateIndex
CREATE INDEX "backup_metadata_backupId_idx" ON "public"."backup_metadata"("backupId");

-- CreateIndex
CREATE INDEX "backup_metadata_clientId_idx" ON "public"."backup_metadata"("clientId");

-- CreateIndex
CREATE INDEX "backup_metadata_type_idx" ON "public"."backup_metadata"("type");

-- CreateIndex
CREATE INDEX "backup_metadata_status_idx" ON "public"."backup_metadata"("status");

-- CreateIndex
CREATE INDEX "backup_metadata_startedAt_idx" ON "public"."backup_metadata"("startedAt");
