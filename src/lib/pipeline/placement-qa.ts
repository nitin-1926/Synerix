import { generateObject } from "ai";
import { z } from "zod";
import { MODELS, resolveLanguageModel } from "@/lib/ai/models";
import type { CostTracker } from "./cost";

/**
 * Overlay-placement QA: a cheap vision check on the FINAL composited creative
 * that the canvas-overlaid text and logo landed in clean negative space. The
 * template scorer is a heuristic (safe-band/busyness on the plate) and can
 * still drop type onto a face or the product; this check sees the real pixels.
 * On failure the caller re-composites with a different-archetype runner-up
 * once; if that also fails it renders a guaranteed-legible fallback layout
 * (never ships a known-bad composition). QA infrastructure errors stay
 * fail-open — a missing check beats a failed creative.
 */

const elementVerdict = z.object({
  overlapsKeyContent: z
    .boolean()
    .describe("Does THIS element cover, touch or visually collide with a face, a person, hands, food, the product, its packaging or label, or the scene's focal subject?"),
  lowContrast: z
    .boolean()
    .describe("Is THIS element hard to read or see — low contrast against its background or lost in busy texture?"),
});

// Per-element verdicts force the model to inspect each overlay individually —
// a single whole-image boolean lets one small bad element slip past.
const verdictSchema = z.object({
  eyebrow: elementVerdict.nullable().describe("The small uppercase kicker line above the headline; null if absent"),
  headline: elementVerdict.nullable().describe("The large headline text; null if absent"),
  body: elementVerdict.nullable().describe("The smaller supporting copy below the headline; null if absent"),
  cta: elementVerdict.nullable().describe("The call-to-action button/pill; null if absent"),
  logo: elementVerdict.nullable().describe("The brand logo; null if absent"),
  issues: z.string().describe("Short description of any problems found, or 'none'"),
});

export interface PlacementQaResult {
  pass: boolean;
  issues: string;
}

export async function checkOverlayPlacement(opts: {
  image: Buffer;
  tracker?: CostTracker;
}): Promise<PlacementQaResult> {
  try {
    const { object, usage } = await generateObject({
      model: resolveLanguageModel(MODELS.textQa),
      schema: verdictSchema,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", image: opts.image },
            {
              type: "text",
              text: `This is a finished ad creative: an AI-generated scene with text layers and a logo composited on top. Judge ONLY the PLACEMENT and LEGIBILITY of the overlaid elements — not spelling, style or the scene itself.
Inspect EACH overlaid element separately (eyebrow kicker, headline, body copy, CTA button, logo) and give each its own verdict; use null for elements the creative doesn't have.
For each element: overlapsKeyContent=true if it covers or touches a face, a person, hands, food, the product or its label, or blocks the scene's focal subject. lowContrast=true if it is hard to read or see against what's behind it (similar colour, low contrast, busy texture).
Be strict — an element that merely brushes a person's arm or sits on similar-coloured clothing fails. Ignore text genuinely printed on the real product's packaging.`,
            },
          ],
        },
      ],
    });
    opts.tracker?.addLLM(MODELS.textQa, usage, "placement-qa");
    const elements = [object.eyebrow, object.headline, object.body, object.cta, object.logo];
    const pass = elements.every((e) => !e || (!e.overlapsKeyContent && !e.lowContrast));
    return { pass, issues: pass ? "none" : object.issues || "placement check failed" };
  } catch (e) {
    // QA infrastructure failure must not kill the render — accept the composition.
    console.warn(`[placement-qa] check errored, accepting composition: ${(e as Error).message?.slice(0, 160)}`);
    return { pass: true, issues: "qa-skipped" };
  }
}
