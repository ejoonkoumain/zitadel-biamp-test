import { LandingShell } from "@/components/bwp/landing-shell";
import { LanguageSwitcher } from "@/components/language-switcher";
import { SessionsList } from "@/components/sessions-list";
import ThemeSwitch from "@/components/theme-switch";
import { Translated } from "@/components/translated";
import { getAllSessions } from "@/lib/cookies";
import { getServiceConfig } from "@/lib/service-url";
import { listSessions, ServiceConfig } from "@/lib/zitadel";
import { UserPlusIcon } from "@heroicons/react/24/outline";
import { Box, Paper, Stack, Typography } from "@mui/material";
import { create } from "@zitadel/client";
import { Session, SessionSchema } from "@zitadel/proto/zitadel/session/v2/session_pb";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
// import { getLocale } from "next-intl/server";
import { headers } from "next/headers";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("accounts");
  return { title: t("title") };
}

async function loadSessions({ serviceConfig, organization }: { serviceConfig: ServiceConfig; organization?: string }) {
  // Deliberately no cleanup: expired cookie entries are still listed (as invalid
  // accounts) so the user can re-authenticate with one click, like Login V1.
  const sessionCookies = await getAllSessions();

  if (!sessionCookies || !sessionCookies.length) {
    console.info("No session cookie found.");
    return [];
  }

  // listSessions is a plain search: ids of terminated or unknown sessions are
  // simply absent from the response, it does not fail. Transport failures are
  // deliberately not caught here, they must surface instead of downgrading
  // live sessions to invalid cards.
  const ids = sessionCookies.map((s) => s.id).filter((id) => !!id) as string[];
  let liveSessions: Session[] = [];
  if (ids.length) {
    const response = await listSessions({ serviceConfig, ids });
    liveSessions = response?.sessions ?? [];
  }

  // For cookie entries whose server-side session no longer exists (e.g. after
  // an RP-initiated logout) synthesize an invalid Session so the account stays
  // selectable and the user can re-authenticate with one click.
  const liveIds = new Set(liveSessions.map((s) => s.id));
  const synthesized: Session[] = sessionCookies
    .filter((c) => !!c.id && !!c.loginName && !liveIds.has(c.id))
    .map((c) =>
      create(SessionSchema, {
        id: c.id,
        factors: {
          user: {
            loginName: c.loginName,
            // No displayName: the cookie does not carry one, and reusing the
            // loginName would render it twice and break the avatar initials.
            organizationId: c.organization ?? "",
          },
        },
      }),
    );

  let sessions = [...liveSessions, ...synthesized];
  if (organization) {
    sessions = sessions.filter((s) => s.factors?.user?.organizationId === organization);
  }

  return sessions;
}

export default async function Page(props: { searchParams: Promise<Record<string | number | symbol, string | undefined>> }) {
  const searchParams = await props.searchParams;

  const requestId = searchParams?.requestId;
  const organization = searchParams?.organization;
  const orgDomain = searchParams?.orgDomain;

  const _headers = await headers();
  const { serviceConfig } = getServiceConfig(_headers);

  let sessions = await loadSessions({ serviceConfig, organization });

  const params = new URLSearchParams();

  if (requestId) {
    params.append("requestId", requestId);
  }

  if (organization) {
    params.append("organization", organization);
  }

  if (orgDomain) {
    params.append("orgDomain", orgDomain);
  }

  return (
    <LandingShell
      actions={
        <>
          <LanguageSwitcher />
          <ThemeSwitch />
        </>
      }
      title={<Translated i18nKey="title" namespace="accounts" />}
      subtitle={<Translated i18nKey="description" namespace="accounts" />}
    >
      <Stack width="100%" gap={1}>
        <SessionsList sessions={sessions} requestId={requestId} />
        <Paper
          component={Link}
          href={`/loginname?` + params}
          elevation={0}
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            borderRadius: 2,
            px: 2,
            py: 1.5,
            textDecoration: "none",
            color: "inherit",
            transition: "background-color 0.2s",
            "&:hover": { bgcolor: "action.selected" },
          }}
        >
          <Box
            sx={{
              mr: 2,
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              height: 32,
              width: 32,
              borderRadius: "50%",
              bgcolor: "action.hover",
              flexShrink: 0,
            }}
          >
            <UserPlusIcon style={{ height: 20, width: 20 }} />
          </Box>
          <Typography variant="body2">
            <Translated i18nKey="addAnother" namespace="accounts" />
          </Typography>
        </Paper>
      </Stack>
    </LandingShell>
  );
}
