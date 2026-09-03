"use client";

import { setLanguageCookie } from "@/lib/cookies";
import { MenuItem, Select, SelectChangeEvent } from "@mui/material";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useLanguages } from "./languages-provider";

/**
 * Rendered directly on `LandingShell`'s fixed dark background image (via its
 * `actions` prop, in the footer) — not inside a panel. Colours are therefore
 * mode-independent literals (`common.white`), not `text.primary`, which
 * flips to near-black in light mode and would disappear here. See
 * `sign-in-with-idp.tsx`'s identical reasoning for its "or sign in with" label.
 */
export function LanguageSwitcher() {
  const languages = useLanguages();
  const currentLocale = useLocale();
  const router = useRouter();

  const selectedCode = languages.find((l) => l.code === currentLocale)?.code ?? languages[0]?.code ?? "";

  const handleChange = async (event: SelectChangeEvent) => {
    const newLocale = event.target.value;
    await setLanguageCookie(newLocale);
    router.refresh();
  };

  if (!languages.length) {
    return null;
  }

  return (
    <Select
      value={selectedCode}
      onChange={handleChange}
      size="small"
      variant="outlined"
      aria-label="Language"
      sx={{
        minWidth: 112,
        color: "common.white",
        fontSize: 14,
        // `backgroundColor: transparent` is load-bearing. biampTheme fills an
        // outlined input's root with `background.paper` — white in light mode —
        // which against this component's `common.white` text rendered the
        // switcher as a blank white box with the language name invisible
        // inside it. Confirmed by computed style: text rgb(255,255,255) on root
        // rgb(255,255,255). The switcher sits on LandingShell's dark background
        // image, so it must stay unfilled for the white text to read.
        backgroundColor: "transparent",
        "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255, 255, 255, 0.3)" },
        "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255, 255, 255, 0.5)" },
        "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "common.white" },
        "& .MuiSvgIcon-root": { color: "common.white" },
      }}
    >
      {languages.map((lang) => (
        <MenuItem key={lang.code} value={lang.code}>
          {lang.name}
        </MenuItem>
      ))}
    </Select>
  );
}
