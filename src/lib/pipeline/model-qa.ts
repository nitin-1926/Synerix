import { generateObject } from "ai";
import { z } from "zod";
import { MODELS, resolveLanguageModel } from "@/lib/ai/models";
import type { CostTracker } from "./cost";

/**
 * On-model fidelity QA: the ON_MODEL fusion's two classic failures are (1) the
 * garment gets restyled — wrong colour/print/cut vs the real product photo —
 * and (2) the rendered face/body drifts away from the chosen AI model (the
 * identity is carried only by one reference image + a text instruction, so
 * drift is common on dramatic poses/crops). A third mode is the catalogue
 * diptych (front+back split). Mirror of pack-qa.ts; fail-open on
 * infrastructure errors so a QA outage never kills a paid run.
 */

const verdictSchema = z.object({
  modelVisible: z.boolean().describe("Is a human model wearing clothing visible in the generated image?"),
  identityMatch: z
    .boolean()
    .describe("Does the model's face and overall identity (gender, age range, skin tone, build, hair) clearly match the MODEL reference photo? Noticeable face drift or a different-looking person = false."),
  garmentFaithful: z
    .boolean()
    .describe("Does the worn garment match the GARMENT reference photo — same colour, print/pattern, neckline, sleeves, length and cut? Restyled, recoloured or redesigned = false."),
  singleFigure: z
    .boolean()
    .describe("Is there exactly ONE figure in ONE single photograph (no front/back split, no side-by-side panels, no repeated or mirrored figure, no collage)?"),
  issues: z.string().describe("Short description of any mismatch found, or 'none'"),
});

export interface ModelQaResult {
  pass: boolean;
  issues: string;
}

export async function checkOnModelFidelity(opts: {
  render: Buffer;
  modelRef: Buffer;
  garmentRef: Buffer;
  tracker?: CostTracker;
}): Promise<ModelQaResult> {
  try {
    const { object, usage } = await generateObject({
      model: resolveLanguageModel(MODELS.textQa),
      schema: verdictSchema,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "MODEL reference — the human model whose identity must be preserved:" },
            { type: "image", image: opts.modelRef },
            { type: "text", text: "GARMENT reference — the real product photo of the clothing:" },
            { type: "image", image: opts.garmentRef },
            { type: "text", text: "GENERATED — an AI-rendered photoshoot frame that should show this exact model wearing this exact garment:" },
            { type: "image", image: opts.render },
            {
              type: "text",
              text: "Judge the generated image against both references. Identity: same person as the MODEL reference (face, gender, age range, skin tone, build)? Garment: same clothing as the GARMENT reference (colour, print, cut, neckline, sleeves, length)? Composition: exactly one figure, one single photograph? Ignore background, lighting style and pose differences — those are allowed to vary.",
            },
          ],
        },
      ],
    });
    opts.tracker?.addLLM(MODELS.textQa, usage, "model-qa");
    // Unlike pack-QA (a lifestyle scene may legitimately not show the pack),
    // a missing model here is the WORST failure — the human is the promise of
    // this mode — so it hard-fails and triggers the corrective re-render.
    const pass =
      object.modelVisible && object.identityMatch && object.garmentFaithful && object.singleFigure;
    const issues = !object.modelVisible
      ? "no model visible in render"
      : object.issues || "render differs from references";
    return { pass, issues: pass ? "none" : issues };
  } catch (e) {
    console.warn(`[model-qa] check errored, accepting render: ${(e as Error).message?.slice(0, 160)}`);
    return { pass: true, issues: "qa-skipped" };
  }
}
