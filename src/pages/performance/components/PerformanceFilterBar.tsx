import React from "react";
import {
  Grid,
  Box,
  TextField,
  MenuItem,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  IconButton
} from "@mui/material";
import { Menu as MenuIcon, MenuOpen as MenuOpenIcon } from "@mui/icons-material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { parse, format, isValid } from "date-fns";

/* ================= TYPES ================= */
export type DbType = "live" | "current" | "historic";

export type PrimaryFilterOption = {
  label: string;
  value: string;
};

type Props = {
  title?: string;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  filterLabel?: string;
  filterValue?: string;
  filterOptions?: PrimaryFilterOption[];
  onFilterChange?: (v: string) => void;
  dbType: DbType;
  setDbType: (v: DbType) => void;
  fromTime: string;
  toTime: string;
  setFromTime: (v: string) => void;
  setToTime: (v: string) => void;
  onView: () => void;
  rightActions?: React.ReactNode; 
};

/* ================= COMPONENT ================= */
const PerformanceFilterBar: React.FC<Props> = ({
  title,
  onToggleSidebar,
  isSidebarOpen,
  filterLabel,
  filterValue,
  filterOptions,
  onFilterChange,
  dbType,
  setDbType,
  fromTime,
  toTime,
  setFromTime,
  setToTime,
  onView,
  rightActions,
}) => {
  const today = new Date();
  const yesterday = new Date(Date.now() - 86400000);

  const showDropdown =
    !!filterOptions &&
    filterOptions.length > 0 &&
    !!filterLabel &&
    !!onFilterChange;

  const stringToDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    try {
      const parsed = parse(dateStr, "yyyy-MM-dd HH:mm", new Date());
      return isValid(parsed) ? parsed : null;
    } catch {
      return null;
    }
  };

  const handleDateChange = (date: unknown, setter: (v: string) => void) => {
    if (date instanceof Date && isValid(date)) {
      setter(format(date, "yyyy-MM-dd HH:mm"));
    } else {
      setter("");
    }
  };

  const toggleStyle = (activeColor: string) => ({
    borderRadius: "999px",
    px: 2.5, 
    height: 32,
    fontSize: "0.68rem", 
    fontWeight: 700,
    border: "1px solid #e2e8f0 !important",
    color: "#64748b",
    letterSpacing: "0.03em",
    transition: "all 0.15s ease-in-out",
    "&.Mui-selected": {
      backgroundColor: `${activeColor} !important`,
      color: "#ffffff !important",
      boxShadow: "0 2px 5px rgba(0,0,0,0.08)",
    },
    "&:hover": {
      backgroundColor: "#f1f5f9",
    }
  });

  const pickerFieldStyles = {
    "& .MuiOutlinedInput-root": {
      fontSize: "0.7rem",
      height: 32,
      backgroundColor: "#fff",
      borderRadius: "6px",
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
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 1100,
          backgroundColor: "#ffffff",
          borderRadius: "10px",
          p: 1.5, 
          mb: 1.5,
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.01)",
        }}
      >
        {/* ===== HEADER CAPTION SLAT BLOCK ===== */}
        {title && (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mb: 2, position: "relative" }}>
            <Box sx={{ position: "absolute", left: 0, right: 0, height: "1px", backgroundColor: "#f1f5f9", zIndex: 1 }} />
            
            {onToggleSidebar && (
              <IconButton 
                onClick={onToggleSidebar} 
                size="small" 
                sx={{ 
                  position: "absolute", 
                  left: 0, 
                  zIndex: 3, 
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

            <Typography
              sx={{
                position: "relative",
                zIndex: 2,
                backgroundColor: "#ffffff",
                px: 3,
                fontWeight: 800,
                fontSize: "0.85rem",
                letterSpacing: "0.08em",
                color: "#1e293b",
                textTransform: "uppercase",
                textAlign: "center"
              }}
            >
              {title}
            </Typography>
          </Box>
        )}

        <Grid container spacing={1.5} alignItems="center">
          {/* PRIMARY DROPDOWN */}
          {showDropdown && (
            <Grid size={{ xs: 12, md: 2.2 }}>
              <TextField
                select
                label={filterLabel}
                size="small"
                fullWidth
                value={filterValue}
                onChange={(e) => onFilterChange(e.target.value)}
                InputLabelProps={{ shrink: true, sx: { fontSize: "0.72rem", fontWeight: 600, color: "#64748b" } }}
                sx={{
                  "& .MuiOutlinedInput-root": { 
                    fontSize: "0.7rem", 
                    height: 32,
                    borderRadius: "6px",
                    "& fieldset": { borderColor: "#cbd5e1" },
                    "&:hover fieldset": { borderColor: "#94a3b8" }
                  },
                }}
                SelectProps={{
                  MenuProps: {
                    PaperProps: {
                      sx: { maxHeight: 240, border: "1px solid #e2e8f0", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.05)" },
                    },
                  },
                }}
              >
                {filterOptions.map((opt) => (
                  <MenuItem
                    key={opt.value}
                    value={opt.value}
                    sx={{ fontSize: "0.7rem", fontWeight: 600, minHeight: 28, color: "#334155", "&:hover": { backgroundColor: "#f1f5f9" } }}
                  >
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          )}

          {/* TIMELINE DB SWITCH SLATS */}
          <Grid size={{ xs: 12, md: showDropdown ? 3.3 : 4.5 }}>
            <ToggleButtonGroup
              exclusive
              value={dbType}
              onChange={(_, val) => val && setDbType(val)}
              sx={{
                backgroundColor: "#f1f5f9",
                borderRadius: "999px",
                p: "3px",
                gap: "3px",
                border: "none",
                "& .MuiToggleButtonGroup-grouped": { border: "none" }
              }}
            >
              <ToggleButton value="live" sx={toggleStyle("#059669")}>LIVE</ToggleButton>
              <ToggleButton value="current" sx={toggleStyle("#d97706")}>TODAY</ToggleButton>
              <ToggleButton value="historic" sx={toggleStyle("#2563eb")}>HISTORIC</ToggleButton>
            </ToggleButtonGroup>
          </Grid>

          {/* POPUP TIMELINE DATE ANCHORS */}
          {dbType !== "live" && (
            <>
              <Grid size={{ xs: 12, md: 2.4 }}>
                <DateTimePicker
                  label="From"
                  value={stringToDate(fromTime)}
                  onChange={(date) => handleDateChange(date, setFromTime)}
                  minDate={dbType === "current" ? today : undefined}
                  maxDate={dbType === "current" ? today : yesterday}
                  slotProps={{
                    textField: { size: "small", fullWidth: true, sx: pickerFieldStyles },
                    desktopPaper: { sx: { boxShadow: "0 12px 24px -4px rgba(0,0,0,0.1)", border: "1px solid #e2e8f0" } }
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12, md: 2.4 }}>
                <DateTimePicker
                  label="To"
                  value={stringToDate(toTime)}
                  onChange={(date) => handleDateChange(date, setToTime)}
                  minDate={dbType === "current" ? today : undefined}
                  maxDate={dbType === "current" ? today : yesterday}
                  slotProps={{
                    textField: { size: "small", fullWidth: true, sx: pickerFieldStyles },
                    desktopPaper: { sx: { boxShadow: "0 12px 24px -4px rgba(0,0,0,0.1)", border: "1px solid #e2e8f0" } }
                  }}
                />
              </Grid>
            </>
          )}

          {/* ACTION SUBMIT PANEL CONTROL SLOT */}
          <Grid
            size={{ xs: 12, md: "auto" }}
            sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 1, marginLeft: "auto", flexWrap: "nowrap" }}
          >
            <Button
              onClick={onView}
              sx={{
                backgroundColor: "#354a6b",
                color: "#ffffff",
                height: 32,
                px: 3,
                fontSize: "0.72rem",
                fontWeight: 700,
                textTransform: "none",
                borderRadius: "6px",
                whiteSpace: "nowrap",
                boxShadow: "none",
                "&:hover": { backgroundColor: "#273752" },
              }}
            >
              View
            </Button>
            {rightActions}
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  );
};

export default PerformanceFilterBar;