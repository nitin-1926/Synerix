import { createCanvas } from "@napi-rs/canvas";
import { registerFonts, fontStackFor } from "./fonts";
import { fitText, isHexDark } from "./text";
import { resolveColorRole } from "./color";
import type { OverlaySpec } from "./types";

/**
 * Heuristic creative scorer (deterministic, no AI) — ranks layout variants so
 * the compositor keeps the strongest. Rewards a headline that sits large and
 * unshrunk in its box, legible contrast, the headline landing in the calm band,
 * and tasteful use of devices; penalises overflow/truncation.
 */

export interface CreativeScore {
  score: number; // 0..100
  reasons: string[];
}

export function scoreSpec(spec: OverlaySpec, opts?: { safeBand?: "top" | "center" | "bottom"; busyness?: number }): CreativeScore {
  registerFonts();
  const reasons: string[] = [];
  let score = 60;

  const headline = spec.textLayers.find((l) => l.role === "headline");
  if (!headline) return { score: 0, reasons: ["no headline"] };

  // --- Headline fit: measure how much it had to shrink to fit its box. ---
  const canvas = createCanvas(spec.canvas.width, spec.canvas.height);
  const ctx = canvas.getContext("2d");
  const family = spec.language === "hi" || spec.language === "pa" ? fontStackFor(spec.language) : headline.fontFamily;
  const text = (headline.textByLang[spec.language] || headline.textByLang.en || "").trim();
  if (text) {
    const fitted = fitText(ctx, text, {
      fontFamily: family,
      fontWeight: headline.fontWeight,
      maxFontSizePx: headline.fontSizePx,
      minFontSizePx: headline.minFontSizePx,
      lineHeight: headline.lineHeight,
      maxWidth: headline.w,
      maxHeight: headline.h,
    });
    const ratio = fitted.fontSizePx / headline.fontSizePx; // 1 = no shrink
    if (fitted.fontSizePx <= headline.minFontSizePx + 1) {
      score -= 22;
      reasons.push("headline truncated / hit min size");
    } else if (ratio < 0.6) {
      score -= 12;
      reasons.push("headline shrank a lot to fit");
    } else if (ratio > 0.85) {
      score += 12;
      reasons.push("headline sits large and confident");
    }
    if (fitted.lines.length > 4) {
      score -= 8;
      reasons.push("headline wraps to many lines");
    }
  }

  // --- Contrast: light headline over a scrim/dark area reads; dark over light too. ---
  const headColor = resolveColorRole(spec.palette, headline.colorRole, headline.color);
  const hasScrim = spec.scrims.length > 0;
  if (hasScrim && !isHexDark(headColor)) {
    score += 8;
    reasons.push("light headline over scrim");
  } else if (!hasScrim && !spec.plateTreatment) {
    score -= 6;
    reasons.push("no scrim/treatment for contrast");
  }

  // --- Band alignment: headline in the calm band of the image. ---
  // Classify by the headline box CENTER against thirds — y alone misreads tall
  // (9:16) frames, where a bottom-anchored block starts above the 0.55 line.
  if (opts?.safeBand) {
    const centerFrac = (headline.y + headline.h / 2) / spec.canvas.height;
    const band = centerFrac < 1 / 3 ? "top" : centerFrac > 2 / 3 ? "bottom" : "center";
    if (band === opts.safeBand) {
      score += 12;
      reasons.push("headline in the calm band");
    } else if (opts.safeBand !== "center") {
      score -= 8;
      reasons.push("headline off the calm band");
    }
  }

  // --- Devices: a little graphic structure helps; none is plainer. ---
  if (spec.shapeLayers && spec.shapeLayers.length > 0) {
    score += 5;
    reasons.push("uses graphic devices");
  }

  // --- Busy plate without enough scrim is risky. ---
  if (typeof opts?.busyness === "number" && opts.busyness > 0.5 && spec.scrims.every((s) => s.maxOpacity < 0.5)) {
    score -= 10;
    reasons.push("busy plate, weak scrim");
  }

  return { score: Math.max(0, Math.min(100, Math.round(score))), reasons };
}
