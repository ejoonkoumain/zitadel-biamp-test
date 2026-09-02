import { LandingShell } from "@/components/bwp/landing-shell";
import { SignInWithIdp } from "@/components/sign-in-with-idp";
import { Translated } from "@/components/translated";
import { UsernameForm } from "@/components/username-form";
import { getServiceConfig } from "@/lib/service-url";
import { getActiveIdentityProviders, getDefaultOrg, getLoginSettings } from "@/lib/zitadel";
import { Organization } from "@zitadel/proto/zitadel/org/v2/org_pb";
import { Box } from "@mui/material";
import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("loginname");
  return { title: t("title") };
}

export default async function Page(props: { searchParams: Promise<Record<string | number | symbol, string | undefined>> }) {
  const searchParams = await props.searchParams;

  const loginName = searchParams?.loginName;
  const requestId = searchParams?.requestId;
  const organization = searchParams?.organization;
  const orgDomain = searchParams?.orgDomain;
  const submit: boolean = searchParams?.submit === "true";

  const _headers = await headers();
  const { serviceConfig } = getServiceConfig(_headers);

  let defaultOrganization;
  if (!organization) {
    const org: Organization | null = await getDefaultOrg({ serviceConfig });
    if (org) {
      defaultOrganization = org.id;
    }
  }

  const loginSettings = await getLoginSettings({ serviceConfig, organization: organization ?? defaultOrganization });

  const identityProviders = await getActiveIdentityProviders({
    serviceConfig,
    orgId: organization ?? defaultOrganization,
  }).then((resp) => {
    return resp.identityProviders;
  });

  return (
    <LandingShell
      title={<Translated i18nKey="heroTitle" namespace="loginname" />}
      subtitle={<Translated i18nKey="heroSubtitle" namespace="loginname" />}
      helpText={<Translated i18nKey="helpText" namespace="loginname" />}
    >
      {loginSettings?.allowLocalAuthentication && (
        <UsernameForm
          loginName={loginName}
          requestId={requestId}
          organization={organization} // stick to "organization" as we still want to do user discovery based on the searchParams not the default organization, later the organization is determined by the found user
          defaultOrganization={defaultOrganization}
          loginSettings={loginSettings}
          suffix={orgDomain}
          submit={submit}
        />
      )}

      {loginSettings?.allowExternalIdp && !!identityProviders?.length && (
        <Box width="100%" maxWidth={441} pt={3} pb={2}>
          <SignInWithIdp
            identityProviders={identityProviders}
            requestId={requestId}
            organization={organization}
            postErrorRedirectUrl="/loginname"
            showLabel={loginSettings?.allowLocalAuthentication}
          />
        </Box>
      )}
    </LandingShell>
  );
}
