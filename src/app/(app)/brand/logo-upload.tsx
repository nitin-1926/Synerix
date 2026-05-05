"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { uploadBrandLogo } from "@/app/actions/brand";
import { Button } from "@/components/ui/button";

/** Upload a logo by hand (for brands that skipped the website pull). */
export function LogoUpload() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onChange() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setName(file.name);
    const fd = new FormData();
    fd.set("logo", file);
    startTransition(async () => {
      const res = await uploadBrandLogo(fd);
      if (res?.error) {
        toast.error(res.error);
        setName(null);
      } else {
        toast.success("Logo uploaded");
        router.refresh();
      }
      if (fileRef.current) fileRef.current.value = "";
    });
  }

  return (
    <div className="mt-3 flex items-center gap-3">
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="sr-only"
        onChange={onChange}
      />
      <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => fileRef.current?.click()}>
        <Upload data-icon="inline-start" />
        {pending ? "Uploading…" : "Upload logo"}
      </Button>
      <span className="truncate text-xs text-muted-foreground">
        {pending ? name : "PNG, JPG, WEBP or SVG · sets it as your primary logo"}
      </span>
    </div>
  );
}
