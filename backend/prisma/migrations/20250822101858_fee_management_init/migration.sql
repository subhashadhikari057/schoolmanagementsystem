-- CreateEnum
CREATE TYPE "public"."NoticePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."NoticeRecipientType" AS ENUM ('ALL', 'STUDENT', 'PARENT', 'TEACHER', 'STAFF', 'CLASS');

-- CreateEnum
CREATE TYPE "public"."NoticeCategory" AS ENUM ('GENERAL', 'ACADEMIC', 'EXAMINATION', 'FEE', 'EVENT', 'HOLIDAY', 'MEETING', 'ANNOUNCEMENT', 'URGENT', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."NoticeStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "public"."FeeItemFrequency" AS ENUM ('MONTHLY', 'TERM', 'ANNUAL', 'ONE_TIME');

-- CreateEnum
CREATE TYPE "public"."FeeStructureStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."ScholarshipType" AS ENUM ('CLASS_BASED', 'EXAM_BASED', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ValueType" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateEnum
CREATE TYPE "public"."ChargeType" AS ENUM ('FINE', 'DUE');

-- CreateTable
CREATE TABLE "public"."Notice" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "priority" "public"."NoticePriority" NOT NULL,
    "recipientType" "public"."NoticeRecipientType" NOT NULL,
    "selectedClassId" TEXT,
    "category" "public"."NoticeCategory",
    "publishDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "status" "public"."NoticeStatus" NOT NULL DEFAULT 'DRAFT',
    "sendEmailNotification" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedById" TEXT,

    CONSTRAINT "Notice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NoticeRecipient" (
    "id" TEXT NOT NULL,
    "noticeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NoticeRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."NoticeAttachment" (
    "id" TEXT NOT NULL,
    "noticeId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NoticeAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FeeStructure" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "public"."FeeStructureStatus" NOT NULL DEFAULT 'DRAFT',
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    "deletedById" UUID,

    CONSTRAINT "FeeStructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FeeStructureItem" (
    "id" TEXT NOT NULL,
    "feeStructureId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "frequency" "public"."FeeItemFrequency" NOT NULL DEFAULT 'MONTHLY',
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    "deletedById" UUID,

    CONSTRAINT "FeeStructureItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."FeeStructureHistory" (
    "id" TEXT NOT NULL,
    "feeStructureId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "effectiveFrom" DATE NOT NULL,
    "totalAnnual" DECIMAL(12,2) NOT NULL,
    "snapshot" JSONB NOT NULL,
    "changeReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" UUID,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "FeeStructureHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ScholarshipDefinition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."ScholarshipType" NOT NULL DEFAULT 'OTHER',
    "description" TEXT,
    "valueType" "public"."ValueType" NOT NULL DEFAULT 'PERCENTAGE',
    "value" DECIMAL(10,2) NOT NULL,
    "appliesToCategory" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    "deletedById" UUID,

    CONSTRAINT "ScholarshipDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ScholarshipAssignment" (
    "id" TEXT NOT NULL,
    "scholarshipId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "effectiveFrom" DATE NOT NULL,
    "expiresAt" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" UUID,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ScholarshipAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChargeDefinition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "public"."ChargeType" NOT NULL DEFAULT 'FINE',
    "category" TEXT,
    "description" TEXT,
    "valueType" "public"."ValueType" NOT NULL DEFAULT 'FIXED',
    "value" DECIMAL(10,2) NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    "deletedById" UUID,

    CONSTRAINT "ChargeDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ChargeAssignment" (
    "id" TEXT NOT NULL,
    "chargeId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "appliedMonth" DATE NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" UUID,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ChargeAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StudentFeeHistory" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "feeStructureId" TEXT,
    "periodMonth" DATE NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "baseAmount" DECIMAL(12,2) NOT NULL,
    "scholarshipAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "extraChargesAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "finalPayable" DECIMAL(12,2) NOT NULL,
    "breakdown" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" UUID,

    CONSTRAINT "StudentFeeHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notice_recipientType_idx" ON "public"."Notice"("recipientType");

-- CreateIndex
CREATE INDEX "Notice_priority_idx" ON "public"."Notice"("priority");

-- CreateIndex
CREATE INDEX "Notice_category_idx" ON "public"."Notice"("category");

-- CreateIndex
CREATE INDEX "Notice_status_idx" ON "public"."Notice"("status");

-- CreateIndex
CREATE INDEX "Notice_publishDate_idx" ON "public"."Notice"("publishDate");

-- CreateIndex
CREATE INDEX "Notice_expiryDate_idx" ON "public"."Notice"("expiryDate");

-- CreateIndex
CREATE INDEX "Notice_selectedClassId_idx" ON "public"."Notice"("selectedClassId");

-- CreateIndex
CREATE INDEX "Notice_createdById_idx" ON "public"."Notice"("createdById");

-- CreateIndex
CREATE INDEX "Notice_updatedById_idx" ON "public"."Notice"("updatedById");

-- CreateIndex
CREATE INDEX "Notice_deletedById_idx" ON "public"."Notice"("deletedById");

-- CreateIndex
CREATE INDEX "NoticeRecipient_noticeId_idx" ON "public"."NoticeRecipient"("noticeId");

-- CreateIndex
CREATE INDEX "NoticeRecipient_userId_idx" ON "public"."NoticeRecipient"("userId");

-- CreateIndex
CREATE INDEX "NoticeRecipient_readAt_idx" ON "public"."NoticeRecipient"("readAt");

-- CreateIndex
CREATE UNIQUE INDEX "NoticeRecipient_noticeId_userId_key" ON "public"."NoticeRecipient"("noticeId", "userId");

-- CreateIndex
CREATE INDEX "NoticeAttachment_noticeId_idx" ON "public"."NoticeAttachment"("noticeId");

-- CreateIndex
CREATE INDEX "NoticeAttachment_mimeType_idx" ON "public"."NoticeAttachment"("mimeType");

-- CreateIndex
CREATE INDEX "FeeStructure_classId_idx" ON "public"."FeeStructure"("classId");

-- CreateIndex
CREATE INDEX "FeeStructure_academicYear_idx" ON "public"."FeeStructure"("academicYear");

-- CreateIndex
CREATE INDEX "FeeStructure_status_idx" ON "public"."FeeStructure"("status");

-- CreateIndex
CREATE INDEX "FeeStructure_effectiveFrom_idx" ON "public"."FeeStructure"("effectiveFrom");

-- CreateIndex
CREATE INDEX "FeeStructure_createdById_idx" ON "public"."FeeStructure"("createdById");

-- CreateIndex
CREATE INDEX "FeeStructure_updatedById_idx" ON "public"."FeeStructure"("updatedById");

-- CreateIndex
CREATE INDEX "FeeStructure_deletedById_idx" ON "public"."FeeStructure"("deletedById");

-- CreateIndex
CREATE INDEX "FeeStructureItem_feeStructureId_idx" ON "public"."FeeStructureItem"("feeStructureId");

-- CreateIndex
CREATE INDEX "FeeStructureItem_category_idx" ON "public"."FeeStructureItem"("category");

-- CreateIndex
CREATE INDEX "FeeStructureItem_frequency_idx" ON "public"."FeeStructureItem"("frequency");

-- CreateIndex
CREATE INDEX "FeeStructureHistory_feeStructureId_idx" ON "public"."FeeStructureHistory"("feeStructureId");

-- CreateIndex
CREATE INDEX "FeeStructureHistory_effectiveFrom_idx" ON "public"."FeeStructureHistory"("effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "FeeStructureHistory_feeStructureId_version_key" ON "public"."FeeStructureHistory"("feeStructureId", "version");

-- CreateIndex
CREATE INDEX "ScholarshipDefinition_type_idx" ON "public"."ScholarshipDefinition"("type");

-- CreateIndex
CREATE INDEX "ScholarshipDefinition_isActive_idx" ON "public"."ScholarshipDefinition"("isActive");

-- CreateIndex
CREATE INDEX "ScholarshipAssignment_scholarshipId_idx" ON "public"."ScholarshipAssignment"("scholarshipId");

-- CreateIndex
CREATE INDEX "ScholarshipAssignment_studentId_idx" ON "public"."ScholarshipAssignment"("studentId");

-- CreateIndex
CREATE INDEX "ScholarshipAssignment_effectiveFrom_idx" ON "public"."ScholarshipAssignment"("effectiveFrom");

-- CreateIndex
CREATE INDEX "ChargeDefinition_type_idx" ON "public"."ChargeDefinition"("type");

-- CreateIndex
CREATE INDEX "ChargeDefinition_isActive_idx" ON "public"."ChargeDefinition"("isActive");

-- CreateIndex
CREATE INDEX "ChargeAssignment_chargeId_idx" ON "public"."ChargeAssignment"("chargeId");

-- CreateIndex
CREATE INDEX "ChargeAssignment_studentId_idx" ON "public"."ChargeAssignment"("studentId");

-- CreateIndex
CREATE INDEX "ChargeAssignment_appliedMonth_idx" ON "public"."ChargeAssignment"("appliedMonth");

-- CreateIndex
CREATE INDEX "StudentFeeHistory_studentId_idx" ON "public"."StudentFeeHistory"("studentId");

-- CreateIndex
CREATE INDEX "StudentFeeHistory_feeStructureId_idx" ON "public"."StudentFeeHistory"("feeStructureId");

-- CreateIndex
CREATE INDEX "StudentFeeHistory_periodMonth_idx" ON "public"."StudentFeeHistory"("periodMonth");

-- CreateIndex
CREATE UNIQUE INDEX "StudentFeeHistory_studentId_periodMonth_version_key" ON "public"."StudentFeeHistory"("studentId", "periodMonth", "version");

-- AddForeignKey
ALTER TABLE "public"."Notice" ADD CONSTRAINT "Notice_selectedClassId_fkey" FOREIGN KEY ("selectedClassId") REFERENCES "public"."Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notice" ADD CONSTRAINT "Notice_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notice" ADD CONSTRAINT "Notice_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notice" ADD CONSTRAINT "Notice_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NoticeRecipient" ADD CONSTRAINT "NoticeRecipient_noticeId_fkey" FOREIGN KEY ("noticeId") REFERENCES "public"."Notice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NoticeRecipient" ADD CONSTRAINT "NoticeRecipient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."NoticeAttachment" ADD CONSTRAINT "NoticeAttachment_noticeId_fkey" FOREIGN KEY ("noticeId") REFERENCES "public"."Notice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FeeStructure" ADD CONSTRAINT "FeeStructure_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FeeStructureItem" ADD CONSTRAINT "FeeStructureItem_feeStructureId_fkey" FOREIGN KEY ("feeStructureId") REFERENCES "public"."FeeStructure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."FeeStructureHistory" ADD CONSTRAINT "FeeStructureHistory_feeStructureId_fkey" FOREIGN KEY ("feeStructureId") REFERENCES "public"."FeeStructure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScholarshipAssignment" ADD CONSTRAINT "ScholarshipAssignment_scholarshipId_fkey" FOREIGN KEY ("scholarshipId") REFERENCES "public"."ScholarshipDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ScholarshipAssignment" ADD CONSTRAINT "ScholarshipAssignment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChargeAssignment" ADD CONSTRAINT "ChargeAssignment_chargeId_fkey" FOREIGN KEY ("chargeId") REFERENCES "public"."ChargeDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ChargeAssignment" ADD CONSTRAINT "ChargeAssignment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentFeeHistory" ADD CONSTRAINT "StudentFeeHistory_feeStructureId_fkey" FOREIGN KEY ("feeStructureId") REFERENCES "public"."FeeStructure"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentFeeHistory" ADD CONSTRAINT "StudentFeeHistory_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
