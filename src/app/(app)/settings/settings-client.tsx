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
import { Separator } from "@/components/ui/separator";

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

  return (
    <div className="space-y-6">
      {/* Workspace name */}
      {props.canManage && (
        <>
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
          <Separator />
        </>
      )}

      {/* Account type — sets the photography + concept style of future
          generations. Editable by owner/admin; read-only for everyone else. */}
      <div className="space-y-1.5">
        <Label>Account type</Label>
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
        <p className="text-xs text-muted-foreground">
          Sets the photography &amp; concept style of future generations. Existing creatives are unaffected.
        </p>
      </div>
      <Separator />

      {/* Image model — platform super-admin only. Sets the model every run in
          this workspace prefers (fallback cascade kept behind it). */}
      {props.isSuperAdmin && (
        <>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <Label>Image model (admin)</Label>
              <Select
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
                      {m.label} — {m.hint}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Only you (platform admin) can see and change this. Every generation in this workspace prefers the chosen
                model; the resilience fallback cascade stays behind it.
              </p>
            </div>
          </div>
          <Separator />
        </>
      )}

      {/* Invite */}
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
                    ? "Invite email sent — they'll join when they sign in with Google"
                    : "Invited — email delivery is off, so share the sign-in link with them yourself",
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
          <div className="w-full space-y-1.5 sm:w-36">
            <Label>Role</Label>
            <Select value={inviteRole} onValueChange={(v) => v && setInviteRole(v)}>
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

      {/* Members */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Members ({props.members.length})</p>
        <ul className="divide-y divide-border rounded-lg border border-border">
          {props.members.map((m) => (
            <li key={m.membershipId} className="flex items-center gap-3 px-4 py-3">
              {m.image ? (
                // eslint-disable-next-line @next/next/no-img-element -- avatar from Google, already tiny
                <img src={m.image} alt="" className="size-8 rounded-full" />
              ) : (
                <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold uppercase text-primary">
                  {(m.name ?? m.email).slice(0, 1)}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {m.name ?? m.email}
                  {m.userId === props.currentUserId && (
                    <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>
                  )}
                </p>
                <p className="truncate text-xs text-muted-foreground">{m.email}</p>
              </div>
              {m.role === "OWNER" || !props.canManage ? (
                <Badge variant="secondary">{m.role.toLowerCase()}</Badge>
              ) : (
                <div className="flex items-center gap-1">
                  <Select
                    value={m.role}
                    onValueChange={(v) =>
                      v && v !== m.role && run(() => updateMemberRole(m.membershipId, v), "Role updated")
                    }
                  >
                    <SelectTrigger className="h-8 w-28 text-xs">
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
                    size="icon-sm"
                    title="Remove member"
                    aria-label={`Remove ${m.email}`}
                    disabled={pending || m.userId === props.currentUserId}
                    onClick={() => run(() => removeMember(m.membershipId), "Member removed")}
                  >
                    <X />
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Pending invites */}
      {props.invites.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Pending invites ({props.invites.length})</p>
          <ul className="divide-y divide-border rounded-lg border border-dashed border-border">
            {props.invites.map((i) => (
              <li key={i.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{i.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Joins as {i.role.toLowerCase()} on first Google sign-in
                    {" · "}
                    {inviteExpiryLabel(i.expiresAt)}
                  </p>
                </div>
                {props.canManage && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
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
                      size="icon-sm"
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
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
