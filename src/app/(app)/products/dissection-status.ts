/** Human label + badge tone for a product's photo-analysis status (list + detail). */
const DISSECTION_LABEL: Record<string, { label: string; tone: "ok" | "busy" | "bad" }> = {
  READY: { label: "Ready for creatives", tone: "ok" },
  RUNNING: { label: "Analyzing photo…", tone: "busy" },
  PENDING: { label: "Queued for analysis", tone: "busy" },
  FAILED: { label: "Analysis failed", tone: "bad" },
};

export function dissectionBadge(status: string) {
  const s = DISSECTION_LABEL[status] ?? DISSECTION_LABEL.PENDING;
  return {
    label: s.label,
    variant: s.tone === "ok" ? "secondary" : s.tone === "bad" ? "destructive" : "outline",
    className: s.tone === "busy" ? "animate-pulse motion-reduce:animate-none" : "",
  } as const;
}
