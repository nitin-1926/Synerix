import { generateText } from "ai";
import { MODELS, resolveLanguageModel } from "@/lib/ai/models";
import type { CostTracker } from "./cost";

/**
 * Prompt enhancer (floki enhance-image-prompt essence, adapted for Synerix
 * Studio): turns a user's rough idea or edit instruction into an
 * art-directed, image-model-ready prompt. Charged at CREDIT_COSTS.enhancePrompt
 * (0.25) by the calling action.
 */

const SCENE_SYSTEM = `You are a senior art director who writes prompts for a photoreal image model (advertising key visuals for Indian small businesses). Rewrite the user's rough idea into ONE production-ready scene prompt.

The rewritten prompt must:
1. Keep the user's intent, subject and every FACT exactly (products, occasions, offers, numbers — quote offers verbatim, never invent or extend one).
2. Make the scene concrete and shootable: subject and action, environment, talent (authentic Indian people where relevant — varied ages/skin tones, natural skin, correct hands), lens/framing, lighting (quality + direction), composition, mood, palette.
3. Set a premium editorial bar: photoreal commercial advertising photography, sharp focus, uncluttered composition, no AI artifacts. Aspirational Indian realism, like a Tanishq or Cadbury film — never caricature or poverty clichés.
4. Reserve one zone of clean, calm negative space for a headline overlay and say which zone.
5. Stay WORDLESS: state that the scene contains no text, lettering, numbers, signage or logos beyond what is genuinely printed on the real product's packaging.
6. If the user mentions their product, direct that the attached reference photo is the EXACT product, reproduced faithfully and shown once.
7. Be 400-900 characters of flowing prose (no headings, no lists, no quotes around it).
8. Never use em or en dashes.

Return ONLY the rewritten prompt, nothing else.`;

const INSTRUCTION_SYSTEM = `You are a senior retoucher's assistant. Rewrite the user's rough edit instruction for an existing advertising photograph into ONE precise, unambiguous image-edit instruction.

The rewritten instruction must:
1. Keep the user's intent and every fact exactly; never invent offers, text or claims.
2. Say precisely WHAT changes and — just as important — that everything else stays identical (same product, people, composition, lighting, palette).
3. Be concrete about the change: placement, size, direction, material, light interaction.
4. Be 1-3 sentences. No headings, no lists. Never use em or en dashes.

Return ONLY the rewritten instruction, nothing else.`;

export type EnhanceMode = "scene" | "instruction";

export async function enhancePromptText(opts: {
  text: string;
  mode: EnhanceMode;
  brandContext?: string;
  tracker?: CostTracker;
}): Promise<string> {
  const { text, usage } = await generateText({
    model: resolveLanguageModel(MODELS.concepts), // strongest slot — see MODELS.concepts
    system: opts.mode === "scene" ? SCENE_SYSTEM : INSTRUCTION_SYSTEM,
    prompt: `${opts.brandContext ? `Brand context: ${opts.brandContext}\n\n` : ""}Rough ${opts.mode === "scene" ? "idea" : "edit instruction"}:\n${opts.text.trim()}`,
  });
  opts.tracker?.addLLM(MODELS.concepts, usage, "enhance-prompt");
  // Hard guarantee on the dash ban, mirroring the concepting sanitizer.
  return text.trim().replace(/\s*[—–]\s*/g, ", ").replace(/,\s*,/g, ", ");
}
