"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateBrandKit } from "@/app/actions/brand";
import { Button } from "@/components/ui/button";

/** Client wrapper around the server-rendered brand-kit fields so saving gets a
 * pending state and success/error toasts. */
export function BrandKitForm({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    startTransition(async () => {
      const res = await updateBrandKit(formData);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Brand kit saved.");
      router.refresh();
    });
  }

  return (
    <form action={submit} className="grid gap-5 sm:grid-cols-2">
      {children}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save brand kit"}
        </Button>
      </div>
    </form>
  );
}
