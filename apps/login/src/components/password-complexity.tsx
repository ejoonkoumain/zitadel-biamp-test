import { Translated } from "@/components/translated";
import { lowerCaseValidator, numberValidator, symbolValidator, upperCaseValidator } from "@/helpers/validators";
import { Box, Stack, Typography } from "@mui/material";
import { PasswordComplexitySettings } from "@zitadel/proto/zitadel/settings/v2/password_settings_pb";
import { useTranslations } from "next-intl";

type Props = {
  passwordComplexitySettings: PasswordComplexitySettings;
  password: string;
  equals: boolean;
};

// The icons use `stroke="currentColor"`, so wrapping them in a `Typography`
// with a palette `color` (instead of a Tailwind `text-*` class) recolors them
// via ordinary CSS color inheritance.
function CheckIcon({ title }: { title: string }) {
  return (
    <Typography component="span" color="success.main" sx={{ display: "inline-flex", flexShrink: 0 }}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        width={24}
        height={24}
        role="img"
      >
        <title>{title}</title>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
      </svg>
    </Typography>
  );
}

function CrossIcon({ title }: { title: string }) {
  return (
    <Typography component="span" color="error.main" sx={{ display: "inline-flex", flexShrink: 0 }}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        width={24}
        height={24}
        role="img"
      >
        <title>{title}</title>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </Typography>
  );
}

function renderIcon(matched: boolean, t: ReturnType<typeof useTranslations>) {
  return matched ? <CheckIcon title={t("complexity.matches")} /> : <CrossIcon title={t("complexity.doesNotMatch")} />;
}

export function PasswordComplexity({ passwordComplexitySettings, password, equals }: Props) {
  const t = useTranslations("password");
  const hasMinLength = password?.length >= passwordComplexitySettings.minLength;
  const hasSymbol = symbolValidator(password);
  const hasNumber = numberValidator(password);
  const hasUppercase = upperCaseValidator(password);
  const hasLowercase = lowerCaseValidator(password);

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", columnGap: 4, rowGap: 1, mb: 2 }}>
      {passwordComplexitySettings.minLength != undefined ? (
        <Stack direction="row" alignItems="center" gap={1} data-testid="length-check">
          {renderIcon(hasMinLength, t)}
          <Typography variant="body2" color="text.secondary">
            <Translated
              i18nKey="complexity.length"
              namespace="password"
              data={{ minLength: passwordComplexitySettings.minLength.toString() }}
            />
          </Typography>
        </Stack>
      ) : null}
      {passwordComplexitySettings.requiresSymbol && (
        <Stack direction="row" alignItems="center" gap={1} data-testid="symbol-check">
          {renderIcon(hasSymbol, t)}
          <Typography variant="body2" color="text.secondary">
            <Translated i18nKey="complexity.hasSymbol" namespace="password" />
          </Typography>
        </Stack>
      )}
      {passwordComplexitySettings.requiresNumber && (
        <Stack direction="row" alignItems="center" gap={1} data-testid="number-check">
          {renderIcon(hasNumber, t)}
          <Typography variant="body2" color="text.secondary">
            <Translated i18nKey="complexity.hasNumber" namespace="password" />
          </Typography>
        </Stack>
      )}
      {passwordComplexitySettings.requiresUppercase && (
        <Stack direction="row" alignItems="center" gap={1} data-testid="uppercase-check">
          {renderIcon(hasUppercase, t)}
          <Typography variant="body2" color="text.secondary">
            <Translated i18nKey="complexity.hasUppercase" namespace="password" />
          </Typography>
        </Stack>
      )}
      {passwordComplexitySettings.requiresLowercase && (
        <Stack direction="row" alignItems="center" gap={1} data-testid="lowercase-check">
          {renderIcon(hasLowercase, t)}
          <Typography variant="body2" color="text.secondary">
            <Translated i18nKey="complexity.hasLowercase" namespace="password" />
          </Typography>
        </Stack>
      )}
      <Stack direction="row" alignItems="center" gap={1} data-testid="equal-check">
        {renderIcon(equals, t)}
        <Typography variant="body2" color="text.secondary">
          <Translated i18nKey="complexity.equals" namespace="password" />
        </Typography>
      </Stack>
    </Box>
  );
}
