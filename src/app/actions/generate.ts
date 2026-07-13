"use server";

import { redirect } from "next/navigation";
import { tasks } from "@trigger.dev/sdk";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { CREDIT_COSTS, LIMITS } from "@/lib/ai/models";
import { debitCredits, reconcileRunRefund, InsufficientCreditsError } from "@/lib/credits";
import type { generationRun } from "@/trigger/generation-run";

const startSchema = z.object({
  occasionId: z.string().uuid().optional().or(z.literal("")), // FestivalOccurrence id
  entryId: z.string().uuid().optional().or(z.literal("")), // CalendarEntry id (custom)
  productId: z.string().uuid().optional().or(z.literal("")),
  customBrief: z.string().trim().max(800).optional().or(z.literal("")),
  fidelityMode: z.enum(["IN_SCENE", "EXACT_PRODUCT", "ON_MODEL"]).default("IN_SCENE"),
  // Apparel on-model only: BRANDED overlays logo + text, PLAIN ships the clean
  // shot. Empty string → fall back to the brand default.
  brandingMode: z.enum(["BRANDED", "PLAIN"]).optional().or(z.literal("")),
  // Optional pose direction for on-model apparel (empty = AI varies it).
  modelPose: z.string().trim().max(200).optional().or(z.literal("")),
  aiModelId: z.string().uuid().optional().or(z.literal("")), // required for ON_MODEL
  directMode: z.string().optional(), // "1" → literal prompt, skip concepting
  bakeoff: z.string().optional(), // "1" → super-admin model bake-off (no debit)
  // Image model pick; "compare" renders every option on both models (2× credits).
  imageModel: z.enum(["nb-pro", "gpt-image-2", "compare"]).default("nb-pro"),
  language: z.enum(["en", "hinglish", "hi", "pa"]).default("en"),
  optionCount: z.coerce.number().int().min(1).max(LIMITS.maxConceptsPerRun).default(LIMITS.maxConceptsPerRun),
  aspects: z.string().default("4:5"), // comma-separated
});

export async function startGenerationRun(formData: FormData) {
  const auth = await requireAuth();
  const brand = await prisma.brand.findFirst({ where: { workspaceId: auth.workspaceId } });
  if (!brand) return { error: "Set up your brand first" };

  const parsed = startSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const d = parsed.data;
  const directMode = d.directMode === "1";
  // Bake-off is a super-admin testing tool; silently ignore the flag for
  // anyone else rather than erroring (it can only arrive via a forged form).
  const bakeoff = d.bakeoff === "1" && auth.isSuperAdmin;

  if (directMode) {
    if (!d.customBrief || d.customBrief.length < 4) return { error: "Write a prompt describing the creative" };
  } else if (!d.occasionId && !d.entryId && !d.customBrief) {
    return { error: "Pick an occasion or describe what you want" };
  }

  const requestedAspects = [...new Set(d.aspects.split(",").map((a) => a.trim()))].filter((a) =>
    ["1:1", "4:5", "9:16", "16:9"].includes(a),
  );
  if (!requestedAspects.length) requestedAspects.push("4:5");

  // Validate ownership of referenced entities.
  let calendarEntryId: string | null = null;
  if (d.entryId) {
    const entry = await prisma.calendarEntry.findFirst({
      where: { id: d.entryId, workspaceId: auth.workspaceId },
    });
    if (!entry) return { error: "Occasion not found" };
    calendarEntryId = entry.id;
  } else if (d.occasionId) {
    const occurrence = await prisma.festivalOccurrence.findUnique({ where: { id: d.occasionId } });
    if (!occurrence) return { error: "Festival not found" };
    // Find-or-create the workspace calendar entry for this festival occurrence.
    const existing = await prisma.calendarEntry.findFirst({
      where: { workspaceId: auth.workspaceId, festivalOccurrenceId: occurrence.id },
    });
    calendarEntryId = (
      existing ??
      (await prisma.calendarEntry.create({
        data: {
          workspaceId: auth.workspaceId,
          brandId: brand.id,
          kind: "FESTIVAL",
          festivalOccurrenceId: occurrence.id,
        },
      }))
    ).id;
  }

  let aiModelId: string | null = null;
  if (d.productId) {
    const product = await prisma.product.findFirst({
      where: { id: d.productId, brandId: brand.id },
    });
    if (!product) return { error: "Product not found" };
    if (d.fidelityMode === "EXACT_PRODUCT" && product.dissectionStatus !== "READY") {
      return { error: "Product photos are still being analyzed — try again in a minute" };
    }
  } else if (d.fidelityMode === "EXACT_PRODUCT") {
    return { error: "Exact-product mode needs a product selected" };
  }

  // On-model: needs both a product (the garment) and a selected AI model.
  if (d.fidelityMode === "ON_MODEL") {
    if (!d.productId) return { error: "On-model mode needs a product (the garment) selected" };
    if (!d.aiModelId) return { error: "Pick an AI model for the on-model shoot" };
    // The fusion needs a garment reference photo — without one the task can
    // only hard-fail after credits were debited.
    const garmentPhotos = await prisma.productImage.count({ where: { productId: d.productId } });
    if (garmentPhotos === 0) return { error: "Add at least one photo of this garment before an on-model shoot" };
    const model = await prisma.aiModel.findFirst({
      where: {
        id: d.aiModelId,
        status: "READY",
        OR: [{ scope: "GLOBAL" }, { brand: { workspaceId: auth.workspaceId } }],
      },
    });
    if (!model || !model.storageKey) return { error: "AI model not found or not ready" };
    aiModelId = model.id;
  }

  // Direct mode = 1 render. Guided = N concepts (user-chosen, capped).
  // "Compare" renders every option on both premium models → double credits.
  // Bake-off renders each concept once per model variant but debits nothing —
  // API spend still lands in ApiCostLog.
  const conceptCount = directMode ? 1 : d.optionCount;
  const variantMultiplier = d.imageModel === "compare" ? 2 : 1;
  const cost = bakeoff ? 0 : CREDIT_COSTS.perConcept * conceptCount * variantMultiplier;

  // Branding mode applies to apparel on-model only; elsewhere always branded.
  // Per-run choice wins, else the brand's default.
  const brandingMode =
    d.fidelityMode === "ON_MODEL" ? (d.brandingMode || brand.apparelBrandingDefault) : "BRANDED";

  const run = await prisma.generationRun.create({
    data: {
      workspaceId: auth.workspaceId,
      brandId: brand.id,
      calendarEntryId,
      productId: d.productId || null,
      trigger: calendarEntryId && !d.customBrief ? "FESTIVAL" : "CUSTOM",
      customBrief: d.customBrief || null,
      directMode,
      bakeoff,
      imageModelPref: bakeoff ? null : d.imageModel,
      fidelityMode: d.fidelityMode,
      brandingMode,
      modelPose: d.fidelityMode === "ON_MODEL" ? (d.modelPose || null) : null,
      aiModelId,
      requestedAspects,
      language: d.language,
      conceptCount,
      status: "QUEUED",
    },
  });

  if (cost > 0) {
    try {
      await debitCredits({
        workspaceId: auth.workspaceId,
        amount: cost,
        reason: "GENERATION",
        generationRunId: run.id,
        note: `${conceptCount} creative ${conceptCount === 1 ? "option" : "options"}`,
      });
    } catch (e) {
      await prisma.generationRun.delete({ where: { id: run.id } });
      if (e instanceof InsufficientCreditsError) {
        return { error: `Not enough credits (need ${cost}, have ${e.balance})` };
      }
      throw e;
    }

    await prisma.generationRun.update({ where: { id: run.id }, data: { creditsDebited: cost } });
  }

  let handle;
  try {
    handle = await tasks.trigger<typeof generationRun>(
      "generation-run",
      { runId: run.id },
      { tags: [`run:${run.id}`, `ws:${auth.workspaceId}`] },
    );
  } catch (e) {
    // Enqueue failed (Trigger.dev down, misconfigured key, or tasks not
    // deployed). Refund and surface a real message instead of crashing the
    // action into the generic error page.
    console.error("[generate] failed to enqueue generation-run", e);
    // Mark FAILED BEFORE refunding: if the enqueue actually succeeded and only
    // the response timed out, a worker may pick the run up within milliseconds —
    // its ghost-enqueue guard reads this status, so the terminal write must
    // land first or the run executes after we've already refunded it.
    await prisma.generationRun.update({
      where: { id: run.id },
      data: { status: "FAILED", error: `Queue failed: ${(e as Error).message?.slice(0, 300)}` },
    });
    if (cost > 0) {
      await reconcileRunRefund({
        workspaceId: auth.workspaceId,
        generationRunId: run.id,
        owedRefund: cost,
        note: "Generation could not be queued — refunded",
      });
    }
    return { error: "Generation service is unavailable right now — your credits were not spent. Please try again shortly." };
  }
  await prisma.generationRun.update({
    where: { id: run.id },
    data: { triggerRunId: handle.id },
  });

  redirect(`/studio/${run.id}`);
}
