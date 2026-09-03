import { FormControlLabel, Checkbox as MuiCheckbox } from "@mui/material";
import { DetailedHTMLProps, forwardRef, InputHTMLAttributes, useEffect, useState } from "react";

export type CheckboxProps = DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> & {
  checked: boolean;
  disabled?: boolean;
  onChangeVal?: (checked: boolean) => void;
};

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { className, checked = false, disabled = false, onChangeVal, children, ...props },
  ref,
) {
  // Local state mirroring the prop is existing behaviour that
  // privacy-policy-checkboxes.tsx depends on — keep it.
  const [enabled, setEnabled] = useState<boolean>(checked);

  useEffect(() => {
    setEnabled(checked);
  }, [checked]);

  return (
    <FormControlLabel
      className={className}
      label={children}
      control={
        <MuiCheckbox
          inputRef={ref}
          checked={enabled}
          disabled={disabled}
          onChange={(event) => {
            setEnabled(event.target.checked);
            onChangeVal?.(event.target.checked);
          }}
          slotProps={{ input: { ...props } }}
        />
      }
    />
  );
});
