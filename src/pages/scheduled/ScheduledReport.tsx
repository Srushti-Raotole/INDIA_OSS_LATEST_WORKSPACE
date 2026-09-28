import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  IconButton,
  TextField,
  Pagination,
  Chip,
  Stack,
  InputAdornment,
} from "@mui/material";
import { useOutletContext } from "react-router-dom";

import FolderZipIcon from "@mui/icons-material/FolderZip";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import DownloadIcon from "@mui/icons-material/Download";
import SearchIcon from "@mui/icons-material/Search";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import axiosClient from "@/api/axiosClient";
import { FETCH_SCHEDULED_REPORT } from "@/api/apis";

import ErrorState from "../../components/common/ErrorState";
import { logActivity } from "../../utils/activityLogger";

dayjs.extend(utc);
dayjs.extend(timezone);

/* ================= TYPES ================= */
type FileObj = {
  name: string;
  size?: number;
};

type ReportType = "Daily" | "Reconciliation";

type OutletContextType = { 
  open: boolean;
  handleDrawerOpen: () => void;
};

/* ================= CONSTANTS ================= */
const PAGE_SIZE = 11;
const MAX_RECON_LOOKBACK_DAYS = 7;

/* ================= UTILS ================= */
const formatDate = (d: dayjs.Dayjs) => d.format("MM-DD-YYYY");

const getDailyReportDate = () => {
  const now = dayjs().tz("Asia/Kolkata");
  return now.hour() < 4 ? now.subtract(2, "day") : now.subtract(1, "day");
};

const fileIconColor = (name: string) => {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "csv") return "#2e7d32";
  if (ext === "xls" || ext === "xlsx") return "#1565c0";
  if (ext === "pdf") return "#c62828";
  return "#64748b";
};

type SizeInfo = {
  value: string;
  unit: "KB" | "MB" | "GB";
};

const formatSize = (raw?: number): SizeInfo => {
  if (raw === undefined || raw === null) {
    return { value: "--", unit: "KB" };
  }
  const sizeKB = raw;
  const sizeMB = sizeKB / 1024;
  const sizeGB = sizeKB / 1024;

  if (sizeGB >= 1) {
    return { value: sizeGB.toFixed(2), unit: "GB" };
  }
  if (sizeMB >= 1) {
    return { value: sizeMB.toFixed(2), unit: "MB" };
  }
  return { value: sizeKB.toFixed(2), unit: "KB" };
};

const unitColor = (unit: "KB" | "MB" | "GB") => {
  switch (unit) {
    case "GB": return "#c62828";
    case "MB": return "#ef6c00";
    default: return "#1565c0";
  }
};

/* ======================================================
 * MAIN PAGE COMPONENT
 * ====================================================== */
export default function ScheduledReportsSplitView() {
  const context = useOutletContext<OutletContextType>() || { open: false, handleDrawerOpen: null };
  
  const [dailyDate, setDailyDate] = useState(dayjs());
  const [reconDate, setReconDate] = useState(dayjs());
  const [reconAutoSelected, setReconAutoSelected] = useState(false);

  const [dailyFiles, setDailyFiles] = useState<FileObj[]>([]);
  const [reconFiles, setReconFiles] = useState<FileObj[]>([]);

  const [loadingDaily, setLoadingDaily] = useState(false);
  const [loadingRecon, setLoadingRecon] = useState(false);

  const [errorDaily, setErrorDaily] = useState<string | null>(null);
  const [errorRecon, setErrorRecon] = useState<string | null>(null);

  useEffect(() => {
    logActivity({
      activity: "Scheduled Report page opened",
      actionName: "SCHEDULED_REPORT",
      module: "SCHEDULED",
    });
  }, []);

  useEffect(() => {
    const dailyReportDate = getDailyReportDate();
    setDailyDate(dailyReportDate);
    fetchReports("Daily", dailyReportDate);
    fetchReconWithFallback(dayjs());
  }, []);

  async function fetchReports(type: ReportType, date: dayjs.Dayjs) {
    type === "Daily" ? setLoadingDaily(true) : setLoadingRecon(true);
    type === "Daily" ? setErrorDaily(null) : setErrorRecon(null);

    try {
      const res = await axiosClient.get(FETCH_SCHEDULED_REPORT, {
        params: { type, date: formatDate(date) },
      });

      const files = (res.data || []).map((f: any) => ({
        name: f?.name ?? f?.fileName ?? "",
        size: Number(f?.sizeKB),
      }));

      type === "Daily" ? setDailyFiles(files) : setReconFiles(files);
      return files.length;
    } catch {
      type === "Daily"
        ? setErrorDaily("Unable to fetch reports")
        : setErrorRecon("Unable to fetch reports");
      return 0;
    } finally {
      type === "Daily" ? setLoadingDaily(false) : setLoadingRecon(false);
    }
  }

  async function fetchReconWithFallback(startDate: dayjs.Dayjs) {
    setLoadingRecon(true);
    setReconAutoSelected(false);

    for (let i = 0; i <= MAX_RECON_LOOKBACK_DAYS; i++) {
      const tryDate = startDate.subtract(i, "day");
      const count = await fetchReports("Reconciliation", tryDate);

      if (count > 0) {
        setReconDate(tryDate);
        setReconAutoSelected(i > 0);
        setLoadingRecon(false);
        return;
      }
    }

    setErrorRecon("No reconciliation reports found in recent days");
    setLoadingRecon(false);
  }

  function downloadFile(file: FileObj, date: dayjs.Dayjs, type: ReportType) {
    const baseUrl = axiosClient.defaults.baseURL;
    window.location.href =
      `${baseUrl}/v1/scheduled/download?` +
      `type=${type}&date=${formatDate(date)}&fileName=${encodeURIComponent(file.name)}`;
  }

  function downloadAll(date: dayjs.Dayjs, type: ReportType) {
    const baseUrl = axiosClient.defaults.baseURL;
    window.location.href =
      `${baseUrl}/v1/scheduled/download-all?type=${type}&date=${formatDate(date)}`;
  }

  return (
    <Box 
      sx={{ 
        backgroundColor: "#ffffff", 
        height: "95vh", //  Forces the entire wrapper container to match view bounds exactly
        width: "100%", 
        display: "flex", 
        flexDirection: "column", 
        p: 1,
        overflow: "hidden"
      }}
    >
      <Box 
        sx={{ 
          flexGrow: 1,
          display: "flex", 
          flexDirection: { xs: "column", md: "row" }, 
          gap: 1.5, 
          height: "calc(100vh - 20px)", //  Adjusted canvas limits to fit panels neatly
          overflow: "hidden",
          p: 0.5
        }}
      >
        <ReportPanel
          title="DAILY REPORTS"
          date={dailyDate}
          disableAfter={dayjs()}
          files={dailyFiles}
          loading={loadingDaily}
          error={errorDaily}
          onDateChange={(d) => {
            setDailyDate(d);
            fetchReports("Daily", d);
          }}
          onRetry={() => fetchReports("Daily", dailyDate)}
          onDownloadAll={() => downloadAll(dailyDate, "Daily")}
          onDownload={(f) => downloadFile(f, dailyDate, "Daily")}
        />

        <ReportPanel
          title="ALARM RECONCILIATION REPORTS"
          date={reconDate}
          disableAfter={dayjs()}
          files={reconFiles}
          loading={loadingRecon}
          error={errorRecon}
          showAutoBadge={reconAutoSelected}
          onDateChange={(d) => {
            setReconDate(d);
            fetchReconWithFallback(d);
          }}
          onRetry={() => fetchReconWithFallback(reconDate)}
          onDownloadAll={() => downloadAll(reconDate, "Reconciliation")}
          onDownload={(f) => downloadFile(f, reconDate, "Reconciliation")}
        />
      </Box>
    </Box>
  );
}

/* ======================================================
 * REUSABLE COMPACT REPORT PANEL
 * ====================================================== */
function ReportPanel({
  title,
  date,
  disableAfter,
  files,
  loading,
  error,
  onRetry,
  onDownload,
  onDownloadAll,
  onDateChange,
  showAutoBadge,
}: any) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => setPage(1), [search, files]);

  const filteredFiles = useMemo(
    () =>
      files.filter((f: FileObj) => {
        const name = typeof f?.name === "string" ? f.name : "";
        return name.toLowerCase().includes(search.toLowerCase());
      }),
    [files, search]
  );

  const totalPages = Math.ceil(filteredFiles.length / PAGE_SIZE);
  
  //  THIS ENFORCES PAGINATION: Splits your database array into discrete pages of 11 rows
  const pageFiles = useMemo(() => {
    return filteredFiles.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  }, [filteredFiles, page]);

  return (
    <Paper 
      elevation={0} 
      sx={{ 
        flex: 1, 
        display: "flex", 
        flexDirection: "column", 
        border: "1px solid #e2e8f0", 
        borderRadius: 3, 
        overflow: "hidden", //  Locks the panel card boundaries down tightly
        backgroundColor: "#ffffff",
        height: "100%" //  Inherits full height allotment from split box row container
      }}
    >
      <Box 
        sx={{ 
          p: 1.5, 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between", 
          gap: 1.5, 
          backgroundColor: "#f8fafc",
          borderBottom: "1px solid #e2e8f0",
          flexWrap: "nowrap"
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1} sx={{ overflow: "hidden", flexShrink: 1 }}>
          <Typography 
            sx={{ fontSize: "0.78rem", fontWeight: 700, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
          >
            {title} ({filteredFiles.length})
          </Typography>
          {showAutoBadge && (
            <Chip size="small" color="warning" label="Auto-selected" sx={{ height: 18, fontSize: "0.65rem", fontWeight: 700 }} />
          )}
        </Stack>

        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flexShrink: 0 }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              value={date}
              onChange={(d) => d && onDateChange(d)}
              maxDate={disableAfter}
              format="MM-DD-YYYY"
              slotProps={{ 
                textField: { 
                  size: "small",
                  sx: { 
                    width: 175,
                    "& .MuiInputBase-root": { height: 30, fontSize: "0.72rem", backgroundColor: "#ffffff" }
                  } 
                } 
              }}
            />
          </LocalizationProvider>

          <Button
            size="small"
            variant="outlined"
            startIcon={<FolderZipIcon sx={{ width: 14, height: 14 }} />}
            disabled={filteredFiles.length === 0}
            onClick={onDownloadAll}
            sx={{ height: 30, fontSize: "0.7rem", textTransform: "none", fontWeight: 600 }}
          >
            Zip All
          </Button>
        </Stack>
      </Box>

      <Box sx={{ p: 1.2, backgroundColor: "#ffffff", borderBottom: "1px solid #f1f5f9" }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search archived log name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ "& .MuiInputBase-root": { height: 32, fontSize: "0.75rem", backgroundColor: "#f8fafc" } }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 16, color: "#64748b" }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/*  ROOT CONTAINER INTERNAL SCROLL UPGRADE: Only this inner file area expands or scrolls */}
      <Box 
        sx={{ 
          flex: 1, 
          p: 1.2, 
          overflowY: "auto", 
          backgroundColor: "#ffffff",
          scrollbarWidth: "thin",
          scrollbarColor: "#cbd5e1 transparent",
          "&::-webkit-scrollbar": { width: "6px" },
          "&::-webkit-scrollbar-thumb": { background: "#cbd5e1", borderRadius: "3px" },
        }}
      >
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "#64748b", fontSize: "0.75rem" }}>
            Scanning database partition logs...
          </Box>
        ) : error ? (
          <ErrorState title="Error State Triggered" message={error} onRetry={onRetry} />
        ) : pageFiles.length === 0 ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "#94a3b8", fontSize: "0.75rem" }}>
            No log archives recorded for this query string timestamp.
          </Box>
        ) : (
          pageFiles.map((f: FileObj) => (
            <Paper
              key={f.name}
              elevation={0}
              sx={{
                mb: 0.8,
                p: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                border: "1px solid #e2e8f0",
                borderRadius: 2,
                backgroundColor: "#ffffff",
                "&:hover": { backgroundColor: "#f8fafc", borderColor: "#cbd5e1" },
                transition: "all 0.15s ease"
              }}
            >
              <Box sx={{ display: "flex", gap: 1.2, alignItems: "center", overflow: "hidden", mr: 2 }}>
                <InsertDriveFileIcon sx={{ color: fileIconColor(f.name), width: 18, height: 18, flexShrink: 0 }} />
                <Typography title={f.name} sx={{ fontSize: "0.72rem", color: "#334155", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {f.name}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flexShrink: 0 }}>
                <Box
                  sx={{
                    px: 1,
                    py: 0.2,
                    borderRadius: 1,
                    bgcolor: "#f1f5f9",
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    minWidth: 58,
                    textAlign: "center",
                    color: "#475569",
                    border: "1px solid #e2e8f0"
                  }}
                >
                  {(() => {
                    const size = formatSize(f.size);
                    return (
                      <>
                        {size.value}{" "}
                        <span style={{ color: unitColor(size.unit) }}>
                          {size.unit}
                        </span>
                      </>
                    );
                  })()}
                </Box>

                <IconButton 
                  size="small" 
                  onClick={() => onDownload(f)}
                  sx={{ color: "#475569", "&:hover": { color: "#1e293b", backgroundColor: "#e2e8f0" } }}
                >
                  <DownloadIcon sx={{ width: 16, height: 16 }} />
                </IconButton>
              </Box>
            </Paper>
          ))
        )}
      </Box>

      {/*  FIXED FOOTER LAYOUT BOUND: Remained permanently visible at the card edge */}
      {totalPages > 1 && (
        <Box sx={{ p: 1, display: "flex", justifyContent: "center", borderTop: "1px solid #f1f5f9", backgroundColor: "#ffffff", flexShrink: 0 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, p) => setPage(p)}
            size="small"
            shape="rounded"
            color="primary"
            sx={{
              "& .MuiPaginationItem-root": { fontSize: "0.7rem", height: 24, minWidth: 24 }
            }}
          />
        </Box>
      )}
    </Paper>
  );
}