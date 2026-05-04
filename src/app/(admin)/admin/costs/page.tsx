import Link from "next/link";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Costs — Synerix Admin" };
// Always fresh — this is an observability view.
export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

const usd2 = (n: number) => `$${n.toFixed(2)}`;
const usd4 = (n: number) => `$${n.toFixed(4)}`;
const num = (d: unknown) => Number(d ?? 0);
/** "IN_SCENE" → "in-scene" for compact display. */
const compact = (s: string) => s.toLowerCase().replace(/_/g, "-");

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function statusBadge(status: string) {
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

export default async function AdminCostsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);

  const d30 = new Date(Date.now() - 30 * 864e5);

  const [runs, totalRuns, allTime, last30, bySource] = await Promise.all([
    prisma.generationRun.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        createdAt: true,
        trigger: true,
        fidelityMode: true,
        bakeoff: true,
        status: true,
        creditsDebited: true,
        workspace: { select: { name: true } },
        brand: { select: { name: true } },
      },
    }),
    prisma.generationRun.count(),
    prisma.apiCostLog.aggregate({ _sum: { usd: true } }),
    prisma.apiCostLog.aggregate({ _sum: { usd: true }, where: { createdAt: { gte: d30 } } }),
    // Non-run spend (editor, dissect, brand-research…) has no runId.
    prisma.apiCostLog.groupBy({
      by: ["source"],
      where: { runId: null },
      _sum: { usd: true },
      orderBy: { _sum: { usd: "desc" } },
    }),
  ]);

  // ONE groupBy for the whole page's per-run totals — never N queries.
  const pageRunIds = runs.map((r) => r.id);
  const runSums = pageRunIds.length
    ? await prisma.apiCostLog.groupBy({
        by: ["runId"],
        where: { runId: { in: pageRunIds } },
        _sum: { usd: true },
      })
    : [];
  const usdByRun = new Map(runSums.map((r) => [r.runId, num(r._sum.usd)]));

  const totalPages = Math.max(1, Math.ceil(totalRuns / PAGE_SIZE));

  const stats = [
    { label: "API spend · last 30 days", value: usd2(num(last30._sum.usd)) },
    { label: "API spend · all time", value: usd2(num(allTime._sum.usd)) },
    { label: "Generation runs", value: new Intl.NumberFormat("en-US").format(totalRuns) },
  ];

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className="gap-1 py-4">
            <CardContent className="px-4">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {s.label}
              </p>
              <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {bySource.length > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          Other sources (not tied to a run):{" "}
          {bySource.map((s, i) => (
            <span key={s.source} className="tabular-nums">
              {i > 0 && " · "}
              {s.source} {usd2(num(s._sum.usd))}
            </span>
          ))}
        </p>
      )}

      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-max text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-2.5">Date</th>
              <th className="px-4 py-2.5">Workspace</th>
              <th className="px-4 py-2.5">Brand</th>
              <th className="px-4 py-2.5">Trigger / fidelity</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Bake-off</th>
              <th className="px-4 py-2.5 text-right">Credits</th>
              <th className="px-4 py-2.5 text-right">API USD</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {runs.map((run) => (
              <tr key={run.id} className="relative hover:bg-muted/50">
                <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground">
                  <Link href={`/admin/costs/${run.id}`} className="absolute inset-0" aria-label="Run cost detail" />
                  {dateFmt.format(run.createdAt)}
                </td>
                <td className="max-w-48 truncate px-4 py-2.5">{run.workspace.name}</td>
                <td className="max-w-48 truncate px-4 py-2.5">{run.brand.name}</td>
                <td className="px-4 py-2.5 whitespace-nowrap text-xs text-muted-foreground">
                  {compact(run.trigger)} · {compact(run.fidelityMode)}
                </td>
                <td className="px-4 py-2.5">{statusBadge(run.status)}</td>
                <td className="px-4 py-2.5">
                  {run.bakeoff ? <Badge variant="outline">bake-off</Badge> : <span className="text-muted-foreground">—</span>}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">{num(run.creditsDebited).toFixed(2)}</td>
                <td className="px-4 py-2.5 text-right font-medium tabular-nums">
                  {usd4(usdByRun.get(run.id) ?? 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {runs.length === 0 && (
        <p className="mt-6 text-sm text-muted-foreground">No generation runs yet.</p>
      )}

      <div className="mt-4 flex items-center justify-between text-sm">
        {page > 1 ? (
          <Link href={`/admin/costs?page=${page - 1}`} className="font-medium hover:underline">
            ← Prev
          </Link>
        ) : (
          <span className="text-muted-foreground/50">← Prev</span>
        )}
        <span className="text-xs text-muted-foreground">
          Page {page} of {totalPages}
        </span>
        {page < totalPages ? (
          <Link href={`/admin/costs?page=${page + 1}`} className="font-medium hover:underline">
            Next →
          </Link>
        ) : (
          <span className="text-muted-foreground/50">Next →</span>
        )}
      </div>
    </div>
  );
}
