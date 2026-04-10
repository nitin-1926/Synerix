/**
 * Theme registry.
 *
 * Each theme is a named CSS-variable block defined in `src/styles/themes.css`
 * (a light block scoped under `.theme-<id>` plus a `.theme-<id>.dark` override).
 * The default theme's class is applied to <html> in `src/app/layout.tsx`.
 *
 * To add a theme later:
 *   1. Paste its `.theme-<id> { … }` + `.theme-<id>.dark { … }` blocks into themes.css.
 *   2. Add an entry below.
 *   3. (Optional) flip on a live switcher — the plumbing already reads `className`.
 *
 * Light/dark mode is handled separately by next-themes (the `.dark` class).
 */

export type ThemeId = "synerix" | "violet-bloom";

export interface ThemeDef {
  id: ThemeId;
  /** Human label, for a future theme switcher. */
  name: string;
  /** The class applied to <html> that scopes this theme's tokens. */
  className: string;
}

export const THEMES: Record<ThemeId, ThemeDef> = {
  synerix: {
    id: "synerix",
    name: "Synerix",
    className: "theme-synerix",
  },
  "violet-bloom": {
    id: "violet-bloom",
    name: "Violet Bloom",
    className: "theme-violet-bloom",
  },
};

// Brand navy/cyan by default; violet-bloom kept as a one-line fallback switch.
export const DEFAULT_THEME: ThemeId = "synerix";

export const DEFAULT_THEME_CLASS = THEMES[DEFAULT_THEME].className;
