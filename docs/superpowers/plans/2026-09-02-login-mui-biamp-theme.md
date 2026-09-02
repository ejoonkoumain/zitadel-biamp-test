# Login UI → Biamp MUI Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every ZITADEL-provided theme and style in `apps/login` with the shared Biamp MUI theme from `@bwp-web/styles`, and rebuild the login flow's pages on `@bwp-web/components` LandingPage primitives.

**Architecture:** An MUI `ThemeProvider` carrying `biampTheme()` is installed at the root layout under `AppRouterCacheProvider`, with `next-themes` still driving dark mode via a class on `<html>`. A new `LandingShell` supplies the page chrome for every route. The 8 shared primitives are rewritten internally to MUI while keeping their paths, prop APIs and `data-testid`s, which restyles 122 call sites without touching flow logic. A route-by-route sweep then removes leftover `className`s, and Tailwind plus both ZITADEL theme layers are deleted last.

**Tech Stack:** Next.js 16.2.11 (App Router), React 19.2.6, MUI 7.3.10 + Emotion 11, `@bwp-web/{styles,components,assets}`, `next-intl`, `next-themes`, Vitest + Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-09-02-login-mui-biamp-theme-design.md`

---

## PROGRESS — updated 2026-09-02

| Task | State |
| --- | --- |
| 1 Install dependencies | ✅ |
| 2 Spike: biampTheme + AppRouterCacheProvider on Next 16 | ✅ Risk 1 retired |
| 3 Provider stack in root layout | ✅ 11 `@font-face` rules verified in SSR HTML |
| 4 `LandingShell` | ✅ |
| 5 `UsernameForm` on `LandingFormPanel` | ✅ |
| 6 Compose `/loginname` | ✅ |
| 6A CSP `data:` for fonts and images | ✅ unblocked the whole theme |
| 6B Match Storybook copy, strip Back/Register | ✅ |
| 7 `alert.tsx` | ✅ |
| 8 `button.tsx` | ✅ |
| 9 `input.tsx` | ✅ browser-proved the testid contract |
| 10 `card.tsx` | ✅ |
| 11 `spinner.tsx` | ✅ |
| 12 `avatar.tsx` | ✅ |
| 13 `checkbox.tsx` + verify `back-button.tsx` | ✅ |
| 14–17 Phase 4 route sweep | ⬜ next |
| 18–19 Phase 5 teardown | ⬜ |

**Verified at end of Phase 3:** all 7 rewritten primitives import `@mui/material`
and contain zero `lib/theme` and zero `clsx` references; `back-button.tsx`
needed no change. **883 tests passing / 63 files**, `tsc` at its 50-error
baseline in the same 11 files, `nx build` clean.

`lib/theme` importers are down from 11 to **7**: `background-wrapper.tsx`,
`dynamic-theme.tsx`, `idps/base-button.tsx`, `language-switcher.tsx`,
`skeleton-card.tsx`, `theme-switch.tsx`, `user-avatar.tsx`. All seven are
handled in Phase 4, which is what makes the Task 18 deletion possible.

**On the test count:** it started at 894 and now reads 883. That net −11 is not
lost coverage — roughly 60 obsolete tests were removed (Tailwind class-string
assertions, `roundness` behaviour that no longer exists, and a number of
genuinely vacuous ones such as `expect(container.firstChild).toBeTruthy()`) and
replaced with roughly 49 behavioural ones. Where a primitive's rewrite *did*
shed live coverage, it was restored deliberately: `className` forwarding on
`button` and `spinner`, and five behaviours on `input` including the
`autoComplete` privacy default. Each restored test was proved to fail with the
bug reintroduced.

## Ground rules — read before any task

**GIT: Do not run any git command that mutates state.** No `add`, `commit`,
`branch`, `checkout`, `push`, `merge` or `rebase`. The user performs all git
operations personally. Every task ends at a **Checkpoint** step that reports
what is ready; the user commits it. `git status` / `git diff` for reporting is
fine.

**Three hard constraints, violated at your peril:**

1. **Every `data-testid` in `src/` is preserved, byte-identical.** 80 of them
   carry the 25 Playwright acceptance specs (46 `getByTestId` vs 3
   `getByRole`).
2. **On text inputs, `data-testid` must land on the `<input>` element, not the
   wrapper.** `acceptance/tests/loginname-screen.ts` calls
   `.pressSequentially()` and `.toHaveValue()` on it, both of which fail
   against a wrapper `<div>`. With MUI `TextField` that means
   `slotProps={{ htmlInput: { "data-testid": ... } }}` — never `data-testid` on
   the `TextField` itself.
3. **`data-testid="error"` must keep a nested `<div>` inside it.**
   `loginname-screen.ts` asserts `getByTestId("error").locator("div")`. MUI
   `Alert`'s root is a `<div>`, so an `Alert` inside the wrapper satisfies this
   — but do not flatten the wrapper away.

4. **Never drop a feature the old markup rendered without an explicit
   decision** — learned the hard way in Task 5. The Tailwind `TextInput` drew
   the org-domain suffix (`@acme.com`) as an absolutely-positioned overlay via
   the `suffix`/`hideSuffix` props, with no test covering it. The MUI field's
   single `endAdornment` slot is taken by the submit arrow, so a naive port
   loses the feature while every testid assertion still passes. If you find
   another affordance the old markup had that the new one cannot express,
   **stop and report it** — do not quietly drop it, and do not invent a
   redesign.

   **Outcome for the suffix specifically: dropped, by product decision on
   2026-09-02.** Rendering it inside the adornment was tried and rejected —
   a Playwright check showed a realistic 57-character domain squeezed the
   typed username down to ~2 visible characters. The alternatives (label
   slot, helper text, ellipsis truncation) were weighed and the owner chose
   removal. So: `suffix` stays a prop because `sendLoginname()` still needs
   it for org resolution, but it is **not rendered**; `hideSuffix` is removed
   from the page in Task 6 and then from `Props`.

## The hairline-border collision — FIXED 2026-09-02, keep the shim

Between Tasks 6A and 19, every MUI element would otherwise render with a
hairline border box around it — text, labels, buttons, the footer. The user saw
this and asked for it fixed rather than deferred, so **a shim now lives at the
top of `src/styles/globals.scss`. Do not remove it before Task 19**, which
deletes that file and the collision along with it.

The shim:

```scss
:where([class*="Mui"]) {
  border-style: none;
}
```

`:where()` is the whole trick — it carries **zero specificity**, so it ties
with Tailwind's `*, ::before, ::after` preflight and wins on source order,
while losing to MUI's own component classes. Verified computed styles after
applying it:

| Element | Before | After |
| --- | --- | --- |
| `h1.MuiTypography-root` | 1px solid | 0px none |
| `.MuiStack-root` | 1px solid | 0px none |
| `input` | 1px solid | 0px none |
| `.MuiOutlinedInput-notchedOutline` | 1px solid | **1px solid** (kept) |

That last row is the point: MUI's `NotchedOutline` and outlined `Button` both
declare their own `borderStyle: 'solid'` at class specificity, so borders that
are genuinely wanted survive. And because the selector never matches a non-MUI
element, Tailwind's `border` utilities on the not-yet-migrated components are
untouched.

Cause, confirmed:

- `@bwp-web/styles` injects, via `MuiCssBaseline`:
  `[class*="Mui"]:not([class*="MuiDivider"]):not([class*="MuiMultiSectionDigitalClock"]) { border-width: 0.6px !important; }`
- `src/styles/globals.scss` does `@use "tailwindcss"`, and Tailwind's preflight
  sets `border-style: solid; border-color: currentColor` on every element.

Neither is wrong alone. Together they draw a 0.6px solid border, in each
element's own text colour, around every MUI component.

**Task 19 resolves it at the root**, when `globals.scss` and Tailwind go: with
no preflight, `border-style` returns to its CSS initial value `none`, and a
none-style border has a used width of zero regardless of the `!important`
width. The shim is then redundant and disappears with the file.

Two approaches that do **not** work, so nobody retries them:

- A blanket `*, ::before, ::after { border-style: none }`. Tailwind's `border`
  utility classes set only `border-width` and rely on the preflight for their
  style, and the app is still full of them through Phases 3 and 4 — this would
  erase the borders on every not-yet-migrated component.
- A plain `[class*="Mui"] { border-style: none }`. At specificity (0,1,0) it
  ties with MUI's own outlined-input and button rules, so which one wins comes
  down to Emotion's injection order versus the stylesheet's. `:where()` sidesteps
  this by scoring zero.

**Task 19 must verify the boxes are still gone after deleting `globals.scss`**,
i.e. that removing the preflight really does replace what the shim was doing.

**Check `@bwp-web/styles`' MUI augmentations before passing any `variant` or
`color` prop.** The design system both *adds* and *removes* MUI options, and
the removals are type errors, not warnings. Found in Task 7, where the plan's
own `variant="outlined"` on `Alert` pushed `tsc` to 51 errors. Read
`node_modules/.pnpm/@bwp-web+styles@*/node_modules/@bwp-web/styles/dist/augmentations.d.ts`.
Known so far:

| Component | Augmentation |
| --- | --- |
| `Alert` | `filled: false`, `outlined: false` — **`standard` is the only variant** |
| `Button` | adds `overlay`; `contained`/`outlined`/`text` still valid |
| `IconButton` | adds `variant?: 'none' \| 'transparent' \| 'outlined'` |
| `Typography` | adds `h0`, `sidebar` |
| `Badge` | adds `rectangle`, `round`, `rectangle-inline`, `round-inline` |
| `Checkbox` | has `CheckboxPropsColorOverrides` — check before passing `color` |

The palette is augmented too: `palette.text.sidebar` (`#E0E0E0`) and
`palette.dividers.secondary` exist and are used by the bwp components.

**Dark mode is owned by `next-themes`, and it already works.** Established in
Task 2: `biampTheme`'s `colorSchemeSelector: 'class'` makes MUI emit its
colour-scheme CSS under plain `.light` / `.dark` selectors (MUI's
`createGetSelector` turns `'class'` into the literal rule `.%s` filled with the
scheme key, and `biampTheme`'s scheme keys are `light` and `dark`). That is
exactly what `next-themes` writes on `<html>` with `attribute="class"`. No
bridging code, no `InitColorSchemeScript`, no `defaultMode` — do not add them.
This matters most in Task 17, where `theme-switch.tsx` is rewritten: keep it
driving `next-themes`' `setTheme`, and do not reach for MUI's
`useColorScheme`.

**Working directory** for all commands: `/Users/e.joon.ko/Documents/github/zitadel-biamp-test`

**Test command** used throughout:

```bash
pnpm --filter @zitadel/login exec vitest --run <path>
```

## VERIFIED BASELINE — measured 2026-09-02, after Task 2

Compare against these numbers. Do **not** chase pre-existing failures.

**Unit tests: 59 files, 894 tests, all passing.**

```bash
pnpm --filter @zitadel/login exec vitest --run
#  Test Files  59 passed (59)
#       Tests  894 passed (894)
```

An earlier draft of this plan said "19 unit test files". That was only
`src/components/*.test.tsx`; the real suite spans `src/lib`, `src/app` and
more. Any task must leave all 894 green, less only tests it deliberately
deletes (`src/lib/theme.test.ts` in Task 18).

**`tsc --noEmit` is NOT clean, and was not clean before this migration
started: 50 pre-existing errors across 11 files, every one of them a test
file.**

| Errors | File |
| --- | --- |
| 20 | `src/lib/server/loginname.test.ts` |
| 9 | `src/lib/verify-helper.test.ts` |
| 9 | `src/lib/oidc.test.ts` |
| 3 | `src/lib/session.test.ts` |
| 2 | `src/lib/api.test.ts` |
| 2 | `src/app/ready/route.test.ts` |
| 1 | `src/lib/server/verify.test.ts` |
| 1 | `src/lib/server/password.test.ts` |
| 1 | `src/components/set-register-password-form.test.tsx` |
| 1 | `src/components/set-password-form.test.tsx` |
| 1 | `src/components/change-password-form.test.tsx` |

They are unrelated type drift (e.g. `serviceUrl` missing on `ServiceConfig`),
and `vitest` passes anyway because it does not typecheck. `nx build` also
succeeds despite them.

**So wherever a task below says "Expected: no errors" from `tsc --noEmit`, read
it as: no errors *outside these 11 files*, and no increase in the count within
them.** Check your work with:

```bash
pnpm --filter @zitadel/login exec tsc --noEmit 2>&1 | grep -c "error TS"   # must stay <= 50
pnpm --filter @zitadel/login exec tsc --noEmit 2>&1 | grep -o "^src/[^(]*" | sort -u
```

The second command's output must remain a subset of the 11 files above. A file
appearing that is not on the list is a regression you introduced.

Three of the 11 — `change-password-form.test.tsx`, `set-password-form.test.tsx`,
`set-register-password-form.test.tsx` — are files this migration touches
(Task 14). When you touch one, fixing its single pre-existing error is in
scope; leaving it is acceptable but say so.

**No automatic RTL cleanup — every new test file MUST opt in.**
`apps/login/test-setup.ts` only imports `@testing-library/jest-dom/vitest`, and
`vitest.config.ts` does not set `globals: true`, so
`@testing-library/react`'s auto-`cleanup` never registers. Rendered DOM
persists across `it()` blocks within a file, so a query matching a leftover
element from an earlier test fails with "multiple elements found". This bit
Task 2.

**Known limitation of `renderWithTheme`: CSS variables do not resolve in
jsdom.** Found in Task 8. `biampTheme` enables `cssVariables`, and MUI's `sx`
shorthand for a palette path (e.g. `sx={{ color: "text.primary" }}`) emits a
bare `var(--mui-palette-text-primary)` with **no literal fallback**. Because
`renderWithTheme` wraps in a plain `ThemeProvider` and renders no
`<CssBaseline />`, no `:root` definition for those variables reaches the DOM,
so `getComputedStyle` hands the `var(...)` reference straight back unresolved.

So **do not assert a computed colour against `theme.palette.X` for anything set
through `sx`.** It fails even when the code is correct. Two things that do work:

- assert against the variable name, derived from `theme.vars.palette.X` rather
  than hardcoded, and additionally assert the value is *not* an ancestor's
  colour (wrap the subject in a `<div style={{ color: "red" }}>` and check it
  did not inherit red);
- assert against `theme.palette.X` only where MUI emits a literal fallback —
  which it does for a component's own `color` prop, as `theme-smoke.test.tsx`
  relies on.

Whichever you choose, **prove the test fails with the bug present** by
temporarily reverting the fix. Task 8 did this and it is the only way to know
the assertion is load-bearing rather than decorative.

**Remedy for every new test file in this plan** — add this, and do not rely on
giving each render unique text instead:

```tsx
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(cleanup);
```

Any test below that renders the same component more than once in a file — the
`LandingShell` tests in Task 4 are the clearest case, since every render emits
the same copyright footer — is only correct with this in place. Do **not**
"fix" the collision by adding `afterEach(cleanup)` to the shared
`test-setup.ts`: that changes behaviour for all 894 existing tests at once and
is out of scope here.

---

## File Structure

**Created:**

| Path | Responsibility |
| --- | --- |
| `apps/login/src/components/bwp/landing-shell.tsx` | Page chrome: background, logo lockup, hero, footer, language/theme switches |
| `apps/login/src/components/bwp/landing-shell.test.tsx` | Shell renders children, hero, testids |
| `apps/login/src/components/providers.tsx` | The client provider stack (emotion cache → next-themes → MUI → CssBaseline) |
| `apps/login/src/test-utils/render-with-theme.tsx` | `render()` wrapped in `MuiThemeProvider theme={biampTheme()}` |

**Modified:**

| Path | Change |
| --- | --- |
| `apps/login/package.json` | Add MUI/emotion/bwp deps; later remove Tailwind deps |
| `package.json` (root) | `pnpm.peerDependencyRules` for `@mui/material-nextjs` on Next 16 |
| `apps/login/next.config.mjs` | Extend `experimental.optimizePackageImports` |
| `apps/login/src/app/(login)/layout.tsx` | Swap Tailwind chrome for `Providers` |
| `apps/login/src/app/(login)/loginname/page.tsx` | `DynamicTheme` → `LandingShell` |
| `apps/login/src/components/username-form.tsx` | `LandingFormPanel` + `LandingFormField` |
| `apps/login/src/components/{alert,button,input,card,checkbox,spinner,avatar}.tsx` | MUI internals, same props |
| `apps/login/src/components/{button,input,card,avatar,password-complexity}.test.tsx` | Drop class assertions |
| `apps/login/prettier.config.mjs` | Drop `prettier-plugin-tailwindcss` |
| The other 12 route pages + ~75 feature components | className sweep |

**Deleted (Phase 5):** `tailwind.config.mjs`, `postcss.config.cjs`, `src/styles/globals.scss`, `src/components/{theme-wrapper,dynamic-theme,branding-context,background-wrapper}.tsx`, `src/lib/{theme.ts,themeUtils.tsx,theme-hooks.ts,theme.test.ts}`, `.env.theme.example`, `THEME_ARCHITECTURE.md`, `THEME_CUSTOMIZATION.md`

---

# Phase 0 — De-risk the Next 16 + MUI 7 pairing

This phase exists solely to answer Risk 1 in the spec before any migration work
is built on top of it. Do not proceed to Phase 1 until Task 2 passes.

### Task 1: Install dependencies

**Files:**
- Modify: `apps/login/package.json`
- Modify: `pnpm-lock.yaml` (by `pnpm install`)

- [ ] **Step 1: Add the runtime dependencies**

```bash
pnpm --filter @zitadel/login add \
  @mui/material@7.3.10 \
  @mui/x-date-pickers@^8.28.3 \
  @emotion/react@^11.14.0 \
  @emotion/styled@^11.14.1 \
  @mui/material-nextjs@^7.0.2 \
  @tanstack/react-table@^8.21.3 \
  @bwp-web/styles@^1.0.17 \
  @bwp-web/components@^1.10.2 \
  @bwp-web/assets@^1.0.10
```

`@mui/material` is pinned with no caret on purpose — it must stay at 7.3.10 to
match `workplace-web` and the version the bwp packages are built against. MUI's
latest is 9.4.0; do not let a caret drift there.

- [x] **Step 2: RESOLVED — no peer override needed**

~~Add a `pnpm.peerDependencyRules` override to the root `package.json`.~~

**Superseded during execution on 2026-09-02.** The concern was based on
`@mui/material-nextjs@7.0.0`/`7.0.2`, whose peer range is
`next: ^13 || ^14 || ^15`. But the current release in that line, **7.3.10**,
declares:

```
next: '^13.0.0 || ^14.0.0 || ^15.0.0 || ^16.0.0'
```

Next 16 is natively supported. `pnpm install` produces no unmet-peer warning
for `@mui/material-nextjs` with or without an override, so no `"pnpm"` key is
added to the root `package.json`. Install `@mui/material-nextjs@^7.3.10` rather
than `^7.0.2` to guarantee landing on a release that declares Next 16.

Skip this step. Root `package.json` is left unmodified.

- [ ] **Step 3: Reinstall and confirm no unmet peers**

```bash
pnpm install
```

Expected: completes with no `✕ unmet peer next@...` line mentioning
`@mui/material-nextjs`.

- [ ] **Step 4: Checkpoint — report to the user**

Report: dependency versions installed, and the exact `pnpm install` peer-warning
output. Do not commit. State that `apps/login/package.json` and
`pnpm-lock.yaml` are ready to commit.

Note that `pnpm add` may resolve a caret range slightly above the plan's floor
(e.g. `@mui/x-date-pickers@^8.29.3` rather than `^8.28.3`). That is expected
and fine. The one version that must not move is `@mui/material`, which stays
pinned at exactly `7.3.10`.

---

### Task 2: Prove biampTheme renders under React 19 + Vitest

**Files:**
- Create: `apps/login/src/test-utils/render-with-theme.tsx`
- Create: `apps/login/src/test-utils/theme-smoke.test.tsx`

- [ ] **Step 1: Write the shared test render helper**

Create `apps/login/src/test-utils/render-with-theme.tsx`:

```tsx
import { biampTheme } from "@bwp-web/styles";
import { ThemeProvider } from "@mui/material/styles";
import { render, type RenderOptions } from "@testing-library/react";
import { type ReactElement, type ReactNode } from "react";

// Built once — biampTheme() is not cheap, and every test shares one instance.
const theme = biampTheme();

function Providers({ children }: { children: ReactNode }) {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}

/**
 * render() with the Biamp MUI theme in scope. Any component that reads the
 * theme — every migrated primitive — must be rendered through this, not
 * through @testing-library/react's bare render.
 */
export function renderWithTheme(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  return render(ui, { wrapper: Providers, ...options });
}

export * from "@testing-library/react";
```

- [ ] **Step 2: Write the failing smoke test**

Create `apps/login/src/test-utils/theme-smoke.test.tsx`:

```tsx
import { Button } from "@mui/material";
import { describe, expect, it } from "vitest";
import { renderWithTheme } from "./render-with-theme";

describe("biampTheme under React 19 + Vitest", () => {
  it("renders an MUI component and applies theme-generated classes", () => {
    const { getByRole } = renderWithTheme(<Button>Sign in</Button>);
    const button = getByRole("button", { name: "Sign in" });

    expect(button.className).toMatch(/Mui/);
  });

  it("exposes the Biamp spacing and radius scale", () => {
    const { getByTestId } = renderWithTheme(<div data-testid="probe" />);

    expect(getByTestId("probe")).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run it and watch it fail**

```bash
pnpm --filter @zitadel/login exec vitest --run src/test-utils/theme-smoke.test.tsx
```

Expected before Task 1 is installed: FAIL, `Cannot find module '@bwp-web/styles'`.
After Task 1: this should already PASS — that is the point of the spike. If it
fails for any other reason, stop and report; do not work around it.

- [ ] **Step 4: Prove the Next.js build accepts AppRouterCacheProvider**

Create `apps/login/src/components/providers.tsx`:

```tsx
"use client";

import { biampTheme } from "@bwp-web/styles";
import { CssBaseline, ThemeProvider as MuiThemeProvider } from "@mui/material";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ReactNode } from "react";

const theme = biampTheme();

/**
 * The whole styling stack, in one client boundary.
 *
 * Order matters: the emotion cache must be outermost so server-rendered styles
 * flush into <head> before hydration. next-themes writes a class on <html>,
 * which is exactly what biampTheme's
 * `cssVariables.colorSchemeSelector: 'class'` reads — so dark mode keeps
 * working without MUI's own colour-scheme toggle.
 *
 * CssBaseline is NOT optional: biampTheme injects its @font-face rules through
 * MuiCssBaseline.styleOverrides, so removing it silently drops every Biamp
 * font.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ key: "mui" }}>
      <NextThemesProvider attribute="class" enableSystem>
        <MuiThemeProvider theme={theme} defaultMode="system">
          <CssBaseline />
          {children}
        </MuiThemeProvider>
      </NextThemesProvider>
    </AppRouterCacheProvider>
  );
}
```

Use the `@mui/material-nextjs/v16-appRouter` subpath. Version 7.3.10 does ship
a `v16-appRouter` directory — an earlier draft of this plan wrongly said it did
not. Its `index.js` is byte-identical to `v15-appRouter` (both re-export
`../v13-appRouter`), so it makes no runtime difference today, but it is the
version-matched, forward-correct choice for a Next 16 app.

**Verified on 2026-09-02:** this builds and renders on Next 16.2.11 with no
shim. `AppRouterCacheProvider` works; Risk 1 is closed.

- [ ] **Step 5: Build and confirm**

```bash
pnpm nx run @zitadel/login:build
```

Expected: build succeeds. If `AppRouterCacheProvider` errors on Next 16, **stop
and report** — the spec's documented fallback is a hand-rolled provider using
`useServerInsertedHTML` directly, and that decision is the user's to make.

- [ ] **Step 6: Checkpoint — report to the user**

Report: smoke test output, build result, and an explicit verdict on Risk 1
(does `@mui/material-nextjs@7` work on Next 16 or not). Files ready to commit:
`src/test-utils/render-with-theme.tsx`, `src/test-utils/theme-smoke.test.tsx`,
`src/components/providers.tsx`.

---

# Phase 1 — Theme foundation

### Task 3: Install the provider stack in the root layout

**Files:**
- Modify: `apps/login/src/app/(login)/layout.tsx`
- Modify: `apps/login/next.config.mjs`

- [ ] **Step 1: Extend optimizePackageImports**

In `apps/login/next.config.mjs`, replace the `optimizePackageImports` line:

```js
    optimizePackageImports: [
      "@radix-ui/react-tooltip",
      "@heroicons/react",
      "@bwp-web/assets",
      "@bwp-web/components",
      "@mui/material",
    ],
```

`@bwp-web/assets` matters most: it bundles every image as a base64 data URI
into one 3.7 MB module, and this is what lets the unused ones tree-shake out.

- [ ] **Step 2: Rewrite the layout**

Replace the whole return block of `apps/login/src/app/(login)/layout.tsx`.
Remove the `Lato` font import, `BackgroundWrapper`, and both Tailwind
`bg-background-*` wrapper divs. Keep `generateMetadata`, the allowed-languages
fetch, `LanguageProvider` and `Tooltip.Provider`.

```tsx
import "@/styles/globals.scss";

import { LanguageProvider } from "@/components/language-provider";
import { Providers } from "@/components/providers";
import { Skeleton } from "@/components/skeleton";
import { LANGS, getLanguage } from "@/lib/i18n";
import { getServiceConfig } from "@/lib/service-url";
import { getAllowedLanguages } from "@/lib/zitadel";
import * as Tooltip from "@radix-ui/react-tooltip";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import React, { Suspense } from "react";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common");
  return { title: t("title") };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const _headers = await headers();
  const { serviceConfig } = getServiceConfig(_headers);

  let languages = LANGS;
  try {
    const settings = await getAllowedLanguages({ serviceConfig });
    if (settings.allowedLanguages?.length) {
      languages = settings.allowedLanguages
        .filter((code) => LANGS.find((l) => l.code === code))
        .map((code) => getLanguage(code));
    }
  } catch (e) {
    console.error("Failed to load supported languages", e);
  }

  return (
    <html suppressHydrationWarning>
      <head />
      <body>
        <Providers>
          <Tooltip.Provider>
            <Suspense fallback={<Skeleton />}>
              <LanguageProvider>{children}</LanguageProvider>
            </Suspense>
          </Tooltip.Provider>
        </Providers>
      </body>
    </html>
  );
}
```

`globals.scss` stays imported for now — it is removed in Phase 5, once nothing
depends on its base rules. `languages` is threaded into `LandingShell` in
Task 4; until then it is computed and unused, which is expected.

- [ ] **Step 3: Verify the app still boots**

```bash
pnpm nx run @zitadel/login:build
```

Expected: build succeeds. Then with the dev server running:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/ui/v2/login/loginname
```

Expected: `200`. The page will look broken/unstyled at this point — the shell
does not exist yet. That is correct.

- [ ] **Step 4: Checkpoint — report to the user**

Report build result and HTTP status. Note explicitly that the page is expected
to look wrong until Task 5.

---

### Task 4: Build `LandingShell`

**Files:**
- Create: `apps/login/src/components/bwp/landing-shell.tsx`
- Create: `apps/login/src/components/bwp/landing-shell.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `apps/login/src/components/bwp/landing-shell.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test-utils/render-with-theme";
import { LandingShell } from "./landing-shell";

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "light", setTheme: vi.fn(), theme: "light" }),
}));

describe("LandingShell", () => {
  it("renders its children", () => {
    const { getByText } = renderWithTheme(
      <LandingShell>
        <p>form goes here</p>
      </LandingShell>,
    );

    expect(getByText("form goes here")).toBeInTheDocument();
  });

  it("renders the hero title and subtitle when given", () => {
    const { getByText } = renderWithTheme(
      <LandingShell title="Welcome to Workplace" subtitle="Manage every space effortlessly.">
        <p>child</p>
      </LandingShell>,
    );

    expect(getByText("Welcome to Workplace")).toBeInTheDocument();
    expect(getByText("Manage every space effortlessly.")).toBeInTheDocument();
  });

  it("omits the hero entirely when no title is given", () => {
    const { queryByRole } = renderWithTheme(
      <LandingShell>
        <p>child</p>
      </LandingShell>,
    );

    // `level: 1` is load-bearing, not incidental. BiampHeaderTitle hardcodes
    // <Typography variant="h4"> for the persistent "Workplace" lockup, and
    // MUI's default variantMapping renders h4 as a native <h4> — role
    // "heading". So a bare queryByRole("heading") can NEVER be empty here and
    // the assertion would always fail. The hero is the shell's only <h1>.
    expect(queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
  });

  it("renders the copyright footer", () => {
    const year = new Date().getFullYear();
    const { getByText } = renderWithTheme(
      <LandingShell>
        <p>child</p>
      </LandingShell>,
    );

    expect(getByText(`© ${year} Biamp Systems LLC.`)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

```bash
pnpm --filter @zitadel/login exec vitest --run src/components/bwp/landing-shell.test.tsx
```

Expected: FAIL — `Failed to resolve import "./landing-shell"`.

- [ ] **Step 3: Implement the shell**

Create `apps/login/src/components/bwp/landing-shell.tsx`. This is the
`LoginLandingPage` story's composition, re-implemented — the story is not
importable.

```tsx
"use client";

import { BiampLogo, LandingPageBackground } from "@bwp-web/assets";
import { BiampHeaderTitle } from "@bwp-web/components";
import { Box, Stack, Typography } from "@mui/material";
import { type ReactNode } from "react";

export type LandingShellProps = {
  /** Hero heading. Omit for interior steps that need no page title. */
  title?: ReactNode;
  /** Supporting line under the hero heading. */
  subtitle?: ReactNode;
  /** The form panel. */
  children: ReactNode;
  /** Help text rendered under the panel, e.g. "Trouble signing in?". */
  helpText?: ReactNode;
  /** Language switcher / theme switch, rendered in the footer. */
  actions?: ReactNode;
};

/**
 * The chrome shared by every route in the login flow: full-bleed background,
 * the centred Biamp logo lockup, an optional hero, the form slot, and the
 * Biamp footer.
 *
 * Unlike the Storybook original this uses `position: fixed; zIndex: -1` for the
 * background — the story only used an absolute layer to sit above Storybook's
 * own preview decorator, which does not exist here.
 */
export function LandingShell({ title, subtitle, children, helpText, actions }: LandingShellProps) {
  return (
    <Box sx={{ position: "relative", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Box
        aria-hidden
        sx={{
          position: "fixed",
          inset: 0,
          zIndex: -1,
          backgroundImage: `url("${LandingPageBackground}")`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <Stack alignItems="center" py={3}>
        <BiampHeaderTitle title="Workplace" sx={{ "& .MuiTypography-root": { color: "#ffffff" } }} />
      </Stack>

      <Stack flex={1} alignItems="center" justifyContent="center" gap="54px" py={4}>
        {title && (
          <Stack alignItems="center" gap="21px" px={2} maxWidth={441}>
            {/* h1 for the Montserrat family and page-title semantics; the size
                is overridden because no theme variant is 36px/600 — the scale
                jumps from h1 (28px/500) to h0 (56px/500). */}
            <Typography
              variant="h1"
              color="common.white"
              textAlign="center"
              sx={{ fontSize: 36, fontWeight: 600, lineHeight: 1, letterSpacing: "-1.44px" }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body1" color="text.sidebar" textAlign="center">
                {subtitle}
              </Typography>
            )}
          </Stack>
        )}

        <Stack alignItems="center" gap={2.5} width="100%">
          {children}
          {helpText && (
            <Typography variant="body2" color="text.secondary" textAlign="center" px={2} maxWidth={441}>
              {helpText}
            </Typography>
          )}
        </Stack>
      </Stack>

      <Stack alignItems="center" gap={1} py={2}>
        {actions && (
          <Stack direction="row" alignItems="center" gap={2} pb={1}>
            {actions}
          </Stack>
        )}
        <BiampLogo style={{ width: 76, height: "auto", color: "#ffffff" }} />
        <Typography variant="caption" color="text.secondary">
          {`© ${new Date().getFullYear()} Biamp Systems LLC.`}
        </Typography>
      </Stack>
    </Box>
  );
}
```

- [ ] **Step 4: Run the tests and confirm they pass**

```bash
pnpm --filter @zitadel/login exec vitest --run src/components/bwp/landing-shell.test.tsx
```

Expected: 4 passing.

- [ ] **Step 5: Checkpoint — report to the user**

Report test output. Ready to commit: `src/components/bwp/landing-shell.tsx`
and its test.

---

# Phase 2 — Make `/loginname` real

### Task 5: Rebuild `UsernameForm` on LandingFormPanel

**Files:**
- Modify: `apps/login/src/components/username-form.tsx`
- Modify: `apps/login/src/components/username-form.test.tsx` — **this file already
  exists** (an earlier draft said "create"). It contains one test,
  `"should autofocus the loginName input on mount"`, using bare RTL `render`.
  Extend it; do not overwrite it, and carry that test forward converted to
  `renderWithTheme`.

Four testids must survive: `username-text-input`, `register-button`, `error`,
`submit-button`.

**`back-button` is a fifth testid in the source that has never reached the
DOM.** `back-button.tsx` declares `export function BackButton()` — **zero
props** — so the `data-testid="back-button"` passed at the call site is
silently discarded. This is pre-existing upstream behaviour, not something the
migration broke, and `apps/login/acceptance/` never selects it, so leave the
prop on the call site and assert the back button by role/text instead. Do not
"fix" `BackButton` to accept props as part of this task.

- [ ] **Step 1: Write the failing test**

Create `apps/login/src/components/username-form.test.tsx`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test-utils/render-with-theme";
import { UsernameForm } from "./username-form";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}));

vi.mock("@/lib/server/loginname", () => ({
  sendLoginname: vi.fn(async () => ({})),
}));

const baseProps = {
  loginName: undefined,
  requestId: undefined,
  loginSettings: undefined,
  submit: false,
  allowRegister: true,
};

describe("UsernameForm", () => {
  it("puts data-testid on the input element itself, so Playwright can type into it", () => {
    const { getByTestId } = renderWithTheme(<UsernameForm {...baseProps} />);
    const input = getByTestId("username-text-input");

    // pressSequentially() and toHaveValue() in
    // acceptance/tests/loginname-screen.ts both require a real <input>.
    expect(input.tagName).toBe("INPUT");
  });

  it("renders the submit and back buttons with their testids", () => {
    const { getByTestId } = renderWithTheme(<UsernameForm {...baseProps} />);

    expect(getByTestId("submit-button")).toBeInTheDocument();
    expect(getByTestId("back-button")).toBeInTheDocument();
  });

  it("renders the register button when registration is allowed", () => {
    const { getByTestId } = renderWithTheme(<UsernameForm {...baseProps} />);

    expect(getByTestId("register-button")).toBeInTheDocument();
  });

  it("hides the register button when registration is not allowed", () => {
    const { queryByTestId } = renderWithTheme(<UsernameForm {...baseProps} allowRegister={false} />);

    expect(queryByTestId("register-button")).not.toBeInTheDocument();
  });

  it("wires react-hook-form to the real input, so typing enables the submit button", async () => {
    // THE regression guard for the inputRef bug. LandingFormField spreads onto
    // MUI TextField, whose `ref` targets the root div. If register()'s ref is
    // spread in whole rather than routed to `inputRef`, RHF registers a div:
    // it sees no value, formState.isValid stays false, and submit stays
    // disabled forever — a completely unusable login page that every
    // testid-presence assertion above would still happily pass.
    const { getByTestId } = renderWithTheme(<UsernameForm {...baseProps} />);
    const input = getByTestId("username-text-input") as HTMLInputElement;

    expect(getByTestId("submit-button")).toBeDisabled();

    fireEvent.input(input, { target: { value: "jane.doe@acme.com" } });

    await waitFor(() => expect(getByTestId("submit-button")).not.toBeDisabled());
  });
});
```

Import `fireEvent` and `waitFor` from the test helper alongside
`renderWithTheme`, and add `afterEach(cleanup)` per the ground rules.

- [ ] **Step 2: Run it and confirm the testid test fails**

```bash
pnpm --filter @zitadel/login exec vitest --run src/components/username-form.test.tsx
```

Expected: the first test FAILS with `expected 'INPUT' to be ...` once the
component is migrated naively, and passes only with `slotProps.htmlInput`. Run
it now against the current Tailwind implementation to confirm the suite is
green as a baseline, then keep it green through the rewrite.

- [ ] **Step 3: Rewrite the markup**

In `apps/login/src/components/username-form.tsx`, keep **all** logic
untouched — `useForm`, `submitLoginName`, the `useEffect` auto-submit, the
`inputLabel` derivation, `samlData`, `handleServerActionResponse`.

First, immediately above the `return`, split the register result so the ref can
be routed to the input rather than the `TextField` root:

```tsx
  // See the CRITICAL comment on the field below: the ref must go to inputRef,
  // not into the spread.
  const { ref: loginNameRef, ...loginNameField } = register("loginName", {
    required: t("required.loginName"),
  });
```

Then replace the returned JSX:

```tsx
  return (
    <>
      {samlData && <AutoSubmitForm url={samlData.url} fields={samlData.fields} />}
      <LandingFormPanel onSubmit={handleSubmit((e) => submitLoginName(e, organization))} sx={{ borderRadius: 2 }}>
        <LandingFormField
          label={inputLabel}
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoFocus
          // CRITICAL: react-hook-form's `ref` must reach the <input>, and
          // `LandingFormField` spreads its props onto MUI's `TextField`, whose
          // `ref` goes to the ROOT DIV. Spreading `{...register(...)}` whole
          // would register a div: RHF tracks no value, `formState.isValid`
          // never becomes true, and the submit button stays disabled forever.
          // Split the ref out and hand it to `inputRef`, which TextField
          // forwards to the input. See `loginNameRef` destructuring above.
          {...loginNameField}
          inputRef={loginNameRef}
          // The theme turns adornment icons text.primary while a field is
          // focused, which blacks out the blue submit arrow for the whole
          // flow. `inherit` hands the colour back to the IconButton.
          sx={{ "& .MuiOutlinedInput-root.Mui-focused .MuiInputAdornment-root svg": { color: "inherit" } }}
          slotProps={{
            // MUST be htmlInput, not the field root: the acceptance suite
            // calls pressSequentially()/toHaveValue() on this testid.
            htmlInput: { "data-testid": "username-text-input" },
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    type="submit"
                    variant="none"
                    size="medium"
                    aria-label={t("submit")}
                    data-testid="submit-button"
                    disabled={loading || !formState.isValid}
                    sx={{ color: "info.main", "&.Mui-disabled": { color: "action.disabled" } }}
                  >
                    {loading ? <CircularProgress size={20} /> : <SquareRoundedArrowRightFilledIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />

        {error && (
          // Keep this wrapper: the acceptance suite asserts
          // getByTestId("error").locator("div").
          <Box data-testid="error">
            <Alert>{error}</Alert>
          </Box>
        )}

        <Stack direction="row" alignItems="center" gap={1}>
          <BackButton data-testid="back-button" />
          <Box flexGrow={1} />
          {allowRegister && (
            <MuiLink
              component="button"
              type="button"
              variant="body2"
              data-testid="register-button"
              disabled={loading}
              onClick={() => {
                const registerParams = new URLSearchParams();
                if (organization) {
                  registerParams.append("organization", organization);
                }
                if (requestId) {
                  registerParams.append("requestId", requestId);
                }
                router.push("/register?" + registerParams);
              }}
            >
              <Translated i18nKey="register" namespace="loginname" />
            </MuiLink>
          )}
        </Stack>
      </LandingFormPanel>
    </>
  );
```

Update the imports at the top of the file: drop `TextInput`, `Button`,
`ButtonVariants` and `Spinner`; add

```tsx
import { SquareRoundedArrowRightFilledIcon } from "@bwp-web/assets";
import { LandingFormField, LandingFormPanel } from "@bwp-web/components";
import { Box, CircularProgress, IconButton, InputAdornment, Link as MuiLink, Stack } from "@mui/material";
```

Keep `Alert`, `AutoSubmitForm`, `BackButton` and `Translated` imports as-is —
`Alert` and `BackButton` become MUI-backed in Phase 3 without changing their
call sites.

`LandingFormPanel` renders a real `<form>` and always calls
`preventDefault()`, so `onSubmit` replaces the old `onClick` on the submit
button. The submit control moved into the field's end adornment, matching the
bwp design; it keeps `data-testid="submit-button"`.

- [ ] **Step 4: Run the tests and confirm all pass**

```bash
pnpm --filter @zitadel/login exec vitest --run src/components/username-form.test.tsx
```

Expected: 4 passing.

- [ ] **Step 5: Checkpoint — report to the user**

Report test output plus an explicit confirmation that all five testids are
present and that `username-text-input` resolves to an `<input>`.

---

### Task 6: Compose the `/loginname` page

**Files:**
- Modify: `apps/login/src/app/(login)/loginname/page.tsx`

- [ ] **Step 1: Rewrite the page**

Remove the `getBrandingSettings` call, the `branding` variable, the
`DynamicTheme` import and wrapper, and the `<h1>`/`<p className="ztdl-p">`
block. Keep `getDefaultOrg`, `getLoginSettings` and
`getActiveIdentityProviders` exactly as they are.

Replace the imports:

```tsx
import { LandingShell } from "@/components/bwp/landing-shell";
import { SignInWithIdp } from "@/components/sign-in-with-idp";
import { Translated } from "@/components/translated";
import { UsernameForm } from "@/components/username-form";
import { getServiceConfig } from "@/lib/service-url";
import { getActiveIdentityProviders, getDefaultOrg, getLoginSettings } from "@/lib/zitadel";
import { Organization } from "@zitadel/proto/zitadel/org/v2/org_pb";
import { Box } from "@mui/material";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
```

And the return block:

```tsx
  return (
    <LandingShell
      title={<Translated i18nKey="title" namespace="loginname" />}
      subtitle={<Translated i18nKey="description" namespace="loginname" />}
    >
      {loginSettings?.allowLocalAuthentication && (
        <UsernameForm
          loginName={loginName}
          requestId={requestId}
          organization={organization}
          defaultOrganization={defaultOrganization}
          loginSettings={loginSettings}
          suffix={orgDomain}
          submit={submit}
          allowRegister={!!loginSettings?.allowRegister}
        />
      )}

      {loginSettings?.allowExternalIdp && !!identityProviders?.length && (
        <Box width="100%" maxWidth={441} pt={3} pb={2}>
          <SignInWithIdp
            identityProviders={identityProviders}
            requestId={requestId}
            organization={organization}
            postErrorRedirectUrl="/loginname"
            showLabel={loginSettings?.allowLocalAuthentication}
          />
        </Box>
      )}
    </LandingShell>
  );
```

`hideSuffix` is gone entirely, not passed at all. It was
`branding?.hideLoginNameSuffix`, and with branding dropped there is no source
for it — but more to the point, the suffix is no longer rendered anywhere
(product decision; see rule 4 in the ground rules). **Also delete `hideSuffix`
from `UsernameForm`'s `Props` type as part of this task**, now that this, its
last caller, has stopped passing it. `suffix` itself stays — `sendLoginname()`
still needs it for org resolution.

**No `helpText` is passed.** The bwp design shows "Trouble signing in? Contact
your organization's administrator." under the panel, but no such key exists in
`apps/login/locales/` and there are 15 locale files — adding a translated
string across all of them is out of scope here. `loginname.title`
("Welcome back!") and `loginname.description` ("Enter your login details.")
supply the hero. Do **not** reuse `description` for both `subtitle` and
`helpText`; that renders the same sentence twice.

- [ ] **Step 2: Build and verify the route renders**

```bash
pnpm nx run @zitadel/login:build
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/ui/v2/login/loginname
```

Expected: build succeeds, `200`.

- [ ] **Step 3: Verify visually**

Open `http://localhost:3000/ui/v2/login/loginname`. Expected: the Biamp
background image, white "Workplace" lockup at top, hero copy, and a light grey
`LandingFormPanel` with one field and a blue submit arrow.

- [ ] **Step 4: Run the full unit suite for regressions**

```bash
pnpm --filter @zitadel/login exec vitest --run
```

Expected: failures confined to `button.test.tsx`, `input.test.tsx`,
`card.test.tsx`, `avatar.test.tsx`, `password-complexity.test.tsx` — those are
fixed in Phase 3. Report any failure outside that set.

- [ ] **Step 5: Checkpoint — report to the user**

Report build, HTTP status, what the page looks like, and the unit-suite result.
**This is the first point where the user can see the Biamp login page**, so
pause here for their reaction before Phase 3.

---

### Task 6A: Allow `data:` fonts and images in the CSP

**Discovered during Task 6 execution, 2026-09-02.** Neither the spec nor the
original plan anticipated this, and without it **the entire migration is
invisible in a real browser** — the page builds, all tests pass, and it renders
as unstyled boxes with a broken-image icon.

**Root cause.** `@bwp-web/assets` ships every font and image as a base64
`data:` URI (tsup's `dataurl` loader), and `biampTheme` injects the fonts via
`@font-face` rules in `MuiCssBaseline`. But `src/lib/csp.ts` sets:

```
font-src 'self' <serviceUrl>
img-src  'self' <serviceUrl>
```

with no `data:` scheme, applied to every route by `src/proxy.ts`
(`matcher: ["/:path*"]`) and by `src/lib/server/flow-initiation.ts`. The browser
blocks all of it. Confirmed by re-rendering the page with the CSP header
stripped: it then displays exactly as designed.

**Security note, for the record.** Adding `data:` to `font-src` and `img-src`
is a low-risk, widely standard allowance; the XSS-relevant directives are
`script-src` and `object-src`, and **neither is touched**. For proportion: this
CSP already ships `script-src 'self' 'unsafe-inline' 'unsafe-eval'`, which is a
far weaker posture than anything `data:` on fonts and images introduces. The
strict-CSP alternative is to stop using data URIs at all — extract the fonts
and the background from `@bwp-web/assets` at build time and self-host them
under the app's `public/` so `'self'` keeps sufficing. That is more work, lives
partly in another repository, and is the fallback if the owner rejects this.

**Files:**
- Modify: `apps/login/src/lib/csp.ts`
- Modify: `apps/login/src/lib/csp.test.ts`

- [ ] **Step 1: Update the failing tests first**

`csp.test.ts` has 6 tests, and four assertions pin exact directive strings that
this change reorders — lines asserting `"font-src 'self'"`,
`"img-src 'self'"`, `"img-src 'self' https://my-instance.zitadel.cloud"`,
`"font-src 'self' https://my-instance.zitadel.cloud"`, and the same pair for
`https://zitadel.mycompany.com`. Update them to expect `data:` in position, and
**add two new tests** asserting the scheme is present and that `script-src`
still does NOT contain it:

```ts
test("allows data: URIs for fonts and images, which @bwp-web/assets ships", () => {
  const csp = buildCSP();

  expect(csp).toContain("font-src 'self' data:");
  expect(csp).toContain("img-src 'self' data:");
});

test("does NOT allow data: in script-src or object-src", () => {
  const csp = buildCSP({ serviceUrl: "https://my-instance.zitadel.cloud" });

  const scriptSrc = csp.split("; ").find((d) => d.startsWith("script-src"));
  const objectSrc = csp.split("; ").find((d) => d.startsWith("object-src"));

  expect(scriptSrc).not.toContain("data:");
  expect(objectSrc).not.toContain("data:");
});
```

- [ ] **Step 2: Run them and confirm they fail**

```bash
pnpm --filter @zitadel/login exec vitest --run src/lib/csp.test.ts
```

- [ ] **Step 3: Add the scheme**

In `apps/login/src/lib/csp.ts`, in `BASE_DIRECTIVES` only:

```ts
  // @bwp-web/assets ships fonts and images as base64 data: URIs, and
  // biampTheme injects the @font-face rules through MuiCssBaseline. Without
  // this the Biamp theme renders with no background, no logo and fallback
  // fonts. Deliberately NOT added to script-src or object-src.
  "font-src": ["'self'", "data:"],
  "img-src": ["'self'", "data:"],
```

Leave `buildCSP`'s `serviceUrl` append logic untouched — it appends after
these, giving `img-src 'self' data: <serviceUrl>`.

- [ ] **Step 4: Verify the page actually renders**

```bash
pnpm --filter @zitadel/login exec vitest --run src/lib/csp.test.ts
pnpm --filter @zitadel/login exec vitest --run
curl -sI http://localhost:3000/ui/v2/login/loginname | grep -i content-security-policy
```

The header must now show `font-src 'self' data:` and `img-src 'self' data:`.
Then screenshot `http://localhost:3000/ui/v2/login/loginname` at 1440x900 and
confirm visually: maroon Biamp background present, white `b.` + "Workplace"
lockup, "Welcome back!" in Montserrat, light form card, blue submit arrow,
`biamp.` wordmark footer. Check the browser console has **no** CSP violation
messages.

- [ ] **Step 5: Checkpoint — report to the user**

---

### Task 6B: Match the Storybook copy and strip the extra controls

**Added 2026-09-02** after the user compared the live page against
`LoginLandingPage.stories.tsx`. Two product decisions, both theirs:

1. **Match the design's copy, keeping all 15 locales working** — new i18n keys,
   English text everywhere initially, to be translated later.
2. **Drop both "Back" and "Register new user"** to pixel-match the mockup.

> ⚠️ **Consequence of (2), recorded deliberately:** the login page loses its
> registration entry point. `/register` remains reachable by direct URL and the
> route itself is untouched, but nothing in the UI links to it any more, and
> `loginSettings.allowRegister` stops having any effect on this page. This was
> raised with the user and chosen knowingly.

**Additive keys only.** Do **not** overwrite the existing `loginname.title`,
`loginname.description` or `labels.*` values — all 15 locales carry real
translations of them, `generateMetadata` still uses `title` for the browser tab,
and other routes share the `labels` block. Add new keys alongside.

**Files:** `apps/login/locales/*.json` (15 files),
`src/app/(login)/loginname/page.tsx`, `src/components/username-form.tsx`,
`src/components/username-form.test.tsx`

- [ ] **Step 1: Add the new keys to all 15 locale files**

Under `loginname`, in `en.json` and identically (English, pending translation)
in `ar de es fr hu it ja nl pl pt ru tr uk zh`:

```json
    "heroTitle": "Welcome to Workplace",
    "heroSubtitle": "Manage every space effortlessly with intuitive tools for seamless operations and extraordinary experiences.",
    "helpText": "Trouble signing in? Contact your organization's administrator.",
    "placeholder": "you@acme.com",
```

and inside the existing `loginname.labels` object:

```json
      "email": "Email",
```

- [ ] **Step 2: Point the page at the hero keys and add the help text**

In `loginname/page.tsx`, swap `title`/`description` for `heroTitle`/
`heroSubtitle` and pass `helpText`:

```tsx
    <LandingShell
      title={<Translated i18nKey="heroTitle" namespace="loginname" />}
      subtitle={<Translated i18nKey="heroSubtitle" namespace="loginname" />}
      helpText={<Translated i18nKey="helpText" namespace="loginname" />}
    >
```

`generateMetadata` keeps using `t("title")` — do not change it.

- [ ] **Step 3: Relabel the field, add the placeholder, remove the controls**

In `username-form.tsx`:

- Change only the **default** branch of the `inputLabel` derivation from
  `t("labels.loginname")` to `t("labels.email")`. Leave the three conditional
  branches (`labels.username`, `labels.usernameOrPhoneNumber`,
  `labels.usernameOrEmail`) exactly as they are — they cover configurations
  where the field genuinely is not an email, and mislabelling those would be a
  real bug. Add a comment saying so.
- Add `placeholder={t("placeholder")}` to `LandingFormField`.
- Delete the entire trailing `<Stack direction="row">` block: the `BackButton`,
  the `flexGrow` spacer, and the `MuiLink` register control.
- Remove the now-unused `allowRegister` prop from the `Props` type and the
  destructuring, and drop the `BackButton` and `Translated` imports if nothing
  else in the file uses them (`Translated` may now be unused — check).
- `router` is still needed by `handleServerActionResponse`; do not remove it.

- [ ] **Step 4: Update the page's props and the tests**

- In `loginname/page.tsx`, stop passing `allowRegister`.
- In `username-form.test.tsx`, delete the two register tests
  ("renders the register button when registration is allowed" / "hides the
  register button when registration is not allowed") and drop `allowRegister`
  from `baseProps`. Change the back-button assertion to confirm the control is
  **absent**. Add a placeholder test:

```tsx
  it("shows the design's email placeholder", () => {
    const { getByPlaceholderText } = renderWithTheme(<UsernameForm {...baseProps} />);

    expect(getByPlaceholderText("you@acme.com")).toBeInTheDocument();
  });
```

Keep the testid test, the RHF-wiring regression guard, and the autofocus test.

- [ ] **Step 5: Verify**

```bash
pnpm --filter @zitadel/login exec vitest --run
pnpm --filter @zitadel/login exec tsc --noEmit 2>&1 | grep -c "error TS"
pnpm nx run @zitadel/login:build
```

Then confirm every locale file is still valid JSON with the keys present:

```bash
for f in apps/login/locales/*.json; do
  node -e "const j=require('./$f').loginname;
    const k=['heroTitle','heroSubtitle','helpText','placeholder'].filter(x=>!j[x]);
    console.log('$f', k.length ? 'MISSING '+k : 'ok', j.labels.email ? '' : 'MISSING labels.email');"
done
```

- [ ] **Step 6: Screenshot and compare against the Storybook target**

Screenshot `/loginname` at 1440x900. It should now read "Welcome to Workplace"
with the two-line blurb, an "Email" field with the `you@acme.com` placeholder,
the help line under the panel, and **no** Back or Register controls.

- [ ] **Step 7: Checkpoint — report to the user**

---

# Phase 3 — Primitive swap

Each task follows the same shape: update the test to assert behaviour rather
than classes, rewrite the component's internals to MUI, keep the exported prop
signature and every testid, run the test.

**Shared rule for this phase:** the exported names and prop types must not
change. `ButtonVariants`, `ButtonSizes`, `ButtonColors`, `AlertType`,
`TextInputProps` and friends stay exported with the same members, because 122
call sites import them and are not being edited yet.

### Task 7: `alert.tsx` → MUI Alert (42 call sites)

**Files:**
- Modify: `apps/login/src/components/alert.tsx`
- Test: `apps/login/src/components/alert.test.tsx` (create)

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, expect, it } from "vitest";
import { renderWithTheme } from "@/test-utils/render-with-theme";
import { Alert, AlertType } from "./alert";

describe("Alert", () => {
  it("renders its children inside a div, for getByTestId('error').locator('div')", () => {
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
```

- [ ] **Step 2: Run it and confirm it fails**

```bash
pnpm --filter @zitadel/login exec vitest --run src/components/alert.test.tsx
```

Expected: FAIL — the current implementation renders no `role="alert"`.

- [ ] **Step 3: Rewrite the component**

```tsx
import { Alert as MuiAlert } from "@mui/material";
import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  type?: AlertType;
};

// Preserved shape and member names — 42 call sites import this enum.
export enum AlertType {
  ALERT,
  INFO,
}

export function Alert({ children, type = AlertType.ALERT }: Props) {
  // @bwp-web/styles disables MUI's "filled" and "outlined" Alert variants
  // (see AlertPropsVariantOverrides in its augmentations) — "standard" is
  // the only variant this design system supports for Alert.
  return (
    <MuiAlert severity={type === AlertType.INFO ? "info" : "warning"} sx={{ width: "100%" }}>
      {children}
    </MuiAlert>
  );
}
```

MUI `Alert` supplies its own severity icon, so the heroicons imports go.

**Do not add `variant="outlined"`** — an earlier draft of this plan did, and it
is a type error: `@bwp-web/styles` sets `outlined: false` on
`AlertPropsVariantOverrides`. Leave the variant unset so it defaults to
`standard`. Verified rendering: an amber warning alert with a triangle icon,
full-width inside the light form card.

- [ ] **Step 4: Run the test and confirm it passes**

```bash
pnpm --filter @zitadel/login exec vitest --run src/components/alert.test.tsx
```

Expected: 3 passing.

- [ ] **Step 5: Checkpoint — report to the user**

---

### Task 8: `button.tsx` → MUI Button (25 call sites)

**Files:**
- Modify: `apps/login/src/components/button.tsx`
- Modify: `apps/login/src/components/button.test.tsx`

- [ ] **Step 1: Replace the class assertions in the existing test**

Open `apps/login/src/components/button.test.tsx`. Delete every assertion that
inspects `className` or calls `toHaveClass` against Tailwind utilities, and any
test of `getButtonClasses` (that export is being removed). Replace with
behaviour assertions, and switch `render` to `renderWithTheme`:

```tsx
import { describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test-utils/render-with-theme";
import { Button, ButtonSizes, ButtonVariants, ButtonColors } from "./button";

describe("Button", () => {
  it("renders its children", () => {
    const { getByRole } = renderWithTheme(<Button>Continue</Button>);

    expect(getByRole("button", { name: "Continue" })).toBeInTheDocument();
  });

  it("defaults to type=button so it never submits a form by accident", () => {
    const { getByRole } = renderWithTheme(<Button>Continue</Button>);

    expect(getByRole("button")).toHaveAttribute("type", "button");
  });

  it("honours an explicit type", () => {
    const { getByRole } = renderWithTheme(<Button type="submit">Go</Button>);

    expect(getByRole("button")).toHaveAttribute("type", "submit");
  });

  it("fires onClick", () => {
    const onClick = vi.fn();
    const { getByRole } = renderWithTheme(<Button onClick={onClick}>Go</Button>);
    getByRole("button").click();

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not fire onClick when disabled", () => {
    const onClick = vi.fn();
    const { getByRole } = renderWithTheme(
      <Button onClick={onClick} disabled>
        Go
      </Button>,
    );
    getByRole("button").click();

    expect(onClick).not.toHaveBeenCalled();
  });

  it("accepts every variant, size and colour without throwing", () => {
    for (const variant of Object.values(ButtonVariants)) {
      for (const size of Object.values(ButtonSizes)) {
        for (const color of Object.values(ButtonColors)) {
          const { unmount } = renderWithTheme(
            <Button variant={variant} size={size} color={color}>
              x
            </Button>,
          );
          unmount();
        }
      }
    }
  });

  it("forwards a ref to the button element", () => {
    let node: HTMLButtonElement | null = null;
    renderWithTheme(<Button ref={(el) => (node = el)}>x</Button>);

    expect(node?.tagName).toBe("BUTTON");
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

```bash
pnpm --filter @zitadel/login exec vitest --run src/components/button.test.tsx
```

Expected: FAIL on the import of `renderWithTheme` usage or on removed exports,
depending on order.

- [ ] **Step 3: Rewrite the component**

```tsx
import { Button as MuiButton } from "@mui/material";
import { ButtonHTMLAttributes, DetailedHTMLProps, forwardRef } from "react";

// All three enums keep their exact member names — 25 call sites import them.
export enum ButtonSizes {
  Small = "Small",
  Large = "Large",
}

export enum ButtonVariants {
  Primary = "Primary",
  Secondary = "Secondary",
  Destructive = "Destructive",
}

export enum ButtonColors {
  Neutral = "Neutral",
  Primary = "Primary",
  Warn = "Warn",
}

export type ButtonProps = DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement> & {
  size?: ButtonSizes;
  variant?: ButtonVariants;
  color?: ButtonColors;
};

function muiVariant(variant: ButtonVariants) {
  return variant === ButtonVariants.Primary ? "contained" : "outlined";
}

function muiColor(variant: ButtonVariants, color: ButtonColors) {
  if (variant === ButtonVariants.Destructive || color === ButtonColors.Warn) return "error" as const;
  if (color === ButtonColors.Neutral) return "inherit" as const;
  return "primary" as const;
}

// MUI's color="inherit" is a STATIC rule — `color: inherit; borderColor:
// currentColor` — that never consults the palette (verified in
// @mui/material@7.3.10 Button.js). So Neutral must pin its colour explicitly,
// or it silently takes whatever text colour an ancestor happens to set.
// LandingShell sets none (every text node in it carries its own `color` prop),
// so a Neutral button placed on its dark background would render dark-on-maroon.
// `text.primary` tracks the colour scheme in step with LandingFormPanel's own
// background (grey[100] light / grey[700] dark), so it stays readable in both.
const neutralSx = { color: "text.primary", borderColor: "text.primary" };

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = ButtonVariants.Primary,
      size = ButtonSizes.Small,
      color = ButtonColors.Primary,
      type = "button",
      className,
      ...props
    },
    ref,
  ) => (
    <MuiButton
      ref={ref}
      type={type}
      variant={muiVariant(variant)}
      color={muiColor(variant, color)}
      size={size === ButtonSizes.Large ? "large" : "medium"}
      className={className}
      sx={color === ButtonColors.Neutral ? neutralSx : undefined}
      {...props}
    >
      {children}
    </MuiButton>
  ),
);

Button.displayName = "Button";
```

`getButtonClasses` and the `ThemeableProps`/`roundness` prop are deleted.
**Measured blast radius: zero.** All 23 non-test call sites were grepped and
none passed `roundness` or imported `getButtonClasses`, so no call site needed
editing. `back-button.tsx` also needs no change — it declares no props and
delegates to `Button variant={ButtonVariants.Secondary}`.

Keep accepting and forwarding `className`: call sites still pass Tailwind
classes until the Phase 4 sweep, and there is a test guarding that forwarding
precisely because Phase 4 is when someone might "tidy it up" and break 20-odd
components at once.

- [ ] **Step 4: Run the test and confirm it passes**

```bash
pnpm --filter @zitadel/login exec vitest --run src/components/button.test.tsx
```

Expected: 7 passing.

- [ ] **Step 5: Typecheck for `roundness` fallout**

```bash
pnpm --filter @zitadel/login exec tsc --noEmit
```

Fix every reported `roundness` / `getButtonClasses` usage by deleting the prop
or import. Expected end state: no errors referencing `button.tsx`.

- [ ] **Step 6: Checkpoint — report to the user**

---

### Task 9: `input.tsx` → MUI TextField (13 call sites)

**Files:**
- Modify: `apps/login/src/components/input.tsx`
- Modify: `apps/login/src/components/input.test.tsx`

**This is the highest-risk primitive** — testid placement is what the
acceptance suite depends on.

- [ ] **Step 1: Rewrite the test around testid placement**

Replace `apps/login/src/components/input.test.tsx` entirely:

```tsx
import { describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test-utils/render-with-theme";
import { TextInput } from "./input";

describe("TextInput", () => {
  it("forwards data-testid onto the input element, not a wrapper", () => {
    const { getByTestId } = renderWithTheme(<TextInput label="Email" data-testid="username-text-input" />);
    const node = getByTestId("username-text-input");

    // acceptance/tests/loginname-screen.ts does
    // getByTestId(...).pressSequentially() and .toHaveValue(). Both need the
    // real <input>; a wrapper div silently breaks the whole suite.
    expect(node.tagName).toBe("INPUT");
  });

  it("renders its label", () => {
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
    const input = getByLabelText(/Email/) as HTMLInputElement;
    input.value = "a";
    input.dispatchEvent(new Event("input", { bubbles: true }));

    expect(onChange).toHaveBeenCalled();
  });

  it("renders the suffix when given", () => {
    const { getByText } = renderWithTheme(<TextInput label="Username" suffix="acme.com" />);

    expect(getByText("@acme.com")).toBeInTheDocument();
  });

  it("forwards a ref to the input element", () => {
    let node: HTMLInputElement | null = null;
    renderWithTheme(<TextInput label="Email" ref={(el) => (node = el)} />);

    expect(node?.tagName).toBe("INPUT");
  });
});
```

- [ ] **Step 2: Run it and confirm the testid test fails**

```bash
pnpm --filter @zitadel/login exec vitest --run src/components/input.test.tsx
```

Expected: FAIL.

- [ ] **Step 3: Rewrite the component**

```tsx
"use client";

import { InputAdornment, TextField } from "@mui/material";
import { ChangeEvent, DetailedHTMLProps, forwardRef, InputHTMLAttributes, ReactNode } from "react";

export type TextInputProps = DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> & {
  label: string;
  suffix?: string;
  placeholder?: string;
  defaultValue?: string;
  error?: string | ReactNode;
  success?: string | ReactNode;
  disabled?: boolean;
  onChange?: (value: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (value: ChangeEvent<HTMLInputElement>) => void;
};

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  (
    { label, placeholder, defaultValue, suffix, required = false, error, disabled, success, onChange, onBlur, ...props },
    ref,
  ) => {
    // Split data-* out of the rest so they can be routed to the <input>
    // instead of the TextField root. The acceptance suite types into these.
    const { "data-testid": testId, className, style, ...inputProps } = props as TextInputProps & {
      "data-testid"?: string;
    };

    return (
      <TextField
        fullWidth
        label={label}
        placeholder={placeholder}
        defaultValue={defaultValue}
        required={required}
        disabled={disabled}
        error={Boolean(error)}
        helperText={error ?? success ?? " "}
        onChange={onChange}
        onBlur={onBlur}
        inputRef={ref}
        className={className}
        style={style}
        slotProps={{
          // MUST be htmlInput. See the ground rules.
          htmlInput: { ...inputProps, "data-testid": testId, autoComplete: props.autoComplete ?? "off" },
          input: suffix ? { endAdornment: <InputAdornment position="end">{`@${suffix}`}</InputAdornment> } : undefined,
        }}
      />
    );
  },
);

TextInput.displayName = "TextInput";
```

`helperText` defaults to `" "` to reserve the message row, matching the old
fixed-height error line and preventing layout jump.

- [ ] **Step 4: Run the test and confirm it passes**

```bash
pnpm --filter @zitadel/login exec vitest --run src/components/input.test.tsx
```

Expected: 6 passing.

- [ ] **Step 5: Checkpoint — report to the user**

Report test output and state explicitly that `data-testid` lands on `<input>`.

---

### Task 10: `card.tsx` → MUI Paper (2 call sites)

**Files:**
- Modify: `apps/login/src/components/card.tsx`
- Modify: `apps/login/src/components/card.test.tsx`

- [ ] **Step 1: Replace the class assertions**

```tsx
import { describe, expect, it } from "vitest";
import { renderWithTheme } from "@/test-utils/render-with-theme";
import { Card } from "./card";

describe("Card", () => {
  it("renders its children", () => {
    const { getByText } = renderWithTheme(<Card>content</Card>);

    expect(getByText("content")).toBeInTheDocument();
  });

  it("passes through arbitrary div attributes", () => {
    const { getByTestId } = renderWithTheme(<Card data-testid="the-card">content</Card>);

    expect(getByTestId("the-card")).toBeInTheDocument();
  });

  it("forwards a ref to the root element", () => {
    let node: HTMLDivElement | null = null;
    renderWithTheme(<Card ref={(el) => (node = el)}>content</Card>);

    expect(node?.tagName).toBe("DIV");
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

```bash
pnpm --filter @zitadel/login exec vitest --run src/components/card.test.tsx
```

Expected: FAIL on removed `roundness`/`padding` behaviour or on the old class
assertions.

- [ ] **Step 3: Rewrite the component**

```tsx
import { Paper } from "@mui/material";
import { HTMLAttributes, ReactNode, forwardRef } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(({ children, className, ...props }, ref) => (
  <Paper ref={ref} elevation={0} className={className} sx={{ p: 3, borderRadius: 2 }} {...props}>
    {children}
  </Paper>
));

Card.displayName = "Card";
```

- [ ] **Step 4: Run the test and confirm it passes**

Expected: 3 passing.

- [ ] **Step 5: Typecheck and fix `roundness`/`padding` call sites**

```bash
pnpm --filter @zitadel/login exec tsc --noEmit
```

- [ ] **Step 6: Checkpoint — report to the user**

---

### Task 11: `spinner.tsx` → CircularProgress (17 call sites)

**Files:**
- Modify: `apps/login/src/components/spinner.tsx`
- Test: `apps/login/src/components/spinner.test.tsx` (create)

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, expect, it } from "vitest";
import { renderWithTheme } from "@/test-utils/render-with-theme";
import { Spinner } from "./spinner";

describe("Spinner", () => {
  it("exposes a status role for assistive tech", () => {
    const { getByRole } = renderWithTheme(<Spinner />);

    expect(getByRole("status")).toBeInTheDocument();
  });

  it("still accepts a className, since 17 call sites pass sizing classes", () => {
    const { getByRole } = renderWithTheme(<Spinner className="mr-2 h-5 w-5" />);

    expect(getByRole("status")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

```bash
pnpm --filter @zitadel/login exec vitest --run src/components/spinner.test.tsx
```

Expected: FAIL — no `role="status"` wrapper in the MUI version yet.

- [ ] **Step 3: Rewrite the component**

```tsx
import { CircularProgress } from "@mui/material";
import { FC } from "react";

/**
 * className is kept in the signature because 17 call sites still pass Tailwind
 * sizing utilities. Those are stripped during the Phase 4 sweep; until then the
 * prop is accepted and ignored for layout, with size controlled here.
 */
export const Spinner: FC<{ className?: string }> = ({ className = "" }) => (
  <CircularProgress role="status" size={20} className={className} color="inherit" />
);
```

- [ ] **Step 4: Run the test and confirm it passes**

Expected: 2 passing.

- [ ] **Step 5: Checkpoint — report to the user**

---

### Task 12: `avatar.tsx` (5 call sites)

**Files:**
- Modify: `apps/login/src/components/avatar.tsx`
- Modify: `apps/login/src/components/avatar.test.tsx`

`getInitials` is pure logic with existing passing tests — **do not touch it or
its tests.** Only the rendered markup changes.

- [ ] **Step 1: Strip the class assertions from the existing test**

In `apps/login/src/components/avatar.test.tsx`, keep the entire
`describe("getInitials")` block untouched. In the rendering block, replace
`render` with `renderWithTheme` and delete assertions inspecting Tailwind
classes, replacing them with:

```tsx
  it("renders the initials when no image is given", () => {
    const { getByText } = renderWithTheme(<Avatar name="John Doe" loginName="john.doe@example.com" />);

    expect(getByText("JD")).toBeInTheDocument();
  });
```

- [ ] **Step 2: Run it and confirm it fails**

```bash
pnpm --filter @zitadel/login exec vitest --run src/components/avatar.test.tsx
```

- [ ] **Step 3: Rewrite the rendered markup**

Replace the Tailwind wrapper markup with MUI `Avatar`, dropping the
`@/lib/theme` import and the `roundness` handling. Keep the exported
`getInitials` function and the component's prop signature byte-identical.

```tsx
import { Avatar as MuiAvatar } from "@mui/material";
```

Render the avatar as:

```tsx
<MuiAvatar src={imageUrl} alt={name} sx={{ width: 40, height: 40 }}>
  {getInitials(name, loginName)}
</MuiAvatar>
```

`avatar.tsx` currently sets **no** `data-testid` — verified by grep — so there
is none to preserve here. Do not invent one; adding a testid that no test reads
is noise. MUI `Avatar` renders the `src` itself, so the `next/image` import is
dropped; the existing `vi.mock("next/image", ...)` in the test becomes dead and
should be deleted along with it.

- [ ] **Step 4: Run the test and confirm it passes**

- [ ] **Step 5: Checkpoint — report to the user**

---

### Task 13: `checkbox.tsx` (1 call site) and verify `back-button.tsx`

**Files:**
- Modify: `apps/login/src/components/checkbox.tsx`
- Read only: `apps/login/src/components/back-button.tsx`

`back-button.tsx` contains no styling of its own — it delegates entirely to
`Button` and `Translated`. It needs **no change**; confirm this by reading it
and report that finding rather than editing it.

- [ ] **Step 1: Write the failing test**

Create `apps/login/src/components/checkbox.test.tsx`:

Note `checked` is a **required** prop on the current `CheckboxProps`, and the
component keeps internal state synced to it via `useEffect`. The tests must
pass it, and that controlled-with-local-state behaviour must be preserved —
`privacy-policy-checkboxes.tsx` relies on `onChangeVal`.

```tsx
import { describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test-utils/render-with-theme";
import { Checkbox } from "./checkbox";

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

  it("re-syncs when the checked prop changes", () => {
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
});
```

`rerender` from the helper's re-export is not wrapped in the provider, so wrap
it manually if the fourth test fails on a missing theme — or assert via a fresh
`renderWithTheme` instead.

- [ ] **Step 2: Run it and confirm it fails**

```bash
pnpm --filter @zitadel/login exec vitest --run src/components/checkbox.test.tsx
```

Expected: FAIL — `toBeChecked` will not match the Tailwind `form-checkbox`
markup's nesting, and there is no theme in scope.

- [ ] **Step 3: Rewrite the component**

```tsx
import { Checkbox as MuiCheckbox, FormControlLabel } from "@mui/material";
import { DetailedHTMLProps, forwardRef, InputHTMLAttributes, useEffect, useState } from "react";

export type CheckboxProps = DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> & {
  checked: boolean;
  disabled?: boolean;
  onChangeVal?: (checked: boolean) => void;
};

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { className, checked = false, disabled = false, onChangeVal, children, ...props },
  ref,
) {
  // Local state mirroring the prop is existing behaviour that
  // privacy-policy-checkboxes.tsx depends on — keep it.
  const [enabled, setEnabled] = useState<boolean>(checked);

  useEffect(() => {
    setEnabled(checked);
  }, [checked]);

  return (
    <FormControlLabel
      className={className}
      label={children}
      control={
        <MuiCheckbox
          inputRef={ref}
          checked={enabled}
          disabled={disabled}
          onChange={(event) => {
            setEnabled(event.target.checked);
            onChangeVal?.(event.target.checked);
          }}
          slotProps={{ input: { ...props } }}
        />
      }
    />
  );
});
```

`slotProps.input` routes any `data-*` attribute a call site passes down to the
real `<input>`, consistent with the rule in Task 9.

- [ ] **Step 4: Run the test and confirm it passes**

- [ ] **Step 5: Run the whole unit suite**

```bash
pnpm --filter @zitadel/login exec vitest --run
```

Expected: only `password-complexity.test.tsx` still failing (fixed in Task 14).

- [ ] **Step 6: Checkpoint — report to the user**

Report the full suite result and the `back-button.tsx` no-change finding.

---

# Phase 4 — Route sweep

Phases 1–3 leave the app functional and Biamp-themed, with stale Tailwind
`className`s still present on feature components. This phase removes them.

**The transformation rules, applied to every file:**

1. Layout classes (`flex`, `flex-col`, `space-y-*`, `gap-*`, `w-full`, `p-*`,
   `m-*`, `items-*`, `justify-*`) → an MUI `Stack` or `Box` with the equivalent
   props. MUI spacing is 8px-based: `space-y-4` (16px) → `gap={2}`.
2. Colour and typography classes (`text-*`, `bg-*`, `dark:*`, `ztdl-p`) →
   delete, and let the theme supply it. Use `<Typography>` where the element
   carried a text style.
3. `dark:` variants are always deleted — `biampTheme`'s dark colour scheme
   handles this.
4. **Never remove, rename or relocate a `data-testid`.**
5. Any remaining `@/lib/theme` or `@/lib/themeUtils` import is deleted along
   with the props it fed.

**After each task in this phase, run:**

```bash
pnpm --filter @zitadel/login exec vitest --run
pnpm --filter @zitadel/login exec tsc --noEmit
grep -rn 'className=' apps/login/src/app/\(login\)/<route>/ apps/login/src/components/<touched files>
```

The `grep` must return nothing for the files in scope.

### Task 14: `/password` and `password-complexity.tsx`

**Files:**
- Modify: `apps/login/src/app/(login)/password/page.tsx`
- Modify: `apps/login/src/components/password-form.tsx`
- Modify: `apps/login/src/components/password-complexity.tsx`
- Modify: `apps/login/src/components/password-complexity.test.tsx`
- Modify: `apps/login/src/components/change-password-form.tsx`

- [ ] **Step 1: Convert the page to `LandingShell`**

Mirror Task 6: drop `getBrandingSettings`/`DynamicTheme`, wrap in
`LandingShell`, and pass the route's existing translated title and description
as `title` / `subtitle`.

- [ ] **Step 2: Convert `password-form.tsx`** to `LandingFormPanel` +
`LandingFormField`, using the same submit-adornment pattern as Task 5. Preserve
`password-text-input` on the `<input>` via `slotProps.htmlInput`, and every
other testid in the file.

- [ ] **Step 3: Rewrite `password-complexity.test.tsx`** to drop its class
assertions, switching to `renderWithTheme` and asserting on the rendered
symbols and text instead. Use MUI `Typography` with `color="success.main"` /
`color="error.main"` in the component in place of `text-green-*` /
`text-warn-*`.

- [ ] **Step 4: Run the checks**

```bash
pnpm --filter @zitadel/login exec vitest --run
pnpm --filter @zitadel/login exec tsc --noEmit
```

Expected: the whole unit suite is green for the first time.

- [ ] **Step 5: Verify the flow end to end in a browser**

Sign in at `http://localhost:8080/ui/console?login_hint=zitadel-admin@zitadel.localhost`
with `Password1!`. Both `/loginname` and `/password` must be Biamp-styled and
the flow must complete back to the console.

- [ ] **Step 6: Checkpoint — report to the user**

---

### Task 15: The authenticator routes

**Files:**
- Modify: `apps/login/src/app/(login)/{mfa,u2f,passkey}/page.tsx`
- Modify: `apps/login/src/components/{login-otp,login-passkey,register-passkey,register-u2f,auth-methods,authentication-method-radio,choose-authenticator-to-login,choose-authenticator-to-setup,choose-second-factor,choose-second-factor-to-setup}.tsx`

- [ ] **Step 1: Convert each page to `LandingShell`** following Task 6's shape.

- [ ] **Step 2: Apply the Phase 4 transformation rules** to each listed
component.

- [ ] **Step 3: Run the checks**

```bash
pnpm --filter @zitadel/login exec vitest --run
pnpm --filter @zitadel/login exec tsc --noEmit
grep -rn 'className=' apps/login/src/app/\(login\)/mfa apps/login/src/app/\(login\)/u2f apps/login/src/app/\(login\)/passkey
```

Expected: tests green, no type errors, no `className` hits.

- [ ] **Step 4: Checkpoint — report to the user**

---

### Task 16: The identity-provider routes

**Files:**
- Modify: `apps/login/src/app/(login)/idp/page.tsx` and its subtree
- Modify: `apps/login/src/components/sign-in-with-idp.tsx`
- Modify: `apps/login/src/components/idps/*.tsx` (including `base-button.tsx`, which imports `@/lib/theme`)
- Modify: `apps/login/src/components/idp-process-handler.tsx`
- Modify: `apps/login/src/components/register-form-idp-incomplete.tsx`

- [ ] **Step 1: Rewrite `idps/base-button.tsx`** on MUI `Button`, dropping its
`@/lib/theme` import. Every provider button in `idps/` builds on it, so do this
first.

- [ ] **Step 1a: Give `idp-process-handler.tsx`'s spinner an explicit colour**

Carried over from Task 11. `spinner.tsx` now uses MUI's `color="inherit"`,
which is right for the 16 call sites that sit beside a button's label text — it
tracks that label's colour across variants and both colour schemes. But
`idp-process-handler.tsx` is the **one standalone** usage, and it lost the
explicit brand-coloured arc the old hand-rolled SVG had
(`fill-primary-light-500 dark:fill-primary-dark-500`); it now inherits ambient
body text colour. Not a visibility regression, but a look change.

Since this task touches the file anyway, set an explicit colour on that one
spinner rather than changing the shared default — e.g. wrap it in a `Box` with
`color="primary.main"`, so `inherit` resolves to the brand colour there while
every in-button spinner keeps tracking its label.

- [ ] **Step 2: Apply the transformation rules** to the remaining files.

- [ ] **Step 3: Run the checks**

```bash
pnpm --filter @zitadel/login exec vitest --run
pnpm --filter @zitadel/login exec tsc --noEmit
```

- [ ] **Step 4: Checkpoint — report to the user**

---

### Task 17: The remaining routes

**Files:**
- Modify: `apps/login/src/app/(login)/{register,verify,accounts,device,logout,signedin,page}.tsx`
- Modify: `apps/login/src/components/{register-form,privacy-policy-checkboxes,device-code-form,consent,session-item,session-clear-item,self-service-menu,ldap-username-password-form,skeleton,skeleton-card,user-avatar,language-switcher,theme-switch,logo,default-tags,address-bar,app-avatar,external-link,copy-to-clipboard,boundary,LoginLayout,layout-providers,auto-submit-form}.tsx`

- [ ] **Step 1: Convert each page to `LandingShell`.**

- [ ] **Step 2: Move `LanguageSwitcher` and `ThemeSwitch` into the shell.**
Rewrite both on MUI (`Select` / `IconButton`), dropping their `@/lib/theme`
imports, and pass them to `LandingShell`'s `actions` prop from each page.

- [ ] **Step 2a: Fix where `privacy-policy-checkboxes.tsx`'s spacing lands**

Carried over from Task 13. `checkbox.tsx` now renders MUI `FormControlLabel`
wrapping the `Checkbox`, and `className` lands on that **label-row wrapper**
rather than on the `<input>` as it did before. `privacy-policy-checkboxes.tsx`
passes `className="mr-4"`, which previously spaced the input from its label
text and now adds margin to the right of the whole row.

Not a type or behaviour break, and it was correctly left alone in Phase 3
rather than papered over in the shared primitive. Fix it here, where the
Tailwind classes are being removed anyway: drop `mr-4` and express the
intended spacing with MUI (`gap` on the containing `Stack`, or `sx` on the
control), then eyeball the consent checkboxes to confirm the rhythm looks
right.

- [ ] **Step 3: Apply the transformation rules** to every remaining component.

- [ ] **Step 4: Confirm no `className` survives anywhere**

```bash
grep -rn 'className=' apps/login/src --include='*.tsx' | grep -v '.test.tsx'
```

Expected: no output.

- [ ] **Step 5: Run the checks**

```bash
pnpm --filter @zitadel/login exec vitest --run
pnpm --filter @zitadel/login exec tsc --noEmit
pnpm nx run @zitadel/login:build
```

- [ ] **Step 6: Checkpoint — report to the user**

---

# Phase 5 — Teardown

### Task 18: Delete both ZITADEL theme layers

**Files:**
- Delete: `apps/login/src/lib/theme.ts`, `themeUtils.tsx`, `theme-hooks.ts`, `theme.test.ts`
- Delete: `apps/login/src/components/{theme-wrapper,dynamic-theme,branding-context,background-wrapper}.tsx`
- Delete: `apps/login/.env.theme.example`, `THEME_ARCHITECTURE.md`, `THEME_CUSTOMIZATION.md`

- [ ] **Step 1: Confirm nothing imports them**

```bash
grep -rn 'lib/theme\|theme-wrapper\|dynamic-theme\|branding-context\|background-wrapper' apps/login/src
```

Expected: no output. If anything remains, fix that file before deleting.

- [ ] **Step 2: Confirm no branding calls remain**

```bash
grep -rn 'getBrandingSettings\|BrandingSettings' apps/login/src
```

Expected: no output.

- [ ] **Step 3: Delete the files**

```bash
rm apps/login/src/lib/theme.ts apps/login/src/lib/themeUtils.tsx \
   apps/login/src/lib/theme-hooks.ts apps/login/src/lib/theme.test.ts
rm apps/login/src/components/theme-wrapper.tsx apps/login/src/components/dynamic-theme.tsx \
   apps/login/src/components/branding-context.tsx apps/login/src/components/background-wrapper.tsx
rm apps/login/.env.theme.example apps/login/THEME_ARCHITECTURE.md apps/login/THEME_CUSTOMIZATION.md
```

`theme.test.ts` is 459 lines testing a system that no longer exists — it is
deleted, not rewritten.

- [ ] **Step 4: Run the checks**

```bash
pnpm --filter @zitadel/login exec vitest --run
pnpm --filter @zitadel/login exec tsc --noEmit
```

- [ ] **Step 5: Checkpoint — report to the user**

---

### Task 19: Remove Tailwind and SCSS

**Files:**
- Delete: `apps/login/tailwind.config.mjs`, `apps/login/postcss.config.cjs`, `apps/login/src/styles/globals.scss`
- Modify: `apps/login/src/app/(login)/layout.tsx`, `apps/login/prettier.config.mjs`, `apps/login/package.json`

- [ ] **Step 1: Drop the stylesheet import**

Remove `import "@/styles/globals.scss";` from
`apps/login/src/app/(login)/layout.tsx`.

- [ ] **Step 2: Drop the Prettier plugin**

In `apps/login/prettier.config.mjs`, change the plugins line to:

```js
  plugins: ["prettier-plugin-organize-imports"],
```

Leaving `prettier-plugin-tailwindcss` listed after uninstalling it makes every
Prettier run fail.

- [ ] **Step 3: Delete the config files**

```bash
rm apps/login/tailwind.config.mjs apps/login/postcss.config.cjs apps/login/src/styles/globals.scss
```

**This is the step that removes the hairline-border artifact** described in the
ground rules. Deleting `globals.scss` removes Tailwind's preflight, so
`border-style` returns to `none` and `@bwp-web/styles`' forced
`border-width: 0.6px !important` stops rendering. Verify it in Step 7.

- [ ] **Step 4: Uninstall the packages**

```bash
pnpm --filter @zitadel/login remove \
  tailwindcss @tailwindcss/postcss @tailwindcss/forms postcss prettier-plugin-tailwindcss sass
```

- [ ] **Step 5: Full verification**

```bash
pnpm install
pnpm nx run-many --projects @zitadel/login --targets lint build test-unit
```

Expected: all three green.

- [ ] **Step 6: Run the acceptance suite**

This is the real test of the testid-preservation constraint.

```bash
pnpm nx run @zitadel/login:test-acceptance
```

Expected: passing. Any failure here is almost certainly a moved or dropped
`data-testid` — find it and restore it rather than editing the spec file.

- [ ] **Step 7: Manual end-to-end pass, and confirm the borders are gone**

From `http://localhost:8080/ui/console?login_hint=zitadel-admin@zitadel.localhost`
with `Password1!`, walk the full flow. Then toggle dark mode and confirm the
theme follows.

Screenshot `/loginname` at 1440x900 and compare against
`scratchpad/loginname-csp-fixed.png` from Task 6A, which shows the hairline box
around every MUI element. **Those boxes must now be absent.** If any remain,
Tailwind's preflight is still reaching the page from somewhere — find it rather
than overriding it.

- [ ] **Step 8: Checkpoint — report to the user**

Report every command's output, the acceptance-suite result, and a summary of
files changed and deleted across the whole migration.
