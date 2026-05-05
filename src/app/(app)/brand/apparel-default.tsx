"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { setApparelBrandingDefault } from "@/app/actions/brand";
import { cn } from "@/lib/utils";

type Mode = "BRANDED" | "PLAIN";

/** Per-brand default for apparel on-model output; the studio can override per run. */
export function ApparelDefaultControl({ value }: { value: Mode }) {
  const [mode, setMode] = useState<Mode>(value);
  const [pending, startTransition] = useTransition();

  function choose(next: Mode) {
    if (next === mode) return;
    const prev = mode;
    setMode(next);
    startTransition(async () => {
      const res = await setApparelBrandingDefault(next);
      if (res?.error) {
        setMode(prev);
        toast.error(res.error);
      } else {
        toast.success("Default updated");
      }
    });
  }

  const OPTIONS: { id: Mode; title: string; desc: string }[] = [
    { id: "BRANDED", title: "Branded campaign", desc: "Logo + headline + brand colours on every apparel creative." },
    { id: "PLAIN", title: "Plain on-model image", desc: "Just the model wearing the garment, no branding or text." },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {OPTIONS.map((o) => (
        <button
          key={o.id}
          type="button"
          disabled={pending}
          onClick={() => choose(o.id)}
          className={cn(
            "rounded-2xl border p-4 text-left transition-all disabled:opacity-70",
            mode === o.id ? "border-primary bg-primary/5 ring-2 ring-primary/25" : "border-border bg-card hover:border-foreground/20",
          )}
        >
          <p className="text-sm font-semibold text-foreground">{o.title}</p>
          <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{o.desc}</p>
        </button>
      ))}
    </div>
  );
}
