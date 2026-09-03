"use client";

import { Box } from "@mui/material";
import { ReactNode } from "react";

export enum BadgeState {
  Info = "info",
  Error = "error",
  Success = "success",
  Alert = "alert",
}

export type StateBadgeProps = {
  state: BadgeState;
  children: ReactNode;
  evenPadding?: boolean;
};

// "Alert" maps to MUI's `warning` palette — there's no separate "alert" key,
// and this state was always semantically a warning colour (amber), not an
// error (red, which BadgeState.Error already owns).
const PALETTE_KEY: Record<BadgeState, "success" | "info" | "error" | "warning"> = {
  [BadgeState.Success]: "success",
  [BadgeState.Info]: "info",
  [BadgeState.Error]: "error",
  [BadgeState.Alert]: "warning",
};

export function StateBadge({ state = BadgeState.Success, evenPadding = false, children }: StateBadgeProps) {
  const key = PALETTE_KEY[state];

  return (
    <Box
      component="span"
      sx={(theme) => ({
        display: "inline-flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        width: "fit-content",
        whiteSpace: "nowrap",
        letterSpacing: "0.05em",
        lineHeight: "16px",
        height: "18.5px",
        px: evenPadding ? "2px" : 1,
        py: "2px",
        fontSize: 12,
        borderRadius: 999,
        boxShadow: theme.shadows[1],
        bgcolor: `${key}.light`,
        color: `${key}.dark`,
        ...theme.applyStyles("dark", {
          bgcolor: `${key}.dark`,
          color: `${key}.light`,
        }),
      })}
    >
      {children}
    </Box>
  );
}
