import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Box, Table, TableBody, TableRow, TableCell } from "@mui/material";
import { LinkTooltipState } from "./topologyTypes";
 
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
 
interface LinkTooltipProps {
  tooltip: LinkTooltipState | null;
}
 
const LinkTooltip: React.FC<LinkTooltipProps> = ({ tooltip }) => {
  //  hooks ALWAYS run in same order
  const tipRef = useRef<HTMLDivElement | null>(null);
 
  // measured size (default)
  const [size, setSize] = useState({ w: 300, h: 200 });
 
  // safe fallback x/y even when tooltip null
  const rawX = tooltip?.x ?? 0;
  const rawY = tooltip?.y ?? 0;
 
  //  measure tooltip only when it exists
  useLayoutEffect(() => {
    if (!tooltip) return; // allowed: condition INSIDE hook is fine
 
    const el = tipRef.current;
    if (!el) return;
 
    const r = el.getBoundingClientRect();
    setSize({
      w: Math.max(1, r.width),
      h: Math.max(1, r.height),
    });
  }, [tooltip?.link]);
 
  //  compute safe position always (even if tooltip null)
  const { safeX, safeY } = useMemo(() => {
    const pad = 12;
 
    // viewport
    const vw = window.innerWidth;
    const vh = window.innerHeight;
 
    const maxX = vw - size.w - pad;
    const maxY = vh - size.h - pad;
 
    return {
      safeX: clamp(rawX, pad, Math.max(pad, maxX)),
      safeY: clamp(rawY, pad, Math.max(pad, maxY)),
    };
  }, [rawX, rawY, size.w, size.h]);
 
  //  return null AFTER hooks
  if (!tooltip) return null;
 
  const { link } = tooltip;
 
  return (
    <Box
      ref={tipRef}
      sx={{
        position: "fixed",
        top: safeY,
        left: safeX,
 
        bgcolor: "#ffffff",
        color: "#1a1a1a",
        borderRadius: "8px",
        boxShadow: "0px 4px 10px rgba(0,0,0,0.3)",
        border: "1px solid #1a1a1a",
 
        p: 1.5,
        minWidth: 250,
        maxWidth: 520,
        fontSize: 12,
        zIndex: 2000,
 
        // hover should stay on link
        pointerEvents: "none",
 
        // if too big, keep inside and scroll
        maxHeight: "70vh",
        overflowY: "auto",
      }}
    >
      <Table size="small">
        <TableBody>
          <TableRow>
            <TableCell sx={{ fontWeight: 600, border: 0, width: 140 }}>
              Link Name
            </TableCell>
            <TableCell sx={{ border: 0 }}>{link.linkName}</TableCell>
          </TableRow>
 
          <TableRow>
            <TableCell sx={{ fontWeight: 600, border: 0 }}>Alarm</TableCell>
            <TableCell sx={{ border: 0, whiteSpace: "normal", wordBreak: "break-word" }}>
              {link.desc}
            </TableCell>
          </TableRow>
 
          <TableRow>
            <TableCell sx={{ fontWeight: 600, border: 0 }}>Time</TableCell>
            <TableCell sx={{ border: 0 }}>
              Severity: {link.severity}
              <br />
              alarm received on {link.recTime}
              <br />
              alarm cleared on {link.clearTime}
            </TableCell>
          </TableRow>
 
          <TableRow>
            <TableCell sx={{ fontWeight: 600, border: 0 }}>Span Loss (dB)</TableCell>
            <TableCell sx={{ border: 0 }}>
              Tx: {link.spanLossTx} &nbsp; Rx: {link.spanLossRx}
            </TableCell>
          </TableRow>
 
          <TableRow>
            <TableCell sx={{ fontWeight: 600, border: 0 }}>Fiber Distance (Km)</TableCell>
            <TableCell sx={{ border: 0 }}>{link.fiberDistance}</TableCell>
          </TableRow>
 
          <TableRow>
            <TableCell sx={{ fontWeight: 600, border: 0 }}>Design Loss (dB)</TableCell>
            <TableCell sx={{ border: 0 }}>{link.designLoss}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Box>
  );
};
 
export default LinkTooltip;
 
 