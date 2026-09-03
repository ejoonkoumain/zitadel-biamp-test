"use client";

import { handleServerActionResponse } from "@/lib/client-utils";
import { resetPassword, sendPassword } from "@/lib/server/password";
import { LandingFormActions, LandingFormField, LandingFormPanel } from "@bwp-web/components";
import { Box } from "@mui/material";
import { create } from "@zitadel/client";
import { ChecksSchema } from "@zitadel/proto/zitadel/session/v2/session_service_pb";
import { LoginSettings } from "@zitadel/proto/zitadel/settings/v2/login_settings_pb";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Alert, AlertType } from "./alert";
import { AutoSubmitForm } from "./auto-submit-form";
import { BackButton } from "./back-button";
import { Button, ButtonVariants } from "./button";
import { Spinner } from "./spinner";
import { Translated } from "./translated";

type Inputs = {
  password: string;
};

type Props = {
  loginSettings: LoginSettings | undefined;
  loginName: string;
  organization?: string;
  defaultOrganization?: string;
  requestId?: string;
};

export function PasswordForm({ loginSettings, loginName, organization, defaultOrganization, requestId }: Props) {
  const { register, handleSubmit, formState } = useForm<Inputs>({
    mode: "onChange",
  });

  const t = useTranslations("password");

  const [info, setInfo] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [samlData, setSamlData] = useState<{ url: string; fields: Record<string, string> } | null>(null);

  const [loading, setLoading] = useState<boolean>(false);

  const router = useRouter();

  async function submitPassword(values: Inputs) {
    setError("");
    setLoading(true);

    try {
      const response = await sendPassword({
        loginName,
        organization,
        defaultOrganization,
        checks: create(ChecksSchema, {
          password: { password: values.password },
        }),
        requestId,
      });

      handleServerActionResponse(response, router, setSamlData, setError);
    } catch {
      setError(t("verify.errors.couldNotVerifyPassword"));
    } finally {
      setLoading(false);
    }
  }

  async function resetPasswordAndContinue() {
    setError("");
    setInfo("");
    setLoading(true);

    const response = await resetPassword({
      loginName,
      organization,
      defaultOrganization,
      requestId,
    })
      .catch(() => {
        setError(t("errors.couldNotSendResetLink"));
        return;
      })
      .finally(() => {
        setLoading(false);
      });

    if (response && "error" in response) {
      setError(response.error as string);
      return;
    }

    setInfo(t("verify.info.passwordResetSent"));

    const params = new URLSearchParams({
      loginName: loginName,
    });

    if (organization) {
      params.append("organization", organization);
    }

    if (requestId) {
      params.append("requestId", requestId);
    }

    return router.push("/password/set?" + params);
  }

  // LandingFormField spreads onto MUI TextField, whose `ref` targets the root
  // div — not the <input>. Registering the whole field would hand RHF that
  // div's ref, so formState.isValid would never flip true and the submit
  // button would stay permanently disabled. Split the ref out and hand it to
  // TextField's `inputRef` instead, which does target the <input>.
  const { ref: passwordRef, ...passwordField } = register("password", {
    required: t("verify.required.password"),
  });

  return (
    <>
      {samlData && <AutoSubmitForm url={samlData.url} fields={samlData.fields} />}
      <LandingFormPanel onSubmit={handleSubmit(submitPassword)}>
        <LandingFormField
          label={t("verify.labels.password")}
          type="password"
          autoComplete="current-password"
          autoFocus
          {...passwordField}
          inputRef={passwordRef}
          slotProps={{ htmlInput: { "data-testid": "password-text-input" } }}
        />

        {!loginSettings?.hidePasswordReset && (
          <Box
            component="button"
            type="button"
            onClick={() => resetPasswordAndContinue()}
            disabled={loading}
            data-testid="reset-button"
            sx={{
              alignSelf: "flex-start",
              typography: "body2",
              color: "info.main",
              background: "none",
              border: "none",
              p: 0,
              cursor: "pointer",
              "&:hover": { textDecoration: "underline" },
              "&:disabled": { color: "action.disabled", cursor: "default" },
            }}
          >
            <Translated i18nKey="verify.resetPassword" namespace="password" />
          </Box>
        )}

        {loginName && <input type="hidden" name="loginName" autoComplete="username" value={loginName} />}

        {info && <Alert type={AlertType.INFO}>{info}</Alert>}

        {error && (
          <Box data-testid="error">
            <Alert>{error}</Alert>
          </Box>
        )}

        <LandingFormActions sx={{ justifyContent: "space-between" }}>
          <BackButton data-testid="back-button" />
          <Button
            type="submit"
            variant={ButtonVariants.Primary}
            disabled={loading || !formState.isValid}
            data-testid="submit-button"
          >
            {loading && <Spinner />} <Translated i18nKey="verify.submit" namespace="password" />
          </Button>
        </LandingFormActions>
      </LandingFormPanel>
    </>
  );
}
