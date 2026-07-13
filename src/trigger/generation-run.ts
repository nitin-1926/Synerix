import { task, tasks, logger, metadata } from "@trigger.dev/sdk";
import { prisma } from "@/lib/db";
import { CREDIT_COSTS, LIMITS } from "@/lib/ai/models";
import { generateScene, variantsForPref, BAKEOFF_VARIANTS, type BakeoffVariant, type SceneAspect } from "@/lib/image/provider";
import { downloadFromStorage, storageKeys, uploadBuffer } from "@/lib/storage";
import { reconcileRunRefund } from "@/lib/credits";
import { assembleOccasionBrief } from "@/lib/pipeline/brief";
import { generateConcepts } from "@/lib/pipeline/concepts";
import { validateAndRepairConcepts, enhanceConceptPrompts } from "@/lib/pipeline/validate-concepts";
import { intelToEvidenceBlock, type BrandIntel } from "@/lib/pipeline/brand-intel";
import type { brandResearch } from "./brand-research";
import {
  buildScenePassPrompt,
  buildDirectPrompt,
  buildOnModelPrompt,
  type OnModelDirection,
} from "@/lib/pipeline/image-prompt";
import { checkOverlayPlacement } from "@/lib/pipeline/placement-qa";
import { checkPackFidelity } from "@/lib/pipeline/pack-qa";
import { checkOnModelFidelity } from "@/lib/pipeline/model-qa";
import { buildOverlaySpec, plateFocusYFor, type LogoPosition } from "@/lib/composition/archetypes";
import { renderOverlay } from "@/lib/composition/render";
import { analyzePlate } from "@/lib/composition/analyze";
import { enforceContrast, rasterizePlate } from "@/lib/composition/contrast";
import { selectTemplates } from "@/lib/composition/templates";
import { scoreSpec } from "@/lib/composition/score";
import { resolveBrandKit } from "@/lib/composition/brandKit";
import type { DeviceStyle } from "@/lib/composition/devices";
import { ASPECT_DIMENSIONS, type OverlaySpec } from "@/lib/composition/types";
import type { CopyLanguage } from "@/lib/composition/types";
import { conceptCopyToRoles, type CreativeConcept, type PipelineState } from "@/lib/pipeline/schemas";
import type { ProductIntel } from "@/lib/products/intelligence";
import { CostTracker } from "@/lib/pipeline/cost";
import { persistCost } from "@/lib/pipeline/cost-log";
import type { GenerationStatus, Prisma } from "@/generated/prisma/client";

/** Serialized pipeline-JSON updates (concept workers run concurrently in-process). */
let pipelineChain: Promise<unknown> = Promise.resolve();
function updatePipeline(runId: string, mutate: (p: PipelineState) => void): Promise<void> {
  const next = pipelineChain.then(async () => {
    const run = await prisma.generationRun.findUniqueOrThrow({ where: { id: runId }, select: { pipeline: true } });
    const p = (run.pipeline ?? {}) as PipelineState;
    mutate(p);
    await prisma.generationRun.update({ where: { id: runId }, data: { pipeline: p as Prisma.InputJsonValue } });
  });
  // The caller sees this link's rejection, but the chain itself absorbs it —
  // otherwise one transient DB error rejects every later update in this warm
  // worker process (including future runs).
  pipelineChain = next.catch(() => {});
  return next;
}

async function setStatus(runId: string, status: GenerationStatus) {
  await prisma.generationRun.update({ where: { id: runId }, data: { status } });
  metadata.set("status", status);
}

async function loadRun(runId: string) {
  return prisma.generationRun.findUniqueOrThrow({
    where: { id: runId },
    include: {
      brand: { include: { assets: { where: { isPrimaryLogo: true }, take: 1 } } },
      // Up to 3 product angles: multi-reference renders are markedly more
      // product-faithful than a single photo (brand_os finding).
      product: { include: { images: { orderBy: [{ isPrimary: "desc" }], take: 3 } } },
      calendarEntry: { include: { festivalOccurrence: { include: { festival: true } } } },
      aiModel: true,
    },
  });
}
type RunWithRels = Awaited<ReturnType<typeof loadRun>>;

export const generationRun = task({
  id: "generation-run",
  maxDuration: 900,
  retry: { maxAttempts: 1 }, // per-concept isolation inside; whole-run retry would double-bill
  run: async (payload: { runId: string }) => {
    const { runId } = payload;
    const run = await loadRun(runId);

    // Ghost-enqueue guard: if the server action's tasks.trigger call timed out
    // AFTER the API accepted the enqueue, the action already refunded and
    // marked the run FAILED — executing it now would deliver a free
    // generation. Same for a run the stall-healer already closed.
    if (run.status === "FAILED" || run.status === "COMPLETE" || run.status === "PARTIAL") {
      logger.warn("run already terminal — skipping ghost enqueue", { runId, status: run.status });
      return { succeeded: 0, failed: 0, skipped: true };
    }
    const tracker = new CostTracker();

    // Shared assets
    const productImage = run.product?.images[0] ?? null;
    const refBuffer = productImage ? await downloadFromStorage(productImage.storageKey) : null;
    // Additional product angles (multi-reference fidelity) — downloaded in parallel.
    const extraRefs: Array<{ buffer: Buffer; mime: string }> = (
      await Promise.all(
        (run.product?.images.slice(1) ?? []).map(async (img) => {
          try {
            return { buffer: await downloadFromStorage(img.storageKey), mime: img.mimeType };
          } catch (e) {
            logger.warn("extra product ref download failed", { error: (e as Error).message });
            return null;
          }
        }),
      )
    ).filter((r): r is { buffer: Buffer; mime: string } => r !== null);
    const logoAsset = run.brand.assets[0] ?? null;
    const logoBuffer = logoAsset ? await downloadFromStorage(logoAsset.storageKey) : undefined;
    const aspects = (run.requestedAspects.length ? run.requestedAspects : ["4:5"]) as SceneAspect[];
    const masterAspect = aspects[0];
    const language = (run.language as CopyLanguage) ?? "en";
    const intel = (run.product?.productIntel as ProductIntel | null) ?? null;
    const onModel = run.fidelityMode === "ON_MODEL";
    const studioComposite = run.fidelityMode === "EXACT_PRODUCT" && Boolean(refBuffer);
    const modelBuffer = onModel && run.aiModel?.storageKey
      ? await downloadFromStorage(run.aiModel.storageKey)
      : null;

    // Account type steers the on-model photoshoot treatment: high-fashion
    // accounts get editorial campaign direction, everyone else gets the clean
    // garment-forward showcase. Fetched once here so BOTH direct and guided
    // runs inherit it (the brief-level editorial paragraph below reuses it).
    const workspace = await prisma.workspace.findUnique({ where: { id: run.workspaceId }, select: { type: true } });
    const onModelDirection: OnModelDirection =
      workspace?.type === "FASHION_EDITORIAL" ? "editorial" : "catalog";

    const ctx: ConceptCtx = {
      runId, run, refBuffer, extraRefs, logoBuffer, logoAssetKey: logoAsset?.storageKey,
      aspects, masterAspect, language, intel, studioComposite, tracker,
      onModel, modelBuffer, modelMime: run.aiModel?.mimeType ?? "image/png",
      onModelDirection,
      variantTag: "",
    };

    // Render variants: bake-off = the full admin lineup (forced, no fallback);
    // otherwise the user's model pick — single (soft, fallback kept) or
    // "compare" (both premium models, forced, double credits already debited).
    const variants: Array<(BakeoffVariant & { soft?: boolean }) | undefined> = run.bakeoff
      ? BAKEOFF_VARIANTS
      : variantsForPref(run.imageModelPref);
    const ctxFor = (v: (BakeoffVariant & { soft?: boolean }) | undefined): ConceptCtx =>
      v ? { ...ctx, forced: v, variantTag: v.key ? `-${v.key}` : "" } : ctx;

    let succeeded = 0;
    let failed = 0;

    if (run.directMode) {
      // ---- Direct mode: 1 literal render (per variant on bake-off runs) ----
      await setStatus(runId, "RENDERING");
      metadata.set("conceptCount", variants.length);
      await Promise.all(
        variants.map(async (v) => {
          try {
            await processDirect(ctxFor(v));
            succeeded += 1;
          } catch (e) {
            failed += 1;
            logger.error("direct render failed", { variant: v?.key, error: (e as Error).message });
          }
          metadata.set("done", succeeded + failed);
        }),
      );
    } else {
      // ---- Stage 1: occasion brief (deterministic) + cached brand intel ----
      await setStatus(runId, "BRIEFING");
      let occasionBrief = assembleOccasionBrief({
        brand: run.brand,
        product: run.product,
        festival: run.calendarEntry?.festivalOccurrence ?? null,
        customBrief: run.customBrief,
        customTitle: run.calendarEntry?.customTitle ?? null,
      });
      // Account-type flavor: FASHION_EDITORIAL workspaces sell high-end
      // apparel — every concept must read like a designer campaign, not a
      // commerce listing. Threaded into the brief so concepting, brief QA and
      // the prompt enhancer all inherit it.
      if (workspace?.type === "FASHION_EDITORIAL") {
        occasionBrief += `\n\n## ACCOUNT STYLE (non-negotiable)\nThis is a HIGH-FASHION EDITORIAL account. Every concept must look like a premium designer campaign or magazine editorial photoshoot (Vogue India energy): dramatic yet tasteful lighting, striking styled sets or locations, confident editorial model poses, luxury art direction, restrained color stories. Never mass-market catalogue styling, never discount-retail energy, never busy commerce clutter.`;
      }
      await updatePipeline(runId, (p) => { p.occasionBrief = occasionBrief; });

      // Brand Creative Intelligence is OFF the critical path (it used to run an
      // ~8-min web search inline here on a brand's first run). We use whatever
      // is cached on the brand; if it's missing or stale, we kick off the
      // background brand-research task (fire-and-forget) so the NEXT run is
      // grounded — this run never waits on it.
      const brandIntel = (run.brand.creativeIntel as BrandIntel | null) ?? null;
      const intelAgeMs = run.brand.creativeIntelAt ? Date.now() - run.brand.creativeIntelAt.getTime() : Infinity;
      const STALE_MS = Number(process.env.BRAND_INTEL_STALE_MS ?? 1000 * 60 * 60 * 24 * 30);
      if (!brandIntel || intelAgeMs > STALE_MS) {
        try {
          await tasks.trigger<typeof brandResearch>("brand-research", { brandId: run.brandId });
        } catch (e) {
          logger.warn("failed to enqueue brand-research", { error: (e as Error).message });
        }
      }

      // ---- Stage 2: evidence-grounded senior-CD concept briefs ----
      await setStatus(runId, "CONCEPTING");
      const brandPalette = [run.brand.primaryColorHex, ...run.brand.accentColorsHex].filter((h): h is string => Boolean(h));
      let concepts = await generateConcepts(
        occasionBrief,
        Math.min(run.conceptCount, LIMITS.maxConceptsPerRun),
        tracker,
        brandPalette.length ? brandPalette : undefined,
        intelToEvidenceBlock(brandIntel),
        { exactProduct: ctx.studioComposite },
      );

      // ---- Stage 2b: semantic brief QA + repair, then photographic prompt
      // polish — both BEFORE any image spend. Fail-open: a QA/enhancer outage
      // renders the authored concepts unchanged (never kills a paid run).
      try {
        const { concepts: validated, report } = await validateAndRepairConcepts({ concepts, occasionBrief, tracker });
        concepts = validated;
        await updatePipeline(runId, (p) => { (p as PipelineState & { briefQa?: typeof report }).briefQa = report; });
        if (report.flagged) logger.warn("brief QA flagged concepts", { flagged: report.flagged, repaired: report.repaired, issues: report.issues });
      } catch (e) {
        logger.warn("brief QA unavailable — rendering authored concepts", { error: (e as Error).message });
        // Marker write must never outrank the run it describes (fail-open²).
        await updatePipeline(runId, (p) => {
          ((p as PipelineState & { degraded?: string[] }).degraded ??= []).push("brief-qa-skipped");
        }).catch(() => {});
      }
      try {
        concepts = await enhanceConceptPrompts({ concepts, tracker });
      } catch (e) {
        logger.warn("prompt enhancer unavailable — rendering authored prompts", { error: (e as Error).message });
        await updatePipeline(runId, (p) => {
          ((p as PipelineState & { degraded?: string[] }).degraded ??= []).push("enhancer-skipped");
        }).catch(() => {});
      }

      // One work item per concept — times the variant lineup on bake-off runs.
      // Status ids stay `idx` for normal runs, `idx-variantKey` for bake-off.
      const queue = concepts.flatMap((c, i) =>
        variants.map((v) => ({ concept: c, idx: i, variant: v })),
      );
      await updatePipeline(runId, (p) => {
        p.concepts = concepts;
        p.conceptStatus = Object.fromEntries(
          queue.map((item) => [`${item.idx}${item.variant ? `-${item.variant.key}` : ""}`, "rendering"] as const),
        );
      });
      metadata.set("conceptCount", queue.length);

      // ---- Stage 3: one image per concept (parallel, no critic/QA) ----
      await setStatus(runId, "RENDERING");
      const workers = Array.from({ length: Math.min(LIMITS.maxConcurrentConcepts, queue.length) }, async () => {
        while (queue.length) {
          const { concept, idx, variant } = queue.shift()!;
          const cid = `${idx}${variant ? `-${variant.key}` : ""}`;
          try {
            await processConcept(ctxFor(variant), concept, idx);
            succeeded += 1;
            await updatePipeline(runId, (p) => { p.conceptStatus![cid] = "done"; });
          } catch (e) {
            failed += 1;
            const msg = (e as Error).message ?? String(e);
            logger.error("concept failed", { idx, variant: variant?.key, error: msg });
            await updatePipeline(runId, (p) => {
              p.conceptStatus![cid] = "failed";
              (p as PipelineState & { errors?: Record<string, string> }).errors ??= {};
              (p as PipelineState & { errors?: Record<string, string> }).errors![cid] = msg.slice(0, 300);
            });
          }
          metadata.set("done", succeeded + failed);
        }
      });
      await Promise.all(workers);
    }

    // ---- Finalize ----
    if (succeeded === 0) {
      await prisma.generationRun.update({
        where: { id: runId },
        data: { status: "FAILED", finishedAt: new Date(), error: "All concepts failed" },
      });
      if (Number(run.creditsDebited) > 0) {
        await grantCredits({ workspaceId: run.workspaceId, amount: Number(run.creditsDebited), reason: "REFUND", generationRunId: runId, note: "Run failed — full refund" });
      }
      metadata.set("status", "FAILED");
      return { succeeded, failed };
    }

    // Partial refund — only charge for delivered creatives. Bake-off runs
    // debit nothing, so there is nothing to refund.
    if (failed > 0 && Number(run.creditsDebited) > 0) {
      const refund = failed * CREDIT_COSTS.perConcept;
      if (refund > 0) {
        await grantCredits({ workspaceId: run.workspaceId, amount: refund, reason: "REFUND", generationRunId: runId, note: `${failed} concept(s) failed — partial refund` });
      }
    }

    const cost = tracker.summary();
    const perCreativeUSD = succeeded > 0 ? Math.round((cost.totalUSD / succeeded) * 1e4) / 1e4 : null;
    await updatePipeline(runId, (p) => {
      (p as PipelineState & { cost?: unknown }).cost = { ...cost, perCreativeUSD, creatives: succeeded };
    });
    // Per-call cost observability (one row per API call), never blocks the run.
    await persistCost({ summary: cost, source: "generation", workspaceId: run.workspaceId, runId });
    logger.info("run cost", { ...cost, perCreativeUSD, creatives: succeeded });

    await prisma.generationRun.update({
      where: { id: runId },
      data: { status: failed > 0 ? "PARTIAL" : "COMPLETE", finishedAt: new Date() },
    });
    metadata.set("status", failed > 0 ? "PARTIAL" : "COMPLETE");
    return { succeeded, failed, cost: cost.totalUSD, perCreativeUSD };
  },
  catchError: async ({ payload, error }) => {
    const run = await prisma.generationRun.findUnique({ where: { id: payload.runId } });
    if (!run || ["COMPLETE", "PARTIAL"].includes(run.status)) return;
    // The run threw. It may have already delivered some creatives and/or issued
    // a partial refund before failing on a late write — so refund only what was
    // NOT delivered, reconciled against any prior REFUND for this run, instead
    // of the old unconditional FULL refund (which double-refunded a partial run
    // and gave free credits for already-delivered creatives).
    const delivered = await prisma.creative.count({ where: { generationRunId: run.id, status: "READY" } });
    await prisma.generationRun.update({
      where: { id: payload.runId },
      data: {
        status: delivered > 0 ? "PARTIAL" : "FAILED",
        finishedAt: new Date(),
        error: (error as Error).message?.slice(0, 500),
      },
    });
    if (Number(run.creditsDebited) > 0) {
      await reconcileRunRefund({
        workspaceId: run.workspaceId,
        generationRunId: run.id,
        owedRefund: Number(run.creditsDebited) - delivered * CREDIT_COSTS.perConcept,
        note: "Run errored — refund undelivered creatives",
      });
    }
  },
});

interface ConceptCtx {
  runId: string;
  run: RunWithRels;
  refBuffer: Buffer | null;
  /** Additional product angles (multi-reference fidelity), excluding refBuffer. */
  extraRefs: Array<{ buffer: Buffer; mime: string }>;
  logoBuffer?: Buffer;
  logoAssetKey?: string;
  aspects: SceneAspect[];
  masterAspect: SceneAspect;
  language: CopyLanguage;
  intel: ProductIntel | null;
  studioComposite: boolean;
  onModel: boolean;
  modelBuffer: Buffer | null;
  modelMime: string;
  tracker: CostTracker;
  /** Bake-off / model pick: render on this variant. `soft` keeps the fallback
   * chain behind the preferred provider (user picks); bake-off never falls back. */
  forced?: BakeoffVariant & { soft?: boolean };
  /** Bake-off: suffix keeping storage keys / status ids unique per variant. */
  variantTag: string;
}

/** How the headline got onto this creative. Always overlay = canvas-composited
 * text layers with real bundled fonts (correct Latin/Devanagari/Gurmukhi). We
 * never bake text into the image — image models mis-spell non-Latin scripts. */
export type TypographyMode = "overlay";

interface PlateResult {
  /** Final master plate — always the wordless scene; text is overlaid by canvas. */
  plate: Buffer;
  /** Alias of plate, kept so text/language edits re-set type on a clean plate. */
  scenePlate: Buffer;
  typographyMode: TypographyMode;
  /** Cost-model id of the image model that rendered the scene (provenance). */
  costModel: string;
  /** EXACT_PRODUCT in-scene renders: verdict of the pack-vs-reference check. */
  packQa?: { pass: boolean; issues: string; retried: boolean };
}

/**
 * Generate the wordless master plate (scene only) for a concept. The concept's
 * art-directed imagePrompt is trusted verbatim; only a short product-reference
 * line is appended in code. Headline / CTA / brand block are composited later
 * by the canvas overlay (renderOverlay) with real fonts — never baked by the
 * image model, so spelling is always correct in every language.
 */
async function generatePlate(ctx: ConceptCtx, concept: CreativeConcept, aspect: SceneAspect): Promise<PlateResult> {
  // Variant pin: bake-off forces the provider (no fallback — a failed variant
  // is a data point); a user model pick prefers it but keeps the chain (soft).
  const model = { provider: ctx.forced?.provider, tier: ctx.forced?.tier, softPrefer: ctx.forced?.soft };
  let scenePlate: Buffer;
  let costModel: string;
  if (ctx.onModel && ctx.modelBuffer && ctx.refBuffer && ctx.run.product?.images[0]) {
    // ON_MODEL: fuse the AI model (image 1) + the real garment (image 2).
    const refs = [
      { buffer: ctx.modelBuffer, mime: ctx.modelMime },
      { buffer: ctx.refBuffer, mime: ctx.run.product.images[0].mimeType },
    ];
    const prompt = buildOnModelPrompt({
      concept,
      aspect,
      garmentPrompt: ctx.run.product?.dissectionPrompt,
      pose: ctx.run.modelPose,
    });
    const gen = await generateScene({ prompt, aspect, references: refs, ...model });
    ctx.tracker.addImage(gen.costModel, "on-model");
    scenePlate = gen.buffer;
    costModel = gen.costModel;
  } else {
    // IN_SCENE: the image model stages the real product (all reference angles).
    // This is also the EXACT_PRODUCT path now: the premium models reproduce
    // packaging from references far better than the retired cut-out paste
    // (which left packs floating, sticker-like, over already-staged scenes),
    // and pack-fidelity QA below verifies the label against the reference.
    const hasProduct = Boolean(ctx.refBuffer);
    const refs = hasProduct && ctx.run.product?.images[0]
      ? [{ buffer: ctx.refBuffer!, mime: ctx.run.product.images[0].mimeType }, ...ctx.extraRefs]
      : undefined;
    const prompt = buildScenePassPrompt({
      concept,
      dissectionPrompt: ctx.run.product?.dissectionPrompt,
      hasProduct,
    });
    let gen = await generateScene({ prompt, aspect, references: refs, ...model });
    ctx.tracker.addImage(gen.costModel, "in-scene");

    // EXACT_PRODUCT promises pixel-true packaging: verify the rendered pack
    // against the reference photo and re-render once, strictly, on mismatch.
    let packQa: PlateResult["packQa"];
    if (ctx.studioComposite && refs) {
      ({ gen, packQa } = await ensurePackFidelity(ctx, { gen, prompt, aspect, refs, model, stage: "in-scene" }));
    }
    scenePlate = gen.buffer;
    costModel = gen.costModel;
    return { plate: scenePlate, scenePlate, typographyMode: "overlay", costModel, packQa };
  }

  return { plate: scenePlate, scenePlate, typographyMode: "overlay", costModel };
}

/** Verify pack-vs-reference on an image-model render; strict corrective
 * re-renders on mismatch (default 2 — quality over cost per owner decision;
 * env-tunable). Keeps the last attempt either way; the verdict rides along
 * for human review. */
const PACK_QA_MAX_RETRIES = Number(process.env.PACK_QA_MAX_RETRIES ?? 2);
async function ensurePackFidelity(
  ctx: ConceptCtx,
  opts: {
    gen: Awaited<ReturnType<typeof generateScene>>;
    prompt: string;
    aspect: SceneAspect;
    refs: Array<{ buffer: Buffer; mime: string }>;
    model: { provider?: BakeoffVariant["provider"]; tier?: BakeoffVariant["tier"]; softPrefer?: boolean };
    stage: string;
  },
): Promise<{ gen: Awaited<ReturnType<typeof generateScene>>; packQa: NonNullable<PlateResult["packQa"]> }> {
  let gen = opts.gen;
  let verdict = await checkPackFidelity({ render: gen.buffer, reference: ctx.refBuffer!, tracker: ctx.tracker });
  let retried = false;
  for (let attempt = 1; attempt <= PACK_QA_MAX_RETRIES && !verdict.pass; attempt++) {
    logger.warn("pack fidelity failed, re-rendering", { attempt, of: PACK_QA_MAX_RETRIES, issues: verdict.issues });
    const strictPrompt = `${opts.prompt}\n\nCRITICAL CORRECTION: a previous render altered the product's packaging (${verdict.issues}). Reproduce the reference pack EXACTLY — every word of label text spelled identically, same colours, same logo, same layout. Do not restyle or reinterpret the packaging in any way.`;
    gen = await generateScene({
      prompt: strictPrompt,
      aspect: opts.aspect,
      references: opts.refs,
      provider: opts.model.provider,
      tier: opts.model.tier,
      softPrefer: opts.model.softPrefer,
    });
    ctx.tracker.addImage(gen.costModel, opts.stage);
    verdict = await checkPackFidelity({ render: gen.buffer, reference: ctx.refBuffer!, tracker: ctx.tracker });
    retried = true;
  }
  return { gen, packQa: { ...verdict, retried } };
}

const aspectTag = (a: string) => a.replace(":", "x");

async function processConcept(ctx: ConceptCtx, concept: CreativeConcept, idx: number): Promise<void> {
  // Generate a NATIVE plate per requested aspect (correct framing per ratio) —
  // never a cross-orientation crop of one master plate.
  // Generate each requested aspect's native plate in parallel (independent image
  // calls) — multi-aspect runs no longer pay N× latency serially.
  const perAspect = await Promise.all(
    ctx.aspects.map(async (aspect) => {
      const res = await generatePlate(ctx, concept, aspect);
      const key = storageKeys.masterPlate(ctx.runId, `${idx}${ctx.variantTag}-${aspectTag(aspect)}`);
      await uploadBuffer(key, res.plate, "image/png");
      return { aspect, plate: res.plate, key, typographyMode: res.typographyMode, costModel: res.costModel, packQa: res.packQa };
    }),
  );
  const platesByAspect = new Map(perAspect.map((r) => [r.aspect, r.plate] as const));
  const aspectPlateKeys: Record<string, string> = Object.fromEntries(perAspect.map((r) => [r.aspect, r.key]));
  const typographyMode: TypographyMode = perAspect[0]?.typographyMode ?? "overlay";
  const masterKey = aspectPlateKeys[ctx.masterAspect];
  const imageModel =
    perAspect.find((r) => r.aspect === ctx.masterAspect)?.costModel ?? perAspect[0]?.costModel ?? null;

  const creative = await prisma.creative.create({
    data: {
      generationRunId: ctx.runId,
      brandId: ctx.run.brandId,
      conceptIndex: idx,
      imageModel,
      concept: {
        ...concept,
        typographyMode,
        // Per-aspect plate keys so the editor re-composes each aspect from its
        // own native plate (scenePlateKey kept = the master plate for legacy).
        aspectPlateKeys,
        scenePlateKey: masterKey,
      } as unknown as Prisma.InputJsonValue,
      masterPlateKey: masterKey,
      masterAspect: ctx.masterAspect,
      status: "DRAFTING",
      usedCutoutFallback: false, // cut-out paste retired — premium in-scene + pack QA instead
    },
  });

  // All text (headline/eyebrow/subhead/CTA) + the Brand Block are rendered by
  // the canvas overlay with real fonts — never baked into the image.
  await composeAllAspects(ctx, creative.id, platesByAspect, aspectPlateKeys, {
    archetype: concept.archetype,
    productPlacement: concept.productPlacement,
    copy: conceptCopyToRoles(concept.copy),
    typographySpec: concept.typographySpec,
    plateQa: Object.fromEntries(perAspect.filter((r) => r.packQa).map((r) => [r.aspect, r.packQa!])),
  });
}

async function processDirect(ctx: ConceptCtx): Promise<void> {
  const userPrompt = ctx.run.customBrief ?? "A clean product advertisement scene.";
  const hasProduct = Boolean(ctx.refBuffer);
  const refs = hasProduct && ctx.run.product?.images[0]
    ? [{ buffer: ctx.refBuffer!, mime: ctx.run.product.images[0].mimeType }]
    : undefined;

  // Native plate per requested aspect (no cross-orientation crop), in parallel.
  const perAspect = await Promise.all(
    ctx.aspects.map(async (aspect) => {
      const prompt = buildDirectPrompt({
        userPrompt,
        aspect,
        dissectionPrompt: ctx.run.product?.dissectionPrompt,
        hasProduct,
      });
      let gen = await generateScene({
        prompt, aspect, references: refs,
        provider: ctx.forced?.provider, tier: ctx.forced?.tier,
      });
      ctx.tracker.addImage(gen.costModel, "direct");
      if (ctx.studioComposite && refs) {
        ({ gen } = await ensurePackFidelity(ctx, {
          gen, prompt, aspect, refs,
          model: { provider: ctx.forced?.provider, tier: ctx.forced?.tier },
          stage: "direct",
        }));
      }
      const key = storageKeys.masterPlate(ctx.runId, `0${ctx.variantTag}-${aspectTag(aspect)}`);
      await uploadBuffer(key, gen.buffer, "image/png");
      return { aspect, plate: gen.buffer, key, costModel: gen.costModel };
    }),
  );
  const platesByAspect = new Map(perAspect.map((r) => [r.aspect, r.plate] as const));
  const aspectPlateKeys: Record<string, string> = Object.fromEntries(perAspect.map((r) => [r.aspect, r.key]));
  const masterKey = aspectPlateKeys[ctx.masterAspect];
  const imageModel =
    perAspect.find((r) => r.aspect === ctx.masterAspect)?.costModel ?? perAspect[0]?.costModel ?? null;

  const concept = {
    name: "Custom creative",
    bigIdea: userPrompt.slice(0, 200),
    archetype: "headline_bottom" as const,
    aspectPlateKeys,
    scenePlateKey: masterKey,
  };
  const creative = await prisma.creative.create({
    data: {
      generationRunId: ctx.runId,
      brandId: ctx.run.brandId,
      conceptIndex: 0,
      imageModel,
      concept: concept as unknown as Prisma.InputJsonValue,
      masterPlateKey: masterKey,
      masterAspect: ctx.masterAspect,
      status: "DRAFTING",
    },
  });

  // Direct mode: logo only, no auto copy (user adds headline via the editor).
  const empty = { en: "", hinglish: "", hi: "", pa: "" };
  await composeAllAspects(ctx, creative.id, platesByAspect, aspectPlateKeys, {
    archetype: "headline_bottom",
    copy: { eyebrow: null, headline: empty, subhead: null, cta: null },
  });
}

/** How many layout variants to evaluate per aspect (compositing is AI-free). */
const COMPOSE_VARIANTS = Math.max(1, Number(process.env.COMPOSE_VARIANTS ?? 3));

/** Composite overlay (text + logo) for each aspect onto ITS OWN native plate.
 * For each aspect we evaluate several designed templates as variants, score them
 * deterministically, and keep the best — only the winner is rendered/stored. */
async function composeAllAspects(
  ctx: ConceptCtx,
  creativeId: string,
  platesByAspect: Map<string, Buffer>,
  aspectPlateKeys: Record<string, string>,
  layout: {
    archetype: string;
    productPlacement?: "product_hero" | "lifestyle" | null;
    copy: ReturnType<typeof conceptCopyToRoles>;
    /** Concept's free-text typography direction — mined for the reserved zone. */
    typographySpec?: string | null;
    /** Per-aspect pack-fidelity verdicts from the plate stage (EXACT_PRODUCT). */
    plateQa?: Record<string, { pass: boolean; issues: string; retried: boolean }>;
  },
): Promise<void> {
  const occasion =
    ctx.run.calendarEntry?.festivalOccurrence?.festival?.name ?? ctx.run.customBrief ?? null;
  // The concept reserved clean negative space in a zone of the plate; nudge
  // template selection toward layouts that actually use that zone.
  const zoneText = (layout.typographySpec ?? "").toLowerCase();
  const zoneHint: "top" | "bottom" | null = /\b(top|upper)\b/.test(zoneText)
    ? "top"
    : /\b(bottom|lower|base)\b/.test(zoneText)
      ? "bottom"
      : null;
  const signals = [ctx.run.brand.typographyStyle, occasion, ctx.run.product?.category]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const hasHeadline = Object.values(layout.copy.headline).some((s) => (s ?? "").trim().length > 0);
  // Brand design identity — keeps every creative for this brand coherent.
  const kit = resolveBrandKit({
    primaryColorHex: ctx.run.brand.primaryColorHex,
    accentColorsHex: ctx.run.brand.accentColorsHex,
    typographyStyle: ctx.run.brand.typographyStyle,
    productCategory: ctx.run.product?.category ?? null,
  });

  const critics: Record<string, unknown> = {};
  // PLAIN apparel (on-model): deliver the clean model+garment shot with NO logo,
  // text or graphic devices. The plate is already wordless, so the "render" is
  // just the plate fitted to each aspect's canvas.
  const plainMode = ctx.run.brandingMode === "PLAIN";

  const results = await Promise.all(
    ctx.aspects.map(async (aspect) => {
      const plate = platesByAspect.get(aspect) ?? platesByAspect.get(ctx.masterAspect)!;

      if (plainMode) {
        const dims = ASPECT_DIMENSIONS[aspect] ?? ASPECT_DIMENSIONS["4:5"];
        // PLAIN on-model is the primary apparel deliverable — anchor its crop
        // too so an off-ratio on-model plate isn't cropped through the model's
        // head/feet. (Without this the highest-value path would center-crop.)
        const plainAnalysis = await analyzePlate(plate).catch(() => null);
        const plainFocusY = plateFocusYFor(plainAnalysis?.safeBand);
        const spec: OverlaySpec = {
          version: 2, archetype: "plain", canvas: dims, plateFit: "cover",
          ...(plainFocusY !== 0.5 ? { plateFocusY: plainFocusY } : {}),
          scrims: [], textLayers: [], language: ctx.language,
        };
        const composed = await renderOverlay(spec, { plate }); // no logo, no overlays
        const key = storageKeys.composedRender(creativeId, aspect, 0);
        await uploadBuffer(key, composed, "image/png");
        await prisma.creativeRender.create({
          data: { creativeId, aspectRatio: aspect, overlaySpec: spec as unknown as Prisma.InputJsonValue, composedImageKey: key, status: "COMPOSED" },
        });
        critics[aspect] = { chosen: "plain", brandingMode: "PLAIN" };
        return { spec, key, aspect };
      }

      // Content-aware: palette + calm band + busyness from THIS plate, plus a
      // small raster for per-layer contrast checks against the real pixels.
      const dims = ASPECT_DIMENSIONS[aspect] ?? ASPECT_DIMENSIONS["4:5"];
      const analysis = await analyzePlate(plate).catch(() => null);
      // Crop anchor: providers often return an off-ratio plate (e.g. gpt-image-2
      // gives 2:3 for a 4:5 request) with the subject high and reserved empty
      // space low. A centered cover-crop then slices the subject's head. Anchor
      // the vertical crop toward the subject (buildOverlaySpec applies the same
      // value to each spec); the raster must crop identically so the contrast
      // sampler reads the pixels that actually land under the text.
      const focusY = plateFocusYFor(analysis?.safeBand);
      const raster = await rasterizePlate(plate, dims, focusY).catch(() => null);

      const specInput = (template: { archetype: string; typePairingId: string; deviceStyle: DeviceStyle; plateTreatment?: OverlaySpec["plateTreatment"] }) =>
        buildOverlaySpec({
          archetype: template.archetype,
          aspectRatio: aspect,
          language: ctx.language,
          copy: layout.copy,
          motto: ctx.run.brand.mottoText,
          contactLine: ctx.run.brand.contactLine,
          showContact: false,
          brand: {
            primaryColorHex: ctx.run.brand.primaryColorHex ?? "#b83b5e",
            accentColorHex: ctx.run.brand.accentColorsHex[0] ?? null,
          },
          typographyStyle: ctx.run.brand.typographyStyle,
          occasion,
          productCategory: ctx.run.product?.category ?? null,
          typePairingId: template.typePairingId,
          deviceStyle: template.deviceStyle,
          plateTreatment: template.plateTreatment,
          dominantColors: analysis?.dominant,
          placement: analysis
            ? { safeBand: analysis.safeBand, busyness: analysis.busyness, calmBand: analysis.calmBand }
            : undefined,
          logoAssetRef: ctx.logoAssetKey ?? null,
          logoPosition: (ctx.run.brand.logoCorner as LogoPosition | null) ?? undefined,
          logoScale: ctx.run.brand.logoScale ?? undefined,
        });

      // Build candidate variants, score each (deterministic), keep the best.
      const templates = hasHeadline
        ? selectTemplates(
            { aspect, productPlacement: layout.productPlacement ?? null, signals, busyness: analysis?.busyness, safeBand: analysis?.safeBand, zoneHint, preferPairing: kit.preferPairing },
            COMPOSE_VARIANTS,
          )
        : [{ id: "clean-bottom", archetype: "headline_bottom" as const, typePairingId: "clean-sans", deviceStyle: "minimal" as DeviceStyle }];

      const scored = templates
        .map((t) => {
          const spec = specInput(t); // plateFocusY set inside buildOverlaySpec from safeBand
          // Deterministic legibility pass: remap any layer colour that can't
          // hold WCAG contrast against the plate pixels it actually sits on.
          const contrastNotes = raster ? enforceContrast(spec, raster) : [];
          const s = scoreSpec(spec, { safeBand: analysis?.safeBand, busyness: analysis?.busyness });
          return { templateId: t.id, spec, score: s.score, reasons: s.reasons, contrastNotes };
        })
        .sort((a, b) => b.score - a.score);

      const best = scored[0];
      let chosen = best;
      let composed = await renderOverlay(chosen.spec, { plate, logo: ctx.logoBuffer });
      let usedFallback = false;

      // Vision placement QA on the REAL composited pixels: the deterministic
      // scorer can still drop type onto a face or the product. On failure,
      // retry with up to TWO runner-ups that lay out DIFFERENTLY (same-
      // archetype retries reproduce the same collision; recomposes are cheap
      // canvas work, so a second designed attempt beats jumping straight to
      // the generic fallback); if all fail, render a guaranteed-legible
      // fallback — never ship a known-bad composition.
      let placementQa = hasHeadline
        ? await checkOverlayPlacement({ image: composed, tracker: ctx.tracker })
        : { pass: true, issues: "no-headline" };
      if (!placementQa.pass) {
        const others = scored.slice(1);
        const differentArch = others.filter((s) => s.spec.archetype !== best.spec.archetype);
        const sameArch = others.filter((s) => s.spec.archetype === best.spec.archetype);
        const retries = [...differentArch, ...sameArch].slice(0, 2);
        for (const retry of retries) {
          const retryComposed = await renderOverlay(retry.spec, { plate, logo: ctx.logoBuffer });
          const retryQa = await checkOverlayPlacement({ image: retryComposed, tracker: ctx.tracker });
          if (retryQa.pass) {
            chosen = retry;
            composed = retryComposed;
            placementQa = retryQa;
            break;
          }
        }
        if (!placementQa.pass) {
          // Anchor the fallback into the plate's calm band — when the model
          // stages the product low in frame (common), the empty sky/top is the
          // safe home for type, not the hardcoded bottom.
          const fallbackArchetype = analysis?.safeBand === "top" ? "big_type_top" : "headline_bottom";
          const fallbackSpec = specInput({ archetype: fallbackArchetype, typePairingId: "clean-sans", deviceStyle: "minimal" });
          for (const layer of fallbackSpec.textLayers) {
            if (layer.role === "cta") continue; // pill supplies its own background
            layer.color = "#ffffff";
            layer.colorRole = undefined;
          }
          for (const scrim of fallbackSpec.scrims) scrim.maxOpacity = Math.max(scrim.maxOpacity, 0.75);
          chosen = { templateId: "legible-fallback", spec: fallbackSpec, score: 0, reasons: ["placement-qa fallback"], contrastNotes: [] };
          composed = await renderOverlay(fallbackSpec, { plate, logo: ctx.logoBuffer });
          usedFallback = true;
        }
      }

      const key = storageKeys.composedRender(creativeId, aspect, 0);
      await uploadBuffer(key, composed, "image/png");
      await prisma.creativeRender.create({
        data: { creativeId, aspectRatio: aspect, overlaySpec: chosen.spec as unknown as Prisma.InputJsonValue, composedImageKey: key, status: "COMPOSED" },
      });
      critics[aspect] = {
        chosen: chosen.templateId,
        score: chosen.score,
        reasons: chosen.reasons,
        considered: scored.map((s) => ({ templateId: s.templateId, score: s.score })),
        safeBand: analysis?.safeBand,
        busyness: analysis?.busyness,
        contrastNotes: chosen.contrastNotes.length ? chosen.contrastNotes : undefined,
        packQa: layout.plateQa?.[aspect],
        placementQa: {
          pass: placementQa.pass,
          issues: placementQa.issues,
          retried: chosen !== best,
          fallback: usedFallback || undefined,
        },
      };
      return { spec: chosen.spec, key, aspect };
    }),
  );
  const primary = results.find((r) => r.aspect === ctx.masterAspect) ?? results[0];

  const version = await prisma.creativeVersion.create({
    data: {
      creativeId,
      index: 0,
      cause: { type: "initial" },
      overlaySpec: primary.spec as unknown as Prisma.InputJsonValue,
      masterPlateKey: aspectPlateKeys[primary.aspect] ?? aspectPlateKeys[ctx.masterAspect],
      composedImageKey: primary.key,
      aspectRatio: primary.aspect,
    },
  });
  await prisma.creative.update({
    where: { id: creativeId },
    data: { status: "READY", currentVersionId: version.id, critic: critics as Prisma.InputJsonValue },
  });
}
