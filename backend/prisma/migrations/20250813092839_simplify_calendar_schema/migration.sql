/*
  Warnings:

  - The values [REMINDER] on the enum `CalendarEntryType` will be removed. If these variants are still used in the database, this will fail.
  - The values [RELIGIOUS,CULTURAL] on the enum `HolidayType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `bsDay` on the `CalendarEntry` table. All the data in the column will be lost.
  - You are about to drop the column `bsMonth` on the `CalendarEntry` table. All the data in the column will be lost.
  - You are about to drop the column `bsYear` on the `CalendarEntry` table. All the data in the column will be lost.
  - You are about to drop the column `color` on the `CalendarEntry` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `CalendarEntry` table. All the data in the column will be lost.
  - You are about to drop the column `isAllDay` on the `CalendarEntry` table. All the data in the column will be lost.
  - You are about to drop the column `isPublished` on the `CalendarEntry` table. All the data in the column will be lost.
  - You are about to drop the column `isRecurring` on the `CalendarEntry` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `CalendarEntry` table. All the data in the column will be lost.
  - You are about to drop the column `priority` on the `CalendarEntry` table. All the data in the column will be lost.
  - You are about to drop the column `recurrencePattern` on the `CalendarEntry` table. All the data in the column will be lost.
  - You are about to drop the column `reminderType` on the `CalendarEntry` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `CalendarEntry` table. All the data in the column will be lost.
  - You are about to drop the column `timing` on the `CalendarEntry` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `CalendarEntry` table. All the data in the column will be lost.
  - Added the required column `name` to the `CalendarEntry` table without a default value. This is not possible if the table is not empty.
  - Made the column `endDate` on table `CalendarEntry` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."CalendarEntryType_new" AS ENUM ('HOLIDAY', 'EVENT');
ALTER TABLE "public"."CalendarEntry" ALTER COLUMN "type" TYPE "public"."CalendarEntryType_new" USING ("type"::text::"public"."CalendarEntryType_new");
ALTER TYPE "public"."CalendarEntryType" RENAME TO "CalendarEntryType_old";
ALTER TYPE "public"."CalendarEntryType_new" RENAME TO "CalendarEntryType";
DROP TYPE "public"."CalendarEntryType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "public"."HolidayType_new" AS ENUM ('NATIONAL', 'SCHOOL');
ALTER TABLE "public"."CalendarEntry" ALTER COLUMN "holidayType" TYPE "public"."HolidayType_new" USING ("holidayType"::text::"public"."HolidayType_new");
ALTER TYPE "public"."HolidayType" RENAME TO "HolidayType_old";
ALTER TYPE "public"."HolidayType_new" RENAME TO "HolidayType";
DROP TYPE "public"."HolidayType_old";
COMMIT;

-- DropIndex
DROP INDEX "public"."CalendarEntry_bsYear_bsMonth_idx";

-- DropIndex
DROP INDEX "public"."CalendarEntry_isPublished_idx";

-- DropIndex
DROP INDEX "public"."CalendarEntry_status_idx";

-- AlterTable
ALTER TABLE "public"."CalendarEntry" DROP COLUMN "bsDay",
DROP COLUMN "bsMonth",
DROP COLUMN "bsYear",
DROP COLUMN "color",
DROP COLUMN "description",
DROP COLUMN "isAllDay",
DROP COLUMN "isPublished",
DROP COLUMN "isRecurring",
DROP COLUMN "metadata",
DROP COLUMN "priority",
DROP COLUMN "recurrencePattern",
DROP COLUMN "reminderType",
DROP COLUMN "status",
DROP COLUMN "timing",
DROP COLUMN "title",
ADD COLUMN     "name" TEXT NOT NULL,
ALTER COLUMN "endDate" SET NOT NULL;

-- DropEnum
DROP TYPE "public"."Priority";

-- DropEnum
DROP TYPE "public"."ReminderType";
