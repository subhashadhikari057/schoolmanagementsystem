-- AlterTable
ALTER TABLE "UserSession" ADD COLUMN     "lastActivityAt" TIMESTAMP(3),
ADD COLUMN     "revokeReason" TEXT;
