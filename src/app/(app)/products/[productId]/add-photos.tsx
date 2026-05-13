"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { addProductImages } from "@/app/actions/products";

const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_BYTES = 8 * 1024 * 1024;
const MAX_IMAGES = 5;

/** Dashed "add photos" tile that sits in the product image grid. */
export function AddPhotos({ productId, imageCount }: { productId: string; imageCount: number }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const remaining = MAX_IMAGES - imageCount;
  const full = remaining <= 0;

  function onFiles() {
    const picked = [...(fileRef.current?.files ?? [])];
    if (fileRef.current) fileRef.current.value = "";
    if (!picked.length) return;

    const files: File[] = [];
    for (const file of picked) {
      if (!ALLOWED.has(file.type)) {
        toast.error(`${file.name}: use PNG, JPG or WEBP`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        toast.error(`${file.name} is over 8 MB`);
        continue;
      }
      files.push(file);
    }
    if (!files.length) return;
    if (files.length > remaining) {
      toast.error(`Only ${remaining} more photo${remaining === 1 ? "" : "s"} allowed (max ${MAX_IMAGES} per product)`);
      return;
    }

    const fd = new FormData();
    for (const f of files) fd.append("images", f);
    startTransition(async () => {
      const res = await addProductImages(productId, fd);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success(`Added ${files.length} photo${files.length === 1 ? "" : "s"}`);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={pending || full}
        title={full ? `Maximum ${MAX_IMAGES} photos per product` : undefined}
        className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-default disabled:opacity-60 disabled:hover:border-border disabled:hover:text-muted-foreground"
      >
        {pending ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
        {pending ? "Uploading…" : full ? `Max ${MAX_IMAGES} photos` : "Add photos"}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        className="sr-only"
        tabIndex={-1}
        onChange={onFiles}
      />
    </>
  );
}
