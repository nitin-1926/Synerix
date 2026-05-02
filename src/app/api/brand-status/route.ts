import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const auth = await requireAuth();
  const brand = await prisma.brand.findFirst({
    where: { workspaceId: auth.workspaceId },
    select: { id: true, name: true, ingestStatus: true, ingestError: true, primaryColorHex: true },
  });
  return NextResponse.json(brand ?? { ingestStatus: "NONE" });
}
