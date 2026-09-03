import { LandingShell } from "@/components/bwp/landing-shell";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LDAPUsernamePasswordForm } from "@/components/ldap-username-password-form";
import ThemeSwitch from "@/components/theme-switch";
import { Translated } from "@/components/translated";

export default async function Page(props: {
  searchParams: Promise<Record<string | number | symbol, string | undefined>>;
  params: Promise<{ provider: string }>;
}) {
  const searchParams = await props.searchParams;
  const { idpId, organization, link, requestId, postErrorRedirectUrl, linkToSessionId, linkFingerprint } = searchParams;

  if (!idpId) {
    throw new Error("No idpId provided in searchParams");
  }

  // return login failed if no linking or creation is allowed and no user was found
  return (
    <LandingShell
      actions={
        <>
          <LanguageSwitcher />
          <ThemeSwitch />
        </>
      }
      title={<Translated i18nKey="title" namespace="ldap" />}
      subtitle={<Translated i18nKey="description" namespace="ldap" />}
    >
      <LDAPUsernamePasswordForm
        idpId={idpId}
        link={link === "true"}
        requestId={requestId}
        organization={organization}
        postErrorRedirectUrl={postErrorRedirectUrl}
        linkToSessionId={linkToSessionId}
        linkFingerprint={linkFingerprint}
      />
    </LandingShell>
  );
}
