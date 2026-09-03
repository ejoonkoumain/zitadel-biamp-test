"use client";

import { processIDPCallback } from "@/lib/server/idp-intent";
import { Box, Stack, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Alert } from "./alert";
import { AutoSubmitForm } from "./auto-submit-form";
import { Spinner } from "./spinner";

type Props = {
  provider: string;
  id: string;
  token: string;
  requestId?: string;
  organization?: string;
  link?: string;
  sessionId?: string;
  linkFingerprint?: string;
  postErrorRedirectUrl?: string;
};

/**
 * Client component that handles IDP callback processing.
 * Must be client-side to allow cookie modifications via server actions.
 */
export function IdpProcessHandler({
  provider,
  id,
  token,
  requestId,
  organization,
  link,
  sessionId,
  linkFingerprint,
  postErrorRedirectUrl,
}: Props) {
  const t = useTranslations("idp");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [samlData, setSamlData] = useState<{ url: string; fields: Record<string, string> } | null>(null);
  const executedRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    // Prevent double execution in React Strict Mode
    if (executedRef.current) {
      return;
    }

    executedRef.current = true;

    console.log("[IDP Process Handler] Starting IDP callback processing from client");

    processIDPCallback({
      provider,
      id,
      token,
      requestId,
      organization,
      sessionId,
      linkFingerprint,
      postErrorRedirectUrl,
    })
      .then((result) => {
        if (result.error) {
          console.error("[IDP Process Handler] Error:", result.error);
          setError(result.error);
          setLoading(false);
          return;
        }

        if (result.redirect) {
          console.log("[IDP Process Handler] Redirecting to:", result.redirect);
          router.push(result.redirect);
          return;
        }

        if (result.samlData) {
          console.log("[IDP Process Handler] Received samlData, rendering AutoSubmitForm");
          setSamlData(result.samlData);
          setLoading(false);
          return;
        }

        setError(t("processing.noRedirect"));
        setLoading(false);
      })
      .catch((err) => {
        console.error("[IDP Process Handler] Unexpected error:", err);
        setError(err instanceof Error ? err.message : t("processing.unexpectedError"));
        setLoading(false);
      });
  }, [provider, id, token, requestId, organization, link, sessionId, linkFingerprint, postErrorRedirectUrl, router, t]);

  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      {samlData && <AutoSubmitForm url={samlData.url} fields={samlData.fields} />}
      {loading && (
        <Stack alignItems="center" gap={2}>
          {/* Spinner.tsx's shared color="inherit" tracks a button label's
              colour for the 16 in-button call sites, but this is the one
              standalone usage — nothing ambient to inherit from. Pin it to
              the brand colour explicitly rather than letting it fall back to
              plain body text. */}
          <Box sx={{ color: "primary.main" }}>
            <Spinner />
          </Box>
          <Typography variant="body2" color="text.secondary">
            {t("processing.message")}
          </Typography>
        </Stack>
      )}
      {error && (
        <Box sx={{ maxWidth: 448, py: 2 }}>
          <Alert>{error}</Alert>
        </Box>
      )}
    </Box>
  );
}
