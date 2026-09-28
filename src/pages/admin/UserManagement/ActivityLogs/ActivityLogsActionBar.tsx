import React from "react";
import { Box, Button, Typography, Stack, IconButton } from "@mui/material";
import { LocalizationProvider, DateTimePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { Dayjs } from "dayjs";

//  FIXED: Added explicit material icon module imports to resolve compilation drops
import { 
  Menu as MenuIcon, 
  MenuOpen as MenuOpenIcon 
} from "@mui/icons-material";

import ExcelDownloadButton from "../../../../components/common/ExcelDownloadButton";

export type RangeType = "1D" | "3D" | "7D";

export interface Props {
  range: RangeType;
  onRangeChange: (r: RangeType) => void;
  fromDate: Dayjs;
  toDate: Dayjs;
  onFromDateChange: (d: Dayjs) => void;
  onToDateChange: (d: Dayjs) => void;
  onSearch: () => void;
  excelData: any[];
  excelColumns: string[];
  tableId: string;
  /*  HOOK UP SIDEBAR LAYOUT MANAGERS AS PROPS */
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

const ActivityLogsActionBar: React.FC<Props> = ({
  range,
  onRangeChange,
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
  
  const toggleBtnStyle = (isActive: boolean) => ({
    height: 32,
    fontSize: "0.68rem",
    fontWeight: 700,
    borderRadius: "6px",
    px: 2,
    border: "1px solid #cbd5e1",
    backgroundColor: isActive ? "#354a6b" : "#ffffff",
    color: isActive ? "#ffffff" : "#475569",
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
      width: 200,
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
      {/* ================= LEFT CONTROLS TITLE WITH SIDEBAR BUTTON ================= */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
        {/*  INTEGRATED SIDEBAR DRAWER HOOK ACTION ICON */}
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
        <Box sx={{ minWidth: 0 }}>
          
          <Typography 
            sx={{ 
              fontSize: "0.85rem", 
              fontWeight: 700, 
              color: "#1e293b", 
              textTransform: "uppercase", 
              letterSpacing: "0.05em",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}
          >
            Activity Logs
          </Typography>
        </Box>
      </Box>

      {/* ================= RIGHT METRIC CONTROLS LINE ================= */}
      <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
        <Button size="small" variant="text" sx={toggleBtnStyle(range === "1D")} onClick={() => onRangeChange("1D")}>1D</Button>
        <Button size="small" variant="text" sx={toggleBtnStyle(range === "3D")} onClick={() => onRangeChange("3D")}>3D</Button>
        <Button size="small" variant="text" sx={toggleBtnStyle(range === "7D")} onClick={() => onRangeChange("7D")}>7D</Button>

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          {/*  SAFETY TYPES TYPE-NARROWING FOR ONCHANGE */}
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
            slotProps={{
              textField: { size: "small", sx: pickerFieldStyles },
            }}
          />

          {/*  SAFETY TYPES TYPE-NARROWING FOR ONCHANGE */}
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
          fileName="Activity_Logs"
          disabled={!excelData || excelData.length === 0}
        />
      </Stack>
    </Box>
  );
};

export default ActivityLogsActionBar;