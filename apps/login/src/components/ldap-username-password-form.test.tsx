import { renderWithTheme } from "@/test-utils/render-with-theme";
import { cleanup } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { LDAPUsernamePasswordForm } from "./ldap-username-password-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/lib/server/idp", () => ({
  createNewSessionForLDAP: vi.fn(),
}));

describe("LDAPUsernamePasswordForm", () => {
  afterEach(cleanup);

  // Now rendered via LandingFormPanel/LandingFormField (@bwp-web/components),
  // which read the MUI theme — renderWithTheme replaces the bare `render()`
  // this test used before that conversion (see username-form.test.tsx for
  // the same requirement on an equivalent form).
  test("should autofocus the username input on mount", () => {
    const { getByTestId } = renderWithTheme(<LDAPUsernamePasswordForm idpId="idp-1" link={false} />);
    expect(getByTestId("username-text-input")).toHaveFocus();
  });
});
