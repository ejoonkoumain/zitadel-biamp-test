import { Button as MuiButton } from "@mui/material";
import { ButtonHTMLAttributes, DetailedHTMLProps, forwardRef } from "react";

// All three enums keep their exact member names — 25 call sites import them.
export enum ButtonSizes {
  Small = "Small",
  Large = "Large",
}

export enum ButtonVariants {
  Primary = "Primary",
  Secondary = "Secondary",
  Destructive = "Destructive",
}

export enum ButtonColors {
  Neutral = "Neutral",
  Primary = "Primary",
  Warn = "Warn",
}

export type ButtonProps = DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> & {
  size?: ButtonSizes;
  variant?: ButtonVariants;
  color?: ButtonColors;
};

function muiVariant(variant: ButtonVariants) {
  return variant === ButtonVariants.Primary ? "contained" : "outlined";
}

function muiColor(variant: ButtonVariants, color: ButtonColors) {
  if (variant === ButtonVariants.Destructive || color === ButtonColors.Warn) return "error" as const;
  if (color === ButtonColors.Neutral) return "inherit" as const;
  return "primary" as const;
}

// MUI's color="inherit" resolves to a static `color: inherit; borderColor:
// currentColor` that never consults the theme (verified in MUI's Button.js) —
// it just takes whatever text colour happens to be ambient in the DOM. That
// is harmless today because Neutral buttons currently sit on plain white
// content cards, but it will silently break the moment a Neutral button is
// placed on LandingShell's dark background in Phase 4, since LandingShell
// never establishes an ambient text colour for a child to inherit — every
// piece of text in it sets its own explicit MUI colour. Pin Neutral to
// text.primary via sx so it tracks light/dark mode through the theme instead
// of through inheritance.
const neutralSx = { color: "text.primary", borderColor: "text.primary" };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = ButtonVariants.Primary,
      size = ButtonSizes.Small,
      color = ButtonColors.Primary,
      type = "button",
      className,
      ...props
    },
    ref,
  ) => (
    <MuiButton
      ref={ref}
      type={type}
      variant={muiVariant(variant)}
      color={muiColor(variant, color)}
      size={size === ButtonSizes.Large ? "large" : "medium"}
      sx={color === ButtonColors.Neutral ? neutralSx : undefined}
      className={className}
      {...props}
    >
      {children}
    </MuiButton>
  ),
);

Button.displayName = "Button";
