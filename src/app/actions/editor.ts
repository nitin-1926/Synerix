"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { tasks, auth as triggerAuth } from "@trigger.dev/sdk";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { debitCredits, grantCredits, InsufficientCreditsError } from "@/lib/credits";
import { CREDIT_COSTS } from "@/lib/ai/models";
import { computeLogoBox, contactLayer } from "@/lib/composition/archetypes";
import type { SceneAspect as Aspect } from "@/lib/image/provider";
import {
  isBaked,
  loadOwnedCreative,
  recompositeAll,
  type ConceptWithTypography,
} from "@/lib/editor/paid-edits";
import type { creativeEdit, CreativeEditPayload } from "@/trigger/creative-edit";
import type { CopyLanguage, OverlaySpec } from "@/lib/composition/types";
/** Returned by paid edits: the edit runs in a Trigger.dev task (image calls
 * take 20-40s+, longer than a serverless action may live); the editor watches
 * the run via useRealtimeRun with this scoped token. */
export type PendingEdit = { pending: true; runId: string; publicToken: string | null };

async function startCreativeEdit(
  payload: CreativeEditPayload,
  note: string,
): Promise<PendingEdit | { error: string }> {
  // render_aspect is a FREE recomposite: no debit here, and neither this
  // function nor the task's catchError may refund for it.
  const paid = payload.kind !== "render_aspect";
  if (paid) {
    try {
      await debitCredits({
        workspaceId: payload.workspaceId,
        amount: CREDIT_COSTS.regenInstruction,
        reason: "REGEN_INSTRUCTION",
        note,
      });
    } catch (e) {
      if (e instanceof InsufficientCreditsError) return { error: "Not enough credits" };
      throw e;
    }
  }

  let handle;
  try {
    handle = await tasks.trigger<typeof creativeEdit>("creative-edit", payload, {
      tags: [`creative:${payload.creativeId}`, `ws:${payload.workspaceId}`],
    });
  } catch (e) {
    if (paid) {
      await grantCredits({
        workspaceId: payload.workspaceId,
        amount: CREDIT_COSTS.regenInstruction,
        reason: "REFUND",
        note: "Edit could not be queued — refunded",
      });
    }
    return { error: `Could not start the edit: ${(e as Error).message?.slice(0, 160)}` };
  }

  let publicToken: string | null = null;
  try {
    publicToken = await triggerAuth.createPublicToken({
      scopes: { read: { runs: [handle.id] } },
      expirationTime: "15m",
    });
  } catch {
    publicToken = null; // editor falls back to refresh-on-timer
  }
  return { pending: true, runId: handle.id, publicToken };
}

// NOTE: z.record(enumKey, ...) is EXHAUSTIVE in Zod v4 (requires every enum
// key). Creatives only carry the roles their archetype uses, so use a plain
// string-keyed record and filter to valid roles in code.
const VALID_ROLES = ["eyebrow", "headline", "subhead", "cta", "motto"] as const;
const textEditSchema = z.object({
  creativeId: z.string().uuid(),
  language: z.enum(["en", "hinglish", "hi", "pa"]),
  texts: z.record(z.string(), z.string().max(160)),
});

export async function updateCreativeText(input: z.infer<typeof textEditSchema>) {
  const auth = await requireAuth();
  const parsed = textEditSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid edit: " + (parsed.error.issues[0]?.message ?? "") };
  const { creativeId, language, texts } = parsed.data;

  const creative = await loadOwnedCreative(creativeId, auth.workspaceId);
  if (!creative.masterPlateKey) return { error: "Creative has no master scene" };

  // Baked typography: headline/CTA edits are in-pixel scene edits (paid,
  // async via the creative-edit task). Other roles (motto) stay free.
  if (isBaked(creative) && (texts.headline !== undefined || texts.cta !== undefined)) {
    const concept = creative.concept as ConceptWithTypography;
    const copy = concept.copy?.[language] ?? concept.copy?.en;
    const headline = texts.headline ?? copy?.headline ?? "";
    const cta = texts.cta ?? copy?.cta ?? null;
    if (!headline.trim()) return { error: "Headline cannot be empty on this creative" };
    return startCreativeEdit(
      {
        kind: "baked_text",
        creativeId,
        workspaceId: auth.workspaceId,
        headline: headline.trim(),
        cta: cta?.trim() || null,
        language,
        cause: "text_edit",
      },
      `Baked text change (${language})`,
    );
  }

  try {
    await recompositeAll(creative, {
      plateKey: creative.masterPlateKey,
      cause: { type: "text_edit", language },
      mutateSpec: (spec) => {
        spec.language = language;
        for (const layer of spec.textLayers) {
          if (!(VALID_ROLES as readonly string[]).includes(layer.role)) continue;
          const next = texts[layer.role];
          if (next !== undefined) layer.textByLang[language] = next;
        }
      },
    });
  } catch (e) {
    return { error: `recomposite failed: ${(e as Error).message?.slice(0, 200)}` };
  }
  revalidatePath(`/library/${creativeId}`);
  return { ok: true };
}

export async function updateLogoPlacement(
  creativeId: string,
  position: "TL" | "TR" | "TC" | "BL" | "BR",
  scale: number,
) {
  const auth = await requireAuth();
  const creative = await loadOwnedCreative(creativeId, auth.workspaceId);
  if (!creative.masterPlateKey) return { error: "Creative has no master scene" };
  const s = Math.max(0.5, Math.min(2, scale));
  try {
    await recompositeAll(creative, {
      plateKey: creative.masterPlateKey,
      cause: { type: "logo_edit", position, scale: s },
      mutateSpec: (spec) => {
        if (spec.logo) {
          spec.logo = computeLogoBox(spec.logo.assetRef, spec.canvas, position, s);
        }
      },
    });
  } catch (e) {
    return { error: `recomposite failed: ${(e as Error).message?.slice(0, 200)}` };
  }
  revalidatePath(`/library/${creativeId}`);
  return { ok: true };
}

/** Free-form logo placement: fractions of the canvas (fx, fy = top-left corner,
 * fw = width). Applied to EVERY render's spec so all aspects stay consistent;
 * the logo box's aspect ratio is preserved. Pure recomposite — zero AI cost. */
const logoPlacementSchema = z.object({
  fx: z.number().min(0).max(1),
  fy: z.number().min(0).max(1),
  fw: z.number().min(0.05).max(0.5),
});

export async function updateLogoPlacementFree(
  creativeId: string,
  placement: { fx: number; fy: number; fw: number },
) {
  const auth = await requireAuth();
  const parsed = logoPlacementSchema.safeParse(placement);
  if (!parsed.success) return { error: "Invalid placement: " + (parsed.error.issues[0]?.message ?? "") };
  const { fx, fy, fw } = parsed.data;

  const creative = await loadOwnedCreative(creativeId, auth.workspaceId);
  if (!creative.masterPlateKey) return { error: "Creative has no master scene" };
  const hasLogo = creative.renders.some((r) => (r.overlaySpec as unknown as OverlaySpec).logo);
  if (!hasLogo) return { error: "This creative has no logo layer" };

  try {
    await recompositeAll(creative, {
      plateKey: creative.masterPlateKey,
      cause: { type: "logo_free_placement", fx, fy, fw },
      mutateSpec: (spec) => {
        if (!spec.logo) return;
        // Preserve the box's current aspect ratio (falls back to the
        // computeLogoBox default of 0.085/0.22 if the box is degenerate).
        const ratio = spec.logo.w > 0 ? spec.logo.h / spec.logo.w : 0.085 / 0.22;
        const w = Math.round(fw * spec.canvas.width);
        spec.logo = {
          ...spec.logo,
          x: Math.round(fx * spec.canvas.width),
          y: Math.round(fy * spec.canvas.height),
          w,
          h: Math.round(w * ratio),
        };
      },
    });
  } catch (e) {
    return { error: `recomposite failed: ${(e as Error).message?.slice(0, 200)}` };
  }
  revalidatePath(`/library/${creativeId}`);
  return { ok: true };
}

/** Brand Block: toggle the opt-in contact line on/off for this creative. The
 * line content is brand-locked (Brand.contactLine); the editor only flips
 * visibility and re-composites (free, no AI). */
export async function toggleContactLine(creativeId: string, show: boolean) {
  const auth = await requireAuth();
  const creative = await loadOwnedCreative(creativeId, auth.workspaceId);
  if (!creative.masterPlateKey) return { error: "Creative has no master scene" };
  const line = creative.brand.contactLine?.trim();
  if (show && !line) return { error: "Add a contact line in Brand settings first" };
  try {
    await recompositeAll(creative, {
      plateKey: creative.masterPlateKey,
      cause: { type: "brand_block_edit", showContact: show },
      mutateSpec: (spec) => {
        spec.textLayers = spec.textLayers.filter((l) => l.role !== "contact");
        if (show && line) spec.textLayers.push(contactLayer(line, spec.canvas));
      },
    });
  } catch (e) {
    return { error: `recomposite failed: ${(e as Error).message?.slice(0, 200)}` };
  }
  revalidatePath(`/library/${creativeId}`);
  return { ok: true };
}

export async function switchCreativeLanguage(creativeId: string, language: CopyLanguage) {
  const auth = await requireAuth();
  const creative = await loadOwnedCreative(creativeId, auth.workspaceId);
  if (!creative.masterPlateKey) return { error: "Creative has no master scene" };

  if (isBaked(creative)) {
    const concept = creative.concept as ConceptWithTypography;
    const copy = concept.copy?.[language] ?? concept.copy?.en;
    if (!copy?.headline) return { error: "No copy available for that language" };
    return startCreativeEdit(
      {
        kind: "baked_text",
        creativeId,
        workspaceId: auth.workspaceId,
        headline: copy.headline,
        cta: copy.cta ?? null,
        language,
        cause: "language_switch",
      },
      `Language switch (${language})`,
    );
  }

  await recompositeAll(creative, {
    plateKey: creative.masterPlateKey,
    cause: { type: "language_switch", language },
    mutateSpec: (spec) => {
      spec.language = language;
    },
  });
  revalidatePath(`/library/${creativeId}`);
  return { ok: true };
}

export async function renderNewAspect(creativeId: string, aspect: Aspect) {
  const auth = await requireAuth();
  if (!["1:1", "4:5", "9:16", "16:9"].includes(aspect)) return { error: "Bad aspect" };
  const creative = await loadOwnedCreative(creativeId, auth.workspaceId);
  if (!creative.masterPlateKey) return { error: "Creative has no master scene" };
  if (creative.renders.some((r) => r.aspectRatio === aspect)) return { ok: true };

  // Free, but the full-res plate download + composite + upload can outlive a
  // serverless action — run it in the creative-edit task (no credit debit).
  return startCreativeEdit(
    { kind: "render_aspect", creativeId, workspaceId: auth.workspaceId, aspect },
    `New ${aspect} format`,
  );
}

export async function regenerateWithInstruction(creativeId: string, instruction: string) {
  const auth = await requireAuth();
  const note = instruction.trim().slice(0, 400);
  if (note.length < 4) return { error: "Describe the change you want" };
  const creative = await loadOwnedCreative(creativeId, auth.workspaceId);
  if (!creative.masterPlateKey) return { error: "Creative has no master scene" };

  return startCreativeEdit(
    { kind: "regen_instruction", creativeId, workspaceId: auth.workspaceId, instruction: note },
    note.slice(0, 80),
  );
}

export async function revertToVersion(creativeId: string, versionIndex: number) {
  const auth = await requireAuth();
  const creative = await loadOwnedCreative(creativeId, auth.workspaceId);
  const target = await prisma.creativeVersion.findUnique({
    where: { creativeId_index: { creativeId, index: versionIndex } },
  });
  if (!target) return { error: "Version not found" };
  const plateKey = target.masterPlateKey ?? creative.masterPlateKey;
  if (!plateKey) return { error: "Version has no scene" };

  const targetSpec = target.overlaySpec as unknown as OverlaySpec;
  await recompositeAll(creative, {
    plateKey,
    cause: { type: "revert", fromVersionIndex: versionIndex },
    mutateSpec: (spec) => {
      spec.language = targetSpec.language;
      for (const layer of spec.textLayers) {
        const prev = targetSpec.textLayers.find((l) => l.role === layer.role);
        if (prev) layer.textByLang = prev.textByLang;
      }
    },
  });
  revalidatePath(`/library/${creativeId}`);
  return { ok: true };
}
