import { biampTheme } from "@bwp-web/styles";
import { cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test-utils/render-with-theme";
import { Button, ButtonSizes, ButtonVariants, ButtonColors } from "./button";

// No automatic RTL cleanup in this setup (test-setup.ts only imports jest-dom,
// vitest.config.ts does not set globals: true).
afterEach(cleanup);

describe("Button", () => {
  it("renders its children", () => {
    const { getByRole } = renderWithTheme(<Button>Continue</Button>);

    expect(getByRole("button", { name: "Continue" })).toBeInTheDocument();
  });

  it("defaults to type=button so it never submits a form by accident", () => {
    const { getByRole } = renderWithTheme(<Button>Continue</Button>);

    expect(getByRole("button")).toHaveAttribute("type", "button");
  });

  it("honours an explicit type", () => {
    const { getByRole } = renderWithTheme(<Button type="submit">Go</Button>);

    expect(getByRole("button")).toHaveAttribute("type", "submit");
  });

  it("fires onClick", () => {
    const onClick = vi.fn();
    const { getByRole } = renderWithTheme(<Button onClick={onClick}>Go</Button>);
    getByRole("button").click();

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not fire onClick when disabled", () => {
    const onClick = vi.fn();
    const { getByRole } = renderWithTheme(
      <Button onClick={onClick} disabled>
        Go
      </Button>,
    );
    getByRole("button").click();

    expect(onClick).not.toHaveBeenCalled();
  });

  it("accepts every variant, size and colour combination without throwing", () => {
    for (const variant of Object.values(ButtonVariants)) {
      for (const size of Object.values(ButtonSizes)) {
        for (const color of Object.values(ButtonColors)) {
          const { unmount } = renderWithTheme(
            <Button variant={variant} size={size} color={color}>
              x
            </Button>,
          );
          unmount();
        }
      }
    }
  });

  it("forwards a ref to the button element", () => {
    const nodeRef: { current: HTMLButtonElement | null } = { current: null };
    renderWithTheme(
      <Button
        ref={(el) => {
          nodeRef.current = el;
        }}
      >
        x
      </Button>,
    );

    expect(nodeRef.current?.tagName).toBe("BUTTON");
  });

  it("passes data-testid through to the button element", () => {
    const { getByTestId } = renderWithTheme(<Button data-testid="submit-button">x</Button>);

    expect(getByTestId("submit-button").tagName).toBe("BUTTON");
  });

  it("forwards className, which call sites still rely on until the Phase 4 sweep", () => {
    const { getByRole } = renderWithTheme(<Button className="self-end">x</Button>);

    // MUI merges its own classes in, so assert containment rather than equality.
    expect(getByRole("button")).toHaveClass("self-end");
  });

  it("colours the Neutral variant from the theme rather than by ambient inheritance", () => {
    const theme = biampTheme();
    // biampTheme runs MUI's CSS-variables engine, so theme.vars.palette.text.primary
    // is itself a "var(--mui-palette-text-primary, #111111)" string. jsdom's
    // getComputedStyle resolves that fine when the fallback is present (see
    // theme-smoke.test.tsx), but MUI's sx shorthand ("text.primary") emits the
    // bare var() reference without a fallback, which jsdom reports verbatim
    // instead of resolving — so compare against that same bare reference,
    // derived from the theme rather than hardcoded, instead of a resolved rgb().
    const cssVarName = theme.vars?.palette.text.primary.match(/var\((--[\w-]+)/)?.[1];
    expect(cssVarName).toBeDefined();

    // Wrap in an ancestor with a loud, unrelated text colour. MUI's
    // color="inherit" is a literal `color: inherit` that never consults the
    // theme (verified in @mui/material's Button.js) — if Neutral fell back to
    // it, this button would resolve to the wrapper's red, exactly the bug that
    // would surface on LandingShell's dark background in Phase 4. Pinning it
    // via sx to theme.palette.text.primary must win over that inheritance.
    const { getByRole } = renderWithTheme(
      <div style={{ color: "red" }}>
        <Button variant={ButtonVariants.Secondary} color={ButtonColors.Neutral}>
          Back
        </Button>
      </div>,
    );

    const color = getComputedStyle(getByRole("button", { name: "Back" })).color;
    expect(color).toBe(`var(${cssVarName})`);
    expect(color).not.toBe("rgb(255, 0, 0)");
  });
});
