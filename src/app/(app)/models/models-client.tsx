"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { generateBrandModel, deleteAiModel } from "@/app/actions/models";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ModelsClient() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function submit(formData: FormData) {
    startTransition(async () => {
      setError(null);
      const res = await generateBrandModel(formData);
      if (res?.error) {
        setError(res.error);
      } else {
        formRef.current?.reset();
        setOpen(false);
        toast.success("Model generation started — it'll appear when ready.");
        router.refresh();
      }
    });
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size="lg">
        <Plus data-icon="inline-start" /> Generate a model
      </Button>
    );
  }

  return (
    <Card>
      <CardContent>
        <form ref={formRef} action={submit} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight">Generate a model</h2>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              <X />
            </Button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Model name *</Label>
            <Input id="name" name="name" placeholder="Studio — South Asian, 20s" maxLength={80} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe the model — e.g. age range, build, hair, skin tone, expression and the look you want for your apparel shoots."
              minLength={4}
              maxLength={400}
              rows={4}
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={pending} className="w-full sm:w-auto">
            {pending ? "Starting…" : "Generate model"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function DeleteModelButton({ modelId, name }: { modelId: string; name: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  function onDelete() {
    startTransition(async () => {
      const res = await deleteAiModel(modelId);
      if (res?.error) {
        toast.error(res.error);
      } else {
        setConfirmOpen(false);
        toast.success("Model deleted.");
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={pending}
            aria-label="Delete model"
            className="-mr-1 -mt-1 shrink-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 />
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete the model &ldquo;{name}&rdquo;?</DialogTitle>
          <DialogDescription>This action cannot be undone.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={pending} />}>Cancel</DialogClose>
          <Button variant="destructive" disabled={pending} onClick={onDelete}>
            <Trash2 data-icon="inline-start" /> Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
