"use client";

import { lowerCaseValidator, numberValidator, symbolValidator, upperCaseValidator } from "@/helpers/validators";
import { handleServerActionResponse } from "@/lib/client-utils";
import { checkSessionAndSetPassword, sendPassword } from "@/lib/server/password";
import { Box, Stack } from "@mui/material";
import { create } from "@zitadel/client";
import { ChecksSchema } from "@zitadel/proto/zitadel/session/v2/session_service_pb";
import { PasswordComplexitySettings } from "@zitadel/proto/zitadel/settings/v2/password_settings_pb";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { CSSProperties, useState } from "react";
import { FieldValues, useForm } from "react-hook-form";
import { Alert } from "./alert";
import { AutoSubmitForm } from "./auto-submit-form";
import { BackButton } from "./back-button";
import { Button, ButtonVariants } from "./button";
import { TextInput } from "./input";
import { PasswordComplexity } from "./password-complexity";
import { Spinner } from "./spinner";
import { Translated } from "./translated";

type Inputs =
  | {
      currentPassword: string;
      password: string;
      confirmPassword: string;
    }
  | FieldValues;

type Props = {
  passwordComplexitySettings: PasswordComplexitySettings;
  sessionId: string;
  loginName: string;
  requestId?: string;
  organization?: string;
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

export function ChangePasswordForm({ passwordComplexitySettings, sessionId, loginName, requestId, organization }: Props) {
  const router = useRouter();

  const { register, handleSubmit, watch, formState } = useForm<Inputs>({
    mode: "onChange",
    defaultValues: {
      currentPassword: "",
      password: "",
      confirmPassword: "",
    },
  });

  const t = useTranslations("password");

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [samlData, setSamlData] = useState<{ url: string; fields: Record<string, string> } | null>(null);

  async function submitChange(values: Inputs) {
    setLoading(true);

    const changeResponse = await checkSessionAndSetPassword({
      sessionId,
      currentPassword: values.currentPassword,
      password: values.password,
    }).catch(() => {
      setError(t("change.errors.couldNotChangePassword"));
      setLoading(false);
      return;
    });

    if (changeResponse && "error" in changeResponse && changeResponse.error) {
      setError(typeof changeResponse.error === "string" ? changeResponse.error : t("change.errors.unknownError"));
      setLoading(false);
      return;
    }

    if (!changeResponse) {
      setError(t("change.errors.couldNotChangePassword"));
      setLoading(false);
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000)); // wait for a second, to prevent eventual consistency issues

    const passwordResponse = await sendPassword({
      loginName,
      organization,
      checks: create(ChecksSchema, {
        password: { password: values.password },
      }),
      requestId,
    })
      .catch(() => {
        setError(t("change.errors.couldNotVerifyPassword"));
        return;
      })
      .finally(() => {
        setLoading(false);
      });

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
          <TextInput
            type="password"
            autoComplete="current-password"
            autoFocus
            required
            {...register("currentPassword", {
              required: t("change.required.currentPassword"),
            })}
            label={t("change.labels.currentPassword")}
            error={errors.currentPassword?.message as string}
            data-testid="password-change-current-text-input"
          />
          <TextInput
            type="password"
            autoComplete="new-password"
            required
            {...register("password", {
              required: t("change.required.newPassword"),
            })}
            label={t("change.labels.newPassword")}
            error={errors.password?.message as string}
            data-testid="password-change-text-input"
          />
          <TextInput
            type="password"
            required
            autoComplete="new-password"
            {...register("confirmPassword", {
              required: t("change.required.confirmPassword"),
            })}
            label={t("change.labels.confirmPassword")}
            error={errors.confirmPassword?.message as string}
            data-testid="password-change-confirm-text-input"
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
            onClick={handleSubmit(submitChange)}
            data-testid="submit-button"
          >
            {loading && <Spinner />} <Translated i18nKey="change.submit" namespace="password" />
          </Button>
        </Stack>
      </Box>
    </>
  );
}
