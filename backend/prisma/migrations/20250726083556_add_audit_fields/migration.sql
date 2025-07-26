-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "details" JSONB,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'SUCCESS';
