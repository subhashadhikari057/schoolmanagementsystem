-- Add unique constraint for class names (only for non-deleted records)
-- This prevents duplicate class names at the database level

-- Create a partial unique index on name where deletedAt is null
CREATE UNIQUE INDEX "Class_name_unique_active" ON "Class" ("name") WHERE "deletedAt" IS NULL;