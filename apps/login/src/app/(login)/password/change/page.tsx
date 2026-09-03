import { Alert } from "@/components/alert";
import { LandingShell } from "@/components/bwp/landing-shell";
import { ChangePasswordForm } from "@/components/change-password-form";
import { LanguageSwitcher } from "@/components/language-switcher";
import ThemeSwitch from "@/components/theme-switch";
import { Translated } from "@/components/translated";
import { UserAvatar } from "@/components/user-avatar";
import { getServiceConfig } from "@/lib/service-url";
import { loadMostRecentSession } from "@/lib/session";
import { getPasswordComplexitySettings } from "@/lib/zitadel";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("password");
  return { title: t("change.title") };
}

export default async function Page(props: { searchParams: Promise<Record<string | number | symbol, string | undefined>> }) {
  const _headers = await headers();
  const { serviceConfig } = getServiceConfig(_headers);

  const searchParams = await props.searchParams;

  const { loginName, organization, requestId } = searchParams;

  // also allow no session to be found (ignoreUnkownUsername)
  const sessionFactors = await loadMostRecentSession({
    serviceConfig,
    sessionParams: {
      loginName,
      organization,
    },
  });

  const passwordComplexity = await getPasswordComplexitySettings({
    serviceConfig,
    organization: sessionFactors?.factors?.user?.organizationId,
  });

  return (
    <LandingShell
      actions={
        <>
          <LanguageSwitcher />
          <ThemeSwitch />
        </>
      }
      title={<Translated i18nKey="change.title" namespace="password" />}
      subtitle={<Translated i18nKey="change.description" namespace="password" />}
    >
      {/* Only warn when there is no loginName to continue with; a failed session
          lookup is reported by the form gate below (failedLoading), and under
          enumeration protection no session may exist by design. */}
      {!loginName && (
        <Alert>
          <Translated i18nKey="unknownContext" namespace="error" />
        </Alert>
      )}

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

      {passwordComplexity && loginName && sessionFactors?.factors?.user?.id ? (
        <ChangePasswordForm
          sessionId={sessionFactors.id}
          loginName={loginName}
          requestId={requestId}
          organization={organization}
          passwordComplexitySettings={passwordComplexity}
        />
      ) : (
        <Alert>
          <Translated i18nKey="failedLoading" namespace="error" />
        </Alert>
      )}
    </LandingShell>
  );
}
