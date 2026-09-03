"use client";

import { handleServerActionResponse } from "@/lib/client-utils";
import { skipMFAAndContinueWithNextUrl } from "@/lib/server/session";
import { Box, Stack } from "@mui/material";
import { LoginSettings, SecondFactorType } from "@zitadel/proto/zitadel/settings/v2/login_settings_pb";
import { AuthenticationMethodType } from "@zitadel/proto/zitadel/user/v2/user_service_pb";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "./alert";
import { EMAIL, SMS, TOTP, U2F } from "./auth-methods";
import { AutoSubmitForm } from "./auto-submit-form";
import { Card } from "./card";
import { Translated } from "./translated";

type Props = {
  userId: string;
  loginName?: string;
  sessionId?: string;
  requestId?: string;
  organization?: string;
  loginSettings: LoginSettings;
  userMethods: AuthenticationMethodType[];
  checkAfter: boolean;
  phoneVerified: boolean;
  emailVerified: boolean;
  force: boolean;
};

export function ChooseSecondFactorToSetup({
  userId,
  loginName,
  sessionId,
  requestId,
  organization,
  loginSettings,
  userMethods,
  checkAfter,
  phoneVerified,
  emailVerified,
  force,
}: Props) {
  const router = useRouter();
  const params = new URLSearchParams({});

  const [error, setError] = useState<string>("");
  const [samlData, setSamlData] = useState<{ url: string; fields: Record<string, string> } | null>(null);

  if (loginName) {
    params.append("loginName", loginName);
  }
  if (sessionId) {
    params.append("sessionId", sessionId);
  }
  if (requestId) {
    params.append("requestId", requestId);
  }
  if (organization) {
    params.append("organization", organization);
  }
  if (checkAfter) {
    params.append("checkAfter", "true");
  }

  return (
    <>
      {samlData && <AutoSubmitForm url={samlData.url} fields={samlData.fields} />}
      <Stack width="100%" gap={2.5} pt={2}>
        {loginSettings.secondFactors.map((factor) => {
          switch (factor) {
            case SecondFactorType.OTP:
              return TOTP(userMethods.includes(AuthenticationMethodType.TOTP), "/otp/time-based/set?" + params);
            case SecondFactorType.U2F:
              return U2F(userMethods.includes(AuthenticationMethodType.U2F), "/u2f/set?" + params);
            case SecondFactorType.OTP_EMAIL:
              return (
                emailVerified && EMAIL(userMethods.includes(AuthenticationMethodType.OTP_EMAIL), "/otp/email/set?" + params)
              );
            case SecondFactorType.OTP_SMS:
              return phoneVerified && SMS(userMethods.includes(AuthenticationMethodType.OTP_SMS), "/otp/sms/set?" + params);
            default:
              return null;
          }
        })}
      </Stack>
      {!force && (
        <Box width="100%" maxWidth={441}>
          <Card>
            <Box
              component="button"
              type="button"
              onClick={async () => {
                const skipResponse = await skipMFAAndContinueWithNextUrl({
                  userId,
                  loginName,
                  sessionId,
                  organization,
                  requestId,
                });

                handleServerActionResponse(skipResponse, router, setSamlData, setError);
              }}
              data-testid="reset-button"
              sx={{
                typography: "body2",
                color: "info.main",
                background: "none",
                border: "none",
                p: 0,
                cursor: "pointer",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              <Translated i18nKey="set.skip" namespace="mfa" />
            </Box>
          </Card>
        </Box>
      )}
      {error && (
        <Box py={2} data-testid="error">
          <Alert>{error}</Alert>
        </Box>
      )}
    </>
  );
}
