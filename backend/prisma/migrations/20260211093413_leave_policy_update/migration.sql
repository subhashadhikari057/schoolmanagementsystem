-- CreateEnum
CREATE TYPE "LeaveTypeLimitPeriod" AS ENUM ('YEAR', 'WEEK', 'LIFETIME');

-- CreateEnum
CREATE TYPE "LeaveTypeGenderRule" AS ENUM ('ANY', 'MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "LeaveCreditSource" AS ENUM ('MANUAL', 'HOLIDAY_WORK');

-- AlterTable
ALTER TABLE "LeaveType" ADD COLUMN     "carryForwardLimit" INTEGER,
ADD COLUMN     "eligibilityGender" "LeaveTypeGenderRule" NOT NULL DEFAULT 'ANY',
ADD COLUMN     "encashAfterLimit" INTEGER,
ADD COLUMN     "limitPeriod" "LeaveTypeLimitPeriod" NOT NULL DEFAULT 'YEAR',
ADD COLUMN     "paidDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "prorateOnTenure" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "proratePeriodMonths" INTEGER NOT NULL DEFAULT 12,
ADD COLUMN     "requiresSubstituteCredit" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "TeacherLeaveCredit" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "leaveTypeId" TEXT NOT NULL,
    "days" INTEGER NOT NULL,
    "source" "LeaveCreditSource" NOT NULL DEFAULT 'MANUAL',
    "description" TEXT,
    "creditedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "TeacherLeaveCredit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeacherLeaveCredit_teacherId_idx" ON "TeacherLeaveCredit"("teacherId");

-- CreateIndex
CREATE INDEX "TeacherLeaveCredit_leaveTypeId_idx" ON "TeacherLeaveCredit"("leaveTypeId");

-- CreateIndex
CREATE INDEX "TeacherLeaveCredit_source_idx" ON "TeacherLeaveCredit"("source");

-- CreateIndex
CREATE INDEX "TeacherLeaveCredit_creditedAt_idx" ON "TeacherLeaveCredit"("creditedAt");

-- CreateIndex
CREATE INDEX "TeacherLeaveCredit_expiresAt_idx" ON "TeacherLeaveCredit"("expiresAt");

-- CreateIndex
CREATE INDEX "TeacherLeaveCredit_createdById_idx" ON "TeacherLeaveCredit"("createdById");

-- CreateIndex
CREATE INDEX "TeacherLeaveCredit_updatedById_idx" ON "TeacherLeaveCredit"("updatedById");

-- CreateIndex
CREATE INDEX "TeacherLeaveCredit_deletedAt_idx" ON "TeacherLeaveCredit"("deletedAt");

-- AddForeignKey
ALTER TABLE "TeacherLeaveCredit" ADD CONSTRAINT "TeacherLeaveCredit_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherLeaveCredit" ADD CONSTRAINT "TeacherLeaveCredit_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "LeaveType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherLeaveCredit" ADD CONSTRAINT "TeacherLeaveCredit_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherLeaveCredit" ADD CONSTRAINT "TeacherLeaveCredit_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
