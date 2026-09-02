# Migrate the ZITADEL Login UI to the Biamp MUI theme

**Date:** 2026-09-02
**Status:** Approved, ready for implementation planning
**Scope:** `apps/login` only

## Goal

Replace all ZITADEL-provided theming and styling in the Login UI with the shared
Biamp theme from `@bwp-web/styles`, and rebuild the login flow's pages on the
`@bwp-web/components` LandingPage primitives. After this work, `apps/login`
contains no Tailwind and no ZITADEL branding plumbing.

## Decisions

These were settled during brainstorming and are not open for re-litigation
during implementation:

1. **Full migration in one pass.** All 87 components and all 13 routes move to
   MUI + `@bwp-web`. Tailwind and SCSS are removed in this pass, not deferred.
2. **ZITADEL per-organization branding is dropped entirely.** `biampTheme` is
   the single source of truth for colour, typography and logo. Per-org
   white-labelling stops working; every organization sees the Biamp theme.
3. **ZITADEL's routes and server actions are preserved.** A shared landing
   shell renders each route's form. The `/loginname` → `/password` split stays;
   the two-step in-place reveal from the bwp Storybook story is *not*
   reproduced, because the next step is decided server-side by user discovery
   and can branch to passkey, IdP or MFA.
4. **`next-intl` stays.** All copy remains translated.
5. **Dark mode and `ThemeSwitch` stay,** mapped onto `biampTheme`'s dark colour
   scheme rather than Tailwind's `dark:` classes.
6. **Execution strategy: primitive-swap, then className sweep.** Rewrite the
   shared primitives' internals first, then sweep leftover layout classes route
   by route.

## Context: what the packages actually provide

`@bwp-web/styles@1.0.17`, `@bwp-web/components@1.10.2` and
`@bwp-web/assets@1.0.10` are published publicly on npm and match the local
`workplace-public-packages` checkout.

- `@bwp-web/styles` exports `biampTheme(overrideOptions?)` — a factory over
  MUI's `createTheme` — and `appBarHeight`. It defines both `light` and `dark`
  colour schemes with `cssVariables.colorSchemeSelector: 'class'`.
- `biampTheme` injects its `@font-face` rules through
  `MuiCssBaseline.styleOverrides`. **`<CssBaseline />` is therefore mandatory**;
  without it, no Biamp font loads.
- `@bwp-web/components` exports the LandingPage primitives: `LandingFormPanel`,
  `LandingFormField`, `LandingFormActions`, `LandingFormCheckbox`, plus
  `OrganizationsPanel` and the `Biamp*` component family.
- **`LoginLandingPage` is a Storybook story, not an exported component**
  (`packages/components/src/LandingPage/LoginLandingPage.stories.tsx`). It is a
  composition blueprint to be re-implemented here, not something to import.
- `LandingFormPanel` renders a real `<form>` and always calls
  `preventDefault()`, so it composes with `react-hook-form` and server actions.
  Its `onSubmit` takes no arguments.

## Dependencies to add

`@mui/material` is pinned to **exactly `7.3.10`**, matching `workplace-web`'s
exact pin and the version the bwp packages are developed against. MUI's current
latest is 9.4.0; tracking it would be a two-major gamble against theme code
written for 7.3.x.

| Package | Version | Why |
| --- | --- | --- |
| `@mui/material` | `7.3.10` (exact) | Matches `workplace-web` and bwp dev target |
| `@mui/x-date-pickers` | `^8.28.3` | Hard runtime import: `biampTheme` pulls `renderDigitalClockTimeView` |
| `@emotion/react` | `^11.14.0` | MUI styling engine |
| `@emotion/styled` | `^11.14.1` | MUI styling engine |
| `@mui/material-nextjs` | `^7.0.2` | `AppRouterCacheProvider` — see Risks |
| `@tanstack/react-table` | `^8.21.3` | Declared peer of `@bwp-web/components` |
| `@bwp-web/styles` | `^1.0.17` | The theme |
| `@bwp-web/components` | `^1.10.2` | LandingPage primitives |
| `@bwp-web/assets` | `^1.0.10` | Fonts, logos, background |

`@mui/icons-material` is **not** required. It appears only in the bwp packages'
Storybook stories, never in shipped runtime code.

## Architecture

### Provider stack

`app/(login)/layout.tsx` is rewritten. The `Lato` `next/font/google` import is
removed — Biamp fonts arrive via `CssBaseline`.

```
<html>
  <body>
    AppRouterCacheProvider          emotion SSR flush, prevents FOUC
      ThemeProvider                 next-themes, attribute="class"
        MuiThemeProvider            theme={biampTheme()}
          CssBaseline               loads Biamp @font-face rules
            InitColorSchemeScript
              LanguageProvider
                {children}
```

`next-themes` keeps driving dark mode by writing a class on `<html>`, which is
exactly what `biampTheme`'s `colorSchemeSelector: 'class'` reads.

`Tooltip.Provider` (Radix) stays. It is behavioural rather than visual and 18
components depend on it; replacing it is separate work and explicitly out of
scope.

### `LandingShell` — new component

`src/components/bwp/landing-shell.tsx`, a client component carrying the chrome
from the `LoginLandingPage` story:

- fixed `LandingPageBackground` layer
- centred `BiampHeaderTitle` logo lockup
- optional hero, via `title` and `subtitle` props
- `children` slot for the form panel
- optional help text beneath the panel
- `BiampLogo` + copyright footer
- `LanguageSwitcher` and `ThemeSwitch`, relocated here from the layout

Every route renders inside this shell so the flow stays visually unified.

### Route composition

Each route keeps its server-side data fetching and server actions. Changes are:
drop `getBrandingSettings` and `DynamicTheme`, wrap content in `LandingShell`,
and render forms inside `LandingFormPanel`.

For `/loginname` specifically: `getLoginSettings`, `getActiveIdentityProviders`
and `getDefaultOrg` all stay. `UsernameForm` keeps `react-hook-form` and
`sendLoginname`; only its markup changes, to `LandingFormPanel` +
`LandingFormField` with the `SquareRoundedArrowRightFilledIcon` submit
adornment, wired as `onSubmit={handleSubmit(submitLoginName)}`.

The story's `keepAdornmentColor` `sx` workaround must be ported: the theme
turns adornment icons `text.primary` while a field is focused, which otherwise
blacks out the blue submit arrow for the whole flow.

### Primitive swap

Rewrite these 8 files' internals to MUI, keeping file paths, exported prop
signatures and every `data-testid` identical. This restyles 122 call sites
without touching their logic.

| File | Becomes | Call sites |
| --- | --- | --- |
| `alert.tsx` | MUI `Alert` | 42 |
| `button.tsx` | MUI `Button`, mapping `ButtonVariants` | 25 |
| `back-button.tsx` | MUI `Button` + icon | 18 |
| `spinner.tsx` | MUI `CircularProgress` | 17 |
| `input.tsx` | `LandingFormField` / `TextField` | 13 |
| `avatar.tsx` | `UserInitialsIcon` | 5 |
| `card.tsx` | `LandingFormPanel` | 2 |
| `checkbox.tsx` | `LandingFormCheckbox` | 1 |

`translated.tsx` (66 importers) is untouched — it is pure i18n with no styling.

A route-by-route sweep then removes the remaining layout `className`s from the
~75 feature components. 100 of 133 `.tsx` files currently use `className=`.

### Deletions

Removed once the sweep is complete:

- `tailwind.config.mjs`
- `postcss.config.cjs` (its only plugin is `@tailwindcss/postcss`)
- `src/styles/globals.scss` (76 lines)
- `src/components/theme-wrapper.tsx`
- `src/components/dynamic-theme.tsx`
- `src/components/branding-context.tsx`
- `src/components/background-wrapper.tsx`
- from `apps/login/package.json`: `tailwindcss` (^4.3.0),
  `@tailwindcss/postcss`, `@tailwindcss/forms`, `postcss`,
  `prettier-plugin-tailwindcss`, `sass`
- `prettier.config.mjs`: drop `"prettier-plugin-tailwindcss"` from `plugins`,
  keeping `prettier-plugin-organize-imports`
- all `getBrandingSettings` call sites

## Performance

`@bwp-web/assets` bundles fonts and images as base64 data URIs (tsup's
`dataurl` loader), producing a 3.7 MB ESM bundle. `biampTheme` imports 13 font
faces, all of which ship.

Mitigation: add `@bwp-web/assets`, `@bwp-web/components` and `@mui/material` to
the existing `experimental.optimizePackageImports` array in `next.config.mjs`
so unused images tree-shake out.

The 13 font faces and the ~110 KB base64 background still ship. Reducing that
requires emitting font files instead of data URIs in
`workplace-public-packages`, which is outside this repository and out of scope.
Accepted.

## Testing

**Hard constraint: every one of the 80 `data-testid` attributes in
`src/components` is preserved.** The 25 Playwright acceptance specs use
`getByTestId` 46 times against `getByRole` 3 times, so preserving testids
should carry that suite through the restyle unchanged.

Of the 19 unit test files, the 5 that assert on CSS classes are rewritten; the
remaining 14 use semantic queries and should pass untouched.

Verification:

```bash
pnpm nx run-many --projects @zitadel/login --targets lint build test-unit
```

plus a manual pass through the real OIDC flow, starting from
`http://localhost:8080/ui/console?login_hint=zitadel-admin@zitadel.localhost`
with password `Password1!`, which exercises `/loginname` → `/password` →
callback.

## Risks

### 1. `@mui/material-nextjs@7` does not declare Next 16 support

Its peer range is `next: ^13 || ^14 || ^15`; `apps/login` runs Next 16.2.11.
The v9 line supports Next 16 but pairs with MUI 9.

Plan: install the v7 line with a `pnpm.peerDependencyRules` override.
`AppRouterCacheProvider` is a thin wrapper over `useServerInsertedHTML`, an API
that is stable in Next 16.

**This is spiked first.** If it misbehaves, the fallback is a hand-rolled
emotion cache provider (~30 lines using `useServerInsertedHTML` directly),
which drops the dependency entirely.

### 2. Upstream rebase cost

A full migration means upstream ZITADEL merges will conflict across nearly
every file in `apps/login`. The primitive-swap strategy confines conflicts to
markup rather than flow logic, but the cost is real and ongoing. Accepted as a
consequence of the full-migration decision.

### 3. `reactStrictMode: true` with MUI 7 and React 19.2.6

Supported, but strict mode double-renders; watch for emotion cache
double-insertion during the spike.

## Out of scope

- Replacing Radix `Tooltip.Provider`
- Any change to `workplace-public-packages`
- Any change outside `apps/login` (except the spec file itself)
- Restoring per-organization white-labelling
