import { notFound } from "next/navigation";
import { auth as triggerAuth } from "@trigger.dev/sdk";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getSignedUrls, getSignedThumbUrls } from "@/lib/storage";
import { BAKEOFF_VARIANTS, IMAGE_MODEL_LABELS } from "@/lib/image/provider";
import { loadEditorProps } from "@/lib/editor-data";
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

  // Self-healing: a run stuck non-terminal for 30+ min means the worker died;
  // fail it and refund undelivered creatives (its catchError never fired).
  if (!TERMINAL.includes(run.status) && Date.now() - run.startedAt.getTime() > 30 * 60 * 1000) {
    const { CREDIT_COSTS } = await import("@/lib/ai/models");
    const { reconcileRunRefund } = await import("@/lib/credits");
    const delivered = run.creatives.filter((cr) => cr.status === "READY").length;
    const nextStatus = delivered > 0 ? "PARTIAL" : "FAILED";
    // This runs on GET render, so two concurrent tabs/refreshes can enter here
    // together. A conditional transition (only flip if still non-terminal) means
    // exactly ONE render performs the recovery; the refund is additionally
    // idempotent (reconciled against prior REFUND for this run), so a race can
    // never inflate credits.
    const flipped = await prisma.generationRun.updateMany({
      where: { id: run.id, status: { notIn: ["COMPLETE", "PARTIAL", "FAILED"] } },
      data: { status: nextStatus, finishedAt: new Date(), error: "Run stalled (worker lost) — auto-failed after 30 min" },
    });
    if (flipped.count > 0 && Number(run.creditsDebited) > 0) {
      await reconcileRunRefund({
        workspaceId: run.workspaceId,
        generationRunId: run.id,
        owedRefund: Number(run.creditsDebited) - delivered * CREDIT_COSTS.perConcept,
        note: "Run stalled — automatic refund",
      });
    }
    run.status = nextStatus;
  }

  const pipeline = (run.pipeline ?? {}) as PipelineState & {
    cost?: { totalUSD: number; imageUSD: number; llmUSD: number; imageCount: number; perCreativeUSD: number | null };
  };
  const isTerminal = TERMINAL.includes(run.status);

  // Realtime token (read-only, this run) for live progress.
  let publicToken: string | null = null;
  if (!isTerminal && run.triggerRunId) {
    try {
      publicToken = await triggerAuth.createPublicToken({ scopes: { read: { runs: [run.triggerRunId] } }, expirationTime: "30m" });
    } catch {
      publicToken = null;
    }
  }

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
      cost={
        // Real API spend is internal telemetry — super-admin eyes only.
        // Customers see credits, never USD.
        authCtx.isSuperAdmin && pipeline.cost
          ? { totalUSD: pipeline.cost.totalUSD, perCreativeUSD: pipeline.cost.perCreativeUSD }
          : null
      }
    />
  );
}
