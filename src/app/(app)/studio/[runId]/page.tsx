import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSignedUrls, getSignedThumbUrls } from "@/lib/storage";
import { BAKEOFF_VARIANTS, IMAGE_MODEL_LABELS } from "@/lib/image/provider";
import { loadEditorProps } from "@/lib/editor-data";
import { healStalledRun } from "@/lib/run-heal";
import { realtimeToken } from "@/lib/realtime-token";
import { StudioCanvas } from "./studio-canvas";
import type { PipelineState } from "@/lib/pipeline/schemas";

const TERMINAL = ["COMPLETE", "PARTIAL", "FAILED"];

export const metadata = { title: "Studio — Synerix" };

export default async function RunPage({
  params,
  searchParams,
}: {
  params: Promise<{ runId: string }>;
  searchParams: Promise<{ c?: string }>;
}) {
  const { runId } = await params;
  const { c } = await searchParams;
  const authCtx = await requireAuth();
  const run = await prisma.generationRun.findFirst({
    where: { id: runId, workspaceId: authCtx.workspaceId },
    include: {
      calendarEntry: { include: { festivalOccurrence: { include: { festival: true } } } },
      product: { include: { images: { where: { isPrimary: true }, take: 1 } } },
      aiModel: { select: { name: true, storageKey: true } },
      brand: { select: { name: true, primaryColorHex: true, accentColorsHex: true, assets: { where: { isPrimaryLogo: true }, take: 1 } } },
      creatives: {
        where: { status: { in: ["READY", "DRAFTING"] }, deletedAt: null },
        include: { renders: { where: { status: "COMPOSED" }, orderBy: { createdAt: "asc" }, take: 1 } },
        orderBy: { conceptIndex: "asc" },
      },
    },
  });
  if (!run) notFound();

  // Self-healing: a dead worker (OOM kill / crash) never runs catchError, so
  // the row would sit non-terminal forever. Heal the run being viewed here and
  // sweep the rest on a schedule (trigger/heal-runs.ts) — the recovery is
  // idempotent and race-safe, so both paths can fire.
  if (!TERMINAL.includes(run.status)) {
    const healed = await healStalledRun(run.id);
    if (healed) run.status = healed;
  }

  const pipeline = (run.pipeline ?? {}) as PipelineState;
  const isTerminal = TERMINAL.includes(run.status);

  // Realtime token (read-only, this run) for live progress. Minted through a
  // request-deduped, 25-minute cache: this page re-renders on every progress
  // tick, and each render used to block the whole RSC response on a
  // cross-region Trigger.dev API call before a single byte could be sent.
  const publicToken = !isTerminal && run.triggerRunId ? await realtimeToken(run.triggerRunId) : null;

  // Concept thumbnails for the left rail.
  const readyCreatives = run.creatives.filter((cr) => cr.status === "READY");
  const thumbKeys = readyCreatives.flatMap((cr) => cr.renders.map((r) => r.composedImageKey).filter((k): k is string => Boolean(k)));
  // Brand/assets thumbnails for the styling rail.
  const logoKey = run.brand.assets[0]?.storageKey ?? null;
  const productKey = run.product?.images[0]?.storageKey ?? null;
  const modelKey = run.aiModel?.storageKey ?? null;
  const assetKeys = [logoKey, productKey, modelKey].filter((k): k is string => Boolean(k));
  const [thumbs, assetThumbs] = await Promise.all([
    getSignedThumbUrls(thumbKeys, 400),
    getSignedUrls(assetKeys.length ? assetKeys : [], 3600),
  ]);

  // Selected creative: ?c= (must be ready) else the first ready one.
  const selectedId =
    (c && readyCreatives.find((cr) => cr.id === c)?.id) ?? readyCreatives[0]?.id ?? null;
  const editorProps = selectedId ? await loadEditorProps(selectedId, authCtx.workspaceId) : null;

  const title =
    run.calendarEntry?.festivalOccurrence?.festival.name ?? run.calendarEntry?.customTitle ?? "Custom creative";
  // Total expected renders: conceptStatus (one key per work item, incl. bake-off
  // variants) is authoritative once concepting is done; before that, estimate.
  const baseCount = Number(pipeline.concepts?.length ?? run.conceptCount ?? readyCreatives.length);
  const compare = run.imageModelPref === "compare";
  const conceptCount = pipeline.conceptStatus
    ? Object.keys(pipeline.conceptStatus).length
    : run.bakeoff
      ? baseCount * BAKEOFF_VARIANTS.length
      : compare
        ? baseCount * 2
        : baseCount;
  const pipelineErrors = (pipeline as PipelineState & { errors?: Record<string, string> }).errors ?? {};

  return (
    <StudioCanvas
      runId={run.id}
      status={run.status}
      isTerminal={isTerminal}
      failed={run.status === "FAILED"}
      error={run.error}
      triggerRunId={run.triggerRunId}
      publicToken={publicToken}
      title={title}
      productName={run.product?.name ?? null}
      masterAspect={run.requestedAspects[0] ?? "4:5"}
      conceptCount={conceptCount}
      conceptStatus={pipeline.conceptStatus ?? {}}
      conceptErrors={pipelineErrors}
      bakeoff={run.bakeoff}
      concepts={readyCreatives.map((cr) => {
        const cc = cr.concept as { name?: string; bigIdea?: string };
        const key = cr.renders[0]?.composedImageKey;
        // Badge the model on bake-off/compare runs (the whole point), and on a
        // single pick whenever the fallback cascade rendered with a DIFFERENT
        // model than the user chose — a silent substitution isn't honest.
        const expected = run.imageModelPref === "nb-pro" ? "gemini-3-pro-image" : run.imageModelPref === "gpt-image-2" ? "gpt-image-2" : null;
        const fellBack = Boolean(expected && cr.imageModel && cr.imageModel !== expected);
        return {
          id: cr.id,
          conceptIndex: cr.conceptIndex,
          name: cc.name ?? `Concept ${cr.conceptIndex + 1}`,
          thumbUrl: key ? (thumbs[key] ?? null) : null,
          modelLabel:
            (run.bakeoff || compare || fellBack) && cr.imageModel ? (IMAGE_MODEL_LABELS[cr.imageModel] ?? cr.imageModel) : null,
        };
      })}
      selectedId={selectedId}
      editorProps={editorProps}
      assets={{
        brandName: run.brand.name,
        primaryColorHex: run.brand.primaryColorHex,
        accentColorsHex: run.brand.accentColorsHex,
        logoUrl: logoKey ? (assetThumbs[logoKey] ?? null) : null,
        productName: run.product?.name ?? null,
        productUrl: productKey ? (assetThumbs[productKey] ?? null) : null,
        modelName: run.aiModel?.name ?? null,
        modelUrl: modelKey ? (assetThumbs[modelKey] ?? null) : null,
      }}
    />
  );
}
