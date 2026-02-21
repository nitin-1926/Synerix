import type { SKRSContext2D } from "@napi-rs/canvas";

/** Greedy word-wrap using real canvas measurement. */
export function wrapText(ctx: SKRSContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth || !line) {
      line = candidate;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export interface FittedText {
  fontSizePx: number;
  lines: string[];
  lineHeightPx: number;
  totalHeight: number;
}

/**
 * Shrink font size until wrapped text fits the box (width AND height).
 * Replaces floki's satori autoHeadlineSize with real measurement.
 */
export function fitText(
  ctx: SKRSContext2D,
  text: string,
  opts: {
    fontFamily: string;
    fontWeight: number;
    maxFontSizePx: number;
    minFontSizePx: number;
    lineHeight: number;
    maxWidth: number;
    maxHeight: number;
  },
): FittedText {
  let size = opts.maxFontSizePx;
  while (size >= opts.minFontSizePx) {
    ctx.font = `${opts.fontWeight} ${size}px ${opts.fontFamily}`;
    const lines = wrapText(ctx, text, opts.maxWidth);
    const lineHeightPx = size * opts.lineHeight;
    const totalHeight = lines.length * lineHeightPx;
    const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
    if (totalHeight <= opts.maxHeight && widest <= opts.maxWidth) {
      return { fontSizePx: size, lines, lineHeightPx, totalHeight };
    }
    size -= 2;
  }
  // Floor reached: render at min size, hard-truncated to fit height.
  ctx.font = `${opts.fontWeight} ${opts.minFontSizePx}px ${opts.fontFamily}`;
  const lines = wrapText(ctx, text, opts.maxWidth);
  const lineHeightPx = opts.minFontSizePx * opts.lineHeight;
  const maxLines = Math.max(1, Math.floor(opts.maxHeight / lineHeightPx));
  return {
    fontSizePx: opts.minFontSizePx,
    lines: lines.slice(0, maxLines),
    lineHeightPx,
    totalHeight: Math.min(lines.length, maxLines) * lineHeightPx,
  };
}

/** WCAG-ish relative luminance for contrast-safe text color selection. */
export function isHexDark(hex: string): boolean {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return true;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum < 140;
}

export function contrastText(bgHex: string): string {
  return isHexDark(bgHex) ? "#ffffff" : "#1a1a1a";
}
