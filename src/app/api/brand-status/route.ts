import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** How long an ingest may sit in a non-terminal state before the poller
 * declares it lost (worker killed mid-crawl, redeploy, etc.). Generous —
 * a normal ingest finishes in 1-3 minutes. */
const INGEST_STALL_MS = 15 * 60_000;
const NON_TERMINAL = ["PENDING", "CRAWLING", "EXTRACTING"] as const;

export async function GET() {
  const auth = await requireAuth();
  const brand = await prisma.brand.findFirst({
    where: { workspaceId: auth.workspaceId },
    select: { id: true, name: true, ingestStatus: true, ingestError: true, primaryColorHex: true, updatedAt: true },
  });
  if (!brand) return NextResponse.json({ ingestStatus: "NONE" });

  // Stall healer: brand-ingest's catchError only covers thrown errors — a
  // lost worker leaves the status non-terminal forever and the onboarding
  // wizard would spin indefinitely. Conditional update = race-safe (a worker
  // finishing concurrently wins by flipping status first).
  if (
    (NON_TERMINAL as readonly string[]).includes(brand.ingestStatus) &&
    Date.now() - brand.updatedAt.getTime() > INGEST_STALL_MS
  ) {
    const healed = await prisma.brand.updateMany({
      where: { id: brand.id, ingestStatus: { in: [...NON_TERMINAL] } },
      data: { ingestStatus: "FAILED", ingestError: "Analysis timed out — please try again" },
    });
    if (healed.count > 0) {
      return NextResponse.json({
        ...brand,
        ingestStatus: "FAILED",
        ingestError: "Analysis timed out — please try again",
      });
    }
  }

  return NextResponse.json(brand);
}
