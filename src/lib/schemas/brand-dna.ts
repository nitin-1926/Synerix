import { z } from "zod";

/**
 * Brand DNA for SMB brands (sweets shops, boutiques, agri/FMCG — not just SaaS).
 *
 * Two schemas (floki's lesson): a PERMISSIVE schema for the LLM (Gemini
 * structured output rejects regex / string min-max and fails the whole object
 * on one bad enum), and a normalizer that coerces it into the clean storage
 * shape. Stored whole in Brand.dna (JSONB); hot fields promoted to columns.
 */

const HEX = /^#[0-9a-fA-F]{6}$/;

// ---- LLM-facing schema: lenient, Gemini-structured-output friendly ----
export const brandDnaLLMSchema = z.object({
  identity: z.object({
    name: z.string().nullable().optional(),
    one_line: z.string().nullable().optional(),
    category: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    founded_hint: z.string().nullable().optional(),
  }),
  positioning: z.object({
    promise: z.string().nullable().optional(),
    differentiators: z.array(z.string()).nullable().optional(),
    price_band: z.string().nullable().optional(),
  }),
  audience: z.object({
    target_customer: z.string().nullable().optional(),
    occasions: z.array(z.string()).nullable().optional(),
  }),
  visual_identity: z.object({
    primary_color: z.string().nullable().optional(),
    secondary_colors: z.array(z.string()).nullable().optional(),
    accent_colors: z.array(z.string()).nullable().optional(),
    typography_style: z.string().nullable().optional(),
    photography_style: z.string().nullable().optional(),
    logo_treatment: z.string().nullable().optional(),
  }),
  voice: z.object({
    register: z.string().nullable().optional(),
    signature_phrases: z.array(z.string()).nullable().optional(),
    languages_seen: z.array(z.string()).nullable().optional(),
  }),
  offering: z.object({
    primary_products: z.array(z.string()).nullable().optional(),
    services: z.array(z.string()).nullable().optional(),
    delivery_or_booking: z.string().nullable().optional(),
  }),
  motto: z.string().nullable().optional(),
});

export type BrandDnaRaw = z.infer<typeof brandDnaLLMSchema>;

// ---- Clean storage shape ----
const TYPOGRAPHY = ["geometric_sans", "humanist_sans", "serif", "slab", "display", "mixed", "unknown"] as const;
const PHOTOGRAPHY = ["studio_product", "lifestyle", "documentary", "editorial", "festive_traditional", "none", "mixed"] as const;
const REGISTER = ["warm_familiar", "playful", "premium_refined", "traditional_respectful", "confident", "plainspoken"] as const;
const PRICE_BAND = ["budget", "mid", "premium", "luxury", "unknown"] as const;

export interface BrandDna {
  identity: { name: string; one_line: string; category: string; city: string | null; founded_hint: string | null };
  positioning: { promise: string | null; differentiators: string[]; price_band: (typeof PRICE_BAND)[number] };
  audience: { target_customer: string | null; occasions: string[] };
  visual_identity: {
    primary_color: string | null;
    secondary_colors: string[];
    accent_colors: string[];
    typography_style: (typeof TYPOGRAPHY)[number];
    photography_style: (typeof PHOTOGRAPHY)[number];
    logo_treatment: string;
  };
  voice: { register: (typeof REGISTER)[number]; signature_phrases: string[]; languages_seen: string[] };
  offering: { primary_products: string[]; services: string[]; delivery_or_booking: string | null };
  motto: string | null;
}

const oneOf = <T extends readonly string[]>(opts: T, v: string | null | undefined, fallback: T[number]): T[number] =>
  v && (opts as readonly string[]).includes(v) ? (v as T[number]) : fallback;
const hex = (v: string | null | undefined): string | null => (v && HEX.test(v.trim()) ? v.trim().toLowerCase() : null);
const hexes = (arr: (string | null)[] | null | undefined): string[] =>
  (arr ?? []).map((c) => hex(c)).filter((c): c is string => Boolean(c));
const strs = (arr: (string | null)[] | null | undefined, cap = 12): string[] =>
  (arr ?? []).filter((s): s is string => Boolean(s && s.trim())).slice(0, cap);

/** Coerce a lenient LLM object into the clean storage shape. Never throws. */
export function normalizeBrandDna(raw: BrandDnaRaw, fallbackName: string): BrandDna {
  return {
    identity: {
      name: raw.identity?.name?.trim() || fallbackName,
      one_line: (raw.identity?.one_line ?? "").slice(0, 200),
      category: raw.identity?.category ?? "",
      city: raw.identity?.city ?? null,
      founded_hint: raw.identity?.founded_hint ?? null,
    },
    positioning: {
      promise: raw.positioning?.promise ?? null,
      differentiators: strs(raw.positioning?.differentiators, 5),
      price_band: oneOf(PRICE_BAND, raw.positioning?.price_band, "unknown"),
    },
    audience: {
      target_customer: raw.audience?.target_customer ?? null,
      occasions: strs(raw.audience?.occasions),
    },
    visual_identity: {
      primary_color: hex(raw.visual_identity?.primary_color),
      secondary_colors: hexes(raw.visual_identity?.secondary_colors),
      accent_colors: hexes(raw.visual_identity?.accent_colors),
      typography_style: oneOf(TYPOGRAPHY, raw.visual_identity?.typography_style, "unknown"),
      photography_style: oneOf(PHOTOGRAPHY, raw.visual_identity?.photography_style, "none"),
      logo_treatment: raw.visual_identity?.logo_treatment ?? "unknown",
    },
    voice: {
      register: oneOf(REGISTER, raw.voice?.register, "warm_familiar"),
      signature_phrases: strs(raw.voice?.signature_phrases, 8),
      languages_seen: strs(raw.voice?.languages_seen, 4),
    },
    offering: {
      primary_products: strs(raw.offering?.primary_products, 10),
      services: strs(raw.offering?.services, 10),
      delivery_or_booking: raw.offering?.delivery_or_booking ?? null,
    },
    motto: raw.motto ?? null,
  };
}

// ---- Asset classification (kept simple — Haiku handles it well) ----
export const assetClassificationSchema = z.object({
  kind: z.enum(["LOGO", "PRODUCT", "LIFESTYLE", "ICON", "OTHER"]),
  brand_relevance: z.number().min(1).max(5),
  usable_in_ads: z.boolean(),
  description: z.string(),
});

export type AssetClassification = z.infer<typeof assetClassificationSchema>;
