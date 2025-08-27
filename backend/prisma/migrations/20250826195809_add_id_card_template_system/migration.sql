/*
  Warnings:

  - You are about to drop the column `layout` on the `IDCardTemplate` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `IDCard` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dimensions` to the `IDCardTemplate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `IDCardTemplate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `IDCardTemplate` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."IDCardTemplateType" AS ENUM ('STUDENT', 'TEACHER', 'STAFF', 'VISITOR', 'GUEST');

-- CreateEnum
CREATE TYPE "public"."TemplateOrientation" AS ENUM ('HORIZONTAL', 'VERTICAL');

-- CreateEnum
CREATE TYPE "public"."TemplateStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "public"."TemplateFieldType" AS ENUM ('TEXT', 'IMAGE', 'QR_CODE', 'BARCODE', 'LOGO', 'PHOTO', 'DATE', 'TIME', 'SIGNATURE');

-- CreateEnum
CREATE TYPE "public"."TextAlignment" AS ENUM ('LEFT', 'CENTER', 'RIGHT', 'JUSTIFY');

-- AlterTable
ALTER TABLE "public"."IDCard" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."IDCardTemplate" DROP COLUMN "layout",
ADD COLUMN     "backgroundColor" TEXT NOT NULL DEFAULT '#ffffff',
ADD COLUMN     "backgroundImage" TEXT,
ADD COLUMN     "barcodeRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "bleedArea" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "borderColor" TEXT NOT NULL DEFAULT '#000000',
ADD COLUMN     "borderRadius" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "borderWidth" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "createdById" UUID,
ADD COLUMN     "customHeight" DOUBLE PRECISION,
ADD COLUMN     "customWidth" DOUBLE PRECISION,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedById" UUID,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "dimensions" TEXT NOT NULL,
ADD COLUMN     "features" JSONB DEFAULT '[]',
ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "logoRequired" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "orientation" "public"."TemplateOrientation" NOT NULL DEFAULT 'HORIZONTAL',
ADD COLUMN     "photoRequired" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "printMargin" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "qrCodeRequired" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "safeArea" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "status" "public"."TemplateStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "type" "public"."IDCardTemplateType" NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updatedById" UUID,
ADD COLUMN     "usageCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "watermark" TEXT,
ALTER COLUMN "metadata" SET DEFAULT '{}';

-- CreateTable
CREATE TABLE "public"."IDCardTemplateField" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "fieldType" "public"."TemplateFieldType" NOT NULL,
    "label" TEXT NOT NULL,
    "databaseField" TEXT,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "width" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "fontSize" INTEGER,
    "fontWeight" TEXT,
    "textAlign" "public"."TextAlignment" DEFAULT 'LEFT',
    "fontFamily" TEXT DEFAULT 'Inter',
    "color" TEXT DEFAULT '#000000',
    "backgroundColor" TEXT,
    "borderWidth" INTEGER DEFAULT 0,
    "borderColor" TEXT DEFAULT '#cccccc',
    "borderRadius" INTEGER DEFAULT 0,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "placeholder" TEXT,
    "rotation" DOUBLE PRECISION DEFAULT 0,
    "opacity" INTEGER DEFAULT 100,
    "zIndex" INTEGER DEFAULT 1,
    "validationRules" JSONB DEFAULT '{}',
    "styleOptions" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IDCardTemplateField_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IDCardTemplateField_templateId_idx" ON "public"."IDCardTemplateField"("templateId");

-- CreateIndex
CREATE INDEX "IDCardTemplateField_fieldType_idx" ON "public"."IDCardTemplateField"("fieldType");

-- CreateIndex
CREATE INDEX "IDCardTemplateField_databaseField_idx" ON "public"."IDCardTemplateField"("databaseField");

-- CreateIndex
CREATE INDEX "IDCard_type_idx" ON "public"."IDCard"("type");

-- CreateIndex
CREATE INDEX "IDCard_templateId_idx" ON "public"."IDCard"("templateId");

-- CreateIndex
CREATE INDEX "IDCard_issuedForId_idx" ON "public"."IDCard"("issuedForId");

-- CreateIndex
CREATE INDEX "IDCardTemplate_type_idx" ON "public"."IDCardTemplate"("type");

-- CreateIndex
CREATE INDEX "IDCardTemplate_status_idx" ON "public"."IDCardTemplate"("status");

-- CreateIndex
CREATE INDEX "IDCardTemplate_createdAt_idx" ON "public"."IDCardTemplate"("createdAt");

-- CreateIndex
CREATE INDEX "IDCardTemplate_createdById_idx" ON "public"."IDCardTemplate"("createdById");

-- CreateIndex
CREATE INDEX "IDCardTemplate_updatedById_idx" ON "public"."IDCardTemplate"("updatedById");

-- CreateIndex
CREATE INDEX "IDCardTemplate_deletedById_idx" ON "public"."IDCardTemplate"("deletedById");

-- AddForeignKey
ALTER TABLE "public"."IDCardTemplateField" ADD CONSTRAINT "IDCardTemplateField_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."IDCardTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
