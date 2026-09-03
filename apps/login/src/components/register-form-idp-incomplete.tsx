"use client";

import { handleServerActionResponse } from "@/lib/client-utils";
import { registerUserAndLinkToIDP } from "@/lib/server/register";
import { Box, Stack } from "@mui/material";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FieldValues, useForm } from "react-hook-form";
import { Alert } from "./alert";
import { AutoSubmitForm } from "./auto-submit-form";
import { BackButton } from "./back-button";
import { Button, ButtonVariants } from "./button";
import { TextInput } from "./input";
import { Spinner } from "./spinner";
import { Translated } from "./translated";

type Inputs =
  | {
      firstname: string;
      lastname: string;
      email: string;
      username?: string;
    }
  | FieldValues;

type Props = {
  organization: string;
  requestId?: string;
  idpIntent: {
    idpIntentId: string;
    idpIntentToken: string;
  };
  defaultValues?: {
    firstname?: string;
    lastname?: string;
    email?: string;
  };
  idpUserId: string;
  idpId: string;
  idpUserName?: string;
};

export function RegisterFormIDPIncomplete({
  organization,
  requestId,
  idpIntent,
  defaultValues,
  idpUserId,
  idpId,
  idpUserName,
}: Props) {
  const { register, handleSubmit, formState } = useForm<Inputs>({
    mode: "onChange",
    defaultValues: {
      email: defaultValues?.email ?? "",
      firstname: defaultValues?.firstname ?? "",
      lastname: defaultValues?.lastname ?? "",
    },
  });

  const t = useTranslations("register");
  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [samlData, setSamlData] = useState<{ url: string; fields: Record<string, string> } | null>(null);

  async function submitAndRegister(values: Inputs) {
    setLoading(true);
    try {
      const response = await registerUserAndLinkToIDP({
        idpId: idpId,
        idpUserName: idpUserName ? idpUserName : values.username,
        idpUserId: idpUserId,
        email: values.email,
        firstName: values.firstname,
        lastName: values.lastname,
        organization: organization,
        requestId: requestId,
        idpIntent: idpIntent,
      });

      handleServerActionResponse(response, router, setSamlData, setError);
    } catch {
      setError("Could not register user");
    } finally {
      setLoading(false);
    }
  }

  const { errors } = formState;

  return (
    <>
      {samlData && <AutoSubmitForm url={samlData.url} fields={samlData.fields} />}
      <Box component="form" width="100%">
        <Stack gap={2} mb={2}>
          {!idpUserName && (
            <TextInput
              type="text"
              autoComplete="username"
              autoFocus
              required
              {...register("username", { required: "Username is required" })}
              label="Username"
              error={errors.username?.message as string}
              data-testid="username-text-input"
            />
          )}
          <Stack direction="row" gap={2}>
            <TextInput
              type="firstname"
              autoComplete="firstname"
              autoFocus={!!idpUserName}
              required
              {...register("firstname", { required: t("required.firstname") })}
              label={t("labels.firstname")}
              error={errors.firstname?.message as string}
              data-testid="firstname-text-input"
            />
            <TextInput
              type="lastname"
              autoComplete="lastname"
              required
              {...register("lastname", { required: t("required.lastname") })}
              label={t("labels.lastname")}
              error={errors.lastname?.message as string}
              data-testid="lastname-text-input"
            />
          </Stack>
          <TextInput
            type="email"
            autoComplete="email"
            required
            {...register("email", { required: t("required.email") })}
            label={t("labels.email")}
            error={errors.email?.message as string}
            data-testid="email-text-input"
          />
        </Stack>

        {error && (
          <Box py={2}>
            <Alert>{error}</Alert>
          </Box>
        )}

        <Stack direction="row" width="100%" alignItems="center" justifyContent="space-between" mt={4}>
          <BackButton data-testid="back-button" />
          <Button
            type="submit"
            variant={ButtonVariants.Primary}
            disabled={loading || !formState.isValid}
            onClick={handleSubmit(submitAndRegister)}
            data-testid="submit-button"
          >
            {loading && <Spinner />} <Translated i18nKey="submit" namespace="register" />
          </Button>
        </Stack>
      </Box>
    </>
  );
}
