/*
  Warnings:

  - The values [DUE] on the enum `ChargeType` will be removed. If these variants are still used in the database, this will fail.
  - The values [CLASS_BASED,EXAM_BASED] on the enum `ScholarshipType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."ChargeType_new" AS ENUM ('FINE', 'EQUIPMENT', 'TRANSPORT', 'OTHER');
ALTER TABLE "public"."ChargeDefinition" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "public"."ChargeDefinition" ALTER COLUMN "type" TYPE "public"."ChargeType_new" USING ("type"::text::"public"."ChargeType_new");
ALTER TYPE "public"."ChargeType" RENAME TO "ChargeType_old";
ALTER TYPE "public"."ChargeType_new" RENAME TO "ChargeType";
DROP TYPE "public"."ChargeType_old";
ALTER TABLE "public"."ChargeDefinition" ALTER COLUMN "type" SET DEFAULT 'FINE';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "public"."ScholarshipType_new" AS ENUM ('MERIT', 'NEED_BASED', 'SPORTS', 'OTHER');
ALTER TABLE "public"."ScholarshipDefinition" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "public"."ScholarshipDefinition" ALTER COLUMN "type" TYPE "public"."ScholarshipType_new" USING ("type"::text::"public"."ScholarshipType_new");
ALTER TYPE "public"."ScholarshipType" RENAME TO "ScholarshipType_old";
ALTER TYPE "public"."ScholarshipType_new" RENAME TO "ScholarshipType";
DROP TYPE "public"."ScholarshipType_old";
ALTER TABLE "public"."ScholarshipDefinition" ALTER COLUMN "type" SET DEFAULT 'OTHER';
COMMIT;

-- AlterTable
ALTER TABLE "public"."FeeStructureAssignment" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "deletedAt" SET DATA TYPE TIMESTAMP(3);

-- RenameIndex
ALTER INDEX "public"."FeeStructureAssignment_unique_pair" RENAME TO "FeeStructureAssignment_feeStructureId_classId_key";
