import { renderWithTheme } from "@/test-utils/render-with-theme";
import { cleanup } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { PasswordForm } from "./password-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/lib/server/password", () => ({
  sendPassword: vi.fn(),
  resetPassword: vi.fn(),
}));

describe("PasswordForm", () => {
  afterEach(cleanup);

  test("should autofocus the password input on mount", () => {
    // Rendered through renderWithTheme (not a bare render) because the field
    // is now a LandingFormField/TextField, which reads the Biamp theme's
    // palette (e.g. dividers.secondary) — see test-utils/render-with-theme.tsx.
    const { getByTestId } = renderWithTheme(<PasswordForm loginSettings={undefined} loginName="test@example.com" />);
    expect(getByTestId("password-text-input")).toHaveFocus();
  });

  test("puts data-testid on the input element itself, so Playwright can type into it", () => {
    const { getByTestId } = renderWithTheme(<PasswordForm loginSettings={undefined} loginName="test@example.com" />);
    expect(getByTestId("password-text-input").tagName).toBe("INPUT");
  });
});
