"use client";

import { useTransition } from "react";
import { ArrowLeft, Eye } from "lucide-react";
import { exitToAdmin } from "@/app/actions/admin";

/** Slim banner shown while a super-admin is acting as a customer (god-view). */
export function AdminViewingBanner({ workspaceName }: { workspaceName: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex items-center justify-between gap-3 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm sm:px-6 lg:px-8">
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
        className="flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 font-medium text-amber-700 transition-colors hover:bg-amber-500/20 disabled:opacity-60 dark:text-amber-200"
      >
        <ArrowLeft className="size-3.5" />
        Back to admin
      </button>
    </div>
  );
}
