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
    .describe(
      "Does the model's face and overall identity clearly match the MODEL reference photo? Judge GENDER and AGE BAND first and strictly — an adult reference rendered as a child or teenager is false, and a male reference rendered as a woman (or the reverse) is false — then face, skin tone, build and hair. Noticeable face drift or a different-looking person = false.",
    ),
  garmentSuitsWearer: z
    .boolean()
    .describe(
      "Is the garment being worn by the kind of person it is cut for? Womenswear (a saree, anarkali, kurti with dupatta, blouse, dress) on a male model is false; menswear on a female model is false; adult clothing on a child is false.",
    ),
  noBakedText: z
    .boolean()
    .describe(
      "Is the image free of ALL rendered text and interface chrome? False if it contains any headline, caption, watermark, gibberish lettering, price or size tag, brand label, OR any app/phone UI (status bar, carrier or battery icons, navigation bar, search field, cart or heart icons). Text genuinely printed on a product's own packaging is allowed.",
    ),
  fullyInFrame: z
    .boolean()
    .describe(
      "Are the model's head (including the top of the hair) and feet BOTH fully inside the frame with visible margin, and is the garment uncut by any edge? Any clipping of the crown, chin, feet or hem = false.",
    ),
  garmentFaithful: z
    .boolean()
    .describe(
      "Does the worn garment match the GARMENT reference photo — same colour, print/pattern, neckline, sleeve length, HEM LENGTH and cut? Judge the hem strictly: a hip- or knee-length tunic rendered as an ankle-length gown (or the reverse) is false, as is invented embellishment (beading, appliqué, borders) the reference does not have.",
    ),
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
              text: "Judge the generated image against both references. Identity: the same person as the MODEL reference — check gender and age band FIRST and strictly, then face, skin tone and build. Suitability: is this garment cut for this wearer (womenswear on a man, or adult clothing on a child, is a failure)? Garment: same clothing as the GARMENT reference — colour, print, cut, neckline, sleeve length, where the HEM falls on the body, and no invented embellishment? Cleanliness: no baked text, gibberish lettering, watermark, tag or app/phone interface anywhere in the frame. Framing: head (crown included) and feet both fully inside the frame, hem uncut. Composition: exactly one figure, one single photograph. Ignore background, lighting style and pose differences — those are allowed to vary. The garment reference may be shown on a hanger or a mannequin; judge the garment itself, not how it is displayed.",
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
      object.modelVisible &&
      object.identityMatch &&
      object.garmentSuitsWearer &&
      object.garmentFaithful &&
      object.singleFigure &&
      object.noBakedText &&
      object.fullyInFrame;
    // Name the failure precisely — the corrective re-render prompt is only as
    // useful as the reason it is given, and these four have distinct remedies.
    const issues = !object.modelVisible
      ? "no model visible in render"
      : !object.noBakedText
        ? "the render contains baked text or app/phone UI"
        : !object.fullyInFrame
          ? "the model's head, feet or the garment hem is cut off by the frame edge"
          : !object.garmentSuitsWearer
            ? "the garment is worn by the wrong gender or age of model"
            : object.issues || "render differs from references";
    return { pass, issues: pass ? "none" : issues };
  } catch (e) {
    console.warn(`[model-qa] check errored, accepting render: ${(e as Error).message?.slice(0, 160)}`);
    return { pass: true, issues: "qa-skipped" };
  }
}
