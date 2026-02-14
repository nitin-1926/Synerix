-- AlterTable
ALTER TABLE "creatives" ADD COLUMN     "imageModel" TEXT;

-- AlterTable
ALTER TABLE "generation_runs" ADD COLUMN     "bakeoff" BOOLEAN NOT NULL DEFAULT false;
