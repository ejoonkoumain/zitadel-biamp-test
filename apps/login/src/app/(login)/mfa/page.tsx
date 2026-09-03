import { Alert } from "@/components/alert";
import { BackButton } from "@/components/back-button";
import { LandingShell } from "@/components/bwp/landing-shell";
import { Card } from "@/components/card";
import { ChooseSecondFactor } from "@/components/choose-second-factor";
import { LanguageSwitcher } from "@/components/language-switcher";
import ThemeSwitch from "@/components/theme-switch";
import { Translated } from "@/components/translated";
import { UserAvatar } from "@/components/user-avatar";
import { getSessionCookieById } from "@/lib/cookies";
import { getServiceConfig } from "@/lib/service-url";
import { loadMostRecentSession } from "@/lib/session";
import { getSession, listAuthenticationMethodTypes } from "@/lib/zitadel";
import { Box, Stack } from "@mui/material";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("mfa");
  return { title: t("verify.title") };
}

export default async function Page(props: { searchParams: Promise<Record<string | number | symbol, string | undefined>> }) {
  const searchParams = await props.searchParams;

  const { loginName, requestId, organization, sessionId } = searchParams;

  const _headers = await headers();
  const { serviceConfig } = getServiceConfig(_headers);

  const sessionFactors = sessionId
    ? await loadSessionById(sessionId, organization)
    : await loadSessionByLoginname(loginName, organization);

  async function loadSessionByLoginname(loginName?: string, organization?: string) {
    return loadMostRecentSession({
      serviceConfig,
      sessionParams: {
        loginName,
        organization,
      },
    }).then((session) => {
      if (session && session.factors?.user?.id) {
        return listAuthenticationMethodTypes({ serviceConfig, userId: session.factors.user.id }).then((methods) => {
          return {
            factors: session?.factors,
            authMethods: methods.authMethodTypes ?? [],
          };
        });
      }
    });
  }

  async function loadSessionById(sessionId: string, organization?: string) {
    const recent = await getSessionCookieById({ sessionId, organization });

    if (!recent) {
      return undefined;
    }

    return getSession({ serviceConfig, sessionId: recent.id, sessionToken: recent.token }).then((response) => {
      if (response?.session && response.session.factors?.user?.id) {
        return listAuthenticationMethodTypes({ serviceConfig, userId: response.session.factors.user.id }).then((methods) => {
          return {
            factors: response.session?.factors,
            authMethods: methods.authMethodTypes ?? [],
          };
        });
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
      title={<Translated i18nKey="verify.title" namespace="mfa" />}
      subtitle={<Translated i18nKey="verify.description" namespace="mfa" />}
    >
      {sessionFactors && (
        <UserAvatar
          loginName={loginName ?? sessionFactors.factors?.user?.loginName}
          displayName={sessionFactors.factors?.user?.displayName}
          showDropdown
          searchParams={searchParams}
        />
      )}

      {!(loginName || sessionId) && (
        <Alert>
          <Translated i18nKey="unknownContext" namespace="error" />
        </Alert>
      )}

      {sessionFactors ? (
        <ChooseSecondFactor
          loginName={loginName}
          sessionId={sessionId}
          requestId={requestId}
          organization={organization}
          userMethods={sessionFactors.authMethods ?? []}
        />
      ) : (
        <Alert>
          <Translated i18nKey="verify.noResults" namespace="mfa" />
        </Alert>
      )}

      <Box width="100%" maxWidth={441}>
        <Card>
          <Stack direction="row" alignItems="center" width="100%">
            <BackButton />
          </Stack>
        </Card>
      </Box>
    </LandingShell>
  );
}
