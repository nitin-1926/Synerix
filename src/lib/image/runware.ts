import crypto from "node:crypto";

/**
 * Runware client — multi-model image generation abstraction.
 * Ported from labs-moodboard src/lib/flow/runware.ts; the reference-image
 * shape (`inputs.referenceImages`) is spike-verified (scripts/spikes/FINDINGS.md).
 */

const RUNWARE_ENDPOINT = "https://api.runware.ai/v1";

export type QualityTier = "1k" | "2k";
export type Aspect = "1:1" | "4:5" | "9:16" | "16:9";

export const IMAGE_MODELS: Record<string, string> = {
  nano_banana_pro: process.env.RUNWARE_MODEL_NANO_BANANA_PRO ?? "google:4@2",
  seedream_v4: process.env.RUNWARE_MODEL_SEEDREAM_V4 ?? "bytedance:5@0",
  seedream_v5_lite: process.env.RUNWARE_MODEL_SEEDREAM_V5_LITE ?? "bytedance:seedream@5.0-lite",
  // Cheaper Chinese models (Alibaba) for cost A/B on simpler use cases; both
  // accept reference images via inputs.referenceImages (garment/product fidelity).
  qwen_image: process.env.RUNWARE_MODEL_QWEN_IMAGE ?? "runware:108@1",
  wan_2_7: process.env.RUNWARE_MODEL_WAN ?? "alibaba:wan@2.7-image",
};

const NO_NEGATIVE_PROMPT = new Set([
  "bytedance:5@0",
  "bytedance:seedream@5.0-lite",
  "google:4@2",
  "runware:108@1",
  "alibaba:wan@2.7-image",
]);

const DIM_TABLE: Record<string, Record<QualityTier, Record<Aspect, { width: number; height: number }>>> = {
  "bytedance:5@0": {
    "1k": {
      "1:1": { width: 1024, height: 1024 },
      "4:5": { width: 1024, height: 1280 },
      "9:16": { width: 1024, height: 1792 },
      "16:9": { width: 1792, height: 1024 },
    },
    "2k": {
      "1:1": { width: 2048, height: 2048 },
      "4:5": { width: 1664, height: 2496 },
      "9:16": { width: 1440, height: 2560 },
      "16:9": { width: 2560, height: 1440 },
    },
  },
  "bytedance:seedream@5.0-lite": {
    "1k": {
      "1:1": { width: 2048, height: 2048 },
      "4:5": { width: 1728, height: 2304 },
      "9:16": { width: 1600, height: 2848 },
      "16:9": { width: 2848, height: 1600 },
    },
    "2k": {
      "1:1": { width: 2048, height: 2048 },
      "4:5": { width: 1728, height: 2304 },
      "9:16": { width: 1600, height: 2848 },
      "16:9": { width: 2848, height: 1600 },
    },
  },
  "google:4@2": {
    "1k": {
      "1:1": { width: 1024, height: 1024 },
      "4:5": { width: 928, height: 1152 },
      "9:16": { width: 848, height: 1264 },
      "16:9": { width: 1264, height: 848 },
    },
    "2k": {
      "1:1": { width: 1024, height: 1024 },
      "4:5": { width: 928, height: 1152 },
      "9:16": { width: 848, height: 1264 },
      "16:9": { width: 1264, height: 848 },
    },
  },
};

function modelDimensions(modelId: string, quality: QualityTier, aspect: Aspect) {
  return DIM_TABLE[modelId]?.[quality]?.[aspect] ?? DIM_TABLE["bytedance:5@0"]["2k"][aspect];
}

export interface GenerateImageParams {
  prompt: string;
  negativePrompt?: string;
  /** Key in IMAGE_MODELS or a raw Runware model id. */
  modelKey: string;
  aspect: Aspect;
  quality?: QualityTier;
  /** Data URIs or https URLs, 128-2048px. */
  referenceImages?: string[];
}

export interface GenerateImageResult {
  imageUrl: string;
  modelId: string;
  taskUUID: string;
}

export async function generateImage(p: GenerateImageParams): Promise<GenerateImageResult> {
  const apiKey = process.env.RUNWARE_API_KEY;
  if (!apiKey) throw new Error("RUNWARE_API_KEY missing");
  const modelId = IMAGE_MODELS[p.modelKey] ?? p.modelKey;
  const taskUUID = crypto.randomUUID();
  const { width, height } = modelDimensions(modelId, p.quality ?? "1k", p.aspect);

  const task: Record<string, unknown> = {
    taskType: "imageInference",
    taskUUID,
    positivePrompt: p.prompt,
    model: modelId,
    width,
    height,
    numberResults: 1,
    outputType: "URL",
    outputFormat: "PNG",
  };
  if (p.negativePrompt) {
    if (NO_NEGATIVE_PROMPT.has(modelId)) {
      task.positivePrompt = `${p.prompt}\n\nAvoid: ${p.negativePrompt}`.slice(0, 9000);
    } else {
      task.negativePrompt = p.negativePrompt;
    }
  }
  if (p.referenceImages?.length) {
    task.inputs = { referenceImages: p.referenceImages };
  }

  const imageUrl = await withRetry(
    async () => {
      const r = await fetch(RUNWARE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify([task]),
      });
      const text = await r.text();
      if (!r.ok) throw new Error(`runware ${r.status}: ${text.slice(0, 500)}`);
      const body = JSON.parse(text) as {
        data?: Array<{ taskUUID: string; imageURL?: string }>;
        errors?: Array<{ message: string }>;
      };
      if (body.errors?.length) throw new Error(`runware error: ${body.errors.map((e) => e.message).join("; ")}`);
      const item = body.data?.find((d) => d.taskUUID === taskUUID) ?? body.data?.[0];
      if (!item?.imageURL) throw new Error("runware response missing imageURL");
      return item.imageURL;
    },
    { label: `runware:${modelId}`, attempts: 4, baseDelayMs: 1500 },
  );

  return { imageUrl, modelId, taskUUID };
}

const BG_REMOVAL_MODEL = process.env.RUNWARE_MODEL_BG_REMOVAL ?? "runware:109@1"; // RemBG 1.4

export interface RemoveBackgroundResult {
  imageUrl: string;
  /** USD cost reported by Runware (includeCost). */
  cost: number;
  modelId: string;
}

/** Remove the background from an image (transparent PNG result). Input is a
 * data URI or https URL. Callers flatten/compose the alpha as they need. */
export async function removeBackground(image: string): Promise<RemoveBackgroundResult> {
  const apiKey = process.env.RUNWARE_API_KEY;
  if (!apiKey) throw new Error("RUNWARE_API_KEY missing");
  const taskUUID = crypto.randomUUID();

  const task = {
    taskType: "removeBackground",
    taskUUID,
    model: BG_REMOVAL_MODEL,
    outputType: "URL",
    outputFormat: "PNG",
    includeCost: true,
    inputs: { image },
  };

  const result = await withRetry(
    async () => {
      const r = await fetch(RUNWARE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify([task]),
      });
      const text = await r.text();
      if (!r.ok) throw new Error(`runware ${r.status}: ${text.slice(0, 500)}`);
      const body = JSON.parse(text) as {
        data?: Array<{ taskUUID: string; imageURL?: string; cost?: number }>;
        errors?: Array<{ message: string }>;
      };
      if (body.errors?.length) throw new Error(`runware error: ${body.errors.map((e) => e.message).join("; ")}`);
      const item = body.data?.find((d) => d.taskUUID === taskUUID) ?? body.data?.[0];
      if (!item?.imageURL) throw new Error("runware removeBackground response missing imageURL");
      return { imageUrl: item.imageURL, cost: item.cost ?? 0 };
    },
    { label: `runware:bg-removal`, attempts: 4, baseDelayMs: 1500 },
  );

  return { ...result, modelId: BG_REMOVAL_MODEL };
}

export async function downloadImage(url: string): Promise<Buffer> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`image download failed ${r.status}`);
  return Buffer.from(await r.arrayBuffer());
}

export function bufferToDataUri(buf: Buffer, mime = "image/png"): string {
  return `data:${mime};base64,${buf.toString("base64")}`;
}

async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { attempts: number; baseDelayMs: number; label: string },
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < opts.attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const msg = (e as Error).message;
      const transient = /\b(429|5\d\d|timeout|ETIMEDOUT|ECONNRESET|fetch failed)\b/i.test(msg);
      if (i === opts.attempts - 1 || !transient) throw e;
      const wait = opts.baseDelayMs * Math.pow(2, i) + Math.floor(Math.random() * 400);
      console.warn(`[retry:${opts.label}] attempt ${i + 1} failed (${msg.slice(0, 120)}) — ${wait}ms`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastErr;
}
