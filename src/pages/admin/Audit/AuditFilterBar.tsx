import React from "react";
import { Box, Button, Typography, Stack, TextField, MenuItem, IconButton } from "@mui/material";
import { Menu as MenuIcon, MenuOpen as MenuOpenIcon } from "@mui/icons-material";
import { LocalizationProvider, DateTimePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Dayjs } from "dayjs";
import ExcelDownloadButton from "../../../components/common/ExcelDownloadButton";

/* ================= TYPES ================= */
type AuditType = "ALARMS" | "SPANLOSS";

/* ================= PROPS ================= */
interface Props {
  auditType: AuditType;
  onAuditTypeChange: (type: AuditType) => void;

  adapter: string;
  adapters: string[];
  onAdapterChange: (val: string) => void;

  fromDate: Dayjs;
  toDate: Dayjs;
  onFromDateChange: (d: Dayjs) => void;
  onToDateChange: (d: Dayjs) => void;

  onSearch: () => void;

  excelData: any[];
  excelColumns: string[];
  tableId: string;
  
  /*  METRIC SIDEBAR MANAGERS LINKED AS PROPS */
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

/* ================= COMPONENT ================= */
const AuditFilterBar: React.FC<Props> = ({
  auditType,
  onAuditTypeChange,
  adapter,
  adapters,
  onAdapterChange,
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  onSearch,
  excelData,
  excelColumns,
  tableId,
  onToggleSidebar,
  isSidebarOpen,
}) => {
  
  /* ================= ACTION BAR ACCENT THEME TOGGLE BUTTON STYLES ================= */
  const toggleBtnStyle = (isActive: boolean) => ({
    height: 32,
    fontSize: "0.68rem",
    fontWeight: 700,
    borderRadius: "6px",
    px: 1.8,
    border: "1px solid #cbd5e1",
    backgroundColor: isActive ? "#354a6b" : "#ffffff",
    color: isActive ? "#ffffff" : "#475569",
    textTransform: "none",
    letterSpacing: "0.02em",
    transition: "all 0.15s ease-in-out",
    "&:hover": {
      backgroundColor: isActive ? "#273752" : "#f8fafc",
      borderColor: "#cbd5e1"
    }
  });

  const pickerFieldStyles = {
    "& .MuiOutlinedInput-root": {
      fontSize: "0.7rem",
      height: 32,
      backgroundColor: "#ffffff",
      borderRadius: "6px",
      width: 200, // Normalized form footprint size
      "& fieldset": { borderColor: "#cbd5e1" },
      "&:hover fieldset": { borderColor: "#94a3b8" },
      "&.Mui-focused fieldset": { borderColor: "#354a6b", borderWidth: "1.5px" },
    },
    "& .MuiInputLabel-root": {
      fontSize: "0.72rem",
      fontWeight: 600,
      color: "#64748b",
      transform: "translate(14px, 7px) scale(1)",
      "&.MuiInputLabel-shrink": {
        transform: "translate(14px, -8px) scale(0.75)",
      }
    },
    "& .MuiOutlinedInput-input": {
      px: "10px !important",
      height: "32px",
      py: 0,
      boxSizing: "border-box",
      color: "#1e293b",
      fontWeight: 500,
    },
    "& .MuiIconButton-root": {
      padding: "2px",
      marginRight: "-2px",
      "& .MuiSvgIcon-root": { fontSize: "0.95rem", color: "#64748b" }
    }
  };

  const selectFieldStyles = {
    ...pickerFieldStyles,
    "& .MuiOutlinedInput-root": {
      ...pickerFieldStyles["& .MuiOutlinedInput-root"],
      width: 140, // Scaled explicitly for layout conservation
    },
    "& .MuiSelect-select": {
      fontSize: "0.7rem",
      fontWeight: 600,
      color: "#1e293b",
      lineHeight: "32px",
      py: 0,
      pl: "10px",
      pr: "24px !important",
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        p: 1.5,
        bgcolor: "#ffffff",
        border: "1px solid #e2e8f0",
        borderRadius: "10px",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.02)",
      }}
    >
      {/* ================= LEFT SECTION: UTILITY TITLE WITH DRAWER LINK ================= */}
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
        {onToggleSidebar && (
          <IconButton 
            onClick={onToggleSidebar} 
            size="small" 
            sx={{ 
              color: "#354a6b", 
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0",
              p: "5px",
              "&:hover": { backgroundColor: "#e2e8f0" } 
            }}
          >
            {isSidebarOpen ? <MenuOpenIcon sx={{ fontSize: 16 }} /> : <MenuIcon sx={{ fontSize: 16 }} />}
          </IconButton>
        )}

        <Box
          sx={{
            width: 3.5,
            height: 32,
            borderRadius: "2px",
            bgcolor: "#354a6b",
          }}
        />
        
        <Box sx={{ minWidth: 0, mr: 1 }}>
          <Typography 
            sx={{ 
              fontSize: "0.85rem", 
              fontWeight: 700, 
              color: "#1e293b", 
              textTransform: "uppercase", 
              letterSpacing: "0.05em",
              whiteSpace: "nowrap",
            }}
          >
            Audit Logs
          </Typography>
        </Box>

        {/* Dashboard Tab Filters */}
        <Button
          size="small"
          variant="text"
          sx={toggleBtnStyle(auditType === "SPANLOSS")}
          onClick={() => onAuditTypeChange("SPANLOSS")}
        >
          Spanloss
        </Button>
        <Button
          size="small"
          variant="text"
          sx={toggleBtnStyle(auditType === "ALARMS")}
          onClick={() => onAuditTypeChange("ALARMS")}
        >
          Alarms
        </Button>

        
      </Stack>

      {/* ================= RIGHT SECTION: FILTERS & SUBMISSION ENGINE ================= */}
      <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
        <TextField
          select
          size="small"
          label="Adapter"
          value={adapter}
          sx={selectFieldStyles}
          onChange={(e) => onAdapterChange(e.target.value)}
          slotProps={{
            inputLabel: { sx: { fontSize: "0.72rem", fontWeight: 600 } }
          }}
        >
          {adapters.map((a) => (
            <MenuItem key={a} value={a} sx={{ fontSize: "0.7rem", fontWeight: 600 }}>
              {a}
            </MenuItem>
          ))}
        </TextField>

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          {/*  FIXED: Sized with safety types verification runtime block checks */}
          <DateTimePicker
            label="From"
            value={fromDate}
            onChange={(v: any) => {
              if (v && typeof v.isValid === "function" && v.isValid()) {
                onFromDateChange(v);
              }
            }}
            ampm={false}
            format="YYYY-MM-DD HH:mm"
            views={["year", "month", "day", "hours", "minutes"]}
            slotProps={{
              textField: { size: "small", sx: pickerFieldStyles },
            }}
          />

          {/*  FIXED: Sized with safety types verification runtime block checks */}
          <DateTimePicker
            label="To"
            value={toDate}
            onChange={(v: any) => {
              if (v && typeof v.isValid === "function" && v.isValid()) {
                onToDateChange(v);
              }
            }}
            ampm={false}
            format="YYYY-MM-DD HH:mm"
            views={["year", "month", "day", "hours", "minutes"]}
            slotProps={{
              textField: { size: "small", sx: pickerFieldStyles },
            }}
          />
        </LocalizationProvider>

        <Button 
          variant="contained" 
          onClick={onSearch}
          sx={{
            backgroundColor: "#354a6b",
            color: "#ffffff",
            height: 32,
            px: 2.5,
            fontSize: "0.72rem",
            fontWeight: 700,
            textTransform: "none",
            borderRadius: "6px",
            boxShadow: "none",
            "&:hover": { backgroundColor: "#273752", boxShadow: "none" }
          }}
        >
          Search
        </Button>

        <ExcelDownloadButton
          data={excelData}
          columnOrder={excelColumns}
          tableId={tableId}
          fileName={`${auditType}_Audit`}
          disabled={!excelData || excelData.length === 0}
        />
      </Stack>
    </Box>
  );
};

export default AuditFilterBar;