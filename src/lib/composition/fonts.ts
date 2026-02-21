import { GlobalFonts } from "@napi-rs/canvas";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { CopyLanguage } from "./types";

// Fonts ship in public/fonts (bundled into Trigger.dev deploys via
// additionalFiles — see trigger.config.ts). Each file is registered under an
// explicit family alias regardless of its internal name.
const FONT_FILES = [
  // Body / UI (Latin) + Indic scripts.
  ["inter-400.ttf", "Inter"],
  ["inter-700.ttf", "Inter"],
  ["noto-sans-devanagari-400.ttf", "Noto Sans Devanagari"],
  ["noto-sans-devanagari-700.ttf", "Noto Sans Devanagari"],
  ["mukta-400.ttf", "Mukta"],
  ["mukta-700.ttf", "Mukta"],
  ["noto-sans-gurmukhi-400.ttf", "Noto Sans Gurmukhi"],
  ["noto-sans-gurmukhi-700.ttf", "Noto Sans Gurmukhi"],
  // Display faces (Latin only) for agency-grade headline typography.
  ["anton.ttf", "Anton"], // condensed heavy — impact / sale
  ["archivo-black.ttf", "Archivo Black"], // heavy grotesque — modern bold
  ["dm-serif-display.ttf", "DM Serif Display"], // high-contrast serif — editorial / premium
  ["dm-serif-display-italic.ttf", "DM Serif Display"], // italic instance (same family)
  ["bebas-neue.ttf", "Bebas Neue"], // tall condensed caps — bold minimal
] as const;

let registered = false;

export function registerFonts(): void {
  if (registered) return;
  const dir = join(process.cwd(), "public/fonts");
  for (const [file, family] of FONT_FILES) {
    const p = join(dir, file);
    if (existsSync(p)) GlobalFonts.registerFromPath(p, family);
    else console.warn(`[fonts] missing ${p}`);
  }
  registered = true;
}

// Script-aware stacks (Latin first carries Devanagari+Gurmukhi fallback for
// mixed Hinglish lines; hi/pa lead with their own script).
export const LATIN_STACK = 'Inter, "Noto Sans Devanagari", "Noto Sans Gurmukhi"';
export const DEVANAGARI_STACK = '"Noto Sans Devanagari", Inter';
export const GURMUKHI_STACK = '"Noto Sans Gurmukhi", Inter';

export function fontStackFor(language: CopyLanguage): string {
  if (language === "hi") return DEVANAGARI_STACK;
  if (language === "pa") return GURMUKHI_STACK;
  return LATIN_STACK;
}

// Latin display families (each falls back to Inter, then the Indic stack so a
// stray Devanagari/Gurmukhi glyph in Hinglish still shapes). Used by the type
// system for headlines; Indic languages keep their shaping-correct stacks.
export const DISPLAY = {
  anton: 'Anton, Inter, "Noto Sans Devanagari", "Noto Sans Gurmukhi"',
  archivoBlack: '"Archivo Black", Inter, "Noto Sans Devanagari", "Noto Sans Gurmukhi"',
  dmSerif: '"DM Serif Display", Georgia, "Noto Sans Devanagari", "Noto Sans Gurmukhi"',
  bebas: '"Bebas Neue", Inter, "Noto Sans Devanagari", "Noto Sans Gurmukhi"',
  inter: LATIN_STACK,
} as const;

export type DisplayFamily = keyof typeof DISPLAY;
