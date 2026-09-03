"use client";

import { idpTypeToSlug } from "@/lib/idp";
import { redirectToIdp } from "@/lib/server/idp";
import { Box, Stack, Typography } from "@mui/material";
import { IdentityProvider, IdentityProviderType } from "@zitadel/proto/zitadel/settings/v2/login_settings_pb";
import { ReactNode, useActionState } from "react";
import { Alert } from "./alert";
import { AutoSubmitForm } from "./auto-submit-form";
import { SignInWithIdentityProviderProps } from "./idps/base-button";
import { SignInWithApple } from "./idps/sign-in-with-apple";
import { SignInWithAzureAd } from "./idps/sign-in-with-azure-ad";
import { SignInWithGeneric } from "./idps/sign-in-with-generic";
import { SignInWithGithub } from "./idps/sign-in-with-github";
import { SignInWithGitlab } from "./idps/sign-in-with-gitlab";
import { SignInWithGoogle } from "./idps/sign-in-with-google";
import { SignInWithZitadel } from "./idps/sign-in-with-zitadel";
import { Translated } from "./translated";

export interface SignInWithIDPProps {
  children?: ReactNode;
  identityProviders: IdentityProvider[];
  requestId?: string;
  organization?: string;
  sessionId?: string;
  postErrorRedirectUrl?: string;
  showLabel?: boolean;
}

export function SignInWithIdp({
  identityProviders,
  requestId,
  organization,
  sessionId,
  postErrorRedirectUrl,
  showLabel = true,
}: Readonly<SignInWithIDPProps>) {
  const [state, action, _isPending] = useActionState(redirectToIdp, {});

  const renderIDPButton = (idp: IdentityProvider, index: number) => {
    const { id, name, type } = idp;

    const components: Partial<Record<IdentityProviderType, (props: SignInWithIdentityProviderProps) => ReactNode>> = {
      [IdentityProviderType.APPLE]: SignInWithApple,
      [IdentityProviderType.OAUTH]: SignInWithGeneric,
      [IdentityProviderType.OIDC]: SignInWithGeneric,
      [IdentityProviderType.GITHUB]: SignInWithGithub,
      [IdentityProviderType.GITHUB_ES]: SignInWithGithub,
      [IdentityProviderType.AZURE_AD]: SignInWithAzureAd,
      [IdentityProviderType.GOOGLE]: (props) => <SignInWithGoogle {...props} e2e="google" />,
      [IdentityProviderType.GITLAB]: SignInWithGitlab,
      [IdentityProviderType.GITLAB_SELF_HOSTED]: SignInWithGitlab,
      [IdentityProviderType.SAML]: SignInWithGeneric,
      [IdentityProviderType.LDAP]: SignInWithGeneric,
      [IdentityProviderType.JWT]: SignInWithGeneric,
      [IdentityProviderType.ZITADEL]: SignInWithZitadel,
    };

    const Component = components[type];
    return Component ? (
      <Box component="form" action={action} key={`idp-${index}`} sx={{ display: "flex" }}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="provider" value={idpTypeToSlug(type)} />
        <input type="hidden" name="requestId" value={requestId} />
        <input type="hidden" name="organization" value={organization} />
        {sessionId && <input type="hidden" name="sessionId" value={sessionId} />}
        {postErrorRedirectUrl && <input type="hidden" name="postErrorRedirectUrl" value={postErrorRedirectUrl} />}
        <Component key={id} name={name} />
      </Box>
    ) : null;
  };

  return (
    <Stack width="100%" gap={1}>
      {state?.samlData && <AutoSubmitForm url={state.samlData.url} fields={state.samlData.fields} />}
      {showLabel && (
        // Explicit text.secondary, not the default inherited colour: this
        // renders directly on LandingShell's fixed dark background (not a
        // white panel), and text.secondary is the one text token that stays
        // legible in both light and dark mode (see mfa/page.tsx's identical
        // choice for ChooseAuthenticatorToLogin's equivalent label). The
        // default body colour flips to near-black in light mode and
        // disappears against that background.
        <Typography variant="body2" color="text.secondary" textAlign="center">
          <Translated i18nKey="orSignInWith" namespace="idp" />
        </Typography>
      )}
      {!!identityProviders?.length && identityProviders?.map(renderIDPButton)}
      {state?.error && (
        <Box py={2}>
          <Alert>{state?.error}</Alert>
        </Box>
      )}
    </Stack>
  );
}

SignInWithIdp.displayName = "SignInWithIDP";
