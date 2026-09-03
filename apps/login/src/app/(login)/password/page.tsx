import { Alert } from "@/components/alert";
import { LandingShell } from "@/components/bwp/landing-shell";
import { LanguageSwitcher } from "@/components/language-switcher";
import { PasswordForm } from "@/components/password-form";
import ThemeSwitch from "@/components/theme-switch";
import { Translated } from "@/components/translated";
import { UserAvatar } from "@/components/user-avatar";
import { getServiceConfig } from "@/lib/service-url";
import { loadMostRecentSession } from "@/lib/session";
import { getDefaultOrg, getLoginSettings } from "@/lib/zitadel";
import { Organization } from "@zitadel/proto/zitadel/org/v2/org_pb";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("password");
  return { title: t("verify.title") };
}

export default async function Page(props: { searchParams: Promise<Record<string | number | symbol, string | undefined>> }) {
  const searchParams = await props.searchParams;
  let { loginName, organization, requestId } = searchParams;

  const _headers = await headers();
  const { serviceConfig } = getServiceConfig(_headers);

  let defaultOrganization;
  if (!organization) {
    const org: Organization | null = await getDefaultOrg({ serviceConfig });

    if (org) {
      defaultOrganization = org.id;
    }
  }

  // also allow no session to be found (ignoreUnkownUsername)
  const sessionFactors = await loadMostRecentSession({
    serviceConfig,
    sessionParams: {
      loginName,
      organization,
    },
  });

  const loginSettings = await getLoginSettings({
    serviceConfig,
    organization: organization ?? sessionFactors?.factors?.user?.organizationId ?? defaultOrganization,
  });

  return (
    <LandingShell
      actions={
        <>
          <LanguageSwitcher />
          <ThemeSwitch />
        </>
      }
      title={<Translated i18nKey="verify.title" namespace="password" />}
      subtitle={<Translated i18nKey="verify.description" namespace="password" />}
    >
      {sessionFactors ? (
        <UserAvatar
          loginName={loginName ?? sessionFactors.factors?.user?.loginName}
          displayName={sessionFactors.factors?.user?.displayName}
          showDropdown
          searchParams={searchParams}
        />
      ) : loginName ? (
        <UserAvatar loginName={loginName} displayName={loginName} showDropdown searchParams={searchParams} />
      ) : null}

      {/* Only warn when there is no loginName to continue with (e.g. a direct visit
          without searchParams). A failed session lookup alone is not an error: the
          form still works via the user-search fallback in sendPassword, and under
          enumeration protection no session exists by design. */}
      {!loginName && (
        <Alert>
          <Translated i18nKey="unknownContext" namespace="error" />
        </Alert>
      )}

      {loginName && (
        <PasswordForm
          loginName={loginName}
          requestId={requestId}
          organization={organization} // stick to "organization" as we still want to do user discovery based on the searchParams not the default organization, later the organization is determined by the found user
          defaultOrganization={defaultOrganization}
          loginSettings={loginSettings}
        />
      )}
    </LandingShell>
  );
}
