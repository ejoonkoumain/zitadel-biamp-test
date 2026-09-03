import { LandingShell } from "@/components/bwp/landing-shell";
import { LanguageSwitcher } from "@/components/language-switcher";
import { RegisterFormIDPIncomplete } from "@/components/register-form-idp-incomplete";
import ThemeSwitch from "@/components/theme-switch";
import { Translated } from "@/components/translated";

/**
 * Complete registration page - shown when manual user registration is required
 */
export default async function CompleteRegistrationPage(props: {
  searchParams: Promise<Record<string | number | symbol, string | undefined>>;
  params: Promise<{ provider: string }>;
}) {
  const searchParams = await props.searchParams;
  const { id, token, requestId, organization, idpId, idpUserId, idpUserName, givenName, familyName, email } = searchParams;

  if (!id || !token || !idpId || !organization || !idpUserId) {
    throw new Error("Missing required parameters");
  }

  return (
    <LandingShell
      actions={
        <>
          <LanguageSwitcher />
          <ThemeSwitch />
        </>
      }
      title={<Translated i18nKey="completeRegister.title" namespace="idp" />}
      subtitle={<Translated i18nKey="completeRegister.description" namespace="idp" />}
    >
      <RegisterFormIDPIncomplete
        idpUserId={idpUserId}
        idpId={idpId}
        idpUserName={idpUserName}
        defaultValues={{
          email: email || "",
          firstname: givenName || "",
          lastname: familyName || "",
        }}
        requestId={requestId}
        organization={organization}
        idpIntent={{
          idpIntentId: id,
          idpIntentToken: token,
        }}
      />
    </LandingShell>
  );
}
