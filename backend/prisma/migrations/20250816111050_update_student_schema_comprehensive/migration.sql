/*
  Migration to update Student schema to store parent names as separate fields
  This migration handles existing data by parsing the concatenated names.
*/

-- Step 1: Add new columns as nullable
ALTER TABLE "public"."Student" 
ADD COLUMN "fatherFirstName" TEXT,
ADD COLUMN "fatherMiddleName" TEXT,
ADD COLUMN "fatherLastName" TEXT,
ADD COLUMN "motherFirstName" TEXT,
ADD COLUMN "motherMiddleName" TEXT,
ADD COLUMN "motherLastName" TEXT;

-- Step 2: Migrate existing data by parsing full names
UPDATE "public"."Student" SET
  "fatherFirstName" = CASE 
    WHEN "fatherName" IS NOT NULL AND trim("fatherName") != '' THEN
      split_part(trim("fatherName"), ' ', 1)
    ELSE 'Unknown'
  END,
  "fatherLastName" = CASE 
    WHEN "fatherName" IS NOT NULL AND trim("fatherName") != '' AND array_length(string_to_array(trim("fatherName"), ' '), 1) > 1 THEN
      split_part(trim("fatherName"), ' ', array_length(string_to_array(trim("fatherName"), ' '), 1))
    ELSE 'Father'
  END,
  "fatherMiddleName" = CASE 
    WHEN "fatherName" IS NOT NULL AND trim("fatherName") != '' AND array_length(string_to_array(trim("fatherName"), ' '), 1) > 2 THEN
      array_to_string(
        (string_to_array(trim("fatherName"), ' '))[2:array_length(string_to_array(trim("fatherName"), ' '), 1)-1], 
        ' '
      )
    ELSE NULL
  END,
  "motherFirstName" = CASE 
    WHEN "motherName" IS NOT NULL AND trim("motherName") != '' THEN
      split_part(trim("motherName"), ' ', 1)
    ELSE 'Unknown'
  END,
  "motherLastName" = CASE 
    WHEN "motherName" IS NOT NULL AND trim("motherName") != '' AND array_length(string_to_array(trim("motherName"), ' '), 1) > 1 THEN
      split_part(trim("motherName"), ' ', array_length(string_to_array(trim("motherName"), ' '), 1))
    ELSE 'Mother'
  END,
  "motherMiddleName" = CASE 
    WHEN "motherName" IS NOT NULL AND trim("motherName") != '' AND array_length(string_to_array(trim("motherName"), ' '), 1) > 2 THEN
      array_to_string(
        (string_to_array(trim("motherName"), ' '))[2:array_length(string_to_array(trim("motherName"), ' '), 1)-1], 
        ' '
      )
    ELSE NULL
  END;

-- Step 3: Make required columns non-nullable
ALTER TABLE "public"."Student" 
ALTER COLUMN "fatherFirstName" SET NOT NULL,
ALTER COLUMN "fatherLastName" SET NOT NULL,
ALTER COLUMN "motherFirstName" SET NOT NULL,
ALTER COLUMN "motherLastName" SET NOT NULL;

-- Step 4: Drop old columns
ALTER TABLE "public"."Student" 
DROP COLUMN "fatherName",
DROP COLUMN "motherName";
