-- AlterTable
ALTER TABLE "UserSession" ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "lastActivityAt" TIMESTAMP(3),
ADD COLUMN     "revokedAt" TIMESTAMP(3),
ADD COLUMN     "userAgent" TEXT;
