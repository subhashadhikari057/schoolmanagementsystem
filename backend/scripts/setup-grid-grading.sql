-- Grid Grading System Setup Script
-- This script ensures the StudentGradeHistory table and related indexes are properly created

-- Create StudentGradeHistory table if it doesn't exist
CREATE TABLE IF NOT EXISTS "StudentGradeHistory" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "studentId" TEXT NOT NULL,
    "examResultId" TEXT NOT NULL UNIQUE,
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
    "createdById" TEXT,
    "updatedById" TEXT,
    "deletedById" TEXT,
    
    CONSTRAINT "StudentGradeHistory_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StudentGradeHistory_examResultId_fkey" FOREIGN KEY ("examResultId") REFERENCES "ExamResult"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StudentGradeHistory_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StudentGradeHistory_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StudentGradeHistory_examSlotId_fkey" FOREIGN KEY ("examSlotId") REFERENCES "ExamSlot"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StudentGradeHistory_gradedById_fkey" FOREIGN KEY ("gradedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create indexes for optimal performance
CREATE INDEX IF NOT EXISTS "StudentGradeHistory_studentId_idx" ON "StudentGradeHistory"("studentId");
CREATE INDEX IF NOT EXISTS "StudentGradeHistory_academicYear_idx" ON "StudentGradeHistory"("academicYear");
CREATE INDEX IF NOT EXISTS "StudentGradeHistory_classId_idx" ON "StudentGradeHistory"("classId");
CREATE INDEX IF NOT EXISTS "StudentGradeHistory_subjectId_idx" ON "StudentGradeHistory"("subjectId");
CREATE INDEX IF NOT EXISTS "StudentGradeHistory_examType_idx" ON "StudentGradeHistory"("examType");
CREATE INDEX IF NOT EXISTS "StudentGradeHistory_examDate_idx" ON "StudentGradeHistory"("examDate");
CREATE INDEX IF NOT EXISTS "StudentGradeHistory_gradedById_idx" ON "StudentGradeHistory"("gradedById");
CREATE INDEX IF NOT EXISTS "StudentGradeHistory_createdById_idx" ON "StudentGradeHistory"("createdById");
CREATE INDEX IF NOT EXISTS "StudentGradeHistory_updatedById_idx" ON "StudentGradeHistory"("updatedById");
CREATE INDEX IF NOT EXISTS "StudentGradeHistory_deletedById_idx" ON "StudentGradeHistory"("deletedById");

-- Create unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS "StudentGradeHistory_studentId_examResultId_key" ON "StudentGradeHistory"("studentId", "examResultId");

-- Add comment to table
COMMENT ON TABLE "StudentGradeHistory" IS 'Maintains complete academic history of student grades across different years, classes, and exam cycles';

-- Add comments to important columns
COMMENT ON COLUMN "StudentGradeHistory"."academicYear" IS 'Academic year in format YYYY-YYYY (e.g., 2024-2025)';
COMMENT ON COLUMN "StudentGradeHistory"."examType" IS 'Type of exam: MIDTERM, FINAL, QUIZ, ASSIGNMENT, etc.';
COMMENT ON COLUMN "StudentGradeHistory"."classId" IS 'Class student was in at time of exam (for promotion/demotion tracking)';
COMMENT ON COLUMN "StudentGradeHistory"."percentage" IS 'Calculated percentage score (marksObtained/maxMarks * 100)';

-- Verify table creation
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename = 'StudentGradeHistory';

-- Show table structure
\d "StudentGradeHistory";
