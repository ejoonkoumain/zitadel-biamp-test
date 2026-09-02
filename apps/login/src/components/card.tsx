import { Paper } from "@mui/material";
import { HTMLAttributes, ReactNode, forwardRef } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(({ children, className, ...props }, ref) => (
  <Paper ref={ref} elevation={0} className={className} sx={{ p: 3, borderRadius: 2 }} {...props}>
    {children}
  </Paper>
));

Card.displayName = "Card";
