import { Alert } from "@/components/alert";
import { LandingShell } from "@/components/bwp/landing-shell";
import { LanguageSwitcher } from "@/components/language-switcher";
import { RegisterU2f } from "@/components/register-u2f";
import ThemeSwitch from "@/components/theme-switch";
import { Translated } from "@/components/translated";
import { UserAvatar } from "@/components/user-avatar";
import { getEnrollmentAuthorizationError } from "@/lib/server/enrollment-guard";
import { getServiceConfig } from "@/lib/service-url";
import { loadMostRecentSession } from "@/lib/session";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("u2f");
  return { title: t("set.title") };
}

export default async function Page(props: { searchParams: Promise<Record<string | number | symbol, string | undefined>> }) {
  const searchParams = await props.searchParams;

  const { loginName, organization, requestId, checkAfter } = searchParams;

  const _headers = await headers();
  const { serviceConfig } = getServiceConfig(_headers);

  const sessionFactors = await loadMostRecentSession({
    serviceConfig,
    sessionParams: {
      loginName,
      organization,
    },
  });

  // Enrollment must be authorized: a bare identify-only session must not be offered the
  // authenticator-registration form (defense in depth alongside the addU2F/verifyU2F server
  // actions, GHSA-45f2-5q3r-xgg6).
  let enrollmentAuthorized = false;
  if (sessionFactors?.id && sessionFactors.factors?.user?.id) {
    const enrollmentError = await getEnrollmentAuthorizationError({
      serviceConfig,
      session: sessionFactors,
      userId: sessionFactors.factors.user.id,
    });
    enrollmentAuthorized = !enrollmentError;
  }

  return (
    <LandingShell
      actions={
        <>
          <LanguageSwitcher />
          <ThemeSwitch />
        </>
      }
      title={<Translated i18nKey="set.title" namespace="u2f" />}
      subtitle={<Translated i18nKey="set.description" namespace="u2f" />}
    >
      {sessionFactors && (
        <UserAvatar
          loginName={loginName ?? sessionFactors.factors?.user?.loginName}
          displayName={sessionFactors.factors?.user?.displayName}
          showDropdown
          searchParams={searchParams}
        />
      )}

      {(!sessionFactors || !enrollmentAuthorized) && (
        <Alert>
          <Translated i18nKey="unknownContext" namespace="error" />
        </Alert>
      )}

      {sessionFactors?.id && enrollmentAuthorized && (
        <RegisterU2f
          loginName={loginName}
          sessionId={sessionFactors.id}
          organization={organization}
          requestId={requestId}
          checkAfter={checkAfter === "true"}
        />
      )}
    </LandingShell>
  );
}
