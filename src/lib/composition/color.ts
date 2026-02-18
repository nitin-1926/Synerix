import type { ColorRole, Palette } from "./types";
import { contrastText, isHexDark } from "./text";

/**
 * Colour-role resolution: templates and layers reference semantic roles
 * (`accent`, `cta`, `ink`…) instead of literal hexes, so one template renders
 * correctly for any brand/image. Roles are resolved once into a `Palette.roles`
 * map; layers then look up `colorRole` at render time.
 */

const HEX6 = /^#?([0-9a-f]{6})$/i;

export function normalizeHex(hex: string | null | undefined, fallback = "#000000"): string {
  if (!hex) return fallback;
  const m = HEX6.exec(hex.trim());
  return m ? `#${m[1].toLowerCase()}` : fallback;
}

function rgb(hex: string): { r: number; g: number; b: number } {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function lum(c: { r: number; g: number; b: number }): number {
  return (0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b) / 255;
}

/** Shift a colour's lightness away from its own tone (keeps the brand hue). */
function shiftLightness(hex: string, amount: number): string {
  const c = rgb(hex);
  const toward = isHexDark(hex) ? 255 : 0;
  const ch = (v: number) => Math.round(v + (toward - v) * amount);
  const h = (v: number) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0");
  return `#${h(ch(c.r))}${h(ch(c.g))}${h(ch(c.b))}`;
}

/**
 * If the accent sits too close to a colour that dominates the plate (e.g. a
 * blue accent over blue clothing), shift its lightness so accent-bound layers
 * (eyebrow, bars, CTA) separate from the image instead of dissolving into it.
 */
function separateFromImage(hex: string, dominant: string[]): string {
  const c = rgb(hex);
  const conflict = dominant.some((d) => {
    const dc = rgb(d);
    const dist = Math.hypot(c.r - dc.r, c.g - dc.g, c.b - dc.b);
    return dist < 90 && Math.abs(lum(c) - lum(dc)) < 0.18;
  });
  return conflict ? shiftLightness(hex, 0.4) : hex;
}

/**
 * Build the role → hex map from the brand colours and (optionally) the image's
 * dominant palette. Deterministic, no AI: brand primary leads, accent fills the
 * CTA, ink/scrim derive from luminance so text stays legible.
 */
export function resolveRoles(opts: {
  primaryHex: string;
  accentHex?: string | null;
  dominant?: string[];
}): Record<ColorRole, string> {
  const primary = normalizeHex(opts.primaryHex, "#b83b5e");
  const accentRaw = normalizeHex(opts.accentHex ?? primary, primary);
  const accent = opts.dominant?.length ? separateFromImage(accentRaw, opts.dominant.map((c) => normalizeHex(c))) : accentRaw;
  // Prefer a brand colour for the CTA; fall back to accent.
  const cta = accent;
  return {
    bg: primary,
    ink: "#ffffff",
    accent,
    cta,
    ctaText: contrastText(cta),
    scrim: "0,0,0",
    muted: isHexDark(primary) ? "#f1e9dd" : "#3a3a3a",
  };
}

export function makePalette(opts: {
  primaryHex: string;
  accentHex?: string | null;
  dominant?: string[];
}): Palette {
  return {
    dominant: (opts.dominant ?? []).map((c) => normalizeHex(c)).filter(Boolean),
    roles: resolveRoles(opts),
  };
}

/** Resolve a layer's colour: an explicit role wins over a literal colour. */
export function resolveColorRole(
  palette: Palette | undefined,
  role: ColorRole | undefined,
  literal: string,
): string {
  if (role && palette?.roles?.[role]) return palette.roles[role];
  return literal;
}
