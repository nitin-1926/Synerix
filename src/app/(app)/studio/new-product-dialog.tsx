"use client";

import { useRef, useState, useTransition } from "react";
import { ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { createProductInline } from "@/app/actions/products";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type InlineProduct = {
  id: string;
  name: string;
  category: "FMCG" | "APPAREL" | "OTHER";
  dissectionStatus: string;
  imageUrl: string | null;
};

export function NewProductDialog({
  trigger,
  onCreated,
}: {
  trigger: React.ReactElement<Record<string, unknown>>;
  onCreated: (product: InlineProduct) => void;
}) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function onFileChange() {
    const f = fileRef.current?.files?.[0];
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  function submit(formData: FormData) {
    startTransition(async () => {
      setError(null);
      const res = await createProductInline(formData);
      if ("error" in res) {
        setError(res.error ?? "Something went wrong");
        return;
      }
      toast("Product added — analyzing photos in the background");
      onCreated({ ...res.product, imageUrl: preview });
      setPreview(null);
      setOpen(false);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setPreview(null);
          setError(null);
        }
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add product</DialogTitle>
          <DialogDescription>Name it, pick a category, add one clear photo — you can add more photos later.</DialogDescription>
        </DialogHeader>
        <form action={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="inline-name">Product name *</Label>
            <Input id="inline-name" name="name" placeholder="Kaju Katli 500g box" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inline-category">Category</Label>
            <Select name="category" defaultValue="FMCG">
              <SelectTrigger id="inline-category" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FMCG">FMCG / packaged goods</SelectItem>
                <SelectItem value="APPAREL">Apparel / clothing</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="inline-description">Description</Label>
            <Input id="inline-description" name="description" placeholder="What makes it special (optional)" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inline-image">Photo *</Label>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-5 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <ImagePlus className="size-5" />
              {preview ? "Photo selected" : "Tap to choose a photo"}
            </button>
            <input
              ref={fileRef}
              id="inline-image"
              name="image"
              type="file"
              accept="image/*"
              required
              className="sr-only"
              tabIndex={-1}
              onChange={onFileChange}
            />
            {preview && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={preview} alt="" className="size-16 rounded-xl border border-border object-cover" />
            )}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Uploading…" : "Add product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
