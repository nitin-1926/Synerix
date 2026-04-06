import { z } from "zod";

/**
 * Product intelligence — cached per-SKU marketing/usage brief derived once at
 * product setup. Drives PRODUCT-FIRST concepting so scenes are domain-correct
 * (poori atta → deep-fried puffed pooris, NOT tawa rotis; NOT atta-on-rangoli).
 */
export const productIntelSchema = z.object({
  category: z.string().describe("Concrete product category, e.g. 'wheat flour blend for deep-fried pooris'"),
  preparation: z.string().describe("How it's prepared/used, e.g. 'kneaded into dough, rolled, deep-fried in hot oil until puffed'"),
  finishedForm: z.string().describe("What the finished item looks like, e.g. 'golden, round, puffed pooris'"),
  servingContext: z.array(z.string()).describe("How/with what it's served or used, e.g. ['with chole','with aloo sabzi','festive breakfast']"),
  occasions: z.array(z.string()).describe("Occasions where it shines, e.g. ['Diwali breakfast','pujan prasad','guests visiting']"),
  targetEmotions: z.array(z.string()).describe("Purchase emotions, e.g. ['family warmth','tradition','effortless festive cooking']"),
  sceneDo: z.array(z.string()).describe("Concrete things scenes SHOULD show, e.g. ['puffed pooris','kadhai with hot oil','family meal']"),
  sceneDont: z.array(z.string()).describe("Things scenes MUST NOT show, e.g. ['tawa/roti','raw flour piles as hero','rangoli as the hero subject']"),
});

export type ProductIntel = z.infer<typeof productIntelSchema>;

/** Compact, prompt-ready summary of intel for concepting + image prompts. */
export function intelToPromptBlock(intel: ProductIntel): string {
  return [
    `Category: ${intel.category}`,
    `Preparation: ${intel.preparation}`,
    `Finished form: ${intel.finishedForm}`,
    `Serve/use with: ${intel.servingContext.join(", ")}`,
    `Best occasions: ${intel.occasions.join(", ")}`,
    `Target emotions: ${intel.targetEmotions.join(", ")}`,
    `SCENE MUST SHOW (where relevant): ${intel.sceneDo.join("; ")}`,
    `SCENE MUST NOT SHOW: ${intel.sceneDont.join("; ")}`,
  ].join("\n");
}
