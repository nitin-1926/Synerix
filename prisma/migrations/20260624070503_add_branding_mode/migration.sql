-- CreateEnum
CREATE TYPE "BrandingMode" AS ENUM ('BRANDED', 'PLAIN');

-- AlterTable
ALTER TABLE "brands" ADD COLUMN     "apparelBrandingDefault" "BrandingMode" NOT NULL DEFAULT 'BRANDED';

-- AlterTable
ALTER TABLE "generation_runs" ADD COLUMN     "brandingMode" "BrandingMode" NOT NULL DEFAULT 'BRANDED';
