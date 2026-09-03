"use client";

import { handleServerActionResponse } from "@/lib/client-utils";
import { registerUser } from "@/lib/server/register";
import { LandingFormActions, LandingFormField, LandingFormPanel } from "@bwp-web/components";
import { Box, Stack, Typography } from "@mui/material";
import { LegalAndSupportSettings } from "@zitadel/proto/zitadel/settings/v2/legal_settings_pb";
import { LoginSettings, PasskeysType } from "@zitadel/proto/zitadel/settings/v2/login_settings_pb";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FieldValues, useForm } from "react-hook-form";
import { Alert, AlertType } from "./alert";
import { AuthenticationMethod, AuthenticationMethodRadio, methods } from "./authentication-method-radio";
import { AutoSubmitForm } from "./auto-submit-form";
import { BackButton } from "./back-button";
import { Button, ButtonVariants } from "./button";
import { PrivacyPolicyCheckboxes } from "./privacy-policy-checkboxes";
import { Spinner } from "./spinner";
import { Translated } from "./translated";

type Inputs =
  | {
      firstname: string;
      lastname: string;
      email: string;
    }
  | FieldValues;

type Props = {
  legal: LegalAndSupportSettings;
  firstname?: string;
  lastname?: string;
  email?: string;
  organization: string;
  requestId?: string;
  loginSettings?: LoginSettings;
  idpCount: number;
};

export function RegisterForm({
  legal,
  email,
  firstname,
  lastname,
  organization,
  requestId,
  loginSettings,
  idpCount = 0,
}: Props) {
  const { register, handleSubmit, formState } = useForm<Inputs>({
    mode: "onChange",
    defaultValues: {
      email: email ?? "",
      firstname: firstname ?? "",
      lastname: lastname ?? "",
    },
  });

  const t = useTranslations("register");

  const [loading, setLoading] = useState<boolean>(false);
  const [selected, setSelected] = useState<AuthenticationMethod>(methods[0]);
  const [error, setError] = useState<string>("");
  const [samlData, setSamlData] = useState<{ url: string; fields: Record<string, string> } | null>(null);

  const router = useRouter();

  async function submitAndRegister(values: Inputs) {
    setLoading(true);
    try {
      const response = await registerUser({
        email: values.email,
        firstName: values.firstname,
        lastName: values.lastname,
        organization: organization,
        requestId: requestId,
      });

      handleServerActionResponse(response, router, setSamlData, setError);

      return response;
    } catch {
      setError(t("errors.couldNotRegisterUser"));
    } finally {
      setLoading(false);
    }
  }

  async function submitAndContinue(value: Inputs, withPassword: boolean = false) {
    const registerParams: any = value;

    if (organization) {
      registerParams.organization = organization;
    }

    if (requestId) {
      registerParams.requestId = requestId;
    }

    // redirect user to /register/password if password is chosen
    if (withPassword) {
      return router.push(`/register/password?` + new URLSearchParams(registerParams));
    } else {
      return submitAndRegister(value);
    }
  }

  const { errors } = formState;

  const [tosAndPolicyAccepted, setTosAndPolicyAccepted] = useState(false);

  // Check if legal acceptance is required
  const isLegalAcceptanceRequired = !!(legal?.tosLink || legal?.privacyPolicyLink);
  const canSubmit = formState.isValid && (!isLegalAcceptanceRequired || tosAndPolicyAccepted);

  // LandingFormField spreads onto MUI TextField, whose `ref` targets the root
  // div — not the <input>. Registering the whole field would hand RHF that
  // div's ref, so formState.isValid would never flip true and the submit
  // button would stay permanently disabled. Split the ref out and hand it to
  // TextField's `inputRef` instead, which does target the <input> (see
  // username-form.tsx / password-form.tsx for the same pattern).
  const { ref: firstnameRef, ...firstnameField } = register("firstname", { required: t("required.firstname") });
  const { ref: lastnameRef, ...lastnameField } = register("lastname", { required: t("required.lastname") });
  const { ref: emailRef, ...emailField } = register("email", { required: t("required.email") });

  return (
    <>
      {samlData && <AutoSubmitForm url={samlData.url} fields={samlData.fields} />}
      <LandingFormPanel
        onSubmit={handleSubmit((values) => {
          const usePasswordToContinue: boolean =
            loginSettings?.allowLocalAuthentication && loginSettings?.passkeysType == PasskeysType.ALLOWED
              ? !(selected === methods[0]) // choose selection if both available
              : !!loginSettings?.allowLocalAuthentication; // if password is chosen
          // set password as default if only password is allowed
          return submitAndContinue(values, usePasswordToContinue);
        })}
      >
        <Stack direction="row" gap={2}>
          <Box flex={1}>
            <LandingFormField
              type="firstname"
              autoComplete="firstname"
              autoFocus
              required
              {...firstnameField}
              inputRef={firstnameRef}
              label={t("labels.firstname")}
              error={Boolean(errors.firstname)}
              helperText={(errors.firstname?.message as string) || " "}
              slotProps={{ htmlInput: { "data-testid": "firstname-text-input" } }}
            />
          </Box>
          <Box flex={1}>
            <LandingFormField
              type="lastname"
              autoComplete="lastname"
              required
              {...lastnameField}
              inputRef={lastnameRef}
              label={t("labels.lastname")}
              error={Boolean(errors.lastname)}
              helperText={(errors.lastname?.message as string) || " "}
              slotProps={{ htmlInput: { "data-testid": "lastname-text-input" } }}
            />
          </Box>
        </Stack>
        <LandingFormField
          type="email"
          autoComplete="email"
          required
          {...emailField}
          inputRef={emailRef}
          label={t("labels.email")}
          error={Boolean(errors.email)}
          helperText={(errors.email?.message as string) || " "}
          slotProps={{ htmlInput: { "data-testid": "email-text-input" } }}
        />

        {(legal?.tosLink || legal?.privacyPolicyLink) && (
          <PrivacyPolicyCheckboxes legal={legal} onChange={setTosAndPolicyAccepted} />
        )}
        {/* show chooser if both methods are allowed */}
        {loginSettings && loginSettings.allowLocalAuthentication && loginSettings.passkeysType == PasskeysType.ALLOWED && (
          <>
            <Typography variant="body2" textAlign="left">
              <Translated i18nKey="selectMethod" namespace="register" />
            </Typography>

            <AuthenticationMethodRadio selected={selected} selectionChanged={setSelected} />
          </>
        )}
        {!loginSettings?.allowLocalAuthentication &&
          loginSettings?.passkeysType !== PasskeysType.ALLOWED &&
          (!loginSettings?.allowExternalIdp || !idpCount) && (
            <Alert type={AlertType.INFO}>
              <Translated i18nKey="noMethodAvailableWarning" namespace="register" />
            </Alert>
          )}

        {error && <Alert>{error}</Alert>}

        <LandingFormActions sx={{ justifyContent: "space-between" }}>
          <BackButton data-testid="back-button" />
          <Button
            type="submit"
            variant={ButtonVariants.Primary}
            disabled={loading || !canSubmit}
            data-testid="submit-button"
          >
            {loading && <Spinner />} <Translated i18nKey="submit" namespace="register" />
          </Button>
        </LandingFormActions>
      </LandingFormPanel>
    </>
  );
}
