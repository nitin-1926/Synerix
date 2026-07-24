import { prisma } from "@/lib/db";
import { CREDIT_COSTS } from "@/lib/ai/models";
import { reconcileRunRefund } from "@/lib/credits";
import type { GenerationStatus } from "@/generated/prisma/client";

/**
 * Recovery for runs whose worker died without running catchError — an OOM kill
 * or a hard crash kills the process, so the task's own error handling never
 * executes and the row sits non-terminal forever (spinner in the studio, credits
 * held). generation-run's maxDuration is 900s, so anything still non-terminal
 * well past that is definitively dead.
 */
const TERMINAL: GenerationStatus[] = ["COMPLETE", "PARTIAL", "FAILED"];
export const RUN_STALL_MS = Number(process.env.RUN_STALL_MS ?? 20 * 60 * 1000);

/**
 * Fail a stalled run and refund what it never delivered. Idempotent and
 * race-safe: the status flip is conditional (only one caller wins) and the
 * refund is reconciled against prior refunds for the same run, so the page
 * render, the scheduled sweep and a concurrent tab can all call this freely.
 * Returns the new status, or null when the run is healthy / already terminal.
 */
export async function healStalledRun(runId: string): Promise<GenerationStatus | null> {
  const run = await prisma.generationRun.findUnique({
    where: { id: runId },
    select: { id: true, workspaceId: true, status: true, startedAt: true, creditsDebited: true },
  });
  if (!run || TERMINAL.includes(run.status)) return null;
  if (Date.now() - run.startedAt.getTime() < RUN_STALL_MS) return null;

  const delivered = await prisma.creative.count({ where: { generationRunId: run.id, status: "READY" } });
  const nextStatus: GenerationStatus = delivered > 0 ? "PARTIAL" : "FAILED";
  const flipped = await prisma.generationRun.updateMany({
    where: { id: run.id, status: { notIn: TERMINAL } },
    data: {
      status: nextStatus,
      finishedAt: new Date(),
      error: "Run stalled (worker lost) — auto-failed",
    },
  });
  if (flipped.count > 0 && Number(run.creditsDebited) > 0) {
    await reconcileRunRefund({
      workspaceId: run.workspaceId,
      generationRunId: run.id,
      owedRefund: Number(run.creditsDebited) - delivered * CREDIT_COSTS.perConcept,
      note: "Run stalled — automatic refund",
    });
  }
  return nextStatus;
}

/** Sweep every stalled run. Used by the scheduled healer so recovery never
 * depends on a user opening the studio page for that specific run. */
export async function healAllStalledRuns(): Promise<{ healed: number; runIds: string[] }> {
  const stalled = await prisma.generationRun.findMany({
    where: { status: { notIn: TERMINAL }, startedAt: { lt: new Date(Date.now() - RUN_STALL_MS) } },
    select: { id: true },
    take: 100,
  });
  const runIds: string[] = [];
  for (const { id } of stalled) {
    if (await healStalledRun(id)) runIds.push(id);
  }
  return { healed: runIds.length, runIds };
}
