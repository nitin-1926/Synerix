import Link from "next/link";
import { prisma } from "@/lib/db";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { requireSuperAdmin } from "@/lib/auth";
import {
  EmptyState,
  RunStatusBadge,
  StatGrid,
  compact,
  fmtFixed,
  fmtInt,
  fmtUSD,
  num,
  tableHeadRow,
  tableRow,
} from "../admin-ui";

export const metadata = { title: "Costs | Synerix Admin" };
// Always fresh — this is an observability view.
export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export default async function AdminCostsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  // requireSuperAdmin() is the auth boundary — see its docstring.
  await requireSuperAdmin();
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);

  const d30 = new Date(Date.now() - 30 * 864e5);

  const [runs, totalRuns, allTime, last30, bySource, byStage] = await Promise.all([
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
    // Which pipeline step actually burns the money, across every run in the
    // window (the per-run split lives on the run detail page).
    prisma.apiCostLog.groupBy({
      by: ["stage", "kind", "model"],
      where: { createdAt: { gte: d30 } },
      _sum: { usd: true, imageCount: true },
      _count: { _all: true },
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

  const stageTotal = byStage.reduce((s, g) => s + num(g._sum.usd), 0);
  const totalPages = Math.max(1, Math.ceil(totalRuns / PAGE_SIZE));

  const stats = [
    { label: "API spend · last 30 days", value: fmtUSD(num(last30._sum.usd)) },
    { label: "API spend · all time", value: fmtUSD(num(allTime._sum.usd)) },
    { label: "Generation runs", value: fmtInt(totalRuns) },
  ];

  return (
    <div>
      <StatGrid stats={stats} />

      {bySource.length > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          Other sources (not tied to a run):{" "}
          {bySource.map((s, i) => (
            <span key={s.source} className="tabular-nums">
              {i > 0 && " · "}
              {s.source} {fmtUSD(num(s._sum.usd))}
            </span>
          ))}
        </p>
      )}

      {byStage.length > 0 && (
        <>
          <h2 className="mt-8 text-sm font-semibold">
            Spend by pipeline stage · last 30 days
            <span className="ml-2 font-normal text-xs text-muted-foreground">
              <span className="tabular-nums">share of {fmtUSD(stageTotal)}</span>
            </span>
          </h2>
          <div className="mt-2 overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className={tableHeadRow}>
                  <th className="px-4 py-2.5">Stage</th>
                  <th className="px-4 py-2.5">Kind</th>
                  <th className="px-4 py-2.5">Model</th>
                  <th className="px-4 py-2.5 text-right">Calls</th>
                  <th className="px-4 py-2.5 text-right">USD</th>
                  <th className="px-4 py-2.5 text-right">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {byStage.map((s) => {
                  const usd = num(s._sum.usd);
                  const share = stageTotal > 0 ? (usd / stageTotal) * 100 : 0;
                  return (
                    <tr key={`${s.stage}|${s.kind}|${s.model}`} className={tableRow}>
                      <td className="px-4 py-2.5 font-medium">{s.stage}</td>
                      <td className="px-4 py-2.5">
                        <Badge variant="outline">{s.kind}</Badge>
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">{s.model}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">{fmtInt(s._count._all)}</td>
                      <td className="px-4 py-2.5 text-right font-medium tabular-nums">{fmtUSD(usd, 4)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                        {share.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <h2 className="mt-8 text-sm font-semibold">
        Runs
        <span className="ml-2 font-normal text-xs text-muted-foreground">
          open a run for its own stage-by-stage split
        </span>
      </h2>
      {runs.length === 0 ? (
        <div className="mt-2">
          <EmptyState
            title="No generation runs yet"
            body="Runs show up here, with their API cost, once a workspace generates creatives."
          />
        </div>
      ) : (
        <div className="mt-2 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-max text-sm">
            <thead>
              <tr className={tableHeadRow}>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Workspace</th>
                <th className="px-4 py-2.5">Brand</th>
                <th className="px-4 py-2.5">Trigger / fidelity</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Bake-off</th>
                <th className="px-4 py-2.5 text-right">Credits</th>
                <th className="px-4 py-2.5 text-right">API USD</th>
                <th className="w-10 px-4 py-2.5">
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {runs.map((run) => (
                <tr key={run.id} className={`group relative cursor-pointer ${tableRow}`}>
                  <td className="px-4 py-2.5 whitespace-nowrap text-muted-foreground tabular-nums">
                    <Link
                      href={`/admin/costs/${run.id}`}
                      className="absolute inset-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
                      aria-label={`Run cost detail, ${run.workspace.name}, ${dateFmt.format(run.createdAt)}`}
                    />
                    {dateFmt.format(run.createdAt)}
                  </td>
                  <td className="max-w-48 truncate px-4 py-2.5">{run.workspace.name}</td>
                  <td className="max-w-48 truncate px-4 py-2.5">{run.brand.name}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap text-xs text-muted-foreground">
                    {compact(run.trigger)} · {compact(run.fidelityMode)}
                  </td>
                  <td className="px-4 py-2.5">
                    <RunStatusBadge status={run.status} />
                  </td>
                  <td className="px-4 py-2.5">
                    {run.bakeoff ? <Badge variant="outline">bake-off</Badge> : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{fmtFixed(num(run.creditsDebited), 2)}</td>
                  <td className="px-4 py-2.5 text-right font-medium tabular-nums">
                    {fmtUSD(usdByRun.get(run.id) ?? 0, 4)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground">
                    <ChevronRight className="ml-auto size-4 transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transition-none" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(totalPages > 1 || page > 1) && (
        <div className="mt-4 flex items-center justify-between text-sm">
          {page > 1 ? (
            <Link href={`/admin/costs?page=${page - 1}`} className="inline-flex items-center gap-1 font-medium hover:underline">
              <ChevronLeft className="size-4" />
              Prev
            </Link>
          ) : (
            <span className="inline-flex cursor-not-allowed items-center gap-1 text-muted-foreground/50">
              <ChevronLeft className="size-4" />
              Prev
            </span>
          )}
          <span className="text-xs text-muted-foreground tabular-nums">
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Link href={`/admin/costs?page=${page + 1}`} className="inline-flex items-center gap-1 font-medium hover:underline">
              Next
              <ChevronRight className="size-4" />
            </Link>
          ) : (
            <span className="inline-flex cursor-not-allowed items-center gap-1 text-muted-foreground/50">
              Next
              <ChevronRight className="size-4" />
            </span>
          )}
        </div>
      )}
    </div>
  );
}
