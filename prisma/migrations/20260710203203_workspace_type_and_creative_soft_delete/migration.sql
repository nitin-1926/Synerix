-- CreateEnum
CREATE TYPE "WorkspaceType" AS ENUM ('FMCG_PRODUCT', 'APPAREL_ON_MODEL', 'FASHION_EDITORIAL');

-- AlterTable
ALTER TABLE "creatives" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "workspaces" ADD COLUMN     "type" "WorkspaceType" NOT NULL DEFAULT 'FMCG_PRODUCT';
