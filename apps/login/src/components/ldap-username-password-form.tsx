"use client";

import { createNewSessionForLDAP } from "@/lib/server/idp";
import { LandingFormActions, LandingFormField, LandingFormPanel } from "@bwp-web/components";
import { Box } from "@mui/material";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Alert } from "./alert";
import { BackButton } from "./back-button";
import { Button, ButtonVariants } from "./button";
import { Spinner } from "./spinner";
import { Translated } from "./translated";

type Inputs = {
  loginName: string;
  password: string;
};

type Props = {
  idpId: string;
  link: boolean;
  requestId?: string;
  organization?: string;
  postErrorRedirectUrl?: string;
  linkToSessionId?: string;
  linkFingerprint?: string;
};

export function LDAPUsernamePasswordForm({
  idpId,
  link,
  requestId,
  organization,
  postErrorRedirectUrl,
  linkToSessionId,
  linkFingerprint,
}: Props) {
  const { register, handleSubmit, formState } = useForm<Inputs>({
    mode: "onChange",
  });

  const t = useTranslations("ldap");

  const [error, setError] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);

  const router = useRouter();

  async function submitUsernamePassword(values: Inputs) {
    setError("");
    setLoading(true);

    const response = await createNewSessionForLDAP({
      idpId: idpId,
      username: values.loginName,
      password: values.password,
      link: link,
      requestId,
      organization,
      postErrorRedirectUrl,
      linkToSessionId,
      linkFingerprint,
    })
      .catch(() => {
        setError("Could not start LDAP flow");
        return;
      })
      .finally(() => {
        setLoading(false);
      });

    if (response && "error" in response && response.error) {
      setError(response.error);
      return;
    }

    if (response && "redirect" in response && response.redirect) {
      return router.push(response.redirect);
    }
  }

  const { ref: loginNameRef, ...loginNameField } = register("loginName", { required: t("required.username") });
  const { ref: passwordRef, ...passwordField } = register("password", { required: t("required.password") });

  return (
    <LandingFormPanel onSubmit={handleSubmit(submitUsernamePassword)}>
      <LandingFormField
        label={t("labels.username")}
        type="text"
        autoComplete="username"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        autoFocus
        {...loginNameField}
        inputRef={loginNameRef}
        slotProps={{ htmlInput: { "data-testid": "username-text-input" } }}
      />

      <LandingFormField
        label={t("labels.password")}
        type="password"
        autoComplete="password"
        {...passwordField}
        inputRef={passwordRef}
        slotProps={{ htmlInput: { "data-testid": "password-text-input" } }}
      />

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
          {loading && <Spinner />} <Translated i18nKey="submit" namespace="ldap" />
        </Button>
      </LandingFormActions>
    </LandingFormPanel>
  );
}
