import { task, tasks, logger, metadata } from "@trigger.dev/sdk";
import crypto from "node:crypto";
import { prisma } from "@/lib/db";
import { crawlBrandSite, downloadAsset } from "@/lib/ingest/crawl";
import { classifyAsset, extractBrandDna } from "@/lib/ingest/extract";
import { downloadFromStorage, storageKeys, uploadBuffer } from "@/lib/storage";
import { extractPalette } from "@/lib/composition/analyze";
import type { BrandAssetKind } from "@/generated/prisma/client";
import type { brandResearch } from "./brand-research";

const hexRgb = (hex: string) => {
  const n = parseInt(hex.replace("#", ""), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};
const rgbDist = (a: string, b: string) => {
  const x = hexRgb(a);
  const y = hexRgb(b);
  return Math.hypot(x.r - y.r, x.g - y.g, x.b - y.b);
};
/** Chromatic (non-white/black/grey) — a colour that can carry brand identity. */
const isChromatic = (hex: string) => {
  const { r, g, b } = hexRgb(hex);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max === 0 ? 0 : (max - min) / max;
  return sat >= 0.25 && max > 30 && min < 235;
};

/**
 * Ground the extracted brand palette in the logo's own pixels. If the LLM's
 * primary/accent colours don't appear anywhere in the logo, they're almost
 * certainly website chrome (link blue, button styles) — replace them with the
 * logo's dominant chromatic colours. Skips silently for mono/greyscale logos.
 */
async function reconcilePaletteWithLogo(
  brandId: string,
  logoStorageKey: string,
  extracted: { primary: string | null; accents: string[] },
): Promise<void> {
  try {
    const buf = await downloadFromStorage(logoStorageKey);
    const logoColors = (await extractPalette(buf, 8)).filter(isChromatic);
    if (!logoColors.length) return;
    const nearLogo = (hex: string) => logoColors.some((c) => rgbDist(hex, c) < 80);

    const data: { primaryColorHex?: string; accentColorsHex?: string[] } = {};
    if (!extracted.primary || !nearLogo(extracted.primary)) {
      data.primaryColorHex = logoColors[0];
    }
    const keptAccents = extracted.accents.filter(nearLogo);
    if (!keptAccents.length) {
      const accent = logoColors.find((c) => rgbDist(c, data.primaryColorHex ?? extracted.primary ?? logoColors[0]) >= 80);
      data.accentColorsHex = accent ? [accent] : [logoColors[0]];
    } else if (keptAccents.length !== extracted.accents.length) {
      data.accentColorsHex = keptAccents;
    }
    if (Object.keys(data).length) {
      await prisma.brand.update({ where: { id: brandId }, data });
      logger.info("brand palette reconciled with logo", { extracted, logoColors, applied: data });
    }
  } catch (e) {
    logger.warn("logo palette reconciliation skipped", { error: (e as Error).message });
  }
}

export const brandIngest = task({
  id: "brand-ingest",
  maxDuration: 900,
  retry: { maxAttempts: 1 }, // stage-level failures handled inside; surfaced to UI
  run: async (payload: { brandId: string; websiteUrl: string }) => {
    const { brandId, websiteUrl } = payload;

    // ---- Stage 1: crawl ----
    await prisma.brand.update({ where: { id: brandId }, data: { ingestStatus: "CRAWLING" } });
    metadata.set("stage", "crawling");
    const crawl = await crawlBrandSite(websiteUrl);
    logger.info("crawl complete", { pages: crawl.pages.length, images: crawl.imageUrls.length });
    if (!crawl.pages.length) throw new Error("Could not read any pages from the website");

    // ---- Stage 2: extract DNA ----
    await prisma.brand.update({ where: { id: brandId }, data: { ingestStatus: "EXTRACTING" } });
    metadata.set("stage", "extracting");
    const fallbackName = new URL(websiteUrl).hostname.replace(/^www\./, "");
    const dna = await extractBrandDna(crawl.pages, fallbackName);

    await prisma.brand.update({
      where: { id: brandId },
      data: {
        dna: dna as object,
        name: dna.identity.name || undefined,
        mottoText: dna.motto ?? undefined,
        primaryColorHex: dna.visual_identity.primary_color,
        secondaryColorsHex: dna.visual_identity.secondary_colors,
        accentColorsHex: dna.visual_identity.accent_colors,
        typographyStyle: dna.visual_identity.typography_style,
        photographyStyle: dna.visual_identity.photography_style,
        voiceRegister: dna.voice.register,
        oneLiner: dna.identity.one_line,
      },
    });

    // ---- Stage 3: harvest + classify assets ----
    metadata.set("stage", "assets");
    let processed = 0;
    let bestLogo: { assetId: string; relevance: number; storageKey: string } | null = null;
    const queue = [...crawl.imageUrls];
    const workers = Array.from({ length: 4 }, async () => {
      while (queue.length) {
        const url = queue.shift()!;
        const dl = await downloadAsset(url);
        if (!dl) continue;
        try {
          const classification = await classifyAsset(dl.buf, dl.mime, url);
          if (classification.kind === "OTHER" && classification.brand_relevance <= 2) continue;
          const assetId = crypto.randomUUID();
          const ext = dl.mime.split("/")[1]?.replace("svg+xml", "svg") ?? "png";
          const key = storageKeys.brandAsset(brandId, assetId, ext);
          await uploadBuffer(key, dl.buf, dl.mime);
          const asset = await prisma.brandAsset.create({
            data: {
              id: assetId,
              brandId,
              kind: classification.kind as BrandAssetKind,
              storageKey: key,
              mimeType: dl.mime,
              sourceUrl: url,
              classification: classification as object,
            },
          });
          if (
            classification.kind === "LOGO" &&
            (!bestLogo || classification.brand_relevance > bestLogo.relevance)
          ) {
            bestLogo = { assetId: asset.id, relevance: classification.brand_relevance, storageKey: key };
          }
          processed += 1;
          metadata.set("assetsProcessed", processed);
        } catch (e) {
          logger.warn("asset classify/upload failed", { url, error: (e as Error).message });
        }
      }
    });
    await Promise.all(workers);

    if (bestLogo) {
      const logo: { assetId: string; relevance: number; storageKey: string } = bestLogo;
      await prisma.$transaction([
        prisma.brandAsset.update({ where: { id: logo.assetId }, data: { isPrimaryLogo: true } }),
        prisma.brand.update({ where: { id: brandId }, data: { logoAssetId: logo.assetId } }),
      ]);
      // The LLM extracts colours from website text/chrome and can save generic
      // UI blue as the "brand" colour; the logo's own pixels are ground truth.
      await reconcilePaletteWithLogo(brandId, logo.storageKey, {
        primary: dna.visual_identity.primary_color,
        accents: dna.visual_identity.accent_colors,
      });
    }

    await prisma.brand.update({ where: { id: brandId }, data: { ingestStatus: "READY" } });
    metadata.set("stage", "ready");

    // Kick off web-grounded creative research in the background now that we have
    // the brand's DNA (category/city/audience). It caches on the brand so the
    // first generation is already evidence-grounded without waiting on it.
    try {
      await tasks.trigger<typeof brandResearch>("brand-research", { brandId });
    } catch (e) {
      logger.warn("failed to enqueue brand-research", { error: (e as Error).message });
    }

    return { brandId, pages: crawl.pages.length, assets: processed, logoFound: Boolean(bestLogo) };
  },
  catchError: async ({ payload, error }) => {
    await prisma.brand.update({
      where: { id: payload.brandId },
      data: { ingestStatus: "FAILED", ingestError: (error as Error).message?.slice(0, 500) },
    });
  },
});
