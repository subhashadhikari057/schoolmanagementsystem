-- Sync currentEnrollment field with actual student counts (excluding soft-deleted students)

UPDATE "Class" 
SET "currentEnrollment" = (
  SELECT COUNT(*)
  FROM "Student" 
  WHERE "Student"."classId" = "Class"."id" 
  AND "Student"."deletedAt" IS NULL
)
WHERE "Class"."deletedAt" IS NULL;