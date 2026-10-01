import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Shared admin-console display helpers: en-IN grouping everywhere, one stat
// tile, one table header style, one status badge.

/** Fixed decimals so numeric table columns line up. */
export const fmtFixed = (n: number, digits: number) =>
  n.toLocaleString("en-IN", { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** Coerce Prisma Decimal / null to number. */
export const num = (d: unknown) => Number(d ?? 0);
export const fmtInt = (n: number) => fmtFixed(n, 0);
/** Credits can be fractional (e.g. 5.75); drop trailing zeros. */
export const fmtCredits = (n: number) => n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
export const fmtUSD = (n: number, digits = 2) => `$${fmtFixed(n, digits)}`;
export const plural = (n: number, word: string) => `${fmtInt(n)} ${word}${n === 1 ? "" : "s"}`;

/** "IN_SCENE" → "in-scene" for compact display. */
export const compact = (s: string) => s.toLowerCase().replace(/_/g, "-");

export const tableHeadRow =
  "border-b border-border bg-muted/40 text-left text-xs font-medium text-muted-foreground";
export const tableRow = "transition-colors hover:bg-muted/40";

export function StatGrid({
  stats,
  className,
}: {
  stats: { label: string; value: string }[];
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-3 gap-2 sm:gap-4", className)}>
      {stats.map((s) => (
        <Card key={s.label} className="gap-1 py-3 sm:py-4">
          <CardContent className="px-3 sm:px-4">
            <p className="text-[11px] font-medium uppercase leading-tight tracking-wider text-muted-foreground sm:text-xs">
              {s.label}
            </p>
            <p className="mt-1 text-lg font-semibold tracking-tight tabular-nums sm:text-2xl">{s.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed border-border px-6 py-10 text-center">
      <p className="text-sm font-medium">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{body}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function RunStatusBadge({ status }: { status: string }) {
  if (status === "COMPLETE") {
    return (
      <Badge
        variant="secondary"
        className="bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
      >
        {compact(status)}
      </Badge>
    );
  }
  if (status === "FAILED") return <Badge variant="destructive">{compact(status)}</Badge>;
  return <Badge variant="outline">{compact(status)}</Badge>;
}
