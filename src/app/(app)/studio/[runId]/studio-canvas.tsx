"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRealtimeRun } from "@trigger.dev/react-hooks";
import { ArrowLeft, Loader2, Paintbrush, ScanSearch, Sparkles, Wand2 } from "lucide-react";
import { CreativeEditor } from "@/app/(app)/library/[creativeId]/editor";
import type { EditorProps } from "@/lib/editor-data";
import { cn } from "@/lib/utils";

const STAGES = [
  { key: "BRIEFING", label: "Reading your brand & occasion", short: "Brief", icon: ScanSearch },
  { key: "CONCEPTING", label: "Designing concepts", short: "Concepts", icon: Wand2 },
  { key: "RENDERING", label: "Generating & composing", short: "Render", icon: Paintbrush },
];
const TERMINAL = ["COMPLETE", "PARTIAL", "FAILED"];
const ASPECT_CSS: Record<string, string> = { "4:5": "4 / 5", "9:16": "9 / 16", "1:1": "1 / 1", "16:9": "16 / 9" };

type Concept = { id: string; conceptIndex: number; name: string; thumbUrl: string | null; modelLabel: string | null };
type Assets = {
  brandName: string;
  primaryColorHex: string | null;
  accentColorsHex: string[];
  logoUrl: string | null;
  productName: string | null;
  productUrl: string | null;
  modelName: string | null;
  modelUrl: string | null;
};

export function StudioCanvas(props: {
  runId: string;
  status: string;
  isTerminal: boolean;
  failed: boolean;
  error: string | null;
  triggerRunId: string | null;
  publicToken: string | null;
  title: string;
  productName: string | null;
  masterAspect: string;
  conceptCount: number;
  conceptStatus: Record<string, string>;
  conceptErrors: Record<string, string>;
  bakeoff: boolean;
  concepts: Concept[];
  selectedId: string | null;
  editorProps: EditorProps | null;
  assets: Assets;
  cost: { totalUSD: number; perCreativeUSD: number | null } | null;
}) {
  const router = useRouter();

  // Live status (metadata mirrors GenerationRun.status); drives streaming.
  const { run } = useRealtimeRun(props.triggerRunId ?? undefined, {
    accessToken: props.publicToken ?? undefined,
    enabled: Boolean(props.triggerRunId && props.publicToken),
  });
  const liveStatus = (run?.metadata?.status as string) ?? props.status;
  const done = Number(run?.metadata?.done ?? 0);
  const conceptCount = Number(run?.metadata?.conceptCount ?? props.conceptCount ?? 0);

  // Stream: refresh the server page as concepts land or the run ends. The page
  // re-loads ready creatives + auto-selects the first one. With a realtime
  // connection, refreshes are driven by metadata progress (done / status
  // changes); the interval is only a fallback when no public token was minted.
  const hasRealtime = Boolean(props.triggerRunId && props.publicToken);
  const lastProgress = useRef({ done: 0, status: props.status });
  useEffect(() => {
    if (TERMINAL.includes(liveStatus)) {
      router.refresh();
      return;
    }
    if (hasRealtime) {
      const prev = lastProgress.current;
      if (done !== prev.done || liveStatus !== prev.status) {
        lastProgress.current = { done, status: liveStatus };
        router.refresh();
      }
      return;
    }
    const interval = setInterval(() => router.refresh(), 15_000);
    return () => clearInterval(interval);
  }, [liveStatus, done, hasRealtime, router]);

  // Failed work items never become selectable options — show them as such
  // instead of leaving eternal "crafting…" skeletons (or hiding them entirely
  // on PARTIAL runs).
  const failedItems = Object.entries(props.conceptStatus).filter(([, s]) => s === "failed");
  const pendingSlots = Math.max(0, conceptCount - props.concepts.length - failedItems.length);
  const generating = !props.isTerminal && !TERMINAL.includes(liveStatus);

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:gap-5">
      {/* LEFT — concepts + styling assets */}
      <aside className="w-full shrink-0 space-y-5 lg:w-60">
        <div>
          <Link href="/studio" className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="size-3.5" /> Studio
          </Link>
          <h1 className="mt-1 truncate text-lg font-semibold tracking-tight" title={props.title}>{props.title}</h1>
          {props.productName && <p className="truncate text-xs text-muted-foreground">Featuring {props.productName}</p>}
        </div>

        {/* Concept selector */}
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Options{generating && conceptCount > 0 ? ` · ${props.concepts.length}/${conceptCount}` : ""}
          </p>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
            {props.concepts.map((cpt) => (
              <Link
                key={cpt.id}
                href={`/studio/${props.runId}?c=${cpt.id}`}
                scroll={false}
                className={cn(
                  "group flex items-center gap-2 overflow-hidden rounded-xl border p-1.5 text-left transition-all",
                  cpt.id === props.selectedId ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border hover:border-foreground/30",
                )}
              >
                <span className="size-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {cpt.thumbUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={cpt.thumbUrl} alt={cpt.name} className="size-full object-cover" />
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium">{cpt.name}</span>
                  <span className="block truncate text-[10px] text-muted-foreground">
                    Option {cpt.conceptIndex + 1}
                    {cpt.modelLabel ? ` · ${cpt.modelLabel}` : ""}
                  </span>
                </span>
              </Link>
            ))}
            {Array.from({ length: pendingSlots }).map((_, i) => (
              <div key={`pending-${i}`} className="flex items-center gap-2 rounded-xl border border-dashed border-border p-1.5">
                <span className="mk-shimmer size-10 shrink-0 rounded-lg bg-muted" />
                <span className="min-w-0 flex-1 space-y-1.5">
                  <span className="mk-shimmer block h-2.5 w-2/3 rounded bg-muted" />
                  <span className="block text-[10px] text-muted-foreground">Crafting option {props.concepts.length + i + 1}…</span>
                </span>
              </div>
            ))}
            {failedItems.map(([id]) => (
              <div
                key={`failed-${id}`}
                className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-1.5"
                title={props.conceptErrors[id] ?? undefined}
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">×</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium text-destructive">
                    {id.includes("-") ? `Option ${Number(id.split("-")[0]) + 1} · ${id.split("-").slice(1).join("-")}` : `Option ${Number(id) + 1}`} failed
                  </span>
                  <span className="block truncate text-[10px] text-muted-foreground">
                    {props.conceptErrors[id]?.slice(0, 60) ?? "Didn't render"}{props.bakeoff ? "" : " · refunded"}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Styling assets */}
        <div className="space-y-3 rounded-xl border border-border p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Brand kit</p>
          <div className="flex items-center gap-2">
            {props.assets.logoUrl ? (
              <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={props.assets.logoUrl} alt={props.assets.brandName} className="size-full object-contain p-0.5" />
              </span>
            ) : null}
            <span className="min-w-0 flex-1 truncate text-xs font-medium">{props.assets.brandName}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[props.assets.primaryColorHex, ...props.assets.accentColorsHex].filter(Boolean).slice(0, 5).map((hex, i) => (
              <span key={i} className="size-5 rounded-md border border-black/10" style={{ background: hex ?? undefined }} title={hex ?? undefined} />
            ))}
          </div>
          {(props.assets.productUrl || props.assets.modelUrl) && (
            <div className="flex gap-2 pt-1">
              {props.assets.productUrl && <AssetThumb url={props.assets.productUrl} label={props.assets.productName} />}
              {props.assets.modelUrl && <AssetThumb url={props.assets.modelUrl} label={props.assets.modelName} />}
            </div>
          )}
        </div>

        {props.isTerminal && props.cost && (
          <p className="px-1 text-[10px] text-muted-foreground">
            API cost ${props.cost.totalUSD.toFixed(3)}
            {props.cost.perCreativeUSD != null ? ` · ${props.cost.perCreativeUSD.toFixed(3)}/creative` : ""}
          </p>
        )}
      </aside>

      {/* CENTER + RIGHT — the selected creative, or the live generating view */}
      <div className="min-w-0 flex-1">
        {props.editorProps ? (
          <CreativeEditor key={props.editorProps.creativeId} {...props.editorProps} />
        ) : props.failed ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
            <p className="font-medium text-destructive">This run failed</p>
            <p className="mt-1 max-w-sm text-sm text-destructive/80">{props.error ?? "Something went wrong."} Your credits were refunded.</p>
            <Link href="/studio" className="mt-4 text-sm font-medium text-primary hover:underline">Start a new one</Link>
          </div>
        ) : (
          <GeneratingView
            liveStatus={liveStatus}
            done={done}
            conceptCount={conceptCount}
            masterAspect={props.masterAspect}
            accent={props.assets.primaryColorHex}
          />
        )}
      </div>
    </div>
  );
}

function AssetThumb({ url, label }: { url: string; label: string | null }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="aspect-square w-full overflow-hidden rounded-lg border bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={label ?? ""} className="size-full object-cover" />
      </div>
      {label && <p className="mt-1 truncate text-[10px] text-muted-foreground">{label}</p>}
    </div>
  );
}

function GeneratingView(props: {
  liveStatus: string;
  done: number;
  conceptCount: number;
  masterAspect: string;
  accent: string | null;
}) {
  const stageIndex = STAGES.findIndex((s) => s.key === props.liveStatus);
  const activeIndex = stageIndex === -1 ? 0 : stageIndex;
  const aspect = ASPECT_CSS[props.masterAspect] ?? "4 / 5";
  const accent = props.accent ?? undefined;
  const frameCount = Math.min(Math.max(props.conceptCount || 2, 1), 3);

  // Coarse progress: brief → concepts → render (render fills by done/count).
  const pct =
    activeIndex <= 0
      ? 12
      : activeIndex === 1
        ? 42
        : props.conceptCount > 0
          ? 60 + Math.round((props.done / props.conceptCount) * 38)
          : 62;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-muted/40 via-card to-card">
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-10 px-6 py-14">
        {/* Hero — skeleton option frames being built */}
        <div className="flex flex-wrap items-start justify-center gap-4">
          {Array.from({ length: frameCount }).map((_, i) => (
            <div
              key={i}
              className="mk-shimmer relative w-32 rounded-xl border border-border bg-muted shadow-sm sm:w-40"
              style={{ aspectRatio: aspect, animationDelay: `${i * 200}ms` }}
            >
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <Sparkles className="size-5 opacity-30" style={{ color: accent }} />
              </span>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div className="w-full max-w-md">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>

          <div className="mt-4 flex items-center justify-center gap-2 text-center">
            <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
            <p className="text-sm font-medium text-foreground">
              {STAGES[activeIndex].label}
              {activeIndex === 2 && props.conceptCount > 0 && (
                <span className="ml-1.5 font-normal text-muted-foreground">{props.done}/{props.conceptCount} ready</span>
              )}
            </p>
          </div>

          {/* Mini stepper */}
          <div className="mt-3 flex items-center justify-center gap-2 text-[11px] font-medium">
            {STAGES.map((stage, i) => (
              <span key={stage.key} className="flex items-center gap-2">
                {i > 0 && <span className="text-muted-foreground/40">›</span>}
                <span
                  className={cn(
                    i < activeIndex ? "text-primary" : i === activeIndex ? "text-foreground" : "text-muted-foreground/60",
                  )}
                >
                  {stage.short}
                </span>
              </span>
            ))}
          </div>
        </div>

        <p className="max-w-sm text-center text-xs text-muted-foreground">
          Usually 1–2 minutes. Options appear on the left the moment each is ready — you can leave this page and find them in Creatives.
        </p>
      </div>
    </div>
  );
}
