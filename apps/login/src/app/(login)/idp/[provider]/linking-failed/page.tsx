import { LandingShell } from "@/components/bwp/landing-shell";
import { LanguageSwitcher } from "@/components/language-switcher";
import ThemeSwitch from "@/components/theme-switch";
import { Translated } from "@/components/translated";
import { Typography } from "@mui/material";

/**
 * Linking failed page - shown when IDP linking fails
 */
export default async function LinkingFailedPage(props: {
  searchParams: Promise<Record<string | number | symbol, string | undefined>>;
  params: Promise<{ provider: string }>;
}) {
  const searchParams = await props.searchParams;
  const { error } = searchParams;

  return (
    <LandingShell
      actions={
        <>
          <LanguageSwitcher />
          <ThemeSwitch />
        </>
      }
      title={<Translated i18nKey="title" namespace="idp" />}
      subtitle={<Translated i18nKey="errors.linkingFailed" namespace="idp" />}
    >
      {error && (
        <Typography variant="body2" color="error.main" textAlign="center">
          {error}
        </Typography>
      )}
    </LandingShell>
  );
}
