import { Alert } from "@/components/alert";
import { BackButton } from "@/components/back-button";
import { Button, ButtonVariants } from "@/components/button";
import { LandingShell } from "@/components/bwp/landing-shell";
import { LanguageSwitcher } from "@/components/language-switcher";
import ThemeSwitch from "@/components/theme-switch";
import { TotpRegister } from "@/components/totp-register";
import { Translated } from "@/components/translated";
import { UserAvatar } from "@/components/user-avatar";
import { getEnrollmentAuthorizationError } from "@/lib/server/enrollment-guard";
import { getServiceConfig } from "@/lib/service-url";
import { loadMostRecentSession } from "@/lib/session";
import { addOTPEmail, addOTPSMS, getLoginSettings, registerTOTP } from "@/lib/zitadel";
import { Stack } from "@mui/material";
import { RegisterTOTPResponse } from "@zitadel/proto/zitadel/user/v2/user_service_pb";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function Page(props: {
  searchParams: Promise<Record<string | number | symbol, string | undefined>>;
  params: Promise<Record<string | number | symbol, string | undefined>>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;

  const { loginName, organization, sessionId, requestId, checkAfter } = searchParams;
  const { method } = params;

  const _headers = await headers();
  const { serviceConfig } = getServiceConfig(_headers);

  const loginSettings = await getLoginSettings({ serviceConfig, organization });

  const session = await loadMostRecentSession({
    serviceConfig,
    sessionParams: {
      loginName,
      organization,
    },
  });

  let totpResponse: RegisterTOTPResponse | undefined, error: Error | undefined;
  if (session && session.factors?.user?.id) {
    // Enrollment must be authorized: a bare identify-only session must not be able to
    // attach a new OTP/TOTP factor to the account (GHSA-45f2-5q3r-xgg6).
    const enrollmentError = await getEnrollmentAuthorizationError({
      serviceConfig,
      session,
      userId: session.factors.user.id,
    });
    if (enrollmentError) {
      error = new Error(enrollmentError);
    } else if (method === "time-based") {
      await registerTOTP({ serviceConfig, userId: session.factors.user.id })
        .then((resp) => {
          if (resp) {
            totpResponse = resp;
          }
        })
        .catch((err) => {
          error = err;
        });
    } else if (method === "sms") {
      await addOTPSMS({ serviceConfig, userId: session.factors.user.id }).catch((_error) => {
        // TODO: Throw this error?
        new Error("Could not add OTP via SMS");
      });
    } else if (method === "email") {
      await addOTPEmail({ serviceConfig, userId: session.factors.user.id }).catch((_error) => {
        // TODO: Throw this error?
        new Error("Could not add OTP via Email");
      });
    } else {
      throw new Error("Invalid method");
    }
  } else {
    throw new Error("No session found");
  }

  const paramsToContinue = new URLSearchParams({});
  let urlToContinue = "/accounts";

  if (sessionId) {
    paramsToContinue.append("sessionId", sessionId);
  }
  if (loginName) {
    paramsToContinue.append("loginName", loginName);
  }
  if (organization) {
    paramsToContinue.append("organization", organization);
  }

  if (checkAfter) {
    if (requestId) {
      paramsToContinue.append("requestId", requestId);
    }
    urlToContinue = `/otp/${method}?` + paramsToContinue;

    // immediately check the OTP on the next page if sms or email was set up
    if (method && ["email", "sms"].includes(method)) {
      return redirect(urlToContinue);
    }
  } else if (requestId && sessionId) {
    if (requestId) {
      paramsToContinue.append("authRequest", requestId);
    }
    urlToContinue = `/login?` + paramsToContinue;
  } else if (loginName) {
    if (requestId) {
      paramsToContinue.append("requestId", requestId);
    }
    urlToContinue = `/signedin?` + paramsToContinue;
  }

  return (
    <LandingShell
      actions={
        <>
          <LanguageSwitcher />
          <ThemeSwitch />
        </>
      }
      title={<Translated i18nKey="set.title" namespace="otp" />}
      subtitle={
        totpResponse && "uri" in totpResponse && "secret" in totpResponse ? (
          <Translated i18nKey="set.totpRegisterDescription" namespace="otp" />
        ) : method === "email" ? (
          "Code via email was successfully added."
        ) : method === "sms" ? (
          "Code via SMS was successfully added."
        ) : (
          ""
        )
      }
    >
      {!session && (
        <Alert>
          <Translated i18nKey="unknownContext" namespace="error" />
        </Alert>
      )}

      {error && <Alert>{error?.message}</Alert>}

      {session && (
        <UserAvatar
          loginName={loginName ?? session.factors?.user?.loginName}
          displayName={session.factors?.user?.displayName}
          showDropdown
          searchParams={searchParams}
        />
      )}

      {totpResponse && "uri" in totpResponse && "secret" in totpResponse ? (
        <TotpRegister
          uri={totpResponse.uri as string}
          secret={totpResponse.secret as string}
          loginName={loginName}
          sessionId={sessionId}
          requestId={requestId}
          organization={organization}
          checkAfter={checkAfter === "true"}
          loginSettings={loginSettings}
        />
      ) : (
        <Stack direction="row" alignItems="center" width="100%" justifyContent="space-between" mt={4}>
          <BackButton />
          <Link href={urlToContinue}>
            <Button type="submit" variant={ButtonVariants.Primary}>
              <Translated i18nKey="set.submit" namespace="otp" />
            </Button>
          </Link>
        </Stack>
      )}
    </LandingShell>
  );
}
