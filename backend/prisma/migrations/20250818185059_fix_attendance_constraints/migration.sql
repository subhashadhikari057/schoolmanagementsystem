/*
  Warnings:

  - The values [present,absent] on the enum `AttendanceStatus` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[studentId,classId,date]` on the table `AttendanceRecord` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."AttendanceStatus_new" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'UNKNOWN');
ALTER TABLE "public"."AttendanceRecord" ALTER COLUMN "status" TYPE "public"."AttendanceStatus_new" USING ("status"::text::"public"."AttendanceStatus_new");
ALTER TYPE "public"."AttendanceStatus" RENAME TO "AttendanceStatus_old";
ALTER TYPE "public"."AttendanceStatus_new" RENAME TO "AttendanceStatus";
DROP TYPE "public"."AttendanceStatus_old";
COMMIT;

-- DropIndex
DROP INDEX "public"."AttendanceRecord_studentId_date_deletedAt_key";

-- AlterTable
ALTER TABLE "public"."AttendanceRecord" ALTER COLUMN "deletedAt" DROP NOT NULL,
ALTER COLUMN "deletedAt" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "AttendanceRecord_studentId_idx" ON "public"."AttendanceRecord"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_studentId_classId_date_key" ON "public"."AttendanceRecord"("studentId", "classId", "date");
