import { Stack, Typography } from "@mui/material";
import { LoginSettings, PasskeysType } from "@zitadel/proto/zitadel/settings/v2/login_settings_pb";
import { AuthenticationMethodType } from "@zitadel/proto/zitadel/user/v2/user_service_pb";
import { PASSKEYS, PASSWORD } from "./auth-methods";
import { Translated } from "./translated";

type Props = {
  authMethods: AuthenticationMethodType[];
  params: URLSearchParams;
  loginSettings: LoginSettings | undefined;
};

export function ChooseAuthenticatorToLogin({ authMethods, params, loginSettings }: Props) {
  return (
    <>
      {authMethods.includes(AuthenticationMethodType.PASSWORD) && loginSettings?.allowLocalAuthentication && (
        <Typography variant="body2" color="text.secondary">
          <Translated i18nKey="chooseAlternativeMethod" namespace="idp" />
        </Typography>
      )}
      <Stack width="100%" gap={2.5} pt={2}>
        {authMethods.includes(AuthenticationMethodType.PASSWORD) &&
          loginSettings?.allowLocalAuthentication &&
          PASSWORD(false, "/password?" + params)}
        {authMethods.includes(AuthenticationMethodType.PASSKEY) &&
          loginSettings?.allowLocalAuthentication &&
          loginSettings?.passkeysType == PasskeysType.ALLOWED &&
          PASSKEYS(false, "/passkey?" + params)}
      </Stack>
    </>
  );
}
