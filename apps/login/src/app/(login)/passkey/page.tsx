import { Alert } from "@/components/alert";
import { LandingShell } from "@/components/bwp/landing-shell";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LoginPasskey } from "@/components/login-passkey";
import ThemeSwitch from "@/components/theme-switch";
import { Translated } from "@/components/translated";
import { UserAvatar } from "@/components/user-avatar";
import { getSessionCookieById } from "@/lib/cookies";
import { getServiceConfig } from "@/lib/service-url";
import { loadMostRecentSession } from "@/lib/session";
import { getSession } from "@/lib/zitadel";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("passkey");
  return { title: t("verify.title") };
}

export default async function Page(props: { searchParams: Promise<Record<string | number | symbol, string | undefined>> }) {
  const searchParams = await props.searchParams;

  const { loginName, altPassword, requestId, organization, sessionId } = searchParams;

  const _headers = await headers();
  const { serviceConfig } = getServiceConfig(_headers);

  let sessionFactors = sessionId ? await loadSessionById(sessionId, organization) : undefined;

  if (!sessionFactors && !sessionId) {
    sessionFactors = await loadMostRecentSession({
      serviceConfig,
      sessionParams: { loginName, organization },
    });
  }

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

  return (
    <LandingShell
      actions={
        <>
          <LanguageSwitcher />
          <ThemeSwitch />
        </>
      }
      title={<Translated i18nKey="verify.title" namespace="passkey" />}
      subtitle={<Translated i18nKey="verify.description" namespace="passkey" />}
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

      {!(loginName || sessionId) && (
        <Alert>
          <Translated i18nKey="unknownContext" namespace="error" />
        </Alert>
      )}

      {(loginName || sessionId) && (
        <LoginPasskey
          loginName={loginName}
          sessionId={sessionId}
          requestId={requestId}
          altPassword={altPassword === "true"}
          organization={organization}
        />
      )}
    </LandingShell>
  );
}
