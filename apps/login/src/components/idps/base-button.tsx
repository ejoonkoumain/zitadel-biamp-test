"use client";

import { Box, Button } from "@mui/material";
import { ButtonHTMLAttributes, DetailedHTMLProps, forwardRef } from "react";
import { useFormStatus } from "react-dom";
import { Spinner } from "../spinner";

export type SignInWithIdentityProviderProps = DetailedHTMLProps<
  ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
> & {
  name?: string;
  e2e?: string;
};

/**
 * Shared chrome for every third-party sign-in button: a neutral "card"
 * button — themed background + border, full width of its enclosing form —
 * that disables itself and shows a spinner while that form is submitting.
 *
 * The border/background here are theme colours, not brand colours: each
 * provider's brand identity lives entirely in its own SVG logo (see the
 * sibling sign-in-with-*.tsx files), not in this shared chrome.
 */
export const BaseButton = forwardRef<HTMLButtonElement, SignInWithIdentityProviderProps>(function BaseButton(
  { children, ...props },
  ref,
) {
  const formStatus = useFormStatus();

  return (
    <Button
      {...props}
      type="submit"
      ref={ref}
      disabled={formStatus.pending}
      variant="outlined"
      color="inherit"
      sx={{
        width: "100%",
        minHeight: 56,
        justifyContent: "flex-start",
        textAlign: "left",
        textTransform: "none",
        color: "text.primary",
        bgcolor: "background.paper",
        borderColor: "divider",
        px: 2,
        "&:hover": {
          bgcolor: "background.paper",
          borderColor: "text.primary",
        },
      }}
    >
      <Box sx={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "space-between", gap: 2 }}>
        <Box sx={{ display: "flex", flex: 1, flexDirection: "row", alignItems: "center" }}>{children}</Box>
        {formStatus.pending && <Spinner />}
      </Box>
    </Button>
  );
});
