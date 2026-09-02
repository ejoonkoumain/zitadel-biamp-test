import { CircularProgress } from "@mui/material";
import { FC } from "react";

/**
 * className stays in the signature because all 17 call sites pass Tailwind
 * sizing utilities (e.g. "mr-2 h-5 w-5"). Those are removed in the Phase 4
 * sweep; until then the prop must keep being forwarded.
 *
 * color="inherit" (not a theme-aware palette color): 16 of the 17 call sites
 * render this immediately next to a button's label text
 * (`{loading && <Spinner .../>} <Translated .../>`), so the one thing that
 * actually matters is matching that label's color exactly — whatever variant
 * or color the surrounding Button happens to use, in either light or dark
 * theme. "inherit" does that by construction (it takes the CSS `color` of
 * its parent), whereas a fixed palette color like "primary" would render the
 * same brand color regardless of context and could disappear against a
 * same-colored button background. The one non-button call site
 * (idp-process-handler.tsx) loses the old explicit brand-color arc and picks
 * up the ambient body text color instead — a minor, pre-existing-look change,
 * not a regression in visibility or theme-awareness.
 */
export const Spinner: FC<{ className?: string }> = ({ className = "" }) => (
  <CircularProgress role="status" size={20} className={className} color="inherit" />
);
