import { task, logger } from "@trigger.dev/sdk";
import { prisma } from "@/lib/db";
import { researchBrandIntel, type BrandIntel } from "@/lib/pipeline/brand-intel";
import { CostTracker } from "@/lib/pipeline/cost";
import { persistCost } from "@/lib/pipeline/cost-log";
import type { Prisma } from "@/generated/prisma/client";

/**
 * Brand Creative Intelligence, OFF the generation critical path.
 *
 * Web-grounded category research used to be run inline during a run's BRIEFING
 * stage on a brand's first generation — an ~8-minute stall that made runs look
 * hung. It's now a standalone background task, triggered fire-and-forget from
 * brand-ingest and from the run pipeline (when the cache is missing/stale). The
 * result is cached on Brand.creativeIntel and reused by every future run for
 * free. This task never blocks a user-visible run.
 */

// Re-research only when the cache is older than this. Brand/category evidence
// changes slowly; there's no value in paying for a web search on every run.
const STALE_MS = Number(process.env.BRAND_INTEL_STALE_MS ?? 1000 * 60 * 60 * 24 * 30); // 30 days

export const brandResearch = task({
  id: "brand-research",
  maxDuration: 300,
  // Idempotent + cheap to retry: it re-checks freshness before doing any work.
  retry: { maxAttempts: 2 },
  run: async (payload: { brandId: string; force?: boolean }) => {
    const brand = await prisma.brand.findUnique({ where: { id: payload.brandId } });
    if (!brand) return { skipped: "brand-not-found" as const };

    const existing = (brand.creativeIntel as BrandIntel | null) ?? null;
    const ageMs = brand.creativeIntelAt ? Date.now() - brand.creativeIntelAt.getTime() : Infinity;
    if (!payload.force && existing && ageMs < STALE_MS) {
      return { skipped: "fresh" as const, ageDays: Math.round(ageMs / 86_400_000) };
    }

    const dna = brand.dna as {
      identity?: { category?: string; city?: string };
      audience?: { target_customer?: string };
      positioning?: { price_band?: string };
    } | null;
    // A few product names sharpen the category grounding.
    const products = await prisma.product.findMany({
      where: { brandId: brand.id },
      select: { name: true },
      take: 6,
    });

    const tracker = new CostTracker();
    const intel = await researchBrandIntel(
      {
        brandName: brand.name,
        category: dna?.identity?.category,
        city: dna?.identity?.city,
        oneLiner: brand.oneLiner,
        productNames: products.map((p) => p.name),
        audience: dna?.audience?.target_customer,
        priceBand: dna?.positioning?.price_band,
      },
      tracker,
    );

    await prisma.brand.update({
      where: { id: brand.id },
      data: { creativeIntel: intel as Prisma.InputJsonValue, creativeIntelAt: new Date() },
    });
    await persistCost({ summary: tracker.summary(), source: "brand-research", workspaceId: brand.workspaceId });
    logger.info("brand intel cached", { brandId: brand.id, searchUsed: intel.searchUsed });
    return { ok: true as const, searchUsed: intel.searchUsed };
  },
});
