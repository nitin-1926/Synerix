import { generateObject } from "ai";
import { z } from "zod";
import { MODELS, resolveLanguageModel } from "@/lib/ai/models";
import { creativeConceptSchema, type CreativeConcept } from "./schemas";
import type { CostTracker } from "./cost";

/**
 * Semantic brief QA — runs BETWEEN concepting and rendering, before any image
 * money is spent. generateConcepts' Zod schema only guarantees SHAPE; this
 * stage checks MEANING: product correctness, placement consistency, truth
 * rules, wordless prompts. Failing concepts get ONE repair round on the
 * concepts model, then the run proceeds regardless (fail-open — a QA outage
 * must never kill a paid run; findings are logged for observability).
 */

const verdictSchema = z.object({
  verdicts: z.array(
    z.object({
      index: z.number().describe("0-based index of the concept being judged"),
      ok: z.boolean(),
      issues: z
        .array(z.string())
        .describe("Concrete failures only; empty when ok. Each issue names the field and what is wrong."),
    }),
  ),
});

export interface BriefQaReport {
  checked: number;
  flagged: number;
  repaired: number;
  /** conceptIndex → issues found on the first pass (pre-repair). */
  issues: Record<number, string[]>;
}

const VALIDATOR_SYSTEM = `You are the print-production QA director at a top Indian ad agency. You receive an occasion brief (with a product-intelligence block) and a set of concept briefs about to be sent to an expensive photoreal image model. Your job: catch the failures that would produce a WRONG or UNUSABLE ad. You are strict about real defects and silent about style preferences.

For EACH concept, check ONLY these failure classes:
1. PRODUCT-WRONG SCENE: the imagePrompt/sceneDescription contradicts the product-intelligence block (its category, preparation, finished form, or any SCENE MUST SHOW / MUST NOT SHOW rule in the brief).
2. PLACEMENT MISMATCH: productPlacement='product_hero' but the imagePrompt describes the pack/product in the scene (double-render risk), or productPlacement='lifestyle' but the imagePrompt never stages the product.
3. NOT WORDLESS: the imagePrompt asks the image model to render any text, lettering, numbers, signage or logos beyond what is printed on the real product's packaging, or it fails to reserve a clean negative-space zone for the later headline.
4. INVENTED CLAIMS: any copy block or prompt invents offers, discounts, prices, "free" anything, certifications, awards or statistics that the occasion brief did not explicitly state.
5. BROKEN COPY: a headline over 8 words, a missing CTA, an em/en dash (— –) in any copy field, or copy in the wrong script for its language slot (hi must be Devanagari, pa must be Gurmukhi, hinglish must be Latin script).
6. DUPLICATE CONCEPTS: two concepts in the set that are effectively the same scene/angle (flag the LATER one).
7. OCCASION MISSING: the brief names a festival or occasion but the imagePrompt/sceneDescription contains nothing that visually reads as that occasion (its mood, setting, ritual objects, colours or motifs) — a generic scene that could run any day of the year. Only apply when the brief actually names an occasion.

Judge against the brief you are given, not your own taste. If a concept passes all seven checks, it is ok=true with no issues. Never invent an issue to seem thorough.`;

const REPAIR_SYSTEM = `You are the senior creative director who wrote a concept brief that production QA flagged. Fix ONLY the flagged issues, keeping everything that worked: the concept's name, big idea, archetype and creative angle stay unless an issue forces a change. Preserve all standing rules: photoreal WORDLESS imagePrompt with an explicit reserved negative-space zone, correct product staging per productPlacement, brand palette leading, no invented offers or claims, no em/en dashes anywhere, headline ≤ 6 words in all four languages (en / hinglish Latin script / hi Devanagari / pa Gurmukhi). Return the complete corrected concept.`;

async function judge(
  concepts: CreativeConcept[],
  occasionBrief: string,
  tracker?: CostTracker,
): Promise<z.infer<typeof verdictSchema>["verdicts"]> {
  const { object, usage } = await generateObject({
    model: resolveLanguageModel(MODELS.briefQa),
    schema: verdictSchema,
    system: VALIDATOR_SYSTEM,
    prompt: `## OCCASION BRIEF\n${occasionBrief}\n\n## CONCEPTS (judge each, return one verdict per index)\n${JSON.stringify(
      concepts.map((c, index) => ({ index, ...c })),
      null,
      1,
    )}`,
  });
  tracker?.addLLM(MODELS.briefQa, usage, "brief-qa");
  return object.verdicts;
}

async function repair(
  concept: CreativeConcept,
  issues: string[],
  occasionBrief: string,
  tracker?: CostTracker,
): Promise<CreativeConcept> {
  const { object, usage } = await generateObject({
    model: resolveLanguageModel(MODELS.concepts),
    schema: creativeConceptSchema,
    system: REPAIR_SYSTEM,
    prompt: `## OCCASION BRIEF\n${occasionBrief}\n\n## FLAGGED CONCEPT\n${JSON.stringify(concept, null, 1)}\n\n## QA ISSUES TO FIX\n${issues.map((i) => `- ${i}`).join("\n")}`,
  });
  tracker?.addLLM(MODELS.concepts, usage, "brief-repair");
  return object;
}

/**
 * Validate every concept; repair the failures once (in parallel); return the
 * merged set plus a report for the pipeline JSON. Throws only on total LLM
 * failure — the caller treats that as fail-open and renders the originals.
 */
export async function validateAndRepairConcepts(opts: {
  concepts: CreativeConcept[];
  occasionBrief: string;
  tracker?: CostTracker;
}): Promise<{ concepts: CreativeConcept[]; report: BriefQaReport }> {
  const verdicts = await judge(opts.concepts, opts.occasionBrief, opts.tracker);
  const failing = verdicts.filter(
    (v) => !v.ok && v.issues.length > 0 && v.index >= 0 && v.index < opts.concepts.length,
  );
  const report: BriefQaReport = {
    checked: opts.concepts.length,
    flagged: failing.length,
    repaired: 0,
    issues: Object.fromEntries(failing.map((v) => [v.index, v.issues.slice(0, 6)])),
  };
  if (!failing.length) return { concepts: opts.concepts, report };

  const merged = [...opts.concepts];
  await Promise.all(
    failing.map(async (v) => {
      try {
        merged[v.index] = await repair(opts.concepts[v.index], v.issues, opts.occasionBrief, opts.tracker);
        report.repaired += 1;
      } catch (e) {
        // Fail-open per concept: an unrepairable concept still renders as
        // authored — a flagged-but-original ad beats a refunded empty slot.
        console.warn(`[brief-qa] repair failed for concept ${v.index}: ${(e as Error).message?.slice(0, 160)}`);
      }
    }),
  );
  return { concepts: merged, report };
}

/**
 * Photographic prompt enhancer — final polish pass on each concept's
 * imagePrompt before rendering. Adds photographic specificity (lens, light
 * quality, texture, grade); NEVER changes what the scene contains. One batch
 * call for the whole set so treatment stays coherent across the campaign.
 */
const ENHANCE_SYSTEM = `You are a world-class commercial photography director doing the final polish on image-generation prompts for a photoreal ad campaign. For each prompt, KEEP EVERY EXISTING CONSTRAINT INTACT AND EXPLICIT: the subject and scene contents, the product staging, the talent, the brand hex palette, the reserved negative-space zone (same zone, still stated), and the explicit WORDLESS statement (no text, lettering, signage or logos beyond the real product's packaging). Do not add, remove or move any scene element, and do not add any new prop, person or claim.

What you MAY do — sharpen the craft: name a specific lens and framing (e.g. 85mm portrait compression, low 35mm hero angle), qualify the light (golden-hour window light, softbox key with warm bounce), add texture and material realism cues, a cohesive colour-grade note that respects the palette, and a premium editorial quality bar (sharp focus, commercial advertising photography, natural skin, correct hands, no AI artifacts). Keep each prompt 500-1300 characters, one paragraph, production-ready. The set should read like ONE campaign shot by ONE director.`;

const enhancedSchema = z.object({
  prompts: z.array(
    z.object({
      index: z.number().describe("0-based index of the concept this prompt belongs to"),
      imagePrompt: z.string().describe("The polished final image prompt, all original constraints intact"),
    }),
  ),
});

export async function enhanceConceptPrompts(opts: {
  concepts: CreativeConcept[];
  tracker?: CostTracker;
}): Promise<CreativeConcept[]> {
  const { object, usage } = await generateObject({
    model: resolveLanguageModel(MODELS.concepts),
    schema: enhancedSchema,
    system: ENHANCE_SYSTEM,
    prompt: `Polish these ${opts.concepts.length} prompts (return one entry per index):\n${JSON.stringify(
      opts.concepts.map((c, index) => ({ index, productPlacement: c.productPlacement, imagePrompt: c.imagePrompt })),
      null,
      1,
    )}`,
  });
  opts.tracker?.addLLM(MODELS.concepts, usage, "prompt-enhance");

  return opts.concepts.map((c, i) => {
    const polished = object.prompts.find((p) => p.index === i)?.imagePrompt?.trim();
    // Guard the invariants we can check deterministically; on any doubt, the
    // author's original prompt wins (the enhancer is a bonus, never a risk).
    if (!polished || polished.length < 300 || /[—–]/.test(polished)) return c;
    return { ...c, imagePrompt: polished };
  });
}
