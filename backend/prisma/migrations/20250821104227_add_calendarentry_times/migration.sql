/*
  Warnings:

  - The `createdById` column on the `StaffSalaryHistory` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `updatedById` column on the `StaffSalaryHistory` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `deletedById` column on the `StaffSalaryHistory` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "public"."ExamType" AS ENUM ('FIRST_TERM', 'SECOND_TERM', 'THIRD_TERM', 'FINAL', 'UNIT_TEST', 'OTHER');

-- AlterEnum
ALTER TYPE "public"."CalendarEntryType" ADD VALUE 'EXAM';

-- AlterTable
ALTER TABLE "public"."CalendarEntry" ADD COLUMN     "endTime" TEXT,
ADD COLUMN     "examDetails" TEXT,
ADD COLUMN     "examType" "public"."ExamType",
ADD COLUMN     "startTime" TEXT;

-- AlterTable
ALTER TABLE "public"."StaffSalaryHistory" DROP COLUMN "createdById",
ADD COLUMN     "createdById" UUID,
DROP COLUMN "updatedById",
ADD COLUMN     "updatedById" UUID,
DROP COLUMN "deletedById",
ADD COLUMN     "deletedById" UUID;

-- CreateIndex
CREATE INDEX "StaffSalaryHistory_createdById_idx" ON "public"."StaffSalaryHistory"("createdById");

-- CreateIndex
CREATE INDEX "StaffSalaryHistory_updatedById_idx" ON "public"."StaffSalaryHistory"("updatedById");

-- CreateIndex
CREATE INDEX "StaffSalaryHistory_deletedById_idx" ON "public"."StaffSalaryHistory"("deletedById");
