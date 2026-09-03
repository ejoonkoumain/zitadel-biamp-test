import "@/styles/globals.scss";

import { BackgroundWrapper } from "@/components/background-wrapper";
import { LanguageProvider } from "@/components/language-provider";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Skeleton } from "@/components/skeleton";
import { ThemeProvider } from "@/components/theme-provider";
import ThemeSwitch from "@/components/theme-switch";
import { LANGS, getLanguage } from "@/lib/i18n";
import { getServiceConfig } from "@/lib/service-url";
import { getAllowedLanguages } from "@/lib/zitadel";
import * as Tooltip from "@radix-ui/react-tooltip";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import localFont from "next/font/local";
import { headers } from "next/headers";
import React, { Suspense } from "react";

// Open Sans carries body copy and every non-display variant.
const openSans = localFont({
  src: [
    { path: "../../fonts/open-sans-regular.woff2", weight: "400", style: "normal" },
    { path: "../../fonts/open-sans-regular-italic.woff2", weight: "400", style: "italic" },
    { path: "../../fonts/open-sans-semibold.woff2", weight: "600", style: "normal" },
    { path: "../../fonts/open-sans-semibold-italic.woff2", weight: "600", style: "italic" },
    { path: "../../fonts/open-sans-bold.woff2", weight: "700", style: "normal" },
    { path: "../../fonts/open-sans-bold-italic.woff2", weight: "700", style: "italic" },
    { path: "../../fonts/open-sans-extrabold.woff2", weight: "800", style: "normal" },
    { path: "../../fonts/open-sans-extrabold-italic.woff2", weight: "800", style: "italic" },
  ],
  variable: "--font-open-sans",
  display: "swap",
});

// Montserrat is display-only: h0, h1, h2 and h4.
const montserrat = localFont({
  src: [
    { path: "../../fonts/Montserrat-Medium.ttf", weight: "500", style: "normal" },
    { path: "../../fonts/Montserrat-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../../fonts/Montserrat-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-montserrat",
  display: "swap",
});

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
    <html className={`${openSans.variable} ${montserrat.variable} font-sans`} suppressHydrationWarning>
      <head />
      <body>
        <ThemeProvider>
          <Tooltip.Provider>
            <Suspense
              fallback={
                <BackgroundWrapper
                  className={`bg-background-light-600 dark:bg-background-dark-600 relative flex min-h-screen flex-col justify-center`}
                >
                  <div className="relative mx-auto w-full max-w-[440px] py-8">
                    <Skeleton>
                      <div className="h-40"></div>
                    </Skeleton>
                    <div className="flex flex-row items-center justify-end space-x-4 py-4">
                      <ThemeSwitch />
                    </div>
                  </div>
                </BackgroundWrapper>
              }
            >
              <LanguageProvider>
                <BackgroundWrapper
                  className={`bg-background-light-600 dark:bg-background-dark-600 relative flex min-h-screen flex-col justify-center`}
                >
                  <div className="relative mx-auto w-full max-w-[1100px] py-8">
                    <div>{children}</div>
                    <div className="mx-auto flex max-w-[440px] flex-row items-center justify-end space-x-4 px-4 py-4 md:max-w-full md:px-8">
                      <LanguageSwitcher languages={languages} />
                      <ThemeSwitch />
                    </div>
                  </div>
                </BackgroundWrapper>
              </LanguageProvider>
            </Suspense>
          </Tooltip.Provider>
        </ThemeProvider>
      </body>
    </html>
  );
}
