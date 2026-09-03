import colors from "tailwindcss/colors";

// Generate dynamic theme colors
let themeColors = {
  background: { light: { contrast: {} }, dark: { contrast: {} } },
  primary: { light: { contrast: {} }, dark: { contrast: {} } },
  warn: { light: { contrast: {} }, dark: { contrast: {} } },
  text: { light: { contrast: {} }, dark: { contrast: {} } },
  link: { light: { contrast: {} }, dark: { contrast: {} } },
};

const shades = [
  "50",
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
];
const themes = ["light", "dark"];
const types = ["background", "primary", "warn", "text", "link"];

types.forEach((type) => {
  themes.forEach((theme) => {
    shades.forEach((shade) => {
      themeColors[type][theme][shade] =
        `var(--theme-${theme}-${type}-${shade})`;
      themeColors[type][theme][`contrast-${shade}`] =
        `var(--theme-${theme}-${type}-contrast-${shade})`;
      themeColors[type][theme][`secondary-${shade}`] =
        `var(--theme-${theme}-${type}-secondary-${shade})`;
    });
  });
});

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  future: {
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      fontFamily: {
        // Open Sans is the base family; Montserrat is display-only.
        sans: ["var(--font-open-sans)", "system-ui", "sans-serif"],
        montserrat: ["var(--font-montserrat)", "system-ui", "sans-serif"],
      },
      // Typography variants adopted verbatim from the Biamp Workplace MUI theme
      // (packages/styles/src/theme.tsx). Each token carries size, line-height,
      // letter-spacing and weight; the family comes from `font-sans` /
      // `font-montserrat` because Tailwind's fontSize tuple cannot set it.
      //
      // Montserrat variants: h0, h1, h2, h4. Everything else is Open Sans —
      // including h3, which deliberately differs from its size-twin h4.
      fontSize: {
        h0: ["3.5rem", { lineHeight: "1.1", letterSpacing: "-0.105rem", fontWeight: "500" }],
        h1: ["1.75rem", { lineHeight: "1.2", letterSpacing: "-0.07rem", fontWeight: "500" }],
        h2: ["1.25rem", { lineHeight: "1.5", letterSpacing: "-0.025rem", fontWeight: "600" }],
        h3: ["1rem", { lineHeight: "1.5", letterSpacing: "-0.02rem", fontWeight: "600" }],
        h4: ["1rem", { lineHeight: "1.5", letterSpacing: "-0.02rem", fontWeight: "600" }],
        body1: ["1rem", { lineHeight: "1.5", letterSpacing: "-0.02rem", fontWeight: "400" }],
        body2: ["0.875rem", { lineHeight: "1.5", letterSpacing: "-0.018rem", fontWeight: "400" }],
        caption: ["0.75rem", { lineHeight: "1.5", letterSpacing: "-0.015rem", fontWeight: "400" }],
        // subtitle1/subtitle2 intentionally omit weight and letter-spacing,
        // matching the MUI definition, which leaves both to inherit.
        subtitle1: ["0.875rem", { lineHeight: "1.5" }],
        subtitle2: ["0.75rem", { lineHeight: "1.5" }],
        button: ["0.875rem", { lineHeight: "1.5", letterSpacing: "-0.018rem", fontWeight: "600" }],
        sidebar: ["0.563rem", { lineHeight: "1.5", letterSpacing: "-0.013rem", fontWeight: "700" }],

        // --- Stock-scale aliases -------------------------------------------
        // Tailwind's default size keys are re-pointed at the variant values
        // above so that upstream Zitadel code keeps Biamp typography without
        // us rewriting its className strings. This keeps the fork's rebase
        // surface small: `text-sm` in an upstream component already resolves
        // to body2, so those files never need to appear in our diff.
        //
        // Prefer the semantic names (text-body2) in code we write ourselves.
        // Sizes above 4xl are intentionally left on Tailwind's defaults rather
        // than inventing a mapping for values the design system doesn't define.
        xs: ["0.75rem", { lineHeight: "1.5", letterSpacing: "-0.015rem", fontWeight: "400" }], // = caption
        sm: ["0.875rem", { lineHeight: "1.5", letterSpacing: "-0.018rem", fontWeight: "400" }], // = body2
        base: ["1rem", { lineHeight: "1.5", letterSpacing: "-0.02rem", fontWeight: "400" }], // = body1
        lg: ["1.25rem", { lineHeight: "1.5", letterSpacing: "-0.025rem", fontWeight: "600" }], // = h2
        xl: ["1.25rem", { lineHeight: "1.5", letterSpacing: "-0.025rem", fontWeight: "600" }], // = h2
        "2xl": ["1.75rem", { lineHeight: "1.2", letterSpacing: "-0.07rem", fontWeight: "500" }], // = h1
        "3xl": ["1.75rem", { lineHeight: "1.2", letterSpacing: "-0.07rem", fontWeight: "500" }], // = h1
        "4xl": ["1.75rem", { lineHeight: "1.2", letterSpacing: "-0.07rem", fontWeight: "500" }], // = h1

        // Retained so the pre-existing `text-12px` / `text-14px` call sites
        // keep working unchanged, now carrying variant values.
        "12px": ["0.75rem", { lineHeight: "1.5", letterSpacing: "-0.015rem", fontWeight: "400" }], // = caption
        "14px": ["0.875rem", { lineHeight: "1.5", letterSpacing: "-0.018rem", fontWeight: "400" }], // = body2
      },
      colors: {
        gray: colors.zinc,
        // Dynamic theme colors
        ...themeColors,
        // State colors
        state: {
          success: {
            light: {
              background: "#cbf4c9",
              color: "#0e6245",
            },
            dark: {
              background: "#68cf8340",
              color: "#cbf4c9",
            },
          },
          error: {
            light: {
              background: "#ffc1c1",
              color: "#620e0e",
            },
            dark: {
              background: "#af455359",
              color: "#ffc1c1",
            },
          },
          neutral: {
            light: {
              background: "#e4e7e4",
              color: "#000000",
            },
            dark: {
              background: "#1a253c",
              color: "#ffffff",
            },
          },
          alert: {
            light: {
              background: "#fbbf24",
              color: "#92400e",
            },
            dark: {
              background: "#92400e50",
              color: "#fbbf24",
            },
          },
        },
        divider: {
          dark: "rgba(135,149,161,.2)",
          light: "rgba(135,149,161,.2)",
        },
        input: {
          light: {
            label: "#000000c7",
            background: "#00000004",
            border: "#1a191954",
            hoverborder: "1a1b1b",
          },
          dark: {
            label: "#ffffffc7",
            background: "#00000020",
            border: "#f9f7f775",
            hoverborder: "#e0e0e0",
          },
        },
        button: {
          light: {
            border: "#0000001f",
          },
          dark: {
            border: "#ffffff1f",
          },
        },
      },
      backgroundImage: ({ theme }) => ({
        "dark-vc-border-gradient": `radial-gradient(at left top, ${theme(
          "colors.gray.800",
        )}, 50px, ${theme("colors.gray.800")} 50%)`,
        "vc-border-gradient": `radial-gradient(at left top, ${theme(
          "colors.gray.200",
        )}, 50px, ${theme("colors.gray.300")} 50%)`,
      }),
      animation: {
        shake: "shake .8s cubic-bezier(.36,.07,.19,.97) both;",
      },
      keyframes: ({ theme }) => ({
        rerender: {
          "0%": {
            ["border-color"]: theme("colors.pink.500"),
          },
          "40%": {
            ["border-color"]: theme("colors.pink.500"),
          },
        },
        highlight: {
          "0%": {
            background: theme("colors.pink.500"),
            color: theme("colors.white"),
          },
          "40%": {
            background: theme("colors.pink.500"),
            color: theme("colors.white"),
          },
        },
        shimmer: {
          "100%": {
            transform: "translateX(100%)",
          },
        },
        translateXReset: {
          "100%": {
            transform: "translateX(0)",
          },
        },
        fadeToTransparent: {
          "0%": {
            opacity: 1,
          },
          "40%": {
            opacity: 1,
          },
          "100%": {
            opacity: 0,
          },
        },
        shake: {
          "10%, 90%": {
            transform: "translate3d(-1px, 0, 0)",
          },
          "20%, 80%": {
            transform: "translate3d(2px, 0, 0)",
          },
          "30%, 50%, 70%": {
            transform: "translate3d(-4px, 0, 0)",
          },
          "40%, 60%": {
            transform: "translate3d(4px, 0, 0)",
          },
        },
      }),
    },
  },
  plugins: [require("@tailwindcss/forms")],
};
