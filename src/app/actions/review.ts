"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";

/**
 * Human-review gate. A creative is not client-ready (exportable / shareable)
 * until an operator approves it in the studio. No automated QA — this is a
 * deliberate status flip, see CONTEXT.md "Review".
 */

async function loadOwned(creativeId: string, workspaceId: string) {
  const creative = await prisma.creative.findFirst({
    where: { id: creativeId, brand: { workspaceId }, deletedAt: null },
    select: { id: true, status: true },
  });
  if (!creative) return null;
  return creative;
}

export async function approveCreative(creativeId: string) {
  const auth = await requireAuth();
  const creative = await loadOwned(creativeId, auth.workspaceId);
  if (!creative) return { error: "Creative not found" };
  if (creative.status !== "READY") return { error: "Only finished creatives can be approved" };
  await prisma.creative.update({
    where: { id: creative.id },
    data: { approved: true, approvedAt: new Date() },
  });
  revalidatePath(`/library/${creativeId}`);
  return { ok: true };
}

export async function unapproveCreative(creativeId: string) {
  const auth = await requireAuth();
  const creative = await loadOwned(creativeId, auth.workspaceId);
  if (!creative) return { error: "Creative not found" };
  await prisma.creative.update({
    where: { id: creative.id },
    data: { approved: false, approvedAt: null },
  });
  revalidatePath(`/library/${creativeId}`);
  return { ok: true };
}

/** Guard for export/share server actions — throws if not approved. */
export async function assertApproved(creativeId: string, workspaceId: string) {
  const creative = await prisma.creative.findFirst({
    where: { id: creativeId, brand: { workspaceId }, deletedAt: null },
    select: { approved: true },
  });
  if (!creative?.approved) {
    throw new Error("This creative must be approved before it can be exported or shared.");
  }
}
