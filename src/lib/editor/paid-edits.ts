import { prisma } from "@/lib/db";
import { CREDIT_COSTS } from "@/lib/ai/models";
import { grantCredits } from "@/lib/credits";
import { downloadFromStorage, storageKeys, uploadBuffer } from "@/lib/storage";
import { renderOverlay } from "@/lib/composition/render";
import { buildOverlaySpec } from "@/lib/composition/archetypes";
import { analyzePlate } from "@/lib/composition/analyze";
import { generateScene, resolveWorkspaceImageModel, type SceneAspect as Aspect } from "@/lib/image/provider";
import { buildOnModelPrompt, buildScenePassPrompt } from "@/lib/pipeline/image-prompt";
import { CostTracker } from "@/lib/pipeline/cost";
import { persistCost } from "@/lib/pipeline/cost-log";
import { checkBakedText } from "@/lib/pipeline/text-qa";
import { applyTypographyPass } from "@/lib/pipeline/typography";
import { conceptCopyToRoles, type CreativeConcept } from "@/lib/pipeline/schemas";
import type { CopyLanguage, OverlaySpec } from "@/lib/composition/types";
import type { Prisma } from "@/generated/prisma/client";

/**
 * Paid creative edits (image-model calls) + the shared load/recomposite
 * helpers. Lives outside the server-action layer so the `creative-edit`
 * Trigger.dev task can run the SAME logic — image calls take 20-40s+, which
 * outlives serverless request limits. Credits are DEBITED by the calling
 * action (so InsufficientCredits surfaces synchronously); refunds on
 * QA-failure/error happen in here, next to the failure.
 */

/** Concept JSON for baked-typography creatives carries the render mode. */
export type ConceptWithTypography = CreativeConcept & { typographyMode?: "baked" | "overlay" };

export function isBaked(creative: { concept: unknown }): boolean {
  return (creative.concept as ConceptWithTypography)?.typographyMode === "baked";
}

export async function loadOwnedCreative(creativeId: string, workspaceId: string) {
  const creative = await prisma.creative.findFirst({
    where: { id: creativeId, brand: { workspaceId }, deletedAt: null },
    include: {
      renders: true,
      versions: { orderBy: { index: "desc" }, take: 1 },
      brand: { include: { assets: { where: { isPrimaryLogo: true }, take: 1 } } },
    },
  });
  if (!creative) throw new Error("Creative not found");
  return creative;
}

export type LoadedCreative = Awaited<ReturnType<typeof loadOwnedCreative>>;

/** Re-composite every render of a creative from (possibly mutated) specs +
 * the given plate; snapshot a new version. Zero AI cost. */
export async function recompositeAll(
  creative: LoadedCreative,
  opts: { plateKey: string; cause: object; mutateSpec?: (spec: OverlaySpec) => void },
) {
  const logoAsset = creative.brand.assets[0];
  const logo = logoAsset ? await downloadFromStorage(logoAsset.storageKey) : undefined;
  const nextIndex = (creative.versions[0]?.index ?? 0) + 1;

  // Re-compose each aspect from ITS OWN native plate when we're re-rendering on
  // the existing master scene (text/language edits). When a fresh plate is
  // supplied (scene regen), that single plate is used for every aspect.
  const aspectPlateKeys =
    (creative.concept as { aspectPlateKeys?: Record<string, string> })?.aspectPlateKeys ?? {};
  const usePerAspect = opts.plateKey === creative.masterPlateKey && Object.keys(aspectPlateKeys).length > 0;
  const plateCache = new Map<string, Buffer>();
  const plateFor = async (aspect: string): Promise<Buffer> => {
    const key = (usePerAspect ? aspectPlateKeys[aspect] : undefined) ?? opts.plateKey;
    let buf = plateCache.get(key);
    if (!buf) {
      buf = await downloadFromStorage(key);
      plateCache.set(key, buf);
    }
    return buf;
  };

  // All aspects re-composite in parallel — this loop being sequential was the
  // main reason "free" edits felt slow. Compositing + storage uploads happen
  // BEFORE any DB write: if one aspect fails, no render row has moved (an
  // orphaned storage object is harmless; a half-updated creative is not —
  // some aspects would show the new scene while masterPlateKey still points
  // at the old plate, with no version snapshot to revert to).
  const results = await Promise.all(
    creative.renders.map(async (render) => {
      const spec = render.overlaySpec as unknown as OverlaySpec;
      opts.mutateSpec?.(spec);
      const composed = await renderOverlay(spec, { plate: await plateFor(render.aspectRatio), logo });
      const key = storageKeys.composedRender(creative.id, render.aspectRatio, nextIndex);
      await uploadBuffer(key, composed, "image/png");
      return { renderId: render.id, spec, key, aspect: render.aspectRatio };
    }),
  );
  const primary = results.find((r) => r.aspect === creative.masterAspect) ?? results[0];
  if (!primary) throw new Error("Creative has no renders");

  // Single transaction: render updates + version snapshot + pointer flip
  // commit together or not at all.
  await prisma.$transaction(async (tx) => {
    for (const r of results) {
      await tx.creativeRender.update({
        where: { id: r.renderId },
        data: { overlaySpec: r.spec as unknown as Prisma.InputJsonValue, composedImageKey: r.key, status: "COMPOSED" },
      });
    }
    const version = await tx.creativeVersion.create({
      data: {
        creativeId: creative.id,
        index: nextIndex,
        cause: opts.cause as Prisma.InputJsonValue,
        overlaySpec: primary.spec as unknown as Prisma.InputJsonValue,
        masterPlateKey: opts.plateKey,
        composedImageKey: primary.key,
        aspectRatio: primary.aspect,
      },
    });
    await tx.creative.update({
      where: { id: creative.id },
      data: { currentVersionId: version.id, masterPlateKey: opts.plateKey },
    });
  });
}

/** Render one additional aspect by generating a NATIVE plate for that ratio via
 * the image model (correct framing, not a crop of the master plate), then
 * compositing text/logo. Paid: the caller debits before triggering; this
 * refunds on a handled failure (the task's catchError covers crashes). */
export async function applyRenderAspect(
  creative: LoadedCreative,
  aspect: Aspect,
  workspaceId: string,
): Promise<{ ok: true } | { error: string }> {
  if (!creative.masterPlateKey) return { error: "Creative has no master scene" };
  if (creative.renders.some((r) => r.aspectRatio === aspect)) return { ok: true };

  const refund = (note: string) =>
    grantCredits({ workspaceId, amount: CREDIT_COSTS.regenInstruction, reason: "REFUND", note }).catch(() => {});

  try {
    const concept = creative.concept as unknown as CreativeConcept & { pose?: string; aspectPlateKeys?: Record<string, string> };
    const refSpec = creative.renders[0]?.overlaySpec as unknown as OverlaySpec | undefined;

    // Reload the generating run for references + fidelity framing so the new
    // plate is a faithful native render of the SAME scene at the new ratio.
    const run = await prisma.generationRun.findUnique({
      where: { id: creative.generationRunId },
      include: {
        product: { include: { images: { orderBy: [{ isPrimary: "desc" }], take: 1 } } },
        aiModel: true,
        workspace: { select: { type: true, imageModel: true } },
      },
    });
    const onModel = run?.fidelityMode === "ON_MODEL";
    const productImage = run?.product?.images[0] ?? null;
    // Prefer the cached cutout (clean packshot) as reference, like generation.
    const refBuffer = productImage
      ? await downloadFromStorage(productImage.cutoutKey ?? productImage.storageKey)
      : null;
    const refMime = productImage?.cutoutKey ? "image/png" : (productImage?.mimeType ?? "image/png");
    // Honour the workspace image-model setting (soft-prefer, fallback kept).
    const wsVariant = resolveWorkspaceImageModel(run?.workspace?.imageModel);
    const model = wsVariant
      ? { provider: wsVariant.provider, tier: wsVariant.tier, softPrefer: true as const, runwareModel: wsVariant.runwareModel }
      : {};

    const tracker = new CostTracker();
    let plate: Buffer;
    if (onModel && run?.aiModel?.storageKey && refBuffer && productImage) {
      const modelBuffer = await downloadFromStorage(run.aiModel.storageKey);
      const prompt = buildOnModelPrompt({
        concept,
        aspect,
        garmentPrompt: run.product?.dissectionPrompt,
        pose: concept.pose ?? run.modelPose,
        direction: run.workspace?.type === "FASHION_EDITORIAL" ? "editorial" : "catalog",
        plain: run.brandingMode === "PLAIN",
      });
      const refs = [
        { buffer: modelBuffer, mime: run.aiModel.mimeType ?? "image/png" },
        { buffer: refBuffer, mime: refMime },
      ];
      const gen = await generateScene({ prompt, aspect, references: refs, ...model });
      tracker.addImage(gen.costModel, "render-aspect");
      plate = gen.buffer;
    } else {
      const hasProduct = Boolean(refBuffer);
      const refs = hasProduct && productImage ? [{ buffer: refBuffer!, mime: refMime }] : undefined;
      const prompt = buildScenePassPrompt({ concept, aspect, dissectionPrompt: run?.product?.dissectionPrompt, hasProduct });
      const gen = await generateScene({ prompt, aspect, references: refs, ...model });
      tracker.addImage(gen.costModel, "render-aspect");
      plate = gen.buffer;
    }

    // Persist the native plate as THIS aspect's own plate key so later text /
    // language edits re-composite from it (not from a cropped master).
    const plateKey = storageKeys.masterPlate(creative.generationRunId, `${creative.conceptIndex}-${aspect.replace(":", "x")}`);
    await uploadBuffer(plateKey, plate, "image/png");

    const showContact = Boolean(refSpec?.textLayers.some((l) => l.role === "contact"));
    const analysis = await analyzePlate(plate).catch(() => null);
    const spec = buildOverlaySpec({
      archetype: concept.archetype,
      aspectRatio: aspect,
      language: refSpec?.language ?? "en",
      copy: conceptCopyToRoles(concept.copy),
      motto: creative.brand.mottoText,
      contactLine: creative.brand.contactLine,
      showContact,
      brand: {
        primaryColorHex: creative.brand.primaryColorHex ?? concept.paletteHexes[0],
        accentColorHex: creative.brand.accentColorsHex[0] ?? concept.paletteHexes[1] ?? null,
      },
      typePairingId: refSpec?.theme?.typePairing,
      dominantColors: analysis?.dominant,
      placement: analysis ? { safeBand: analysis.safeBand, busyness: analysis.busyness } : undefined,
      logoAssetRef: creative.brand.assets[0]?.storageKey ?? null,
      logoPosition: (creative.brand.logoCorner as "TL" | "TR" | "TC" | "BL" | "BR" | null) ?? undefined,
      logoScale: creative.brand.logoScale ?? undefined,
    });
    // Carry over any text edits from the existing spec.
    if (refSpec) {
      for (const layer of spec.textLayers) {
        const prev = refSpec.textLayers.find((l) => l.role === layer.role);
        if (prev) layer.textByLang = prev.textByLang;
      }
    }

    const logoAsset = creative.brand.assets[0];
    const logo = logoAsset ? await downloadFromStorage(logoAsset.storageKey) : undefined;
    const composed = await renderOverlay(spec, { plate, logo });
    const key = storageKeys.composedRender(creative.id, aspect, creative.versions[0]?.index ?? 0);
    await uploadBuffer(key, composed, "image/png");

    const nextAspectPlateKeys = { ...(concept.aspectPlateKeys ?? {}), [aspect]: plateKey };
    await prisma.$transaction([
      prisma.creativeRender.create({
        data: {
          creativeId: creative.id,
          aspectRatio: aspect,
          overlaySpec: spec as unknown as Prisma.InputJsonValue,
          composedImageKey: key,
          status: "COMPOSED",
        },
      }),
      prisma.creative.update({
        where: { id: creative.id },
        data: { concept: { ...concept, aspectPlateKeys: nextAspectPlateKeys } as unknown as Prisma.InputJsonValue },
      }),
    ]);

    await persistCost({ summary: tracker.summary(), source: "editor", workspaceId, runId: creative.generationRunId });
    return { ok: true };
  } catch (e) {
    await refund("New format render failed — refunded");
    return { error: `Render failed: ${(e as Error).message?.slice(0, 200)}` };
  }
}

/**
 * Baked-typography creatives: the headline lives in the pixels, so changing
 * it (text edit or language switch) is a paid scene edit — the default image
 * model (via the provider router) swaps the type in place, verified by the
 * text-QA vision check. Credits are refunded if the edit fails.
 */
export async function applyBakedTextSwap(
  creative: LoadedCreative,
  workspaceId: string,
  next: { headline: string; cta: string | null; language: CopyLanguage },
  cause: object,
): Promise<{ ok: true } | { error: string }> {
  if (!creative.masterPlateKey) return { error: "Creative has no master scene" };

  const tracker = new CostTracker();
  try {
    const concept = creative.concept as ConceptWithTypography & {
      scenePlateKey?: string;
      typographySpec?: string;
      paletteHexes?: string[];
    };
    let newPlate: Buffer;

    if (concept.scenePlateKey) {
      // Two-pass creatives: re-set the type on the CLEAN wordless scene —
      // full quality, no compounding edits of already-typed pixels.
      const scenePlate = await downloadFromStorage(concept.scenePlateKey);
      const typed = await applyTypographyPass({
        scenePlate,
        tracker,
        headline: next.headline,
        cta: next.cta,
        language: next.language,
        typographySpec: concept.typographySpec,
        paletteHexes: concept.paletteHexes,
        aspect: (creative.masterAspect as Aspect) ?? "4:5",
      });
      if (!typed.ok) {
        await grantCredits({
          workspaceId,
          amount: CREDIT_COSTS.regenInstruction,
          reason: "REFUND",
          note: "Baked text edit failed QA — refunded",
        });
        return { error: `The new text didn't render cleanly (${typed.issues}). Try again.` };
      }
      newPlate = typed.plate;
    } else {
      // Legacy baked creatives (no stored scene plate): edit the typed master.
      const currentPlate = await downloadFromStorage(creative.masterPlateKey);
      const script: Record<string, string> = {
        en: "English",
        hinglish: "Hinglish (Latin script)",
        hi: "Hindi in Devanagari script",
        pa: "Punjabi in Gurmukhi script",
      };
      const gen = await generateScene({
        prompt:
          `Edit this advertising image: replace ALL existing headline/CTA typography with the new ad headline "${next.headline}"` +
          (next.cta ? ` and the call-to-action "${next.cta}"` : "") +
          ` — ${script[next.language] ?? "English"}, spelled EXACTLY as given, every letter and diacritic correct, in the same premium advertising-typography style, position and size as the text it replaces. Keep EVERYTHING else identical: same scene, product, people, lighting, palette. No other text.`,
        aspect: (creative.masterAspect as Aspect) ?? "4:5",
        tier: "hero", // paid edit — premium model, same bar as generation
        references: [{ buffer: currentPlate, mime: "image/png" }],
      });
      tracker.addImage(gen.costModel, "editor-baked-text");
      newPlate = gen.buffer;
      const qa = await checkBakedText({
        image: newPlate,
        headline: next.headline,
        cta: next.cta,
        language: next.language,
        tracker,
      });
      if (!qa.pass) {
        await grantCredits({
          workspaceId,
          amount: CREDIT_COSTS.regenInstruction,
          reason: "REFUND",
          note: "Baked text edit failed QA — refunded",
        });
        return { error: `The new text didn't render cleanly (${qa.issues}). Try again.` };
      }
    }

    const nextIndex = (creative.versions[0]?.index ?? 0) + 1;
    const plateKey = `${creative.masterPlateKey.replace(/\.png$/, "")}-v${nextIndex}.png`;
    await uploadBuffer(plateKey, newPlate, "image/png");

    // Persist the edited copy on the concept so future passes use it.
    const updatedCopy = concept.copy
      ? {
          ...concept.copy,
          [next.language]: {
            ...(concept.copy[next.language] ?? concept.copy.en),
            headline: next.headline,
            cta: next.cta,
          },
        }
      : undefined;
    if (updatedCopy) {
      await prisma.creative.update({
        where: { id: creative.id },
        data: { concept: { ...concept, copy: updatedCopy } as unknown as Prisma.InputJsonValue },
      });
    }

    await recompositeAll(creative, {
      plateKey,
      cause,
      mutateSpec: (spec) => {
        spec.language = next.language;
      },
    });
    return { ok: true };
  } catch (e) {
    await grantCredits({
      workspaceId,
      amount: CREDIT_COSTS.regenInstruction,
      reason: "REFUND",
      note: "Baked text edit errored — refunded",
    });
    return { error: `Edit failed: ${(e as Error).message?.slice(0, 200)}` };
  } finally {
    // Bill the workspace's cost observability even when the edit failed —
    // the API calls happened either way.
    void persistCost({ summary: tracker.summary(), source: "editor", workspaceId });
  }
}

/** Scene regenerate-with-instruction (paid). Same refund semantics as above. */
export async function applyRegenInstruction(
  creative: LoadedCreative,
  workspaceId: string,
  note: string,
): Promise<{ ok: true } | { error: string }> {
  if (!creative.masterPlateKey) return { error: "Creative has no master scene" };

  const concept = creative.concept as ConceptWithTypography & {
    scenePlateKey?: string;
    typographySpec?: string;
  };
  const baked = isBaked(creative);
  const aspect = (creative.masterAspect as Aspect) ?? "4:5";
  const tracker = new CostTracker();

  try {
    if (baked && concept.scenePlateKey) {
      // Two-pass creatives: edit the WORDLESS scene, then re-set typography —
      // the instruction edit never has to fight existing type pixels.
      const scenePlate = await downloadFromStorage(concept.scenePlateKey);
      const gen = await generateScene({
        prompt: `Edit this advertising scene: ${note}. Keep everything else identical — same product, same composition, same palette (${concept.paletteHexes.join(", ")}). No text, no letters, no logos, no watermarks (only the product's own packaging print).`,
        aspect,
        tier: "hero", // paid edit — premium model, same bar as generation
        references: [{ buffer: scenePlate, mime: "image/png" }],
      });
      tracker.addImage(gen.costModel, "editor-regen");
      const newScene = gen.buffer;

      const lang = (creative.renders[0]?.overlaySpec as unknown as OverlaySpec | undefined)?.language ?? "en";
      const copy = concept.copy?.[lang as CopyLanguage] ?? concept.copy?.en;
      const typed = await applyTypographyPass({
        scenePlate: newScene,
        headline: copy?.headline?.trim() ?? "",
        cta: copy?.cta?.trim() || null,
        language: lang,
        typographySpec: concept.typographySpec,
        paletteHexes: concept.paletteHexes,
        aspect,
        tracker,
      });
      if (!typed.ok) {
        await grantCredits({
          workspaceId,
          amount: CREDIT_COSTS.regenInstruction,
          reason: "REFUND",
          note: "Regenerate failed typography QA — refunded",
        });
        return { error: `The regenerated scene's text didn't render cleanly (${typed.issues}). Try again.` };
      }

      const nextIndex = (creative.versions[0]?.index ?? 0) + 1;
      const plateKey = `${creative.masterPlateKey.replace(/\.png$/, "")}-v${nextIndex}.png`;
      const sceneKey = `${creative.masterPlateKey.replace(/\.png$/, "")}-v${nextIndex}-scene.png`;
      await Promise.all([
        uploadBuffer(plateKey, typed.plate, "image/png"),
        uploadBuffer(sceneKey, newScene, "image/png"),
      ]);
      await prisma.creative.update({
        where: { id: creative.id },
        data: { concept: { ...concept, scenePlateKey: sceneKey } as unknown as Prisma.InputJsonValue },
      });
      await recompositeAll(creative, { plateKey, cause: { type: "regen_instruction", note } });
      return { ok: true };
    }

    // Overlay / legacy creatives: edit the master plate directly.
    const currentPlate = await downloadFromStorage(creative.masterPlateKey);
    const textRule = baked
      ? "Keep the existing headline/CTA typography EXACTLY as it is — same words, spelling, style and position. Add no other text."
      : "No text, no letters, no logos, no watermarks.";
    const gen = await generateScene({
      prompt: `Edit this advertising scene: ${note}. Keep everything else identical — same product, same composition, same palette (${concept.paletteHexes.join(", ")}). ${textRule}`,
      aspect,
      tier: "hero", // paid edit — premium model, same bar as generation
      references: [{ buffer: currentPlate, mime: "image/png" }],
    });
    tracker.addImage(gen.costModel, "editor-regen");
    const newPlate = gen.buffer;
    const nextIndex = (creative.versions[0]?.index ?? 0) + 1;
    const plateKey = `${creative.masterPlateKey.replace(/\.png$/, "")}-v${nextIndex}.png`;
    await uploadBuffer(plateKey, newPlate, "image/png");

    await recompositeAll(creative, { plateKey, cause: { type: "regen_instruction", note } });
    return { ok: true };
  } catch (e) {
    await grantCredits({
      workspaceId,
      amount: CREDIT_COSTS.regenInstruction,
      reason: "REFUND",
      note: "Regenerate errored — refunded",
    });
    return { error: `Regenerate failed: ${(e as Error).message?.slice(0, 200)}` };
  } finally {
    void persistCost({ summary: tracker.summary(), source: "editor", workspaceId });
  }
}
