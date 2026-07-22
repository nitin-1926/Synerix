import { task, logger } from "@trigger.dev/sdk";
import sharp from "sharp";
import { prisma } from "@/lib/db";
import { downloadFromStorage, storageKeys, uploadBuffer } from "@/lib/storage";
import { removeBackground, downloadImage, bufferToDataUri } from "@/lib/image/runware";
import { persistCost } from "@/lib/pipeline/cost-log";

/**
 * One-time background removal per product image. Runs at upload so generation
 * runs reuse the cached cutout (white-flattened packshot PNG) as their product
 * reference instead of paying/waiting for any per-run cleanup. Idempotent:
 * only images without a cutoutKey are processed, so re-triggering is free.
 */
export const productCutout = task({
  id: "product-cutout",
  maxDuration: 300,
  run: async (payload: { productId: string }) => {
    const images = await prisma.productImage.findMany({
      where: { productId: payload.productId, cutoutKey: null },
      include: { product: { select: { brand: { select: { workspaceId: true } } } } },
    });
    if (!images.length) return { processed: 0, cached: true };

    let processed = 0;
    let totalUSD = 0;
    let costModel = "";
    for (const img of images) {
      try {
        const original = await downloadFromStorage(img.storageKey);
        const removed = await removeBackground(bufferToDataUri(original, img.mimeType));
        const transparent = await downloadImage(removed.imageUrl);
        // Flatten onto white: image models handle a clean studio packshot far
        // better than alpha transparency, and it doubles as an e-comm listing look.
        const cutout = await sharp(transparent).flatten({ background: "#ffffff" }).png().toBuffer();
        const key = storageKeys.productCutout(img.productId, img.id);
        await uploadBuffer(key, cutout, "image/png");
        await prisma.productImage.update({ where: { id: img.id }, data: { cutoutKey: key } });
        processed += 1;
        totalUSD += removed.cost;
        costModel = removed.modelId;
      } catch (e) {
        // A missing cutout is never fatal — generation falls back to the
        // original photo; the next trigger retries this image (cutoutKey null).
        logger.warn("cutout failed for image", { imageId: img.id, error: (e as Error).message });
      }
    }

    if (processed > 0) {
      await persistCost({
        summary: {
          totalUSD, llmUSD: 0, imageUSD: totalUSD, imageCount: processed,
          llm: [],
          images: Array.from({ length: processed }, () => ({ stage: "cutout", model: costModel, usd: totalUSD / processed })),
        },
        source: "cutout",
        workspaceId: images[0].product.brand.workspaceId,
      });
    }
    logger.info("cutouts complete", { productId: payload.productId, processed, totalUSD });
    return { processed, cached: false };
  },
});
