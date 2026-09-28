"use client";

import { useTransition } from "react";
import { ArrowLeft, Eye } from "lucide-react";
import { exitToAdmin } from "@/app/actions/admin";

/** Slim banner shown while a super-admin is acting as a customer (god-view). */
export function AdminViewingBanner({ workspaceName }: { workspaceName: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex items-center justify-between gap-3 border-b border-amber-500/30 bg-amber-500/10 py-1 pr-2 pl-4 text-sm sm:py-1.5 sm:pr-4 sm:pl-6 lg:pr-6 lg:pl-8">
      <span className="flex min-w-0 items-center gap-2 text-amber-700 dark:text-amber-300">
        <Eye className="size-4 shrink-0" />
        <span className="truncate">
          Viewing as <strong className="font-semibold">{workspaceName}</strong>
        </span>
      </span>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => exitToAdmin())}
        className="flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3 font-medium text-amber-700 outline-none transition-colors hover:bg-amber-500/20 focus-visible:ring-3 focus-visible:ring-amber-500/40 active:bg-amber-500/25 disabled:cursor-not-allowed disabled:opacity-60 sm:h-8 dark:text-amber-200"
      >
        <ArrowLeft className="size-3.5" />
        Back to admin
      </button>
    </div>
  );
}
