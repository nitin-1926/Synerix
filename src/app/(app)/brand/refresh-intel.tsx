"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { refreshBrandIntel } from "@/app/actions/brand";

/**
 * Manual trigger for the Brand Creative Intelligence research pass.
 *
 * This is a PAID action (web-grounded research, real per-call spend), so the
 * cost is stated on the control itself rather than discovered afterwards in the
 * ledger, and the button disables while in flight — the server also enforces a
 * cooldown, but the round trip is slow enough that an undisabled button invites
 * the double-click the cooldown then has to reject.
 */
export function RefreshIntelButton({
  brandId,
  cost,
  lastRefreshedAt,
}: {
  brandId: string;
  cost: number;
  lastRefreshedAt: string | null;
}) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);

  function run() {
    start(async () => {
      const res = await refreshBrandIntel(brandId);
      if (res?.error) {
        toast.error(res.error);
        return;
      }
      setDone(true);
      toast.success(
        res?.searchUsed
          ? "Brand research refreshed from live web results"
          : "Brand research refreshed",
      );
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button onClick={run} disabled={pending || done} variant="outline" size="sm">
        <RefreshCw className={pending ? "animate-spin" : undefined} />
        {pending ? "Researching…" : "Refresh research"}
      </Button>
      <span className="text-xs text-muted-foreground">
        {cost} credit{cost === 1 ? "" : "s"}
        {lastRefreshedAt ? ` · last run ${lastRefreshedAt}` : " · never run"}
      </span>
    </div>
  );
}
