-- Remove the partial unique index
DROP INDEX IF EXISTS "Section_name_classId_unique_active";

-- Recreate the original unique constraint (if needed for rollback)
-- Note: This may fail if there are duplicate soft-deleted records
-- ALTER TABLE "Section" ADD CONSTRAINT "Section_name_classId_key" UNIQUE ("name", "classId");