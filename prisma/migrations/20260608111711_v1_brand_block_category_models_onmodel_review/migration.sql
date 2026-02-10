-- CreateEnum
CREATE TYPE "ProductCategory" AS ENUM ('FMCG', 'APPAREL', 'OTHER');

-- CreateEnum
CREATE TYPE "AiModelScope" AS ENUM ('GLOBAL', 'BRAND');

-- CreateEnum
CREATE TYPE "ModelGenStatus" AS ENUM ('PENDING', 'RUNNING', 'READY', 'FAILED');

-- AlterEnum
ALTER TYPE "FidelityMode" ADD VALUE 'ON_MODEL';

-- AlterTable
ALTER TABLE "brands" ADD COLUMN     "contactLine" TEXT,
ADD COLUMN     "logoCorner" TEXT DEFAULT 'TL',
ADD COLUMN     "logoScale" DOUBLE PRECISION DEFAULT 1;

-- AlterTable
ALTER TABLE "creatives" ADD COLUMN     "approved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "approvedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "generation_runs" ADD COLUMN     "aiModelId" TEXT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "category" "ProductCategory" NOT NULL DEFAULT 'OTHER';

-- CreateTable
CREATE TABLE "ai_models" (
    "id" TEXT NOT NULL,
    "scope" "AiModelScope" NOT NULL DEFAULT 'BRAND',
    "brandId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "traits" JSONB,
    "storageKey" TEXT,
    "mimeType" TEXT NOT NULL DEFAULT 'image/png',
    "width" INTEGER,
    "height" INTEGER,
    "status" "ModelGenStatus" NOT NULL DEFAULT 'READY',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_models_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_models_brandId_idx" ON "ai_models"("brandId");

-- CreateIndex
CREATE INDEX "ai_models_scope_idx" ON "ai_models"("scope");

-- AddForeignKey
ALTER TABLE "ai_models" ADD CONSTRAINT "ai_models_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generation_runs" ADD CONSTRAINT "generation_runs_aiModelId_fkey" FOREIGN KEY ("aiModelId") REFERENCES "ai_models"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Security hardening (matches 20260606110146_enable_rls): deny all PostgREST
-- access to the new table; the app reaches Postgres only via Prisma.
ALTER TABLE "ai_models" ENABLE ROW LEVEL SECURITY;
