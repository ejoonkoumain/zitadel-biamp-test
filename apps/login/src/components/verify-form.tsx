"use client";

import { Alert, AlertType } from "@/components/alert";
import { handleServerActionResponse } from "@/lib/client-utils";
import { UNKNOWN_USER_ID } from "@/lib/constants";
import { resendVerification, sendVerification } from "@/lib/server/verify";
import { Box, Stack } from "@mui/material";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { AutoSubmitForm } from "./auto-submit-form";
import { BackButton } from "./back-button";
import { Button, ButtonVariants } from "./button";
import { TextInput } from "./input";
import { Spinner } from "./spinner";
import { Translated } from "./translated";

type Inputs = {
  code: string;
};

type Props = {
  userId: string;
  loginName?: string;
  organization?: string;
  code?: string;
  isInvite: boolean;
  requestId?: string;
  submit: boolean;
};

export function VerifyForm({ userId, loginName, organization, requestId, code, isInvite, submit }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const codeSent = searchParams.get("codeSent") === "true";

  const { register, handleSubmit, formState } = useForm<Inputs>({
    mode: "onChange",
    defaultValues: {
      code: code ?? "",
    },
  });

  const t = useTranslations("verify");

  const [error, setError] = useState<string>("");
  const [samlData, setSamlData] = useState<{ url: string; fields: Record<string, string> } | null>(null);

  const [loading, setLoading] = useState<boolean>(false);

  async function resendCode() {
    setError("");
    setLoading(true);

    // do not send code for dummy userid that is set to prevent user enumeration
    if (userId === UNKNOWN_USER_ID) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setLoading(false);
      return;
    }

    const response = await resendVerification({
      userId,
      isInvite: isInvite,
      requestId: requestId,
    })
      .catch(() => {
        setError(t("errors.couldNotResendEmail"));
        return;
      })
      .finally(() => {
        setLoading(false);
      });

    if (response && "error" in response && response?.error) {
      setError(response.error);
      return;
    }

    // Signal success via URL search param so the "code sent" alert is shown
    const params = new URLSearchParams(searchParams.toString());
    params.set("codeSent", "true");
    router.replace(`${pathname}?${params.toString()}`);

    return response;
  }

  const processedCode = useRef<string | undefined>(undefined);

  const fcn = useCallback(
    async function submitCodeAndContinue(value: Inputs): Promise<boolean | void> {
      setError("");
      setLoading(true);

      try {
        const response = await sendVerification({
          code: value.code,
          userId,
          isInvite: isInvite,
          loginName: loginName,
          organization: organization,
          requestId: requestId,
        });

        handleServerActionResponse(response, router, setSamlData, setError);
      } catch {
        setError(t("errors.couldNotVerifyUser"));
      } finally {
        setLoading(false);
      }
    },
    [isInvite, userId, loginName, organization, requestId, router, t],
  );

  useEffect(() => {
    if (submit && code && code !== processedCode.current) {
      processedCode.current = code;
      fcn({ code });
    }
  }, [submit, code, fcn]);

  return (
    <>
      {samlData && <AutoSubmitForm url={samlData.url} fields={samlData.fields} />}
      {codeSent && (
        <Box width="100%" py={2}>
          <Alert type={AlertType.INFO}>
            <Translated i18nKey="verify.codeSent" namespace="verify" />
          </Alert>
        </Box>
      )}
      <Box component="form" width="100%">
        <Alert type={AlertType.INFO}>
          <Stack direction="row" alignItems="center" width="100%">
            <Box component="span" sx={{ mr: "auto", flex: 1, textAlign: "left" }}>
              <Translated i18nKey="verify.noCodeReceived" namespace="verify" />
            </Box>
            <Box
              component="button"
              aria-label="Resend Code"
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
              <Translated i18nKey="verify.resendCode" namespace="verify" />
            </Box>
          </Stack>
        </Alert>
        <Box mt={2}>
          <TextInput
            type="text"
            autoComplete="one-time-code"
            autoFocus
            {...register("code", { required: t("verify.required.code") })}
            label={t("verify.labels.code")}
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
            onClick={handleSubmit(fcn)}
            data-testid="submit-button"
          >
            {loading && <Spinner />}
            <Translated i18nKey="verify.submit" namespace="verify" />
          </Button>
        </Stack>
      </Box>
    </>
  );
}
