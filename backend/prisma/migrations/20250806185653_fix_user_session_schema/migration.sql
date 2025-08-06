/*
  Warnings:

  - You are about to drop the column `ipAddress` on the `UserSession` table. All the data in the column will be lost.
  - You are about to drop the column `lastActivityAt` on the `UserSession` table. All the data in the column will be lost.
  - You are about to drop the column `revokeReason` on the `UserSession` table. All the data in the column will be lost.
  - You are about to drop the column `revokedAt` on the `UserSession` table. All the data in the column will be lost.
  - You are about to drop the column `userAgent` on the `UserSession` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserSession" DROP CONSTRAINT "UserSession_userId_fkey";

-- DropIndex
DROP INDEX "UserSession_userId_idx";

-- AlterTable
ALTER TABLE "UserSession" DROP COLUMN "ipAddress",
DROP COLUMN "lastActivityAt",
DROP COLUMN "revokeReason",
DROP COLUMN "revokedAt",
DROP COLUMN "userAgent";

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
