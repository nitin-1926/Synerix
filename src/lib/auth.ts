import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth, isSuperAdminEmail } from "@/lib/nextauth";

export interface AuthContext {
  userId: string;
  email: string;
  name: string | null;
  workspaceId: string;
  workspaceName: string;
  /** Customer account type — drives generation defaults + visible surfaces. */
  workspaceType: string;
  role: string;
  isSuperAdmin: boolean;
  /** All workspaces this user belongs to (createdAt asc) — saves layouts a re-query. */
  memberships: Array<{ workspaceId: string; workspaceName: string }>;
}

/** Cookie that pins the active workspace for multi-workspace users + admin god-view. */
export const ACTIVE_WORKSPACE_COOKIE = "sx-active-ws";

/** Set while a super-admin is "acting as" a customer (god-view inside the product
 * UI). When absent, a super-admin is redirected to the dedicated admin home. */
export const ADMIN_ACTING_COOKIE = "sx-admin-acting";

/** Shared options for the workspace/god-view cookies. Secure in production so
 * they are never sent over plain HTTP; httpOnly so client script cannot read
 * or forge them; lax so normal top-level navigation still carries them. */
export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}

/**
 * DEV-ONLY auth bypass. Active only when NODE_ENV !== "production" AND
 * DEV_AUTH_BYPASS=1. Resolves to a stable seeded dev user/workspace so the
 * full app is testable before Google auth is configured. Hard-fails closed
 * in production regardless of the flag.
 */
const DEV_BYPASS =
  process.env.NODE_ENV !== "production" && process.env.DEV_AUTH_BYPASS === "1";
const DEV_EMAIL = "dev@synerix.local";

type UserWithMemberships = NonNullable<
  Awaited<ReturnType<typeof findUserWithMemberships>>
>;

function findUserWithMemberships(where: { id: string } | { email: string }) {
  // Explicit select, not `include`: this runs on EVERY page render and EVERY
  // server action, against a database in another region, so it is the one query
  // whose payload is worth trimming to exactly the six fields the auth context
  // actually exposes.
  return prisma.user.findUnique({
    where: where as { id: string },
    select: {
      id: true,
      email: true,
      name: true,
      memberships: {
        orderBy: { createdAt: "asc" },
        select: {
          workspaceId: true,
          role: true,
          workspace: { select: { id: true, name: true, type: true } },
        },
      },
    },
  });
}

async function resolveDevUser(): Promise<UserWithMemberships> {
  const existing = await findUserWithMemberships({ email: DEV_EMAIL });
  if (existing?.memberships[0]) return existing;
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.upsert({
      where: { email: DEV_EMAIL },
      update: {},
      create: { email: DEV_EMAIL, name: "Dev User" },
    });
    let membership = await tx.membership.findFirst({ where: { userId: user.id } });
    if (!membership) {
      const workspace = await tx.workspace.create({
        data: { name: "Dev workspace", slug: `dev-${user.id.slice(0, 8)}`, ownerUserId: user.id },
      });
      membership = await tx.membership.create({
        data: { workspaceId: workspace.id, userId: user.id, role: "OWNER" },
      });
      // Dev convenience only: production signups start at 0 credits.
      await tx.workspaceCredits.create({ data: { workspaceId: workspace.id, balance: 100 } });
      await tx.creditLedger.create({
        data: { workspaceId: workspace.id, delta: 100, reason: "SIGNUP_GRANT", balanceAfter: 100, note: "Dev credits" },
      });
    }
    return tx.user.findUniqueOrThrow({
      where: { id: user.id },
      include: { memberships: { include: { workspace: true }, orderBy: { createdAt: "asc" } } },
    });
  });
}

/**
 * Accept any pending invites for this email, then require a workspace.
 * INVITE-ONLY: there is no self-serve signup — a Google sign-in without a
 * membership or pending invite lands on /request-access (no workspace is
 * created). The super-admin is the one exception (bootstraps a workspace so
 * the admin console is reachable on a fresh database).
 */
async function ensureMembership(user: UserWithMemberships, superAdmin: boolean): Promise<UserWithMemberships> {
  // Hot path: established users need no invite check or refetch. Invites for
  // existing users create memberships directly (see inviteMember), so PENDING
  // invites only ever apply to users signing in without a membership.
  if (user.memberships.length > 0) return user;

  const pendingInvites = await prisma.workspaceInvite.findMany({
    // An invite must carry a FUTURE expiry to grant membership. The old rule
    // also accepted `expiresAt: null` as "legacy, never expires" — meaning any
    // address ever typed into an invite box (a typo, a churned employee, a
    // recycled mailbox) could still walk into that workspace years later, with
    // no revoke path. Every invite created by workspace.ts sets an expiry, so
    // a null here is a stale row and is treated as expired; re-send to restore.
    where: {
      email: user.email,
      status: "PENDING",
      expiresAt: { gt: new Date() },
    },
  });

  if (pendingInvites.length > 0) {
    await prisma.$transaction(async (tx) => {
      for (const invite of pendingInvites) {
        await tx.membership.upsert({
          where: { workspaceId_userId: { workspaceId: invite.workspaceId, userId: user.id } },
          update: {},
          create: { workspaceId: invite.workspaceId, userId: user.id, role: invite.role },
        });
        await tx.workspaceInvite.update({
          where: { id: invite.id },
          data: { status: "ACCEPTED", acceptedAt: new Date() },
        });
      }
    });
  }

  let refreshed = await findUserWithMemberships({ id: user.id });
  if (!refreshed) redirect("/login");

  if (refreshed.memberships.length === 0) {
    // Invite-only: no membership and no invite → not a customer (yet).
    if (!superAdmin) redirect("/request-access");
    const baseName = refreshed.name || refreshed.email.split("@")[0];
    await prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          name: `${baseName}'s workspace`,
          slug: `ws-${refreshed!.id.slice(0, 8)}`,
          ownerUserId: refreshed!.id,
        },
      });
      await tx.membership.create({
        data: { workspaceId: workspace.id, userId: refreshed!.id, role: "OWNER" },
      });
      // Zero-credit start: explorable product, generation gated on a grant.
      await tx.workspaceCredits.create({ data: { workspaceId: workspace.id, balance: 0 } });
    });
    refreshed = await findUserWithMemberships({ id: user.id });
    if (!refreshed) redirect("/login");
  }

  return refreshed;
}

/**
 * Pick the active workspace: the cookie-pinned one if this user may access it
 * (member, or super-admin god-view), else the first membership.
 */
async function resolveActiveWorkspace(user: UserWithMemberships, superAdmin: boolean) {
  const jar = await cookies();
  const pinned = jar.get(ACTIVE_WORKSPACE_COOKIE)?.value;

  if (pinned) {
    const membership = user.memberships.find((m) => m.workspaceId === pinned);
    if (membership) {
      return { workspaceId: membership.workspaceId, workspaceName: membership.workspace.name, workspaceType: membership.workspace.type as string, role: membership.role as string };
    }
    if (superAdmin) {
      const ws = await prisma.workspace.findUnique({ where: { id: pinned } });
      if (ws) return { workspaceId: ws.id, workspaceName: ws.name, workspaceType: ws.type as string, role: "OWNER" };
    }
  }

  const first = user.memberships[0];
  return { workspaceId: first.workspaceId, workspaceName: first.workspace.name, workspaceType: first.workspace.type as string, role: first.role as string };
}

/**
 * Resolve the signed-in user → app User + active Workspace, accepting pending
 * invites and bootstrapping a zero-credit workspace on first login.
 * Authorization is enforced at this data layer (all queries filter by the
 * resolved workspaceId).
 */
export const requireAuth = cache(async (): Promise<AuthContext> => {
  let user: UserWithMemberships;
  let superAdmin: boolean;

  if (DEV_BYPASS) {
    user = await resolveDevUser();
    superAdmin = true; // dev bypass can exercise the admin console
  } else {
    const session = await auth();
    const sessionUser = session?.user;
    if (!sessionUser?.email) redirect("/login");

    const found =
      (sessionUser.id ? await findUserWithMemberships({ id: sessionUser.id }) : null) ??
      (await findUserWithMemberships({ email: sessionUser.email }));
    if (!found) redirect("/login");
    user = found;
    superAdmin = isSuperAdminEmail(user.email);
  }

  user = await ensureMembership(user, superAdmin);
  const active = await resolveActiveWorkspace(user, superAdmin);

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    workspaceId: active.workspaceId,
    workspaceName: active.workspaceName,
    workspaceType: active.workspaceType,
    role: active.role,
    isSuperAdmin: superAdmin,
    memberships: user.memberships.map((m) => ({
      workspaceId: m.workspaceId,
      workspaceName: m.workspace.name,
    })),
  };
});

/**
 * Guard for any action that spends credits or changes workspace data.
 *
 * The VIEWER role existed in the schema and was enforced NOWHERE — `ctx.role`
 * was read only for member management, so a read-only member could generate
 * creatives (spending the workspace's credits), delete products and edit the
 * brand. Roles are hierarchical: OWNER/ADMIN manage members, EDITOR and above
 * may write, VIEWER may only read.
 */
const WRITE_ROLES = new Set(["OWNER", "ADMIN", "EDITOR"]);

export async function requireWriteAccess(): Promise<AuthContext> {
  const ctx = await requireAuth();
  if (!ctx.isSuperAdmin && !WRITE_ROLES.has(ctx.role)) {
    throw new Error("Your access to this workspace is read-only");
  }
  return ctx;
}

/** Guard for the admin console: redirects non-super-admins to the app. */
export async function requireSuperAdmin(): Promise<AuthContext> {
  const ctx = await requireAuth();
  if (!ctx.isSuperAdmin) redirect("/dashboard");
  return ctx;
}
