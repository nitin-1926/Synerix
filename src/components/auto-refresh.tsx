"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Refreshes the current server component tree on an interval while `active`.
 * Used to live-update async statuses (product dissection, model generation). */
export function AutoRefresh({ active, intervalMs = 8000 }: { active: boolean; intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(interval);
  }, [active, intervalMs, router]);

  return null;
}
