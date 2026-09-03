import { Alert } from "@/components/alert";
import { LandingShell } from "@/components/bwp/landing-shell";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LoginOTP } from "@/components/login-otp";
import ThemeSwitch from "@/components/theme-switch";
import { Translated } from "@/components/translated";
import { UserAvatar } from "@/components/user-avatar";
import { getSessionCookieById } from "@/lib/cookies";
import { getPublicHost } from "@/lib/server/host";
import { getServiceConfig } from "@/lib/service-url";
import { loadMostRecentSession } from "@/lib/session";
import { getLoginSettings, getSession } from "@/lib/zitadel";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("otp");
  return { title: t("verify.title") };
}

export default async function Page(props: {
  searchParams: Promise<Record<string | number | symbol, string | undefined>>;
  params: Promise<Record<string | number | symbol, string | undefined>>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;

  const _headers = await headers();
  const { serviceConfig } = getServiceConfig(_headers);
  const host = getPublicHost(_headers);

  const {
    loginName, // send from password page
    requestId,
    sessionId,
    organization,
    code,
  } = searchParams;

  const { method } = params;

  const session = sessionId
    ? await loadSessionById(sessionId, organization)
    : await loadMostRecentSession({ serviceConfig, sessionParams: { loginName, organization } });

  async function loadSessionById(sessionId: string, organization?: string) {
    const recent = await getSessionCookieById({ sessionId, organization });

    if (!recent) {
      return undefined;
    }

    return getSession({ serviceConfig, sessionId: recent.id, sessionToken: recent.token }).then((response) => {
      if (response?.session) {
        return response.session;
      }
    });
  }

  const loginSettings = await getLoginSettings({
    serviceConfig,
    organization: organization ?? session?.factors?.user?.organizationId,
  });

  return (
    <LandingShell
      actions={
        <>
          <LanguageSwitcher />
          <ThemeSwitch />
        </>
      }
      title={<Translated i18nKey="verify.title" namespace="otp" />}
      subtitle={
        method === "time-based" ? (
          <Translated i18nKey="verify.totpDescription" namespace="otp" />
        ) : method === "sms" ? (
          <Translated i18nKey="verify.smsDescription" namespace="otp" />
        ) : method === "email" ? (
          <Translated i18nKey="verify.emailDescription" namespace="otp" />
        ) : undefined
      }
    >
      {!session && (
        <Alert>
          <Translated i18nKey="unknownContext" namespace="error" />
        </Alert>
      )}

      {session && (
        <UserAvatar
          loginName={loginName ?? session.factors?.user?.loginName}
          displayName={session.factors?.user?.displayName}
          showDropdown
          searchParams={searchParams}
        />
      )}

      {method && session && (
        <LoginOTP
          loginName={loginName ?? session.factors?.user?.loginName}
          sessionId={sessionId}
          requestId={requestId}
          organization={organization ?? session?.factors?.user?.organizationId}
          method={method}
          loginSettings={loginSettings}
          host={host}
          code={code}
        />
      )}
    </LandingShell>
  );
}
