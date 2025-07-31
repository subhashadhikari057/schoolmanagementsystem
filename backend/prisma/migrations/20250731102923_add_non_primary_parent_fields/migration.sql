-- AlterTable
ALTER TABLE "ParentStudentLink" ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactName" TEXT,
ADD COLUMN     "contactPhone" TEXT,
ALTER COLUMN "parentId" DROP NOT NULL;
