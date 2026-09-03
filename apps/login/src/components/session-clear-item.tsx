"use client";

import { clearSession } from "@/lib/server/session";
import { Box, Paper, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { timestampDate } from "@zitadel/client";
import { Session } from "@zitadel/proto/zitadel/session/v2/session_pb";
import moment from "moment";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "./alert";
import { Avatar } from "./avatar";
import { isSessionPrimaryFactorAndLifetimeValid } from "./session-item";
import { Translated } from "./translated";

// Same tile pattern as `session-item.tsx`'s `rowSx`, minus the tooltip and the
// icon — this row shows a hover-revealed "clear" text badge instead.
const rowSx = {
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
  "& [data-clear-badge]": { display: "none" },
  "&:hover [data-clear-badge]": { display: "flex" },
};

export function SessionClearItem({ session, reload }: { session: Session; reload: () => void }) {
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

  const [error, setError] = useState<string | null>(null);

  // TODO: To we have to call this?
  useRouter();

  return (
    <>
      <Paper
        component="button"
        elevation={0}
        onClick={async () => {
          if (await clearSessionId(session.id)) {
            reload();
          }
        }}
        sx={rowSx}
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
              {verifiedAt && (
                <Translated
                  i18nKey="verifiedAt"
                  namespace="logout"
                  data={{ time: moment(timestampDate(verifiedAt)).fromNow() }}
                />
              )}
            </Typography>
          ) : (
            verifiedAt && (
              <Typography variant="caption" color="text.secondary" component="span" sx={{ textOverflow: "ellipsis" }}>
                expired {session.expirationDate && moment(timestampDate(session.expirationDate)).fromNow()}
              </Typography>
            )
          )}
        </Stack>

        <Stack direction="row" alignItems="center" gap={1} ml="auto" pl={1}>
          <Box
            data-clear-badge=""
            sx={{
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 999,
              px: 1,
              py: 0.25,
              bgcolor: (theme) => alpha(theme.palette.error.main, 0.1),
            }}
          >
            <Typography variant="caption" color="error.main">
              <Translated i18nKey="clear" namespace="logout" />
            </Typography>
          </Box>

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
      {error && <Alert>{error}</Alert>}
    </>
  );
}
