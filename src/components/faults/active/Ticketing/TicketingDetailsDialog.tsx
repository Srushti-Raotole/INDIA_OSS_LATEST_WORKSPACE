import React from "react";
import {
  Typography,
  Box,
  Paper,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import Grid from "@mui/material/Grid"; // Standard Project Stable MUI v5 Core Layout Engine Import
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ContentPasteGoIcon from '@mui/icons-material/ContentPasteGo';
import { DynamicTableRow } from "../../../../store/types";
import CommonDialog from "../../../common/CommonDialog.";

interface TrapDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  popUpDataRow: DynamicTableRow | null;
}

/* ---------- Clipboard Utilities ---------- */
const copyToClipboard = (text: string) => {
  if (!text) return;
  navigator.clipboard.writeText(text);
};

const copyAllTicketDetails = (row: DynamicTableRow | null) => {
  if (!row) return;
  const details = Object.entries(row)
    .filter(([key]) => !key.startsWith('__'))
    .map(([key, val]) => `${key}: ${val || '—'}`)
    .join('\n');
  navigator.clipboard.writeText(details);
};

/* ---------- Status Chip Component ---------- */
const StatusChip = (status?: string) => {
  const val = (status ?? "").toUpperCase();

  const config: Record<string, { color: string; label: string }> = {
    OPEN: { color: "#2563eb", label: "OPEN" },
    RESOLVED: { color: "#16a34a", label: "RESOLVED" },
    CLOSED: { color: "#16a34a", label: "CLOSED" },
    FAILED: { color: "#dc2626", label: "FAILED" },
  };

  const conf = config[val] ?? { color: "#64748b", label: val || "UNKNOWN" };

  return (
    <Chip
      label={conf.label}
      size="small"
      sx={{
        fontWeight: 700,
        fontSize: "0.62rem",
        backgroundColor: conf.color,
        color: "#fff",
        height: "18px",
        borderRadius: "4px"
      }}
    />
  );
};

/* ---------- Adapter Badge Component ---------- */
const AdapterBadge = (raw?: string) => {
  const val = (raw ?? "").trim().toUpperCase();

  const bg =
    val === "MCP" ? "#009688" :
    val === "NFMT" ? "#8283eb" :
    val === "EPNM" ? "#4CAF50" :
    val === "CONC" ? "#FF9800" :
    val === "ADVA" ? "#9C27B0" :
    val === "IFNR" ? "#3F51B5" :
    val === "TLMR" ? "#E91E63" : "#607D8B";

  return (
    <Chip
      label={val || "NA"}
      size="small"
      sx={{
        backgroundColor: bg,
        color: "#fff",
        fontWeight: 700,
        fontSize: "0.65rem",
        height: "18px",
        borderRadius: "4px"
      }}
    />
  );
};

/* ---------- Content Field Sub-Component ---------- */
const Field = ({ label, value, showCopy = false }: { label: string; value: any; showCopy?: boolean }) => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.2 }}>
    <Typography
      sx={{
        fontSize: "0.62rem",
        color: "#64748b",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.02em",
        lineHeight: 1.1
      }}
    >
      {label}
    </Typography>
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, minHeight: "18px" }}>
      <Typography
        sx={{
          fontSize: "0.78rem",
          fontWeight: 600,
          color: "#334155",
          wordBreak: "break-all",
          lineHeight: 1.2
        }}
      >
        {value || "—"}
      </Typography>
      {showCopy && value && (
        <Tooltip title="Copy">
          <IconButton
            size="small"
            onClick={() => copyToClipboard(value.toString())}
            sx={{ p: 0.1, color: "#94a3b8", "&:hover": { color: "#475569" } }}
          >
            <ContentCopyIcon sx={{ fontSize: 11 }} />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  </Box>
);

/* ---------- Main Component Window ---------- */
function TicketingDetailsDialog({
  open,
  onClose,
  popUpDataRow,
}: TrapDetailsDialogProps) {
  return (
    <CommonDialog 
      open={open} 
      onClose={onClose} 
      title={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: "#1e293b" }}>
            Ticket Details
          </Typography>
          <Tooltip title="Copy All Ticket Details">
            <IconButton size="small" onClick={() => copyAllTicketDetails(popUpDataRow)} sx={{ color: '#0f766e', p: 0.5 }}>
              <ContentPasteGoIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        </Box>
      } 
      maxWidth="md"
    >
      {popUpDataRow && (
        <Box sx={{ px: 2, py: 1.5, backgroundColor: "#ffffff" }}>

          {/* ----- SECTION 1: CORE TICKET METRICS MANAGEMENT ----- */}
          <Paper
            elevation={0}
            sx={{
              p: 1.5,
              mb: 2.5, // Increased spacing footprint for clean section division blocks
              backgroundColor: "#f8fafc",
              border: "1px solid #f1f5f9",
              borderRadius: 1.5,
            }}
          >
            <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.03em", mb: 1.5 }}>
              Ticket Information
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Field
                  label="Vegayan Ticket"
                  value={popUpDataRow["VegayanOSS Ticket"]}
                  showCopy
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Field
                  label="FreshService Ticket"
                  value={popUpDataRow["FS Ticket"]}
                  showCopy
                />
              </Grid>

              <Grid item xs={6} sm={3}>
                <Typography sx={{ fontSize: "0.62rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", mb: 0.4, lineHeight: 1.1 }}>
                  Status
                </Typography>
                {StatusChip(popUpDataRow["Ticket State"])}
              </Grid>

              <Grid item xs={6} sm={3}>
                <Typography sx={{ fontSize: "0.62rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", mb: 0.4, lineHeight: 1.1 }}>
                  Adapter
                </Typography>
                {AdapterBadge(popUpDataRow["Adapter"])}
              </Grid>
            </Grid>
          </Paper>

          {/* ----- SECTION 2: OPERATION TIMING CYCLE AUDITS ----- */}
          <Paper
            elevation={0}
            sx={{
              p: 1.5,
              mb: 2.5, // Expanded layout buffer area spacing
              backgroundColor: "#f8fafc",
              border: "1px solid #f1f5f9",
              borderRadius: 1.5,
            }}
          >
            <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.03em", mb: 1.5 }}>
              Ticket Timing
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Field
                  label="Created Time"
                  value={popUpDataRow["OSS Ticket Created Time"]}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <Field
                  label="Resolved Time"
                  value={popUpDataRow["OSS Ticket Resolution Time"]}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <Field
                  label="Last Modified"
                  value={popUpDataRow["Last Modify Date"]}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* ----- SECTION 3: SYSTEM FAILURES AUDITING PROFILE ----- */}
          <Paper
            elevation={0}
            sx={{
              p: 1.5,
              mb: 2.5, // Standardized component buffer padding metrics
              backgroundColor: "#f8fafc",
              border: "1px solid #f1f5f9",
              borderRadius: 1.5,
            }}
          >
            <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.03em", mb: 1.5 }}>
              System Information
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={3}>
                <Field label="Family" value={popUpDataRow["Family"]} />
              </Grid>

              <Grid item xs={12} sm={4}>
                <Field
                  label="FreshService Error"
                  value={popUpDataRow["FS Error"]}
                />
              </Grid>

              <Grid item xs={12} sm={5}>
                <Field
                  label="Backend Error"
                  value={popUpDataRow["Backend Error"]}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* ----- SECTION 4: CONTEXTUAL ERROR SYNC PROFILE LOG ----- */}
          <Paper
            elevation={0}
            sx={{
              p: 1.5,
              backgroundColor: "#fffbeb",
              border: "1px solid #fef3c7",
              borderRadius: 1.5,
            }}
          >
            <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: "#b45309", textTransform: "uppercase", letterSpacing: "0.03em", mb: 1.5 }}>
              Description
            </Typography>

            <Typography
              sx={{
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "#334155",
                whiteSpace: "pre-wrap",
                lineHeight: 1.3
              }}
            >
              {popUpDataRow["Ticket Description"] || "—"}
            </Typography>
          </Paper>

        </Box>
      )}
    </CommonDialog>
  );
}

export default TicketingDetailsDialog;