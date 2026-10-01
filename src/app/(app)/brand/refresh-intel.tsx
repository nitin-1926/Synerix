"use client";

import { useId, useState, useTransition } from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { refreshBrandIntel } from "@/app/actions/brand";

/**
 * Manual trigger for the Brand Creative Intelligence research pass.
 *
 * This is a PAID action (web-grounded research, real per-call spend), so the
 * cost is stated on the control itself (and wired to it for screen readers)
 * rather than discovered afterwards in the ledger. The server claims the slot
 * atomically and queues the research in the background, so the button only
 * waits for the enqueue, not for the research.
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
  const [queued, setQueued] = useState(false);
  const costId = useId();

  function run() {
    start(async () => {
      // A server action can also REJECT (network drop, deploy mid-request, a
      // thrown auth guard). Unhandled inside a transition that reaches the
      // root error boundary and replaces the whole app on a paid action.
      try {
        const res = await refreshBrandIntel(brandId);
        if (res?.error) {
          toast.error(res.error);
          return;
        }
        setQueued(true);
        toast.success("Brand research started. It takes a minute or two; reload to see it.");
      } catch {
        toast.error("Could not reach the server. Check your credits page before retrying.");
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        onClick={run}
        disabled={pending || queued}
        variant="outline"
        size="sm"
        aria-describedby={costId}
      >
        <RefreshCw className={pending ? "animate-spin" : undefined} />
        {queued ? "Research running" : pending ? "Starting…" : "Refresh research"}
      </Button>
      <span id={costId} className="text-xs text-muted-foreground">
        {cost} credit{cost === 1 ? "" : "s"}
        {lastRefreshedAt ? ` · last run ${lastRefreshedAt}` : " · never run"}
      </span>
    </div>
  );
}
