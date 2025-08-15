-- AlterTable
ALTER TABLE "UserSession" ADD COLUMN     "deviceInfo" TEXT,
ADD COLUMN     "isCurrentDevice" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "previousTokenHash" TEXT,
ADD COLUMN     "revokeReason" TEXT;
