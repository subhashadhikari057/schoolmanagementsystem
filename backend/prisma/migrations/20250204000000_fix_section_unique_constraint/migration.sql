-- Drop the existing unique constraint
DROP INDEX IF EXISTS "Section_name_classId_key";

-- Create a partial unique index that only applies to active (non-deleted) sections
CREATE UNIQUE INDEX "Section_name_classId_unique_active" 
ON "Section" ("name", "classId") 
WHERE "deletedAt" IS NULL;