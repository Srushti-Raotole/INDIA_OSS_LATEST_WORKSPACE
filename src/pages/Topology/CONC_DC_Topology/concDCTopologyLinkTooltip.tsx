import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Box, Table, TableBody, TableCell, TableRow } from "@mui/material";
import type { TooltipState } from "./concDCTopologyTypes";
 
type Props = { tooltip: TooltipState };
 
const safe = (v: any) => (v === null || v === undefined || v === "" ? "NA" : String(v));
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
 
const ConcDCTopologyLinkTooltip: React.FC<Props> = ({ tooltip }) => {
  // hooks always run
  const tipRef = useRef<HTMLDivElement | null>(null);
 
  //  measured size fallback
  const [size, setSize] = useState({ w: 520, h: 240 });
 
  //  x/y safe even when closed (avoid TS union error)
  const rawX = tooltip.open ? tooltip.x : 0;
  const rawY = tooltip.open ? tooltip.y : 0;
 
  //  measure real tooltip size when open + link changes
  useLayoutEffect(() => {
    if (!tooltip.open) return;
 
    const el = tipRef.current;
    if (!el) return;
 
    const r = el.getBoundingClientRect();
    setSize({
      w: Math.max(1, r.width),
      h: Math.max(1, r.height),
    });
  }, [tooltip.open, tooltip.open ? tooltip.link : null]);
 
  //  clamp based on real size (smooth, never goes below)
  const { left, top } = useMemo(() => {
    const pad = 10;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
 
    const maxX = vw - size.w - pad;
    const maxY = vh - size.h - pad;
 
    return {
      left: clamp(rawX, pad, Math.max(pad, maxX)),
      top: clamp(rawY, pad, Math.max(pad, maxY)),
    };
  }, [rawX, rawY, size.w, size.h]);
 
  //  return null AFTER hooks
  if (!tooltip.open) return null;
 
  const { link } = tooltip;
 
  return (
    <Box
      ref={tipRef}
      sx={{
        position: "fixed",
        top,
        left,
        bgcolor: "#ffffff",
        color: "#1a1a1a",
        borderRadius: "8px",
        boxShadow: "0px 4px 10px rgba(0,0,0,0.3)",
        border: "1px solid #1a1a1a",
        p: 1.2,
        minWidth: 260,
        maxWidth: 520,
        fontSize: 12,
        zIndex: 9999,
        pointerEvents: "none",
 
        //  if content becomes big, keep inside & scroll
        maxHeight: "70vh",
        overflowY: "auto",
      }}
    >
      <Table size="small">
        <TableBody>
          <TableRow>
            <TableCell sx={{ fontWeight: 700, border: 0, width: 130 }}>Link Name</TableCell>
            <TableCell sx={{ border: 0 }}>{safe(link.linkName)}</TableCell>
          </TableRow>
 
          <TableRow>
            <TableCell sx={{ fontWeight: 700, border: 0 }}>Alarm</TableCell>
            <TableCell
              sx={{
                border: 0,
                whiteSpace: "normal",
                wordBreak: "break-word",
                maxWidth: 360,
              }}
            >
              {safe(link.desc)}
            </TableCell>
          </TableRow>
 
          <TableRow>
            <TableCell sx={{ fontWeight: 700, border: 0 }}>Time</TableCell>
            <TableCell sx={{ border: 0 }}>
              <b>Severity:</b> {safe(link.severity)}
              <br />
              alarm received on {safe(link.recTime)}
              <br />
              alarm cleared on {safe(link.clearTime)}
            </TableCell>
          </TableRow>
 
          <TableRow>
            <TableCell sx={{ fontWeight: 700, border: 0 }}>Span Name</TableCell>
            <TableCell sx={{ border: 0 }}>{safe(link.subnet)}</TableCell>
          </TableRow>
 
          <TableRow>
            <TableCell sx={{ fontWeight: 700, border: 0 }}>Span Loss (dB)</TableCell>
            <TableCell sx={{ border: 0 }}>
              Tx: {safe(link.spanLossTx)} &nbsp; Rx: {safe(link.spanLossRx)}
            </TableCell>
          </TableRow>
 
          <TableRow>
            <TableCell sx={{ fontWeight: 700, border: 0 }}>Fiber Distance (Km)</TableCell>
            <TableCell sx={{ border: 0 }}>{safe(link.fiberDistance)}</TableCell>
          </TableRow>
 
          <TableRow>
            <TableCell sx={{ fontWeight: 700, border: 0 }}>Design Loss (dB)</TableCell>
            <TableCell sx={{ border: 0 }}>{safe(link.designLoss)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Box>
  );
};
 
export default ConcDCTopologyLinkTooltip;