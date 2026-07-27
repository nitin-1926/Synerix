import { task, logger } from "@trigger.dev/sdk";
import { prisma } from "@/lib/db";
import { generateImageGemini } from "@/lib/image/gemini";
import { CostTracker } from "@/lib/pipeline/cost";
import { persistCost } from "@/lib/pipeline/cost-log";
import { uploadBuffer, storageKeys } from "@/lib/storage";

/**
 * Generate a reusable AI-model reference photo from a text description and save
 * it to a brand's model library. Mirrors product-dissect's row-status pattern.
 * The produced image is later fused with a garment by the on-model pipeline.
 */

function buildModelPrompt(description: string): string {
  return [
    `A photoreal human model for fashion try-on: ${description}.`,
    "Full-body studio reference photograph, plain light-grey seamless background, soft even lighting, neutral relaxed standing pose facing camera, natural skin tones, sharp focus.",
    "No text, no logos, no props, no watermarks.",
  ].join(" ");
}

export const generateModel = task({
  id: "generate-model",
  maxDuration: 180,
  retry: { maxAttempts: 2 },
  run: async (payload: { modelId: string }) => {
    const model = await prisma.aiModel.findUniqueOrThrow({
      where: { id: payload.modelId },
      include: { brand: { select: { workspaceId: true } } },
    });
    await prisma.aiModel.update({
      where: { id: model.id },
      data: { status: "RUNNING", error: null },
    });
    try {
      const prompt = buildModelPrompt(model.description?.trim() || model.name);
      const buffer = await generateImageGemini({ prompt, aspect: "4:5" });
      // This is a premium image render (Nano Banana Pro by default) and it was
      // completely invisible to the cost log — a free-to-the-customer action
      // that spends real money.
      const tracker = new CostTracker();
      tracker.addImage(process.env.GEMINI_IMAGE_MODEL ?? "gemini-3-pro-image", "ai-model");
      void persistCost({
        summary: tracker.summary(),
        source: "generation",
        workspaceId: model.brand?.workspaceId ?? null,
      });
      const key = storageKeys.aiModel(model.id);
      await uploadBuffer(key, buffer, "image/png");
      await prisma.aiModel.update({
        where: { id: model.id },
        data: { storageKey: key, mimeType: "image/png", status: "READY" },
      });
      logger.info("model generated", { modelId: model.id });
      return { ok: true };
    } catch (e) {
      const msg = (e as Error).message?.slice(0, 300) ?? "unknown";
      await prisma.aiModel.update({
        where: { id: model.id },
        data: { status: "FAILED", error: msg },
      });
      throw e;
    }
  },
});
