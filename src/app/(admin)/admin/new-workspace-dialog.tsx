"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { adminCreateWorkspace } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AccountTypePicker } from "@/components/account-type-picker";
import type { WorkspaceTypeId } from "@/lib/workspace-type";

/** Admin-provisioned workspace creation (invite-only onboarding). */
export function NewWorkspaceDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<WorkspaceTypeId>("FMCG_PRODUCT");
  const [url, setUrl] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      // On success the action redirects into the new workspace (god-view); a
      // returned object only happens on validation error.
      const res = await adminCreateWorkspace({ name: name.trim(), type, websiteUrl: url.trim() || undefined });
      if (res?.error) toast.error(res.error);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus className="mr-1.5 size-4" />
        New workspace
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New customer workspace</DialogTitle>
          <DialogDescription>
            Create the workspace now and finish brand setup + invites inside it. Nothing is gated — it goes live immediately.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ws-name">Workspace name</Label>
            <Input
              id="ws-name"
              required
              autoFocus
              placeholder="e.g. Gillco Agro"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Account type</Label>
            <AccountTypePicker name="ws-type" value={type} onChange={setType} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ws-url">Client website (optional)</Label>
            <Input
              id="ws-url"
              placeholder="gillco.in — we'll pull their brand kit"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              If provided, we start extracting their logo, colours and voice. You can also set it up by hand later.
            </p>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending || name.trim().length < 2}>
              {pending ? "Creating…" : "Create & open"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
