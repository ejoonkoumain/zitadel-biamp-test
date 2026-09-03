"use client";

import { Stack } from "@mui/material";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button, ButtonVariants } from "./button";

type Props = {
  continueUrl: string;
};

export function VerifySuccessContinue({ continueUrl }: Props) {
  const router = useRouter();
  const t = useTranslations("verify");

  return (
    <Stack direction="row" alignItems="center" justifyContent="flex-end" width="100%" mt={4}>
      <Button
        type="button"
        variant={ButtonVariants.Primary}
        onClick={() => router.push(continueUrl)}
        data-testid="continue-button"
      >
        {t("successContinue")}
      </Button>
    </Stack>
  );
}
