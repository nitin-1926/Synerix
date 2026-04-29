"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendInviteEmail } from "@/lib/email";
import { MembershipRole } from "@/generated/prisma/client";

const MANAGER_ROLES = new Set(["OWNER", "ADMIN"]);

/** Invites stay valid for 14 days. Google OAuth proves email ownership on
 * accept, so this window is about hygiene (don't leave invites open forever),
 * not security — a short 5-10 min code would just expire before most people
 * open the email. */
const INVITE_TTL_MS = 14 * 24 * 60 * 60 * 1000;
const inviteExpiry = () => new Date(Date.now() + INVITE_TTL_MS);

async function requireManager() {
  const ctx = await requireAuth();
  if (!ctx.isSuperAdmin && !MANAGER_ROLES.has(ctx.role)) {
    throw new Error("Only workspace owners and admins can manage members");
  }
  return ctx;
}

function parseRole(role: string): MembershipRole {
  if (!["ADMIN", "EDITOR", "VIEWER"].includes(role)) {
    throw new Error("Invalid role"); // OWNER is never assignable via invite/update
  }
  return role as MembershipRole;
}

export async function renameWorkspace(name: string) {
  const ctx = await requireManager();
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 60) throw new Error("Name must be 2–60 characters");
  await prisma.workspace.update({ where: { id: ctx.workspaceId }, data: { name: trimmed } });
  revalidatePath("/settings");
}

export async function inviteMember(email: string, role: string) {
  const ctx = await requireManager();
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new Error("Enter a valid email");
  const parsedRole = parseRole(role);

  const existingUser = await prisma.user.findUnique({
    where: { email: normalized },
    include: { memberships: { where: { workspaceId: ctx.workspaceId } } },
  });
  if (existingUser?.memberships.length) throw new Error("Already a member of this workspace");

  if (existingUser) {
    // Known user: add directly, no pending state needed.
    await prisma.membership.create({
      data: { workspaceId: ctx.workspaceId, userId: existingUser.id, role: parsedRole },
    });
    await prisma.workspaceInvite.deleteMany({
      where: { workspaceId: ctx.workspaceId, email: normalized },
    });
  } else {
    await prisma.workspaceInvite.upsert({
      where: { workspaceId_email: { workspaceId: ctx.workspaceId, email: normalized } },
      update: { role: parsedRole, status: "PENDING", invitedById: ctx.userId, expiresAt: inviteExpiry() },
      create: {
        workspaceId: ctx.workspaceId,
        email: normalized,
        role: parsedRole,
        invitedById: ctx.userId,
        expiresAt: inviteExpiry(),
      },
    });
  }

  // Courtesy notification — the invite works without it (auto-accepts on the
  // invitee's first Google sign-in), so a mail failure never fails the action.
  const emailSent = await sendInviteEmail({
    to: normalized,
    workspaceName: ctx.workspaceName,
    invitedByName: ctx.name,
    alreadyMember: Boolean(existingUser),
  });

  revalidatePath("/settings");
  return { emailSent };
}

/** Re-send the invite email and refresh the 14-day window. Only for still-
 * pending invites (an already-joined member has no pending invite row). */
export async function resendInvite(inviteId: string) {
  const ctx = await requireManager();
  const invite = await prisma.workspaceInvite.findFirst({
    where: { id: inviteId, workspaceId: ctx.workspaceId, status: "PENDING" },
  });
  if (!invite) throw new Error("Invite not found");
  await prisma.workspaceInvite.update({
    where: { id: invite.id },
    data: { expiresAt: inviteExpiry() },
  });
  const emailSent = await sendInviteEmail({
    to: invite.email,
    workspaceName: ctx.workspaceName,
    invitedByName: ctx.name,
    alreadyMember: false,
  });
  revalidatePath("/settings");
  return { emailSent };
}

export async function revokeInvite(inviteId: string) {
  const ctx = await requireManager();
  await prisma.workspaceInvite.update({
    where: { id: inviteId, workspaceId: ctx.workspaceId },
    data: { status: "REVOKED" },
  });
  revalidatePath("/settings");
}

export async function updateMemberRole(membershipId: string, role: string) {
  const ctx = await requireManager();
  const parsedRole = parseRole(role);
  const membership = await prisma.membership.findFirst({
    where: { id: membershipId, workspaceId: ctx.workspaceId },
  });
  if (!membership) throw new Error("Member not found");
  if (membership.role === "OWNER") throw new Error("The owner's role cannot be changed");
  await prisma.membership.update({ where: { id: membershipId }, data: { role: parsedRole } });
  revalidatePath("/settings");
}

export async function removeMember(membershipId: string) {
  const ctx = await requireManager();
  const membership = await prisma.membership.findFirst({
    where: { id: membershipId, workspaceId: ctx.workspaceId },
  });
  if (!membership) throw new Error("Member not found");
  if (membership.role === "OWNER") throw new Error("The owner cannot be removed");
  if (membership.userId === ctx.userId && !ctx.isSuperAdmin) {
    throw new Error("You cannot remove yourself");
  }
  await prisma.membership.delete({ where: { id: membershipId } });
  revalidatePath("/settings");
}
