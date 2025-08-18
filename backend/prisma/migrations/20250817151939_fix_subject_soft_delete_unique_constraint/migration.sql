/*
  Warnings:

  - A unique constraint covering the columns `[code,deletedAt]` on the table `Subject` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."Subject_code_key";

-- CreateIndex
CREATE UNIQUE INDEX "Subject_code_deletedAt_key" ON "public"."Subject"("code", "deletedAt");
