-- Adjust rollNumber uniqueness to be per class (classId, rollNumber)
-- Drop previous global unique index if exists and create composite unique

-- For PostgreSQL
DO $$
BEGIN
  -- Drop old unique index on rollNumber if it exists
  IF EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'Student_rollNumber_key'
  ) THEN
    EXECUTE 'DROP INDEX "Student_rollNumber_key"';
  END IF;

  -- Create new composite unique constraint (will auto-name via Prisma normally, fallback here)
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'Student_classId_rollNumber_key'
  ) THEN
    CREATE UNIQUE INDEX "Student_classId_rollNumber_key" ON "Student" ("classId", "rollNumber");
  END IF;
END $$;
