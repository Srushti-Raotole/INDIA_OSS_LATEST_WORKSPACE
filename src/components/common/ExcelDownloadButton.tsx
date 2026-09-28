// import React, { useState } from "react";
// import {
//   IconButton,
//   Menu,
//   MenuItem,
//   Tooltip,
//   Box,
//   Typography,
// } from "@mui/material";
// import ViewColumnIcon from "@mui/icons-material/ViewColumn";
// import TableChartIcon from "@mui/icons-material/TableChart";

// import xlsIcon from "../../assets/xls.png";
// import { downloadExcel } from "../../utils/excelUtils";
// import axiosClient from "@/api/axiosClient";

// /* ================= TYPES ================= */
// interface ExcelDownloadButtonProps {
//   /** Existing local-table export */
//   data?: any[];
//   columnOrder?: string[];
//   tableId?: string;

//   /** Row-wise API export (NEW) */
//   fetchUrl?: string;
//   fetchParams?: Record<string, string>;

//   fileName?: string;
//   disabled?: boolean;
// }

// const LOCALSTORAGE_PREFIX = "visible_columns_map_";

// /* ================= COMPONENT ================= */
// const ExcelDownloadButton: React.FC<ExcelDownloadButtonProps> = ({
//   data = [],
//   columnOrder = [],
//   tableId,
//   fetchUrl,
//   fetchParams,
//   fileName = "Export",
//   disabled = false,
// }) => {
//   const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
//   const open = Boolean(anchorEl);
//   const isApiMode = Boolean(fetchUrl);

//   /* ================= HELPERS ================= */
//   const readVisibilityMap = (): Record<string, boolean> | null => {
//     if (!tableId) return null;
//     try {
//       const raw = localStorage.getItem(`${LOCALSTORAGE_PREFIX}${tableId}`);
//       if (!raw) return null;
//       const parsed = JSON.parse(raw);
//       return typeof parsed === "object" && !Array.isArray(parsed)
//         ? parsed
//         : null;
//     } catch {
//       return null;
//     }
//   };

//   const getVisibleColumnsOrdered = (): string[] => {
//     const visMap = readVisibilityMap();
//     if (!visMap) return [...columnOrder];
//     return columnOrder.filter((c) => visMap[c] !== false);
//   };

//   /* ================= API DOWNLOAD ================= */
//   // const handleApiDownload = async () => {
//   //   if (!fetchUrl) return;

//   //   try {
//   //     const qs = fetchParams
//   //       ? "?" +
//   //         new URLSearchParams(fetchParams).toString()
//   //       : "";

//   //     const res = await fetch(`${fetchUrl}${qs}`);
//   //     if (!res.ok) throw new Error("API download failed");

//   //     const json = await res.json();
//   //     if (!Array.isArray(json) || json.length === 0) {
//   //       alert("No data available");
//   //       return;
//   //     }

//   //     downloadExcel(json, fileName);
//   //     setAnchorEl(null);
//   //   } catch (err) {
//   //     console.error(err);
//   //     alert("Failed to download Excel");
//   //   }
//   // };
//   const handleApiDownload = async () => {
//     if (!fetchUrl) return;

//     try {
//       const res = await axiosClient.get(fetchUrl, {
//         params: fetchParams,
//       });

//       const json = res.data;

//       if (!Array.isArray(json) || json.length === 0) {
//         alert("No data available");
//         return;
//       }

//       downloadExcel(json, fileName);
//       setAnchorEl(null);
//     } catch (err) {
//       console.error(err);
//       alert("Failed to download Excel");
//     }
//   };

//   /* ================= LOCAL DATA DOWNLOAD ================= */
//   const handleLocalDownload = (type: "selected" | "all") => {
//     if (!data.length) return;

//     let exportColumns: string[];

//     if (type === "all") {
//       const allKeys = Array.from(
//         new Set(data.flatMap((r: any) => Object.keys(r)))
//       );
//       exportColumns = [
//         ...columnOrder.filter((k) => allKeys.includes(k)),
//         ...allKeys.filter((k) => !columnOrder.includes(k)),
//       ];
//     } else {
//       exportColumns = getVisibleColumnsOrdered();
//     }

//     const exportData = data.map((row: any) => {
//       const out: Record<string, any> = {};
//       exportColumns.forEach((k) => (out[k] = row?.[k]));
//       return out;
//     });

//     downloadExcel(exportData, `${fileName}_${type}`);
//     setAnchorEl(null);
//   };

//   /* ================= RENDER ================= */
//   return (
//     <>
//       <Tooltip title="Download Excel">
//         <span>
//           <IconButton
//             size="small"
//             disabled={disabled}
//             onClick={(e) => setAnchorEl(e.currentTarget)}
//             sx={{ p: 0.5 }}
//           >
//             <img
//               src={xlsIcon}
//               alt="Excel"
//               style={{
//                 width: 24,
//                 height: 27,
//                 opacity: disabled ? 0.4 : 1,
//               }}
//             />
//           </IconButton>
//         </span>
//       </Tooltip>

//       <Menu
//         anchorEl={anchorEl}
//         open={open}
//         onClose={() => setAnchorEl(null)}
//         PaperProps={{
//           sx: {
//             borderRadius: 2,
//             minWidth: 260,
//             px: 1,
//             py: 0.5,
//           },
//         }}
//       >
//         {/* ===== API MODE ===== */}
//         {isApiMode && (
//           <MenuItem
//             onClick={handleApiDownload}
//             sx={{ borderRadius: 1 }}
//           >
//             <TableChartIcon fontSize="small" sx={{ mr: 1 }} />
//             <Typography fontSize="0.85rem" fontWeight={600}>
//               Download Excel
//             </Typography>
//           </MenuItem>
//         )}

//         {/* ===== LOCAL DATA MODE ===== */}
//         {!isApiMode && (
//           <>
//             <MenuItem
//               onClick={() => handleLocalDownload("selected")}
//               sx={{ borderRadius: 1 }}
//             >
//               <ViewColumnIcon fontSize="small" sx={{ mr: 1 }} />
//               <Typography fontSize="0.85rem" fontWeight={600}>
//                 Visible Columns
//               </Typography>
//             </MenuItem>

//             <MenuItem
//               onClick={() => handleLocalDownload("all")}
//               sx={{ borderRadius: 1 }}
//             >
//               <TableChartIcon fontSize="small" sx={{ mr: 1 }} />
//               <Typography fontSize="0.85rem" fontWeight={600}>
//                 All Columns
//               </Typography>
//             </MenuItem>
//           </>
//         )}
//       </Menu>
//     </>
//   );
// };

// export default ExcelDownloadButton;

import React, { useState } from "react";
import {
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Box,
  Typography,
} from "@mui/material";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import TableChartIcon from "@mui/icons-material/TableChart";

import xlsIcon from "../../assets/xls.png";
import { downloadExcel } from "../../utils/excelUtils";
import axiosClient from "@/api/axiosClient";

/* ================= TYPES ================= */
interface ExcelDownloadButtonProps {
  /** Existing local-table export */
  data?: any[];
  columnOrder?: string[];
  tableId?: string;

  /** Row-wise API export (NEW) */
  fetchUrl?: string;
  fetchParams?: Record<string, string>;

  fileName?: string;
  disabled?: boolean;
}

const LOCALSTORAGE_PREFIX = "visible_columns_map_";

/* ================= CSV / EXCEL INJECTION SANITIZATION =================
 * Excel/Sheets treat any cell value starting with =, +, -, @ (and \t, \r)
 * as the start of a formula. Prefixing such values with a single quote
 * forces spreadsheet apps to render them as plain text instead of
 * executing them. This must run on every user-controlled value before
 * it is written to an exported file.
 * ======================================================================= */
const RISKY_LEADING_CHARS = ["=", "+", "@", "\t", "\r"];

const sanitizeCellValue = (value: unknown): unknown => {
  if (typeof value !== "string" || value.length === 0) return value;
  if (RISKY_LEADING_CHARS.includes(value[0])) {
    return `'${value}`;
  }
  return value;
};

const sanitizeRowsForExport = <T extends Record<string, any>>(
  rows: T[],
): T[] => {
  return rows.map((row) => {
    const sanitizedRow: Record<string, any> = {};
    for (const key of Object.keys(row)) {
      sanitizedRow[key] = sanitizeCellValue(row[key]);
    }
    return sanitizedRow as T;
  });
};

/* ================= COMPONENT ================= */
const ExcelDownloadButton: React.FC<ExcelDownloadButtonProps> = ({
  data = [],
  columnOrder = [],
  tableId,
  fetchUrl,
  fetchParams,
  fileName = "Export",
  disabled = false,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const isApiMode = Boolean(fetchUrl);

  /* ================= HELPERS ================= */
  const readVisibilityMap = (): Record<string, boolean> | null => {
    if (!tableId) return null;
    try {
      const raw = localStorage.getItem(`${LOCALSTORAGE_PREFIX}${tableId}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed
        : null;
    } catch {
      return null;
    }
  };

  const getVisibleColumnsOrdered = (): string[] => {
    const visMap = readVisibilityMap();
    if (!visMap) return [...columnOrder];
    return columnOrder.filter((c) => visMap[c] !== false);
  };

  /* ================= API DOWNLOAD ================= */
  const handleApiDownload = async () => {
    if (!fetchUrl) return;

    try {
      const res = await axiosClient.get(fetchUrl, {
        params: fetchParams,
      });

      const json = res.data;

      if (!Array.isArray(json) || json.length === 0) {
        alert("No data available");
        return;
      }

      //  Sanitize before export to prevent CSV/formula injection
      const safeJson = sanitizeRowsForExport(json);

      downloadExcel(safeJson, fileName);
      setAnchorEl(null);
    } catch (err) {
      console.error(err);
      alert("Failed to download Excel");
    }
  };

  /* ================= LOCAL DATA DOWNLOAD ================= */
  const handleLocalDownload = (type: "selected" | "all") => {
    if (!data.length) return;

    let exportColumns: string[];

    if (type === "all") {
      const allKeys = Array.from(
        new Set(data.flatMap((r: any) => Object.keys(r))),
      );
      exportColumns = [
        ...columnOrder.filter((k) => allKeys.includes(k)),
        ...allKeys.filter((k) => !columnOrder.includes(k)),
      ];
    } else {
      exportColumns = getVisibleColumnsOrdered();
    }

    const exportData = data.map((row: any) => {
      const out: Record<string, any> = {};
      exportColumns.forEach((k) => (out[k] = row?.[k]));
      return out;
    });

    //  Sanitize before export to prevent CSV/formula injection
    const safeExportData = sanitizeRowsForExport(exportData);

    downloadExcel(safeExportData, `${fileName}_${type}`);
    setAnchorEl(null);
  };

  /* ================= RENDER ================= */
  return (
    <>
      <Tooltip title="Download Excel">
        <span>
          <IconButton
            size="small"
            disabled={disabled}
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{ p: 0.5 }}
          >
            <img
              src={xlsIcon}
              alt="Excel"
              style={{
                width: 24,
                height: 27,
                opacity: disabled ? 0.4 : 1,
              }}
            />
          </IconButton>
        </span>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: 260,
            px: 1,
            py: 0.5,
          },
        }}
      >
        {/* ===== API MODE ===== */}
        {isApiMode && (
          <MenuItem onClick={handleApiDownload} sx={{ borderRadius: 1 }}>
            <TableChartIcon fontSize="small" sx={{ mr: 1 }} />
            <Typography fontSize="0.85rem" fontWeight={600}>
              Download Excel
            </Typography>
          </MenuItem>
        )}

        {/* ===== LOCAL DATA MODE ===== */}
        {!isApiMode && (
          <>
            <MenuItem
              onClick={() => handleLocalDownload("selected")}
              sx={{ borderRadius: 1 }}
            >
              <ViewColumnIcon fontSize="small" sx={{ mr: 1 }} />
              <Typography fontSize="0.85rem" fontWeight={600}>
                Visible Columns
              </Typography>
            </MenuItem>

            <MenuItem
              onClick={() => handleLocalDownload("all")}
              sx={{ borderRadius: 1 }}
            >
              <TableChartIcon fontSize="small" sx={{ mr: 1 }} />
              <Typography fontSize="0.85rem" fontWeight={600}>
                All Columns
              </Typography>
            </MenuItem>
          </>
        )}
      </Menu>
    </>
  );
};

export default ExcelDownloadButton;
