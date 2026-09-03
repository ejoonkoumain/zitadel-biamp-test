"use client";

import { Lang } from "@/lib/i18n";
import { createContext, ReactNode, useContext } from "react";

/**
 * Carries the server-resolved list of allowed languages (computed once per
 * request in `(login)/layout.tsx` from the org's login settings) down to
 * `LanguageSwitcher`, wherever a route renders it via `LandingShell`'s
 * `actions` prop. A React Context (rather than a module-level store, as the
 * old branding theme-mode plumbing once used) is enough here because
 * layout.tsx is a genuine ancestor of every page that needs the value —
 * there's no sibling-tree problem to work around.
 */
const LanguagesContext = createContext<Lang[]>([]);

export function LanguagesProvider({ languages, children }: { languages: Lang[]; children: ReactNode }) {
  return <LanguagesContext.Provider value={languages}>{children}</LanguagesContext.Provider>;
}

export function useLanguages(): Lang[] {
  return useContext(LanguagesContext);
}
