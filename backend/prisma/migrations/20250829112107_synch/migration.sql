-- AlterTable
ALTER TABLE "public"."Submission" ADD COLUMN     "studentNotes" TEXT;

-- CreateTable
CREATE TABLE "public"."AssignmentAttachment" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssignmentAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SubmissionAttachment" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubmissionAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AssignmentAttachment_assignmentId_idx" ON "public"."AssignmentAttachment"("assignmentId");

-- CreateIndex
CREATE INDEX "AssignmentAttachment_mimeType_idx" ON "public"."AssignmentAttachment"("mimeType");

-- CreateIndex
CREATE INDEX "AssignmentAttachment_size_idx" ON "public"."AssignmentAttachment"("size");

-- CreateIndex
CREATE INDEX "SubmissionAttachment_submissionId_idx" ON "public"."SubmissionAttachment"("submissionId");

-- CreateIndex
CREATE INDEX "SubmissionAttachment_mimeType_idx" ON "public"."SubmissionAttachment"("mimeType");

-- CreateIndex
CREATE INDEX "SubmissionAttachment_size_idx" ON "public"."SubmissionAttachment"("size");

-- AddForeignKey
ALTER TABLE "public"."AssignmentAttachment" ADD CONSTRAINT "AssignmentAttachment_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "public"."Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."SubmissionAttachment" ADD CONSTRAINT "SubmissionAttachment_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "public"."Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
