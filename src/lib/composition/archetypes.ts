import type { CopyLanguage, OverlaySpec, TextByLang, TextLayer } from "./types";
import { ASPECT_DIMENSIONS } from "./types";
import { DEVANAGARI_STACK, LATIN_STACK } from "./fonts";
import { contrastText, isHexDark } from "./text";
import { makePalette } from "./color";
import { pickTypePairing, TYPE_PAIRINGS, type RoleType, type TypePairing } from "./typeSystem";
import { buildDevices, type DeviceStyle } from "./devices";

/**
 * Archetype layout functions: concept + brand → OverlaySpec.
 * Ports the spirit of floki's archetypes.tsx as data-producing functions
 * (the canvas renderer in render.ts consumes the spec).
 */

export const ARCHETYPES = ["headline_bottom", "big_type_top", "framed_card", "badge_offer"] as const;
export type Archetype = (typeof ARCHETYPES)[number];

export interface ArchetypeInput {
  archetype: Archetype | string;
  aspectRatio: string;
  language: CopyLanguage;
  copy: {
    eyebrow?: TextByLang | null;
    headline: TextByLang;
    subhead?: TextByLang | null;
    cta?: TextByLang | null;
  };
  motto?: string | null;
  /** Brand Block: fixed contact line ("For business queries: …"). Brand-locked,
   * never AI copy. Rendered only when showContact is true (opt-in per creative). */
  contactLine?: string | null;
  showContact?: boolean;
  brand: {
    primaryColorHex: string;
    accentColorHex?: string | null;
  };
  logoAssetRef?: string | null;
  /** Logo placement (default top-left) + size multiplier (default 1). */
  logoPosition?: LogoPosition;
  logoScale?: number;
  // ---- v2 design-system signals (optional; omitted → tasteful defaults) ----
  /** Brand typography style (from brand.dna.visual_identity) → type pairing. */
  typographyStyle?: string | null;
  occasion?: string | null;
  productCategory?: string | null;
  /** Force a specific type pairing id (overrides the heuristic). */
  typePairingId?: string;
  /** Image-extracted dominant colours (drive the palette roles). */
  dominantColors?: string[];
  /** Content-aware analysis of the plate (calm band + busyness) for scrim strength. */
  placement?: {
    safeBand?: "top" | "center" | "bottom";
    busyness?: number;
    /** Calm y-range (fractions of height) the copy block can anchor into. */
    calmBand?: { y0: number; y1: number; meanLum: number };
  };
  /** Template overrides: force the graphic-device style and/or a plate treatment. */
  deviceStyle?: DeviceStyle;
  plateTreatment?: OverlaySpec["plateTreatment"];
}

export type LogoPosition = "TL" | "TR" | "TC" | "BL" | "BR";

/** Shared logo-box geometry — used at generation time and by the editor. */
export function computeLogoBox(
  assetRef: string,
  dims: { width: number; height: number },
  position: LogoPosition,
  scale: number,
): NonNullable<OverlaySpec["logo"]> {
  const { width: W, height: H } = dims;
  const pad = Math.round(W * 0.067);
  const boxW = Math.round(W * 0.22 * scale);
  const boxH = Math.round(W * 0.085 * scale);
  const left = position === "TR" || position === "BR" ? W - pad - boxW : position === "TC" ? Math.round((W - boxW) / 2) : pad;
  const top = position === "BL" || position === "BR" ? H - pad - boxH : pad;
  return { assetRef, x: left, y: top, w: boxW, h: boxH, opacity: 1 };
}

function baseLayer(
  role: TextLayer["role"],
  textByLang: TextByLang,
  overrides: Partial<TextLayer>,
): TextLayer {
  return {
    role,
    textByLang,
    fontFamily: LATIN_STACK,
    fontFamilyHi: DEVANAGARI_STACK,
    fontWeight: 700,
    fontSizePx: 64,
    minFontSizePx: 24,
    lineHeight: 1.3,
    color: "#ffffff",
    align: "left",
    x: 0,
    y: 0,
    w: 100,
    h: 100,
    ...overrides,
  };
}

const sameText = (s: string): TextByLang => ({ en: s, hinglish: s, hi: s, pa: s });

/** Brand Block contact line layer — shared by the generator and the editor
 * toggle so geometry stays identical. Small, bottom-left, very bottom edge. */
export function contactLayer(text: string, dims: { width: number; height: number }): TextLayer {
  const { width: W, height: H } = dims;
  const pad = Math.round(W * 0.067);
  return baseLayer("contact", sameText(text.trim()), {
    fontWeight: 400, fontSizePx: Math.round(W * 0.018), minFontSizePx: 12,
    color: "rgba(255,255,255,0.9)", align: "left",
    x: pad, y: H - Math.round(pad * 0.72), w: W / 2, h: Math.round(W * 0.03),
  });
}

/**
 * Vertical cover-crop anchor from the plate's calm-band label. Single source of
 * truth so every render path (generation, layout remix, add-aspect, plain) and
 * the contrast sampler agree. safeBand names where the EMPTY/calm band is, so
 * the subject is opposite: band "bottom" → subject high → keep the top (0.35);
 * band "top" → subject low → keep the bottom (0.65); otherwise centre (0.5).
 */
export function plateFocusYFor(safeBand?: "top" | "center" | "bottom"): number {
  return safeBand === "bottom" ? 0.35 : safeBand === "top" ? 0.65 : 0.5;
}

export function buildOverlaySpec(input: ArchetypeInput): OverlaySpec {
  const dims = ASPECT_DIMENSIONS[input.aspectRatio] ?? ASPECT_DIMENSIONS["4:5"];
  const { width: W, height: H } = dims;
  const pad = Math.round(W * 0.067); // ~72px at 1080
  const primary = input.brand.primaryColorHex || "#b83b5e";
  const accent = input.brand.accentColorHex || primary;
  const ctaText = contrastText(accent);
  // v2 design system: resolved colour palette + a type pairing chosen from brand
  // signals (or forced via typePairingId).
  const palette = makePalette({ primaryHex: primary, accentHex: accent, dominant: input.dominantColors });
  const pairing =
    (input.typePairingId && TYPE_PAIRINGS[input.typePairingId]) ||
    pickTypePairing({ typographyStyle: input.typographyStyle, occasion: input.occasion, productCategory: input.productCategory });
  const layers: TextLayer[] = [];
  const spec: OverlaySpec = {
    version: 2,
    archetype: input.archetype,
    canvas: dims,
    plateFit: "cover",
    scrims: [],
    textLayers: layers,
    language: input.language,
    palette,
    theme: { typePairing: pairing.id },
    shapeLayers: [],
  };
  // Anchor the cover-crop toward the subject (away from the reserved calm band)
  // so an off-ratio plate isn't cropped through the subject's head/feet. Set
  // only when it differs from centre, keeping legacy specs unchanged.
  const focusY = plateFocusYFor(input.placement?.safeBand);
  if (focusY !== 0.5) spec.plateFocusY = focusY;

  const story = input.aspectRatio === "9:16";
  // Channel-safe zones (floki playbook): 9:16 keeps top 280 / bottom 380 clear-ish.
  // Reserve a top band for the logo so top-anchored content never collides.
  const topLogoBand =
    input.logoAssetRef && (input.logoPosition ?? "TL").startsWith("T")
      ? Math.round(W * 0.085 * (input.logoScale ?? 1)) + Math.round(W * 0.03)
      : 0;
  const safeTop = (story ? 300 : pad) + topLogoBand;
  let safeBottom = story ? 400 : pad;
  // When the plate's own bottom region is calm (the image reserved negative
  // space there), anchor the copy INTO it instead of pushing the block up into
  // the busy middle. 160px still keeps the motto/contact edge clear.
  const calm = input.placement?.calmBand;
  if (story && calm && calm.y1 >= 0.95 && calm.y0 <= 0.72) {
    safeBottom = 160;
  }

  switch (input.archetype) {
    case "big_type_top": {
      spec.scrims.push({ direction: "top-down", color: "0,0,0", maxOpacity: 0.55, coverage: 0.45 });
      // Anchor the bottom CTA so it reads as a grounded footer, not a pill
      // floating in the empty middle of a tall (9:16) frame.
      spec.scrims.push({ direction: "bottom-up", color: "0,0,0", maxOpacity: 0.42, coverage: 0.26 });
      let y = safeTop;
      if (input.copy.eyebrow) {
        layers.push(
          baseLayer("eyebrow", input.copy.eyebrow, {
            fontWeight: 700, fontSizePx: Math.round(W * 0.026), minFontSizePx: 18,
            color: "#ffffff", uppercase: true, letterSpacingPx: 3,
            x: pad, y, w: W - pad * 2, h: Math.round(W * 0.045),
          }),
        );
        y += Math.round(W * 0.055);
      }
      layers.push(
        baseLayer("headline", input.copy.headline, {
          fontSizePx: Math.round(W * 0.095), minFontSizePx: 40, lineHeight: 1.18,
          x: pad, y, w: W - pad * 2, h: Math.round(H * 0.3),
        }),
      );
      if (input.copy.cta) {
        layers.push(
          baseLayer("cta", input.copy.cta, {
            fontSizePx: Math.round(W * 0.03), minFontSizePx: 20, align: "left",
            color: ctaText,
            x: pad, y: H - safeBottom - Math.round(W * 0.085), w: Math.round(W * 0.5), h: Math.round(W * 0.085),
            pill: { bg: accent, paddingX: Math.round(W * 0.04), paddingY: Math.round(W * 0.017), radius: 999 },
          }),
        );
      }
      break;
    }

    case "framed_card": {
      // Festive thin double-border frame; text bottom-center.
      spec.scrims.push({ direction: "bottom-up", color: "0,0,0", maxOpacity: 0.6, coverage: 0.5 });
      const blockW = W - pad * 2.6;
      const cx = (W - blockW) / 2;
      let y = H - safeBottom - Math.round(H * 0.26);
      if (input.copy.eyebrow) {
        layers.push(
          baseLayer("eyebrow", input.copy.eyebrow, {
            fontSizePx: Math.round(W * 0.024), minFontSizePx: 16, align: "center",
            uppercase: true, letterSpacingPx: 4, color: "#f3d9a4",
            x: cx, y, w: blockW, h: Math.round(W * 0.04),
          }),
        );
        y += Math.round(W * 0.05);
      }
      layers.push(
        baseLayer("headline", input.copy.headline, {
          fontSizePx: Math.round(W * 0.075), minFontSizePx: 34, align: "center", lineHeight: 1.22,
          x: cx, y, w: blockW, h: Math.round(H * 0.17),
        }),
      );
      y += Math.round(H * 0.18);
      if (input.copy.cta) {
        layers.push(
          baseLayer("cta", input.copy.cta, {
            fontSizePx: Math.round(W * 0.028), minFontSizePx: 18, align: "center", color: ctaText,
            x: W / 2 - Math.round(W * 0.22), y, w: Math.round(W * 0.44), h: Math.round(W * 0.075),
            pill: { bg: accent, paddingX: Math.round(W * 0.037), paddingY: Math.round(W * 0.015), radius: 999 },
          }),
        );
      }
      break;
    }

    case "badge_offer": {
      // Offer badge top-right + headline bottom-left.
      spec.scrims.push({ direction: "bottom-up", color: "0,0,0", maxOpacity: 0.55, coverage: 0.45 });
      if (input.copy.eyebrow) {
        // Eyebrow doubles as the badge text (e.g. "FLAT 20% OFF").
        const badgeSize = Math.round(W * 0.26);
        layers.push(
          baseLayer("eyebrow", input.copy.eyebrow, {
            fontSizePx: Math.round(W * 0.034), minFontSizePx: 18, align: "center",
            color: contrastText(primary),
            x: W - pad - badgeSize, y: safeTop, w: badgeSize, h: badgeSize,
            pill: { bg: primary, paddingX: 0, paddingY: 0, radius: badgeSize / 2 },
          }),
        );
      }
      layers.push(
        baseLayer("headline", input.copy.headline, {
          fontSizePx: Math.round(W * 0.08), minFontSizePx: 36, lineHeight: 1.2,
          x: pad, y: H - safeBottom - Math.round(H * 0.24), w: W - pad * 2, h: Math.round(H * 0.16),
        }),
      );
      if (input.copy.cta) {
        layers.push(
          baseLayer("cta", input.copy.cta, {
            fontSizePx: Math.round(W * 0.028), minFontSizePx: 18, color: ctaText,
            x: pad, y: H - safeBottom - Math.round(W * 0.075), w: Math.round(W * 0.45), h: Math.round(W * 0.075),
            pill: { bg: accent, paddingX: Math.round(W * 0.037), paddingY: Math.round(W * 0.015), radius: 999 },
          }),
        );
      }
      break;
    }

    case "headline_bottom":
    default: {
      // Scene-dominant; copy block lower-left over a bottom scrim (the
      // classic festive product ad).
      spec.scrims.push({ direction: "bottom-up", color: "0,0,0", maxOpacity: 0.62, coverage: 0.52 });
      let y = H - safeBottom - Math.round(H * 0.3);
      if (input.copy.eyebrow) {
        layers.push(
          baseLayer("eyebrow", input.copy.eyebrow, {
            fontSizePx: Math.round(W * 0.024), minFontSizePx: 16, uppercase: true,
            letterSpacingPx: 3, color: "#f3d9a4",
            x: pad, y, w: W - pad * 2, h: Math.round(W * 0.04),
          }),
        );
        y += Math.round(W * 0.052);
      }
      layers.push(
        baseLayer("headline", input.copy.headline, {
          fontSizePx: Math.round(W * 0.082), minFontSizePx: 36, lineHeight: 1.22,
          x: pad, y, w: W - pad * 2, h: Math.round(H * 0.165),
        }),
      );
      y += Math.round(H * 0.175);
      if (input.copy.subhead) {
        layers.push(
          baseLayer("subhead", input.copy.subhead, {
            fontWeight: 400, fontSizePx: Math.round(W * 0.032), minFontSizePx: 20,
            lineHeight: 1.45, color: "#f1e9dd",
            x: pad, y, w: W - pad * 2, h: Math.round(H * 0.085),
          }),
        );
        y += Math.round(H * 0.095);
      }
      if (input.copy.cta) {
        layers.push(
          baseLayer("cta", input.copy.cta, {
            fontSizePx: Math.round(W * 0.028), minFontSizePx: 18, color: ctaText,
            x: pad, y, w: Math.round(W * 0.45), h: Math.round(W * 0.075),
            pill: { bg: accent, paddingX: Math.round(W * 0.037), paddingY: Math.round(W * 0.015), radius: 999 },
          }),
        );
      }
      break;
    }
  }

  // Motto: small line above bottom edge, opposite the logo.
  if (input.motto) {
    layers.push(
      baseLayer("motto", sameText(input.motto), {
        fontWeight: 400, fontSizePx: Math.round(W * 0.018), minFontSizePx: 13,
        color: "rgba(255,255,255,0.85)", align: "right",
        x: W / 2 - pad, y: H - Math.round(pad * 0.72), w: W / 2, h: Math.round(W * 0.03),
      }),
    );
  }

  // Brand Block contact line: opt-in — only when showContact is true and set.
  if (input.showContact && input.contactLine?.trim()) {
    layers.push(contactLayer(input.contactLine, dims));
  }

  // ---- v2 design pass: type pairing + graphic devices + palette roles ----
  applyTypePairing(layers, pairing);

  // Content-aware scrim strength: busier plates get a stronger scrim for
  // legibility, calm plates a lighter one (less heavy-handed). Stored placement
  // lets the editor/UI reason about where the calm space was.
  if (input.placement) {
    spec.placement = { busyness: input.placement.busyness };
    const b = input.placement.busyness;
    if (typeof b === "number") {
      const k = 0.8 + b * 0.5; // 0.8 (clean) .. 1.3 (busy)
      for (const scrim of spec.scrims) scrim.maxOpacity = Math.max(0.25, Math.min(0.85, scrim.maxOpacity * k));
    }
  }
  const headline = layers.find((l) => l.role === "headline");
  if (headline) {
    const style = input.deviceStyle ?? DEVICE_STYLE_BY_ARCHETYPE[input.archetype] ?? "minimal";
    const copyBox = headlineCopyBox(layers, headline, pad);
    spec.shapeLayers = buildDevices(style, { canvasW: W, canvasH: H, copyBox, pad });
    spec.theme!.deviceStyle = style;
  }
  if (input.plateTreatment) spec.plateTreatment = input.plateTreatment;

  // Logo: default top-left, contain-fit in a generous box, configurable corner.
  if (input.logoAssetRef) {
    spec.logo = computeLogoBox(input.logoAssetRef, dims, input.logoPosition ?? "TL", input.logoScale ?? 1);
  }

  return spec;
}

/** Which graphic-device style each archetype uses. */
const DEVICE_STYLE_BY_ARCHETYPE: Record<string, DeviceStyle> = {
  headline_bottom: "bars",
  big_type_top: "side",
  framed_card: "frame",
  badge_offer: "minimal",
};

/** Bounding box spanning the eyebrow→headline→subhead copy block (for devices). */
function headlineCopyBox(layers: TextLayer[], headline: TextLayer, pad: number) {
  const block = layers.filter((l) => l.role === "eyebrow" || l.role === "headline" || l.role === "subhead");
  const top = Math.min(...block.map((l) => l.y));
  const bottom = Math.max(...block.map((l) => l.y + l.h));
  return { x: headline.x, y: top, w: headline.w, h: Math.max(bottom - top, pad) };
}

/**
 * Apply a type pairing onto the built layers by role — display family on the
 * headline, supporting body faces elsewhere — and bind eyebrow/subhead colours
 * to palette roles (replacing the old hardcoded gold/cream). Layout boxes,
 * positions and sizes are untouched; the renderer shrinks to fit.
 */
function applyTypePairing(layers: TextLayer[], pairing: TypePairing): void {
  const apply = (layer: TextLayer, t: RoleType) => {
    layer.fontFamily = t.family;
    layer.fontWeight = t.fontWeight;
    if (t.uppercase !== undefined) layer.uppercase = t.uppercase;
    if (t.letterSpacingPx !== undefined) layer.letterSpacingPx = t.letterSpacingPx;
    if (t.fontStyle) layer.fontStyle = t.fontStyle;
  };
  for (const layer of layers) {
    switch (layer.role) {
      case "headline":
        apply(layer, pairing.headline);
        break;
      case "eyebrow":
        apply(layer, pairing.eyebrow);
        layer.colorRole = "accent"; // was hardcoded "#f3d9a4"
        break;
      case "subhead":
        apply(layer, pairing.subhead);
        layer.colorRole = "muted"; // was hardcoded "#f1e9dd"
        break;
      case "cta":
        apply(layer, pairing.cta);
        break;
      // motto / contact keep their fixed brand-block styling.
    }
  }
}

export { isHexDark };
