import { generateObject, generateText } from "ai";
import { LIMITS, MODELS, resolveLanguageModel } from "@/lib/ai/models";
import { CostTracker, type CostSummary } from "@/lib/pipeline/cost";
import { productIntelSchema, type ProductIntel } from "./intelligence";

/**
 * Product dissection (labs-moodboard two-stage pattern), now with a third
 * PRODUCT-INTELLIGENCE pass that captures usage/marketing facts for
 * product-first concepting.
 *
 * 1. Full vision analysis of the product photo (visual fidelity).
 * 2. Compressed <=400-char scene-replication prefix (cached, prepended to image prompts).
 * 3. Product intelligence (category, preparation, finished form, DO/DON'T) — drives concepting.
 */

export async function dissectProduct(
  image: Buffer,
  mime: string,
  productName: string,
  productDescription?: string | null,
): Promise<{ full: string; prompt: string; intel: ProductIntel; cost: CostSummary }> {
  const model = resolveLanguageModel(MODELS.dissect);
  const tracker = new CostTracker();

  // 1. Visual analysis
  const { text: full, usage: usage1 } = await generateText({
    model,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", image, mediaType: mime as `image/${string}` },
          {
            type: "text",
            text: `Analyze this product photo ("${productName}") for exact visual replication in generated scenes. Describe exhaustively: overall shape and proportions, every color (precise names), materials and finish, patterns/textures, label or packaging elements (position and look — do NOT invent text content), distinctive identifying features, and how light interacts with the surfaces. Plain prose, no headers.`,
          },
        ],
      },
    ],
  });
  tracker.addLLM(MODELS.dissect, usage1, "dissect-analyze");

  // 2. Compressed scene-replication prefix.
  // Ordered by IMPORTANCE, not top-to-bottom: the compressor overshoots the
  // budget and the trim below removes the tail, and a top-down description's
  // tail is always the hem, back and side detail — exactly what an apparel
  // buyer inspects and what garment-fidelity QA is asked to check.
  const { text: prompt, usage: u2 } = await generateText({
    model,
    prompt: `Compress this product analysis into a scene-replication prompt prefix of AT MOST ${LIMITS.dissectionPromptMaxChars} characters. Order by importance: dominant colour and material first, then overall shape/cut/silhouette (for clothing: neckline, sleeve length and where the hem falls), then the single most distinctive embellishment or label feature, then any remaining detail. Describe ONLY the product itself — never the hanger, mannequin, stand, hang tag, size sticker, background or neighbouring items it was photographed with. Drop lighting commentary and filler. Single paragraph, no preamble, no quotes.\n\n${full}`,
  });
  tracker.addLLM(MODELS.dissect, u2, "dissect-summarize");

  // 3. Product intelligence (usage/marketing facts)
  const { object: intel, usage: u3 } = await generateObject({
    model,
    schema: productIntelSchema,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", image, mediaType: mime as `image/${string}` },
          {
            type: "text",
            text: `You are an Indian FMCG marketing strategist. From this product photo and details, infer how the product is actually used so an ad designer never shows it wrong.
Product name: ${productName}
${productDescription ? `Details: ${productDescription}` : ""}

Be specific and correct about Indian usage. Example for poori atta: it is DEEP-FRIED into puffed golden pooris (in a kadhai of hot oil), served with chole/aloo — it is NOT cooked flat on a tawa like rotis. Fill every field concretely. sceneDo = what an ad scene should depict; sceneDont = depictions that would be wrong or off (wrong cooking method, raw piles of product as hero, generic festive props used as the hero instead of the product/food).`,
          },
        ],
      },
    ],
  });
  tracker.addLLM(MODELS.dissect, u3, "dissect-intel");

  return {
    full,
    prompt: trimToSentence(prompt.trim(), LIMITS.dissectionPromptMaxChars),
    intel,
    cost: tracker.summary(),
  };
}

/**
 * Trim to the budget on a SENTENCE boundary. Every dissection in production was
 * a blunt `.slice(400)` that cut mid-word ("...White sticker on hanger. Left: b"),
 * and that fragment is injected verbatim into the garment-fidelity and
 * product-reference instructions as the definition of "exact appearance".
 */
export function trimToSentence(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const stop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("; "), cut.lastIndexOf(", "));
  if (stop > max * 0.5) return cut.slice(0, stop + 1).trim();
  const space = cut.lastIndexOf(" ");
  return (space > 0 ? cut.slice(0, space) : cut).trim();
}
