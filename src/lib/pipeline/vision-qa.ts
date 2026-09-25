import { generateObject, type UserContent } from "ai";
import type { z } from "zod";
import { MODELS, resolveLanguageModel } from "@/lib/ai/models";
import type { CostTracker } from "./cost";

/** Outcome of a vision QA check: pass, or a reason the corrective retry can use. */
export interface QaVerdict {
  pass: boolean;
  issues: string;
}

/**
 * Shared wrapper for the vision QA checks (pack / placement / on-model): one
 * structured verdict from MODELS.textQa, billed under `stage`, reduced to a
 * QaVerdict by `judge`. Fail-open — any error (model, schema, judge) accepts
 * the image, so a QA outage never kills a paid run.
 */
export async function runVisionQa<S extends z.ZodType>(opts: {
  /** Cost stage and log tag, e.g. "pack-qa". */
  stage: string;
  /** What a fail-open accepts, for the warning log ("render", "composition"). */
  subject: string;
  schema: S;
  content: UserContent;
  judge: (verdict: z.infer<S>) => QaVerdict;
  tracker?: CostTracker;
}): Promise<QaVerdict> {
  try {
    const { object, usage } = await generateObject({
      model: resolveLanguageModel(MODELS.textQa),
      schema: opts.schema,
      messages: [{ role: "user", content: opts.content }],
    });
    opts.tracker?.addLLM(MODELS.textQa, usage, opts.stage);
    return opts.judge(object as z.infer<S>);
  } catch (e) {
    console.warn(`[${opts.stage}] check errored, accepting ${opts.subject}: ${(e as Error).message?.slice(0, 160)}`);
    return { pass: true, issues: "qa-skipped" };
  }
}
