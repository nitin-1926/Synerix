import { task, logger } from "@trigger.dev/sdk";
import { prisma } from "@/lib/db";
import { generateImageGemini } from "@/lib/image/gemini";
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
    const model = await prisma.aiModel.findUniqueOrThrow({ where: { id: payload.modelId } });
    await prisma.aiModel.update({
      where: { id: model.id },
      data: { status: "RUNNING", error: null },
    });
    try {
      const prompt = buildModelPrompt(model.description?.trim() || model.name);
      const buffer = await generateImageGemini({ prompt, aspect: "4:5" });
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
