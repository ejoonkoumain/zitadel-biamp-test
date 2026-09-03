"use client";

import { Boundary } from "@/components/boundary";
import { Button } from "@/components/button";
import { Providers } from "@/components/providers";
import { Translated } from "@/components/translated";
import { Box, Stack, Typography } from "@mui/material";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    // global-error must include html and body tags
    <html>
      <body>
        <Providers>
          <Boundary labels={["Login Error"]} color="red">
            <Stack gap={2}>
              <Typography variant="body2" sx={{ color: "error.main" }}>
                <Box component="span" sx={{ fontWeight: 700 }}>
                  Error:
                </Box>{" "}
                {error?.message}
              </Typography>
              <Box>
                <Button data-i18n-key="error.tryagain" onClick={() => reset()}>
                  <Translated i18nKey="tryagain" namespace="error" />
                </Button>
              </Box>
            </Stack>
          </Boundary>
        </Providers>
      </body>
    </html>
  );
}
