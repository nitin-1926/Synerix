"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Send, UserPlus, X } from "lucide-react";
import {
  inviteMember,
  removeMember,
  renameWorkspace,
  resendInvite,
  revokeInvite,
  setWorkspaceImageModel,
  setWorkspaceType,
  updateMemberRole,
} from "@/app/actions/workspace";
import { AccountTypePicker } from "@/components/account-type-picker";
import type { WorkspaceTypeId } from "@/lib/workspace-type";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Member {
  membershipId: string;
  userId: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
}

interface Invite {
  id: string;
  email: string;
  role: string;
  expiresAt: string | null;
}

function inviteExpiryLabel(expiresAt: string | null): string {
  if (!expiresAt) return "No expiry";
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Expired, resend to renew";
  const days = Math.ceil(ms / (24 * 60 * 60 * 1000));
  return days <= 1 ? "Expires within a day" : `Expires in ${days} days`;
}

// Workspace-scoped roles only. "Workspace admin" manages members of THIS
// workspace — it is unrelated to the platform super-admin (email-allowlisted,
// admin console + cost dashboards), which is never assignable here.
const ASSIGNABLE_ROLES = [
  { value: "ADMIN", label: "Workspace admin" },
  { value: "EDITOR", label: "Editor" },
  { value: "VIEWER", label: "Viewer" },
];

function roleLabel(role: string) {
  if (role === "OWNER") return "Owner";
  return ASSIGNABLE_ROLES.find((r) => r.value === role)?.label ?? role.toLowerCase();
}

function errorMessage(e: unknown) {
  return e instanceof Error ? e.message : "Something went wrong";
}

const DEFAULT_MODEL = "__default__"; // Select needs a non-empty value for "use cascade"

export function SettingsClient(props: {
  workspaceName: string;
  workspaceType: string;
  canManage: boolean;
  isSuperAdmin: boolean;
  imageModel: string | null;
  imageModelOptions: { key: string; label: string; hint: string }[];
  currentUserId: string;
  members: Member[];
  invites: Invite[];
}) {
  const [pending, startTransition] = useTransition();
  const [wsName, setWsName] = useState(props.workspaceName);
  const [wsType, setWsType] = useState(props.workspaceType as WorkspaceTypeId);
  const [imageModel, setImageModel] = useState(props.imageModel ?? DEFAULT_MODEL);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("EDITOR");
  // Two-step remove: first click arms, second confirms. Removal is one click
  // away from locking a teammate out, so it should never be a misclick.
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  function run(fn: () => Promise<void>, success: string) {
    startTransition(async () => {
      try {
        await fn();
        toast.success(success);
      } catch (e) {
        toast.error(errorMessage(e));
      }
    });
  }

  const imageModelItems = [
    { value: DEFAULT_MODEL, label: "Default (quality-first cascade)" },
    ...props.imageModelOptions.map((m) => ({ value: m.key, label: m.label })),
  ];

  return (
    <div>
      <Section title="Workspace" description="Your workspace name and the kind of creatives it makes.">
        {props.canManage && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="ws-name">Workspace name</Label>
              <Input
                id="ws-name"
                value={wsName}
                onChange={(e) => setWsName(e.target.value)}
                maxLength={60}
              />
            </div>
            <Button
              variant="secondary"
              disabled={pending || wsName.trim() === props.workspaceName || wsName.trim().length < 2}
              onClick={() => run(() => renameWorkspace(wsName), "Workspace renamed")}
            >
              Save
            </Button>
          </div>
        )}

        {/* Account type — sets the photography + concept style of future
            generations. Editable by owner/admin; read-only for everyone else. */}
        <div className="space-y-2">
          <Label>Account type</Label>
          <p className="text-xs text-muted-foreground">
            Sets the photography &amp; concept style of future generations. Existing creatives are unaffected.
          </p>
          <AccountTypePicker
            value={wsType}
            disabled={!props.canManage || pending}
            onChange={(id) => {
              if (id === wsType) return;
              const prev = wsType;
              setWsType(id);
              startTransition(async () => {
                try {
                  await setWorkspaceType(id);
                  toast.success("Account type updated");
                } catch (e) {
                  setWsType(prev);
                  toast.error(errorMessage(e));
                }
              });
            }}
          />
        </div>
      </Section>

      {/* Image model — platform super-admin only. Sets the model every run in
          this workspace prefers (fallback cascade kept behind it). */}
      {props.isSuperAdmin && (
        <Section
          title="Image model"
          description="Only you (platform admin) can see and change this."
        >
          <div className="space-y-1.5">
            <Label>Preferred model</Label>
            <Select
              items={imageModelItems}
              value={imageModel}
              onValueChange={(v) => {
                if (!v || v === imageModel) return;
                setImageModel(v);
                run(() => setWorkspaceImageModel(v === DEFAULT_MODEL ? null : v), "Image model updated");
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={DEFAULT_MODEL}>Default (quality-first cascade)</SelectItem>
                {props.imageModelOptions.map((m) => (
                  <SelectItem key={m.key} value={m.key}>
                    {m.label}: {m.hint}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Every generation in this workspace prefers the chosen model; the resilience fallback cascade stays
              behind it.
            </p>
          </div>
        </Section>
      )}

      <Section title="Team" description="Who can use this workspace and what they can do.">
        {props.canManage && (
          <form
            className="flex flex-col gap-2 sm:flex-row sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              startTransition(async () => {
                try {
                  const res = await inviteMember(inviteEmail, inviteRole);
                  setInviteEmail("");
                  toast.success(
                    res?.emailSent
                      ? "Invite email sent. They'll join when they sign in with Google"
                      : "Invited. Email delivery is off, so share the sign-in link with them yourself",
                  );
                } catch (err) {
                  toast.error(errorMessage(err));
                }
              });
            }}
          >
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="invite-email">Invite by email</Label>
              <Input
                id="invite-email"
                type="email"
                required
                placeholder="teammate@business.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="w-full space-y-1.5 sm:w-40">
              <Label>Role</Label>
              <Select items={ASSIGNABLE_ROLES} value={inviteRole} onValueChange={(v) => v && setInviteRole(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSIGNABLE_ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={pending || !inviteEmail}>
              <UserPlus className="mr-1.5 size-4" />
              Invite
            </Button>
          </form>
        )}

        <div className="space-y-2">
          <h3 className="text-sm font-medium">
            Members <span className="ml-1 tabular-nums text-muted-foreground">{props.members.length}</span>
          </h3>
          <ul className="divide-y divide-border rounded-2xl border border-border">
            {props.members.map((m) => (
              <li key={m.membershipId} className="flex items-center gap-3 px-4 py-3">
                {m.image ? (
                  // eslint-disable-next-line @next/next/no-img-element -- avatar from Google, already tiny
                  <img src={m.image} alt="" className="size-9 shrink-0 rounded-full" />
                ) : (
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold uppercase text-primary">
                    {(m.name ?? m.email).slice(0, 1)}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {m.name ?? m.email}
                    {m.userId === props.currentUserId && (
                      <span className="ml-1.5 text-xs font-normal text-muted-foreground">(you)</span>
                    )}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                </div>
                {m.role === "OWNER" || !props.canManage ? (
                  <Badge variant="secondary">{roleLabel(m.role)}</Badge>
                ) : confirmRemove === m.membershipId ? (
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-10 sm:h-8"
                      disabled={pending}
                      onClick={() => {
                        setConfirmRemove(null);
                        run(() => removeMember(m.membershipId), "Member removed");
                      }}
                    >
                      Remove
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-10 sm:h-8"
                      onClick={() => setConfirmRemove(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex shrink-0 items-center gap-2">
                    <Select
                      items={ASSIGNABLE_ROLES}
                      value={m.role}
                      onValueChange={(v) =>
                        v && v !== m.role && run(() => updateMemberRole(m.membershipId, v), "Role updated")
                      }
                    >
                      <SelectTrigger className="h-10 w-32 text-xs sm:h-8 sm:w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ASSIGNABLE_ROLES.map((r) => (
                          <SelectItem key={r.value} value={r.value}>
                            {r.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-10 text-muted-foreground hover:bg-destructive/10 hover:text-destructive sm:size-8"
                      title="Remove member"
                      aria-label={`Remove ${m.email}`}
                      disabled={pending || m.userId === props.currentUserId}
                      onClick={() => setConfirmRemove(m.membershipId)}
                    >
                      <X />
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        {props.invites.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">
              Pending invites{" "}
              <span className="ml-1 tabular-nums text-muted-foreground">{props.invites.length}</span>
            </h3>
            <ul className="divide-y divide-border rounded-2xl border border-dashed border-border">
              {props.invites.map((i) => {
                const expired = !!i.expiresAt && new Date(i.expiresAt).getTime() <= Date.now();
                return (
                  <li key={i.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm">{i.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Joins as {roleLabel(i.role).toLowerCase()} on first Google sign-in
                        {" · "}
                        <span className={expired ? "text-amber-700 dark:text-amber-500" : undefined}>
                          {inviteExpiryLabel(i.expiresAt)}
                        </span>
                      </p>
                    </div>
                    {props.canManage && (
                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-10 sm:size-8"
                          title="Resend invite email"
                          aria-label={`Resend invite for ${i.email}`}
                          disabled={pending}
                          onClick={() =>
                            startTransition(async () => {
                              try {
                                const res = await resendInvite(i.id);
                                toast.success(
                                  res?.emailSent
                                    ? "Invite email resent"
                                    : "Invite renewed, but email delivery is off",
                                );
                              } catch (err) {
                                toast.error(errorMessage(err));
                              }
                            })
                          }
                        >
                          <Send />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-10 text-muted-foreground hover:bg-destructive/10 hover:text-destructive sm:size-8"
                          title="Revoke invite"
                          aria-label={`Revoke invite for ${i.email}`}
                          disabled={pending}
                          onClick={() => run(() => revokeInvite(i.id), "Invite revoked")}
                        >
                          <X />
                        </Button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </Section>
    </div>
  );
}

function Section(props: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-5 border-t border-border py-8 first:border-t-0 first:pt-0 lg:grid-cols-[15rem_1fr] lg:gap-12">
      <div>
        <h2 className="text-base font-semibold">{props.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{props.description}</p>
      </div>
      <div className="min-w-0 space-y-6">{props.children}</div>
    </section>
  );
}
