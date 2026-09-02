"use client";

import { handleServerActionResponse } from "@/lib/client-utils";
import { sendLoginname } from "@/lib/server/loginname";
import { SquareRoundedArrowRightFilledIcon } from "@bwp-web/assets";
import { LandingFormField, LandingFormPanel } from "@bwp-web/components";
import { Box, CircularProgress, IconButton, InputAdornment, Link as MuiLink, Stack } from "@mui/material";
import { LoginSettings } from "@zitadel/proto/zitadel/settings/v2/login_settings_pb";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Alert } from "./alert";
import { AutoSubmitForm } from "./auto-submit-form";
import { BackButton } from "./back-button";
import { Translated } from "./translated";

type Inputs = {
  loginName: string;
};

type Props = {
  loginName: string | undefined;
  requestId: string | undefined;
  loginSettings: LoginSettings | undefined;
  organization?: string;
  defaultOrganization?: string;
  suffix?: string;
  submit: boolean;
  allowRegister: boolean;
};

export function UsernameForm({
  loginName,
  requestId,
  organization,
  defaultOrganization,
  suffix,
  loginSettings,
  submit,
  allowRegister,
}: Props) {
  const { register, handleSubmit, formState } = useForm<Inputs>({
    mode: "onChange",
    defaultValues: {
      loginName: loginName ? loginName : "",
    },
  });

  const t = useTranslations("loginname");

  const router = useRouter();

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [samlData, setSamlData] = useState<{ url: string; fields: Record<string, string> } | null>(null);

  const submitLoginName = useCallback(
    async (values: Inputs, organization?: string) => {
      setLoading(true);

      try {
        const res = await sendLoginname({
          loginName: values.loginName,
          organization,
          defaultOrganization,
          requestId,
          suffix,
        });

        handleServerActionResponse(res, router, setSamlData, setError);
        return res;
      } catch {
        setError(t("errors.internalError"));
      } finally {
        setLoading(false);
      }
    },
    [defaultOrganization, requestId, suffix, router, t],
  );

  useEffect(() => {
    if (submit && loginName) {
      // When we navigate to this page, we always want to be redirected if submit is true and the parameters are valid.
      submitLoginName({ loginName }, organization);
    }
  }, [submit, loginName, organization, submitLoginName]);

  let inputLabel = t("labels.loginname");
  if (loginSettings?.disableLoginWithEmail && loginSettings?.disableLoginWithPhone) {
    inputLabel = t("labels.username");
  } else if (loginSettings?.disableLoginWithEmail) {
    inputLabel = t("labels.usernameOrPhoneNumber");
  } else if (loginSettings?.disableLoginWithPhone) {
    inputLabel = t("labels.usernameOrEmail");
  }

  const { ref: loginNameRef, ...loginNameField } = register("loginName", {
    required: t("required.loginName"),
  });

  return (
    <>
      {samlData && <AutoSubmitForm url={samlData.url} fields={samlData.fields} />}
      <LandingFormPanel onSubmit={handleSubmit((e) => submitLoginName(e, organization))} sx={{ borderRadius: 2 }}>
        <LandingFormField
          label={inputLabel}
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoFocus
          {...loginNameField}
          inputRef={loginNameRef}
          // The theme turns adornment icons text.primary while a field is
          // focused, which blacks out the blue submit arrow for the whole flow.
          // `inherit` hands the colour back to the IconButton.
          sx={{ "& .MuiOutlinedInput-root.Mui-focused .MuiInputAdornment-root svg": { color: "inherit" } }}
          slotProps={{
            htmlInput: { "data-testid": "username-text-input" },
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    type="submit"
                    variant="none"
                    size="medium"
                    aria-label={t("submit")}
                    data-testid="submit-button"
                    disabled={loading || !formState.isValid}
                    sx={{ color: "info.main", "&.Mui-disabled": { color: "action.disabled" } }}
                  >
                    {loading ? <CircularProgress size={20} /> : <SquareRoundedArrowRightFilledIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />

        {error && (
          <Box data-testid="error">
            <Alert>{error}</Alert>
          </Box>
        )}

        <Stack direction="row" alignItems="center" gap={1}>
          <BackButton data-testid="back-button" />
          <Box flexGrow={1} />
          {allowRegister && (
            <MuiLink
              component="button"
              type="button"
              variant="body2"
              data-testid="register-button"
              disabled={loading}
              onClick={() => {
                const registerParams = new URLSearchParams();
                if (organization) {
                  registerParams.append("organization", organization);
                }
                if (requestId) {
                  registerParams.append("requestId", requestId);
                }
                router.push("/register?" + registerParams);
              }}
            >
              <Translated i18nKey="register" namespace="loginname" />
            </MuiLink>
          )}
        </Stack>
      </LandingFormPanel>
    </>
  );
}
