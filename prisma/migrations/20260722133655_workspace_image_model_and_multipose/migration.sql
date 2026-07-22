-- AlterTable
ALTER TABLE "generation_runs" ADD COLUMN     "modelPoses" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "workspaces" ADD COLUMN     "imageModel" TEXT;
