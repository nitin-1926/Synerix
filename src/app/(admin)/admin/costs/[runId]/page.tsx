import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Run costs — Synerix Admin" };
export const dynamic = "force-dynamic";

const usd2 = (n: number) => `$${n.toFixed(2)}`;
const usd4 = (n: number) => `$${n.toFixed(4)}`;
const num = (d: unknown) => Number(d ?? 0);
const int = (n: number) => new Intl.NumberFormat("en-US").format(n);
const compact = (s: string) => s.toLowerCase().replace(/_/g, "-");

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
    { label: "Concepts", value: String(run.conceptCount) },
    { label: "Started", value: dateFmt.format(run.startedAt) },
    { label: "Duration", value: duration(run.startedAt, run.finishedAt) },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/admin/costs" className="text-sm text-muted-foreground hover:text-foreground">
          ← Costs
        </Link>
        <h1 className="text-lg font-semibold tracking-tight">
          Run <span className="font-mono text-sm text-muted-foreground">{run.id.slice(0, 8)}</span>
        </h1>
        <Badge variant="outline">{compact(run.status)}</Badge>
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

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="gap-1 py-4">
          <CardContent className="px-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total API USD</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{usd2(totalUsd)}</p>
          </CardContent>
        </Card>
        <Card className="gap-1 py-4">
          <CardContent className="px-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Credits debited</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{num(run.creditsDebited).toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card className="gap-1 py-4">
          <CardContent className="px-4">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">API calls</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{int(logs.length)}</p>
          </CardContent>
        </Card>
      </div>

      <h2 className="mt-8 text-sm font-semibold">Cost by stage</h2>
      <div className="mt-2 overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-max text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
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
              <tr key={`${g.stage}|${g.kind}|${g.provider}|${g.model}`}>
                <td className="px-4 py-2.5 font-medium">{g.stage}</td>
                <td className="px-4 py-2.5">
                  <Badge variant="outline">{g.kind}</Badge>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {g.provider} · {g.model}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">{int(g.calls)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {g.kind === "LLM" ? `${int(g.inTok)} / ${int(g.outTok)}` : "—"}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">{g.kind === "IMAGE" ? int(g.images) : "—"}</td>
                <td className="px-4 py-2.5 text-right font-medium tabular-nums">{usd4(g.usd)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {byStage.length === 0 && (
        <p className="mt-2 text-sm text-muted-foreground">No API cost logged for this run.</p>
      )}

      {logs.length > 0 && (
        <>
          <h2 className="mt-8 text-sm font-semibold">Raw log</h2>
          <div className="mt-2 overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-max text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
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
                  <tr key={log.id}>
                    <td className="px-4 py-2 whitespace-nowrap text-muted-foreground">{timeFmt.format(log.createdAt)}</td>
                    <td className="px-4 py-2">{log.stage}</td>
                    <td className="px-4 py-2 text-muted-foreground">{log.kind}</td>
                    <td className="px-4 py-2 text-muted-foreground">{log.provider}</td>
                    <td className="px-4 py-2 text-muted-foreground">{log.model}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{int(log.inputTokens)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{int(log.outputTokens)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{int(log.imageCount)}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{usd4(num(log.usd))}</td>
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
