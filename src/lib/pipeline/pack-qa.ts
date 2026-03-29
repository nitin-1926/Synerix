import { generateObject } from "ai";
import { z } from "zod";
import { MODELS, resolveLanguageModel } from "@/lib/ai/models";
import type { CostTracker } from "./cost";

/**
 * Pack-fidelity QA for EXACT_PRODUCT renders that still go through the image
 * model (direct mode, or any concept that slipped past the composite route):
 * compare the packaging in the generated scene against the real reference
 * photo. The classic failure is a plausible-looking pack with mangled label
 * text ("PUNJASI" for "PUNJABI"). Fail-open on infrastructure errors.
 */

const verdictSchema = z.object({
  packVisible: z.boolean().describe("Is the product/packaging visible in the generated image at all?"),
  labelTextCorrect: z
    .boolean()
    .describe("Is every legible word on the generated pack spelled EXACTLY as on the reference photo? Any altered, invented or misspelled label text = false."),
  designFaithful: z
    .boolean()
    .describe("Do the pack's colours, layout, logo and overall design match the reference photo (not redesigned or restyled)?"),
  issues: z.string().describe("Short description of any mismatch found, or 'none'"),
});

export interface PackQaResult {
  pass: boolean;
  issues: string;
}

export async function checkPackFidelity(opts: {
  render: Buffer;
  reference: Buffer;
  tracker?: CostTracker;
}): Promise<PackQaResult> {
  try {
    const { object, usage } = await generateObject({
      model: resolveLanguageModel(MODELS.textQa),
      schema: verdictSchema,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "REFERENCE — the real product photo:" },
            { type: "image", image: opts.reference },
            { type: "text", text: "GENERATED — an AI-rendered ad scene that should contain this exact product:" },
            { type: "image", image: opts.render },
            {
              type: "text",
              text: `Compare ONLY the product/packaging in the generated image against the reference photo. Judge label text spelling word by word, plus colours, logo and pack design. Be strict: a single altered or misspelled word on the pack means labelTextCorrect=false. Ignore scene, people, lighting and the pack's angle/perspective.`,
            },
          ],
        },
      ],
    });
    opts.tracker?.addLLM(MODELS.textQa, usage, "pack-qa");
    const pass = !object.packVisible || (object.labelTextCorrect && object.designFaithful);
    return { pass, issues: pass ? "none" : object.issues || "pack differs from reference" };
  } catch (e) {
    console.warn(`[pack-qa] check errored, accepting render: ${(e as Error).message?.slice(0, 160)}`);
    return { pass: true, issues: "qa-skipped" };
  }
}
