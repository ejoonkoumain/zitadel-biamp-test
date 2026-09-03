import { renderWithTheme } from "@/test-utils/render-with-theme";
import { cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LandingShell } from "./landing-shell";

// This test setup has NO automatic RTL cleanup (test-setup.ts only imports
// jest-dom, and vitest.config.ts does not set globals: true), so rendered DOM
// would otherwise persist across it() blocks. Every render below emits the same
// copyright footer, so without this the footer test finds multiple matches.
afterEach(cleanup);

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "light", setTheme: vi.fn(), theme: "light" }),
}));

describe("LandingShell", () => {
  it("renders its children", () => {
    const { getByText } = renderWithTheme(
      <LandingShell>
        <p>form goes here</p>
      </LandingShell>,
    );

    expect(getByText("form goes here")).toBeInTheDocument();
  });

  it("renders the hero title and subtitle when given", () => {
    const { getByText } = renderWithTheme(
      <LandingShell title="Welcome to Workplace" subtitle="Manage every space effortlessly.">
        <p>child</p>
      </LandingShell>,
    );

    expect(getByText("Welcome to Workplace")).toBeInTheDocument();
    expect(getByText("Manage every space effortlessly.")).toBeInTheDocument();
  });

  it("omits the hero entirely when no title is given", () => {
    // Scoped to level 1: the persistent top lockup (BiampHeaderTitle,
    // "Workplace") always renders its own heading — an <h4>, since that's
    // the variant it hardcodes — regardless of this prop, so a bare
    // `queryByRole("heading")` would find it and this assertion would fail
    // even when the shell is behaving correctly. The hero itself is the only
    // <h1> the shell ever renders (see the `variant="h1"` comment in
    // landing-shell.tsx), so restricting to level 1 tests what this case is
    // actually about: no *hero* heading when no hero title is given.
    const { queryByRole } = renderWithTheme(
      <LandingShell>
        <p>child</p>
      </LandingShell>,
    );

    expect(queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
  });

  it("renders the copyright footer", () => {
    const year = new Date().getFullYear();
    const { getByText } = renderWithTheme(
      <LandingShell>
        <p>child</p>
      </LandingShell>,
    );

    expect(getByText(`© ${year} Biamp Systems LLC.`)).toBeInTheDocument();
  });

  it("renders help text under the panel when given", () => {
    const { getByText } = renderWithTheme(
      <LandingShell helpText="Trouble signing in?">
        <p>child</p>
      </LandingShell>,
    );

    expect(getByText("Trouble signing in?")).toBeInTheDocument();
  });

  it("renders footer actions when given", () => {
    const { getByTestId } = renderWithTheme(
      <LandingShell actions={<button data-testid="lang-switcher">EN</button>}>
        <p>child</p>
      </LandingShell>,
    );

    expect(getByTestId("lang-switcher")).toBeInTheDocument();
  });

  it("caps the content column at the design's panel width", () => {
    // Regression guard. `alert.tsx` sets width: 100% so it fills a
    // LandingFormPanel, and /mfa, /u2f and /passkey render an Alert as a direct
    // child of the shell. Without this cap that rule stretched the alert
    // edge-to-edge across the viewport on all three routes — a defect no
    // existing assertion could see, because the DOM was entirely correct.
    const { getByTestId } = renderWithTheme(
      <LandingShell>
        <p data-testid="shell-child">child</p>
      </LandingShell>,
    );
    const column = getByTestId("shell-child").parentElement;

    expect(column).not.toBeNull();
    expect(getComputedStyle(column as HTMLElement).maxWidth).toBe("441px");
  });
});
