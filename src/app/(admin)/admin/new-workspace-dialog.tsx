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

const WORKSPACE_TYPES = [
  { id: "FMCG_PRODUCT", label: "FMCG / Product SKU", hint: "Product packs + festivals, themes and custom briefs" },
  { id: "APPAREL_ON_MODEL", label: "Apparel on AI models", hint: "Everyday clothing worn by AI models" },
  { id: "FASHION_EDITORIAL", label: "Fashion editorial", hint: "High-end apparel, designer-campaign photoshoot look" },
] as const;

/** Admin-provisioned workspace creation (invite-only onboarding). */
export function NewWorkspaceDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<string>("FMCG_PRODUCT");
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
            <div className="space-y-1.5">
              {WORKSPACE_TYPES.map((t) => (
                <label
                  key={t.id}
                  className={`flex cursor-pointer items-start gap-2 rounded-md border p-2.5 text-sm transition-colors ${
                    type === t.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                  }`}
                >
                  <input
                    type="radio"
                    name="ws-type"
                    value={t.id}
                    checked={type === t.id}
                    onChange={() => setType(t.id)}
                    className="mt-0.5"
                  />
                  <span>
                    <span className="font-medium">{t.label}</span>
                    <span className="block text-xs text-muted-foreground">{t.hint}</span>
                  </span>
                </label>
              ))}
            </div>
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
