import { LandingShell } from "@/components/bwp/landing-shell";
import { LanguageSwitcher } from "@/components/language-switcher";
import { SetRegisterPasswordForm } from "@/components/set-register-password-form";
import ThemeSwitch from "@/components/theme-switch";
import { Translated } from "@/components/translated";
import { getServiceConfig } from "@/lib/service-url";
import { getDefaultOrg, getLegalAndSupportSettings, getLoginSettings, getPasswordComplexitySettings } from "@/lib/zitadel";
import { Organization } from "@zitadel/proto/zitadel/org/v2/org_pb";
import { headers } from "next/headers";

export default async function Page(props: { searchParams: Promise<Record<string | number | symbol, string | undefined>> }) {
  const searchParams = await props.searchParams;

  let { firstname, lastname, email, organization, requestId } = searchParams;

  const _headers = await headers();
  const { serviceConfig } = getServiceConfig(_headers);

  if (!organization) {
    const org: Organization | null = await getDefaultOrg({ serviceConfig });
    if (org) {
      organization = org.id;
    }
  }

  const missingData = !firstname || !lastname || !email || !organization;

  const legal = await getLegalAndSupportSettings({ serviceConfig, organization });
  const passwordComplexitySettings = await getPasswordComplexitySettings({ serviceConfig, organization });

  const loginSettings = await getLoginSettings({ serviceConfig, organization });

  return missingData ? (
    <LandingShell
      actions={
        <>
          <LanguageSwitcher />
          <ThemeSwitch />
        </>
      }
      title={<Translated i18nKey="missingdata.title" namespace="register" />}
      subtitle={<Translated i18nKey="missingdata.description" namespace="register" />}
    >
      <></>
    </LandingShell>
  ) : loginSettings?.allowRegister && loginSettings.allowLocalAuthentication ? (
    <LandingShell
      actions={
        <>
          <LanguageSwitcher />
          <ThemeSwitch />
        </>
      }
      title={<Translated i18nKey="password.title" namespace="register" />}
      subtitle={<Translated i18nKey="description" namespace="register" />}
    >
      {legal && passwordComplexitySettings && (
        <SetRegisterPasswordForm
          passwordComplexitySettings={passwordComplexitySettings}
          email={email}
          firstname={firstname}
          lastname={lastname}
          organization={organization as string} // organization is guaranteed to be a string here otherwise we would have returned earlier
          requestId={requestId}
        ></SetRegisterPasswordForm>
      )}
    </LandingShell>
  ) : (
    <LandingShell
      actions={
        <>
          <LanguageSwitcher />
          <ThemeSwitch />
        </>
      }
      title={<Translated i18nKey="disabled.title" namespace="register" />}
      subtitle={<Translated i18nKey="disabled.description" namespace="register" />}
    >
      <></>
    </LandingShell>
  );
}
