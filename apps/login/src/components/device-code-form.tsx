"use client";

import { Alert } from "@/components/alert";
import { getDeviceAuthorizationRequest } from "@/lib/server/oidc";
import { Box, Stack } from "@mui/material";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { BackButton } from "./back-button";
import { Button, ButtonVariants } from "./button";
import { TextInput } from "./input";
import { Spinner } from "./spinner";
import { Translated } from "./translated";

type Inputs = {
  userCode: string;
};

export function DeviceCodeForm({ userCode }: { userCode?: string }) {
  const router = useRouter();

  const { register, handleSubmit, formState } = useForm<Inputs>({
    mode: "onChange",
    defaultValues: {
      userCode: userCode || "",
    },
  });

  const t = useTranslations("device");

  const [error, setError] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);

  async function submitCodeAndContinue(value: Inputs): Promise<boolean | void> {
    setLoading(true);

    const response = await getDeviceAuthorizationRequest(value.userCode)
      .catch(() => {
        setError("Could not continue the request");
        return;
      })
      .finally(() => {
        setLoading(false);
      });

    if (!response || !response.deviceAuthorizationRequest?.id) {
      setError("Could not continue the request");
      return;
    }

    return router.push(
      `/device/consent?` +
        new URLSearchParams({
          requestId: `device_${response.deviceAuthorizationRequest.id}`,
          user_code: value.userCode,
        }).toString(),
    );
  }

  return (
    <Box component="form" width="100%">
      <Box mt={2}>
        <TextInput
          type="text"
          autoComplete="one-time-code"
          autoFocus
          {...register("userCode", { required: t("usercode.required.code") })}
          label={t("usercode.labels.code")}
          data-testid="code-text-input"
        />
      </Box>

      {error && (
        <Box py={2} data-testid="error">
          <Alert>{error}</Alert>
        </Box>
      )}

      <Stack direction="row" alignItems="center" width="100%" mt={4}>
        <BackButton />
        <Box flexGrow={1} />
        <Button
          type="submit"
          variant={ButtonVariants.Primary}
          disabled={loading || !formState.isValid}
          onClick={handleSubmit(submitCodeAndContinue)}
          data-testid="submit-button"
        >
          {loading && <Spinner />} <Translated i18nKey="usercode.submit" namespace="device" />
        </Button>
      </Stack>
    </Box>
  );
}
