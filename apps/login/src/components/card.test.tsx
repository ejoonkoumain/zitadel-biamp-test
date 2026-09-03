import { renderWithTheme } from "@/test-utils/render-with-theme";
import { cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Card } from "./card";

// No automatic RTL cleanup in this setup (test-setup.ts only imports jest-dom,
// vitest.config.ts does not set globals: true).
afterEach(cleanup);

describe("Card", () => {
  it("renders its children", () => {
    const { getByText } = renderWithTheme(<Card>content</Card>);

    expect(getByText("content")).toBeInTheDocument();
  });

  it("renders multiple children", () => {
    const { getByText } = renderWithTheme(
      <Card>
        <h1>Title</h1>
        <p>Description</p>
      </Card>,
    );

    expect(getByText("Title")).toBeInTheDocument();
    expect(getByText("Description")).toBeInTheDocument();
  });

  it("passes through arbitrary div attributes, including data-testid", () => {
    const { getByTestId } = renderWithTheme(<Card data-testid="the-card">content</Card>);

    expect(getByTestId("the-card")).toBeInTheDocument();
  });

  it("forwards a ref to the root element", () => {
    const ref = { current: null as HTMLDivElement | null };
    renderWithTheme(<Card ref={ref}>content</Card>);

    expect(ref.current?.tagName).toBe("DIV");
  });

  it("forwards className, which call sites still rely on until the Phase 4 sweep", () => {
    const { getByTestId } = renderWithTheme(
      <Card data-testid="c" className="mt-4">
        content
      </Card>,
    );

    expect(getByTestId("c")).toHaveClass("mt-4");
  });
});
