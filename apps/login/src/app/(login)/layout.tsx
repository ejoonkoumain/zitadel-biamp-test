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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars -- `languages` will be passed to LandingShell in Task 17; keep the fetch alive until then.
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
