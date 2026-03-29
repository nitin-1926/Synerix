import { z } from "zod";
import { ARCHETYPES } from "@/lib/composition/archetypes";

/** Typed creative concepts (labs-moodboard CreativeDirection pattern). */

// Lenient for the LLM (Anthropic/Gemini structured output reject regex + tight
// min/max and fail the whole object); sanitized in concepts.ts after parse.
const copyBlockSchema = z.object({
  eyebrow: z.string().nullable().describe("Short kicker (<=40 chars), e.g. 'Diwali Special' / offer text"),
  headline: z.string().describe("<=8 words"),
  subhead: z.string().nullable(),
  cta: z.string().describe("Short action, e.g. 'Order on WhatsApp'"),
});

export const creativeConceptSchema = z.object({
  name: z.string().describe("Internal concept name, e.g. 'Family Glow'"),
  bigIdea: z.string().describe("The creative leap in one punchy line — NOT a restatement of the strategy"),
  whyFits: z.string().describe("Why this concept suits THIS product + occasion specifically"),
  insightRationale: z
    .string()
    .describe(
      "2-3 sentences: the human/market insight this stands on, CITING the specific evidence (named competitor pattern, customer phrase, proven angle) from the EVIDENCE block when one is supplied. Never generic.",
    ),
  artDirection: z
    .string()
    .describe(
      "The shoot, like a senior creative director's brief: scene/setting, talent, composition, lens/framing, lighting, palette, mood, and exactly how the real product is staged as the hero.",
    ),
  archetype: z.enum(ARCHETYPES),
  productPlacement: z
    .enum(["product_hero", "lifestyle"])
    .describe(
      "How the real product appears. 'product_hero' = the product is THE hero on a clean styled surface — it will be composited in pixel-exact afterwards, so describe the scene as a product-LESS backdrop with a deliberate empty hero spot (clear surface, gentle shadow) where the product will sit. 'lifestyle' = the product lives naturally inside a real-life scene (people, food, a kitchen) and the image model stages the real product from its reference photo. Choose 'lifestyle' for human/emotional scenes; 'product_hero' for clean studio/flat-lay product shots.",
    ),
  sceneDescription: z
    .string()
    .describe(
      "The photographic scene for the image model (>=80 chars): subject, setting, mood, lighting, composition, and CORRECT product usage (e.g. deep-fried puffed pooris, not tawa rotis). WORDLESS — never describe any text, lettering, signage or logos.",
    ),
  imagePrompt: z
    .string()
    .describe(
      "THE complete, final prompt sent to the photoreal image model (nothing else is added except a short product-reference line). Self-contained and art-directed: subject, environment, talent, lens/framing, lighting, composition, palette (lead with the brand hexes), mood, exact product staging and correct usage, premium editorial quality bar, and an explicit reservation of clean negative space where the headline will be set later. STRICTLY WORDLESS: state that the scene contains no text, lettering, signage or logos beyond the product's own packaging. 500-1100 chars.",
    ),
  typographySpec: z
    .string()
    .describe(
      "Direction for the typography pass that sets the headline INTO the finished image afterwards: which zone of the frame (matching the negative space reserved in imagePrompt), type style (e.g. 'elegant high-contrast serif' / 'bold condensed sans'), colour guidance against that background, and scale feel. 1-2 sentences.",
    ),
  paletteHexes: z.array(z.string()).describe("2-4 hex colours like #1d59a2"),
  copy: z.object({
    en: copyBlockSchema,
    hinglish: copyBlockSchema.describe("Hindi in Latin script"),
    hi: copyBlockSchema.describe("Devanagari script"),
    pa: copyBlockSchema.describe("Punjabi in Gurmukhi script"),
  }),
});

export type CreativeConcept = z.infer<typeof creativeConceptSchema>;

// Tolerant bounds so a misconfigured request count never hard-fails structured
// output; generateConcepts requests "exactly N" and slices to the caller's N.
export const conceptsResponseSchema = z.object({
  concepts: z.array(creativeConceptSchema).min(1).max(8),
});

/** Pivot concept copy (per-language blocks) → overlay roles (TextByLang per role). */
export function conceptCopyToRoles(copy: CreativeConcept["copy"]) {
  const role = (k: "eyebrow" | "headline" | "subhead" | "cta") => ({
    en: copy.en[k] ?? "",
    hinglish: copy.hinglish[k] ?? "",
    hi: copy.hi[k] ?? "",
    pa: copy.pa[k] ?? "",
  });
  const nonEmpty = (t: { en: string; hinglish: string; hi: string; pa: string }) =>
    t.en || t.hinglish || t.hi || t.pa ? t : null;
  return {
    eyebrow: nonEmpty(role("eyebrow")),
    headline: role("headline"),
    subhead: nonEmpty(role("subhead")),
    cta: nonEmpty(role("cta")),
  };
}

export interface PipelineState {
  occasionBrief?: string;
  concepts?: CreativeConcept[];
  conceptStatus?: Record<string, "rendering" | "done" | "failed">;
}
