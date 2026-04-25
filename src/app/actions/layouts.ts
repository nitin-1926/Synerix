"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { downloadFromStorage, storageKeys, uploadBuffer } from "@/lib/storage";
import { renderOverlay } from "@/lib/composition/render";
import { buildOverlaySpec } from "@/lib/composition/archetypes";
import { analyzePlate } from "@/lib/composition/analyze";
import { selectTemplates, TEMPLATES, type Template } from "@/lib/composition/templates";
import { scoreSpec } from "@/lib/composition/score";
import { resolveBrandKit } from "@/lib/composition/brandKit";
import { conceptCopyToRoles, type CreativeConcept } from "@/lib/pipeline/schemas";
import type { CopyLanguage, OverlaySpec } from "@/lib/composition/types";
import type { Prisma } from "@/generated/prisma/client";

/** Load a creative with everything needed to rebuild alternate layout specs. */
async function loadForLayout(creativeId: string, workspaceId: string) {
  const creative = await prisma.creative.findFirst({
    where: { id: creativeId, brand: { workspaceId }, deletedAt: null },
    include: {
      renders: { where: { status: "COMPOSED" } },
      versions: { orderBy: { index: "desc" }, take: 1 },
      brand: { include: { assets: { where: { isPrimaryLogo: true }, take: 1 } } },
      generationRun: { include: { calendarEntry: { include: { festivalOccurrence: { include: { festival: true } } } }, product: { select: { category: true } } } },
    },
  });
  if (!creative) throw new Error("Creative not found");
  return creative;
}

type Loaded = Awaited<ReturnType<typeof loadForLayout>>;

/** Inputs shared by every alternate-template render, mirroring the generator. */
function templateInputs(creative: Loaded) {
  const concept = creative.concept as unknown as CreativeConcept & { aspectPlateKeys?: Record<string, string> };
  const brand = creative.brand;
  const occasion =
    creative.generationRun.calendarEntry?.festivalOccurrence?.festival?.name ?? creative.generationRun.customBrief ?? null;
  return {
    concept,
    occasion,
    productCategory: creative.generationRun.product?.category ?? null,
    copy: conceptCopyToRoles(concept.copy),
    logoAssetRef: brand.assets[0]?.storageKey ?? null,
    brandInput: {
      primaryColorHex: brand.primaryColorHex,
      accentColorsHex: brand.accentColorsHex,
      typographyStyle: brand.typographyStyle,
      mottoText: brand.mottoText,
      contactLine: brand.contactLine,
      logoCorner: brand.logoCorner,
      logoScale: brand.logoScale,
    },
  };
}

async function specForTemplate(t: Template, aspect: string, plate: Buffer, inputs: ReturnType<typeof templateInputs>, language: CopyLanguage): Promise<OverlaySpec> {
  const analysis = await analyzePlate(plate).catch(() => null);
  const b = inputs.brandInput;
  return buildOverlaySpec({
    archetype: t.archetype,
    aspectRatio: aspect,
    language,
    copy: inputs.copy,
    motto: b.mottoText,
    contactLine: b.contactLine,
    showContact: false,
    brand: { primaryColorHex: b.primaryColorHex ?? "#b83b5e", accentColorHex: b.accentColorsHex[0] ?? null },
    typographyStyle: b.typographyStyle,
    occasion: inputs.occasion,
    productCategory: inputs.productCategory,
    typePairingId: t.typePairingId,
    deviceStyle: t.deviceStyle,
    plateTreatment: t.plateTreatment,
    dominantColors: analysis?.dominant,
    placement: analysis ? { safeBand: analysis.safeBand, busyness: analysis.busyness } : undefined,
    logoAssetRef: inputs.logoAssetRef,
    logoPosition: (b.logoCorner as "TL" | "TR" | "TC" | "BL" | "BR" | null) ?? undefined,
    logoScale: b.logoScale ?? undefined,
  });
}

function plateKeyFor(creative: Loaded, aspect: string): string | null {
  const concept = creative.concept as { aspectPlateKeys?: Record<string, string> };
  return concept.aspectPlateKeys?.[aspect] ?? creative.masterPlateKey ?? null;
}

/**
 * Render the strongest alternate LAYOUTS for a creative's master aspect as
 * inline previews (no AI, no storage writes) — the variant strip. Each option
 * carries its score + a one-line reason so the pick is explainable.
 */
export async function listLayoutVariants(creativeId: string): Promise<{
  options?: Array<{ templateId: string; label: string; score: number; reason: string; dataUri: string; current: boolean }>;
  error?: string;
}> {
  const auth = await requireAuth();
  const creative = await loadForLayout(creativeId, auth.workspaceId);
  const aspect = creative.masterAspect ?? creative.renders[0]?.aspectRatio ?? "4:5";
  const plateKey = plateKeyFor(creative, aspect);
  if (!plateKey) return { error: "No scene to re-layout" };

  const inputs = templateInputs(creative);
  const current = creative.renders.find((r) => r.aspectRatio === aspect);
  const currentTemplate = (current?.overlaySpec as unknown as { theme?: { deviceStyle?: string } } | undefined);
  const language = ((current?.overlaySpec as unknown as OverlaySpec | undefined)?.language ?? "en") as CopyLanguage;

  const plate = await downloadFromStorage(plateKey);
  const analysis = await analyzePlate(plate).catch(() => null);
  const kit = resolveBrandKit({
    primaryColorHex: inputs.brandInput.primaryColorHex,
    accentColorsHex: inputs.brandInput.accentColorsHex,
    typographyStyle: inputs.brandInput.typographyStyle,
    productCategory: inputs.productCategory,
  });
  const signals = [inputs.brandInput.typographyStyle, inputs.occasion, inputs.productCategory].filter(Boolean).join(" ").toLowerCase();
  const logo = inputs.logoAssetRef ? await downloadFromStorage(inputs.logoAssetRef).catch(() => undefined) : undefined;

  const chosen = currentTemplate?.theme?.deviceStyle;
  const candidates = selectTemplates({ aspect, productPlacement: null, signals, busyness: analysis?.busyness, safeBand: analysis?.safeBand, preferPairing: kit.preferPairing }, 4);
  // Always include the current archetype/pairing too if not present.
  const seen = new Set(candidates.map((c) => c.id));
  for (const t of TEMPLATES) {
    if (candidates.length >= 5) break;
    if (!seen.has(t.id) && t.archetype === (currentTemplate as { archetype?: string } | undefined)?.archetype) candidates.push(t);
  }

  const options = await Promise.all(
    candidates.map(async (t) => {
      const spec = await specForTemplate(t, aspect, plate, inputs, language);
      const score = scoreSpec(spec, { safeBand: analysis?.safeBand, busyness: analysis?.busyness });
      const buf = await renderOverlay(spec, { plate, logo });
      return {
        templateId: t.id,
        label: t.label,
        score: score.score,
        reason: score.reasons[0] ?? "",
        dataUri: `data:image/png;base64,${buf.toString("base64")}`,
        current: t.id === chosen,
      };
    }),
  );
  options.sort((a, b) => b.score - a.score);
  return { options };
}

/**
 * Apply a chosen layout: rebuild the spec for that template across every aspect,
 * re-composite from the stored plates (free, no AI), and snapshot a new version.
 */
export async function applyLayout(creativeId: string, templateId: string): Promise<{ ok?: boolean; error?: string }> {
  const auth = await requireAuth();
  const t = TEMPLATES.find((x) => x.id === templateId);
  if (!t) return { error: "Unknown layout" };
  const creative = await loadForLayout(creativeId, auth.workspaceId);
  const inputs = templateInputs(creative);
  const logo = inputs.logoAssetRef ? await downloadFromStorage(inputs.logoAssetRef).catch(() => undefined) : undefined;
  const nextIndex = (creative.versions[0]?.index ?? 0) + 1;

  const results = await Promise.all(
    creative.renders.map(async (render) => {
      const plateKey = plateKeyFor(creative, render.aspectRatio);
      if (!plateKey) return null;
      const plate = await downloadFromStorage(plateKey);
      const language = ((render.overlaySpec as unknown as OverlaySpec).language ?? "en") as CopyLanguage;
      const spec = await specForTemplate(t, render.aspectRatio, plate, inputs, language);
      const composed = await renderOverlay(spec, { plate, logo });
      const key = storageKeys.composedRender(creative.id, render.aspectRatio, nextIndex);
      await uploadBuffer(key, composed, "image/png");
      await prisma.creativeRender.update({
        where: { id: render.id },
        data: { overlaySpec: spec as unknown as Prisma.InputJsonValue, composedImageKey: key, status: "COMPOSED" },
      });
      return { spec, key, aspect: render.aspectRatio };
    }),
  );
  const primary = results.find((r) => r && r.aspect === creative.masterAspect) ?? results.find(Boolean);
  if (!primary) return { error: "Nothing to re-layout" };

  const version = await prisma.creativeVersion.create({
    data: {
      creativeId: creative.id,
      index: nextIndex,
      cause: { type: "layout_remix", note: t.label } as Prisma.InputJsonValue,
      overlaySpec: primary.spec as unknown as Prisma.InputJsonValue,
      masterPlateKey: creative.masterPlateKey,
      composedImageKey: primary.key,
      aspectRatio: primary.aspect,
    },
  });
  await prisma.creative.update({ where: { id: creative.id }, data: { currentVersionId: version.id } });
  revalidatePath(`/library/${creativeId}`);
  return { ok: true };
}
