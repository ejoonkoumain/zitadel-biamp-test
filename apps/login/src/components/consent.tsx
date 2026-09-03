"use client";

import { completeDeviceAuthorization } from "@/lib/server/device";
import { Box, Paper, Stack, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "./alert";
import { Button, ButtonVariants } from "./button";
import { Spinner } from "./spinner";
import { Translated } from "./translated";

// Bordered, rounded scope row — the same tile pattern as auth-methods.tsx's
// `tileSx` (borderRadius 2, 1px `divider` border, Paper's own theme-driven
// background), minus the hover/pointer affordances: these rows are
// informational, not links.
const scopeItemSx = {
  display: "flex",
  alignItems: "center",
  width: "100%",
  borderRadius: 2,
  border: 1,
  borderColor: "divider",
  px: 2,
  py: 1,
};

export function ConsentScreen({
  scope,
  nextUrl,
  deviceAuthorizationRequestId,
  appName,
}: {
  scope?: string[];
  nextUrl: string;
  deviceAuthorizationRequestId: string;
  appName?: string;
}) {
  const t = useTranslations();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const router = useRouter();

  async function denyDeviceAuth() {
    setLoading(true);
    const response = await completeDeviceAuthorization(deviceAuthorizationRequestId)
      .catch(() => {
        setError("Could not register user");
        return;
      })
      .finally(() => {
        setLoading(false);
      });

    if (response) {
      return router.push("/device");
    }
  }

  const scopes = scope?.filter((s) => !!s);

  return (
    <Stack alignItems="center" gap={2} width="100%" pt={2}>
      <Stack component="ul" gap={1} width="100%" sx={{ listStyle: "none", m: 0, p: 0 }}>
        {scopes?.length === 0 && (
          <Paper component="li" elevation={0} sx={scopeItemSx}>
            <Typography variant="body2">
              <Translated i18nKey="device.scope.openid" namespace="device" />
            </Typography>
          </Paper>
        )}
        {scopes?.map((s) => {
          const translationKey = `device.scope.${s}`;
          const description = t(translationKey);

          // Check if the key itself is returned and provide a fallback
          const resolvedDescription = description === translationKey ? "" : description;

          return (
            <Paper component="li" key={s} elevation={0} sx={scopeItemSx}>
              <Typography variant="body2">{resolvedDescription}</Typography>
            </Paper>
          );
        })}
      </Stack>

      {/* Direct child of LandingShell's background (no Card/Paper wraps this
          paragraph) — text.secondary per the colour rule, same choice as
          sign-in-with-idp.tsx and mfa/page.tsx make for text sitting
          straight on the shell's fixed dark background. */}
      <Typography variant="caption" color="text.secondary" textAlign="left">
        <Translated i18nKey="request.disclaimer" namespace="device" data={{ appName: appName }} />
      </Typography>

      {error && (
        <Box py={2} width="100%">
          <Alert>{error}</Alert>
        </Box>
      )}

      <Stack direction="row" alignItems="center" width="100%" mt={2}>
        <Button
          onClick={() => {
            denyDeviceAuth();
          }}
          variant={ButtonVariants.Secondary}
          data-testid="deny-button"
        >
          {loading && <Spinner />}
          <Translated i18nKey="device.request.deny" namespace="device" />
        </Button>
        <Box flexGrow={1} />

        <Link href={nextUrl}>
          <Button data-testid="submit-button" type="submit" variant={ButtonVariants.Primary}>
            <Translated i18nKey="device.request.submit" namespace="device" />
          </Button>
        </Link>
      </Stack>
    </Stack>
  );
}
