"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImagePlus, Layers, X } from "lucide-react";
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

const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_BYTES = 8 * 1024 * 1024;

type Row = { id: string; file: File; name: string; url: string };

/** Turn "red_satin-bomber.JPG" → "red satin bomber". */
function nameFromFile(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, "");
  return base.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 80) || "Product";
}

/** Bulk add products — each chosen photo becomes its own product. */
export function BulkUpload() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [category, setCategory] = useState("OTHER");
  const [done, setDone] = useState(0);
  const [pending, startTransition] = useTransition();

  function reset() {
    rows.forEach((r) => URL.revokeObjectURL(r.url));
    setRows([]);
    setDone(0);
    if (fileRef.current) fileRef.current.value = "";
  }

  function onFiles() {
    const picked = [...(fileRef.current?.files ?? [])];
    if (fileRef.current) fileRef.current.value = "";
    const next: Row[] = [];
    for (const file of picked) {
      if (!ALLOWED.has(file.type)) {
        toast.error(`${file.name}: use PNG, JPG or WEBP`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        toast.error(`${file.name} is over 8 MB`);
        continue;
      }
      next.push({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        file,
        name: nameFromFile(file.name),
        url: URL.createObjectURL(file),
      });
    }
    // De-dupe against what's already staged.
    setRows((prev) => {
      const seen = new Set(prev.map((r) => r.id));
      return [...prev, ...next.filter((r) => !seen.has(r.id))];
    });
  }

  function removeRow(id: string) {
    setRows((prev) => {
      const hit = prev.find((r) => r.id === id);
      if (hit) URL.revokeObjectURL(hit.url);
      return prev.filter((r) => r.id !== id);
    });
  }

  function rename(id: string, name: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, name } : r)));
  }

  function submit() {
    if (!rows.length) return;
    startTransition(async () => {
      setDone(0);
      const failed: string[] = [];
      for (const row of rows) {
        const fd = new FormData();
        fd.set("name", row.name.trim() || nameFromFile(row.file.name));
        fd.set("category", category);
        fd.set("image", row.file);
        const res = await createProductInline(fd);
        if ("error" in res) failed.push(`${row.name}: ${res.error}`);
        setDone((d) => d + 1);
      }
      const ok = rows.length - failed.length;
      if (ok > 0) toast.success(`Added ${ok} product${ok > 1 ? "s" : ""} — analyzing photos`);
      if (failed.length) {
        toast.error(`${failed.length} failed`, { description: failed[0] });
        // Keep the dialog open so the user can retry the rest.
        setRows((prev) => prev.filter((r) => failed.some((f) => f.startsWith(`${r.name}:`))));
        setDone(0);
        router.refresh();
        return;
      }
      reset();
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o && !pending) reset();
      }}
    >
      <DialogTrigger
        render={
          <Button variant="outline" size="lg">
            <Layers data-icon="inline-start" /> Bulk upload
          </Button>
        }
      />
      <DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Bulk upload products</DialogTitle>
          <DialogDescription>
            Each photo becomes its own product. Edit the names below; they all share one category.
            Add more photos to a product later.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bulk-category">Category (all)</Label>
              <Select value={category} onValueChange={(v) => setCategory(v ?? "OTHER")}>
                <SelectTrigger id="bulk-category" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FMCG">FMCG / packaged goods</SelectItem>
                  <SelectItem value="APPAREL">Apparel / clothing</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => fileRef.current?.click()}
              >
                <ImagePlus data-icon="inline-start" />
                {rows.length ? "Add more photos" : "Choose photos"}
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                className="sr-only"
                tabIndex={-1}
                onChange={onFiles}
              />
            </div>
          </div>

          {rows.length === 0 ? (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-10 text-sm text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <ImagePlus className="size-6" />
              Choose several product photos at once
            </button>
          ) : (
            <div className="max-h-[40vh] space-y-2 overflow-y-auto pr-1">
              {rows.map((row) => (
                <div key={row.id} className="flex items-center gap-3 rounded-xl border border-border p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={row.url} alt="" className="size-12 shrink-0 rounded-lg border border-border object-cover" />
                  <Input
                    value={row.name}
                    onChange={(e) => rename(row.id, e.target.value)}
                    maxLength={80}
                    aria-label="Product name"
                    className="h-9"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeRow(row.id)}
                    disabled={pending}
                    aria-label="Remove"
                  >
                    <X />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="items-center gap-3 sm:justify-between">
          <span className="text-sm text-muted-foreground">
            {pending
              ? `Uploading ${done}/${rows.length}…`
              : rows.length
                ? `${rows.length} product${rows.length > 1 ? "s" : ""} ready`
                : ""}
          </span>
          <Button type="button" onClick={submit} disabled={pending || rows.length === 0}>
            {pending ? "Uploading…" : `Upload ${rows.length || ""} product${rows.length === 1 ? "" : "s"}`.trim()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
