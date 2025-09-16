-- AlterEnum
ALTER TYPE "public"."NoticeRecipientType" ADD VALUE 'SPECIFIC_PARENT';

-- AlterTable
ALTER TABLE "public"."Notice" ADD COLUMN     "selectedStudentId" TEXT;

-- AddForeignKey
ALTER TABLE "public"."Notice" ADD CONSTRAINT "Notice_selectedStudentId_fkey" FOREIGN KEY ("selectedStudentId") REFERENCES "public"."Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;
