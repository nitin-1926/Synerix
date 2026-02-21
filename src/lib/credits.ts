import { prisma } from "@/lib/db";
import type { CreditReason } from "@/generated/prisma/client";

export class InsufficientCreditsError extends Error {
  constructor(public balance: number, public required: number) {
    super(`Insufficient credits: have ${balance}, need ${required}`);
  }
}

/** Credits are Decimal(12,2) in the DB (fractional charges like 0.25 for
 * prompt enhancement). All public APIs here speak plain numbers. */
const toNum = (d: unknown): number => Number(d ?? 0);

/** Format a credit amount for display: "8", "0.25", "16.5". */
export function formatCredits(amount: unknown): string {
  const n = toNum(amount);
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
}

/**
 * Atomically debit credits (append-only ledger + cached balance in one
 * transaction). Throws InsufficientCreditsError without writing on shortfall.
 */
export async function debitCredits(opts: {
  workspaceId: string;
  amount: number;
  reason: CreditReason;
  generationRunId?: string;
  note?: string;
}): Promise<number> {
  return prisma.$transaction(async (tx) => {
    // Atomic guarded debit: the conditional UPDATE takes a row lock and
    // re-checks `balance >= amount` against the CURRENT row, so two concurrent
    // runs can't both pass a stale read-then-write and double-spend (the old
    // read-in-JS-then-write-absolute was a classic lost-update race). 0 rows
    // affected ⇒ the row is missing or underfunded.
    const res = await tx.workspaceCredits.updateMany({
      where: { workspaceId: opts.workspaceId, balance: { gte: opts.amount } },
      data: { balance: { decrement: opts.amount } },
    });
    if (res.count === 0) {
      const credits = await tx.workspaceCredits.findUnique({ where: { workspaceId: opts.workspaceId } });
      throw new InsufficientCreditsError(toNum(credits?.balance), opts.amount);
    }
    const credits = await tx.workspaceCredits.findUniqueOrThrow({ where: { workspaceId: opts.workspaceId } });
    const after = toNum(credits.balance);
    await tx.creditLedger.create({
      data: {
        workspaceId: opts.workspaceId,
        delta: -opts.amount,
        reason: opts.reason,
        generationRunId: opts.generationRunId,
        balanceAfter: after,
        note: opts.note,
      },
    });
    return after;
  });
}

/**
 * Idempotent refund reconciliation for a run: bring the total REFUND credited
 * for `generationRunId` up to `owedRefund`, never past it. Both the worker's
 * catchError and the studio page's stall-recovery can fire for the same run
 * (and each can race itself across tabs); routing every run refund through this
 * makes duplicates converge instead of stacking. Returns the delta granted (0
 * if already fully refunded). The aggregate + upsert share one row-locked tx.
 */
export async function reconcileRunRefund(opts: {
  workspaceId: string;
  generationRunId: string;
  owedRefund: number;
  note?: string;
}): Promise<number> {
  const owed = Math.max(0, Math.round(opts.owedRefund * 100) / 100);
  return prisma.$transaction(async (tx) => {
    const prior = await tx.creditLedger.aggregate({
      where: { generationRunId: opts.generationRunId, reason: "REFUND" },
      _sum: { delta: true },
    });
    const alreadyRefunded = toNum(prior._sum.delta);
    const remaining = Math.round((owed - alreadyRefunded) * 100) / 100;
    if (remaining <= 0) return 0;
    const updated = await tx.workspaceCredits.upsert({
      where: { workspaceId: opts.workspaceId },
      create: { workspaceId: opts.workspaceId, balance: remaining },
      update: { balance: { increment: remaining } },
    });
    const after = toNum(updated.balance);
    await tx.creditLedger.create({
      data: {
        workspaceId: opts.workspaceId,
        delta: remaining,
        reason: "REFUND",
        generationRunId: opts.generationRunId,
        balanceAfter: after,
        note: opts.note,
      },
    });
    return remaining;
  });
}

/** Grant or refund credits (positive delta). */
export async function grantCredits(opts: {
  workspaceId: string;
  amount: number;
  reason: CreditReason;
  generationRunId?: string;
  note?: string;
}): Promise<number> {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.workspaceCredits.upsert({
      where: { workspaceId: opts.workspaceId },
      create: { workspaceId: opts.workspaceId, balance: opts.amount },
      update: { balance: { increment: opts.amount } },
    });
    const after = toNum(updated.balance);
    await tx.creditLedger.create({
      data: {
        workspaceId: opts.workspaceId,
        delta: opts.amount,
        reason: opts.reason,
        generationRunId: opts.generationRunId,
        balanceAfter: after,
        note: opts.note,
      },
    });
    return after;
  });
}

export async function getBalance(workspaceId: string): Promise<number> {
  const credits = await prisma.workspaceCredits.findUnique({ where: { workspaceId } });
  return toNum(credits?.balance);
}
