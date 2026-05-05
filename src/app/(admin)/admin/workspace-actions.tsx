"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ArrowRight, Coins, Pencil } from "lucide-react";
import { adminGrantCredits, adminRenameWorkspace, enterCustomerWorkspace } from "@/app/actions/admin";
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

export function EnterWorkspaceButton({ workspaceId }: { workspaceId: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      size="sm"
      className="flex-1"
      disabled={pending}
      onClick={() => startTransition(() => enterCustomerWorkspace(workspaceId))}
    >
      {pending ? "Entering…" : "Enter as customer"}
      <ArrowRight className="ml-1.5 size-4" />
    </Button>
  );
}

export function RenameWorkspaceDialog(props: { workspaceId: string; workspaceName: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(props.workspaceName);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await adminRenameWorkspace(props.workspaceId, name.trim());
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Workspace renamed");
        setOpen(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) setName(props.workspaceName); }}>
      <DialogTrigger render={<Button size="icon-sm" variant="ghost" />} aria-label={`Rename ${props.workspaceName}`}>
        <Pencil className="size-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename workspace</DialogTitle>
          <DialogDescription>
            This is the internal workspace name. The customer&apos;s brand name (shown to them) is set in their Brand Kit.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor={`ws-name-${props.workspaceId}`}>Workspace name</Label>
            <Input
              id={`ws-name-${props.workspaceId}`}
              required
              autoFocus
              minLength={2}
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending || name.trim().length < 2 || name.trim() === props.workspaceName}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function GrantCreditsDialog(props: {
  workspaceId: string;
  workspaceName: string;
  balance: number;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = Number(amount);
    startTransition(async () => {
      try {
        await adminGrantCredits(props.workspaceId, value, note.trim());
        toast.success(
          value > 0 ? `Granted ${value} credits` : `Adjusted ${value} credits`,
        );
        setOpen(false);
        setAmount("");
        setNote("");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" />}>
        <Coins className="mr-1.5 size-4" />
        Credits
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust credits</DialogTitle>
          <DialogDescription>
            {props.workspaceName} — current balance {props.balance}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor={`amount-${props.workspaceId}`}>Amount (+ grant / − deduct)</Label>
            <Input
              id={`amount-${props.workspaceId}`}
              type="number"
              required
              min={-10000}
              max={10000}
              step={1}
              placeholder="e.g. 100 or -50"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`note-${props.workspaceId}`}>Note</Label>
            <Input
              id={`note-${props.workspaceId}`}
              placeholder="Reason for the adjustment"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={200}
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending || !amount}>
              Apply
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
