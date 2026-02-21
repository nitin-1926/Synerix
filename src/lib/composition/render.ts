import { createCanvas, loadImage, type SKRSContext2D } from "@napi-rs/canvas";
import sharp from "sharp";
import { registerFonts, fontStackFor } from "./fonts";
import { fitText } from "./text";
import { resolveColorRole } from "./color";
import type { CopyLanguage, OverlaySpec, Palette, ShapeLayer, TextLayer } from "./types";

/**
 * The deterministic compositor: wordless plate + OverlaySpec → final PNG.
 * No AI calls — re-running with an edited spec is instant and free.
 *
 * v2 adds shape layers (bars/frames/panels/gradients), a duotone/darken plate
 * pre-pass, per-layer display fonts and text stroke/highlight/panel. Legacy v1
 * specs (no shapeLayers/plateTreatment) render exactly as before.
 */

export interface RenderAssets {
  /** PNG/JPEG buffer of the wordless master plate. */
  plate: Buffer;
  /** Logo image buffer when spec.logo is set. */
  logo?: Buffer;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return { r: 0, g: 0, b: 0 };
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/** Optional sharp pre-pass: duotone tint or darken, applied to the plate. */
async function applyPlateTreatment(plate: Buffer, t: OverlaySpec["plateTreatment"]): Promise<Buffer> {
  if (!t || t.kind === "none") return plate;
  if (t.kind === "darken") {
    return sharp(plate).modulate({ brightness: Math.max(0.2, 1 - (t.amount ?? 0.25)) }).toBuffer();
  }
  // duotone: greyscale then tint toward the highlight colour (clean editorial look).
  const tint = hexToRgb(t.to ?? "#2a3550");
  return sharp(plate).greyscale().tint(tint).toBuffer();
}

export async function renderOverlay(spec: OverlaySpec, assets: RenderAssets): Promise<Buffer> {
  registerFonts();
  const { width: W, height: H } = spec.canvas;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  const palette = spec.palette;

  // 1. Plate — optional treatment pre-pass, then cover fit. Horizontal stays
  // centered; vertical is anchored by plateFocusY (default 0.5 = centered) so
  // an off-ratio plate is cropped away from the subject, not through its head.
  const treated = await applyPlateTreatment(assets.plate, spec.plateTreatment);
  const plate = await loadImage(treated);
  const scale = Math.max(W / plate.width, H / plate.height);
  const dw = plate.width * scale;
  const dh = plate.height * scale;
  const focusY = Math.min(1, Math.max(0, spec.plateFocusY ?? 0.5));
  ctx.drawImage(plate, (W - dw) / 2, (H - dh) * focusY, dw, dh);

  // 2. Scrims for text contrast.
  for (const scrim of spec.scrims) {
    const grad =
      scrim.direction === "bottom-up"
        ? ctx.createLinearGradient(0, H, 0, H - H * scrim.coverage)
        : ctx.createLinearGradient(0, 0, 0, H * scrim.coverage);
    grad.addColorStop(0, `rgba(${scrim.color},${scrim.maxOpacity})`);
    grad.addColorStop(1, `rgba(${scrim.color},0)`);
    ctx.fillStyle = grad;
    if (scrim.direction === "bottom-up") ctx.fillRect(0, H - H * scrim.coverage, W, H * scrim.coverage);
    else ctx.fillRect(0, 0, W, H * scrim.coverage);
  }

  // 3. Shape / graphic-device layers (v2), painted in z order below the text.
  if (spec.shapeLayers?.length) {
    const ordered = [...spec.shapeLayers].sort((a, b) => (a.z ?? 0) - (b.z ?? 0));
    for (const shape of ordered) drawShapeLayer(ctx, shape, palette);
  }

  // 4. Text layers.
  for (const layer of spec.textLayers) {
    drawTextLayer(ctx, layer, spec.language, palette);
  }

  // 5. Logo.
  if (spec.logo && assets.logo) {
    const img = await loadImage(assets.logo);
    // Contain-fit inside the logo box, left-aligned.
    const s = Math.min(spec.logo.w / img.width, spec.logo.h / img.height);
    const lw = img.width * s;
    const lh = img.height * s;
    ctx.globalAlpha = spec.logo.opacity ?? 1;
    ctx.drawImage(img, spec.logo.x, spec.logo.y + (spec.logo.h - lh) / 2, lw, lh);
    ctx.globalAlpha = 1;
  }

  return canvas.toBuffer("image/png");
}

function fillFor(ctx: SKRSContext2D, shape: ShapeLayer, palette: Palette | undefined): string | CanvasGradient {
  if (shape.gradient) {
    const horiz = shape.gradient.direction === "horizontal";
    const grad = horiz
      ? ctx.createLinearGradient(shape.x, 0, shape.x + shape.w, 0)
      : ctx.createLinearGradient(0, shape.y, 0, shape.y + shape.h);
    grad.addColorStop(0, shape.gradient.from);
    grad.addColorStop(1, shape.gradient.to);
    return grad;
  }
  return resolveColorRole(palette, shape.colorRole, shape.fill ?? "#000000");
}

function drawShapeLayer(ctx: SKRSContext2D, shape: ShapeLayer, palette: Palette | undefined): void {
  ctx.save();
  ctx.globalAlpha = shape.opacity ?? 1;
  if (shape.shadow) {
    ctx.shadowColor = shape.shadow.color;
    ctx.shadowBlur = shape.shadow.blur;
    ctx.shadowOffsetY = shape.shadow.offsetY;
  }
  if (shape.kind === "line") {
    ctx.strokeStyle = shape.stroke?.color ?? resolveColorRole(palette, shape.colorRole, "#ffffff");
    ctx.lineWidth = shape.stroke?.widthPx ?? 2;
    ctx.beginPath();
    ctx.moveTo(shape.x, shape.y);
    ctx.lineTo(shape.x + shape.w, shape.y + shape.h);
    ctx.stroke();
  } else if (shape.kind === "frame") {
    ctx.strokeStyle = shape.stroke?.color ?? resolveColorRole(palette, shape.colorRole, "#ffffff");
    ctx.lineWidth = shape.stroke?.widthPx ?? 3;
    ctx.beginPath();
    ctx.roundRect(shape.x, shape.y, shape.w, shape.h, shape.radius ?? 0);
    ctx.stroke();
  } else if (shape.kind === "ellipse") {
    ctx.fillStyle = fillFor(ctx, shape, palette);
    ctx.beginPath();
    ctx.ellipse(shape.x + shape.w / 2, shape.y + shape.h / 2, shape.w / 2, shape.h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // rect (optionally rounded), with optional outline stroke.
    ctx.fillStyle = fillFor(ctx, shape, palette);
    ctx.beginPath();
    ctx.roundRect(shape.x, shape.y, shape.w, shape.h, shape.radius ?? 0);
    ctx.fill();
    if (shape.stroke) {
      ctx.shadowColor = "transparent";
      ctx.strokeStyle = shape.stroke.color;
      ctx.lineWidth = shape.stroke.widthPx;
      ctx.stroke();
    }
  }
  ctx.restore();
}

function textForLanguage(layer: TextLayer, lang: CopyLanguage): string {
  const t = layer.textByLang[lang] || layer.textByLang.en;
  return layer.uppercase ? t.toUpperCase() : t;
}

/**
 * Per-layer font family. Indic scripts always use their shaping-correct stacks
 * (hi→Devanagari, pa→Gurmukhi); Latin (en/hinglish) uses the layer's chosen
 * display family, falling back to the Latin stack for legacy specs.
 */
function familyFor(layer: TextLayer, lang: CopyLanguage): string {
  if (lang === "hi") return layer.fontFamilyHi || fontStackFor("hi");
  if (lang === "pa") return fontStackFor("pa");
  return layer.fontFamily || fontStackFor("en");
}

function drawTextLayer(ctx: SKRSContext2D, layer: TextLayer, lang: CopyLanguage, palette?: Palette): void {
  const text = textForLanguage(layer, lang);
  if (!text.trim()) return;
  const family = familyFor(layer, lang);
  const style = layer.fontStyle === "italic" ? "italic " : "";
  const fontColor = resolveColorRole(palette, layer.colorRole, layer.color);

  const fitted = fitText(ctx, text, {
    fontFamily: family,
    fontWeight: layer.fontWeight,
    maxFontSizePx: layer.fontSizePx,
    minFontSizePx: layer.minFontSizePx,
    lineHeight: layer.lineHeight,
    maxWidth: layer.w - (layer.pill ? layer.pill.paddingX * 2 : 0),
    maxHeight: layer.h - (layer.pill ? layer.pill.paddingY * 2 : 0),
  });

  ctx.font = `${style}${layer.fontWeight} ${fitted.fontSizePx}px ${family}`;
  ctx.textBaseline = "top";

  // Solid panel behind the entire text block (v2), beyond the CTA pill.
  if (layer.textBox) {
    ctx.save();
    ctx.globalAlpha = layer.textBox.opacity ?? 1;
    ctx.fillStyle = layer.textBox.color;
    ctx.beginPath();
    ctx.roundRect(
      layer.x - layer.textBox.paddingX,
      layer.y - layer.textBox.paddingY,
      layer.w + layer.textBox.paddingX * 2,
      fitted.totalHeight + layer.textBox.paddingY * 2,
      layer.textBox.radius,
    );
    ctx.fill();
    ctx.restore();
  }
  // Letter-spacing breaks the Devanagari/Gurmukhi headline connector — Latin only.
  const useSpacing = layer.letterSpacingPx && lang !== "hi" && lang !== "pa";
  if (useSpacing) ctx.letterSpacing = `${layer.letterSpacingPx}px`;

  // Pill background sized to content (single-line CTA) or full box (badge).
  if (layer.pill) {
    const isBadge = layer.pill.paddingX === 0; // badge_offer circle
    ctx.fillStyle = resolveColorRole(palette, layer.colorRole === "cta" ? "cta" : undefined, layer.pill.bg);
    ctx.beginPath();
    if (isBadge) {
      ctx.roundRect(layer.x, layer.y, layer.w, layer.h, layer.pill.radius);
    } else {
      const contentW = Math.max(...fitted.lines.map((l) => ctx.measureText(l).width));
      const pillW = contentW + layer.pill.paddingX * 2;
      const pillH = fitted.totalHeight + layer.pill.paddingY * 2;
      const px = layer.align === "center" ? layer.x + (layer.w - pillW) / 2 : layer.x;
      ctx.roundRect(px, layer.y, pillW, pillH, layer.pill.radius);
    }
    ctx.fill();
  }

  ctx.fillStyle = fontColor;
  // Soft shadow on free-standing text (not pill/badge text) so it reads crisply
  // on any background and looks set into the image rather than flatly stamped.
  const softShadow = !layer.pill;
  if (softShadow) {
    ctx.shadowColor = "rgba(0,0,0,0.45)";
    ctx.shadowBlur = Math.round(fitted.fontSizePx * 0.12);
    ctx.shadowOffsetY = Math.round(fitted.fontSizePx * 0.03);
  }
  const innerX = layer.x + (layer.pill && layer.pill.paddingX > 0 ? layer.pill.paddingX : 0);
  const innerW = layer.w - (layer.pill && layer.pill.paddingX > 0 ? layer.pill.paddingX * 2 : 0);
  let y =
    layer.y +
    (layer.pill
      ? layer.pill.paddingX === 0
        ? (layer.h - fitted.totalHeight) / 2 // badge: vertical center
        : layer.pill.paddingY
      : 0);

  for (const line of fitted.lines) {
    const lineW = ctx.measureText(line).width;
    let x = innerX;
    if (layer.align === "center") x = innerX + (innerW - lineW) / 2;
    if (layer.align === "right") x = innerX + innerW - lineW;
    const ty = y + (fitted.lineHeightPx - fitted.fontSizePx) / 2;

    // Marker/knockout highlight band behind this line (v2).
    if (layer.highlight && line.trim()) {
      const hp = layer.highlight;
      ctx.save();
      ctx.shadowColor = "transparent";
      ctx.fillStyle = hp.color;
      ctx.beginPath();
      ctx.roundRect(x - hp.paddingX, ty - hp.paddingY, lineW + hp.paddingX * 2, fitted.fontSizePx + hp.paddingY * 2, hp.radius);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = fontColor;
    }

    // Glyph outline stroke (v2), drawn under the fill for a clean outline.
    if (layer.stroke) {
      ctx.strokeStyle = layer.stroke.color;
      ctx.lineWidth = layer.stroke.widthPx;
      ctx.lineJoin = "round";
      ctx.strokeText(line, x, ty);
    }
    ctx.fillText(line, x, ty);
    y += fitted.lineHeightPx;
  }
  if (softShadow) {
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }
  if (useSpacing) ctx.letterSpacing = "0px";
}
