import {
  Box,
  Paper,
  Typography,
  Divider,
  Button,
  Tooltip,
  IconButton,
} from "@mui/material";

import FolderZipIcon from "@mui/icons-material/FolderZip";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import DownloadIcon from "@mui/icons-material/Download";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import ErrorState from "../../components/common/ErrorState";

dayjs.extend(utc);
dayjs.extend(timezone);

type FileObj = { name: string };

const isBefore4AMIST = () =>
  dayjs().tz("Asia/Kolkata").hour() < 4;

const fileIconColor = (name: string) => {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext === "csv") return "#2e7d32";
  if (ext === "xls" || ext === "xlsx") return "#1565c0";
  if (ext === "pdf") return "#c62828";
  return "#666";
};

export default function ReportPanel({
  title,
  type,
  date,
  setDate,
  files,
  loading,
  error,
  onRetry,
  onDownload,
  onDownloadAll,
}: any) {
  const showBefore4AM =
    type === "Daily" && isBefore4AMIST() && files.length === 0 && !loading;

  return (
    <Paper
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        borderRadius: 2,
      }}
    >
      {/* ===== HEADER ===== */}
      <Box sx={{ p: 1, display: "flex", alignItems: "center", gap: 1 }}>
        <Typography sx={{ fontWeight: 700 }}>
          {title}
        </Typography>

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            value={date}
            onChange={(d) => d && setDate(d)}
            format="MM-DD-YYYY"
            slotProps={{ textField: { size: "small" } }}
          />
        </LocalizationProvider>

        <Box sx={{ ml: "auto" }}>
          <Button
            size="small"
            startIcon={<FolderZipIcon />}
            disabled={files.length === 0}
            onClick={onDownloadAll}
          >
            Download All
          </Button>
        </Box>
      </Box>

      <Divider />

      {/* ===== BODY ===== */}
      <Box sx={{ flex: 1, p: 1, overflowY: "auto" }}>
        {loading ? (
          <ErrorState
            title="Loading"
            message="Fetching reports, please wait…"
          />
        ) : error ? (
          <ErrorState
            title="Error"
            message={error}
            severity="error"
            onRetry={onRetry}
          />
        ) : files.length === 0 ? (
          <ErrorState
            title="No Reports"
            message={
              showBefore4AM
                ? "Reports will be available after 4:00 AM IST"
                : "No reports available for the selected date"
            }
          />
        ) : (
          files.map((f: FileObj) => (
            <Paper
              key={f.name}
              elevation={0}
              sx={{
                mb: 1,
                p: 1,
                borderRadius: 2,
                border: "1px solid #e0e0e0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "#fafafa",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <InsertDriveFileIcon sx={{ color: fileIconColor(f.name) }} />
                <Typography noWrap sx={{ fontFamily: "monospace" }}>
                  {f.name}
                </Typography>
              </Box>

              <Tooltip title="Download">
                <IconButton size="small" onClick={() => onDownload(f)}>
                  <DownloadIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Paper>
          ))
        )}
      </Box>
    </Paper>
  );
}
