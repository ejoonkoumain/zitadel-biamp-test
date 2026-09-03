"use client";

import { completeFlowOrGetUrl } from "@/lib/client";
import { handleServerActionResponse } from "@/lib/client-utils";
import { verifyTOTP } from "@/lib/server/verify";
import { Box, Stack, Typography } from "@mui/material";
import { LoginSettings } from "@zitadel/proto/zitadel/settings/v2/login_settings_pb";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Alert } from "./alert";
import { AutoSubmitForm } from "./auto-submit-form";
import { Button, ButtonVariants } from "./button";
import { CopyToClipboard } from "./copy-to-clipboard";
import { TextInput } from "./input";
import { Spinner } from "./spinner";
import { Translated } from "./translated";

type Inputs = {
  code: string;
};

type Props = {
  uri: string;
  secret: string;
  loginName?: string;
  sessionId?: string;
  requestId?: string;
  organization?: string;
  checkAfter?: boolean;
  loginSettings?: LoginSettings;
};
export function TotpRegister({ uri, loginName, sessionId, requestId, organization, checkAfter, loginSettings }: Props) {
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [samlData, setSamlData] = useState<{ url: string; fields: Record<string, string> } | null>(null);
  const router = useRouter();

  const { register, handleSubmit, formState } = useForm<Inputs>({
    mode: "onChange",
    defaultValues: {
      code: "",
    },
  });

  const t = useTranslations("otp");

  async function continueWithCode(values: Inputs) {
    setLoading(true);
    return verifyTOTP(values.code, loginName, organization)
      .then(async () => {
        // if attribute is set, validate MFA after it is setup, otherwise proceed as usual (when mfa is enforced to login)
        if (checkAfter) {
          const params = new URLSearchParams({});

          if (loginName) {
            params.append("loginName", loginName);
          }
          if (requestId) {
            params.append("requestId", requestId);
          }
          if (organization) {
            params.append("organization", organization);
          }

          return router.push(`/otp/time-based?` + params);
        } else {
          if (requestId && sessionId) {
            const callbackResponse = await completeFlowOrGetUrl(
              {
                sessionId: sessionId,
                requestId: requestId,
                organization: organization,
              },
              loginSettings?.defaultRedirectUri,
            );

            handleServerActionResponse(callbackResponse, router, setSamlData, setError);
          } else if (loginName) {
            const callbackResponse = await completeFlowOrGetUrl(
              {
                loginName: loginName,
                organization: organization,
              },
              loginSettings?.defaultRedirectUri,
            );

            handleServerActionResponse(callbackResponse, router, setSamlData, setError);
          }
        }
      })
      .catch((e) => {
        setError(e.message);
        return;
      })
      .finally(() => {
        setLoading(false);
      });
  }

  return (
    <Stack alignItems="center" width="100%">
      {samlData && <AutoSubmitForm url={samlData.url} fields={samlData.fields} />}
      {uri && (
        <>
          {/* Genuinely white regardless of theme, not a text-legibility case: a
              QR code needs a fixed light quiet-zone to stay scannable, so the
              background is hardcoded like LandingShell's own `common.white`
              usages, not derived from a token that flips with the scheme. */}
          <Box sx={{ my: 2, p: 1, borderRadius: 1.5, bgcolor: "common.white" }}>
            <QRCodeSVG value={uri} size={160} />
          </Box>
          <Stack
            direction="row"
            alignItems="center"
            width="100%"
            maxWidth={384}
            sx={{
              my: 1,
              mb: 2,
              borderRadius: 2,
              border: 1,
              // Sits directly on LandingShell's fixed dark background, not inside
              // a panel — `divider` flips with the scheme (dark hairline in
              // light mode) and would all but disappear against that background,
              // the same failure mode the colour rule calls out for text. A
              // fixed translucent-white line stays visible in both modes.
              borderColor: "rgba(255, 255, 255, 0.24)",
              px: 2,
              py: 1,
              pr: 1,
            }}
          >
            <Typography
              component={Link}
              href={uri}
              target="_blank"
              variant="body2"
              color="text.secondary"
              sx={{ flex: 1, overflowX: "auto", textDecoration: "none" }}
            >
              {uri}
            </Typography>

            <CopyToClipboard value={uri}></CopyToClipboard>
          </Stack>
          <Box component="form" width="100%">
            <TextInput
              type="text"
              autoFocus
              {...register("code", { required: t("set.required.code") })}
              label={t("set.labels.code")}
              data-testid="code-text-input"
            />

            {error && (
              <Box py={2}>
                <Alert>{error}</Alert>
              </Box>
            )}

            <Stack direction="row" width="100%" alignItems="center" justifyContent="flex-end" mt={4}>
              <Button
                type="submit"
                variant={ButtonVariants.Primary}
                disabled={loading || !formState.isValid}
                onClick={handleSubmit(continueWithCode)}
                data-testid="submit-button"
              >
                {loading && <Spinner />}
                <Translated i18nKey="set.submit" namespace="otp" />
              </Button>
            </Stack>
          </Box>
        </>
      )}
    </Stack>
  );
}
