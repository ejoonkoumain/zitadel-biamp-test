import { Box } from "@mui/material";
import { ReactNode } from "react";

// The gradient references MUI's CSS custom properties by name rather than
// reading them through an `sx` theme callback.
//
// This is load-bearing, not stylistic. `Skeleton` is the `(login)` layout's
// `Suspense` fallback, so it is rendered from a Server Component — and an `sx`
// callback is a *function*, which React cannot serialise across the
// server/client boundary. A callback here made every `(login)` route return
// HTTP 500 with "Functions cannot be passed directly to Client Components".
// The production build did not catch it, because it only fails at runtime.
//
// `biampTheme` sets `cssVariables`, so these variables exist and are redefined
// under the dark colour scheme's class selector — the shimmer therefore still
// flips between light and dark automatically, exactly as the old
// `.dark .skeleton` override did, with no function and no "use client".
const SHIMMER = [
  "linear-gradient(270deg,",
  "var(--mui-palette-background-paper),",
  "var(--mui-palette-background-default),",
  "var(--mui-palette-background-default),",
  "var(--mui-palette-background-paper))",
].join(" ");

/**
 * Loading placeholder used as the `(login)` layout's `Suspense` fallback.
 * Reimplements the shimmer that used to live in `globals.scss`'s `.skeleton`
 * class (deleted in Task 19).
 */
export function Skeleton({ children }: { children?: ReactNode }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 2,
        px: 4,
        py: 6,
        backgroundImage: SHIMMER,
        backgroundSize: "400% 100%",
        animation: "skeleton-loading 8s ease-in-out infinite",
        "@keyframes skeleton-loading": {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      }}
    >
      {children}
    </Box>
  );
}
