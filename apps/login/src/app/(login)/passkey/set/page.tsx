import { Alert, AlertType } from "@/components/alert";
import { LandingShell } from "@/components/bwp/landing-shell";
import { LanguageSwitcher } from "@/components/language-switcher";
import { RegisterPasskey } from "@/components/register-passkey";
import ThemeSwitch from "@/components/theme-switch";
import { Translated } from "@/components/translated";
import { UserAvatar } from "@/components/user-avatar";
import { getServiceConfig } from "@/lib/service-url";
import { loadMostRecentSession } from "@/lib/session";
import { getUserByID } from "@/lib/zitadel";
import { Link } from "@mui/material";
import { Session } from "@zitadel/proto/zitadel/session/v2/session_pb";
import { HumanUser, User } from "@zitadel/proto/zitadel/user/v2/user_pb";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("passkey");
  return { title: t("set.title") };
}

export default async function Page(props: { searchParams: Promise<Record<string | number | symbol, string | undefined>> }) {
  const searchParams = await props.searchParams;

  const { userId, loginName, prompt, organization, requestId, code, codeId } = searchParams;

  const _headers = await headers();
  const { serviceConfig } = getServiceConfig(_headers);

  // also allow no session to be found for userId-based flows
  let session: Session | undefined;
  if (loginName) {
    session = await loadMostRecentSession({
      serviceConfig,
      sessionParams: {
        loginName,
        organization,
      },
    });
  }

  let user: User | undefined;
  let displayName: string | undefined;
  if (userId) {
    const userResponse = await getUserByID({ serviceConfig, userId });
    user = userResponse.user;

    if (user?.type.case === "human") {
      displayName = (user.type.value as HumanUser).profile?.displayName;
    }
  }

  return (
    <LandingShell
      actions={
        <>
          <LanguageSwitcher />
          <ThemeSwitch />
        </>
      }
      title={<Translated i18nKey="set.title" namespace="passkey" />}
      subtitle={<Translated i18nKey="set.description" namespace="passkey" />}
    >
      {session ? (
        <UserAvatar
          loginName={loginName ?? session.factors?.user?.loginName}
          displayName={session.factors?.user?.displayName}
          showDropdown
          searchParams={searchParams}
        />
      ) : user ? (
        <UserAvatar
          loginName={user?.preferredLoginName}
          displayName={displayName}
          showDropdown
          searchParams={searchParams}
        />
      ) : null}

      <Alert type={AlertType.INFO}>
        <>
          <Translated i18nKey="set.info.description" namespace="passkey" />
          <Link
            href="https://zitadel.com/docs/guides/manage/user/reg-create-user#with-passwordless"
            target="_blank"
            sx={{ color: "info.main" }}
          >
            <Translated i18nKey="set.info.link" namespace="passkey" />
          </Link>
        </>
      </Alert>

      {!session && !user && (
        <Alert>
          <Translated i18nKey="unknownContext" namespace="error" />
        </Alert>
      )}

      {(session?.id || userId) && (
        <RegisterPasskey
          sessionId={session?.id}
          userId={userId}
          isPrompt={!!prompt}
          organization={organization}
          requestId={requestId}
          code={code}
          codeId={codeId}
          loginName={loginName ?? session?.factors?.user?.loginName ?? user?.preferredLoginName}
        />
      )}
    </LandingShell>
  );
}
