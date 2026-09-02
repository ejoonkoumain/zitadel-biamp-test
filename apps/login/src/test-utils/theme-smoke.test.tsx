import { biampTheme } from "@bwp-web/styles";
import { Button } from "@mui/material";
import { describe, expect, it } from "vitest";
import { render, renderWithTheme } from "./render-with-theme";

// biampTheme resolves palette colors as "#rrggbb" hex strings; jsdom's
// getComputedStyle reports resolved colors as "rgb(r, g, b)", so the two
// need converting before they can be compared.
function hexToRgb(hex: string): string {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

describe("biampTheme under React 19 + Vitest", () => {
  it("renders an MUI component and applies theme-generated classes", () => {
    const { getByRole } = renderWithTheme(<Button>Sign in</Button>);
    const button = getByRole("button", { name: "Sign in" });

    expect(button.className).toMatch(/Mui/);
  });

  it("resolves a real biampTheme palette value onto a rendered component's computed style", () => {
    // This is the assertion that actually proves the stack works end to end:
    // biampTheme() -> MUI's CSS-variables engine -> an emotion <style> tag ->
    // jsdom's CSS cascade -> getComputedStyle. A vacuous test could pass with
    // a broken theme; this one cannot, because it checks against the theme's
    // own palette value rather than a hardcoded color.
    const theme = biampTheme();
    const { getByRole } = renderWithTheme(
      <Button variant="contained" color="primary">
        Save
      </Button>,
    );
    const button = getByRole("button", { name: "Save" });

    expect(getComputedStyle(button).backgroundColor).toBe(hexToRgb(theme.palette.primary.main));
  });

  it("overrides the bare `render` export so importing it still gets the themed version", () => {
    // Regression guard: render-with-theme.tsx does `export * from "@testing-library/react"`
    // and then a later `export { renderWithTheme as render }` to win over it. If that
    // override were ever lost, `render` here would resolve back to the unwrapped
    // Testing Library render, no theme would be in scope, and this assertion would fail.
    const theme = biampTheme();
    const { getByRole } = render(
      <Button variant="contained" color="primary">
        Continue
      </Button>,
    );
    const button = getByRole("button", { name: "Continue" });

    expect(getComputedStyle(button).backgroundColor).toBe(hexToRgb(theme.palette.primary.main));
  });
});
