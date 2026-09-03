"use client";

import { Box } from "@mui/material";
import { forwardRef } from "react";
import { BaseButton, SignInWithIdentityProviderProps } from "./base-button";

export const SignInWithGeneric = forwardRef<HTMLButtonElement, SignInWithIdentityProviderProps>(
  function SignInWithGeneric(props, ref) {
    const { children, name = "", ...restProps } = props;
    return (
      <BaseButton {...restProps} ref={ref}>
        {children ? (
          children
        ) : (
          <Box component="span" sx={{ width: "100%", textAlign: "center" }}>
            {name}
          </Box>
        )}
      </BaseButton>
    );
  },
);
