"use client";

import { CheckCircleIcon } from "@heroicons/react/24/solid";
import { InputAdornment, TextField } from "@mui/material";
import { ChangeEvent, DetailedHTMLProps, forwardRef, InputHTMLAttributes, ReactNode } from "react";

export type TextInputProps = DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> & {
  label: string;
  suffix?: string;
  placeholder?: string;
  defaultValue?: string;
  error?: string | ReactNode;
  success?: string | ReactNode;
  disabled?: boolean;
  onChange?: (value: ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (value: ChangeEvent<HTMLInputElement>) => void;
};

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      label,
      placeholder,
      defaultValue,
      suffix,
      required = false,
      error,
      disabled,
      success,
      onChange,
      onBlur,
      ...props
    },
    ref,
  ) => {
    // Split presentation props off so everything else — including data-* —
    // can be routed to the <input> rather than the TextField root.
    const { className, style, ...inputProps } = props;

    // Reserve the helper-text row even when there's nothing to show, so the
    // layout doesn't jump when an error/success message appears (matches the
    // old fixed-height error row).
    const helperText = error ? (
      error
    ) : success ? (
      <>
        <CheckCircleIcon
          aria-hidden="true"
          style={{ width: "1em", height: "1em", verticalAlign: "text-bottom", marginRight: 4 }}
        />
        {success}
      </>
    ) : (
      " "
    );

    return (
      <TextField
        fullWidth
        label={label}
        placeholder={placeholder}
        defaultValue={defaultValue}
        required={required}
        disabled={disabled}
        error={Boolean(error)}
        helperText={helperText}
        onChange={onChange}
        onBlur={onBlur}
        inputRef={ref}
        className={className}
        style={style}
        slotProps={{
          htmlInput: { ...inputProps, autoComplete: props.autoComplete ?? "off" },
          input: suffix
            ? { endAdornment: <InputAdornment position="end">{`@${suffix}`}</InputAdornment> }
            : undefined,
          formHelperText:
            success && !error
              ? { sx: { color: "success.main", display: "flex", alignItems: "center" } }
              : undefined,
        }}
      />
    );
  },
);

TextInput.displayName = "TextInput";
