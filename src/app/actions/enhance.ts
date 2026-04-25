"use server";

import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CREDIT_COSTS } from "@/lib/ai/models";
import { debitCredits, grantCredits, InsufficientCreditsError } from "@/lib/credits";
import { enhancePromptText, type EnhanceMode } from "@/lib/pipeline/enhance-prompt";
import { CostTracker } from "@/lib/pipeline/cost";
import { persistCost } from "@/lib/pipeline/cost-log";

/**
 * Auto-enhance a rough prompt (custom brief or regenerate instruction) into an
 * art-directed, image-model-ready prompt. Costs CREDIT_COSTS.enhancePrompt
 * (0.25 credits); refunded automatically if the rewrite fails.
 */
export async function enhanceUserPrompt(input: {
  text: string;
  mode: EnhanceMode;
}): Promise<{ enhanced: string } | { error: string }> {
  const auth = await requireAuth();
  const text = input.text?.trim();
  if (!text || text.length < 8) return { error: "Write a few words first, then enhance." };
  if (text.length > 1500) return { error: "Prompt is too long to enhance (max 1500 chars)." };
  const mode: EnhanceMode = input.mode === "instruction" ? "instruction" : "scene";

  try {
    await debitCredits({
      workspaceId: auth.workspaceId,
      amount: CREDIT_COSTS.enhancePrompt,
      reason: "ENHANCE_PROMPT",
      note: mode === "scene" ? "Prompt enhancement" : "Instruction enhancement",
    });
  } catch (e) {
    if (e instanceof InsufficientCreditsError) return { error: "Not enough credits" };
    throw e;
  }

  try {
    const brand = await prisma.brand.findFirst({
      where: { workspaceId: auth.workspaceId },
      select: { name: true, oneLiner: true, primaryColorHex: true, accentColorsHex: true },
    });
    const brandContext = brand
      ? [
          brand.name,
          brand.oneLiner,
          brand.primaryColorHex ? `brand colours ${[brand.primaryColorHex, ...brand.accentColorsHex].join(", ")}` : "",
        ]
          .filter(Boolean)
          .join(" — ")
      : undefined;

    const tracker = new CostTracker();
    const enhanced = await enhancePromptText({ text, mode, brandContext, tracker });
    if (!enhanced || enhanced.length < 40) throw new Error("rewrite came back empty");
    await persistCost({ summary: tracker.summary(), source: "enhance", workspaceId: auth.workspaceId });
    return { enhanced };
  } catch (e) {
    await grantCredits({
      workspaceId: auth.workspaceId,
      amount: CREDIT_COSTS.enhancePrompt,
      reason: "REFUND",
      note: "Prompt enhancement failed — refunded",
    });
    return { error: `Enhancement failed: ${(e as Error).message?.slice(0, 160)}` };
  }
}
