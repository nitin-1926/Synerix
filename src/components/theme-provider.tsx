"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/** Wraps next-themes for light/dark mode (the `.dark` class on <html>).
 *  The active *palette* (violet-bloom, etc.) is the .theme-* class set in
 *  layout.tsx — see src/lib/themes.ts. */
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
