import type { Archetype } from "./archetypes";
import type { DeviceStyle } from "./devices";
import type { OverlaySpec } from "./types";

/**
 * A template is a designed PRESET — a named combination of base layout +
 * type pairing + graphic-device style + plate treatment, plus the situations
 * it suits. The compositor renders several suitable templates per concept as
 * variants and keeps the best-scoring one. Because compositing is AI-free, this
 * variety is essentially free.
 */
export interface Template {
  id: string;
  label: string;
  archetype: Archetype;
  typePairingId: string;
  deviceStyle: DeviceStyle;
  plateTreatment?: OverlaySpec["plateTreatment"];
  suit: {
    /** Restrict to these aspects (omit = any). */
    aspects?: string[];
    /** Restrict to these product placements (omit = any). */
    productPlacement?: Array<"product_hero" | "lifestyle">;
    /** Mood keywords matched against occasion/typography signals. */
    moods?: string[];
    /** Skip when the plate busyness exceeds this (e.g. framed looks need calm). */
    maxBusyness?: number;
  };
}

export const TEMPLATES: Template[] = [
  // ---- Editorial / premium ----
  { id: "editorial-bottom", label: "Editorial serif, bottom", archetype: "headline_bottom", typePairingId: "editorial-serif", deviceStyle: "bars", suit: { moods: ["premium", "heartfelt", "festive", "wedding"] } },
  { id: "editorial-framed", label: "Editorial serif, framed", archetype: "framed_card", typePairingId: "editorial-serif", deviceStyle: "frame", suit: { moods: ["premium", "elegant", "wedding"], maxBusyness: 0.55 } },
  { id: "editorial-top", label: "Editorial serif, top", archetype: "big_type_top", typePairingId: "editorial-serif", deviceStyle: "side", suit: { moods: ["premium", "heartfelt"] } },
  { id: "editorial-duotone", label: "Editorial serif, duotone", archetype: "headline_bottom", typePairingId: "editorial-serif", deviceStyle: "side", plateTreatment: { kind: "duotone", to: "#23304d" }, suit: { moods: ["premium", "moody", "luxury"] } },

  // ---- Bold / sale / impact ----
  { id: "impact-top", label: "Bold impact, top", archetype: "big_type_top", typePairingId: "bold-impact", deviceStyle: "side", suit: { moods: ["sale", "offer", "bold", "deal"] } },
  { id: "impact-block", label: "Bold impact, block", archetype: "headline_bottom", typePairingId: "bold-impact", deviceStyle: "block", suit: { moods: ["sale", "offer", "loud"] } },
  { id: "impact-badge", label: "Bold impact, offer badge", archetype: "badge_offer", typePairingId: "bold-impact", deviceStyle: "minimal", suit: { moods: ["sale", "offer", "discount", "deal"] } },
  { id: "impact-darken", label: "Bold impact, darkened", archetype: "big_type_top", typePairingId: "bold-impact", deviceStyle: "bars", plateTreatment: { kind: "darken", amount: 0.22 }, suit: { moods: ["bold", "energetic"] } },

  // ---- Modern grotesque ----
  { id: "modern-bottom", label: "Modern grotesque, bottom", archetype: "headline_bottom", typePairingId: "modern-grotesque", deviceStyle: "bars", suit: { moods: ["modern", "urban", "tech", "confident"] } },
  { id: "modern-top", label: "Modern grotesque, top", archetype: "big_type_top", typePairingId: "modern-grotesque", deviceStyle: "side", suit: { moods: ["modern", "urban", "startup"] } },
  { id: "modern-block", label: "Modern grotesque, block", archetype: "headline_bottom", typePairingId: "modern-grotesque", deviceStyle: "block", suit: { moods: ["modern", "bold-minimal"] } },

  // ---- Tall / fashion / minimal ----
  { id: "fashion-top", label: "Tall minimal, top", archetype: "big_type_top", typePairingId: "tall-minimal", deviceStyle: "minimal", suit: { productPlacement: ["lifestyle"], moods: ["fashion", "minimal", "apparel", "chic"] } },
  { id: "fashion-framed", label: "Tall minimal, framed", archetype: "framed_card", typePairingId: "tall-minimal", deviceStyle: "frame", suit: { moods: ["fashion", "minimal", "chic"], maxBusyness: 0.5 } },
  { id: "fashion-bottom", label: "Tall minimal, bottom", archetype: "headline_bottom", typePairingId: "tall-minimal", deviceStyle: "side", suit: { moods: ["fashion", "lifestyle", "clean"] } },

  // ---- Clean / safe defaults ----
  { id: "clean-bottom", label: "Clean sans, bottom", archetype: "headline_bottom", typePairingId: "clean-sans", deviceStyle: "bars", suit: {} },
  { id: "clean-framed", label: "Clean sans, framed", archetype: "framed_card", typePairingId: "clean-sans", deviceStyle: "frame", suit: { maxBusyness: 0.55 } },
];

export interface TemplateConstraints {
  aspect: string;
  productPlacement?: "product_hero" | "lifestyle" | null;
  /** Occasion + typography signals, lowercased, for mood matching. */
  signals?: string;
  busyness?: number;
  /** Calm band of the plate; templates whose layout matches the band score higher. */
  safeBand?: "top" | "center" | "bottom";
  /** Zone the concept's typographySpec reserved in the plate (parsed hint). */
  zoneHint?: "top" | "bottom" | null;
  /** Brand's preferred type pairing (from the BrandKit) — a consistency anchor. */
  preferPairing?: string;
}

const BAND_ARCHETYPE: Record<string, string> = { top: "big_type_top", bottom: "headline_bottom" };

/** Score a template against the constraints (higher = better fit). */
function scoreTemplate(t: Template, c: TemplateConstraints): number {
  let score = 1;
  if (t.suit.aspects && !t.suit.aspects.includes(c.aspect)) return -1;
  if (t.suit.productPlacement && c.productPlacement && !t.suit.productPlacement.includes(c.productPlacement)) return -1;
  if (typeof t.suit.maxBusyness === "number" && typeof c.busyness === "number" && c.busyness > t.suit.maxBusyness) return -1;
  if (t.suit.moods && c.signals) {
    const hits = t.suit.moods.filter((m) => c.signals!.includes(m)).length;
    score += hits * 2;
  }
  // Prefer templates whose layout sits the headline in the calm band.
  if (c.safeBand && BAND_ARCHETYPE[c.safeBand] === t.archetype) score += 1.5;
  // The concept reserved negative space in a specific zone of the plate —
  // templates that put the copy there use the space the image actually left.
  if (c.zoneHint && BAND_ARCHETYPE[c.zoneHint] === t.archetype) score += 1;
  // Brand-consistency anchor: nudge toward the brand's preferred pairing, but
  // only as a soft bonus so a strong occasion mood can still win.
  if (c.preferPairing && t.typePairingId === c.preferPairing) score += 1;
  return score;
}

/**
 * Select up to `n` distinct, suitable templates for a concept — the variant set.
 * Always returns at least one (the clean default) so a render never fails.
 */
export function selectTemplates(c: TemplateConstraints, n = 3): Template[] {
  const ranked = TEMPLATES.map((t) => ({ t, s: scoreTemplate(t, c) }))
    .filter((x) => x.s >= 0)
    .sort((a, b) => b.s - a.s);
  const picked = ranked.slice(0, n).map((x) => x.t);
  if (!picked.length) picked.push(TEMPLATES.find((t) => t.id === "clean-bottom")!);
  return picked;
}
