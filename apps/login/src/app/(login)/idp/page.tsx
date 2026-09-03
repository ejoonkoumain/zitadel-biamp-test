import { LandingShell } from "@/components/bwp/landing-shell";
import { LanguageSwitcher } from "@/components/language-switcher";
import { SignInWithIdp } from "@/components/sign-in-with-idp";
import ThemeSwitch from "@/components/theme-switch";
import { Translated } from "@/components/translated";
import { getServiceConfig } from "@/lib/service-url";
import { getActiveIdentityProviders } from "@/lib/zitadel";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("idp");
  return { title: t("title") };
}

export default async function Page(props: { searchParams: Promise<Record<string | number | symbol, string | undefined>> }) {
  const searchParams = await props.searchParams;

  const requestId = searchParams?.requestId;
  const organization = searchParams?.organization;

  const _headers = await headers();
  const { serviceConfig } = getServiceConfig(_headers);

  const identityProviders = await getActiveIdentityProviders({ serviceConfig, orgId: organization }).then((resp) => {
    return resp.identityProviders;
  });

  return (
    <LandingShell
      actions={
        <>
          <LanguageSwitcher />
          <ThemeSwitch />
        </>
      }
      title={<Translated i18nKey="title" namespace="idp" />}
      subtitle={<Translated i18nKey="description" namespace="idp" />}
    >
      {!!identityProviders?.length && (
        <SignInWithIdp
          identityProviders={identityProviders}
          requestId={requestId}
          organization={organization}
          postErrorRedirectUrl="/idp"
          showLabel={false}
        />
      )}
    </LandingShell>
  );
}
