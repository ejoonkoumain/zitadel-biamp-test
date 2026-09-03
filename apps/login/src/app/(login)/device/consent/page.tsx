import { Alert } from "@/components/alert";
import { LandingShell } from "@/components/bwp/landing-shell";
import { ConsentScreen } from "@/components/consent";
import { LanguageSwitcher } from "@/components/language-switcher";
import ThemeSwitch from "@/components/theme-switch";
import { Translated } from "@/components/translated";
import { getServiceConfig } from "@/lib/service-url";
import { getDeviceAuthorizationRequest } from "@/lib/zitadel";
import { headers } from "next/headers";

export default async function Page(props: { searchParams: Promise<Record<string | number | symbol, string | undefined>> }) {
  const searchParams = await props.searchParams;

  const userCode = searchParams?.user_code;
  const requestId = searchParams?.requestId;
  const organization = searchParams?.organization;

  if (!userCode || !requestId) {
    return (
      <LandingShell
        actions={
          <>
            <LanguageSwitcher />
            <ThemeSwitch />
          </>
        }
      >
        <Alert>
          <Translated i18nKey="noUserCode" namespace="error" />
        </Alert>
      </LandingShell>
    );
  }

  const _headers = await headers();
  const { serviceConfig } = getServiceConfig(_headers);

  const { deviceAuthorizationRequest } = await getDeviceAuthorizationRequest({ serviceConfig, userCode });

  if (!deviceAuthorizationRequest) {
    return (
      <LandingShell
        actions={
          <>
            <LanguageSwitcher />
            <ThemeSwitch />
          </>
        }
      >
        <Alert>
          <Translated i18nKey="noDeviceRequest" namespace="error" />
        </Alert>
      </LandingShell>
    );
  }

  const params = new URLSearchParams();

  if (requestId) {
    params.append("requestId", requestId);
  }

  if (organization) {
    params.append("organization", organization);
  }

  return (
    <LandingShell
      actions={
        <>
          <LanguageSwitcher />
          <ThemeSwitch />
        </>
      }
      title={
        <Translated i18nKey="request.title" namespace="device" data={{ appName: deviceAuthorizationRequest?.appName }} />
      }
      subtitle={
        <Translated
          i18nKey="request.description"
          namespace="device"
          data={{ appName: deviceAuthorizationRequest?.appName }}
        />
      }
    >
      <ConsentScreen
        deviceAuthorizationRequestId={deviceAuthorizationRequest?.id}
        scope={deviceAuthorizationRequest.scope}
        appName={deviceAuthorizationRequest?.appName}
        nextUrl={`/loginname?` + params}
      />
    </LandingShell>
  );
}
