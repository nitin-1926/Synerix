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
  singleCoherentScene: z
    .boolean()
    .describe("Is this ONE photograph of one moment? Split screens, side-by-side panels, triptychs, grids, collages, before/after halves or a blank bar down one edge = false."),
  humansPlausible: z
    .boolean()
    .describe("If any person appears: are they anatomically plausible adults for an ad (correct hands and faces), each a DIFFERENT individual (no duplicated or cloned identical people), and never a child wearing adult clothing? No people in frame = true."),
  productTruthful: z
    .boolean()
    .describe("Does the product appear the way it genuinely is when used — correct preparation, doneness, form and scale? Judge against the PRODUCT TRUTH notes when they are supplied; anything listed as MUST NOT SHOW appearing in the frame = false. No notes supplied = true."),
  noStrayText: z
    .boolean()
    .describe("Is the frame free of invented text — headlines, captions, watermarks, gibberish lettering, signage or app/phone interface? Text genuinely printed on the product's own packaging is allowed."),
  issues: z.string().describe("Short description of any mismatch found, or 'none'"),
});

export interface PackQaResult {
  pass: boolean;
  issues: string;
}

export async function checkPackFidelity(opts: {
  render: Buffer;
  reference: Buffer;
  /** Product-truth notes (sceneDo / sceneDont) so the check can catch a wrongly
   * prepared or wrongly served product, not just a mangled label. */
  productTruth?: { mustShow: string[]; mustNotShow: string[] } | null;
  tracker?: CostTracker;
}): Promise<PackQaResult> {
  const truth = opts.productTruth
    ? `\n\nPRODUCT TRUTH for this SKU — judge productTruthful against these:\nSHOULD look like / include: ${opts.productTruth.mustShow.join("; ")}\nMUST NOT appear: ${opts.productTruth.mustNotShow.join("; ")}`
    : "";
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
              text: `Judge this generated ad frame against the reference product photo.
PACK: compare label text word by word, plus colours, logo and pack design. Be strict — a single altered or misspelled word means labelTextCorrect=false. Ignore the pack's angle and perspective. If the pack is rendered too small or distant for its label text to be legible at all, judge only colours, shape, logo and overall design; illegible-at-this-scale text is NOT a text failure.
SCENE: the product MUST be present — an ad frame without the product is a failure, not a pass. Also judge the frame as a whole: one single photograph (no panels, collages or blank bars), plausible non-duplicated adult humans if any appear, and no invented text or interface anywhere.${truth}`,
            },
          ],
        },
      ],
    });
    opts.tracker?.addLLM(MODELS.textQa, usage, "pack-qa");
    // packVisible used to make a product-less frame PASS ("!packVisible || ...").
    // That was written for the retired product_hero composite route, where the
    // pack was pasted in afterwards. Every concept now stages the real product,
    // so a missing product is exactly the failure this check exists to catch.
    const pass =
      object.packVisible &&
      object.labelTextCorrect &&
      object.designFaithful &&
      object.singleCoherentScene &&
      object.humansPlausible &&
      object.productTruthful &&
      object.noStrayText;
    const issues = !object.packVisible
      ? "the product is not in the frame"
      : !object.singleCoherentScene
        ? "the render is a split/collage rather than one photograph"
        : !object.humansPlausible
          ? "implausible or duplicated people in the frame"
          : !object.productTruthful
            ? `the product is shown wrongly: ${object.issues || "see product truth notes"}`
            : !object.noStrayText
              ? "the render contains invented text or interface chrome"
              : object.issues || "pack differs from reference";
    return { pass, issues: pass ? "none" : issues };
  } catch (e) {
    console.warn(`[pack-qa] check errored, accepting render: ${(e as Error).message?.slice(0, 160)}`);
    return { pass: true, issues: "qa-skipped" };
  }
}
