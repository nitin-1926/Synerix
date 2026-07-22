"use client";

import { useEffect, useRef, useState } from "react";
import { Bookmark, Download, Heart, Loader2, MessageCircle, MoreHorizontal, Plus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { OverlaySpec } from "@/lib/composition/types";
import type { Aspect } from "@/lib/image/runware";

export type LogoDraft = { fx: number; fy: number; fw: number };

type Platform = "none" | "instagram" | "story" | "whatsapp";
const PLATFORMS: { id: Platform; label: string }[] = [
  { id: "none", label: "Plain" },
  { id: "instagram", label: "Instagram" },
  { id: "story", label: "Story" },
  { id: "whatsapp", label: "WhatsApp" },
];

const ASPECT_LABEL: Record<string, string> = {
  "1:1": "Square",
  "4:5": "Portrait",
  "9:16": "Story",
  "16:9": "Wide",
};

/** Clamp a draft so the whole logo box stays inside the canvas. */
export function clampLogoDraft(d: LogoDraft, ratio: number, canvas: { width: number; height: number }): LogoDraft {
  const fw = Math.min(0.5, Math.max(0.05, d.fw));
  const boxHFrac = (fw * ratio * canvas.width) / canvas.height;
  return {
    fw,
    fx: Math.min(Math.max(d.fx, 0), Math.max(0, 1 - fw)),
    fy: Math.min(Math.max(d.fy, 0), Math.max(0, 1 - boxHFrac)),
  };
}

export function PreviewStage(props: {
  creativeId: string;
  brandName: string;
  aspect: string;
  onAspectChange: (aspect: string) => void;
  renders: Array<{ aspectRatio: string; url: string | null; spec: OverlaySpec }>;
  missingAspects: Aspect[];
  onAddAspect: (aspect: Aspect) => void;
  addAspectPending: boolean;
  /** Credit cost label for rendering a new native format (e.g. "2"). */
  aspectCostLabel: string;
  busy: boolean;
  busyLabel?: string;
  approved: boolean;
  /** Free-form logo placement being edited (null = not editing). */
  logoDraft: LogoDraft | null;
  logoRatio: number;
  onLogoDraftChange: (next: LogoDraft) => void;
}) {
  const active = props.renders.find((r) => r.aspectRatio === props.aspect) ?? props.renders[0];
  const canvas = active?.spec.canvas ?? { width: 1080, height: 1350 };
  const [platform, setPlatform] = useState<Platform>("none");

  // Measure the container and fit the canvas inside it so the stage matches
  // the drawn image exactly — overlay coordinates map 1:1.
  const containerRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const pad = 24; // breathing room inside the backdrop
      const availW = Math.max(0, rect.width - pad * 2);
      const availH = Math.max(0, rect.height - pad * 2);
      const scale = Math.min(availW / canvas.width, availH / canvas.height);
      setStage({ w: Math.floor(canvas.width * scale), h: Math.floor(canvas.height * scale) });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [canvas.width, canvas.height]);

  // ----- logo drag / resize ----------------------------------------------
  const dragRef = useRef<{ mode: "move" | "resize"; startX: number; startY: number; origin: LogoDraft } | null>(null);

  function beginDrag(e: React.PointerEvent, mode: "move" | "resize") {
    if (!props.logoDraft) return;
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { mode, startX: e.clientX, startY: e.clientY, origin: props.logoDraft };
  }

  function onDragMove(e: React.PointerEvent) {
    const d = dragRef.current;
    if (!d || !stage || !props.logoDraft) return;
    const dx = (e.clientX - d.startX) / stage.w;
    const dy = (e.clientY - d.startY) / stage.h;
    const next =
      d.mode === "move"
        ? { ...d.origin, fx: d.origin.fx + dx, fy: d.origin.fy + dy }
        : { ...d.origin, fw: d.origin.fw + dx };
    props.onLogoDraftChange(clampLogoDraft(next, props.logoRatio, canvas));
  }

  function endDrag() {
    dragRef.current = null;
  }

  function onBoxKeyDown(e: React.KeyboardEvent) {
    if (!props.logoDraft) return;
    const step = e.shiftKey ? 0.02 : 0.005;
    let { fx, fy } = props.logoDraft;
    if (e.key === "ArrowLeft") fx -= step;
    else if (e.key === "ArrowRight") fx += step;
    else if (e.key === "ArrowUp") fy -= step;
    else if (e.key === "ArrowDown") fy += step;
    else return;
    e.preventDefault();
    props.onLogoDraftChange(clampLogoDraft({ ...props.logoDraft, fx, fy }, props.logoRatio, canvas));
  }

  const d = props.logoDraft;
  const boxStyle =
    d && stage
      ? {
          left: d.fx * stage.w,
          top: d.fy * stage.h,
          width: d.fw * stage.w,
          height: d.fw * stage.w * props.logoRatio,
        }
      : undefined;

  return (
    <div className="min-w-0">
      {/* Aspect tabs + download */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-full border border-border bg-muted/50 p-1">
          {props.renders.map((r) => (
            <button
              key={r.aspectRatio}
              type="button"
              onClick={() => props.onAspectChange(r.aspectRatio)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                r.aspectRatio === props.aspect
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {r.aspectRatio}
              <span className="ml-1 hidden opacity-70 sm:inline">{ASPECT_LABEL[r.aspectRatio]}</span>
            </button>
          ))}
        </div>
        {props.missingAspects.map((a) => (
          <Button
            key={a}
            size="sm"
            variant="outline"
            disabled={props.addAspectPending || props.busy}
            onClick={() => props.onAddAspect(a)}
            className="rounded-full border-dashed text-muted-foreground"
            title={`Render a native ${a} — ${props.aspectCostLabel} credits`}
          >
            {props.addAspectPending ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Plus data-icon="inline-start" />}
            {a} <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{props.aspectCostLabel} cr</span>
          </Button>
        ))}
        <span className="flex-1" />
        {active?.url && props.approved ? (
          <Button
            size="sm"
            nativeButton={false}
            render={
              <a
                href={active.url}
                download={`creative-${props.creativeId}-${props.aspect.replace(":", "x")}.png`}
              />
            }
          >
            <Download data-icon="inline-start" /> Download PNG
          </Button>
        ) : (
          <Button size="sm" variant="outline" disabled title="Approve this creative to download it.">
            <Download data-icon="inline-start" /> Download PNG
          </Button>
        )}
      </div>

      {/* Platform preview toggle — see the creative in-context before shipping. */}
      <div className="mt-2 flex items-center gap-1 rounded-full border border-border bg-muted/50 p-1 w-fit">
        {PLATFORMS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPlatform(p.id)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              platform === p.id ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Stage */}
      <div
        ref={containerRef}
        className={cn(
          "relative mt-3 flex h-[52vh] items-center justify-center overflow-hidden rounded-2xl border border-border lg:h-[68vh]",
          platform === "story" || platform === "whatsapp" ? "bg-neutral-900" : "bg-background",
        )}
      >
        {/* Subtle checkerboard backdrop (theme tokens only). */}
        {platform === "none" && (
          <div
            aria-hidden
            className="absolute inset-0 opacity-50"
            style={{
              backgroundImage: "repeating-conic-gradient(var(--muted) 0% 25%, transparent 0% 50%)",
              backgroundSize: "28px 28px",
            }}
          />
        )}
        {active?.url && !stage && (
          <Loader2 className="relative size-5 animate-spin text-muted-foreground" />
        )}
        {platform !== "none" && active?.url ? (
          <PlatformMockup platform={platform} url={active.url} brandName={props.brandName} />
        ) : active?.url && stage ? (
          <div className="relative shrink-0" style={{ width: stage.w, height: stage.h }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={active.url}
              alt={`Creative preview ${props.aspect}`}
              className={cn(
                "absolute inset-0 h-full w-full rounded-lg object-contain shadow-lg transition-opacity",
                props.busy && "opacity-50",
              )}
              draggable={false}
            />
            {d && boxStyle && (
              <div
                tabIndex={0}
                role="application"
                aria-label="Logo position — drag to move, arrow keys to nudge"
                onPointerDown={(e) => beginDrag(e, "move")}
                onPointerMove={onDragMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                onKeyDown={onBoxKeyDown}
                style={boxStyle}
                className="absolute cursor-move touch-none rounded-sm border-2 border-primary bg-primary/15 outline-none ring-primary/40 focus-visible:ring-3"
              >
                <span className="absolute -top-6 left-0 rounded-sm bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  Logo
                </span>
                <span
                  onPointerDown={(e) => beginDrag(e, "resize")}
                  onPointerMove={onDragMove}
                  onPointerUp={endDrag}
                  onPointerCancel={endDrag}
                  className="absolute -right-1.5 -bottom-1.5 size-3.5 cursor-nwse-resize rounded-sm border border-primary-foreground bg-primary"
                />
              </div>
            )}
          </div>
        ) : !active?.url ? (
          <div className="relative flex items-center justify-center text-sm text-muted-foreground">
            No render yet
          </div>
        ) : null}
        {props.busy && (
          <div className="absolute inset-x-0 bottom-4 flex justify-center">
            <span className="flex items-center gap-2 rounded-full border border-border bg-background/90 px-3 py-1.5 text-xs font-medium text-foreground shadow-md backdrop-blur">
              <Loader2 className="size-3.5 animate-spin text-primary" />
              {props.busyLabel ?? "Updating…"}
            </span>
          </div>
        )}
      </div>
      {!props.approved && (
        <p className="mt-2 text-xs text-muted-foreground">Approve this creative to unlock download.</p>
      )}
    </div>
  );
}

/** Frames the creative inside a platform mockup so you see it the way a viewer will. */
function PlatformMockup({ platform, url, brandName }: { platform: Platform; url: string; brandName: string }) {
  const handle = brandName.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 20) || "your_brand";
  const initial = (brandName.trim()[0] ?? "B").toUpperCase();
  const Avatar = () => (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-xs font-semibold text-primary-foreground">
      {initial}
    </span>
  );

  if (platform === "instagram") {
    return (
      <div className="relative flex max-h-full w-full max-w-[400px] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xl">
        <div className="flex items-center gap-2 px-3 py-2.5">
          <Avatar />
          <span className="flex-1 text-sm font-semibold">{handle}</span>
          <MoreHorizontal className="size-4 text-muted-foreground" />
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="Instagram preview" className="max-h-[44vh] w-full object-contain bg-black" />
        <div className="flex items-center gap-4 px-3 pt-2.5">
          <Heart className="size-5" />
          <MessageCircle className="size-5" />
          <Send className="size-5" />
          <Bookmark className="ml-auto size-5" />
        </div>
        <div className="px-3 pb-3 pt-1.5 text-sm">
          <p className="font-semibold">2,438 likes</p>
          <p className="mt-0.5 line-clamp-2 text-foreground/90">
            <span className="font-semibold">{handle}</span> Festive offer is live. Tap the link in bio to order. ✨
          </p>
        </div>
      </div>
    );
  }

  // story / whatsapp — full-bleed vertical with a top progress bar.
  const isWhatsApp = platform === "whatsapp";
  return (
    <div className="relative flex h-full max-h-full items-center justify-center py-3">
      <div className="relative flex h-full max-h-[64vh] flex-col overflow-hidden rounded-2xl bg-black shadow-2xl" style={{ aspectRatio: "9 / 16" }}>
        <div className="absolute inset-x-2 top-2 z-10 flex gap-1">
          <span className="h-0.5 flex-1 rounded-full bg-white/80" />
          <span className="h-0.5 flex-1 rounded-full bg-white/30" />
          <span className="h-0.5 flex-1 rounded-full bg-white/30" />
        </div>
        <div className="absolute inset-x-2 top-5 z-10 flex items-center gap-2">
          <Avatar />
          <span className="text-xs font-semibold text-white drop-shadow">{handle}</span>
          <span className="text-[10px] text-white/70">{isWhatsApp ? "now" : "2h"}</span>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={`${platform} preview`} className="size-full object-cover" />
        <div className="absolute inset-x-3 bottom-3 z-10">
          <div className="flex items-center gap-2 rounded-full border border-white/40 px-3 py-2 text-xs text-white/90 backdrop-blur-sm">
            {isWhatsApp ? "Reply…" : "Send message"}
            <Send className="ml-auto size-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
