-- Rollback: Remove unique constraint for class names

-- Drop the partial unique index
DROP INDEX IF EXISTS "Class_name_unique_active";