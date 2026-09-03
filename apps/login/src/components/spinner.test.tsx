import { renderWithTheme } from "@/test-utils/render-with-theme";
import { cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Spinner } from "./spinner";

// No automatic RTL cleanup in this setup (test-setup.ts only imports jest-dom,
// vitest.config.ts does not set globals: true).
afterEach(cleanup);

describe("Spinner", () => {
  it("exposes a status role for assistive tech", () => {
    const { getByRole } = renderWithTheme(<Spinner />);

    expect(getByRole("status")).toBeInTheDocument();
  });

  it("forwards className, which all 17 call sites rely on for sizing until the Phase 4 sweep", () => {
    const { getByRole } = renderWithTheme(<Spinner className="mr-2 h-5 w-5" />);

    expect(getByRole("status")).toHaveClass("mr-2", "h-5", "w-5");
  });

  it("renders with no props at all", () => {
    const { getByRole } = renderWithTheme(<Spinner />);

    expect(getByRole("status")).toBeInTheDocument();
  });
});
