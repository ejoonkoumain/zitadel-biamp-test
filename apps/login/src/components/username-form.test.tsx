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
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/lib/server/loginname", () => ({
  sendLoginname: vi.fn(async () => ({})),
}));

const baseProps = {
  loginName: undefined,
  requestId: undefined,
  loginSettings: undefined,
  submit: false,
  allowRegister: true,
};

describe("UsernameForm", () => {
  it("puts data-testid on the input element itself, so Playwright can type into it", () => {
    const { getByTestId } = renderWithTheme(<UsernameForm {...baseProps} />);

    // acceptance/tests/loginname-screen.ts calls pressSequentially() and
    // toHaveValue() on this testid; both need the real <input>.
    expect(getByTestId("username-text-input").tagName).toBe("INPUT");
  });

  it("renders the submit button with its testid, and a back button", () => {
    const { getByTestId, getByRole } = renderWithTheme(<UsernameForm {...baseProps} />);

    expect(getByTestId("submit-button")).toBeInTheDocument();
    // NOTE: BackButton (./back-button.tsx) takes no props and does not yet
    // forward `data-testid` to its rendered element — that only happens once
    // it is rebuilt on an MUI primitive in a later task. The call site here
    // still passes data-testid="back-button" (preserving the attribute so
    // wiring lights up automatically once BackButton forwards it), but until
    // then the testid does not land in the DOM. This is a pre-existing gap
    // outside this task's scope, and it is not exercised by the acceptance
    // suite (no `getByTestId("back-button")` anywhere under
    // apps/login/acceptance/), so it is verified here via role instead.
    expect(getByRole("button", { name: "back" })).toBeInTheDocument();
  });

  it("renders the register button when registration is allowed", () => {
    const { getByTestId } = renderWithTheme(<UsernameForm {...baseProps} />);

    expect(getByTestId("register-button")).toBeInTheDocument();
  });

  it("hides the register button when registration is not allowed", () => {
    const { queryByTestId } = renderWithTheme(<UsernameForm {...baseProps} allowRegister={false} />);

    expect(queryByTestId("register-button")).not.toBeInTheDocument();
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
