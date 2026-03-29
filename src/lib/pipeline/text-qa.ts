import { generateObject } from "ai";
import { z } from "zod";
import { MODELS, resolveLanguageModel } from "@/lib/ai/models";
import type { CostTracker } from "./cost";

/**
 * Baked-typography QA: a cheap vision check that the headline (and CTA) the
 * image model rendered IN the image is spelled exactly right and legible.
 * Critical for Devanagari/Gurmukhi, where image models can garble matras.
 * On failure the caller retries once, then falls back to the wordless plate +
 * canvas overlay (guaranteed-correct text).
 */

const verdictSchema = z.object({
  headlineFound: z.boolean().describe("Is the expected headline visibly rendered in the image?"),
  headlineCorrect: z
    .boolean()
    .describe("Is the headline spelled EXACTLY as expected — every letter, matra and diacritic — and clearly legible?"),
  ctaCorrect: z
    .boolean()
    .describe("If a CTA was expected: is it rendered correctly? true when no CTA was expected."),
  strayText: z
    .boolean()
    .describe("Is there any OTHER invented text in the image (beyond the headline, CTA and the product's own packaging print)?"),
  textOverlapsSubject: z
    .boolean()
    .describe(
      "Does the headline or CTA typography overlap, touch or visually collide with a face, a person, hands, food, the product, its packaging or its label? true if the type is NOT sitting in clean negative space.",
    ),
  issues: z.string().describe("Short description of any problems found, or 'none'"),
});

export interface TextQaResult {
  pass: boolean;
  issues: string;
}

export async function checkBakedText(opts: {
  image: Buffer;
  headline: string;
  cta?: string | null;
  language: string;
  tracker?: CostTracker;
}): Promise<TextQaResult> {
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
              text: `This is an AI-generated ad creative. Verify the typography rendered in the image.
Expected headline (${opts.language}): "${opts.headline.trim()}"
${opts.cta?.trim() ? `Expected CTA: "${opts.cta.trim()}"` : "No CTA expected."}
Check character by character — for Devanagari/Gurmukhi pay close attention to matras, conjuncts and diacritics. Garbled, half-formed, duplicated or misspelled letters mean headlineCorrect=false. Ignore text that is genuinely printed on the real product's packaging.
Also judge PLACEMENT: the typography must sit in clean negative space — if it overlaps or touches a face, a person, hands, food, the product or its label, set textOverlapsSubject=true.`,
            },
          ],
        },
      ],
    });
    opts.tracker?.addLLM(MODELS.textQa, usage, "text-qa");
    const pass =
      object.headlineFound &&
      object.headlineCorrect &&
      object.ctaCorrect &&
      !object.strayText &&
      !object.textOverlapsSubject;
    return { pass, issues: pass ? "none" : object.issues || "typography check failed" };
  } catch (e) {
    // QA infrastructure failure must not kill the render — accept the image.
    console.warn(`[text-qa] check errored, accepting image: ${(e as Error).message?.slice(0, 160)}`);
    return { pass: true, issues: "qa-skipped" };
  }
}
