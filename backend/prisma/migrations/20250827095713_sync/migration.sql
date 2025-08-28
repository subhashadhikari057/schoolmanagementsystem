/*
  Warnings:

  - The values [VISITOR,GUEST] on the enum `IDCardTemplateType` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."LeaveRequestStatus" AS ENUM ('PENDING_PARENT_APPROVAL', 'PENDING_TEACHER_APPROVAL', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."LeaveRequestType" AS ENUM ('SICK', 'PERSONAL', 'VACATION', 'EMERGENCY', 'MEDICAL', 'FAMILY');

-- CreateEnum
CREATE TYPE "public"."LeaveTypeStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "public"."TeacherLeaveRequestStatus" AS ENUM ('PENDING_ADMINISTRATION', 'APPROVED', 'REJECTED', 'CANCELLED');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."IDCardTemplateType_new" AS ENUM ('STUDENT', 'TEACHER', 'STAFF', 'STAFF_NO_LOGIN');
ALTER TABLE "public"."IDCardTemplate" ALTER COLUMN "type" TYPE "public"."IDCardTemplateType_new" USING ("type"::text::"public"."IDCardTemplateType_new");
ALTER TYPE "public"."IDCardTemplateType" RENAME TO "IDCardTemplateType_old";
ALTER TYPE "public"."IDCardTemplateType_new" RENAME TO "IDCardTemplateType";
DROP TYPE "public"."IDCardTemplateType_old";
COMMIT;

-- CreateTable
CREATE TABLE "public"."LeaveType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "maxDays" INTEGER NOT NULL DEFAULT 1,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "status" "public"."LeaveTypeStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedById" TEXT,

    CONSTRAINT "LeaveType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LeaveRequest" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "public"."LeaveRequestType" NOT NULL,
    "status" "public"."LeaveRequestStatus" NOT NULL DEFAULT 'PENDING_PARENT_APPROVAL',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "days" INTEGER NOT NULL,
    "studentId" TEXT NOT NULL,
    "parentId" TEXT,
    "teacherId" TEXT,
    "parentApprovedAt" TIMESTAMP(3),
    "teacherApprovedAt" TIMESTAMP(3),
    "parentRejectedAt" TIMESTAMP(3),
    "teacherRejectedAt" TIMESTAMP(3),
    "parentRejectionReason" TEXT,
    "teacherRejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedById" TEXT,

    CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LeaveRequestAttachment" (
    "id" TEXT NOT NULL,
    "leaveRequestId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaveRequestAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LeaveRequestAuditLog" (
    "id" TEXT NOT NULL,
    "leaveRequestId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "performedBy" TEXT,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeaveRequestAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TeacherLeaveRequest" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "leaveTypeId" TEXT NOT NULL,
    "status" "public"."TeacherLeaveRequestStatus" NOT NULL DEFAULT 'PENDING_ADMINISTRATION',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "days" INTEGER NOT NULL,
    "teacherId" TEXT NOT NULL,
    "adminId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedById" TEXT,

    CONSTRAINT "TeacherLeaveRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TeacherLeaveRequestAttachment" (
    "id" TEXT NOT NULL,
    "teacherLeaveRequestId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "teacherId" TEXT NOT NULL,

    CONSTRAINT "TeacherLeaveRequestAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TeacherLeaveRequestAuditLog" (
    "id" TEXT NOT NULL,
    "teacherLeaveRequestId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "performedBy" TEXT,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeacherLeaveRequestAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TeacherLeaveUsage" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "leaveTypeId" TEXT NOT NULL,
    "totalDaysUsed" INTEGER NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedById" TEXT,

    CONSTRAINT "TeacherLeaveUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LeaveType_name_key" ON "public"."LeaveType"("name");

-- CreateIndex
CREATE INDEX "LeaveType_name_idx" ON "public"."LeaveType"("name");

-- CreateIndex
CREATE INDEX "LeaveType_status_idx" ON "public"."LeaveType"("status");

-- CreateIndex
CREATE INDEX "LeaveType_isPaid_idx" ON "public"."LeaveType"("isPaid");

-- CreateIndex
CREATE INDEX "LeaveType_createdAt_idx" ON "public"."LeaveType"("createdAt");

-- CreateIndex
CREATE INDEX "LeaveType_createdById_idx" ON "public"."LeaveType"("createdById");

-- CreateIndex
CREATE INDEX "LeaveType_updatedById_idx" ON "public"."LeaveType"("updatedById");

-- CreateIndex
CREATE INDEX "LeaveType_deletedById_idx" ON "public"."LeaveType"("deletedById");

-- CreateIndex
CREATE INDEX "LeaveRequest_studentId_idx" ON "public"."LeaveRequest"("studentId");

-- CreateIndex
CREATE INDEX "LeaveRequest_parentId_idx" ON "public"."LeaveRequest"("parentId");

-- CreateIndex
CREATE INDEX "LeaveRequest_teacherId_idx" ON "public"."LeaveRequest"("teacherId");

-- CreateIndex
CREATE INDEX "LeaveRequest_type_idx" ON "public"."LeaveRequest"("type");

-- CreateIndex
CREATE INDEX "LeaveRequest_status_idx" ON "public"."LeaveRequest"("status");

-- CreateIndex
CREATE INDEX "LeaveRequest_startDate_idx" ON "public"."LeaveRequest"("startDate");

-- CreateIndex
CREATE INDEX "LeaveRequest_endDate_idx" ON "public"."LeaveRequest"("endDate");

-- CreateIndex
CREATE INDEX "LeaveRequest_createdAt_idx" ON "public"."LeaveRequest"("createdAt");

-- CreateIndex
CREATE INDEX "LeaveRequest_createdById_idx" ON "public"."LeaveRequest"("createdById");

-- CreateIndex
CREATE INDEX "LeaveRequest_updatedById_idx" ON "public"."LeaveRequest"("updatedById");

-- CreateIndex
CREATE INDEX "LeaveRequest_deletedById_idx" ON "public"."LeaveRequest"("deletedById");

-- CreateIndex
CREATE INDEX "LeaveRequestAttachment_leaveRequestId_idx" ON "public"."LeaveRequestAttachment"("leaveRequestId");

-- CreateIndex
CREATE INDEX "LeaveRequestAttachment_mimeType_idx" ON "public"."LeaveRequestAttachment"("mimeType");

-- CreateIndex
CREATE INDEX "LeaveRequestAttachment_size_idx" ON "public"."LeaveRequestAttachment"("size");

-- CreateIndex
CREATE INDEX "LeaveRequestAuditLog_leaveRequestId_idx" ON "public"."LeaveRequestAuditLog"("leaveRequestId");

-- CreateIndex
CREATE INDEX "LeaveRequestAuditLog_action_idx" ON "public"."LeaveRequestAuditLog"("action");

-- CreateIndex
CREATE INDEX "LeaveRequestAuditLog_performedBy_idx" ON "public"."LeaveRequestAuditLog"("performedBy");

-- CreateIndex
CREATE INDEX "LeaveRequestAuditLog_performedAt_idx" ON "public"."LeaveRequestAuditLog"("performedAt");

-- CreateIndex
CREATE INDEX "TeacherLeaveRequest_teacherId_idx" ON "public"."TeacherLeaveRequest"("teacherId");

-- CreateIndex
CREATE INDEX "TeacherLeaveRequest_leaveTypeId_idx" ON "public"."TeacherLeaveRequest"("leaveTypeId");

-- CreateIndex
CREATE INDEX "TeacherLeaveRequest_adminId_idx" ON "public"."TeacherLeaveRequest"("adminId");

-- CreateIndex
CREATE INDEX "TeacherLeaveRequest_status_idx" ON "public"."TeacherLeaveRequest"("status");

-- CreateIndex
CREATE INDEX "TeacherLeaveRequest_startDate_idx" ON "public"."TeacherLeaveRequest"("startDate");

-- CreateIndex
CREATE INDEX "TeacherLeaveRequest_endDate_idx" ON "public"."TeacherLeaveRequest"("endDate");

-- CreateIndex
CREATE INDEX "TeacherLeaveRequest_createdAt_idx" ON "public"."TeacherLeaveRequest"("createdAt");

-- CreateIndex
CREATE INDEX "TeacherLeaveRequest_createdById_idx" ON "public"."TeacherLeaveRequest"("createdById");

-- CreateIndex
CREATE INDEX "TeacherLeaveRequest_updatedById_idx" ON "public"."TeacherLeaveRequest"("updatedById");

-- CreateIndex
CREATE INDEX "TeacherLeaveRequest_deletedById_idx" ON "public"."TeacherLeaveRequest"("deletedById");

-- CreateIndex
CREATE INDEX "TeacherLeaveRequestAttachment_teacherLeaveRequestId_idx" ON "public"."TeacherLeaveRequestAttachment"("teacherLeaveRequestId");

-- CreateIndex
CREATE INDEX "TeacherLeaveRequestAttachment_teacherId_idx" ON "public"."TeacherLeaveRequestAttachment"("teacherId");

-- CreateIndex
CREATE INDEX "TeacherLeaveRequestAttachment_mimeType_idx" ON "public"."TeacherLeaveRequestAttachment"("mimeType");

-- CreateIndex
CREATE INDEX "TeacherLeaveRequestAttachment_size_idx" ON "public"."TeacherLeaveRequestAttachment"("size");

-- CreateIndex
CREATE INDEX "TeacherLeaveRequestAuditLog_teacherLeaveRequestId_idx" ON "public"."TeacherLeaveRequestAuditLog"("teacherLeaveRequestId");

-- CreateIndex
CREATE INDEX "TeacherLeaveRequestAuditLog_action_idx" ON "public"."TeacherLeaveRequestAuditLog"("action");

-- CreateIndex
CREATE INDEX "TeacherLeaveRequestAuditLog_performedBy_idx" ON "public"."TeacherLeaveRequestAuditLog"("performedBy");

-- CreateIndex
CREATE INDEX "TeacherLeaveRequestAuditLog_performedAt_idx" ON "public"."TeacherLeaveRequestAuditLog"("performedAt");

-- CreateIndex
CREATE INDEX "TeacherLeaveUsage_teacherId_idx" ON "public"."TeacherLeaveUsage"("teacherId");

-- CreateIndex
CREATE INDEX "TeacherLeaveUsage_leaveTypeId_idx" ON "public"."TeacherLeaveUsage"("leaveTypeId");

-- CreateIndex
CREATE INDEX "TeacherLeaveUsage_createdById_idx" ON "public"."TeacherLeaveUsage"("createdById");

-- CreateIndex
CREATE INDEX "TeacherLeaveUsage_updatedById_idx" ON "public"."TeacherLeaveUsage"("updatedById");

-- CreateIndex
CREATE INDEX "TeacherLeaveUsage_deletedById_idx" ON "public"."TeacherLeaveUsage"("deletedById");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherLeaveUsage_teacherId_leaveTypeId_deletedAt_key" ON "public"."TeacherLeaveUsage"("teacherId", "leaveTypeId", "deletedAt");

-- AddForeignKey
ALTER TABLE "public"."LeaveType" ADD CONSTRAINT "LeaveType_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeaveType" ADD CONSTRAINT "LeaveType_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeaveType" ADD CONSTRAINT "LeaveType_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeaveRequest" ADD CONSTRAINT "LeaveRequest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeaveRequest" ADD CONSTRAINT "LeaveRequest_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."Parent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeaveRequest" ADD CONSTRAINT "LeaveRequest_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "public"."Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeaveRequest" ADD CONSTRAINT "LeaveRequest_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeaveRequest" ADD CONSTRAINT "LeaveRequest_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeaveRequest" ADD CONSTRAINT "LeaveRequest_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeaveRequestAttachment" ADD CONSTRAINT "LeaveRequestAttachment_leaveRequestId_fkey" FOREIGN KEY ("leaveRequestId") REFERENCES "public"."LeaveRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeaveRequestAuditLog" ADD CONSTRAINT "LeaveRequestAuditLog_leaveRequestId_fkey" FOREIGN KEY ("leaveRequestId") REFERENCES "public"."LeaveRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."LeaveRequestAuditLog" ADD CONSTRAINT "LeaveRequestAuditLog_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeacherLeaveRequest" ADD CONSTRAINT "TeacherLeaveRequest_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "public"."Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeacherLeaveRequest" ADD CONSTRAINT "TeacherLeaveRequest_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "public"."LeaveType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeacherLeaveRequest" ADD CONSTRAINT "TeacherLeaveRequest_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeacherLeaveRequest" ADD CONSTRAINT "TeacherLeaveRequest_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeacherLeaveRequest" ADD CONSTRAINT "TeacherLeaveRequest_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeacherLeaveRequest" ADD CONSTRAINT "TeacherLeaveRequest_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeacherLeaveRequestAttachment" ADD CONSTRAINT "TeacherLeaveRequestAttachment_teacherLeaveRequestId_fkey" FOREIGN KEY ("teacherLeaveRequestId") REFERENCES "public"."TeacherLeaveRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeacherLeaveRequestAttachment" ADD CONSTRAINT "TeacherLeaveRequestAttachment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "public"."Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeacherLeaveRequestAuditLog" ADD CONSTRAINT "TeacherLeaveRequestAuditLog_teacherLeaveRequestId_fkey" FOREIGN KEY ("teacherLeaveRequestId") REFERENCES "public"."TeacherLeaveRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeacherLeaveRequestAuditLog" ADD CONSTRAINT "TeacherLeaveRequestAuditLog_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeacherLeaveUsage" ADD CONSTRAINT "TeacherLeaveUsage_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "public"."Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeacherLeaveUsage" ADD CONSTRAINT "TeacherLeaveUsage_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES "public"."LeaveType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeacherLeaveUsage" ADD CONSTRAINT "TeacherLeaveUsage_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeacherLeaveUsage" ADD CONSTRAINT "TeacherLeaveUsage_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TeacherLeaveUsage" ADD CONSTRAINT "TeacherLeaveUsage_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
