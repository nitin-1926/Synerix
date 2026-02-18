import sharp from "sharp";
import { resolveColorRole } from "./color";
import type { Box, OverlaySpec, ScrimLayer, TextLayer } from "./types";

/**
 * Deterministic legibility enforcement: sample the plate pixels that will sit
 * UNDER each text layer (scrim-adjusted), compute the WCAG contrast ratio of
 * the layer's resolved colour against that real background, and remap colours
 * that fall short. This closes the gap the heuristic scorer can't see — e.g. a
 * brand-blue eyebrow landing on blue clothing.
 */

export interface PlateRaster {
  data: Buffer; // raw RGB, 3 channels
  w: number;
  h: number;
}

/**
 * Downscaled raster of the plate as the renderer will draw it (cover-fit to the
 * canvas aspect). `focusY` must match the spec's plateFocusY so the sampled
 * pixels line up with what actually lands under each text layer: renderOverlay
 * anchors the vertical crop by plateFocusY, so a centred raster would sample
 * the wrong rows (and mis-decide contrast) whenever focusY≠0.5. sharp's cover
 * only supports discrete gravities, which is plenty for a 108px contrast raster.
 */
export async function rasterizePlate(
  plate: Buffer,
  canvas: { width: number; height: number },
  focusY = 0.5,
): Promise<PlateRaster> {
  const w = 108;
  const h = Math.max(8, Math.round((w * canvas.height) / canvas.width));
  const position = focusY <= 0.45 ? "top" : focusY >= 0.55 ? "bottom" : "centre";
  const { data } = await sharp(plate)
    .resize(w, h, { fit: "cover", position })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, w, h };
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  const n = m ? parseInt(m[1], 16) : 0;
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/** WCAG relative luminance (0..1). */
export function relLuminance(c: { r: number; g: number; b: number }): number {
  const f = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
}

/** WCAG contrast ratio (1..21). */
export function contrastRatio(a: { r: number; g: number; b: number }, b: { r: number; g: number; b: number }): number {
  const l1 = relLuminance(a);
  const l2 = relLuminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

/** Average plate colour inside a canvas-space box. */
export function regionAverage(
  raster: PlateRaster,
  box: Box,
  canvas: { width: number; height: number },
): { r: number; g: number; b: number } {
  const x0 = Math.max(0, Math.floor((box.x / canvas.width) * raster.w));
  const x1 = Math.min(raster.w, Math.ceil(((box.x + box.w) / canvas.width) * raster.w));
  const y0 = Math.max(0, Math.floor((box.y / canvas.height) * raster.h));
  const y1 = Math.min(raster.h, Math.ceil(((box.y + box.h) / canvas.height) * raster.h));
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (let y = y0; y < Math.max(y1, y0 + 1); y++) {
    for (let x = x0; x < Math.max(x1, x0 + 1); x++) {
      const i = (y * raster.w + x) * 3;
      r += raster.data[i];
      g += raster.data[i + 1];
      b += raster.data[i + 2];
      n++;
    }
  }
  if (!n) return { r: 128, g: 128, b: 128 };
  return { r: r / n, g: g / n, b: b / n };
}

/** Gradient scrim opacity at a vertical position (fraction of canvas height). */
function scrimAlphaAt(scrims: ScrimLayer[], yFrac: number): number {
  let a = 0;
  for (const s of scrims) {
    if (s.direction === "bottom-up") {
      const start = 1 - s.coverage;
      if (yFrac > start && s.coverage > 0) a = Math.max(a, s.maxOpacity * ((yFrac - start) / s.coverage));
    } else if (yFrac < s.coverage && s.coverage > 0) {
      a = Math.max(a, s.maxOpacity * (1 - yFrac / s.coverage));
    }
  }
  return Math.min(a, 0.9);
}

/** Background as the eye sees it under the text: plate blended with the scrim. */
function effectiveBackground(
  raster: PlateRaster,
  spec: OverlaySpec,
  layer: Pick<TextLayer, "x" | "y" | "w" | "h">,
): { r: number; g: number; b: number } {
  const avg = regionAverage(raster, layer, spec.canvas);
  const yFrac = (layer.y + layer.h / 2) / spec.canvas.height;
  const a = scrimAlphaAt(spec.scrims, yFrac);
  // Scrims are black gradients; darken treatment also only lowers luminance,
  // so ignoring it errs toward demanding MORE contrast — the safe direction.
  return { r: avg.r * (1 - a), g: avg.g * (1 - a), b: avg.b * (1 - a) };
}

const WHITE = { r: 255, g: 255, b: 255 };
const INK = { r: 28, g: 28, b: 28 };

/** Minimum ratios: WCAG AA (4.5) for small text, 3 for display-size headlines. */
function requiredRatio(layer: TextLayer): number {
  return layer.role === "headline" ? 3 : 4.5;
}

/**
 * Enforce legibility on a built spec against the actual plate pixels.
 * Mutates layer colours in place; returns human-readable adjustments (for critics).
 */
export function enforceContrast(spec: OverlaySpec, raster: PlateRaster): string[] {
  const notes: string[] = [];
  for (const layer of spec.textLayers) {
    const bg = effectiveBackground(raster, spec, layer);
    if (layer.role === "cta" && layer.pill) {
      // The pill is the CTA's background — it must separate from the plate,
      // then the label just needs to contrast with the pill.
      const pill = hexToRgb(resolveColorRole(spec.palette, undefined, layer.pill.bg));
      if (contrastRatio(pill, bg) < 1.5) {
        const candidates = [spec.palette?.roles?.bg, "#111111", "#f5f5f2"]
          .filter((c): c is string => Boolean(c))
          .map((c) => ({ hex: c, ratio: contrastRatio(hexToRgb(c), bg) }));
        const better = candidates.find((c) => c.ratio >= 1.8) ?? candidates.sort((a, b) => b.ratio - a.ratio)[0];
        if (better) {
          layer.pill = { ...layer.pill, bg: better.hex };
          layer.color = contrastRatio(hexToRgb(better.hex), WHITE) >= contrastRatio(hexToRgb(better.hex), INK) ? "#ffffff" : "#1c1c1c";
          notes.push("cta pill remapped for separation");
        }
      }
      continue;
    }
    if (layer.role !== "eyebrow" && layer.role !== "headline" && layer.role !== "subhead") continue;

    const current = hexToRgb(resolveColorRole(spec.palette, layer.colorRole, layer.color));
    const need = requiredRatio(layer);
    if (contrastRatio(current, bg) >= need) continue;

    const white = contrastRatio(WHITE, bg);
    const ink = contrastRatio(INK, bg);
    const winner = white >= ink ? { hex: "#ffffff", ratio: white } : { hex: "#1c1c1c", ratio: ink };
    layer.color = winner.hex;
    layer.colorRole = undefined;
    notes.push(`${layer.role} remapped to ${winner.hex === "#ffffff" ? "white" : "ink"} for contrast`);
    // Mid-tone busy background where even pure white/ink falls short: back the
    // text with a translucent panel so legibility never depends on the plate.
    if (winner.ratio < need) {
      layer.textBox = {
        color: winner.hex === "#ffffff" ? "#000000" : "#ffffff",
        opacity: 0.5,
        paddingX: 14,
        paddingY: 10,
        radius: 8,
      };
      notes.push(`${layer.role} backed with panel (bg too mid-tone)`);
    }
  }
  return notes;
}
