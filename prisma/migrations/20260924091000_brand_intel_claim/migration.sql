-- Atomic claim for the paid brand-research refresh (see refreshBrandIntel).
ALTER TABLE "brands" ADD COLUMN "creativeIntelRequestedAt" TIMESTAMP(3);
