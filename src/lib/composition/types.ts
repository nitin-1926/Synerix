// OverlaySpec — the renderer-agnostic contract between archetype layout
// functions and the canvas compositor. Every visual property is resolved and
// frozen here so re-compositing (text edit, language switch, aspect re-render)
// is deterministic and AI-free.

export type CopyLanguage = "en" | "hinglish" | "hi" | "pa";

export interface TextByLang {
  en: string;
  hinglish: string;
  hi: string;
  pa: string;
}

export const COPY_LANGUAGES: { id: CopyLanguage; label: string }[] = [
  { id: "en", label: "English" },
  { id: "hinglish", label: "Hinglish" },
  { id: "hi", label: "हिन्दी" },
  { id: "pa", label: "ਪੰਜਾਬੀ" },
];

export type TextRole = "eyebrow" | "headline" | "subhead" | "cta" | "motto" | "contact";

/**
 * Colour-role map resolved from the brand + the image palette. Layers may carry
 * a literal hex OR reference one of these roles via `colorRole`, so a template
 * stays palette-agnostic until it's bound to a specific brand/image.
 */
export type ColorRole = "bg" | "ink" | "accent" | "cta" | "ctaText" | "scrim" | "muted";

export interface Palette {
  /** Dominant colours extracted from the generated plate (hex), most-dominant first. */
  dominant: string[];
  /** Resolved role → hex map used by shape/text layers via `colorRole`. */
  roles: Record<ColorRole, string>;
}

/** Box in canvas px (also used for content-aware zones). */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TextLayer {
  role: TextRole;
  textByLang: TextByLang;
  /** Canvas font family list, e.g. `Inter, "Noto Sans Devanagari"` */
  fontFamily: string;
  /** Family used when language is "hi" (Devanagari-first stack). */
  fontFamilyHi: string;
  fontWeight: 400 | 700 | number;
  /** Upper bound; renderer shrinks to fit box. */
  fontSizePx: number;
  minFontSizePx: number;
  lineHeight: number;
  color: string;
  /** Optional colour-role reference; when set, overrides `color` at render time. */
  colorRole?: ColorRole;
  align: "left" | "center" | "right";
  /** Layout box in canvas px. */
  x: number;
  y: number;
  w: number;
  h: number;
  letterSpacingPx?: number;
  uppercase?: boolean;
  /** Italic / oblique display faces (v2). */
  fontStyle?: "normal" | "italic";
  /** Outline stroke around glyphs (v2). */
  stroke?: { color: string; widthPx: number };
  /** Marker/knockout highlight band behind the text run (v2). */
  highlight?: { color: string; paddingX: number; paddingY: number; radius: number };
  /** Solid panel behind the whole text box, beyond the CTA pill (v2). */
  textBox?: { color: string; opacity?: number; paddingX: number; paddingY: number; radius: number };
  /** Hard cap on lines before shrink-to-fit gives up (v2). */
  maxLines?: number;
  /** Pill background (CTA). */
  pill?: { bg: string; paddingX: number; paddingY: number; radius: number };
}

/**
 * Non-text graphic primitive (v2). The renderer paints these in `z` order,
 * interleaved with scrims (below text) so devices like accent bars, frames,
 * colour blocks and glass panels can sit between the plate and the type.
 */
export interface ShapeLayer {
  kind: "rect" | "ellipse" | "line" | "frame";
  x: number;
  y: number;
  w: number;
  h: number;
  /** Fill colour (hex/rgba) for rect/ellipse; ignored for line/frame. */
  fill?: string;
  /** Vertical linear gradient fill [from, to] (hex/rgba); overrides `fill`. */
  gradient?: { from: string; to: string; direction?: "vertical" | "horizontal" };
  /** Stroke for line/frame (and optional outline on rect/ellipse). */
  stroke?: { color: string; widthPx: number };
  /** Colour-role reference; resolved to `fill` at render time when set. */
  colorRole?: ColorRole;
  radius?: number;
  opacity?: number;
  /** Drop shadow under the shape. */
  shadow?: { color: string; blur: number; offsetY: number };
  /** Paint order; lower paints first. Defaults applied by the renderer. */
  z?: number;
}

/** Content-aware layout zones detected on the generated plate (v2). */
export interface Placement {
  /** Calmest region for the headline block. */
  safeBox?: Box;
  /** Where the product / main subject sits. */
  subjectBox?: Box;
  /** Detected face boxes (avoid covering). */
  faces?: Box[];
  focalPoint?: { x: number; y: number };
  /** 0 (clean) .. 1 (very busy) — drives scrim strength / template choice. */
  busyness?: number;
}

export interface ThemeTokens {
  /** Type-pairing id from typeSystem (e.g. "editorial-serif"). */
  typePairing?: string;
  /** Graphic-device style id from devices (e.g. "bars", "frame", "minimal"). */
  deviceStyle?: string;
}

export interface LogoLayer {
  /** Storage key or absolute path resolved by the caller into a buffer. */
  assetRef: string;
  x: number;
  y: number;
  w: number;
  h: number;
  opacity?: number;
}

export interface ScrimLayer {
  /** Vertical gradient scrim to guarantee text contrast over photos. */
  direction: "bottom-up" | "top-down";
  color: string; // rgba base, e.g. "0,0,0"
  maxOpacity: number; // 0..1
  /** Fraction of canvas height the scrim covers. */
  coverage: number;
}

export interface OverlaySpec {
  /** 1 = legacy (scrims + text + logo); 2 = adds shapeLayers/palette/theme/placement. */
  version: 1 | 2;
  archetype: string;
  canvas: { width: number; height: number };
  /** Plate draw mode — cover keeps aspect, crops overflow. */
  plateFit: "cover";
  /**
   * Vertical anchor (0..1) for the cover-crop when the plate's aspect differs
   * from the canvas: 0 keeps the plate's top (crops the bottom), 1 keeps the
   * bottom, 0.5 = centered (default/legacy). Image models often return an
   * off-ratio plate (e.g. gpt-image-2 gives 2:3 for a 4:5 request) with the
   * subject high and reserved negative space low; a centered crop then eats the
   * subject's head. Anchoring toward the subject (away from the reserved band)
   * keeps heads/feet in frame while still trimming the empty band for text.
   */
  plateFocusY?: number;
  scrims: ScrimLayer[];
  textLayers: TextLayer[];
  logo?: LogoLayer;
  /** Active language for rendering (layers carry all three). */
  language: CopyLanguage;
  // ---- v2 (all optional; legacy v1 specs omit these and render unchanged) ----
  /** Graphic-device primitives painted between the plate/scrims and the text. */
  shapeLayers?: ShapeLayer[];
  /** Resolved brand+image colour palette referenced by `colorRole`. */
  palette?: Palette;
  /** Design tokens (type pairing, device style) this spec was built from. */
  theme?: ThemeTokens;
  /** Content-aware zones the layout was anchored to. */
  placement?: Placement;
  /** Optional duotone/blur treatment applied to the plate before overlays. */
  plateTreatment?: { kind: "duotone" | "darken" | "none"; from?: string; to?: string; amount?: number };
}

export const ASPECT_DIMENSIONS: Record<string, { width: number; height: number }> = {
  "1:1": { width: 1080, height: 1080 },
  "4:5": { width: 1080, height: 1350 },
  "9:16": { width: 1080, height: 1920 },
  "16:9": { width: 1920, height: 1080 },
};
