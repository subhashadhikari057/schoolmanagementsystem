-- AlterTable
ALTER TABLE "public"."Student" ALTER COLUMN "fatherEmail" DROP NOT NULL,
ALTER COLUMN "motherEmail" DROP NOT NULL,
ALTER COLUMN "fatherFirstName" DROP NOT NULL,
ALTER COLUMN "fatherLastName" DROP NOT NULL,
ALTER COLUMN "motherFirstName" DROP NOT NULL,
ALTER COLUMN "motherLastName" DROP NOT NULL;
