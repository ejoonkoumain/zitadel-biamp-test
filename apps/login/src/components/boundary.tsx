import { Box } from "@mui/material";
import { ReactNode } from "react";

type Color = "default" | "pink" | "blue" | "violet" | "cyan" | "orange" | "red";

const LABEL_COLORS: Record<Color, { bgcolor: string; color: string }> = {
  default: { bgcolor: "grey.800", color: "grey.500" },
  pink: { bgcolor: "#ec4899", color: "#fce7f3" },
  blue: { bgcolor: "#3b82f6", color: "#dbeafe" },
  cyan: { bgcolor: "#06b6d4", color: "#cffafe" },
  red: { bgcolor: "#ef4444", color: "#fee2e2" },
  violet: { bgcolor: "#8b5cf6", color: "#ede9fe" },
  orange: { bgcolor: "#f97316", color: "#ffedd5" },
};

const BORDER_COLORS: Record<Color, string> = {
  default: "divider",
  pink: "#ec4899",
  blue: "#3b82f6",
  cyan: "#06b6d4",
  red: "#ef4444",
  violet: "#8b5cf6",
  orange: "#f97316",
};

const Label = ({ children, color = "default" }: { children: ReactNode; color?: Color }) => {
  return <Box sx={{ borderRadius: 999, px: 0.75, ...LABEL_COLORS[color] }}>{children}</Box>;
};

export const Boundary = ({
  children,
  labels = ["children"],
  size = "default",
  color = "default",
}: {
  children: ReactNode;
  labels?: string[];
  size?: "small" | "default";
  color?: Color;
  animateRerendering?: boolean;
}) => {
  return (
    <Box
      sx={{
        position: "relative",
        borderRadius: 2,
        border: "1px dashed",
        borderColor: BORDER_COLORS[color],
        p: size === "small" ? { xs: 1.5, lg: 2.5 } : { xs: 2, lg: 4.5 },
        pb: size === "default" ? { lg: 3 } : undefined,
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: -8,
          left: size === "small" ? { xs: 1.5, lg: 2.5 } : { xs: 2, lg: 4.5 },
          display: "flex",
          gap: 0.5,
          fontSize: 9,
          lineHeight: "16px",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        {labels.map((label) => (
          <Label key={label} color={color}>
            {label}
          </Label>
        ))}
      </Box>

      {children}
    </Box>
  );
};
