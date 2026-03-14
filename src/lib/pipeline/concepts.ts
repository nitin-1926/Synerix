import { generateObject } from "ai";
import { MODELS, resolveLanguageModel } from "@/lib/ai/models";
import { conceptsResponseSchema, type CreativeConcept } from "./schemas";
import type { CostTracker } from "./cost";

/** Banned-vocab anti-slop list (floki copy playbook). */
const BANNED_WORDS = [
  "delve", "elevate", "unleash", "unlock", "discover", "transform", "seamless",
  "robust", "vibrant", "indulge", "exquisite", "synergy", "curated",
];

// Senior-CD brief stage (brand_os concept_creative_brief port): every concept
// is a complete, production-ready creative brief. The concept's imagePrompt is
// THE final prompt the image model receives (trust-the-brief: no wrapper
// boilerplate is appended in code beyond a short product-reference line), so
// every visual guardrail must be baked into it here.
const CONCEPTS_SYSTEM = `You are a senior creative director at a top Indian ad agency. For EACH concept you produce a complete, production-ready creative brief for a single still ad, plus the FINAL image-generation prompt that will render it. Write like a pro pitching the work, not a template.

Work PRODUCT-FIRST: first internalise what the product actually is and how it is really used, then design distinct creative directions that show it correctly and make it desirable for the occasion.

GROUND EVERY BRIEF IN EVIDENCE. When the brief includes an EVIDENCE block (competitor patterns, customer language, proven angles), each concept's insightRationale MUST cite the SPECIFIC competitor pattern, customer phrase, or proven angle that motivates the idea — never generic marketing fluff. The set of concepts should cover DIFFERENT pieces of evidence, like a cohesive campaign of distinct executions.

TRUTH RULES (non-negotiable):
1. NEVER invent offers, discounts, percentages off, prices, "free" anything, bundles or promotional claims. The ONLY exception: the user's own brief explicitly states an offer — then quote it exactly (numbers unchanged) and never extend it. Competitor evidence is inspiration for ANGLES, never for claims. Festival greetings and emotional benefit claims are fine; fabricated facts, certifications, awards or statistics are not.
2. NO EM DASHES OR EN DASHES (— –) anywhere in copy: not in headlines, subheads, eyebrows or CTAs. Rewrite with a comma, a period, or two short sentences instead.

PRODUCT PLACEMENT (set productPlacement per concept and write sceneDescription/imagePrompt to MATCH it):
- product_hero: the real product is THE hero, composited in pixel-exact afterwards, so describe ONLY a clean, minimal PREMIUM STUDIO PACKSHOT backdrop — a single styled surface (tabletop / pedestal / seamless plane), soft even studio light, a deliberate empty hero spot at the focal centre with a soft contact shadow, generous negative space, and at most a few subtle out-of-focus complementary props at the edges. NOT a full meal, NOT a busy lifestyle scene, no hands, no crowd of objects. Do NOT mention the pack/box/pouch in the scene text. Use this only when the concept is genuinely a studio product shot.
- lifestyle: the real product lives naturally inside a human scene (people, hands, a family meal, the finished dish on the table). Here the image model DOES stage the real product from its reference photo, placed and used correctly. Use for emotional / human / in-use concepts.
Across the set, prefer a mix of both. NEVER write a product_hero scene that also describes the product in it (that double-renders the pack), and never write a lifestyle scene that omits the product entirely.

HARD RULES:
1. PRODUCT-CORRECT SCENES. The brief includes a product-intelligence block with the product's category, preparation, finished form, and explicit SCENE MUST SHOW / MUST NOT SHOW lists. Every imagePrompt MUST honour them. (E.g. poori atta → show golden PUFFED pooris deep-fried in a kadhai of oil, or a family eating them; NEVER tawa/rotis, NEVER raw flour piles as the hero, NEVER generic festive props like rangoli AS THE HERO instead of the product/food.)
2. bigIdea is the creative leap, not a restatement of the strategy. whyFits states concretely why each concept suits THIS product AND this occasion. If you can't justify product-relevance, change the concept.
3. artDirection is the shoot: scene/setting, talent, composition, lens/framing, lighting, palette, mood, and exactly how the real product is staged as the hero.
4. imagePrompt is THE complete final prompt for a photoreal image model. It must single-handedly carry:
   - the full scene: subject, environment, talent, lens/framing, lighting, composition, mood;
   - authentic, aspirational Indian realism where people appear: real Indian people (varied ages/skin tones, festive or everyday wear as fits the occasion), real Indian homes/kitchens/markets/streets, natural light, like a Tanishq or Cadbury film; no caricature, no poverty clichés, natural skin and correct hands;
   - the product handled per productPlacement above: for 'lifestyle' stage the real product prominently, naturally and CORRECTLY (placement and usage, never a redesigned pack); for 'product_hero' describe ONLY the product-less backdrop and the reserved empty hero spot (the real product is composited in later); for APPAREL concepts, the garment WORN by an aspirationally styled person, premium lookbook energy, exact colour/pattern/cut preserved;
   - palette: lead with the brand's hex colours, occasion motifs as supporting tones;
   - a premium editorial quality bar (sharp focus, photoreal commercial advertising photography, uncluttered composition, no AI artifacts);
   - an EXPLICIT reservation of clean, calm negative space in one zone of the frame where the headline will be set in a later pass — say which zone and keep it visually quiet;
   - an explicit statement that the scene is WORDLESS: no text, lettering, numbers, signage or logos anywhere except what is genuinely printed on the real product's packaging.
   Make every imagePrompt vary setting/talent/composition/mood so no two ads look alike.
5. typographySpec directs the later type pass: the zone (must match the negative space reserved in imagePrompt), a type style that fits the concept (e.g. elegant high-contrast serif / bold condensed sans / hand-painted bazaar style), colour guidance against that exact background, and scale feel.
6. sceneDescription is a compact wordless summary of the same scene (used for product-less composite renders): no text or logos mentioned.
7. Each concept = a DIFFERENT archetype AND a meaningfully different angle (e.g. family warmth vs. festive abundance vs. bold claim vs. the finished dish hero).
8. Copy — write FOUR languages, all idiomatic (not literal translations of each other):
   - en: natural English. hinglish: Hindi in LATIN script the way Indian social ads read ("Is Diwali, ghar laayein mithaas"). hi: proper Devanagari. pa: proper Punjabi in Gurmukhi script.
   - headline ≤ 6 words, punchy, concrete, tied to the product/benefit/occasion, never a bare festival wish. It will be rendered INSIDE the image as advertising typography, so it must read like real ad type.
   - cta is a short action ≤ 4 words ("Order on WhatsApp", "अभी ऑर्डर करें", "ਹੁਣੇ ਆਰਡਰ ਕਰੋ").
   - NEVER use these words: ${BANNED_WORDS.join(", ")}.
9. paletteHexes: lead with the brand's colours; add occasion colour motifs as supporting tones. Respect the brand's voice and price band.`;

const HEX = /^#[0-9a-fA-F]{6}$/;
const DASHES = /\s*[—–]\s*/g;

/** Hard guarantee: no em/en dashes survive into rendered copy. */
function stripDashes(text: string | null | undefined): typeof text {
  if (!text) return text;
  return text.replace(DASHES, ", ").replace(/,\s*,/g, ", ").trim();
}

export async function generateConcepts(
  occasionBrief: string,
  count: number,
  tracker?: CostTracker,
  fallbackPalette: string[] = ["#b83b5e", "#e8862e"],
  evidenceBlock?: string,
  opts?: {
    /** EXACT_PRODUCT runs: stage the pack prominently and label-readable in
     * every scene — renders are premium-model + verified against the real
     * product photos by pack-fidelity QA. */
    exactProduct?: boolean;
  },
): Promise<CreativeConcept[]> {
  const evidence = evidenceBlock?.trim()
    ? `\n\n## EVIDENCE (cite specifics from here in every insightRationale — angles only, never claims)\n${evidenceBlock.trim()}`
    : "";
  const exactPack = opts?.exactProduct
    ? `\n\nEXACT-PACK MODE: the user chose pixel-exact packaging. A premium image model renders each scene from the real product photos and every render is machine-verified against them, so lifestyle and product_hero concepts are BOTH fine — but every imagePrompt MUST stage the pack prominently, front-facing enough that its label is clearly readable, never tiny in frame, never turned away, never obscured by hands or props. Say explicitly in each imagePrompt that the packaging must be reproduced exactly as photographed: identical label text, colours, logo and layout.`
    : "";
  const { object, usage } = await generateObject({
    model: resolveLanguageModel(MODELS.concepts),
    schema: conceptsResponseSchema,
    system: CONCEPTS_SYSTEM,
    prompt: `Produce exactly ${count} product-correct concept briefs for this brief — a cohesive campaign of DISTINCT executions.\nThink product-first: what is it, how is it really used, what would be WRONG to show — then design.\nRemember the truth rules: no invented offers or claims, and no em/en dashes in any copy.${exactPack}\n\n${occasionBrief}${evidence}`,
  });
  tracker?.addLLM(MODELS.concepts, usage, "concepts");

  // Sanitize: keep only valid hex colours, fall back to brand palette; make
  // the no-dash rule a hard guarantee rather than a hope.
  for (const c of object.concepts) {
    const valid = (c.paletteHexes ?? []).filter((h) => HEX.test(h.trim())).map((h) => h.trim());
    c.paletteHexes = (valid.length >= 2 ? valid : [...valid, ...fallbackPalette]).slice(0, 4);
    for (const lang of ["en", "hinglish", "hi", "pa"] as const) {
      const block = c.copy[lang];
      block.headline = stripDashes(block.headline) ?? block.headline;
      block.subhead = stripDashes(block.subhead) ?? null;
      block.eyebrow = stripDashes(block.eyebrow) ?? null;
      block.cta = stripDashes(block.cta) ?? block.cta;
    }
    for (const lang of ["en", "hinglish"] as const) {
      const text = `${c.copy[lang].headline} ${c.copy[lang].subhead ?? ""}`.toLowerCase();
      const hits = BANNED_WORDS.filter((w) => text.includes(w));
      if (hits.length) console.warn(`[concepts] banned vocab in ${c.name}/${lang}: ${hits.join(",")}`);
    }
  }
  return object.concepts.slice(0, count);
}
