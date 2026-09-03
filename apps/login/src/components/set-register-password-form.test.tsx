import { renderWithTheme } from "@/test-utils/render-with-theme";
import { cleanup } from "@testing-library/react";
import { create } from "@zitadel/client";
import { PasswordComplexitySettingsSchema } from "@zitadel/proto/zitadel/settings/v2/password_settings_pb";
import { afterEach, describe, expect, test, vi } from "vitest";
import { SetRegisterPasswordForm } from "./set-register-password-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/lib/server/register", () => ({
  registerUser: vi.fn(),
}));

vi.mock("@/lib/client", () => ({
  handleServerActionResponse: vi.fn(),
}));

const defaultComplexitySettings = create(PasswordComplexitySettingsSchema, {
  // BigInt(8), not the `8n` literal: this file's tsconfig target predates
  // ES2020 BigInt literal syntax (TS2737) — BigInt(...) produces the same
  // value without relying on that syntax.
  minLength: BigInt(8),
  requiresUppercase: false,
  requiresLowercase: false,
  requiresNumber: false,
  requiresSymbol: false,
});

describe("SetRegisterPasswordForm", () => {
  afterEach(cleanup);

  test("should autofocus the password input on mount", () => {
    // Rendered through renderWithTheme (not a bare render) because the field
    // is now a LandingFormField/TextField, which reads the Biamp theme's
    // palette — see test-utils/render-with-theme.tsx.
    const { getByTestId } = renderWithTheme(
      <SetRegisterPasswordForm
        passwordComplexitySettings={defaultComplexitySettings}
        email="test@example.com"
        firstname="Test"
        lastname="User"
        organization="org-1"
      />,
    );
    expect(getByTestId("password-text-input")).toHaveFocus();
  });
});
