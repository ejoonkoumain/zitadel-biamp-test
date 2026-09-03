import { renderWithTheme } from "@/test-utils/render-with-theme";
import { cleanup, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TextInput } from "./input";

// No automatic RTL cleanup in this setup (test-setup.ts only imports jest-dom,
// vitest.config.ts does not set globals: true).
afterEach(cleanup);

describe("TextInput", () => {
  it("forwards data-testid onto the input element, not a wrapper", () => {
    const { getByTestId } = renderWithTheme(<TextInput label="Email" data-testid="username-text-input" />);

    // acceptance/tests/loginname-screen.ts calls pressSequentially() and
    // toHaveValue() on this testid. A wrapper div silently breaks 25 specs.
    expect(getByTestId("username-text-input").tagName).toBe("INPUT");
  });

  it("forwards its ref to the input element, which react-hook-form depends on", () => {
    const ref = { current: null as HTMLInputElement | null };
    renderWithTheme(<TextInput label="Email" ref={ref} />);

    // If this lands on the TextField root div instead, RHF registers a div:
    // no value tracked, forms permanently invalid. See Task 5.
    expect(ref.current?.tagName).toBe("INPUT");
  });

  it("renders its label, bound to the input", () => {
    const { getByLabelText } = renderWithTheme(<TextInput label="Email" />);

    expect(getByLabelText(/Email/)).toBeInTheDocument();
  });

  it("shows an error message when given one", () => {
    const { getByText } = renderWithTheme(<TextInput label="Email" error="Enter a valid email address" />);

    expect(getByText("Enter a valid email address")).toBeInTheDocument();
  });

  it("fires onChange with the event", () => {
    const onChange = vi.fn();
    const { getByLabelText } = renderWithTheme(<TextInput label="Email" onChange={onChange} />);
    fireEvent.input(getByLabelText(/Email/), { target: { value: "a" } });

    expect(onChange).toHaveBeenCalled();
  });

  it("shows a success message with a check icon, styled distinctly from an error", () => {
    const { getByText, container } = renderWithTheme(<TextInput label="Email" success="Looks good" />);

    expect(getByText("Looks good")).toBeInTheDocument();
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("prefers the error message over success when both are given", () => {
    const { getByText, queryByText } = renderWithTheme(
      <TextInput label="Email" error="Enter a valid email address" success="Looks good" />,
    );

    expect(getByText("Enter a valid email address")).toBeInTheDocument();
    expect(queryByText("Looks good")).not.toBeInTheDocument();
  });

  it("renders the suffix when given", () => {
    const { getByText } = renderWithTheme(<TextInput label="Username" suffix="acme.com" />);

    expect(getByText("@acme.com")).toBeInTheDocument();
  });

  it("passes through native input attributes like autoComplete and disabled", () => {
    const { getByTestId } = renderWithTheme(<TextInput label="Email" data-testid="f" autoComplete="username" disabled />);
    const input = getByTestId("f") as HTMLInputElement;

    expect(input.autocomplete).toBe("username");
    expect(input.disabled).toBe(true);
  });

  it("renders the placeholder", () => {
    const { getByPlaceholderText } = renderWithTheme(<TextInput label="Email" placeholder="you@acme.com" />);

    expect(getByPlaceholderText("you@acme.com")).toBeInTheDocument();
  });

  it("renders the default value", () => {
    const { getByTestId } = renderWithTheme(<TextInput label="Email" data-testid="f" defaultValue="seed@acme.com" />);

    expect((getByTestId("f") as HTMLInputElement).value).toBe("seed@acme.com");
  });

  it("marks the field required, which MUI surfaces as an asterisk on the label", () => {
    const { getByTestId } = renderWithTheme(<TextInput label="Email" data-testid="f" required />);

    expect((getByTestId("f") as HTMLInputElement).required).toBe(true);
  });

  it("defaults autoComplete to off, a deliberate privacy default", () => {
    const { getByTestId } = renderWithTheme(<TextInput label="Email" data-testid="f" />);

    expect((getByTestId("f") as HTMLInputElement).autocomplete).toBe("off");
  });

  it("forwards autoFocus to the input", () => {
    const { getByTestId } = renderWithTheme(<TextInput label="Email" data-testid="f" autoFocus />);

    expect(getByTestId("f")).toHaveFocus();
  });
});
