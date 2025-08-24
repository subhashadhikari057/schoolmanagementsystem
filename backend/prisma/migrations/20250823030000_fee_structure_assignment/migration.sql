-- Migration: Add FeeStructureAssignment junction table for multi-class assignments
CREATE TABLE "FeeStructureAssignment" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "feeStructureId" TEXT NOT NULL,
  "classId" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "deletedAt" TIMESTAMP NULL,
  CONSTRAINT "FeeStructureAssignment_feeStructureId_fkey" FOREIGN KEY ("feeStructureId") REFERENCES "FeeStructure"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "FeeStructureAssignment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "FeeStructureAssignment_unique_pair" UNIQUE("feeStructureId","classId")
);

CREATE INDEX "FeeStructureAssignment_classId_idx" ON "FeeStructureAssignment"("classId");
