"use client";

import { Boundary } from "@/components/boundary";
import { Button } from "@/components/button";
import { Translated } from "@/components/translated";
import { Box, Stack, Typography } from "@mui/material";
import { useEffect } from "react";

export default function Error({ error, reset }: any) {
  useEffect(() => {
    console.log("logging error:", error);
  }, [error]);

  return (
    <Boundary labels={["Login Error"]} color="red">
      <Stack gap={2}>
        <Typography variant="body2" sx={{ color: "error.main" }}>
          <Box component="strong" sx={{ fontWeight: 700 }}>
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
  );
}
