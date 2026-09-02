"use client";

import { biampTheme } from "@bwp-web/styles";
import { CssBaseline, ThemeProvider as MuiThemeProvider } from "@mui/material";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ReactNode } from "react";

const theme = biampTheme();

/**
 * Root provider stack for the app. Order matters, outside-in:
 *
 * 1. AppRouterCacheProvider — must be outermost. It installs the Emotion
 *    cache used by every styled/MUI component below it and flushes
 *    server-inserted <style> tags during SSR/streaming so Emotion's classes
 *    are present in the initial HTML instead of popping in after hydration
 *    (which would flash unstyled content and mismatch on hydrate). Anything
 *    that reads the theme must render inside it.
 *
 * 2. NextThemesProvider (attribute="class") — the sole owner of light/dark
 *    mode. It toggles `class="light" | "dark"` on <html> at runtime (and,
 *    via its injected inline script, before hydration, avoiding a flash of
 *    the wrong scheme). biampTheme() sets `cssVariables.colorSchemeSelector:
 *    "class"`, which makes MUI emit its color-scheme CSS under plain
 *    `.light` / `.dark` selectors (NOT `.mui-light` / `.mui-dark` — verified
 *    against @mui/material's createGetSelector, which turns
 *    colorSchemeSelector: "class" into the literal rule ".%s" filled in with
 *    the scheme name). That means next-themes' class and MUI's generated
 *    selectors already agree with no bridging code, no
 *    InitColorSchemeScript, and no defaultMode/defaultColorScheme override
 *    needed — next-themes writing the class is sufficient for MUI's
 *    variables to switch.
 *
 * 3. MuiThemeProvider — supplies the biampTheme() instance (and its CSS
 *    variables/color-scheme stylesheet) to everything below it.
 *
 * 4. CssBaseline — MANDATORY, not optional polish. biampTheme() injects its
 *    @font-face rules (Montserrat, Open Sans, from @bwp-web/assets) through
 *    MuiCssBaseline.styleOverrides. Without <CssBaseline /> mounted, those
 *    @font-face rules never reach the page and no Biamp font loads, even
 *    though the rest of the theme (palette, components) still appears to
 *    work. It must render inside MuiThemeProvider so it can read the theme's
 *    styleOverrides, and before `children` so the reset applies first.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ key: "mui" }}>
      <NextThemesProvider attribute="class" enableSystem>
        <MuiThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </MuiThemeProvider>
      </NextThemesProvider>
    </AppRouterCacheProvider>
  );
}
