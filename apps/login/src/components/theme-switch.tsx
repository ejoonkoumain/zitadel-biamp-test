"use client";

import { ComputerDesktopIcon, MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import { IconButton, Stack } from "@mui/material";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const OPTIONS = [
  { value: "light", label: "Switch to light mode", Icon: SunIcon },
  { value: "system", label: "Switch to system mode", Icon: ComputerDesktopIcon },
  { value: "dark", label: "Switch to dark mode", Icon: MoonIcon },
] as const;

/**
 * Rendered directly on `LandingShell`'s fixed dark background image (via its
 * `actions` prop, in the footer) — not inside a panel. Colours are therefore
 * mode-independent literals (`common.white` / `text.secondary`), not
 * `text.primary`, which flips to near-black in light mode and would
 * disappear here.
 *
 * Dark mode itself is owned entirely by next-themes (`setTheme` below) —
 * this never reaches for MUI's `useColorScheme`.
 */
export default function ThemeSwitch() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Stack direction="row" gap={0.5} sx={{ p: 0.5, borderRadius: 2, bgcolor: "rgba(255, 255, 255, 0.08)" }}>
      {OPTIONS.map(({ value, label, Icon }) => {
        const selected = theme === value;
        return (
          <IconButton
            key={value}
            variant="none"
            size="small"
            aria-label={label}
            onClick={() => setTheme(value)}
            sx={{
              color: selected ? "common.white" : "text.secondary",
              bgcolor: selected ? "rgba(255, 255, 255, 0.16)" : "transparent",
              "&:hover": { color: "common.white", bgcolor: "rgba(255, 255, 255, 0.16)" },
            }}
          >
            <Icon style={{ width: 20, height: 20 }} />
          </IconButton>
        );
      })}
    </Stack>
  );
}
