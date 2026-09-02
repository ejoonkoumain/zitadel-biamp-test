"use client";

import { BiampLogo, LandingPageBackground } from "@bwp-web/assets";
import { BiampHeaderTitle } from "@bwp-web/components";
import { Box, Stack, Typography } from "@mui/material";
import { type ReactNode } from "react";

export type LandingShellProps = {
  /** Hero heading. Omit for interior steps that need no page title. */
  title?: ReactNode;
  /** Supporting line under the hero heading. */
  subtitle?: ReactNode;
  /** The form panel. */
  children: ReactNode;
  /** Help text rendered under the panel, e.g. "Trouble signing in?". */
  helpText?: ReactNode;
  /** Language switcher / theme switch, rendered in the footer. */
  actions?: ReactNode;
};

/**
 * Page chrome for every `/(login)` screen: full-bleed background, a centred
 * Biamp/Workplace logo lockup, an optional hero heading + subtitle, the form
 * panel (supplied by the caller as `children`), optional help text under the
 * panel, and a Biamp logo + copyright footer.
 *
 * This component owns layout only. It knows nothing about forms, auth, or
 * routes — those are the caller's job (see Task 6, which wires this into
 * `/loginname`).
 */
export function LandingShell({ title, subtitle, children, helpText, actions }: LandingShellProps) {
  return (
    <Box sx={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/*
       * The Storybook reference (LoginLandingPage.stories.tsx) positions this
       * with `position: absolute; z-index: 0` — solely because Storybook's
       * preview decorator paints its own background, and a genuinely negative
       * z-index would put the image behind it. There is no such decorator
       * here: the real page uses `position: fixed` (so the image stays put
       * under scroll, e.g. if the panel content grows taller than the
       * viewport) and `zIndex: -1` (so it sits behind the page's own content
       * without needing every other element to opt into a stacking context).
       */}
      <Box
        aria-hidden
        sx={{
          position: "fixed",
          inset: 0,
          zIndex: -1,
          backgroundImage: `url("${LandingPageBackground}")`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* The header's logo lockup, centred at the top of the page instead of
          in a header bar. The 24px padding keeps roughly the 64px band the
          header occupied, so the vertically-centred hero below it does not
          shift. */}
      <Stack alignItems="center" py={3}>
        <BiampHeaderTitle title="Workplace" sx={{ "& .MuiTypography-root": { color: "#ffffff" } }} />
      </Stack>

      <Stack flex={1} alignItems="center" justifyContent="center" gap="54px" py={4}>
        {title && (
          <Stack alignItems="center" gap="21px" px={2} maxWidth={441}>
            {/* `h1` for the Montserrat family and the page-title semantics;
                the rest is overridden because no theme variant is 36px/600 —
                the scale jumps from `h1` (28px/500) to `h0` (56px/500). */}
            <Typography
              variant="h1"
              color="common.white"
              textAlign="center"
              sx={{ fontSize: 36, fontWeight: 600, lineHeight: 1, letterSpacing: "-1.44px" }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body1" color="text.sidebar" textAlign="center">
                {subtitle}
              </Typography>
            )}
          </Stack>
        )}

        <Stack alignItems="center" gap={2.5} width="100%">
          {children}
          {helpText && (
            <Typography variant="body2" color="text.secondary" textAlign="center" px={2} maxWidth={441}>
              {helpText}
            </Typography>
          )}
        </Stack>
      </Stack>

      <Stack alignItems="center" gap={1} py={2}>
        {actions && (
          <Stack direction="row" alignItems="center" gap={2} pb={1}>
            {actions}
          </Stack>
        )}
        <BiampLogo style={{ width: 76, height: "auto", color: "#ffffff" }} />
        <Typography variant="caption" color="text.secondary">
          {`© ${new Date().getFullYear()} Biamp Systems LLC.`}
        </Typography>
      </Stack>
    </Box>
  );
}
