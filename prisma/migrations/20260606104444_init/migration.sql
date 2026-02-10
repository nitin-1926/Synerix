-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('OWNER', 'ADMIN', 'EDITOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "IngestStatus" AS ENUM ('PENDING', 'CRAWLING', 'EXTRACTING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "BrandAssetKind" AS ENUM ('LOGO', 'PRODUCT', 'LIFESTYLE', 'ICON', 'OTHER');

-- CreateEnum
CREATE TYPE "DissectionStatus" AS ENUM ('PENDING', 'RUNNING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "FestivalCategory" AS ENUM ('RELIGIOUS', 'NATIONAL', 'COMMERCIAL', 'SEASONAL');

-- CreateEnum
CREATE TYPE "CalendarEntryKind" AS ENUM ('FESTIVAL', 'CUSTOM');

-- CreateEnum
CREATE TYPE "GenerationTrigger" AS ENUM ('FESTIVAL', 'CUSTOM');

-- CreateEnum
CREATE TYPE "FidelityMode" AS ENUM ('IN_SCENE', 'EXACT_PRODUCT');

-- CreateEnum
CREATE TYPE "GenerationStatus" AS ENUM ('QUEUED', 'BRIEFING', 'CONCEPTING', 'RENDERING', 'QA', 'COMPLETE', 'PARTIAL', 'FAILED');

-- CreateEnum
CREATE TYPE "CreativeStatus" AS ENUM ('DRAFTING', 'READY', 'FAILED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RenderStatus" AS ENUM ('PENDING', 'COMPOSED', 'FAILED');

-- CreateEnum
CREATE TYPE "CreditReason" AS ENUM ('MANUAL_GRANT', 'SIGNUP_GRANT', 'GENERATION', 'REGEN_INSTRUCTION', 'REFUND');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "supabaseUserId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspaces" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memberships" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "MembershipRole" NOT NULL DEFAULT 'OWNER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brands" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "websiteUrl" TEXT,
    "mottoText" TEXT,
    "dna" JSONB,
    "dnaConfidence" JSONB,
    "primaryColorHex" TEXT,
    "secondaryColorsHex" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "accentColorsHex" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "typographyStyle" TEXT,
    "photographyStyle" TEXT,
    "voiceRegister" TEXT,
    "oneLiner" TEXT,
    "logoAssetId" TEXT,
    "ingestStatus" "IngestStatus" NOT NULL DEFAULT 'PENDING',
    "ingestRunId" TEXT,
    "ingestError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brand_assets" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "kind" "BrandAssetKind" NOT NULL DEFAULT 'OTHER',
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "sourceUrl" TEXT,
    "classification" JSONB,
    "isPrimaryLogo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brand_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "description" TEXT,
    "dissectionPrompt" TEXT,
    "dissectionFull" JSONB,
    "dissectionStatus" "DissectionStatus" NOT NULL DEFAULT 'PENDING',
    "dissectionSourceImageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_images" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "festivals" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameHindi" TEXT,
    "category" "FestivalCategory" NOT NULL,
    "regionTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "relevanceTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "creativeContext" JSONB NOT NULL,
    "defaultLeadTimeDays" INTEGER NOT NULL DEFAULT 14,

    CONSTRAINT "festivals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "festival_occurrences" (
    "id" TEXT NOT NULL,
    "festivalId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "endDate" DATE,
    "isApproximate" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "festival_occurrences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_entries" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "kind" "CalendarEntryKind" NOT NULL,
    "festivalOccurrenceId" TEXT,
    "customTitle" TEXT,
    "customDate" DATE,
    "customContext" JSONB,
    "optInForAutoDraft" BOOLEAN NOT NULL DEFAULT false,
    "leadTimeDays" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calendar_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generation_runs" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "calendarEntryId" TEXT,
    "productId" TEXT,
    "trigger" "GenerationTrigger" NOT NULL,
    "customBrief" TEXT,
    "fidelityMode" "FidelityMode" NOT NULL DEFAULT 'IN_SCENE',
    "requestedAspects" TEXT[] DEFAULT ARRAY['4:5']::TEXT[],
    "language" TEXT NOT NULL DEFAULT 'en',
    "status" "GenerationStatus" NOT NULL DEFAULT 'QUEUED',
    "pipeline" JSONB NOT NULL DEFAULT '{}',
    "creditsDebited" INTEGER NOT NULL DEFAULT 0,
    "triggerRunId" TEXT,
    "error" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generation_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creatives" (
    "id" TEXT NOT NULL,
    "generationRunId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "conceptIndex" INTEGER NOT NULL,
    "concept" JSONB NOT NULL,
    "masterPlateKey" TEXT,
    "masterAspect" TEXT,
    "status" "CreativeStatus" NOT NULL DEFAULT 'DRAFTING',
    "qa" JSONB,
    "critic" JSONB,
    "usedCutoutFallback" BOOLEAN NOT NULL DEFAULT false,
    "currentVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creatives_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creative_renders" (
    "id" TEXT NOT NULL,
    "creativeId" TEXT NOT NULL,
    "aspectRatio" TEXT NOT NULL,
    "overlaySpec" JSONB NOT NULL,
    "composedImageKey" TEXT,
    "status" "RenderStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creative_renders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creative_versions" (
    "id" TEXT NOT NULL,
    "creativeId" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "cause" JSONB NOT NULL,
    "overlaySpec" JSONB NOT NULL,
    "masterPlateKey" TEXT,
    "composedImageKey" TEXT NOT NULL,
    "aspectRatio" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creative_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_credits" (
    "workspaceId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_credits_pkey" PRIMARY KEY ("workspaceId")
);

-- CreateTable
CREATE TABLE "credit_ledger" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" "CreditReason" NOT NULL,
    "generationRunId" TEXT,
    "balanceAfter" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credit_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_supabaseUserId_key" ON "users"("supabaseUserId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_slug_key" ON "workspaces"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_workspaceId_userId_key" ON "memberships"("workspaceId", "userId");

-- CreateIndex
CREATE INDEX "brands_workspaceId_idx" ON "brands"("workspaceId");

-- CreateIndex
CREATE INDEX "brand_assets_brandId_idx" ON "brand_assets"("brandId");

-- CreateIndex
CREATE INDEX "products_brandId_idx" ON "products"("brandId");

-- CreateIndex
CREATE INDEX "product_images_productId_idx" ON "product_images"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "festivals_slug_key" ON "festivals"("slug");

-- CreateIndex
CREATE INDEX "festival_occurrences_date_idx" ON "festival_occurrences"("date");

-- CreateIndex
CREATE UNIQUE INDEX "festival_occurrences_festivalId_year_key" ON "festival_occurrences"("festivalId", "year");

-- CreateIndex
CREATE INDEX "calendar_entries_workspaceId_brandId_idx" ON "calendar_entries"("workspaceId", "brandId");

-- CreateIndex
CREATE INDEX "generation_runs_workspaceId_status_idx" ON "generation_runs"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "creatives_brandId_status_idx" ON "creatives"("brandId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "creative_renders_creativeId_aspectRatio_key" ON "creative_renders"("creativeId", "aspectRatio");

-- CreateIndex
CREATE UNIQUE INDEX "creative_versions_creativeId_index_key" ON "creative_versions"("creativeId", "index");

-- CreateIndex
CREATE INDEX "credit_ledger_workspaceId_createdAt_idx" ON "credit_ledger"("workspaceId", "createdAt");

-- AddForeignKey
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brands" ADD CONSTRAINT "brands_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brand_assets" ADD CONSTRAINT "brand_assets_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "festival_occurrences" ADD CONSTRAINT "festival_occurrences_festivalId_fkey" FOREIGN KEY ("festivalId") REFERENCES "festivals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_entries" ADD CONSTRAINT "calendar_entries_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_entries" ADD CONSTRAINT "calendar_entries_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_entries" ADD CONSTRAINT "calendar_entries_festivalOccurrenceId_fkey" FOREIGN KEY ("festivalOccurrenceId") REFERENCES "festival_occurrences"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generation_runs" ADD CONSTRAINT "generation_runs_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generation_runs" ADD CONSTRAINT "generation_runs_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generation_runs" ADD CONSTRAINT "generation_runs_calendarEntryId_fkey" FOREIGN KEY ("calendarEntryId") REFERENCES "calendar_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generation_runs" ADD CONSTRAINT "generation_runs_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creatives" ADD CONSTRAINT "creatives_generationRunId_fkey" FOREIGN KEY ("generationRunId") REFERENCES "generation_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creatives" ADD CONSTRAINT "creatives_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creative_renders" ADD CONSTRAINT "creative_renders_creativeId_fkey" FOREIGN KEY ("creativeId") REFERENCES "creatives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "creative_versions" ADD CONSTRAINT "creative_versions_creativeId_fkey" FOREIGN KEY ("creativeId") REFERENCES "creatives"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_credits" ADD CONSTRAINT "workspace_credits_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_ledger" ADD CONSTRAINT "credit_ledger_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
