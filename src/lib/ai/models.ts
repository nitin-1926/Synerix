import { createAnthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import type { LanguageModel } from "ai";

// Some host environments leak a malformed ANTHROPIC_BASE_URL (e.g. the
// Claude-desktop runtime sets it WITHOUT the `/v1` segment), which makes the
// SDK POST to `/messages` → 404. Normalize so the version segment is always
// present; an unset var falls back to the SDK default (.../v1).
function normalizedAnthropicBaseURL(): string | undefined {
  const raw = process.env.ANTHROPIC_BASE_URL?.trim();
  if (!raw) return undefined;
  const noSlash = raw.replace(/\/+$/, "");
  return /\/v\d+$/.test(noSlash) ? noSlash : `${noSlash}/v1`;
}

const anthropic = createAnthropic({ baseURL: normalizedAnthropicBaseURL() });

// Model slots, overridable via env without touching code (floki pattern).
// Provider routing keys off the model-ID prefix ("claude-*" → Anthropic,
// "gemini-*" → Google), so any slot can swap providers freely.
export const MODELS = {
  // Brand ingestion
  classify: process.env.MODEL_CLASSIFY ?? "claude-haiku-4-5-20251001",
  brandDna: process.env.MODEL_BRAND_DNA ?? "gemini-2.5-flash",
  // Product dissection (vision)
  dissect: process.env.MODEL_DISSECT ?? "gemini-2.5-flash",
  // Generation pipeline — concepting is the creative brain of the product, so
  // it runs on the strongest available model (quality > cost, per owner call).
  concepts: process.env.MODEL_CONCEPTS ?? "claude-opus-4-8",
  // Brand Creative Intelligence research (Anthropic web_search server tool)
  research: process.env.MODEL_RESEARCH ?? "claude-sonnet-5",
  // Semantic brief QA: validates concept briefs against the occasion brief's
  // product rules before any image money is spent (repairs run on `concepts`).
  briefQa: process.env.MODEL_BRIEF_QA ?? "claude-sonnet-5",
  // Baked-typography QA (vision check on rendered headline text)
  textQa: process.env.MODEL_TEXT_QA ?? "gemini-2.5-flash",
} as const;

export const LIMITS = {
  maxCrawlUrls: Number(process.env.MAX_CRAWL_URLS ?? 12),
  maxConceptsPerRun: Number(process.env.MAX_CONCEPTS_PER_RUN ?? 4),
  maxConcurrentConcepts: Number(process.env.MAX_CONCURRENT_CONCEPTS ?? 4),
  dissectionPromptMaxChars: 400,
};

// Credits debited per action (2 credits = one generated creative).
export const CREDIT_COSTS = {
  perConcept: Number(process.env.CREDITS_PER_CREATIVE ?? 2),
  regenInstruction: Number(process.env.CREDITS_PER_CREATIVE ?? 2),
  signupGrant: Number(process.env.SIGNUP_CREDIT_GRANT ?? 0),
  // Prompt enhancement (Sonnet rewrite of a rough brief into an art-directed prompt)
  enhancePrompt: Number(process.env.CREDITS_ENHANCE_PROMPT ?? 0.25),
};

export function resolveLanguageModel(modelId: string): LanguageModel {
  if (modelId.startsWith("claude-")) return anthropic(modelId);
  if (modelId.startsWith("gemini-")) return google(modelId);
  throw new Error(`No provider for model id: ${modelId}`);
}
