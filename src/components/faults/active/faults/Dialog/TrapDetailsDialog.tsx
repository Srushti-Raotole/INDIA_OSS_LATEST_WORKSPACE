// import React from "react";
// import {
//   Typography,
//   Box,
//   Paper,
//   Chip,
//   IconButton,
//   Tooltip,
// } from "@mui/material";
// import Grid from "@mui/material/Grid"; // Standard Project Stable MUI v5 Core Layout Engine Import
// import ContentCopyIcon from "@mui/icons-material/ContentCopy";
// import ContentPasteGoIcon from '@mui/icons-material/ContentPasteGo';
// import { DynamicTableRow } from "../../../../../store/types";
// import CommonDialog from "../../../../common/CommonDialog.";

// interface AlarmDetailsDialogProps {
//   open: boolean;
//   onClose: () => void;
//   popUpDataRow: DynamicTableRow | null;
//   mode?: "active" | "historic";
// }

// /* ---------- Clipboard Utilities ---------- */
// const copy = (text?: string) => {
//   if (!text) return;
//   navigator.clipboard.writeText(text);
// };

// const copyAllDetails = (row: DynamicTableRow | null) => {
//   if (!row) return;
//   // Convert object to a clean Key: Value formatted string string payload
//   const details = Object.entries(row)
//     .filter(([key]) => !key.startsWith('__')) 
//     .map(([key, val]) => `${key}: ${val || '—'}`)
//     .join('\n');
//   navigator.clipboard.writeText(details);
// };

// /* ---------- Dynamic Operational Badges ---------- */
// const AdapterBadge = (raw?: string) => {
//   const val = (raw ?? "").trim().toUpperCase();
//   const bg =
//     val === "MCP" ? "#009688" :
//     val === "NFMT" ? "#8283eb" :
//     val === "EPNM" ? "#4CAF50" :
//     val === "CONC" ? "#FF9800" :
//     val === "ADVA" ? "#9C27B0" :
//     val === "IFNR" ? "#3F51B5" :
//     val === "TLMR" ? "#E91E63" : "#607D8B";

//   return (
//     <Chip
//       label={val || "NA"}
//       size="small"
//       sx={{
//         backgroundColor: bg,
//         color: "#fff",
//         fontWeight: 700,
//         fontSize: "0.65rem",
//         height: "18px",
//         borderRadius: "4px"
//       }}
//     />
//   );
// };

// const SeverityBadge = (raw?: string) => {
//   const val = (raw ?? "").toUpperCase();
//   const map: Record<string, string> = {
//     CRI: "#D32F2F",
//     CRITICAL: "#D32F2F",
//     MAJOR: "#F57C00",
//     MINOR: "#FBC02D",
//     WARNING: "#FFEB3B",
//   };

//   return (
//     <Chip
//       label={val || "NA"}
//       size="small"
//       sx={{
//         backgroundColor: map[val] ?? "#BDBDBD",
//         color: val === "MINOR" || val === "WARNING" ? "#000" : "#fff",
//         fontWeight: 700,
//         fontSize: "0.65rem",
//         height: "18px",
//         borderRadius: "4px"
//       }}
//     />
//   );
// };

// /* ---------- Content Field Sub-Component Renderer ---------- */
// const Field = ({ label, value, showCopy = false }: { label: string; value: any; showCopy?: boolean }) => (
//   <Box sx={{ display: "flex", flexDirection: "column", gap: 0.2 }}>
//     <Typography
//       sx={{
//         fontSize: "0.62rem",
//         color: "#64748b",
//         fontWeight: 600,
//         textTransform: "uppercase",
//         letterSpacing: "0.02em",
//         lineHeight: 1.1
//       }}
//     >
//       {label}
//     </Typography>
//     <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, minHeight: "18px" }}>
//       <Typography
//         sx={{
//           fontSize: "0.78rem",
//           fontWeight: 600,
//           color: "#334155",
//           wordBreak: "break-all",
//           lineHeight: 1.2
//         }}
//       >
//         {value || "—"}
//       </Typography>
//       {showCopy && value && (
//         <Tooltip title="Copy ID">
//           <IconButton
//             size="small"
//             onClick={() => copy(value.toString())}
//             sx={{ p: 0.1, color: "#94a3b8", "&:hover": { color: "#475569" } }}
//           >
//             <ContentCopyIcon sx={{ fontSize: 11 }} />
//           </IconButton>
//         </Tooltip>
//       )}
//     </Box>
//   </Box>
// );

// function AlarmDetailsDialog({ open, onClose, popUpDataRow, mode = "active" }: AlarmDetailsDialogProps) {
//   const isHistoric = mode === "historic";

//   return (
//     <CommonDialog 
//       open={open} 
//       onClose={onClose} 
//       title={
//         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//           <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: "#1e293b" }}>
//             Alarm Details
//           </Typography>
//           <Tooltip title="Copy All Alarm Details">
//             <IconButton size="small" onClick={() => copyAllDetails(popUpDataRow)} sx={{ color: '#0f766e', p: 0.5 }}>
//               <ContentPasteGoIcon sx={{ fontSize: 16 }} />
//             </IconButton>
//           </Tooltip>
//         </Box>
//       } 
//       maxWidth="md"
//     >
//       {popUpDataRow && (
//         <Box sx={{ px: 2, py: 1.5, backgroundColor: "#ffffff" }}>
          
//           {/* ----- SECTION 1: BASIC CORE METRICS PROFILE ----- */}
//           <Paper elevation={0} sx={{ p: 1.5, mb: 2.5, backgroundColor: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: 1.5 }}>
//             <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.03em", mb: 1.5 }}>
//               Basic Information
//             </Typography>
//             <Grid container spacing={2}>
//               <Grid item xs={6} sm={3}>
//                 <Typography sx={{ fontSize: "0.6rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", mb: 0.4, lineHeight: 1.1 }}>Adapter</Typography>
//                 {AdapterBadge(popUpDataRow["Adapter"])}
//               </Grid>
//               <Grid item xs={6} sm={3}>
//                 <Typography sx={{ fontSize: "0.6rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", mb: 0.4, lineHeight: 1.1 }}>Severity</Typography>
//                 {SeverityBadge(popUpDataRow["Severity"])}
//               </Grid>
//               <Grid item xs={6} sm={3}>
//                 <Field label="Client" value={popUpDataRow["Client"]} />
//               </Grid>
//               <Grid item xs={6} sm={3}>
//                 <Field label="Technology" value={popUpDataRow["Technology"]} />
//               </Grid>
//               <Grid item xs={6} sm={4}>
//                 <Field label="City" value={popUpDataRow["City"]} />
//               </Grid>
//               <Grid item xs={6} sm={2}>
//                 <Field label="Circle" value={popUpDataRow["Circle"]} />
//               </Grid>
//               <Grid item xs={12} sm={6}>
//                 <Field label="ERP Site" value={popUpDataRow["ERP Site ID"]} />
//               </Grid>
//             </Grid>
//           </Paper>

//           {/* ----- SECTION 2: DEVICE TOPOLOGY PROFILE ----- */}
//           <Paper elevation={0} sx={{ p: 1.5, mb: 2.5, backgroundColor: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: 1.5 }}>
//             <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.03em", mb: 1.5 }}>
//               Device Information
//             </Typography>
//             <Grid container spacing={2}>
//               <Grid item xs={12} sm={3}>
//                 <Field label="Device Name" value={popUpDataRow["Device Name"]} />
//               </Grid>
//               <Grid item xs={12} sm={3}>
//                 <Field label="IP Address" value={popUpDataRow["Source"]} />
//               </Grid>
//               <Grid item xs={12} sm={3}>
//                 <Field label="Port Name" value={popUpDataRow["Port Name"]} />
//               </Grid>
//               <Grid item xs={12} sm={3}>
//                 <Field label="Alarm" value={popUpDataRow["Alarm"]} />
//               </Grid>
//             </Grid>
//           </Paper>

//           {/* ----- SECTION 3: EVENT SYNC LOG WINDOW ----- */}
//           <Paper
//             elevation={0}
//             sx={{
//               p: 1.5,
//               mb: 2.5,
//               backgroundColor: "#fffbeb",
//               border: "1px solid #fef3c7",
//               borderRadius: 1.5
//             }}
//           >
//             <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: "#b45309", textTransform: "uppercase", letterSpacing: "0.03em", mb: 1.5 }}>
//               Event Information
//             </Typography>
//             <Grid container spacing={2}>
//               <Grid item xs={12}>
//                 <Field label="Description" value={popUpDataRow["Description"]} />
//               </Grid>
//               <Grid item xs={12} sm={4}>
//                 <Field label="NMS Received Time" value={popUpDataRow["NMS Received Time"]} />
//               </Grid>
//               <Grid item xs={12} sm={4}>
//                 <Field label="OSS Insertion Time" value={popUpDataRow["OSS Insertion Time"]} />
//               </Grid>
//               {isHistoric && (
//                 <Grid item xs={12} sm={4}>
//                   <Field label="Clear Time" value={popUpDataRow["Clear Time"]} />
//                 </Grid>
//               )}
//             </Grid>
//           </Paper>

//           {/* ----- SECTION 4: TRACKING MANAGEMENT INFORMATION ----- */}
//           <Paper elevation={0} sx={{ p: 1.5, backgroundColor: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: 1.5 }}>
//             <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.03em", mb: 1.5 }}>
//               Ticket Information
//             </Typography>
//             <Grid container spacing={2}>
//               <Grid item xs={12} sm={4}>
//                 <Field label="Alarm ID" value={popUpDataRow["Alarm Id"]} showCopy />
//               </Grid>
//               <Grid item xs={12} sm={4}>
//                 <Field label="Internal Ticket ID" value={popUpDataRow["Internal TicketId"]} showCopy />
//               </Grid>
//               <Grid item xs={12} sm={4}>
//                 <Field label="External Ticket ID" value={popUpDataRow["External TicketId"]} showCopy />
//               </Grid>
//             </Grid>
//           </Paper>

//         </Box>
//       )}
//     </CommonDialog>
//   );
// }

// export default AlarmDetailsDialog;
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
import ContentPasteGoIcon from "@mui/icons-material/ContentPasteGo";
import { DynamicTableRow } from "../../../../../store/types";
import CommonDialog from "../../../../common/CommonDialog.";

interface AlarmDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  popUpDataRow: DynamicTableRow | null;
  mode?: "active" | "historic";
}

/* ---------- Clipboard Utilities ---------- */
const copy = (text?: string) => {
  if (!text) return;
  navigator.clipboard.writeText(text);
};

const copyAllDetails = (row: DynamicTableRow | null) => {
  if (!row) return;
  // Convert object to a clean Key: Value formatted string payload
  const details = Object.entries(row)
    .filter(([key]) => !key.startsWith("__"))
    .map(([key, val]) => `${key}: ${val || "—"}`)
    .join("\n");
  navigator.clipboard.writeText(details);
};

/* ---------- Dynamic Operational Badges ---------- */
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
        fontSize: "0.62rem",
        height: "16px",
        borderRadius: "4px",
      }}
    />
  );
};

const SeverityBadge = (raw?: string) => {
  const val = (raw ?? "").toUpperCase();
  const map: Record<string, string> = {
    CRI: "#D32F2F",
    CRITICAL: "#D32F2F",
    MAJOR: "#F57C00",
    MINOR: "#FBC02D",
    WARNING: "#FFEB3B",
  };

  return (
    <Chip
      label={val || "NA"}
      size="small"
      sx={{
        backgroundColor: map[val] ?? "#BDBDBD",
        color: val === "MINOR" || val === "WARNING" ? "#000" : "#fff",
        fontWeight: 700,
        fontSize: "0.62rem",
        height: "16px",
        borderRadius: "4px",
      }}
    />
  );
};

/* ---------- Content Field Sub-Component Renderer ---------- */
// Updated to accept React elements (like Badges) so everything aligns perfectly
const Field = ({ label, value, showCopy = false }: { label: string; value: any; showCopy?: boolean }) => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 0.1 }}>
    <Typography
      sx={{
        fontSize: "0.58rem",
        color: "#64748b",
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.02em",
        lineHeight: 1,
      }}
    >
      {label}
    </Typography>
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, minHeight: "16px" }}>
      {React.isValidElement(value) ? (
        value
      ) : (
        <Typography
          sx={{
            fontSize: "0.74rem",
            fontWeight: 600,
            color: "#334155",
            wordBreak: "break-all",
            lineHeight: 1.1,
          }}
        >
          {value || "—"}
        </Typography>
      )}
      {showCopy && value && (
        <Tooltip title="Copy ID">
          <IconButton
            size="small"
            onClick={() => copy(value.toString())}
            sx={{ p: 0.1, color: "#94a3b8", "&:hover": { color: "#475569" } }}
          >
            <ContentCopyIcon sx={{ fontSize: 10 }} />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  </Box>
);

function AlarmDetailsDialog({ open, onClose, popUpDataRow, mode = "active" }: AlarmDetailsDialogProps) {
  const isHistoric = mode === "historic";

  return (
    <CommonDialog
      open={open}
      onClose={onClose}
      title={
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: "#1e293b" }}>
            Alarm Details
          </Typography>
          <Tooltip title="Copy All Alarm Details">
            <IconButton size="small" onClick={() => copyAllDetails(popUpDataRow)} sx={{ color: "#0f766e", p: 0.4 }}>
              <ContentPasteGoIcon sx={{ fontSize: 15 }} />
            </IconButton>
          </Tooltip>
        </Box>
      }
      maxWidth="md"
    >
      {popUpDataRow && (
        <Box sx={{ px: 2, py: 1, backgroundColor: "#ffffff" }}>
          
          {/* ----- SECTION 1: BASIC CORE METRICS PROFILE ----- */}
          <Paper elevation={0} sx={{ p: 1, mb: 1.5, backgroundColor: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: 1.2 }}>
            <Typography sx={{ fontSize: "0.65rem", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.03em", mb: 1 }}>
              Basic Information
            </Typography>
            <Grid container spacing={1.5}>
              <Grid item xs={6} sm={3}>
                <Field label="Adapter" value={AdapterBadge(popUpDataRow["Adapter"])} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <Field label="Severity" value={SeverityBadge(popUpDataRow["Severity"])} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <Field label="Client" value={popUpDataRow["Client"]} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <Field label="Technology" value={popUpDataRow["Technology"]} />
              </Grid>
              <Grid item xs={6} sm={4}>
                <Field label="City" value={popUpDataRow["City"]} />
              </Grid>
              <Grid item xs={6} sm={2}>
                <Field label="Circle" value={popUpDataRow["Circle"]} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Field label="ERP Site" value={popUpDataRow["ERP Site ID"]} />
              </Grid>
            </Grid>
          </Paper>

          {/* ----- SECTION 2: DEVICE TOPOLOGY PROFILE ----- */}
          <Paper elevation={0} sx={{ p: 1, mb: 1.5, backgroundColor: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: 1.2 }}>
            <Typography sx={{ fontSize: "0.65rem", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.03em", mb: 1 }}>
              Device Information
            </Typography>
            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={3}>
                <Field label="Device Name" value={popUpDataRow["Device Name"]} />
              </Grid>
              <Grid item xs={12} sm={3}>
                <Field label="IP Address" value={popUpDataRow["Source"]} />
              </Grid>
              <Grid item xs={12} sm={3}>
                <Field label="Port Name" value={popUpDataRow["Port Name"]} />
              </Grid>
              <Grid item xs={12} sm={3}>
                <Field label="Alarm" value={popUpDataRow["Alarm"]} />
              </Grid>
              <Grid item xs={12}>
                <Field label="Object Ref" value={popUpDataRow["Object Ref"]} showCopy />
              </Grid>
            </Grid>
          </Paper>

          {/* ----- SECTION 3: EVENT SYNC LOG WINDOW ----- */}
          <Paper
            elevation={0}
            sx={{
              p: 1,
              mb: 1.5,
              backgroundColor: "#fffbeb",
              border: "1px solid #fef3c7",
              borderRadius: 1.2,
            }}
          >
            <Typography sx={{ fontSize: "0.65rem", fontWeight: 700, color: "#b45309", textTransform: "uppercase", letterSpacing: "0.03em", mb: 1 }}>
              Event Information
            </Typography>
            <Grid container spacing={1.5}>
              <Grid item xs={12}>
                <Field label="Description" value={popUpDataRow["Description"]} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Field label="NMS Received Time" value={popUpDataRow["NMS Received Time"]} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Field label="OSS Insertion Time" value={popUpDataRow["OSS Insertion Time"]} />
              </Grid>
              {isHistoric && (
                <Grid item xs={12} sm={4}>
                  <Field label="Clear Time" value={popUpDataRow["Clear Time"]} />
                </Grid>
              )}
            </Grid>
          </Paper>

          {/* ----- SECTION 4: TRACKING MANAGEMENT INFORMATION ----- */}
          <Paper elevation={0} sx={{ p: 1, backgroundColor: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: 1.2 }}>
            <Typography sx={{ fontSize: "0.65rem", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.03em", mb: 1 }}>
              Ticket Information
            </Typography>
            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={4}>
                <Field label="Alarm ID" value={popUpDataRow["Alarm Id"]} showCopy />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Field label="Internal Ticket ID" value={popUpDataRow["Internal TicketId"]} showCopy />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Field label="External Ticket ID" value={popUpDataRow["External TicketId"]} showCopy />
              </Grid>
            </Grid>
          </Paper>

        </Box>
      )}
    </CommonDialog>
  );
}

export default AlarmDetailsDialog;