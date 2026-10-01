"use client";

import { useTransition } from "react";
import { BadgeCheck } from "lucide-react";
import { setPrimaryLogo } from "@/app/actions/brand";
import { cn } from "@/lib/utils";

export function LogoPicker(props: {
  assets: Array<{ id: string; kind: string; url: string; isPrimaryLogo: boolean }>;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="mt-4 grid grid-cols-4 gap-2.5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
      {props.assets.map((a) => (
        <button
          key={a.id}
          type="button"
          disabled={pending}
          aria-pressed={a.isPrimaryLogo}
          aria-label={a.isPrimaryLogo ? `Primary logo (${a.kind.toLowerCase()})` : `Set this ${a.kind.toLowerCase()} as your logo`}
          onClick={() => startTransition(() => setPrimaryLogo(a.id).then(() => undefined))}
          className={cn(
            "group relative aspect-square cursor-pointer overflow-hidden rounded-xl bg-card p-2.5 ring-1 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transform-none",
            a.isPrimaryLogo
              ? "ring-2 ring-primary"
              : "ring-foreground/10",
          )}
          title={a.kind.toLowerCase()}
        >
          {/* signed URLs are short-lived; plain img avoids next/image host config */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={a.url} alt="" className="size-full object-contain" />
          {a.isPrimaryLogo && (
            <span className="absolute right-1.5 top-1.5 rounded-full bg-primary p-0.5 text-primary-foreground">
              <BadgeCheck className="size-3.5" />
            </span>
          )}
          <span className="absolute inset-x-0 bottom-0 bg-foreground/70 py-0.5 text-center text-[10px] font-medium text-background opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            {a.kind.toLowerCase()}
          </span>
        </button>
      ))}
    </div>
  );
}
