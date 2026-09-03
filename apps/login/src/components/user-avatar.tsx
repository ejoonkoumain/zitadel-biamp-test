import { Avatar } from "@/components/avatar";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { Box, Stack } from "@mui/material";
import Link from "next/link";

type Props = {
  loginName?: string;
  displayName?: string;
  showDropdown: boolean;
  searchParams?: Record<string | number | symbol, string | undefined>;
};

// Rendered as a direct child of `LandingShell` on every route that uses it
// (the shell's fixed dark background image, not a `Card`/`LandingFormPanel`),
// so text/icon colour uses the mode-independent `common.white` /
// `text.sidebar` tokens rather than `text.primary`, which flips to
// near-black in light mode and would disappear here.
export function UserAvatar({ loginName, displayName, showDropdown, searchParams }: Props) {
  const params = new URLSearchParams({});

  if (searchParams?.sessionId) {
    params.set("sessionId", searchParams.sessionId);
  }

  if (searchParams?.organization) {
    params.set("organization", searchParams.organization);
  }

  if (searchParams?.requestId) {
    params.set("requestId", searchParams.requestId);
  }

  if (searchParams?.loginName) {
    params.set("loginName", searchParams.loginName);
  }

  return (
    <Stack
      direction="row"
      alignItems="center"
      sx={{ height: "100%", border: 1, borderColor: "rgba(255, 255, 255, 0.2)", borderRadius: 999, p: "1px" }}
    >
      <Box>
        <Avatar size="small" name={displayName ?? loginName ?? ""} loginName={loginName ?? ""} />
      </Box>
      <Box
        component="span"
        sx={{
          fontSize: 14,
          ml: 2,
          maxWidth: 250,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          pr: 2,
          color: "text.sidebar",
        }}
      >
        {loginName}
      </Box>
      <Box flexGrow={1} />
      {showDropdown && (
        <Box
          component={Link}
          href={"/accounts?" + params}
          sx={{
            mr: 0.5,
            ml: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 0.5,
            borderRadius: 999,
            color: "text.sidebar",
            transition: "background-color 0.2s",
            "&:hover": { bgcolor: "rgba(255, 255, 255, 0.1)" },
          }}
        >
          <ChevronDownIcon style={{ width: 16, height: 16 }} />
        </Box>
      )}
    </Stack>
  );
}
