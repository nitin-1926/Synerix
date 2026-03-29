import { generateScene, type SceneAspect } from "@/lib/image/provider";
import { buildTypographyEditPrompt } from "./image-prompt";
import { checkBakedText } from "./text-qa";
import type { CostTracker } from "./cost";

/**
 * PASS 2 of the render pipeline — set the headline/CTA into a finished
 * wordless scene via image edit, QA-verified (spelling + overlap) with ONE
 * retry. Because the type pass sees the final scene, retries are cheap (the
 * scene is never re-rendered) and placement can avoid faces/product.
 * Shared by the generation task and the editor's baked-text actions.
 */
export async function applyTypographyPass(opts: {
  scenePlate: Buffer;
  headline: string;
  cta: string | null;
  language: string;
  typographySpec?: string | null;
  paletteHexes?: string[];
  aspect: SceneAspect;
  tracker?: CostTracker;
}): Promise<{ plate: Buffer; ok: boolean; issues?: string }> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const prompt = buildTypographyEditPrompt({
      headline: opts.headline,
      cta: opts.cta,
      language: opts.language,
      typographySpec: opts.typographySpec,
      paletteHexes: opts.paletteHexes,
    });
    const gen = await generateScene({
      prompt,
      aspect: opts.aspect,
      references: [{ buffer: opts.scenePlate, mime: "image/png" }],
    });
    opts.tracker?.addImage(gen.costModel, "typography");
    const qa = await checkBakedText({
      image: gen.buffer,
      headline: opts.headline,
      cta: opts.cta,
      language: opts.language,
      tracker: opts.tracker,
    });
    if (qa.pass) return { plate: gen.buffer, ok: true };
    console.warn(`[typography] QA failed (attempt ${attempt + 1}): ${qa.issues}`);
  }
  return { plate: opts.scenePlate, ok: false, issues: "typography QA failed twice" };
}
