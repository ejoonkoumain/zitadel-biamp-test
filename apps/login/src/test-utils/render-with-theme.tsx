import { biampTheme } from "@bwp-web/styles";
import { ThemeProvider } from "@mui/material/styles";
import { render, type RenderOptions } from "@testing-library/react";
import { type ReactElement, type ReactNode } from "react";

// Built once — biampTheme() is not cheap, and every test shares one instance.
const theme = biampTheme();

function Providers({ children }: { children: ReactNode }) {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}

/**
 * render() with the Biamp MUI theme in scope. Any component that reads the
 * theme — every migrated primitive — must be rendered through this, not
 * through @testing-library/react's bare render.
 */
export function renderWithTheme(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  return render(ui, { wrapper: Providers, ...options });
}

export * from "@testing-library/react";
// Deliberately overrides the `render` re-exported above: importing `render`
// from this module must never give you the unwrapped version, which would
// silently drop biampTheme and fail later in confusing ways.
export { renderWithTheme as render };
