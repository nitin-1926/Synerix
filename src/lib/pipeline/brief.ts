import type { Brand, Festival, FestivalOccurrence, Product } from "@/generated/prisma/client";
import type { BrandDna } from "@/lib/schemas/brand-dna";
import { intelToPromptBlock, type ProductIntel } from "@/lib/products/intelligence";

/**
 * Occasion brief — deterministic assembler (no LLM). Merges brand DNA +
 * product + festival creative context OR a custom user brief into the
 * single text block the concept generator consumes.
 */

interface FestivalCreativeContext {
  imageryMotifs?: string[];
  colorMotifs?: string[];
  emotionalThemes?: string[];
  greetingPhrases?: { en?: string; hi?: string; hinglish?: string };
}

export function assembleOccasionBrief(opts: {
  brand: Brand;
  product: Product | null;
  festival?: (FestivalOccurrence & { festival: Festival }) | null;
  customBrief?: string | null;
  customTitle?: string | null;
}): string {
  const { brand, product, festival, customBrief, customTitle } = opts;
  const dna = brand.dna as BrandDna | null;
  const parts: string[] = [];

  parts.push(`## Brand
Name: ${brand.name}
${brand.oneLiner ? `About: ${brand.oneLiner}` : ""}
${dna?.identity.category ? `Category: ${dna.identity.category}` : ""}
${dna?.identity.city ? `City: ${dna.identity.city}` : ""}
${brand.mottoText ? `Motto (composited verbatim on the ad, do not rewrite): ${brand.mottoText}` : ""}
Colors: primary ${brand.primaryColorHex ?? "unset"}, accents ${[...brand.secondaryColorsHex, ...brand.accentColorsHex].join(", ") || "unset"}
${dna?.voice.register ? `Voice: ${dna.voice.register.replaceAll("_", " ")}` : ""}
${dna?.voice.signature_phrases.length ? `Signature phrases: ${dna.voice.signature_phrases.slice(0, 4).join(" | ")}` : ""}
${dna?.positioning.price_band && dna.positioning.price_band !== "unknown" ? `Price band: ${dna.positioning.price_band}` : ""}
${dna?.audience.target_customer ? `Audience: ${dna.audience.target_customer}` : ""}`);

  if (product) {
    const intel = product.productIntel as ProductIntel | null;
    const isApparel = product.category === "APPAREL";
    parts.push(`## Featured product
Name: ${product.name}
Category: ${product.category}
${product.description ? `Description: ${product.description}` : ""}
${product.dissectionPrompt ? `Exact appearance (preserve in scene): ${product.dissectionPrompt}` : ""}
${isApparel ? `\n### Apparel direction (on-model)\nThis is a clothing/apparel item. Concepts should show it WORN by a person, styled aspirationally for the occasion. Describe the model's pose, setting, and styling — never the garment's print as a flat hero. Preserve the garment's exact colour, pattern, and cut as provided.` : ""}
${intel && !isApparel ? `\n### Product intelligence (use this to keep scenes correct)\n${intelToPromptBlock(intel)}` : ""}`);
  }

  if (festival) {
    const ctx = (festival.festival.creativeContext ?? {}) as FestivalCreativeContext;
    parts.push(`## Occasion: ${festival.festival.name}${festival.festival.nameHindi ? ` (${festival.festival.nameHindi})` : ""}
Date: ${festival.date.toISOString().slice(0, 10)}
Imagery motifs: ${ctx.imageryMotifs?.join(", ") ?? "—"}
Color motifs: ${ctx.colorMotifs?.join(", ") ?? "—"}
Emotional themes: ${ctx.emotionalThemes?.join(", ") ?? "—"}
${ctx.greetingPhrases?.hi ? `Hindi greeting: ${ctx.greetingPhrases.hi}` : ""}
${ctx.greetingPhrases?.hinglish ? `Hinglish greeting: ${ctx.greetingPhrases.hinglish}` : ""}`);
  }

  if (customTitle || customBrief) {
    parts.push(`## Custom occasion${customTitle ? `: ${customTitle}` : ""}
${customBrief ?? ""}`);
  }

  return parts
    .map((p) => p.split("\n").filter((l) => l.trim() !== "").join("\n"))
    .join("\n\n");
}
