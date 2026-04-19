"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import type { ThemeProvider as NextThemesProviderType } from "next-themes";

// next-themes 0.4.6 renders an inline <script> inside its provider for FOUC
// prevention. React 19 logs a console error for that pattern, and Cabinet's
// own ThemeInitializer already applies theme classes from localStorage, so
// next-themes' script is redundant here. Loading the provider client-only
// keeps the API but skips the SSR-rendered script tag.
const NextThemesProvider = dynamic(
  () => import("next-themes").then((m) => m.ThemeProvider),
  { ssr: false }
);

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProviderType>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
