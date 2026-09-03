"use client";
import { resolveLocalizedLegalLink } from "@/lib/legal-links";
import { Box, Link as MuiLink, Stack, Typography } from "@mui/material";
import { LegalAndSupportSettings } from "@zitadel/proto/zitadel/settings/v2/legal_settings_pb";
import { useLocale } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { Checkbox } from "./checkbox";
import { Translated } from "./translated";

type Props = {
  legal: LegalAndSupportSettings;
  onChange: (allAccepted: boolean) => void;
};

type AcceptanceState = {
  tosAccepted: boolean;
  privacyPolicyAccepted: boolean;
};

export function PrivacyPolicyCheckboxes({ legal, onChange }: Props) {
  const locale = useLocale();
  const [acceptanceState, setAcceptanceState] = useState<AcceptanceState>({
    tosAccepted: false,
    privacyPolicyAccepted: false,
  });
  const helpLink = resolveLocalizedLegalLink(legal?.helpLink, locale);
  const tosLink = resolveLocalizedLegalLink(legal?.tosLink, locale);
  const privacyPolicyLink = resolveLocalizedLegalLink(legal?.privacyPolicyLink, locale);

  // Helper function to check if all required checkboxes are accepted
  const checkAllAccepted = (newState: AcceptanceState) => {
    const hasTosLink = !!tosLink;
    const hasPrivacyLink = !!privacyPolicyLink;

    // Check that all required checkboxes are accepted
    return (!hasTosLink || newState.tosAccepted) && (!hasPrivacyLink || newState.privacyPolicyAccepted);
  };

  return (
    <>
      <Stack direction="row" alignItems="center" gap={0.5}>
        <Typography variant="body2" color="text.secondary">
          <Translated i18nKey="agreeTo" namespace="register" />
        </Typography>
        {helpLink && (
          <Link href={helpLink} target="_blank" aria-label="Open help in a new tab" data-testid="help-link">
            <Box
              component="svg"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              sx={{ width: 20, height: 20, color: "text.secondary" }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
              />
            </Box>
          </Link>
        )}
      </Stack>
      {tosLink && (
        // Spacing between the checkbox control and its adjacent label text is
        // expressed via this Stack's `gap`, not a className on the Checkbox:
        // `checkbox.tsx` renders the checkbox inside a MUI `FormControlLabel`,
        // so a `className` on it lands on the whole label row (control + its
        // own empty label), not between the control and this sibling text.
        <Stack direction="row" alignItems="center" gap={2}>
          <Checkbox
            checked={acceptanceState.tosAccepted}
            value={"tos"}
            onChangeVal={(checked: boolean) => {
              const newState = {
                ...acceptanceState,
                tosAccepted: checked,
              };
              setAcceptanceState(newState);
              onChange(checkAllAccepted(newState));
            }}
            data-testid="tos-checkbox"
          />

          <Box flex={1} minWidth={0}>
            <MuiLink
              component={Link}
              href={tosLink}
              target="_blank"
              underline="always"
              variant="body2"
              data-testid="tos-link"
            >
              <Translated i18nKey="termsOfService" namespace="register" />
            </MuiLink>
          </Box>
        </Stack>
      )}
      {privacyPolicyLink && (
        <Stack direction="row" alignItems="center" gap={2}>
          <Checkbox
            checked={acceptanceState.privacyPolicyAccepted}
            value={"privacypolicy"}
            onChangeVal={(checked: boolean) => {
              const newState = {
                ...acceptanceState,
                privacyPolicyAccepted: checked,
              };
              setAcceptanceState(newState);
              onChange(checkAllAccepted(newState));
            }}
            data-testid="privacy-policy-checkbox"
          />

          <Box flex={1} minWidth={0}>
            <MuiLink
              component={Link}
              href={privacyPolicyLink}
              target="_blank"
              underline="always"
              variant="body2"
              data-testid="privacy-policy-link"
            >
              <Translated i18nKey="privacyPolicy" namespace="register" />
            </MuiLink>
          </Box>
        </Stack>
      )}
    </>
  );
}
