-- DropIndex
DROP INDEX "public"."Class_grade_section_shift_deletedAt_key";

-- CreatePartialUniqueIndex
-- This ensures uniqueness only for active (non-deleted) classes
CREATE UNIQUE INDEX "unique_active_class_grade_section_shift" 
ON "public"."Class"("grade", "section", "shift") 
WHERE "deletedAt" IS NULL;
