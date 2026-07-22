import { prisma } from "@/lib/db";
import type { CostSummary } from "./cost";
import type { Prisma } from "@/generated/prisma/client";

/** Where a batch of API cost came from. */
export type CostSource = "generation" | "dissect" | "brand-research" | "enhance" | "editor" | "cutout";

/** Coarse provider label derived from the model/cost id (for grouping). */
function providerOf(model: string): string {
  if (model.startsWith("claude-")) return "anthropic";
  if (model.startsWith("gemini-") || model.startsWith("google:")) return "google";
  if (model.startsWith("gpt-")) return "openai";
  if (model.startsWith("bytedance:") || model.startsWith("bfl:")) return "runware";
  return "other";
}

/**
 * Persist a CostTracker summary as one row per API call into `api_cost_log`.
 * Fire-and-forget: cost logging must NEVER break a run, so failures are swallowed.
 */
export async function persistCost(opts: {
  summary: CostSummary;
  source: CostSource;
  workspaceId?: string | null;
  runId?: string | null;
}): Promise<void> {
  const base = { workspaceId: opts.workspaceId ?? null, runId: opts.runId ?? null, source: opts.source };
  const rows: Prisma.ApiCostLogCreateManyInput[] = [
    ...opts.summary.llm.map((e) => ({
      ...base,
      kind: "LLM" as const,
      provider: providerOf(e.model),
      model: e.model,
      stage: e.stage,
      inputTokens: e.inputTokens,
      outputTokens: e.outputTokens,
      imageCount: 0,
      usd: e.usd,
    })),
    ...opts.summary.images.map((e) => ({
      ...base,
      kind: "IMAGE" as const,
      provider: providerOf(e.model),
      model: e.model,
      stage: e.stage,
      inputTokens: 0,
      outputTokens: 0,
      imageCount: 1,
      usd: e.usd,
    })),
  ];
  if (!rows.length) return;
  try {
    await prisma.apiCostLog.createMany({ data: rows });
  } catch (e) {
    console.warn("[cost-log] persist failed", (e as Error).message);
  }
}
