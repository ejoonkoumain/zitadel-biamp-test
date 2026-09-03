import { Alert, AlertType } from "@/components/alert";
import { Button } from "@/components/button";
import { LandingShell } from "@/components/bwp/landing-shell";
import { LanguageSwitcher } from "@/components/language-switcher";
import ThemeSwitch from "@/components/theme-switch";
import { Translated } from "@/components/translated";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("idp");
  return { title: t("registrationFailed.title") };
}

export default async function Page(props: { searchParams: Promise<Record<string | number | symbol, string | undefined>> }) {
  const searchParams = await props.searchParams;
  const { postErrorRedirectUrl } = searchParams;

  return (
    <LandingShell
      actions={
        <>
          <LanguageSwitcher />
          <ThemeSwitch />
        </>
      }
      title={<Translated i18nKey="registrationFailed.title" namespace="idp" />}
      subtitle={<Translated i18nKey="registrationFailed.description" namespace="idp" />}
    >
      <Alert type={AlertType.ALERT}>
        <Translated i18nKey="registrationFailed.info" namespace="idp" />
      </Alert>

      {postErrorRedirectUrl && (
        <Link href={postErrorRedirectUrl} style={{ width: "100%" }}>
          <Button style={{ width: "100%" }}>
            <Translated i18nKey="registrationFailed.backToLogin" namespace="idp" />
          </Button>
        </Link>
      )}
    </LandingShell>
  );
}
