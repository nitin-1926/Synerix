import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { WORKSPACE_IMAGE_MODELS } from "@/lib/image/provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SettingsClient } from "./settings-client";

export const metadata = { title: "Settings — Synerix Studio" };

export default async function SettingsPage() {
  const ctx = await requireAuth();

  const [workspace, members, invites] = await Promise.all([
    prisma.workspace.findUniqueOrThrow({ where: { id: ctx.workspaceId } }),
    prisma.membership.findMany({
      where: { workspaceId: ctx.workspaceId },
      include: { user: { select: { id: true, name: true, email: true, image: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.workspaceInvite.findMany({
      where: { workspaceId: ctx.workspaceId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const canManage = ctx.isSuperAdmin || ["OWNER", "ADMIN"].includes(ctx.role);

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Workspace</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">Settings</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Manage your workspace, team members and invitations.
      </p>

      <div className="mt-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Team</CardTitle>
          </CardHeader>
          <CardContent>
            <SettingsClient
              workspaceName={workspace.name}
              canManage={canManage}
              isSuperAdmin={ctx.isSuperAdmin}
              imageModel={workspace.imageModel}
              imageModelOptions={WORKSPACE_IMAGE_MODELS.map((m) => ({ key: m.key, label: m.label, hint: m.hint }))}
              currentUserId={ctx.userId}
              members={members.map((m) => ({
                membershipId: m.id,
                userId: m.user.id,
                name: m.user.name,
                email: m.user.email,
                image: m.user.image,
                role: m.role,
              }))}
              invites={invites.map((i) => ({
                id: i.id,
                email: i.email,
                role: i.role,
                expiresAt: i.expiresAt ? i.expiresAt.toISOString() : null,
              }))}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
