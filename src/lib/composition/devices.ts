import type { Box, ColorRole, ShapeLayer } from "./types";

/**
 * Graphic-device library — small, composable builders that return ShapeLayer[]
 * (resolved against the palette at render time via colorRole). Devices are what
 * turn "scrim + text" into "designed": accent bars, kicker rules, frames,
 * colour blocks and offer badges. Templates pick a device style; this module
 * compiles it to shapes.
 */

/** Short bold accent bar — the classic "designed" kicker under an eyebrow/headline. */
export function accentBar(x: number, y: number, w: number, h: number, role: ColorRole = "accent", z = 2): ShapeLayer {
  return { kind: "rect", x, y, w, h, colorRole: role, radius: Math.round(h / 2), z };
}

/** Full-width hairline rule (divider). */
export function ruleLine(x: number, y: number, w: number, color = "rgba(255,255,255,0.35)", widthPx = 2, z = 2): ShapeLayer {
  return { kind: "line", x, y, w, h: 0, stroke: { color, widthPx }, z };
}

/** Thin inset frame around the whole canvas (editorial border). */
export function cornerFrame(canvasW: number, canvasH: number, inset: number, color = "rgba(255,255,255,0.55)", widthPx = 3, z = 0): ShapeLayer {
  return { kind: "frame", x: inset, y: inset, w: canvasW - inset * 2, h: canvasH - inset * 2, stroke: { color, widthPx }, radius: 6, z };
}

/** Solid colour panel behind a copy block (knockout look). */
export function colorBlock(box: Box, role: ColorRole = "bg", opacity = 0.92, radius = 8, z = 1): ShapeLayer {
  return { kind: "rect", x: box.x, y: box.y, w: box.w, h: box.h, colorRole: role, opacity, radius, z };
}

/** Vertical accent strip down the left edge of a copy block. */
export function sideAccent(x: number, y: number, h: number, w = 8, role: ColorRole = "accent", z = 2): ShapeLayer {
  return { kind: "rect", x, y, w, h, colorRole: role, radius: Math.round(w / 2), z };
}

/** Circular offer badge (the badge TEXT is a separate text layer placed over it). */
export function offerBadge(cx: number, cy: number, r: number, role: ColorRole = "accent", z = 1): ShapeLayer {
  return {
    kind: "ellipse",
    x: cx - r,
    y: cy - r,
    w: r * 2,
    h: r * 2,
    colorRole: role,
    shadow: { color: "rgba(0,0,0,0.30)", blur: 24, offsetY: 6 },
    z,
  };
}

export type DeviceStyle = "minimal" | "bars" | "frame" | "block" | "side";

/**
 * Compile a device style into shapes positioned around a copy block. Keeps the
 * device set small and tasteful; templates choose the style and the copy box.
 */
export function buildDevices(
  style: DeviceStyle,
  ctx: { canvasW: number; canvasH: number; copyBox: Box; pad: number },
): ShapeLayer[] {
  const { canvasW, canvasH, copyBox, pad } = ctx;
  switch (style) {
    case "bars":
      // Accent bar sitting just above the copy block.
      return [accentBar(copyBox.x, copyBox.y - Math.round(pad * 0.5), Math.round(canvasW * 0.11), 12)];
    case "frame":
      return [
        cornerFrame(canvasW, canvasH, Math.round(pad * 0.55)),
        accentBar(copyBox.x, copyBox.y - Math.round(pad * 0.5), Math.round(canvasW * 0.11), 12),
      ];
    case "side":
      return [sideAccent(copyBox.x - Math.round(pad * 0.5), copyBox.y, copyBox.h)];
    case "block":
      return [colorBlock({ x: copyBox.x - pad, y: copyBox.y - pad, w: copyBox.w + pad * 2, h: copyBox.h + pad * 2 })];
    case "minimal":
    default:
      return [];
  }
}
