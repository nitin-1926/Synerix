"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Plus, X } from "lucide-react";
import { createProduct } from "@/app/actions/products";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ProductForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function onFilesChange() {
    const files = fileRef.current?.files;
    setPreviews(files ? [...files].slice(0, 5).map((f) => URL.createObjectURL(f)) : []);
  }

  function submit(formData: FormData) {
    startTransition(async () => {
      setError(null);
      const res = await createProduct(formData);
      if (res?.error) setError(res.error);
      else {
        formRef.current?.reset();
        setPreviews([]);
        setOpen(false);
        router.refresh();
      }
    });
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size="lg">
        <Plus data-icon="inline-start" /> Add product
      </Button>
    );
  }

  return (
    <Card className="w-full">
      <CardContent>
        <form ref={formRef} action={submit} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight">New product</h2>
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
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Product name *</Label>
              <Input id="name" name="name" placeholder="Kaju Katli 500g box" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">SKU / code</Label>
              <Input id="sku" name="sku" placeholder="KK-500" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" name="description" placeholder="What makes it special (optional)" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select name="category" defaultValue="OTHER">
              <SelectTrigger id="category" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FMCG">FMCG / packaged goods</SelectItem>
                <SelectItem value="APPAREL">Apparel / clothing</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Apparel products are shot on an AI model; others are shot in-scene.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="images">Photos * (up to 5, clear product shots)</Label>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-7 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <ImagePlus className="size-5" />
              {previews.length
                ? `${previews.length} photo${previews.length > 1 ? "s" : ""} selected`
                : "Tap to choose photos"}
            </button>
            <input
              ref={fileRef}
              id="images"
              name="images"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              className="sr-only"
              tabIndex={-1}
              onChange={onFilesChange}
            />
            {previews.length > 0 && (
              <div className="flex gap-2 overflow-x-auto py-1">
                {previews.map((src) => (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    key={src}
                    src={src}
                    alt=""
                    className="size-16 shrink-0 rounded-xl border border-border object-cover"
                  />
                ))}
              </div>
            )}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={pending} className="w-full sm:w-auto">
            {pending ? "Uploading…" : "Save product"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
