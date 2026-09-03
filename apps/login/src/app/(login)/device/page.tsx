import { LandingShell } from "@/components/bwp/landing-shell";
import { DeviceCodeForm } from "@/components/device-code-form";
import { LanguageSwitcher } from "@/components/language-switcher";
import ThemeSwitch from "@/components/theme-switch";
import { Translated } from "@/components/translated";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("device");
  return { title: t("usercode.title") };
}

export default async function Page(props: { searchParams: Promise<Record<string | number | symbol, string | undefined>> }) {
  const searchParams = await props.searchParams;

  const userCode = searchParams?.user_code;

  return (
    <LandingShell
      actions={
        <>
          <LanguageSwitcher />
          <ThemeSwitch />
        </>
      }
      title={<Translated i18nKey="usercode.title" namespace="device" />}
      subtitle={<Translated i18nKey="usercode.description" namespace="device" />}
    >
      <DeviceCodeForm userCode={userCode} />
    </LandingShell>
  );
}
