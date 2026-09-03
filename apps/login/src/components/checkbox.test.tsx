import { renderWithTheme } from "@/test-utils/render-with-theme";
import { cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Checkbox } from "./checkbox";

// No automatic RTL cleanup in this setup (test-setup.ts only imports jest-dom,
// vitest.config.ts does not set globals: true).
afterEach(cleanup);

describe("Checkbox", () => {
  it("renders an accessible checkbox", () => {
    const { getByRole } = renderWithTheme(<Checkbox checked={false} />);

    expect(getByRole("checkbox")).toBeInTheDocument();
  });

  it("reflects the checked prop", () => {
    const { getByRole } = renderWithTheme(<Checkbox checked />);

    expect(getByRole("checkbox")).toBeChecked();
  });

  it("calls onChangeVal with the new state when toggled", () => {
    const onChangeVal = vi.fn();
    const { getByRole } = renderWithTheme(<Checkbox checked={false} onChangeVal={onChangeVal} />);
    getByRole("checkbox").click();

    expect(onChangeVal).toHaveBeenCalledWith(true);
  });

  it("re-syncs its local state when the checked prop changes, which privacy-policy-checkboxes relies on", () => {
    const { getByRole, rerender } = renderWithTheme(<Checkbox checked={false} />);
    rerender(<Checkbox checked />);

    expect(getByRole("checkbox")).toBeChecked();
  });

  it("renders children beside the box", () => {
    const { getByText } = renderWithTheme(
      <Checkbox checked={false}>
        <span>I accept the terms</span>
      </Checkbox>,
    );

    expect(getByText("I accept the terms")).toBeInTheDocument();
  });

  it("passes data-* attributes through to the input element", () => {
    const { getByTestId } = renderWithTheme(<Checkbox checked={false} data-testid="accept" />);

    expect(getByTestId("accept").tagName).toBe("INPUT");
  });

  it("does not fire onChangeVal when disabled", () => {
    const onChangeVal = vi.fn();
    const { getByRole } = renderWithTheme(<Checkbox checked={false} disabled onChangeVal={onChangeVal} />);
    getByRole("checkbox").click();

    expect(onChangeVal).not.toHaveBeenCalled();
  });
});
