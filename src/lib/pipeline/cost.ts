/**
 * Cost instrumentation for the generation pipeline.
 *
 * Prices are USD and OVERRIDABLE via env (they drift). Defaults reflect
 * public list prices around mid-2026 — treat as estimates, not invoices.
 * LLM prices are per 1,000,000 tokens; image prices are per generated image.
 */

export interface ModelPrice {
  in: number; // USD per 1M input tokens
  out: number; // USD per 1M output tokens
}

const num = (env: string | undefined, fallback: number) =>
  env !== undefined && env !== "" && !Number.isNaN(Number(env)) ? Number(env) : fallback;

export const LLM_PRICING: Record<string, ModelPrice> = {
  "claude-opus-4-8": { in: num(process.env.PRICE_OPUS_IN, 5), out: num(process.env.PRICE_OPUS_OUT, 25) },
  "claude-sonnet-5": { in: num(process.env.PRICE_SONNET_IN, 3), out: num(process.env.PRICE_SONNET_OUT, 15) },
  "claude-sonnet-4-6": { in: num(process.env.PRICE_SONNET_IN, 3), out: num(process.env.PRICE_SONNET_OUT, 15) },
  "claude-haiku-4-5-20251001": { in: num(process.env.PRICE_HAIKU_IN, 1), out: num(process.env.PRICE_HAIKU_OUT, 5) },
  "gemini-2.5-flash": { in: num(process.env.PRICE_GEMINI_FLASH_IN, 0.3), out: num(process.env.PRICE_GEMINI_FLASH_OUT, 2.5) },
};

// Per generated image, keyed by model id (Runware ids and direct-API ids).
export const IMAGE_PRICING: Record<string, number> = {
  "bytedance:5@0": num(process.env.PRICE_SEEDREAM_V4, 0.03), // Seedream V4 (Runware)
  "bytedance:seedream@5.0-lite": num(process.env.PRICE_SEEDREAM_V5_LITE, 0.026),
  "google:4@2": num(process.env.PRICE_NANO_BANANA_PRO, 0.06), // Nano Banana Pro (Runware)
  "bfl:5@1": num(process.env.PRICE_FLUX2_PRO, 0.05),
  "gemini-3-pro-image": num(process.env.PRICE_NANO_BANANA_PRO_DIRECT, 0.134), // Nano Banana Pro (direct, 1K-2K)
  "gemini-3.1-flash-image": num(process.env.PRICE_NANO_BANANA_2_DIRECT, 0.06), // Nano Banana 2 (direct, default)
  "gpt-image-2": num(process.env.PRICE_GPT_IMAGE_2, 0.08),
};
const IMAGE_PRICE_DEFAULT = num(process.env.PRICE_IMAGE_DEFAULT, 0.04);

/** Normalize AI SDK usage across versions (inputTokens vs promptTokens). */
export interface RawUsage {
  inputTokens?: number;
  outputTokens?: number;
  promptTokens?: number;
  completionTokens?: number;
}
function normalizeUsage(u: RawUsage | undefined): { input: number; output: number } {
  return {
    input: u?.inputTokens ?? u?.promptTokens ?? 0,
    output: u?.outputTokens ?? u?.completionTokens ?? 0,
  };
}

export interface LLMCostEntry {
  stage: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  usd: number;
}
export interface ImageCostEntry {
  stage: string;
  model: string;
  usd: number;
}

export interface CostSummary {
  totalUSD: number;
  llmUSD: number;
  imageUSD: number;
  imageCount: number;
  llm: LLMCostEntry[];
  images: ImageCostEntry[];
}

export class CostTracker {
  private llm: LLMCostEntry[] = [];
  private images: ImageCostEntry[] = [];

  addLLM(model: string, usage: RawUsage | undefined, stage: string) {
    const { input, output } = normalizeUsage(usage);
    const price = LLM_PRICING[model] ?? { in: 0, out: 0 };
    const usd = (input / 1e6) * price.in + (output / 1e6) * price.out;
    this.llm.push({ stage, model, inputTokens: input, outputTokens: output, usd });
  }

  addImage(modelId: string, stage: string) {
    const usd = IMAGE_PRICING[modelId] ?? IMAGE_PRICE_DEFAULT;
    this.images.push({ stage, model: modelId, usd });
  }

  summary(): CostSummary {
    const llmUSD = this.llm.reduce((s, e) => s + e.usd, 0);
    const imageUSD = this.images.reduce((s, e) => s + e.usd, 0);
    return {
      totalUSD: round(llmUSD + imageUSD),
      llmUSD: round(llmUSD),
      imageUSD: round(imageUSD),
      imageCount: this.images.length,
      llm: this.llm.map((e) => ({ ...e, usd: round(e.usd) })),
      images: this.images.map((e) => ({ ...e, usd: round(e.usd) })),
    };
  }
}

const round = (n: number) => Math.round(n * 1e6) / 1e6;
