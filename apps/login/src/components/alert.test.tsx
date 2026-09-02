import { cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { renderWithTheme } from "@/test-utils/render-with-theme";
import { Alert, AlertType } from "./alert";

// This setup has no automatic RTL cleanup (test-setup.ts only imports jest-dom,
// vitest.config.ts does not set globals: true), so DOM persists across it()
// blocks and duplicate queries collide.
afterEach(cleanup);

describe("Alert", () => {
  it("renders its children inside a div root, which acceptance's getByTestId('error').locator('div') needs", () => {
    const { getByRole } = renderWithTheme(<Alert>Something went wrong</Alert>);
    const alert = getByRole("alert");

    expect(alert.tagName).toBe("DIV");
    expect(alert).toHaveTextContent("Something went wrong");
  });

  it("defaults to the warning severity", () => {
    const { getByRole } = renderWithTheme(<Alert>warn</Alert>);

    expect(getByRole("alert").className).toMatch(/Warning/);
  });

  it("renders the info severity when asked", () => {
    const { getByRole } = renderWithTheme(<Alert type={AlertType.INFO}>info</Alert>);

    expect(getByRole("alert").className).toMatch(/Info/);
  });
});
