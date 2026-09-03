"use client";

import { lowerCaseValidator, numberValidator, symbolValidator, upperCaseValidator } from "@/helpers/validators";
import { handleServerActionResponse } from "@/lib/client-utils";
import { registerUser } from "@/lib/server/register";
import { LandingFormActions, LandingFormField, LandingFormPanel } from "@bwp-web/components";
import { Box } from "@mui/material";
import { PasswordComplexitySettings } from "@zitadel/proto/zitadel/settings/v2/password_settings_pb";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FieldValues, useForm } from "react-hook-form";
import { Alert } from "./alert";
import { AutoSubmitForm } from "./auto-submit-form";
import { BackButton } from "./back-button";
import { Button, ButtonVariants } from "./button";
import { PasswordComplexity } from "./password-complexity";
import { Spinner } from "./spinner";
import { Translated } from "./translated";

type Inputs =
  | {
      password: string;
      confirmPassword: string;
    }
  | FieldValues;

type Props = {
  passwordComplexitySettings: PasswordComplexitySettings;
  email: string;
  firstname: string;
  lastname: string;
  organization: string;
  requestId?: string;
};

export function SetRegisterPasswordForm({
  passwordComplexitySettings,
  email,
  firstname,
  lastname,
  organization,
  requestId,
}: Props) {
  const { register, handleSubmit, watch, formState } = useForm<Inputs>({
    mode: "onChange",
    defaultValues: {
      email: email ?? "",
      firstname: firstname ?? "",
      lastname: lastname ?? "",
    },
  });

  const t = useTranslations("register");

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [samlData, setSamlData] = useState<{ url: string; fields: Record<string, string> } | null>(null);

  const router = useRouter();

  async function submitRegister(values: Inputs) {
    setLoading(true);
    try {
      const response = await registerUser({
        email: email,
        firstName: firstname,
        lastName: lastname,
        organization: organization,
        requestId: requestId,
        password: values.password,
      });

      handleServerActionResponse(response, router, setSamlData, setError);
    } catch {
      setError(t("errors.couldNotRegisterUser"));
    } finally {
      setLoading(false);
    }
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

  // LandingFormField spreads onto MUI TextField, whose `ref` targets the root
  // div — not the <input>. Registering the whole field would hand RHF that
  // div's ref, so formState.isValid would never flip true and the submit
  // button would stay permanently disabled. Split the ref out and hand it to
  // TextField's `inputRef` instead, which does target the <input> (see
  // username-form.tsx / password-form.tsx for the same pattern).
  const { ref: passwordRef, ...passwordField } = register("password", {
    required: t("password.required.password"),
  });
  const { ref: confirmPasswordRef, ...confirmPasswordField } = register("confirmPassword", {
    required: t("password.required.confirmPassword"),
  });

  return (
    <>
      {samlData && <AutoSubmitForm url={samlData.url} fields={samlData.fields} />}
      <LandingFormPanel onSubmit={handleSubmit(submitRegister)}>
        {/* Hidden but present in the DOM (not type="hidden", which some
            browsers ignore for autocomplete purposes): lets password managers
            associate the new password below with this username, matching the
            username field the user filled in earlier in the flow. */}
        <Box
          component="input"
          type="text"
          name="username"
          autoComplete="username"
          value={email ?? ""}
          readOnly
          tabIndex={-1}
          aria-hidden="true"
          sx={{
            position: "absolute",
            width: 1,
            height: 1,
            padding: 0,
            margin: -1,
            overflow: "hidden",
            clip: "rect(0, 0, 0, 0)",
            whiteSpace: "nowrap",
            border: 0,
          }}
        />

        <LandingFormField
          type="password"
          autoComplete="new-password"
          autoFocus
          required
          {...passwordField}
          inputRef={passwordRef}
          label={t("password.labels.password")}
          error={Boolean(errors.password)}
          helperText={(errors.password?.message as string) || " "}
          slotProps={{ htmlInput: { "data-testid": "password-text-input" } }}
        />

        <LandingFormField
          type="password"
          required
          autoComplete="new-password"
          {...confirmPasswordField}
          inputRef={confirmPasswordRef}
          label={t("password.labels.confirmPassword")}
          error={Boolean(errors.confirmPassword)}
          helperText={(errors.confirmPassword?.message as string) || " "}
          slotProps={{ htmlInput: { "data-testid": "password-confirm-text-input" } }}
        />

        {passwordComplexitySettings && (
          <PasswordComplexity
            passwordComplexitySettings={passwordComplexitySettings}
            password={watchPassword}
            equals={!!watchPassword && watchPassword === watchConfirmPassword}
          />
        )}

        {error && <Alert>{error}</Alert>}

        <LandingFormActions sx={{ justifyContent: "space-between" }}>
          <BackButton data-testid="back-button" />
          <Button
            type="submit"
            variant={ButtonVariants.Primary}
            disabled={loading || !policyIsValid || !formState.isValid || watchPassword !== watchConfirmPassword}
            data-testid="submit-button"
          >
            {loading && <Spinner />} <Translated i18nKey="password.submit" namespace="register" />
          </Button>
        </LandingFormActions>
      </LandingFormPanel>
    </>
  );
}
