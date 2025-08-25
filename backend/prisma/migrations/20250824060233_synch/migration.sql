-- CreateEnum
CREATE TYPE "public"."ComplaintType" AS ENUM ('ACADEMIC', 'BEHAVIORAL', 'FACILITY', 'SAFETY', 'BULLYING', 'DISCIPLINARY', 'FINANCIAL', 'ADMINISTRATIVE', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ComplaintStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "public"."ComplaintPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."ComplaintRecipientType" AS ENUM ('CLASS_TEACHER', 'ADMINISTRATION', 'PARENT');

-- CreateTable
CREATE TABLE "public"."Complaint" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "public"."ComplaintType" NOT NULL,
    "priority" "public"."ComplaintPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "public"."ComplaintStatus" NOT NULL DEFAULT 'OPEN',
    "recipientType" "public"."ComplaintRecipientType" NOT NULL,
    "recipientId" TEXT,
    "complainantId" TEXT NOT NULL,
    "complainantType" TEXT NOT NULL,
    "assignedToId" TEXT,
    "assignedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedById" TEXT,

    CONSTRAINT "Complaint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ComplaintResponse" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "responderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "ComplaintResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ComplaintAttachment" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplaintAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ComplaintAuditLog" (
    "id" TEXT NOT NULL,
    "complaintId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "performedBy" TEXT,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComplaintAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Complaint_complainantId_idx" ON "public"."Complaint"("complainantId");

-- CreateIndex
CREATE INDEX "Complaint_recipientId_idx" ON "public"."Complaint"("recipientId");

-- CreateIndex
CREATE INDEX "Complaint_assignedToId_idx" ON "public"."Complaint"("assignedToId");

-- CreateIndex
CREATE INDEX "Complaint_type_idx" ON "public"."Complaint"("type");

-- CreateIndex
CREATE INDEX "Complaint_status_idx" ON "public"."Complaint"("status");

-- CreateIndex
CREATE INDEX "Complaint_priority_idx" ON "public"."Complaint"("priority");

-- CreateIndex
CREATE INDEX "Complaint_recipientType_idx" ON "public"."Complaint"("recipientType");

-- CreateIndex
CREATE INDEX "Complaint_createdAt_idx" ON "public"."Complaint"("createdAt");

-- CreateIndex
CREATE INDEX "Complaint_createdById_idx" ON "public"."Complaint"("createdById");

-- CreateIndex
CREATE INDEX "Complaint_updatedById_idx" ON "public"."Complaint"("updatedById");

-- CreateIndex
CREATE INDEX "Complaint_deletedById_idx" ON "public"."Complaint"("deletedById");

-- CreateIndex
CREATE INDEX "ComplaintResponse_complaintId_idx" ON "public"."ComplaintResponse"("complaintId");

-- CreateIndex
CREATE INDEX "ComplaintResponse_responderId_idx" ON "public"."ComplaintResponse"("responderId");

-- CreateIndex
CREATE INDEX "ComplaintResponse_createdAt_idx" ON "public"."ComplaintResponse"("createdAt");

-- CreateIndex
CREATE INDEX "ComplaintAttachment_complaintId_idx" ON "public"."ComplaintAttachment"("complaintId");

-- CreateIndex
CREATE INDEX "ComplaintAttachment_mimeType_idx" ON "public"."ComplaintAttachment"("mimeType");

-- CreateIndex
CREATE INDEX "ComplaintAuditLog_complaintId_idx" ON "public"."ComplaintAuditLog"("complaintId");

-- CreateIndex
CREATE INDEX "ComplaintAuditLog_action_idx" ON "public"."ComplaintAuditLog"("action");

-- CreateIndex
CREATE INDEX "ComplaintAuditLog_performedBy_idx" ON "public"."ComplaintAuditLog"("performedBy");

-- CreateIndex
CREATE INDEX "ComplaintAuditLog_performedAt_idx" ON "public"."ComplaintAuditLog"("performedAt");

-- AddForeignKey
ALTER TABLE "public"."Complaint" ADD CONSTRAINT "Complaint_complainantId_fkey" FOREIGN KEY ("complainantId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Complaint" ADD CONSTRAINT "Complaint_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Complaint" ADD CONSTRAINT "Complaint_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Complaint" ADD CONSTRAINT "Complaint_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Complaint" ADD CONSTRAINT "Complaint_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Complaint" ADD CONSTRAINT "Complaint_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ComplaintResponse" ADD CONSTRAINT "ComplaintResponse_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "public"."Complaint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ComplaintResponse" ADD CONSTRAINT "ComplaintResponse_responderId_fkey" FOREIGN KEY ("responderId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ComplaintAttachment" ADD CONSTRAINT "ComplaintAttachment_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "public"."Complaint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ComplaintAuditLog" ADD CONSTRAINT "ComplaintAuditLog_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "public"."Complaint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ComplaintAuditLog" ADD CONSTRAINT "ComplaintAuditLog_performedBy_fkey" FOREIGN KEY ("performedBy") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
