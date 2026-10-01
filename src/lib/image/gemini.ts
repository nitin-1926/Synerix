/**
 * Nano Banana Pro (gemini-3-pro-image) via the DIRECT Gemini API.
 * Spike-verified (scripts/spikes/, removed in c7b7796): superior at placing an
 * exact product into a scene from a reference photo. Supports multi-reference
 * (product + logo) and aspect ratio control.
 */

import { withRetry } from "./retry";

const GEMINI_IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL ?? "gemini-3-pro-image";
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";

export type GeminiAspect = "1:1" | "4:5" | "9:16" | "16:9";

export interface GeminiReference {
  buffer: Buffer;
  mime: string;
}

export type GeminiImageSize = "1K" | "2K" | "4K";

export interface GeminiGenParams {
  prompt: string;
  /** Reference images (e.g. the product photo) sent before the prompt. */
  references?: GeminiReference[];
  aspect: GeminiAspect;
  /** Model id override (e.g. Nano Banana 2 vs Pro). Defaults to env/Pro. */
  model?: string;
}

export async function generateImageGemini(p: GeminiGenParams): Promise<Buffer> {
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!key) throw new Error("GOOGLE_GENERATIVE_AI_API_KEY missing");
  const model = p.model ?? GEMINI_IMAGE_MODEL;
  // Output resolution (Pro supports 1K/2K/4K). Unset by default so the model
  // uses its native size; env IMAGE_SIZE forces one (mainly for the Pro/hero
  // tier). Forcing a size on the fast model can be rejected.
  const size = process.env.IMAGE_SIZE as GeminiImageSize | undefined;

  const parts: unknown[] = [];
  for (const ref of p.references ?? []) {
    parts.push({ inline_data: { mime_type: ref.mime, data: ref.buffer.toString("base64") } });
  }
  parts.push({ text: p.prompt });

  const body = {
    contents: [{ parts }],
    generationConfig: {
      responseModalities: ["IMAGE"],
      imageConfig: { aspectRatio: p.aspect, ...(size ? { imageSize: size } : {}) },
    },
  };

  // Per-request timeout so a hung connection fails fast and lets the provider
  // fallback chain proceed, instead of blocking for minutes. Env-overridable.
  const timeoutMs = Number(process.env.IMAGE_REQUEST_TIMEOUT_MS ?? 90_000);

  return withRetry(
    async () => {
      // Aborts with a TimeoutError ("...aborted due to timeout"), which
      // withRetry classifies as transient.
      const r = await fetch(`${ENDPOINT}/${model}:generateContent?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      });
      const text = await r.text();
      if (!r.ok) throw new Error(`gemini-image ${r.status}: ${text.slice(0, 400)}`);
      const json = JSON.parse(text) as {
        candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { data?: string }; inline_data?: { data?: string } }> } }>;
      };
      const out = json.candidates?.[0]?.content?.parts ?? [];
      const img = out.find((x) => x.inlineData?.data || x.inline_data?.data);
      const data = img?.inlineData?.data ?? img?.inline_data?.data;
      if (!data) throw new Error(`gemini-image: no image in response: ${text.slice(0, 300)}`);
      return Buffer.from(data, "base64");
    },
    { label: "gemini-image", attempts: 3, baseDelayMs: 2000 },
  );
}

