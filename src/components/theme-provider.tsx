"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/** Wraps next-themes for light/dark mode (the `.dark` class on <html>).
 *  The palette is the single `.theme-synerix` class hard-coded in layout.tsx
 *  and defined in src/styles/themes.css. There is no palette switcher; the
 *  registry that once described one had a single consumer and was removed. */
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
