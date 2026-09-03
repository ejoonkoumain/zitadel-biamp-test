import { LandingShell } from "@/components/bwp/landing-shell";
import { LanguageSwitcher } from "@/components/language-switcher";
import ThemeSwitch from "@/components/theme-switch";
import { Translated } from "@/components/translated";

export default async function Page(props: { searchParams: Promise<any> }) {
  // Nothing in this page's copy depends on searchParams; kept for route-signature
  // parity with the other `/logout` pages (and in case a future change needs it).
  await props.searchParams;

  return (
    <LandingShell
      actions={
        <>
          <LanguageSwitcher />
          <ThemeSwitch />
        </>
      }
      title={<Translated i18nKey="success.title" namespace="logout" />}
      subtitle={<Translated i18nKey="success.description" namespace="logout" />}
    >
      {null}
    </LandingShell>
  );
}
