import { renderWithTheme } from "@/test-utils/render-with-theme";
import { cleanup, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UsernameForm } from "./username-form";

// This setup has no automatic RTL cleanup (test-setup.ts only imports jest-dom,
// vitest.config.ts does not set globals: true), so DOM would persist across
// it() blocks and duplicate every testid.
afterEach(cleanup);

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

// UsernameForm and the Translated/BackButton components it renders all call
// next-intl's useTranslations(), which needs a NextIntlClientProvider that
// renderWithTheme (theme-only) does not supply. Every other component test in
// this codebase mocks next-intl the same way (see change-password-form.test.tsx).
vi.mock("next-intl", () => ({
  // Every key maps to itself, EXCEPT "placeholder": the design-copy test below
  // asserts the actual placeholder text ("you@acme.com" per locales/en.json),
  // so it needs a real value rather than the literal key back.
  useTranslations: () => (key: string) => (key === "placeholder" ? "you@acme.com" : key),
}));

vi.mock("@/lib/server/loginname", () => ({
  sendLoginname: vi.fn(async () => ({})),
}));

const baseProps = {
  loginName: undefined,
  requestId: undefined,
  loginSettings: undefined,
  submit: false,
};

describe("UsernameForm", () => {
  it("puts data-testid on the input element itself, so Playwright can type into it", () => {
    const { getByTestId } = renderWithTheme(<UsernameForm {...baseProps} />);

    // acceptance/tests/loginname-screen.ts calls pressSequentially() and
    // toHaveValue() on this testid; both need the real <input>.
    expect(getByTestId("username-text-input").tagName).toBe("INPUT");
  });

  it("renders the submit button with its testid, and no back or register control", () => {
    const { getByTestId, queryByRole, queryByTestId } = renderWithTheme(<UsernameForm {...baseProps} />);

    expect(getByTestId("submit-button")).toBeInTheDocument();
    // The design (Task 6B) drops both the "Back" and "Register new user"
    // controls from this page; /register stays reachable by direct URL only.
    expect(queryByRole("button", { name: "back" })).not.toBeInTheDocument();
    expect(queryByTestId("register-button")).not.toBeInTheDocument();
  });

  it("shows the design's email placeholder", () => {
    const { getByPlaceholderText } = renderWithTheme(<UsernameForm {...baseProps} />);

    expect(getByPlaceholderText("you@acme.com")).toBeInTheDocument();
  });

  it("wires react-hook-form to the real input, so typing enables the submit button", async () => {
    // THE regression guard for the inputRef bug described in the task prompt.
    const { getByTestId } = renderWithTheme(<UsernameForm {...baseProps} />);
    const input = getByTestId("username-text-input") as HTMLInputElement;

    expect(getByTestId("submit-button")).toBeDisabled();

    fireEvent.input(input, { target: { value: "jane.doe@acme.com" } });

    await waitFor(() => expect(getByTestId("submit-button")).not.toBeDisabled());
  });

  it("autofocuses the loginName input on mount", () => {
    // Pre-existing coverage carried over from the Tailwind-era version of this
    // file (git history), rendered through renderWithTheme instead of a bare
    // render now that the field needs biampTheme in scope. `autoFocus` only
    // reaches the DOM if it survives on the real <input>, so this doubles as
    // another check that `inputRef`/testid wiring lands on the right element.
    const { getByTestId } = renderWithTheme(<UsernameForm {...baseProps} />);
    expect(getByTestId("username-text-input")).toHaveFocus();
  });
});
