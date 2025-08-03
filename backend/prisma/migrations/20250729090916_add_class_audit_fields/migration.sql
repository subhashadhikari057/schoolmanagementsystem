-- AlterTable
ALTER TABLE "Class" ADD COLUMN     "createdById" UUID,
ADD COLUMN     "deletedById" UUID,
ADD COLUMN     "updatedById" UUID;
