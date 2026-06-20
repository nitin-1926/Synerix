import { task, logger } from "@trigger.dev/sdk";
import { prisma } from "@/lib/db";
import { downloadFromStorage } from "@/lib/storage";
import { dissectProduct } from "@/lib/products/dissect";
import { persistCost } from "@/lib/pipeline/cost-log";

export const productDissect = task({
  id: "product-dissect",
  maxDuration: 300,
  run: async (payload: { productId: string }) => {
    const product = await prisma.product.findUniqueOrThrow({
      where: { id: payload.productId },
      include: {
        images: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }], take: 1 },
        brand: { select: { workspaceId: true } },
      },
    });
    const primary = product.images[0];
    if (!primary) throw new Error("Product has no images");

    // Cache check: skip if already dissected from this image.
    if (product.dissectionStatus === "READY" && product.dissectionSourceImageId === primary.id) {
      logger.info("dissection cache hit", { productId: product.id });
      return { cached: true };
    }

    await prisma.product.update({
      where: { id: product.id },
      data: { dissectionStatus: "RUNNING" },
    });

    const buf = await downloadFromStorage(primary.storageKey);
    const { full, prompt, intel, cost } = await dissectProduct(buf, primary.mimeType, product.name, product.description);
    logger.info("dissection cost (one-time setup)", { cost });
    await persistCost({ summary: cost, source: "dissect", workspaceId: product.brand.workspaceId });

    await prisma.product.update({
      where: { id: product.id },
      data: {
        dissectionFull: { analysis: full },
        dissectionPrompt: prompt,
        productIntel: intel,
        dissectionStatus: "READY",
        dissectionSourceImageId: primary.id,
      },
    });
    logger.info("dissection complete", { productId: product.id, promptChars: prompt.length });
    return { cached: false, promptChars: prompt.length };
  },
  catchError: async ({ payload, error }) => {
    await prisma.product.update({
      where: { id: payload.productId },
      data: { dissectionStatus: "FAILED" },
    });
    logger.error("dissection failed", { error: (error as Error).message });
  },
});
