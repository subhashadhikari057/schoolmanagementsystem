-- CreateEnum
CREATE TYPE "public"."NoticePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."NoticeRecipientType" AS ENUM ('ALL', 'STUDENT', 'PARENT', 'TEACHER', 'STAFF', 'CLASS');

-- CreateEnum
CREATE TYPE "public"."NoticeCategory" AS ENUM ('GENERAL', 'ACADEMIC', 'EXAMINATION', 'FEE', 'EVENT', 'HOLIDAY', 'MEETING', 'ANNOUNCEMENT', 'URGENT', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."NoticeStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED', 'EXPIRED');

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
