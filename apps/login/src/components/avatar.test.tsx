import { getColorHash } from "@/helpers/colors";
import { renderWithTheme } from "@/test-utils/render-with-theme";
import { cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Avatar, getInitials } from "./avatar";

afterEach(cleanup);

// getComputedStyle resolves rgb(), not the hex avatar.tsx passes to sx.
function hexToRgb(hex: string): string {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

describe("Avatar Component", () => {
  describe("getInitials", () => {
    it("should get initials from full name", () => {
      const initials = getInitials("John Doe", "john.doe@example.com");
      expect(initials).toBe("JD");
    });

    it("should get single initial from single name", () => {
      const initials = getInitials("John", "john@example.com");
      expect(initials).toBe("J");
    });

    it("should get initials from loginName when name is empty", () => {
      const initials = getInitials("", "john.doe@example.com");
      expect(initials.length).toBeGreaterThan(0);
    });

    it("should handle loginName with underscore separator", () => {
      const initials = getInitials("", "john_doe@example.com");
      expect(initials).toBe("jd");
    });

    it("should handle loginName with dash separator", () => {
      const initials = getInitials("", "john-doe@example.com");
      expect(initials).toBe("jd");
    });

    it("should handle loginName with dot separator", () => {
      const initials = getInitials("", "john.doe@example.com");
      expect(initials).toBe("jd");
    });

    it("should get initials from username part of email", () => {
      const initials = getInitials("", "testuser@example.com");
      expect(initials.length).toBeGreaterThan(0);
    });
  });

  describe("Component Rendering", () => {
    it("renders the initials when no image is given", () => {
      const { getByText } = renderWithTheme(<Avatar name="John Doe" loginName="john.doe@example.com" />);

      expect(getByText("JD")).toBeInTheDocument();
    });

    it("renders an img with the given imageUrl instead of initials", () => {
      const { getByRole, queryByText } = renderWithTheme(
        <Avatar name="Test User" loginName="test@example.com" imageUrl="https://example.com/avatar.jpg" />,
      );

      const img = getByRole("img");
      expect(img).toHaveAttribute("src", "https://example.com/avatar.jpg");
      expect(queryByText("TU")).not.toBeInTheDocument();
    });

    it("renders with each size without crashing", () => {
      (["small", "base", "large"] as const).forEach((size) => {
        const { getByText, unmount } = renderWithTheme(<Avatar size={size} name="Test User" loginName="test@example.com" />);
        expect(getByText("TU")).toBeInTheDocument();
        unmount();
      });
    });

    it("renders with shadow prop without crashing", () => {
      const { getByText } = renderWithTheme(<Avatar name="Test User" loginName="test@example.com" shadow={true} />);
      expect(getByText("TU")).toBeInTheDocument();
    });

    it("renders without shadow prop without crashing", () => {
      const { getByText } = renderWithTheme(<Avatar name="Test User" loginName="test@example.com" shadow={false} />);
      expect(getByText("TU")).toBeInTheDocument();
    });

    it("falls back to loginName-derived initials when name is null", () => {
      const { getByText } = renderWithTheme(<Avatar name={null} loginName="jane_smith@example.com" />);
      expect(getByText("j")).toBeInTheDocument();
    });

    it("falls back to loginName-derived initials when name is undefined", () => {
      const { getByText } = renderWithTheme(<Avatar name={undefined} loginName="testuser@example.com" />);
      expect(getByText("t")).toBeInTheDocument();
    });

    it("derives its background colour from loginName's hash, not a fixed value", () => {
      const loginNameA = "alice@example.com";
      const loginNameB = "bob@example.com";
      const colorA = getColorHash(loginNameA);
      const colorB = getColorHash(loginNameB);
      // Guard against a coincidence where both names hash into the same
      // bucket, which would make the assertions below pass vacuously.
      expect(colorA[200]).not.toBe(colorB[200]);

      const { container: containerA } = renderWithTheme(<Avatar name="Alice A" loginName={loginNameA} />);
      const { container: containerB } = renderWithTheme(<Avatar name="Bob B" loginName={loginNameB} />);
      const avatarA = containerA.firstChild as HTMLElement;
      const avatarB = containerB.firstChild as HTMLElement;

      expect(getComputedStyle(avatarA).backgroundColor).toBe(hexToRgb(colorA[200]));
      expect(getComputedStyle(avatarB).backgroundColor).toBe(hexToRgb(colorB[200]));
      expect(getComputedStyle(avatarA).backgroundColor).not.toBe(getComputedStyle(avatarB).backgroundColor);
    });
  });
});
