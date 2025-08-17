-- CreateTable
CREATE TABLE "public"."Assignment" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "additionalMetadata" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    "deletedById" UUID,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Submission" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "feedback" TEXT,
    "fileLinks" JSONB DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    "deletedById" UUID,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Assignment_classId_idx" ON "public"."Assignment"("classId");

-- CreateIndex
CREATE INDEX "Assignment_subjectId_idx" ON "public"."Assignment"("subjectId");

-- CreateIndex
CREATE INDEX "Assignment_teacherId_idx" ON "public"."Assignment"("teacherId");

-- CreateIndex
CREATE INDEX "Assignment_dueDate_idx" ON "public"."Assignment"("dueDate");

-- CreateIndex
CREATE INDEX "Assignment_createdById_idx" ON "public"."Assignment"("createdById");

-- CreateIndex
CREATE INDEX "Assignment_updatedById_idx" ON "public"."Assignment"("updatedById");

-- CreateIndex
CREATE INDEX "Assignment_deletedById_idx" ON "public"."Assignment"("deletedById");

-- CreateIndex
CREATE INDEX "Submission_assignmentId_idx" ON "public"."Submission"("assignmentId");

-- CreateIndex
CREATE INDEX "Submission_studentId_idx" ON "public"."Submission"("studentId");

-- CreateIndex
CREATE INDEX "Submission_isCompleted_idx" ON "public"."Submission"("isCompleted");

-- CreateIndex
CREATE INDEX "Submission_createdById_idx" ON "public"."Submission"("createdById");

-- CreateIndex
CREATE INDEX "Submission_updatedById_idx" ON "public"."Submission"("updatedById");

-- CreateIndex
CREATE INDEX "Submission_deletedById_idx" ON "public"."Submission"("deletedById");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_assignmentId_studentId_key" ON "public"."Submission"("assignmentId", "studentId");

-- AddForeignKey
ALTER TABLE "public"."Assignment" ADD CONSTRAINT "Assignment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Assignment" ADD CONSTRAINT "Assignment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Assignment" ADD CONSTRAINT "Assignment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "public"."Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Submission" ADD CONSTRAINT "Submission_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "public"."Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Submission" ADD CONSTRAINT "Submission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
