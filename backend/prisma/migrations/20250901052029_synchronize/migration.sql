/*
  Warnings:

  - A unique constraint covering the columns `[issuedForId,type,isActive]` on the table `IDCard` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."IDCard" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "qrCodeData" TEXT;

-- AlterTable
ALTER TABLE "public"."IDCardTemplateField" ADD COLUMN     "dataSource" TEXT,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "qrData" TEXT,
ADD COLUMN     "staticText" TEXT;

-- CreateIndex
CREATE INDEX "IDCard_qrCodeData_idx" ON "public"."IDCard"("qrCodeData");

-- CreateIndex
CREATE UNIQUE INDEX "IDCard_issuedForId_type_isActive_key" ON "public"."IDCard"("issuedForId", "type", "isActive");
