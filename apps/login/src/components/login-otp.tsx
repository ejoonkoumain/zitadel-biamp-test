"use client";

import { completeFlowOrGetUrl } from "@/lib/client";
import { handleServerActionResponse } from "@/lib/client-utils";
import { updateOrCreateSession } from "@/lib/server/session";
import { Box, Stack } from "@mui/material";
import { create } from "@zitadel/client";
import { RequestChallengesSchema } from "@zitadel/proto/zitadel/session/v2/challenge_pb";
import { ChecksSchema } from "@zitadel/proto/zitadel/session/v2/session_service_pb";
import { LoginSettings } from "@zitadel/proto/zitadel/settings/v2/login_settings_pb";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Alert, AlertType } from "./alert";
import { AutoSubmitForm } from "./auto-submit-form";
import { BackButton } from "./back-button";
import { Button, ButtonVariants } from "./button";
import { TextInput } from "./input";
import { Spinner } from "./spinner";
import { Translated } from "./translated";

// either loginName or sessionId must be provided
type Props = {
  host: string | null;
  loginName?: string;
  sessionId?: string;
  requestId?: string;
  organization?: string;
  method: string;
  code?: string;
  loginSettings?: LoginSettings;
};

type Inputs = {
  code: string;
};

export function LoginOTP({ host, loginName, sessionId, requestId, organization, method, code, loginSettings }: Props) {
  const t = useTranslations("otp");

  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [samlData, setSamlData] = useState<{ url: string; fields: Record<string, string> } | null>(null);

  const router = useRouter();

  const initialized = useRef(false);

  const { register, handleSubmit, formState } = useForm<Inputs>({
    mode: "onChange",
    defaultValues: {
      code: code ? code : "",
    },
  });

  const updateSessionForOTPChallenge = useCallback(async (): Promise<{
    error?: string;
    [key: string]: any;
  }> => {
    let challenges;

    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

    if (method === "email") {
      challenges = create(RequestChallengesSchema, {
        otpEmail: {
          deliveryType: {
            case: "sendCode",
            value: host
              ? {
                  urlTemplate:
                    `${host.includes("localhost") ? "http://" : "https://"}${host}${basePath}/otp/${method}?code={{.Code}}&userId={{.UserID}}&sessionId={{.SessionID}}` +
                    (requestId ? `&requestId=${requestId}` : ""),
                }
              : {},
          },
        },
      });
    }

    if (method === "sms") {
      challenges = create(RequestChallengesSchema, {
        otpSms: {},
      });
    }

    let response;
    try {
      response = await updateOrCreateSession({
        loginName,
        sessionId,
        organization,
        challenges,
        requestId,
      });
    } catch {
      return { error: "Could not request OTP challenge" };
    }

    if (response && "error" in response && response.error) {
      return { error: response.error };
    }

    return response;
  }, [method, host, requestId, loginName, sessionId, organization]);

  useEffect(() => {
    if (!initialized.current && ["email", "sms"].includes(method) && !code) {
      initialized.current = true;
      setLoading(true);
      updateSessionForOTPChallenge()
        .then((response) => {
          if (response?.error) {
            setError(response.error);
          }
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [updateSessionForOTPChallenge, method, code]);

  async function submitCode(values: Inputs, organization?: string) {
    setLoading(true);

    let body: any = {
      code: values.code,
      method,
    };

    if (organization) {
      body.organization = organization;
    }

    if (requestId) {
      body.requestId = requestId;
    }

    let checks;

    if (method === "sms") {
      checks = create(ChecksSchema, {
        otpSms: { code: values.code },
      });
    }
    if (method === "email") {
      checks = create(ChecksSchema, {
        otpEmail: { code: values.code },
      });
    }
    if (method === "time-based") {
      checks = create(ChecksSchema, {
        totp: { code: values.code },
      });
    }

    const response = await updateOrCreateSession({
      loginName,
      sessionId,
      organization,
      checks,
      requestId,
    })
      .catch(() => {
        setError("Could not verify OTP code");
        return;
      })
      .finally(() => {
        setLoading(false);
      });

    if (response && "error" in response && response.error) {
      setError(response.error);
      return;
    }

    return response;
  }

  function setCodeAndContinue(values: Inputs) {
    return submitCode(values, organization).then(async (response) => {
      if (response && "sessionId" in response) {
        setLoading(true);
        // Wait for 2 seconds to avoid eventual consistency issues with an OTP code being verified in the /login endpoint
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Use unified approach that handles both OIDC/SAML and regular flows
        if (response.factors?.user) {
          const callbackResponse = await completeFlowOrGetUrl(
            requestId && response.sessionId
              ? {
                  sessionId: response.sessionId,
                  requestId: requestId,
                  organization: response.factors?.user?.organizationId,
                }
              : {
                  loginName: response.factors.user.loginName,
                  organization: response.factors?.user?.organizationId,
                },
            loginSettings?.defaultRedirectUri,
          );
          setLoading(false);

          handleServerActionResponse(callbackResponse, router, setSamlData, setError);
        } else {
          setLoading(false);
        }
      }
    });
  }

  return (
    <>
      {samlData && <AutoSubmitForm url={samlData.url} fields={samlData.fields} />}
      <Box component="form" width="100%">
        {["email", "sms"].includes(method) && (
          <Alert type={AlertType.INFO}>
            <Stack direction="row" alignItems="center" width="100%">
              <Box component="span" sx={{ mr: "auto", flex: 1, textAlign: "left" }}>
                <Translated i18nKey="verify.noCodeReceived" namespace="otp" />
              </Box>
              <Box
                component="button"
                aria-label="Resend OTP Code"
                disabled={loading}
                type="button"
                onClick={async () => {
                  setLoading(true);
                  const response = await updateSessionForOTPChallenge();
                  if (response?.error) {
                    setError(response.error);
                  }
                  setLoading(false);
                }}
                data-testid="resend-button"
                sx={{
                  ml: 2,
                  background: "none",
                  border: "none",
                  p: 0,
                  cursor: "pointer",
                  color: "info.main",
                  "&:disabled": { cursor: "default", color: "action.disabled" },
                }}
              >
                <Translated i18nKey="verify.resendCode" namespace="otp" />
              </Box>
            </Stack>
          </Alert>
        )}
        <Box mt={2}>
          <TextInput
            type="text"
            autoFocus
            {...register("code", { required: t("verify.required.code") })}
            label={t("verify.labels.code")}
            autoComplete="one-time-code"
            data-testid="code-text-input"
          />
        </Box>

        {error && (
          <Box py={2} data-testid="error">
            <Alert>{error}</Alert>
          </Box>
        )}

        <Stack direction="row" alignItems="center" width="100%" mt={4}>
          <BackButton data-testid="back-button" />
          <Box flexGrow={1} />
          <Button
            type="submit"
            variant={ButtonVariants.Primary}
            disabled={loading || !formState.isValid}
            onClick={handleSubmit(setCodeAndContinue)}
            data-testid="submit-button"
          >
            {loading && <Spinner />} <Translated i18nKey="verify.submit" namespace="otp" />
          </Button>
        </Stack>
      </Box>
    </>
  );
}
