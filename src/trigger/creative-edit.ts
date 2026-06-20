import { task, metadata, logger } from "@trigger.dev/sdk";
import { CREDIT_COSTS } from "@/lib/ai/models";
import { grantCredits } from "@/lib/credits";
import {
  applyBakedTextSwap,
  applyRegenInstruction,
  applyRenderAspect,
  loadOwnedCreative,
} from "@/lib/editor/paid-edits";
import type { CopyLanguage } from "@/lib/composition/types";
import type { SceneAspect } from "@/lib/image/provider";

export type CreativeEditPayload =
  | { kind: "regen_instruction"; creativeId: string; workspaceId: string; instruction: string }
  | {
      kind: "baked_text";
      creativeId: string;
      workspaceId: string;
      headline: string;
      cta: string | null;
      language: CopyLanguage;
      cause: "text_edit" | "language_switch";
    }
  // FREE recomposite of an extra aspect — no credits debited, never refunded.
  | { kind: "render_aspect"; creativeId: string; workspaceId: string; aspect: SceneAspect };

/**
 * Paid editor edits (scene regen, baked-text swap) run 20-40s+ of image-model
 * calls — too long for a serverless server action. The action debits credits
 * and triggers this task; the editor watches it via useRealtimeRun. The
 * apply* functions handle their own refunds on QA-failure/error and never
 * throw, so `run` completing with {error} is a HANDLED failure (already
 * refunded), while catchError covers crashes before the edit logic ran.
 */
export const creativeEdit = task({
  id: "creative-edit",
  maxDuration: 300,
  retry: { maxAttempts: 1 }, // a retry would re-spend the image call after a refund
  run: async (payload: CreativeEditPayload) => {
    metadata.set("status", "editing");
    const creative = await loadOwnedCreative(payload.creativeId, payload.workspaceId);

    const result =
      payload.kind === "regen_instruction"
        ? await applyRegenInstruction(creative, payload.workspaceId, payload.instruction)
        : payload.kind === "render_aspect"
          ? await applyRenderAspect(creative, payload.aspect)
          : await applyBakedTextSwap(
            creative,
            payload.workspaceId,
            { headline: payload.headline, cta: payload.cta, language: payload.language },
            { type: payload.cause, language: payload.language, baked: true },
          );

    if ("error" in result) {
      logger.warn("creative edit failed (refunded)", { creativeId: payload.creativeId, error: result.error });
      metadata.set("status", "failed");
      metadata.set("error", result.error);
    } else {
      metadata.set("status", "done");
    }
    return result;
  },
  catchError: async ({ payload, error }) => {
    // apply* never throw — reaching here means we crashed before the edit ran
    // (e.g. creative lookup), so the action's debit must be returned.
    logger.error("creative edit crashed", { creativeId: payload.creativeId, error: (error as Error).message });
    if (payload.kind === "render_aspect") return; // free edit — nothing was debited
    await grantCredits({
      workspaceId: payload.workspaceId,
      amount: CREDIT_COSTS.regenInstruction,
      reason: "REFUND",
      note: "Creative edit crashed — refunded",
    });
  },
});
