/**
 * Credits owed back for a generation run that delivered only `delivered`
 * creatives. One formula for every refund path — worker finalize, the worker's
 * catchError, and the stall-healer — because each used to re-derive the debit
 * differently (per aspect, per queue item, flat perConcept) and
 * reconcileRunRefund pays the LARGEST amount any of them computes.
 *
 * A creative is one concept x one model variant and covers every requested
 * aspect, so the unit is what one creative cost at debit time. Runs from before
 * `creditsPerCreative` existed fall back to the debit spread over the creatives
 * it paid for (a compare run renders every concept on both models).
 */
export function undeliveredRefund(
  run: {
    creditsDebited: unknown;
    creditsPerCreative: unknown;
    conceptCount: number;
    imageModelPref: string | null;
  },
  delivered: number,
): number {
  const debited = Number(run.creditsDebited ?? 0);
  if (debited <= 0) return 0;
  const unit =
    run.creditsPerCreative != null
      ? Number(run.creditsPerCreative)
      : debited / Math.max(1, run.conceptCount * (run.imageModelPref === "compare" ? 2 : 1));
  return Math.max(0, Math.round((debited - delivered * unit) * 100) / 100);
}
