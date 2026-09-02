"use client";

import { getColorHash } from "@/helpers/colors";
import MuiAvatar from "@mui/material/Avatar";

interface AvatarProps {
  name: string | null | undefined;
  loginName: string;
  imageUrl?: string;
  size?: "small" | "base" | "large";
  shadow?: boolean;
}

export function getInitials(name: string, loginName: string) {
  if (name) {
    const split = name.split(" ");
    return split[0].charAt(0) + (split[1] ? split[1].charAt(0) : "");
  }

  const username = loginName.split("@")[0];
  let separator = "_";
  if (username.includes("-")) {
    separator = "-";
  }
  if (username.includes(".")) {
    separator = ".";
  }
  const split = username.split(separator);
  return split[0].charAt(0) + (split[1] ? split[1].charAt(0) : "");
}

const SIZE_PX: Record<NonNullable<AvatarProps["size"]>, number> = {
  small: 32,
  base: 38,
  large: 80,
};

export function Avatar({ size = "base", name, loginName, imageUrl, shadow }: AvatarProps) {
  const credentials = getInitials(name ?? loginName, loginName);
  const dimension = SIZE_PX[size];
  // Per-user colour so multiple accounts with the same initials (e.g. two
  // "JD"s in the account picker) remain visually distinguishable. Only
  // matters for the initials case — an image needs no background colour.
  const color = getColorHash(loginName);

  return (
    <MuiAvatar
      src={imageUrl}
      alt="avatar"
      sx={(theme) => ({
        width: dimension,
        height: dimension,
        fontSize: size === "large" ? "1.25rem" : "0.8125rem",
        fontWeight: size === "large" ? 400 : 700,
        textTransform: "uppercase",
        boxShadow: shadow ? 1 : "none",
        ...(!imageUrl && {
          bgcolor: color[200],
          color: color[900],
          ...theme.applyStyles("dark", {
            bgcolor: color[900],
            color: color[200],
          }),
        }),
      })}
    >
      {credentials}
    </MuiAvatar>
  );
}
