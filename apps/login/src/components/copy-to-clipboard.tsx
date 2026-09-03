"use client";

import { ClipboardDocumentCheckIcon, ClipboardIcon } from "@heroicons/react/20/solid";
import { Box, IconButton } from "@mui/material";
import copy from "copy-to-clipboard";
import { useEffect, useState } from "react";

type Props = {
  value: string;
};

export function CopyToClipboard({ value }: Props) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      copy(value);
      const to = setTimeout(setCopied, 1000, false);
      return () => clearTimeout(to);
    }
  }, [copied, value]);

  return (
    <Box sx={{ display: "flex", flexDirection: "row", alignItems: "center", px: 1 }}>
      <IconButton
        id="tooltip-ctc"
        type="button"
        variant="none"
        size="small"
        sx={{ color: "info.main" }}
        onClick={() => setCopied(true)}
      >
        {!copied ? (
          <ClipboardIcon style={{ width: 20, height: 20 }} />
        ) : (
          <ClipboardDocumentCheckIcon style={{ width: 20, height: 20 }} />
        )}
      </IconButton>
    </Box>
  );
}
