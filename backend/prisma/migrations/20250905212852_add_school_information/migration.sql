-- CreateEnum
CREATE TYPE "public"."ExamResultStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'PUBLISHED', 'LOCKED');

-- AlterTable
ALTER TABLE "public"."Staff" ADD COLUMN     "qualification" TEXT;

-- CreateTable
CREATE TABLE "public"."PasswordResetOtp" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "otpHash" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "deliveryMethod" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetOtp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GradingScale" (
    "id" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    "deletedById" UUID,

    CONSTRAINT "GradingScale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GradeDefinition" (
    "id" TEXT NOT NULL,
    "gradingScaleId" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "minMarks" DECIMAL(5,2) NOT NULL,
    "maxMarks" DECIMAL(5,2) NOT NULL,
    "gradePoint" DECIMAL(3,2),
    "description" TEXT,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    "deletedById" UUID,

    CONSTRAINT "GradeDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ExamResult" (
    "id" TEXT NOT NULL,
    "examSlotId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "marksObtained" DECIMAL(5,2),
    "gradeId" TEXT,
    "remarks" TEXT,
    "isAbsent" BOOLEAN NOT NULL DEFAULT false,
    "isPassed" BOOLEAN NOT NULL DEFAULT false,
    "status" "public"."ExamResultStatus" NOT NULL DEFAULT 'DRAFT',
    "gradedAt" TIMESTAMP(3),
    "gradedById" TEXT,
    "lastModifiedAt" TIMESTAMP(3),
    "lastModifiedById" TEXT,
    "modificationHistory" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedById" TEXT,

    CONSTRAINT "ExamResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GradingPermission" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "canGrade" BOOLEAN NOT NULL DEFAULT true,
    "canModify" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    "deletedById" UUID,

    CONSTRAINT "GradingPermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StudentGradeHistory" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "examResultId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "examSlotId" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "examType" TEXT NOT NULL,
    "examName" TEXT NOT NULL,
    "examDate" DATE NOT NULL,
    "marksObtained" DECIMAL(5,2),
    "maxMarks" DECIMAL(5,2) NOT NULL,
    "passMarks" DECIMAL(5,2) NOT NULL,
    "percentage" DECIMAL(5,2),
    "gradeObtained" TEXT,
    "gradePoint" DECIMAL(3,2),
    "isPassed" BOOLEAN NOT NULL DEFAULT false,
    "isAbsent" BOOLEAN NOT NULL DEFAULT false,
    "remarks" TEXT,
    "gradedAt" TIMESTAMP(3),
    "gradedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,
    "deletedById" UUID,

    CONSTRAINT "StudentGradeHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."school_information" (
    "id" TEXT NOT NULL,
    "schoolName" TEXT NOT NULL,
    "schoolCode" TEXT NOT NULL,
    "establishedYear" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),
    "createdById" UUID,
    "updatedById" UUID,

    CONSTRAINT "school_information_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PasswordResetOtp_userId_idx" ON "public"."PasswordResetOtp"("userId");

-- CreateIndex
CREATE INDEX "PasswordResetOtp_identifier_idx" ON "public"."PasswordResetOtp"("identifier");

-- CreateIndex
CREATE INDEX "PasswordResetOtp_expiresAt_idx" ON "public"."PasswordResetOtp"("expiresAt");

-- CreateIndex
CREATE INDEX "PasswordResetOtp_isUsed_idx" ON "public"."PasswordResetOtp"("isUsed");

-- CreateIndex
CREATE INDEX "GradingScale_academicYear_idx" ON "public"."GradingScale"("academicYear");

-- CreateIndex
CREATE INDEX "GradingScale_isDefault_idx" ON "public"."GradingScale"("isDefault");

-- CreateIndex
CREATE INDEX "GradingScale_createdById_idx" ON "public"."GradingScale"("createdById");

-- CreateIndex
CREATE INDEX "GradingScale_updatedById_idx" ON "public"."GradingScale"("updatedById");

-- CreateIndex
CREATE INDEX "GradingScale_deletedById_idx" ON "public"."GradingScale"("deletedById");

-- CreateIndex
CREATE UNIQUE INDEX "GradingScale_academicYear_name_key" ON "public"."GradingScale"("academicYear", "name");

-- CreateIndex
CREATE INDEX "GradeDefinition_gradingScaleId_idx" ON "public"."GradeDefinition"("gradingScaleId");

-- CreateIndex
CREATE INDEX "GradeDefinition_minMarks_idx" ON "public"."GradeDefinition"("minMarks");

-- CreateIndex
CREATE INDEX "GradeDefinition_maxMarks_idx" ON "public"."GradeDefinition"("maxMarks");

-- CreateIndex
CREATE INDEX "GradeDefinition_createdById_idx" ON "public"."GradeDefinition"("createdById");

-- CreateIndex
CREATE INDEX "GradeDefinition_updatedById_idx" ON "public"."GradeDefinition"("updatedById");

-- CreateIndex
CREATE INDEX "GradeDefinition_deletedById_idx" ON "public"."GradeDefinition"("deletedById");

-- CreateIndex
CREATE UNIQUE INDEX "GradeDefinition_gradingScaleId_grade_key" ON "public"."GradeDefinition"("gradingScaleId", "grade");

-- CreateIndex
CREATE INDEX "ExamResult_examSlotId_idx" ON "public"."ExamResult"("examSlotId");

-- CreateIndex
CREATE INDEX "ExamResult_studentId_idx" ON "public"."ExamResult"("studentId");

-- CreateIndex
CREATE INDEX "ExamResult_gradeId_idx" ON "public"."ExamResult"("gradeId");

-- CreateIndex
CREATE INDEX "ExamResult_status_idx" ON "public"."ExamResult"("status");

-- CreateIndex
CREATE INDEX "ExamResult_gradedById_idx" ON "public"."ExamResult"("gradedById");

-- CreateIndex
CREATE INDEX "ExamResult_lastModifiedById_idx" ON "public"."ExamResult"("lastModifiedById");

-- CreateIndex
CREATE INDEX "ExamResult_gradedAt_idx" ON "public"."ExamResult"("gradedAt");

-- CreateIndex
CREATE INDEX "ExamResult_createdById_idx" ON "public"."ExamResult"("createdById");

-- CreateIndex
CREATE INDEX "ExamResult_updatedById_idx" ON "public"."ExamResult"("updatedById");

-- CreateIndex
CREATE INDEX "ExamResult_deletedById_idx" ON "public"."ExamResult"("deletedById");

-- CreateIndex
CREATE UNIQUE INDEX "ExamResult_examSlotId_studentId_key" ON "public"."ExamResult"("examSlotId", "studentId");

-- CreateIndex
CREATE INDEX "GradingPermission_teacherId_idx" ON "public"."GradingPermission"("teacherId");

-- CreateIndex
CREATE INDEX "GradingPermission_subjectId_idx" ON "public"."GradingPermission"("subjectId");

-- CreateIndex
CREATE INDEX "GradingPermission_classId_idx" ON "public"."GradingPermission"("classId");

-- CreateIndex
CREATE INDEX "GradingPermission_createdById_idx" ON "public"."GradingPermission"("createdById");

-- CreateIndex
CREATE INDEX "GradingPermission_updatedById_idx" ON "public"."GradingPermission"("updatedById");

-- CreateIndex
CREATE INDEX "GradingPermission_deletedById_idx" ON "public"."GradingPermission"("deletedById");

-- CreateIndex
CREATE UNIQUE INDEX "GradingPermission_teacherId_subjectId_classId_key" ON "public"."GradingPermission"("teacherId", "subjectId", "classId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentGradeHistory_examResultId_key" ON "public"."StudentGradeHistory"("examResultId");

-- CreateIndex
CREATE INDEX "StudentGradeHistory_studentId_idx" ON "public"."StudentGradeHistory"("studentId");

-- CreateIndex
CREATE INDEX "StudentGradeHistory_academicYear_idx" ON "public"."StudentGradeHistory"("academicYear");

-- CreateIndex
CREATE INDEX "StudentGradeHistory_classId_idx" ON "public"."StudentGradeHistory"("classId");

-- CreateIndex
CREATE INDEX "StudentGradeHistory_subjectId_idx" ON "public"."StudentGradeHistory"("subjectId");

-- CreateIndex
CREATE INDEX "StudentGradeHistory_examType_idx" ON "public"."StudentGradeHistory"("examType");

-- CreateIndex
CREATE INDEX "StudentGradeHistory_examDate_idx" ON "public"."StudentGradeHistory"("examDate");

-- CreateIndex
CREATE INDEX "StudentGradeHistory_gradedById_idx" ON "public"."StudentGradeHistory"("gradedById");

-- CreateIndex
CREATE INDEX "StudentGradeHistory_createdById_idx" ON "public"."StudentGradeHistory"("createdById");

-- CreateIndex
CREATE INDEX "StudentGradeHistory_updatedById_idx" ON "public"."StudentGradeHistory"("updatedById");

-- CreateIndex
CREATE INDEX "StudentGradeHistory_deletedById_idx" ON "public"."StudentGradeHistory"("deletedById");

-- CreateIndex
CREATE UNIQUE INDEX "StudentGradeHistory_studentId_examResultId_key" ON "public"."StudentGradeHistory"("studentId", "examResultId");

-- CreateIndex
CREATE UNIQUE INDEX "school_information_schoolCode_key" ON "public"."school_information"("schoolCode");

-- AddForeignKey
ALTER TABLE "public"."PasswordResetOtp" ADD CONSTRAINT "PasswordResetOtp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GradeDefinition" ADD CONSTRAINT "GradeDefinition_gradingScaleId_fkey" FOREIGN KEY ("gradingScaleId") REFERENCES "public"."GradingScale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ExamResult" ADD CONSTRAINT "ExamResult_examSlotId_fkey" FOREIGN KEY ("examSlotId") REFERENCES "public"."ExamSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ExamResult" ADD CONSTRAINT "ExamResult_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ExamResult" ADD CONSTRAINT "ExamResult_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "public"."GradeDefinition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ExamResult" ADD CONSTRAINT "ExamResult_gradedById_fkey" FOREIGN KEY ("gradedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ExamResult" ADD CONSTRAINT "ExamResult_lastModifiedById_fkey" FOREIGN KEY ("lastModifiedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GradingPermission" ADD CONSTRAINT "GradingPermission_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "public"."Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GradingPermission" ADD CONSTRAINT "GradingPermission_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GradingPermission" ADD CONSTRAINT "GradingPermission_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentGradeHistory" ADD CONSTRAINT "StudentGradeHistory_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentGradeHistory" ADD CONSTRAINT "StudentGradeHistory_examResultId_fkey" FOREIGN KEY ("examResultId") REFERENCES "public"."ExamResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentGradeHistory" ADD CONSTRAINT "StudentGradeHistory_classId_fkey" FOREIGN KEY ("classId") REFERENCES "public"."Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentGradeHistory" ADD CONSTRAINT "StudentGradeHistory_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "public"."Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentGradeHistory" ADD CONSTRAINT "StudentGradeHistory_examSlotId_fkey" FOREIGN KEY ("examSlotId") REFERENCES "public"."ExamSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StudentGradeHistory" ADD CONSTRAINT "StudentGradeHistory_gradedById_fkey" FOREIGN KEY ("gradedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
