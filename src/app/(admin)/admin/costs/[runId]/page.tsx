import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ArrowLeft } from "lucide-react";
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
} from "../../admin-ui";

export const metadata = { title: "Run costs | Synerix Admin" };
export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const timeFmt = new Intl.DateTimeFormat("en-IN", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

function duration(start: Date, end: Date | null): string {
  if (!end) return "—";
  const s = Math.max(0, Math.round((end.getTime() - start.getTime()) / 1000));
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}

export default async function AdminRunCostPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  // requireSuperAdmin() is the auth boundary — see its docstring.
  await requireSuperAdmin();
  const { runId } = await params;

  const [run, logs] = await Promise.all([
    prisma.generationRun.findUnique({
      where: { id: runId },
      select: {
        id: true,
        trigger: true,
        fidelityMode: true,
        bakeoff: true,
        status: true,
        requestedAspects: true,
        conceptCount: true,
        creditsDebited: true,
        startedAt: true,
        finishedAt: true,
        createdAt: true,
        workspace: { select: { name: true } },
        brand: { select: { name: true } },
      },
    }),
    prisma.apiCostLog.findMany({ where: { runId }, orderBy: { createdAt: "asc" } }),
  ]);
  if (!run) notFound();

  // Group by stage + kind + provider/model (logs are already in hand — no extra query).
  const groups = new Map<
    string,
    { stage: string; kind: string; provider: string; model: string; calls: number; inTok: number; outTok: number; images: number; usd: number }
  >();
  let totalUsd = 0;
  for (const log of logs) {
    const key = `${log.stage}|${log.kind}|${log.provider}|${log.model}`;
    const g =
      groups.get(key) ??
      { stage: log.stage, kind: log.kind, provider: log.provider, model: log.model, calls: 0, inTok: 0, outTok: 0, images: 0, usd: 0 };
    g.calls += 1;
    g.inTok += log.inputTokens;
    g.outTok += log.outputTokens;
    g.images += log.imageCount;
    g.usd += num(log.usd);
    groups.set(key, g);
    totalUsd += num(log.usd);
  }
  const byStage = [...groups.values()].sort((a, b) => b.usd - a.usd);

  const summary = [
    { label: "Workspace", value: run.workspace.name },
    { label: "Brand", value: run.brand.name },
    { label: "Trigger", value: compact(run.trigger) },
    { label: "Fidelity", value: compact(run.fidelityMode) },
    { label: "Aspects", value: run.requestedAspects.join(", ") },
    { label: "Concepts", value: fmtInt(run.conceptCount) },
    { label: "Started", value: dateFmt.format(run.startedAt) },
    { label: "Duration", value: duration(run.startedAt, run.finishedAt) },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/admin/costs"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Costs
        </Link>
        <h1 className="text-lg font-semibold tracking-tight">
          Run <span className="font-mono text-sm text-muted-foreground">{run.id.slice(0, 8)}</span>
        </h1>
        <RunStatusBadge status={run.status} />
        {run.bakeoff && <Badge variant="outline">bake-off</Badge>}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 rounded-lg border border-border p-4 sm:grid-cols-4">
        {summary.map((s) => (
          <div key={s.label}>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{s.label}</p>
            <p className="mt-0.5 truncate text-sm">{s.value}</p>
          </div>
        ))}
      </div>

      <StatGrid
        className="mt-6"
        stats={[
          { label: "Total API USD", value: fmtUSD(totalUsd) },
          { label: "Credits debited", value: fmtFixed(num(run.creditsDebited), 2) },
          { label: "API calls", value: fmtInt(logs.length) },
        ]}
      />

      <h2 className="mt-8 text-sm font-semibold">Cost by stage</h2>
      {byStage.length === 0 ? (
        <div className="mt-2">
          <EmptyState
            title="No API cost logged"
            body="This run made no metered API calls, or it failed before its first one."
          />
        </div>
      ) : (
        <div className="mt-2 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-max text-sm">
            <thead>
              <tr className={tableHeadRow}>
                <th className="px-4 py-2.5">Stage</th>
                <th className="px-4 py-2.5">Kind</th>
                <th className="px-4 py-2.5">Provider / model</th>
                <th className="px-4 py-2.5 text-right">Calls</th>
                <th className="px-4 py-2.5 text-right">Tokens in / out</th>
                <th className="px-4 py-2.5 text-right">Images</th>
                <th className="px-4 py-2.5 text-right">USD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {byStage.map((g) => (
                <tr key={`${g.stage}|${g.kind}|${g.provider}|${g.model}`} className={tableRow}>
                  <td className="px-4 py-2.5 font-medium">{g.stage}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant="outline">{g.kind}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {g.provider} · {g.model}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{fmtInt(g.calls)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {g.kind === "LLM" ? `${fmtInt(g.inTok)} / ${fmtInt(g.outTok)}` : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{g.kind === "IMAGE" ? fmtInt(g.images) : "—"}</td>
                  <td className="px-4 py-2.5 text-right font-medium tabular-nums">{fmtUSD(g.usd, 4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {logs.length > 0 && (
        <>
          <h2 className="mt-8 text-sm font-semibold">Raw log</h2>
          <div className="mt-2 overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className={tableHeadRow}>
                  <th className="px-4 py-2.5">Time</th>
                  <th className="px-4 py-2.5">Stage</th>
                  <th className="px-4 py-2.5">Kind</th>
                  <th className="px-4 py-2.5">Provider</th>
                  <th className="px-4 py-2.5">Model</th>
                  <th className="px-4 py-2.5 text-right">Tokens in</th>
                  <th className="px-4 py-2.5 text-right">Tokens out</th>
                  <th className="px-4 py-2.5 text-right">Images</th>
                  <th className="px-4 py-2.5 text-right">USD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log) => (
                  <tr key={log.id} className={tableRow}>
                    <td className="px-4 py-2 whitespace-nowrap text-muted-foreground tabular-nums">{timeFmt.format(log.createdAt)}</td>
                    <td className="px-4 py-2">{log.stage}</td>
                    <td className="px-4 py-2 text-muted-foreground">{log.kind}</td>
                    <td className="px-4 py-2 text-muted-foreground">{log.provider}</td>
                    <td className="px-4 py-2 text-muted-foreground">{log.model}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{fmtInt(log.inputTokens)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{fmtInt(log.outputTokens)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{fmtInt(log.imageCount)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{fmtUSD(num(log.usd), 4)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
