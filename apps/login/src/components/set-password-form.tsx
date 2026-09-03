"use client";

import { lowerCaseValidator, numberValidator, symbolValidator, upperCaseValidator } from "@/helpers/validators";
import { handleServerActionResponse } from "@/lib/client-utils";
import { changePassword, resetPassword, sendPassword } from "@/lib/server/password";
import { Box, Stack } from "@mui/material";
import { create } from "@zitadel/client";
import { ChecksSchema } from "@zitadel/proto/zitadel/session/v2/session_service_pb";
import { PasswordComplexitySettings } from "@zitadel/proto/zitadel/settings/v2/password_settings_pb";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { CSSProperties, useState } from "react";
import { FieldValues, useForm } from "react-hook-form";
import { Alert, AlertType } from "./alert";
import { AutoSubmitForm } from "./auto-submit-form";
import { BackButton } from "./back-button";
import { Button, ButtonVariants } from "./button";
import { TextInput } from "./input";
import { PasswordComplexity } from "./password-complexity";
import { Spinner } from "./spinner";
import { Translated } from "./translated";

type Inputs =
  | {
      code: string;
      password: string;
      confirmPassword: string;
    }
  | FieldValues;

type Props = {
  code?: string;
  passwordComplexitySettings: PasswordComplexitySettings;
  loginName: string;
  userId: string;
  organization?: string;
  defaultOrganization?: string;
  requestId?: string;
  codeRequired: boolean;
};

// Reproduces Tailwind's `.sr-only` utility inline: visually hidden but still
// present for password managers / screen readers, without a Tailwind class.
const srOnlyStyle: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
};

export function SetPasswordForm({
  passwordComplexitySettings,
  organization,
  defaultOrganization,
  requestId,
  loginName,
  userId,
  code,
  codeRequired,
}: Props) {
  const { register, handleSubmit, watch, formState } = useForm<Inputs>({
    mode: "onChange",
    defaultValues: {
      code: code ?? "",
    },
  });

  const t = useTranslations("password");

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [samlData, setSamlData] = useState<{ url: string; fields: Record<string, string> } | null>(null);

  const router = useRouter();

  async function resendCode() {
    setError("");
    setLoading(true);

    const response = await resetPassword({
      loginName,
      organization,
      defaultOrganization,
      requestId,
    })
      .catch(() => {
        setError(t("set.errors.couldNotResetPassword"));
        return;
      })
      .finally(() => {
        setLoading(false);
      });

    if (response && "error" in response && typeof response.error === "string") {
      setError(response.error);
      return;
    }
  }

  async function submitPassword(values: Inputs) {
    setLoading(true);

    let payload: { userId: string; password: string; code?: string; organization?: string } = {
      userId: userId,
      password: values.password,
      organization,
    };

    // this is not required for initial password setup
    if (codeRequired) {
      payload = { ...payload, code: values.code };
    }

    const changeResponse = await changePassword(payload).catch(() => {
      setError(t("set.errors.couldNotSetPassword"));
      setLoading(false);
      return;
    });

    if (changeResponse && "error" in changeResponse) {
      setLoading(false);
      setError(changeResponse.error);
      return;
    }

    if (!changeResponse) {
      setLoading(false);
      setError(t("set.errors.couldNotSetPassword"));
      return;
    }

    const params = new URLSearchParams({});

    if (loginName) {
      params.append("loginName", loginName);
    }
    if (organization) {
      params.append("organization", organization);
    }

    await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for a second to avoid eventual consistency issues with an initial password being set

    const passwordResponse = await sendPassword({
      loginName,
      organization,
      checks: create(ChecksSchema, {
        password: { password: values.password },
      }),
      requestId,
    }).catch(() => {
      setError(t("set.errors.couldNotVerifyPassword"));
      setLoading(false);
      return;
    });

    setLoading(false);
    handleServerActionResponse(passwordResponse as any, router, setSamlData, setError);

    return;
  }

  const { errors } = formState;

  const watchPassword = watch("password", "");
  const watchConfirmPassword = watch("confirmPassword", "");

  const hasMinLength = passwordComplexitySettings && watchPassword?.length >= passwordComplexitySettings.minLength;
  const hasSymbol = symbolValidator(watchPassword);
  const hasNumber = numberValidator(watchPassword);
  const hasUppercase = upperCaseValidator(watchPassword);
  const hasLowercase = lowerCaseValidator(watchPassword);

  const policyIsValid =
    passwordComplexitySettings &&
    (passwordComplexitySettings.requiresLowercase ? hasLowercase : true) &&
    (passwordComplexitySettings.requiresNumber ? hasNumber : true) &&
    (passwordComplexitySettings.requiresUppercase ? hasUppercase : true) &&
    (passwordComplexitySettings.requiresSymbol ? hasSymbol : true) &&
    hasMinLength;

  return (
    <>
      {samlData && <AutoSubmitForm url={samlData.url} fields={samlData.fields} />}
      <Box component="form" width="100%">
        <Stack gap={2} mb={2} pt={2}>
          <input
            type="text"
            name="username"
            autoComplete="username"
            value={loginName}
            readOnly
            tabIndex={-1}
            aria-hidden="true"
            style={srOnlyStyle}
          />
          {codeRequired && (
            <Alert type={AlertType.INFO}>
              <Stack direction="row" alignItems="center" width="100%">
                <Box component="span" sx={{ mr: "auto", flex: 1, textAlign: "left" }}>
                  <Translated i18nKey="set.noCodeReceived" namespace="password" />
                </Box>
                <Box
                  component="button"
                  aria-label="Resend OTP Code"
                  disabled={loading}
                  type="button"
                  onClick={() => {
                    resendCode();
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
                  <Translated i18nKey="set.resend" namespace="password" />
                </Box>
              </Stack>
            </Alert>
          )}
          {codeRequired && (
            <TextInput
              type="text"
              autoFocus
              required
              {...register("code", {
                required: t("set.required.code"),
              })}
              label={t("set.labels.code")}
              autoComplete="one-time-code"
              error={errors.code?.message as string}
              data-testid="code-text-input"
            />
          )}
          <TextInput
            type="password"
            autoComplete="new-password"
            autoFocus={!codeRequired}
            required
            {...register("password", {
              required: t("set.required.newPassword"),
            })}
            label={t("set.labels.newPassword")}
            error={errors.password?.message as string}
            data-testid="password-set-text-input"
          />
          <TextInput
            type="password"
            required
            autoComplete="new-password"
            {...register("confirmPassword", {
              required: t("set.required.confirmPassword"),
            })}
            label={t("set.labels.confirmPassword")}
            error={errors.confirmPassword?.message as string}
            data-testid="password-set-confirm-text-input"
          />
        </Stack>

        {passwordComplexitySettings && (
          <PasswordComplexity
            passwordComplexitySettings={passwordComplexitySettings}
            password={watchPassword}
            equals={!!watchPassword && watchPassword === watchConfirmPassword}
          />
        )}

        {error && <Alert>{error}</Alert>}

        <Stack direction="row" width="100%" alignItems="center" justifyContent="space-between" mt={4}>
          <BackButton data-testid="back-button" />
          <Button
            type="submit"
            variant={ButtonVariants.Primary}
            disabled={loading || !policyIsValid || !formState.isValid || watchPassword !== watchConfirmPassword}
            onClick={handleSubmit(submitPassword)}
            data-testid="submit-button"
          >
            {loading && <Spinner />} <Translated i18nKey="set.submit" namespace="password" />
          </Button>
        </Stack>
      </Box>
    </>
  );
}
