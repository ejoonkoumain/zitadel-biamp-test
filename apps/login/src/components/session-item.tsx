"use client";

import { handleServerActionResponse } from "@/lib/client-utils";
import { sendLoginname } from "@/lib/server/loginname";
import { clearSession, continueWithSession, ContinueWithSessionCommand } from "@/lib/server/session";
import { XCircleIcon } from "@heroicons/react/24/outline";
import { Box, Paper, Stack, Typography } from "@mui/material";
import { Theme, useTheme } from "@mui/material/styles";
import * as Tooltip from "@radix-ui/react-tooltip";
import { Timestamp, timestampDate } from "@zitadel/client";
import { Session } from "@zitadel/proto/zitadel/session/v2/session_pb";
import moment from "moment";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { Alert } from "./alert";
import { AutoSubmitForm } from "./auto-submit-form";
import { Avatar } from "./avatar";
import { Translated } from "./translated";

// Row styling for a session tile, following the `Paper`/`tileSx` pattern from
// `auth-methods.tsx`: bordered, rounded, hover raises a shadow. No
// mode-specific overrides needed — `divider`/`action.hover` already flip
// automatically with the theme.
const rowSx = (theme: Theme) => ({
  position: "relative" as const,
  display: "flex",
  flexDirection: "row" as const,
  alignItems: "center",
  width: "100%",
  borderRadius: 2,
  border: 1,
  borderColor: "divider",
  px: 2,
  py: 1,
  textAlign: "left" as const,
  cursor: "pointer",
  transition: "box-shadow 0.2s",
  "&:hover": { boxShadow: 4 },
  // The "clear session" icon is hover-revealed on larger screens (mirroring
  // the old `group-hover:block sm:hidden` combo) but always visible on small
  // screens/touch, where there is no hover.
  "& [data-clear-icon]": {
    opacity: 0.5,
    transition: "opacity 0.2s",
    [theme.breakpoints.up("sm")]: { display: "none" },
  },
  "&:hover [data-clear-icon]": {
    [theme.breakpoints.up("sm")]: { display: "inline-flex" },
  },
  "& [data-clear-icon]:hover": { opacity: 1 },
});

export function isSessionPrimaryFactorAndLifetimeValid(session: Partial<Session>): {
  valid: boolean;
  verifiedAt?: Timestamp;
} {
  const validPassword = session?.factors?.password?.verifiedAt;
  const validPasskey = session?.factors?.webAuthN?.verifiedAt;
  const validIDP = session?.factors?.intent?.verifiedAt;

  const stillValid = session.expirationDate ? timestampDate(session.expirationDate) > new Date() : true;

  const verifiedAt = validPassword || validPasskey || validIDP;
  const valid = !!((validPassword || validPasskey || validIDP) && stillValid);

  return { valid, verifiedAt };
}

export function SessionItem({ session, reload, requestId }: { session: Session; reload: () => void; requestId?: string }) {
  const currentLocale = useLocale();
  moment.locale(currentLocale === "zh" ? "zh-cn" : currentLocale);
  const t = useTranslations("error");

  const [_loading, setLoading] = useState<boolean>(false);

  /**
   * Returns true when the session was removed (server-side and from the cookie).
   * On failure the error is shown and the card must stay in the list.
   */
  async function clearSessionId(id: string): Promise<boolean> {
    setLoading(true);
    setError(null);
    try {
      const response = await clearSession({ sessionId: id });
      if (response && "error" in response && response.error) {
        setError(response.error);
        return false;
      }
      return true;
    } catch {
      setError(t("couldNotClearSession"));
      return false;
    } finally {
      setLoading(false);
    }
  }

  const { valid, verifiedAt } = isSessionPrimaryFactorAndLifetimeValid(session);
  const [samlData, setSamlData] = useState<{ url: string; fields: Record<string, string> } | null>(null);

  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const theme = useTheme();

  return (
    <>
      <Tooltip.Root delayDuration={300}>
        {samlData && <AutoSubmitForm url={samlData.url} fields={samlData.fields} />}
        <Tooltip.Trigger asChild>
          <Paper
            component="button"
            elevation={0}
            sx={rowSx(theme)}
            onClick={async () => {
              if (valid && session?.factors?.user) {
                const sessionPayload: ContinueWithSessionCommand = session;
                if (requestId) {
                  sessionPayload.requestId = requestId;
                }

                const callbackResponse = await continueWithSession(sessionPayload);

                handleServerActionResponse(callbackResponse, router, setSamlData, (e) => setError(e));
              } else if (session.factors?.user) {
                setLoading(true);
                try {
                  const res = await sendLoginname({
                    loginName: session.factors?.user?.loginName,
                    organization: session.factors.user.organizationId,
                    requestId: requestId,
                  });

                  handleServerActionResponse(res, router, setSamlData, (e) => setError(e));
                } catch {
                  setError("An internal error occurred");
                } finally {
                  setLoading(false);
                }
              }
            }}
          >
            <Box mr={2} display="flex" flexShrink={0}>
              <Avatar
                size="small"
                loginName={session.factors?.user?.loginName as string}
                name={session.factors?.user?.displayName ?? ""}
              />
            </Box>

            <Stack alignItems="flex-start" overflow="hidden">
              <Typography variant="body2" component="span">
                {session.factors?.user?.displayName}
              </Typography>
              <Typography variant="caption" color="text.secondary" component="span" sx={{ textOverflow: "ellipsis" }}>
                {session.factors?.user?.loginName}
              </Typography>
              {valid ? (
                <Typography variant="caption" color="text.secondary" component="span" sx={{ textOverflow: "ellipsis" }}>
                  <Translated i18nKey="verified" namespace="accounts" />{" "}
                  {verifiedAt && moment(timestampDate(verifiedAt)).fromNow()}
                </Typography>
              ) : (
                verifiedAt && (
                  <Typography variant="caption" color="text.secondary" component="span" sx={{ textOverflow: "ellipsis" }}>
                    <Translated i18nKey="expired" namespace="accounts" />{" "}
                    {session.expirationDate && moment(timestampDate(session.expirationDate)).fromNow()}
                  </Typography>
                )
              )}
            </Stack>

            <Stack direction="row" alignItems="center" gap={1} ml="auto" pl={1}>
              <XCircleIcon
                data-clear-icon=""
                style={{ height: 20, width: 20 }}
                onClick={async (event: React.MouseEvent) => {
                  event.preventDefault();
                  event.stopPropagation();
                  if (await clearSessionId(session.id)) {
                    reload();
                  }
                }}
              />
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  flexShrink: 0,
                  borderRadius: "50%",
                  bgcolor: valid ? "success.main" : "error.main",
                }}
              />
            </Stack>
          </Paper>
        </Tooltip.Trigger>
        {valid && session.expirationDate && (
          <Tooltip.Portal>
            <Tooltip.Content
              style={{
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.text.primary,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 8,
                padding: "8px 12px",
                fontSize: 12,
                boxShadow: theme.shadows[8],
                userSelect: "none",
                zIndex: theme.zIndex.tooltip,
              }}
              sideOffset={5}
            >
              Expires {moment(timestampDate(session.expirationDate)).fromNow()}
              <Tooltip.Arrow style={{ fill: theme.palette.background.paper }} />
            </Tooltip.Content>
          </Tooltip.Portal>
        )}
      </Tooltip.Root>
      {error && <Alert>{error}</Alert>}
    </>
  );
}
