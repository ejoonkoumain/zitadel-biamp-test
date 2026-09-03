"use client";

import { Box } from "@mui/material";
import { forwardRef } from "react";
import { Translated } from "../translated";
import { BaseButton, SignInWithIdentityProviderProps } from "./base-button";

export const SignInWithAzureAd = forwardRef<HTMLButtonElement, SignInWithIdentityProviderProps>(
  function SignInWithAzureAd(props, ref) {
    const { children, name, ...restProps } = props;

    return (
      <BaseButton {...restProps} ref={ref}>
        <Box sx={{ display: "flex", height: 48, width: 48, alignItems: "center", justifyContent: "center", p: "10px" }}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="21"
            height="21"
            viewBox="0 0 21 21"
            style={{ height: "100%", width: "100%" }}
          >
            <path fill="#f25022" d="M1 1H10V10H1z"></path>
            <path fill="#00a4ef" d="M1 11H10V20H1z"></path>
            <path fill="#7fba00" d="M11 1H20V10H11z"></path>
            <path fill="#ffb900" d="M11 11H20V20H11z"></path>
          </svg>
        </Box>
        {children ? (
          children
        ) : (
          <Box component="span" sx={{ ml: 2 }}>
            {name ? name : <Translated i18nKey="signInWithAzureAD" namespace="idp" />}
          </Box>
        )}
      </BaseButton>
    );
  },
);
