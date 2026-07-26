"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/lib/nextauth";
import { requireAuth, ACTIVE_WORKSPACE_COOKIE, ADMIN_ACTING_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function signInWithGoogle(next?: string) {
  // "//evil.com" passes a bare startsWith("/") check and is protocol-relative.
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  await signIn("google", { redirectTo: safeNext });
}

export async function signOutAction() {
  const jar = await cookies();
  jar.delete(ACTIVE_WORKSPACE_COOKIE);
  // The god-view flag used to survive sign-out with its 30-day lifetime, so the
  // next sign-in on that browser silently landed inside a customer workspace.
  jar.delete(ADMIN_ACTING_COOKIE);
  await signOut({ redirectTo: "/login" });
}

/** Pin the active workspace (members always; any workspace for the super-admin). */
export async function setActiveWorkspace(workspaceId: string) {
  const ctx = await requireAuth();
  if (!ctx.isSuperAdmin) {
    const membership = await prisma.membership.findUnique({
      where: { workspaceId_userId: { workspaceId, userId: ctx.userId } },
    });
    if (!membership) throw new Error("Not a member of that workspace");
  } else {
    const ws = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    if (!ws) throw new Error("Workspace not found");
  }
  const jar = await cookies();
  jar.set(ACTIVE_WORKSPACE_COOKIE, workspaceId, sessionCookieOptions());
  redirect("/dashboard");
}
