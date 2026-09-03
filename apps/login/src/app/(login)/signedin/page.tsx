import { Alert, AlertType } from "@/components/alert";
import { Button, ButtonVariants } from "@/components/button";
import { LandingShell } from "@/components/bwp/landing-shell";
import { LanguageSwitcher } from "@/components/language-switcher";
import ThemeSwitch from "@/components/theme-switch";
import { Translated } from "@/components/translated";
import { UserAvatar } from "@/components/user-avatar";
import { resolveRedirectUri } from "@/lib/client";
import { getMostRecentCookieWithLoginname, getSessionCookieById } from "@/lib/cookies";
import { completeDeviceAuthorization } from "@/lib/server/device";
import { getServiceConfig } from "@/lib/service-url";
import { loadMostRecentSession } from "@/lib/session";
import { getLoginSettings, getSession, ServiceConfig } from "@/lib/zitadel";
import { Box, Stack } from "@mui/material";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("signedin");
  return { title: t("title", { user: "" }) };
}

async function loadSessionById(serviceConfig: ServiceConfig, sessionId: string, organization?: string) {
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

export default async function Page(props: { searchParams: Promise<any> }) {
  const searchParams = await props.searchParams;

  const _headers = await headers();
  const { serviceConfig } = getServiceConfig(_headers);

  const { loginName, requestId, organization, sessionId } = searchParams;

  // complete device authorization flow if device requestId is present
  if (requestId && requestId.startsWith("device_")) {
    const cookie = sessionId
      ? await getSessionCookieById({ sessionId, organization })
      : await getMostRecentCookieWithLoginname({
          loginName: loginName,
          organization: organization,
        });

    if (cookie) {
      await completeDeviceAuthorization(requestId.replace("device_", ""), {
        sessionId: cookie.id,
        sessionToken: cookie.token,
      }).catch((err) => {
        return (
          <LandingShell
            actions={
              <>
                <LanguageSwitcher />
                <ThemeSwitch />
              </>
            }
            title={<Translated i18nKey="error.title" namespace="signedin" />}
            subtitle={<Translated i18nKey="error.description" namespace="signedin" />}
          >
            <Alert>{err.message}</Alert>
          </LandingShell>
        );
      });
    }
  }

  const sessionFactors = sessionId
    ? await loadSessionById(serviceConfig, sessionId, organization)
    : await loadMostRecentSession({ serviceConfig, sessionParams: { loginName, organization } });

  let loginSettings;
  if (!requestId) {
    loginSettings = await getLoginSettings({ serviceConfig, organization });
  }

  const redirectUri = await resolveRedirectUri(
    requestId && sessionId ? { sessionId, requestId } : { loginName: loginName ?? sessionFactors?.factors?.user?.loginName },
    loginSettings?.defaultRedirectUri,
  );

  const isSamePage = redirectUri?.startsWith("/signedin") ?? false;

  return (
    <LandingShell
      actions={
        <>
          <LanguageSwitcher />
          <ThemeSwitch />
        </>
      }
      title={<Translated i18nKey="title" namespace="signedin" data={{ user: sessionFactors?.factors?.user?.displayName }} />}
      subtitle={<Translated i18nKey="description" namespace="signedin" />}
    >
      <UserAvatar
        loginName={loginName ?? sessionFactors?.factors?.user?.loginName}
        displayName={sessionFactors?.factors?.user?.displayName ?? loginName}
        showDropdown={!(requestId && requestId.startsWith("device_"))}
        searchParams={searchParams}
      />

      {requestId && requestId.startsWith("device_") && (
        <Alert type={AlertType.INFO}>
          You can now close this window and return to the device where you started the authorization process to continue.
        </Alert>
      )}

      {redirectUri && !isSamePage && (
        <Stack direction="row" alignItems="center" width="100%" mt={4}>
          <Box flexGrow={1} />
          <Link href={redirectUri}>
            <Button type="submit" variant={ButtonVariants.Primary}>
              <Translated i18nKey="continue" namespace="signedin" />
            </Button>
          </Link>
        </Stack>
      )}
    </LandingShell>
  );
}
