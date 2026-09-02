import { Alert as MuiAlert } from "@mui/material";
import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  type?: AlertType;
};

// Shape and member names preserved — 42 call sites import this enum.
export enum AlertType {
  ALERT,
  INFO,
}

export function Alert({ children, type = AlertType.ALERT }: Props) {
  // @bwp-web/styles disables MUI's "filled" and "outlined" Alert variants
  // (see AlertPropsVariantOverrides in its augmentations) — "standard" is
  // the only variant this design system supports for Alert.
  return (
    <MuiAlert severity={type === AlertType.INFO ? "info" : "warning"} sx={{ width: "100%" }}>
      {children}
    </MuiAlert>
  );
}
