/**
 * Unified image-generation provider router. Default = Nano Banana Pro (Gemini
 * direct). Seedream (Runware) available as a cheap draft; GPT Image 2 (OpenAI
 * direct) selectable for label-heavy packs. Swappable via env / per-call.
 */
import sharp from "sharp";
import { generateImageGemini, type GeminiAspect } from "./gemini";
import { generateImage as generateRunware, downloadImage, type Aspect } from "./runware";
import { ASPECT_DIMENSIONS } from "@/lib/composition/types";

/** gpt-image-2 PNGs ship C2PA content-credential chunks that @napi-rs/canvas
 * cannot decode (its fallback throws "Invalid SVG image" downstream in the
 * compositor). Re-encode through sharp → clean, universally readable PNG. */
async function normalizePng(buf: Buffer): Promise<Buffer> {
  return sharp(buf).png().toBuffer();
}

export type ImageProvider = "gemini" | "seedream" | "gpt-image-2";
/** Gemini quality tier: hero = Nano Banana Pro (max fidelity / 4K — the
 *  cascade's primary); default = Nano Banana 2 (cheap, fast backup/draft). */
export type ImageTier = "default" | "hero";
export type SceneAspect = GeminiAspect;

export interface SceneGenParams {
  prompt: string;
  aspect: SceneAspect;
  /** Reference images (product/model photos); all providers in the chain use them. */
  references?: Array<{ buffer: Buffer; mime: string }>;
  /** Force a single provider (no fallback) — manual override / testing. */
  provider?: ImageProvider;
  /** With `provider`: try it FIRST but keep the fallback chain behind it
   * (user model preference — a paid run should survive a provider outage). */
  softPrefer?: boolean;
  /** Gemini model tier; defaults to Nano Banana 2. */
  tier?: ImageTier;
  /** With `provider: "seedream"` (Runware): which Runware model id/key to use.
   * Defaults to Seedream v4. Lets one provider expose several Runware models. */
  runwareModel?: string;
  negativePrompt?: string;
}

export interface SceneGenResult {
  buffer: Buffer;
  provider: ImageProvider;
  /** Cost key for the cost tracker — the actual model id used. */
  costModel: string;
}

// Gemini tiers (env-overridable). "hero" = Nano Banana Pro (max fidelity —
// leads the fallback cascade; creative quality over cost per owner decision);
// "default" = Nano Banana 2 (fast/cheap — mid-cascade backup and explicit
// draft-tier calls). Text is never baked into the image — it's composited by
// the canvas overlay.
const GEMINI_MODEL = {
  default: process.env.GEMINI_IMAGE_MODEL_FAST ?? "gemini-3.1-flash-image", // Nano Banana 2
  hero: process.env.GEMINI_IMAGE_MODEL ?? "gemini-3-pro-image", // Nano Banana Pro
} as const;

/** Admin bake-off lineup: each concept renders once per variant (forced
 * provider, NO fallback — a variant that fails is a data point, not a reroute).
 * Crown a winner, then pin it via IMAGE_PROVIDER / GEMINI_IMAGE_MODEL_FAST. */
export interface BakeoffVariant {
  key: string;
  provider: ImageProvider;
  tier: ImageTier;
  /** For seedream/Runware variants: the specific Runware model key. */
  runwareModel?: string;
}
export const BAKEOFF_VARIANTS: BakeoffVariant[] = [
  { key: "nb2", provider: "gemini", tier: "default" },
  { key: "nb-pro", provider: "gemini", tier: "hero" },
  { key: "gpt-image-2", provider: "gpt-image-2", tier: "default" },
  { key: "seedream", provider: "seedream", tier: "default" },
];

/** User-facing image-model picker (create form). Premium models only —
 * quality over cost per owner decision. "compare" renders every concept on
 * BOTH models (double credits) so outputs are comparable side by side. */
export type ImageModelPref = "nb-pro" | "gpt-image-2" | "compare";
export const IMAGE_MODEL_PREFS: { id: ImageModelPref; label: string; hint: string }[] = [
  { id: "nb-pro", label: "Nano Banana Pro", hint: "Best pack & label fidelity" },
  { id: "gpt-image-2", label: "GPT Image 2", hint: "Alternative premium render" },
  { id: "compare", label: "Both — compare", hint: "Every option on both models · 2× credits" },
];

const PREF_VARIANT: Record<Exclude<ImageModelPref, "compare">, BakeoffVariant> = {
  "nb-pro": { key: "nb-pro", provider: "gemini", tier: "hero" },
  "gpt-image-2": { key: "gpt-image-2", provider: "gpt-image-2", tier: "hero" },
};

/** Resolve a stored pref into render variants. Single picks keep NO variant
 * key (clean status ids) and allow provider fallback — a paid run should
 * survive an outage; the pick is a preference, not a lab condition. Compare
 * runs force each provider (comparison integrity; failed slots refund). */
export function variantsForPref(pref: string | null | undefined): Array<BakeoffVariant & { soft?: boolean }> | [undefined] {
  if (pref === "compare") return [PREF_VARIANT["nb-pro"], PREF_VARIANT["gpt-image-2"]];
  if (pref === "nb-pro" || pref === "gpt-image-2") return [{ ...PREF_VARIANT[pref], key: "", soft: true }];
  return [undefined]; // legacy runs (pre-picker): default chain
}

/**
 * Super-admin workspace image-model picker. Each key maps to a render variant
 * (provider + tier, and a Runware model for the seedream provider). The chosen
 * model becomes the workspace's leading pick with the full fallback cascade kept
 * behind it (a paid run must survive an outage), so this is a quality/cost knob,
 * not a hard pin. `null` (no selection) = the default quality-first cascade.
 */
export interface WorkspaceImageModel {
  key: string;
  label: string;
  hint: string;
  variant: BakeoffVariant;
}
export const WORKSPACE_IMAGE_MODELS: WorkspaceImageModel[] = [
  { key: "nb-pro", label: "Nano Banana Pro", hint: "Premium · best pack & label fidelity", variant: { key: "nb-pro", provider: "gemini", tier: "hero" } },
  { key: "nb2", label: "Nano Banana 2", hint: "Cheaper Google · fast, great for simple shots", variant: { key: "nb2", provider: "gemini", tier: "default" } },
  { key: "gpt-image-2", label: "GPT Image 2", hint: "Premium alternative render", variant: { key: "gpt-image-2", provider: "gpt-image-2", tier: "hero" } },
  { key: "seedream-v4", label: "Seedream v4", hint: "Runware · strong & inexpensive", variant: { key: "seedream-v4", provider: "seedream", tier: "default", runwareModel: "seedream_v4" } },
  { key: "seedream-v5-lite", label: "Seedream v5 Lite", hint: "Runware · cheapest Seedream", variant: { key: "seedream-v5-lite", provider: "seedream", tier: "default", runwareModel: "seedream_v5_lite" } },
  { key: "qwen-image", label: "Qwen-Image", hint: "Alibaba (Runware) · cheap, good text", variant: { key: "qwen-image", provider: "seedream", tier: "default", runwareModel: "qwen_image" } },
  { key: "wan-2.7", label: "Wan 2.7", hint: "Alibaba (Runware) · cheap, reference-aware", variant: { key: "wan-2.7", provider: "seedream", tier: "default", runwareModel: "wan_2_7" } },
];

/** Resolve a stored workspace image-model key into a leading soft-prefer variant
 * (keeps the fallback cascade behind it). Unknown/null key → cascade default. */
export function resolveWorkspaceImageModel(
  key: string | null | undefined,
): (BakeoffVariant & { soft: true }) | undefined {
  const model = WORKSPACE_IMAGE_MODELS.find((m) => m.key === key);
  if (!model) return undefined;
  // Clear the variant key so status ids stay clean (single pick, not a bake-off).
  return { ...model.variant, key: "", soft: true };
}

/** Friendly display names for cost-model ids (UI badges). */
export const IMAGE_MODEL_LABELS: Record<string, string> = {
  "gemini-3.1-flash-image": "Nano Banana 2",
  "gemini-3-pro-image": "Nano Banana Pro",
  "gpt-image-2": "GPT Image 2",
  "bytedance:5@0": "Seedream v4",
  "bytedance:seedream@5.0-lite": "Seedream v5 Lite",
  "runware:108@1": "Qwen-Image",
  "alibaba:wan@2.7-image": "Wan 2.7",
};

/** One attempt in the resilience cascade: a provider at a specific tier. */
export interface ChainStep {
  provider: ImageProvider;
  tier: ImageTier;
  /** For seedream/Runware steps: the specific Runware model key. */
  runwareModel?: string;
}

// Resilience cascade, quality-first (owner decision: creative quality over
// cost): Nano Banana Pro → GPT Image 2 → Nano Banana 2 → Seedream. Every
// provider accepts multi-image references, so on-model fusion survives a
// fallback. Each provider retries transient errors internally (see gemini.ts
// withRetry); the chain only advances on a PERSISTENT failure. Set
// IMAGE_PROVIDER to pin a single provider, or pass `provider` per call.
const FALLBACK_CHAIN: ChainStep[] = [
  { provider: "gemini", tier: "hero" }, // Nano Banana Pro — primary
  { provider: "gpt-image-2", tier: "hero" }, // GPT Image 2 — premium alternative
  { provider: "gemini", tier: "default" }, // Nano Banana 2 — fast backup
  { provider: "seedream", tier: "default" }, // Seedream — last resort
];
const FORCED_PROVIDER = process.env.IMAGE_PROVIDER as ImageProvider | undefined;

/** Resolve the ordered list of attempts for a request. Exported for tests —
 * the chain order is a product guarantee, not an implementation detail. */
export function resolveSceneChain(p: Pick<SceneGenParams, "provider" | "softPrefer" | "tier" | "runwareModel">): ChainStep[] {
  const tier = p.tier ?? "default";
  if (p.provider) {
    const pick: ChainStep = { provider: p.provider, tier, runwareModel: p.runwareModel };
    if (!p.softPrefer) return [pick]; // forced: single attempt, no fallback
    // Soft preference: the pick leads, the full cascade stays behind it.
    return [pick, ...FALLBACK_CHAIN.filter((s) => !(s.provider === pick.provider && s.tier === pick.tier))];
  }
  if (FORCED_PROVIDER) return [{ provider: FORCED_PROVIDER, tier }];
  return FALLBACK_CHAIN;
}

async function runProvider(step: ChainStep, p: SceneGenParams): Promise<SceneGenResult> {
  const { provider, tier } = step;
  if (provider === "gemini") {
    const model = GEMINI_MODEL[tier];
    const buffer = await generateImageGemini({ prompt: p.prompt, aspect: p.aspect, references: p.references, model });
    return { buffer, provider, costModel: model };
  }

  if (provider === "gpt-image-2") {
    return { buffer: await generateGptImage2(p), provider, costModel: "gpt-image-2" };
  }

  // seedream / other Runware models. The step carries the specific Runware model
  // key (so a fallback step never inherits the leading pick's model). Reference
  // images passed as data URIs.
  const refUris = (p.references ?? []).map((r) => `data:${r.mime};base64,${r.buffer.toString("base64")}`);
  const res = await generateRunware({
    prompt: p.prompt,
    negativePrompt: p.negativePrompt,
    modelKey: step.runwareModel ?? "seedream_v4",
    aspect: p.aspect as Aspect,
    quality: "1k",
    referenceImages: refUris.length ? refUris : undefined,
  });
  return { buffer: await downloadImage(res.imageUrl), provider, costModel: res.modelId };
}

/**
 * Generate a scene with automatic fallback. Tries each provider in the chain;
 * returns the first success. A single forced provider (param or IMAGE_PROVIDER)
 * disables fallback.
 */
// Hard ceiling per provider attempt so a hung provider can't stall the run; on
// timeout we move to the next provider in the chain. Slightly above the
// per-request fetch timeout in gemini.ts to allow its internal retries.
const PROVIDER_TIMEOUT_MS = Number(process.env.IMAGE_PROVIDER_TIMEOUT_MS ?? 150_000);

function withDeadline<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}

export async function generateScene(p: SceneGenParams): Promise<SceneGenResult> {
  const chain = resolveSceneChain(p);
  const errors: string[] = [];
  for (const step of chain) {
    const label =
      step.provider === "gemini"
        ? `${step.provider}/${step.tier}`
        : step.provider === "seedream" && step.runwareModel
          ? `runware/${step.runwareModel}`
          : step.provider;
    try {
      return await withDeadline(runProvider(step, p), PROVIDER_TIMEOUT_MS, `provider "${label}"`);
    } catch (e) {
      const msg = (e as Error).message ?? String(e);
      errors.push(`${label}: ${msg.slice(0, 160)}`);
      if (chain.length > 1) {
        console.warn(`[image] provider "${label}" failed; falling back. ${msg.slice(0, 140)}`);
      }
    }
  }
  throw new Error(`All image providers failed — ${errors.join(" | ")}`);
}

/** OpenAI GPT Image 2 (direct). Uses the edit endpoint when a reference is
 * provided (best packaging fidelity), else generation. Transient failures retry
 * internally so a single 429/5xx doesn't fail the variant — matching the
 * gemini/runware providers (a forced/compare pick has NO cross-provider
 * fallback, so this in-provider retry is its only resilience). */
async function generateGptImage2(p: SceneGenParams): Promise<Buffer> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY missing (required for gpt-image-2)");
  const size = closestGptSize(p.aspect);

  const attempt = async (): Promise<Buffer> => {
    if (p.references?.length) {
      const form = new FormData();
      form.append("model", "gpt-image-2");
      form.append("prompt", p.prompt);
      form.append("size", size);
      // NOTE: no `input_fidelity` — gpt-image-1's fidelity knob was removed in
      // gpt-image-2 (the edits endpoint 400s on it; high fidelity is built in).
      p.references.forEach((r, i) => {
        form.append("image[]", new Blob([new Uint8Array(r.buffer)], { type: r.mime }), `ref-${i}.png`);
      });
      const r = await fetch("https://api.openai.com/v1/images/edits", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}` },
        body: form,
      });
      const text = await r.text();
      if (!r.ok) throw new Error(`gpt-image-2 edit ${r.status}: ${text.slice(0, 300)}`);
      const b64 = JSON.parse(text).data?.[0]?.b64_json;
      if (!b64) throw new Error("gpt-image-2: no image");
      return normalizePng(Buffer.from(b64, "base64"));
    }

    const r = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gpt-image-2", prompt: p.prompt, size }),
    });
    const text = await r.text();
    if (!r.ok) throw new Error(`gpt-image-2 ${r.status}: ${text.slice(0, 300)}`);
    const b64 = JSON.parse(text).data?.[0]?.b64_json;
    if (!b64) throw new Error("gpt-image-2: no image");
    return normalizePng(Buffer.from(b64, "base64"));
  };

  return withRetry(attempt, { label: "gpt-image-2", attempts: 3, baseDelayMs: 2000 });
}

async function withRetry<T>(fn: () => Promise<T>, o: { label: string; attempts: number; baseDelayMs: number }): Promise<T> {
  let last: unknown;
  for (let i = 0; i < o.attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      const msg = (e as Error).message ?? String(e);
      const transient = /\b(429|5\d\d|overloaded|high demand|timeout|ETIMEDOUT|ECONNRESET|fetch failed)\b/i.test(msg);
      if (i === o.attempts - 1 || !transient) throw e;
      const wait = o.baseDelayMs * 2 ** i + Math.floor(Math.random() * 500);
      console.warn(`[retry:${o.label}] attempt ${i + 1}: ${msg.slice(0, 100)} — ${wait}ms`);
      await new Promise((res) => setTimeout(res, wait));
    }
  }
  throw last;
}

/**
 * OpenAI gpt-image only offers three output sizes; it CANNOT render 4:5 or 9:16
 * natively. Rather than hand-maintain a size map that silently drifts from the
 * compositor's ASPECT_DIMENSIONS (they did — both 4:5 and 9:16 mapped to 2:3),
 * derive the CLOSEST supported size from the single source of truth. The
 * residual ratio gap is absorbed by the compositor's subject-anchored crop
 * (OverlaySpec.plateFocusY). See provider.test.ts for the invariant.
 */
const GPT_SUPPORTED_SIZES = [
  { size: "1024x1024", ratio: 1024 / 1024 },
  { size: "1024x1536", ratio: 1024 / 1536 }, // portrait 2:3
  { size: "1536x1024", ratio: 1536 / 1024 }, // landscape 3:2
] as const;

export function closestGptSize(aspect: SceneAspect): string {
  const d = ASPECT_DIMENSIONS[aspect] ?? ASPECT_DIMENSIONS["4:5"];
  const target = d.width / d.height;
  return GPT_SUPPORTED_SIZES.reduce((best, s) =>
    Math.abs(s.ratio - target) < Math.abs(best.ratio - target) ? s : best,
  ).size;
}
