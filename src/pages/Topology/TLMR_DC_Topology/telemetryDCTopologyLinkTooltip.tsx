import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Box, Table, TableBody, TableCell, TableRow } from "@mui/material";
import type { TelemetryLinkTooltipState } from "./telemetryTopologyTypes";
 
type Props = { tooltip: TelemetryLinkTooltipState };
 
const safe = (v: any) => (v === null || v === undefined || v === "" ? "NA" : String(v));
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
 
const TelemetryDCTopologyLinkTooltip: React.FC<Props> = ({ tooltip }) => {
  // always create ref & state (hooks order fixed)
  const tipRef = useRef<HTMLDivElement | null>(null);
 
  // measured size (fallback)
  const [size, setSize] = useState({ w: 520, h: 260 });
 
  // safe fallback x/y even if closed
//   const rawX = tooltip?.x ?? 0;
//   const rawY = tooltip?.y ?? 0;
const rawX = tooltip.open ? tooltip.x : 0;
const rawY = tooltip.open ? tooltip.y : 0;
 
 
  //  measure real tooltip size whenever link changes & tooltip is open
  useLayoutEffect(() => {
    if (!tooltip.open) return;
 
    const el = tipRef.current;
    if (!el) return;
 
    const r = el.getBoundingClientRect();
    setSize({
      w: Math.max(1, r.width),
      h: Math.max(1, r.height),
    });
//   }, [tooltip.open, tooltip.link]);
}, [tooltip.open, tooltip.open ? tooltip.link : null]);
 
 
  // compute safe position based on measured size (smooth like first tooltip)
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
 
  //  return null AFTER hooks (same pattern)
  if (!tooltip.open) return null;
 
  const { link, nodesByNo } = tooltip;
  const oriNode = nodesByNo.get(link.oriNodeNumber);
  const terNode = nodesByNo.get(link.terNodeNumber);
 
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
        p: 1.2,
        minWidth: 260,
        maxWidth: 520,
        fontSize: 12,
        zIndex: 9999,
        border: "1px solid #1a1a1a",
        pointerEvents: "none",
        maxHeight: "70vh",
        overflowY: "auto",
      }}
    >
      <Table size="small">
        <TableBody>
          <TableRow>
            <TableCell sx={{ fontWeight: 700, border: 0, width: 150 }}>Link Name</TableCell>
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
              {safe(link.description)}
            </TableCell>
          </TableRow>
 
          <TableRow>
            <TableCell sx={{ fontWeight: 700, border: 0 }}>Time</TableCell>
            <TableCell sx={{ border: 0 }}>
              <b>Severity:</b> {safe(link.trapSeverity)}
              <br />
              alarm received on {safe(link.rcvdTime)}
              <br />
              alarm cleared on {safe(link.clearTime)}
            </TableCell>
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
 
          <TableRow>
            <TableCell sx={{ fontWeight: 700, border: 0 }}>Port</TableCell>
            <TableCell sx={{ border: 0 }}>
              A-End: {safe(oriNode?.portName)}
              <br />
              Z-End: {safe(terNode?.portName)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Box>
  );
};
 
export default TelemetryDCTopologyLinkTooltip;