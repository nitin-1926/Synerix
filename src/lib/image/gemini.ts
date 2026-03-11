/**
 * Nano Banana Pro (gemini-3-pro-image) via the DIRECT Gemini API.
 * Spike-verified (scripts/spikes/nano-banana-direct.ts): superior at placing an
 * exact product into a scene from a reference photo. Supports multi-reference
 * (product + logo) and aspect ratio control.
 */

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
  /** Output resolution (Pro supports 1K/2K/4K). Omitted by default so the model
   * uses its native size; set via the `size` param or env IMAGE_SIZE (mainly for
   * the Pro/hero tier). Forcing a size on the fast model can be rejected. */
  size?: GeminiImageSize;
}

export async function generateImageGemini(p: GeminiGenParams): Promise<Buffer> {
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!key) throw new Error("GOOGLE_GENERATIVE_AI_API_KEY missing");
  const model = p.model ?? GEMINI_IMAGE_MODEL;
  const size = p.size ?? (process.env.IMAGE_SIZE as GeminiImageSize | undefined);

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
      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), timeoutMs);
      let r: Response;
      try {
        r = await fetch(`${ENDPOINT}/${model}:generateContent?key=${key}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: ac.signal,
        });
      } catch (e) {
        if (ac.signal.aborted) throw new Error(`gemini-image timeout after ${timeoutMs}ms`);
        throw e;
      } finally {
        clearTimeout(timer);
      }
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

async function withRetry<T>(fn: () => Promise<T>, o: { label: string; attempts: number; baseDelayMs: number }): Promise<T> {
  let last: unknown;
  for (let i = 0; i < o.attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      const msg = (e as Error).message;
      const transient = /\b(429|5\d\d|overloaded|high demand|timeout|ETIMEDOUT|ECONNRESET|fetch failed)\b/i.test(msg);
      if (i === o.attempts - 1 || !transient) throw e;
      const wait = o.baseDelayMs * 2 ** i + Math.floor(Math.random() * 500);
      console.warn(`[retry:${o.label}] attempt ${i + 1}: ${msg.slice(0, 100)} — ${wait}ms`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw last;
}
