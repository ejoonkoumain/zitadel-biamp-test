// Biamp Workplace palette. Mirrors the `colors` object and the semantic
// palette roles in packages/styles/src/theme.tsx — keep the two in sync.
//
// `divider` reproduces MUI's alpha(grey900, 0.15) / alpha(white, 0.15).
const biamp = {
  black: "#000000",
  white: "#ffffff",
  grey: {
    50: "#fafafa",
    100: "#f5f5f5",
    200: "#eeeeee",
    300: "#c9c9c9",
    400: "#878787",
    500: "#646464",
    600: "#484848",
    700: "#333333",
    800: "#222222",
    900: "#111111",
  },
  success: {
    light: { main: "#008A05", background: "#EAFEF0" },
    dark: { main: "#00E941", background: "#093615" },
  },
  warning: {
    light: { main: "#E06C00", background: "#FFF4D9" },
    dark: { main: "#FFB800", background: "#41320E" },
  },
  error: {
    light: { main: "#E0002D", background: "#FFEDF0" },
    dark: { main: "#FF1744", background: "#2E1016" },
  },
  divider: {
    light: "rgba(17,17,17,0.15)",
    dark: "rgba(255,255,255,0.15)",
  },
};

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
        // Biamp grey replaces Tailwind's zinc. The shade keys line up exactly,
        // so every existing text-gray-* / bg-gray-* call site is retargeted
        // without touching a component. 950 has no Biamp grey, so it uses
        // Biamp's pure black.
        gray: { ...biamp.grey, 950: biamp.black },
        // Dynamic theme colors
        ...themeColors,
        // Status colors. Biamp splits error from warning, so `alert` maps to
        // Biamp `warning` and `error` to Biamp `error`. `neutral` has no Biamp
        // equivalent and is derived from the grey ramp.
        state: {
          success: {
            light: {
              background: biamp.success.light.background,
              color: biamp.success.light.main,
            },
            dark: {
              background: biamp.success.dark.background,
              color: biamp.success.dark.main,
            },
          },
          error: {
            light: {
              background: biamp.error.light.background,
              color: biamp.error.light.main,
            },
            dark: {
              background: biamp.error.dark.background,
              color: biamp.error.dark.main,
            },
          },
          neutral: {
            light: {
              background: biamp.grey[200],
              color: biamp.grey[900],
            },
            dark: {
              background: biamp.grey[800],
              color: biamp.grey[50],
            },
          },
          alert: {
            light: {
              background: biamp.warning.light.background,
              color: biamp.warning.light.main,
            },
            dark: {
              background: biamp.warning.dark.background,
              color: biamp.warning.dark.main,
            },
          },
        },
        divider: {
          light: biamp.divider.light,
          dark: biamp.divider.dark,
        },
        // Biamp defines no input-specific colors, so these are derived from
        // the ink and divider values, preserving the original alpha structure.
        input: {
          light: {
            label: "#111111c7",
            background: "#11111105",
            border: biamp.divider.light,
            hoverborder: biamp.grey[900],
          },
          dark: {
            label: "#fafafac7",
            background: "#00000020",
            border: biamp.divider.dark,
            hoverborder: biamp.grey[200],
          },
        },
        button: {
          light: {
            border: biamp.divider.light,
          },
          dark: {
            border: biamp.divider.dark,
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
