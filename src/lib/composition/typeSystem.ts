import { DISPLAY } from "./fonts";

/**
 * Curated type pairings — the headline display face + supporting body face that
 * make a layout read as "designed" rather than "Inter everywhere". A template
 * picks a pairing (or one is inferred from the brand's typography style); the
 * archetype/template then maps copy roles onto these families.
 *
 * Indic languages (hi/pa) keep their shaping-correct stacks in the renderer;
 * the pairing's weight/uppercase/tracking still apply.
 */

export interface RoleType {
  /** Latin font stack (display for headline, body for the rest). */
  family: string;
  fontWeight: number;
  uppercase?: boolean;
  letterSpacingPx?: number;
  fontStyle?: "normal" | "italic";
}

export interface TypePairing {
  id: string;
  /** Human label for debugging / UI. */
  label: string;
  headline: RoleType;
  eyebrow: RoleType;
  subhead: RoleType;
  cta: RoleType;
  /** Mood keywords used by the heuristic matcher. */
  moods: string[];
}

const BODY: RoleType = { family: DISPLAY.inter, fontWeight: 400 };
const BODY_MED: RoleType = { family: DISPLAY.inter, fontWeight: 700 };
const EYEBROW_CAPS: RoleType = { family: DISPLAY.inter, fontWeight: 700, uppercase: true, letterSpacingPx: 3 };
const CTA_TYPE: RoleType = { family: DISPLAY.inter, fontWeight: 700, uppercase: true, letterSpacingPx: 1 };

export const TYPE_PAIRINGS: Record<string, TypePairing> = {
  "editorial-serif": {
    id: "editorial-serif",
    label: "Editorial serif (premium, heartfelt)",
    headline: { family: DISPLAY.dmSerif, fontWeight: 400 },
    eyebrow: EYEBROW_CAPS,
    subhead: BODY,
    cta: CTA_TYPE,
    moods: ["premium", "elegant", "heartfelt", "festive", "luxury", "traditional", "wedding", "serif"],
  },
  "bold-impact": {
    id: "bold-impact",
    label: "Bold impact (offers, loud)",
    headline: { family: DISPLAY.anton, fontWeight: 400, uppercase: true, letterSpacingPx: 0.5 },
    eyebrow: EYEBROW_CAPS,
    subhead: BODY_MED,
    cta: CTA_TYPE,
    moods: ["bold", "sale", "offer", "discount", "loud", "energetic", "value", "deal", "impact"],
  },
  "modern-grotesque": {
    id: "modern-grotesque",
    label: "Modern grotesque (urban, confident)",
    headline: { family: DISPLAY.archivoBlack, fontWeight: 400 },
    eyebrow: EYEBROW_CAPS,
    subhead: BODY,
    cta: CTA_TYPE,
    moods: ["modern", "urban", "confident", "tech", "startup", "minimal-bold", "grotesque"],
  },
  "tall-minimal": {
    id: "tall-minimal",
    label: "Tall condensed (fashion, minimal)",
    headline: { family: DISPLAY.bebas, fontWeight: 400, uppercase: true, letterSpacingPx: 1 },
    eyebrow: EYEBROW_CAPS,
    subhead: BODY,
    cta: CTA_TYPE,
    moods: ["fashion", "minimal", "clean", "apparel", "lifestyle", "chic", "condensed"],
  },
  "clean-sans": {
    id: "clean-sans",
    label: "Clean sans (safe default)",
    headline: { family: DISPLAY.inter, fontWeight: 700 },
    eyebrow: EYEBROW_CAPS,
    subhead: BODY,
    cta: CTA_TYPE,
    moods: ["neutral", "default", "corporate", "sans"],
  },
};

export const DEFAULT_PAIRING = "editorial-serif";

/**
 * Heuristic pairing selection from brand/occasion signals. Deterministic; falls
 * back to a tasteful editorial default rather than plain sans.
 */
export function pickTypePairing(signals: {
  typographyStyle?: string | null;
  occasion?: string | null;
  productCategory?: string | null;
}): TypePairing {
  const hay = [signals.typographyStyle, signals.occasion, signals.productCategory]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (hay) {
    let best: { id: string; score: number } | null = null;
    for (const p of Object.values(TYPE_PAIRINGS)) {
      const score = p.moods.reduce((n, m) => (hay.includes(m) ? n + 1 : n), 0);
      if (score > 0 && (!best || score > best.score)) best = { id: p.id, score };
    }
    if (best) return TYPE_PAIRINGS[best.id];
  }
  // Apparel/fashion → tall-minimal; otherwise editorial default.
  if (signals.productCategory?.toUpperCase() === "APPAREL") return TYPE_PAIRINGS["tall-minimal"];
  return TYPE_PAIRINGS[DEFAULT_PAIRING];
}
