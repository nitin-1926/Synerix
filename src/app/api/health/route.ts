import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";

// Uptime probe. Deliberately leaks nothing: ok/degraded only, no DB
// identifiers or error details (those lived in the old _debug-db route).
export async function GET(req: Request) {
  if (!rateLimit(`health:${clientIp(req)}`, { limit: 30, windowMs: 60_000 })) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
