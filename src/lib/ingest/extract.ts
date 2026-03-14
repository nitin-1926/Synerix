import { generateObject } from "ai";
import { MODELS, resolveLanguageModel } from "@/lib/ai/models";
import {
  assetClassificationSchema,
  brandDnaLLMSchema,
  normalizeBrandDna,
  type AssetClassification,
  type BrandDna,
} from "@/lib/schemas/brand-dna";
import type { CrawledPage } from "./crawl";

/** Brand DNA extraction — system prompt ported from floki extract-brand-dna.ts,
 * adapted for Indian SMB sites (often thin, sometimes Hinglish). */
const BRAND_DNA_SYSTEM = `You are a brand strategist conducting a teardown of a small/medium business's website. Extract brand DNA in strict JSON matching the schema.

Rules — these are absolute:
- Quote signature_phrases and motto VERBATIM from the site text. Do not paraphrase.
- visual_identity.primary_color and accent_colors: these are the BRAND's identity colours — the colours of the logo, brand mark, packaging and deliberate brand styling. NEVER website UI chrome: generic link/button blues, framework defaults, nav bars and form controls are web furniture, not brand identity. If the logo is red and gold, the brand colours are red and gold even when the site's buttons are blue. Reject incidental colors. Output hex.
- If a field is unknown from the site, return null where the schema permits. Never hallucinate.
- one_line is the practical "what they sell for whom" — not marketing copy. Under 160 chars.
- offering.primary_products: concrete sellable items ("kaju katli", "lehengas", "thali meals"), not categories.
- audience.occasions: festivals/events the site already mentions (Diwali gifting, wedding season, Rakhi specials).
- voice.languages_seen: scripts/languages actually present on the site.
- Many Indian SMB sites are thin. Extract what exists; prefer null over invention.`;

export async function extractBrandDna(pages: CrawledPage[], fallbackName: string): Promise<BrandDna> {
  const corpus = pages
    .map((p) => `### ${p.url}\n${(p.markdown ?? "").slice(0, 6000)}`)
    .join("\n\n")
    .slice(0, 48_000);

  const { object } = await generateObject({
    model: resolveLanguageModel(MODELS.brandDna),
    schema: brandDnaLLMSchema,
    system: BRAND_DNA_SYSTEM,
    prompt: `Website content (markdown, ranked pages):\n\n${corpus}`,
  });
  return normalizeBrandDna(object, fallbackName);
}

/** Vision classification of harvested site images — ported from floki 1c. */
export async function classifyAsset(
  image: Buffer,
  mime: string,
  sourceUrl: string,
): Promise<AssetClassification> {
  const { object } = await generateObject({
    model: resolveLanguageModel(MODELS.classify),
    schema: assetClassificationSchema,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", image, mediaType: mime as `image/${string}` },
          {
            type: "text",
            text: `Classify this image harvested from a business website (source: ${sourceUrl}).
- LOGO: the business's own logo (wordmark/icon)
- PRODUCT: a product/dish/item they sell
- LIFESTYLE: people/ambience/store shots
- ICON: small UI icon/decoration
- OTHER: anything else (stock photos, partner logos, banners with heavy text)
usable_in_ads: would this asset be useful inside a generated ad (true for clean logos & good product shots).`,
          },
        ],
      },
    ],
  });
  return object;
}
