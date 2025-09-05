-- AlterTable
ALTER TABLE "public"."school_information" ADD COLUMN     "contactNumbers" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "emails" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "website" TEXT;
