import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
  CircularProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

import {
  GET_NMS_COUNT,
  GET_OSS_COUNT,
  ADMIN_RUN_RECONCILIATION,
  ADMIN_RECON_HISTORY_LOGS,
  ADMIN_POST_RECONCILATION_LOGS,
} from "@/api/apis";

import axiosClient from "@/api/axiosClient";
import { logActivity } from "../../../../utils/activityLogger";
import ReconciliationLogs from "../ReconciliationLogs";
import ReconProgressBar from "../component/ReconProgressBar";
import { useSelector } from "react-redux";
import { getUsername } from "../../../../utils/auth/getUsername";
import { RootState } from "../../../../store/store";

/* ================= TYPES ================= */
interface AlarmCountRow {
  adapter: string;
  nmsCount: number | null;
  ossCount: number | null;
  diff: number | null;
}

/* ================= CONSTANTS ================= */
const ADAPTERS = ["CONC", "IFNR", "MCP", "NFMT", "TLMR", "ADVA"]; 
const RECON_ENABLED_ADAPTERS = ["CONC", "IFNR", "MCP","ADVA","NFMT"];
const ADAPTERS_NO_NMS = [""]; 
const TABLE_ID = "reconciliation-logs-table";

const ADAPTER_COLORS: Record<string, string> = {
  MCP: "#009688",
  NFMT: "#8283eb",
  CONC: "#FF9800",
  IFNR: "#3F51B5",
  TLMR: "#9C27B0",
  ADVA: "#E91E63",
};

const getAdapterColor = (val: string) => ADAPTER_COLORS[val] ?? "#607D8B";

/* ================= IST DATE FORMAT ================= */
const toISTString = (date: Date) => {
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(date.getTime() + istOffset);

  return istDate
    .toISOString()
    .replace("T", " ")
    .replace("Z", "")
    .split(".")[0];
};

/* ================= COMPONENT ================= */
const AlarmCount: React.FC = () => {
  const reduxUser = useSelector((state: RootState) => state.user.user);
  const username = getUsername(reduxUser);

  const [data, setData] = useState<AlarmCountRow[]>(
    ADAPTERS.map((a) => ({
      adapter: a,
      nmsCount: null,
      ossCount: null,
      diff: null,
    }))
  );

  const [loadingNms, setLoadingNms] = useState<Record<string, boolean>>({});
  const [loadingOss, setLoadingOss] = useState<Record<string, boolean>>({});
  
  const [runningRecon, setRunningRecon] = useState<string | null>(null);
  const [, setLastSync] = useState<Date | null>(null);

  const [logsOpen, setLogsOpen] = useState(false);
  const [logsData, setLogsData] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedAdapter, setSelectedAdapter] = useState<string | null>(null);

  const [progressOpen, setProgressOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [duration, setDuration] = useState<number | null>(null);
  
  const [adapterLocks, setAdapterLocks] = useState<Record<string, boolean>>({});
  const [lastRunMap, setLastRunMap] = useState<Record<string, string>>({});
  const [snack, setSnack] = useState({
    open: false,
    msg: "",
    severity: "info" as "success" | "info" | "error",
  });

  const fetchOss = async (adapter: string) => {
    setLoadingOss((prev) => ({ ...prev, [adapter]: true }));

    try {
      const res = await axiosClient.get(GET_OSS_COUNT, {
        params: { adapter },
      });

      const oss = res?.data;

      if (oss !== null && oss !== undefined && !isNaN(Number(oss))) {
        setData((prev) =>
          prev.map((r) =>
            r.adapter === adapter
              ? {
                  ...r,
                  ossCount: Number(oss),
                  diff: r.nmsCount !== null ? Number(oss) - r.nmsCount : null,
                }
              : r
          )
        );
      }
    } catch {
      logActivity({
        activity: `Failed to fetch OSS count for ${adapter}`,
        actionName: "ALARM_COUNT_OSS_FAIL",
        module: "ALARM COUNT",
      });
    } finally {
      setLoadingOss((prev) => ({ ...prev, [adapter]: false }));
    }
  };

  const refreshOss = async () => {
    ADAPTERS.forEach((a) => fetchOss(a));
    setLastSync(new Date());
  };

  const fetchNms = async (adapter: string) => {
    if (ADAPTERS_NO_NMS.includes(adapter)) return; // Prevent fetching for TLMR/ADVA

    // 7-Minute Cooldown logic STRICTLY for ADVA
    if (adapter === "ADVA") {
      const now = Date.now();
      const lastHit = parseInt(localStorage.getItem(`last_api_hit_${adapter}`) || "0", 10);
      const cooldownMs = 7 * 60 * 1000; // 7 minutes

      if (now - lastHit < cooldownMs) {
        const cachedCount = localStorage.getItem(`nms_count_${adapter}`);
        if (cachedCount !== null) {
          setData((prev) =>
            prev.map((r) =>
              r.adapter === adapter
                ? {
                    ...r,
                    nmsCount: Number(cachedCount),
                    diff: r.ossCount !== null ? r.ossCount - Number(cachedCount) : null,
                  }
                : r
            )
          );
          setSnack({
            open: true,
            msg: `Using cached NMS for ADVA (7 min cooldown active)`,
            severity: "info",
          });
          return;
        }
      }
    }

    setLoadingNms((prev) => ({ ...prev, [adapter]: true }));

    try {
      const res = await axiosClient.get(GET_NMS_COUNT, {
        params: { adapter },
      });

      const nms = res?.data ?? null;

      // Only save to cache and lock cooldown if adapter is ADVA
      if (adapter === "ADVA") {
        localStorage.setItem(`nms_count_${adapter}`, String(nms));
        localStorage.setItem(`last_api_hit_${adapter}`, String(Date.now()));
      }

      setData((prev) =>
        prev.map((r) =>
          r.adapter === adapter
            ? {
                ...r,
                nmsCount: Number(nms),
                diff: r.ossCount !== null ? r.ossCount - Number(nms) : null,
              }
            : r
        )
      );
    } catch {
      setSnack({
        open: true,
        msg: `Failed to fetch NMS for ${adapter}`,
        severity: "error",
      });
    } finally {
      setLoadingNms((prev) => ({ ...prev, [adapter]: false }));
    }
  };

  const refreshNms = async () => {
    ADAPTERS.filter((a) => !ADAPTERS_NO_NMS.includes(a)).forEach((a) => fetchNms(a));
  };

  const writeReconLog = async (
    adapter: string,
    start: number,
    end: number,
    status: "SUCCESS" | "FAILED"
  ) => {
    await axiosClient.post(ADMIN_POST_RECONCILATION_LOGS, null, {
      params: {
        adapter,
        startTime: toISTString(new Date(start)),
        endTime: toISTString(new Date(end)),
        status,
        username,
      },
    });
  };

  const runReconciliation = async (adapter: string) => {
    setRunningRecon(adapter);
    setProgressOpen(true);
    setProgress(0);
    setElapsedSeconds(0);
    setDuration(null);

    const start = Date.now();
    
    // Only lock cooldown for ADVA
    if (adapter === "ADVA") {
      localStorage.setItem(`last_api_hit_${adapter}`, String(start));
    }

    let interval: NodeJS.Timeout;

    interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
      setProgress((prev) => (prev >= 95 ? prev : prev + 5));
    }, 1000);

    try {
      await axiosClient.get(ADMIN_RUN_RECONCILIATION, {
        params: { adapter },
      });

      const end = Date.now();
      clearInterval(interval);

      const totalSeconds = Math.floor((end - start) / 1000);

      setProgress(100);
      setElapsedSeconds(totalSeconds);
      setDuration(totalSeconds);

      await writeReconLog(adapter, start, end, "SUCCESS");

      setSnack({
        open: true,
        msg: `Reconciliation completed for ${adapter}`,
        severity: "success",
      });
      fetchLogs();
    } catch {
      const end = Date.now();
      clearInterval(interval);

      await writeReconLog(adapter, start, end, "FAILED");

      setSnack({
        open: true,
        msg: `Reconciliation failed for ${adapter}`,
        severity: "error",
      });
    } finally {
      setRunningRecon(null);
    }
  };

  const processLocksFromLogs = (logs: any[]) => {
    const locks: Record<string, boolean> = {};
    const lastRuns: Record<string, string> = {};
    const latestTimes: Record<string, number> = {};

    const now = Date.now();

    logs.forEach((log) => {
      const status = String(log.status || "").toUpperCase();
      if (status !== "SUCCESS") return;

      const adapter = String(log.adapter || "").toUpperCase();
      const startTimeRaw = log.start_time;

      if (!adapter || !startTimeRaw) return;

      const startTime = new Date(startTimeRaw).getTime();
      if (isNaN(startTime)) return;

      if (!latestTimes[adapter] || startTime > latestTimes[adapter]) {
        latestTimes[adapter] = startTime;
        lastRuns[adapter] = startTimeRaw;
      }
    });

    Object.keys(latestTimes).forEach((adapter) => {
      const diffMinutes = (now - latestTimes[adapter]) / (1000 * 60);

      if (diffMinutes < 30) {
        locks[adapter] = true;
      }
    });

    setAdapterLocks(locks);
    setLastRunMap(lastRuns);
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    setLogsError(null);

    try {
      const res = await axiosClient.get(ADMIN_RECON_HISTORY_LOGS);
      const data = res.data?.data || res.data || [];

      setLogsData(data);
      processLocksFromLogs(data);
    } catch {
      setLogsError("Failed to load reconciliation logs");
      setLogsData([]);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    ADAPTERS.forEach(fetchOss);
    fetchLogs();
  }, []);

  /* ================= COPY TO CLIPBOARD AS HTML/TSV ================= */
  const handleCopyTable = async () => {
    const headers = ["Adapter", "NMS Count", "OSS Count", "Difference", "Last Run"];

    // 1. TSV Format (For Notepad / Excel)
    const tsvHeader = headers.join("\t");
    const tsvBody = data.map(row => {
      const diffStr = row.diff === null ? "-" : row.diff > 0 ? `+${row.diff}` : `${row.diff}`;
      const lastRun = lastRunMap[row.adapter] ?? "-";
      return [row.adapter, ADAPTERS_NO_NMS.includes(row.adapter) ? "N/A" : (row.nmsCount ?? "-"), row.ossCount ?? "-", ADAPTERS_NO_NMS.includes(row.adapter) ? "N/A" : diffStr, lastRun].join("\t");
    }).join("\n");
    const tsvData = `${tsvHeader}\n${tsvBody}`;

    // 2. HTML Format (For Word / Outlook / Confluence with styling)
    const htmlHeader = `<tr>${headers.map(h => 
      `<th style="border: 1px solid #cbd5e1; padding: 8px; background-color: #f8fafc; text-align: left; color: #334155; font-size: 14px;">${h}</th>`
    ).join("")}</tr>`;
    
    const htmlBody = data.map(row => {
      const diffStr = row.diff === null ? "-" : row.diff > 0 ? `+${row.diff}` : `${row.diff}`;
      const diffColor = row.diff === 0 ? '#16a34a' : (row.diff === null ? '#475569' : '#dc2626');
      const lastRun = lastRunMap[row.adapter] ?? "-";
      const adapterColor = ADAPTER_COLORS[row.adapter] ?? "#607D8B";
      const nmsDisplay = ADAPTERS_NO_NMS.includes(row.adapter) ? "N/A" : (row.nmsCount ?? "-");
      const diffDisplay = ADAPTERS_NO_NMS.includes(row.adapter) ? "N/A" : diffStr;
      
      return `
      <tr>
        <td style="border: 1px solid #cbd5e1; padding: 8px; font-size: 13px; color: ${adapterColor};"><strong>${row.adapter}</strong></td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; font-size: 13px; color: #475569;">${nmsDisplay}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; font-size: 13px; color: #475569;">${row.ossCount ?? "-"}</td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; font-size: 13px; color: ${ADAPTERS_NO_NMS.includes(row.adapter) ? '#475569' : diffColor};"><strong>${diffDisplay}</strong></td>
        <td style="border: 1px solid #cbd5e1; padding: 8px; font-size: 13px; color: #475569;">${lastRun}</td>
      </tr>
    `}).join("");

    const htmlData = `
      <table style="border-collapse: collapse; width: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <thead>${htmlHeader}</thead>
        <tbody>${htmlBody}</tbody>
      </table>
    `;

    try {
      const clipboardItem = new ClipboardItem({
        "text/plain": new Blob([tsvData], { type: "text/plain" }),
        "text/html": new Blob([htmlData], { type: "text/html" })
      });
      await navigator.clipboard.write([clipboardItem]);
      setSnack({ open: true, msg: "Table copied to clipboard!", severity: "success" });
    } catch (err) {
      try {
        await navigator.clipboard.writeText(tsvData);
        setSnack({ open: true, msg: "Table text copied to clipboard!", severity: "success" });
      } catch (fallbackErr) {
        setSnack({ open: true, msg: "Failed to copy to clipboard.", severity: "error" });
      }
    }
  };

  return (
    <Box sx={{ minHeight: "100%", background: "#fff", px: 4, py: 3, display: "flex", flexDirection: "column" }}>
      {/*  COMPACT HIGH DENSITY SINGLE-LINE ENGINE HEADER SLAT */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography fontWeight={800} sx={{ fontSize: "0.82rem", color: "#1e293b", letterSpacing: "0.05em" }}>
          RECONCILIATION
        </Typography>

        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Button
            variant="outlined"
            onClick={handleCopyTable}
            startIcon={<ContentCopyIcon sx={{ width: 14, height: 14 }} />}
            sx={{ height: 32, fontSize: "0.72rem", textTransform: "none", fontWeight: 700, color: "#475569", borderColor: "#cbd5e1" }}
          >
            Copy Data
          </Button>

          <Button
            variant="outlined"
            onClick={() => {
              setLogsOpen(true);
              fetchLogs();
            }}
            sx={{ height: 32, fontSize: "0.72rem", textTransform: "none", fontWeight: 700, color: "#475569", borderColor: "#cbd5e1" }}
          >
            Reconciliation Logs
          </Button>

          <Button
            variant="contained"
            startIcon={<RefreshIcon sx={{ width: 14, height: 14 }} />}
            onClick={refreshNms}
            sx={{ height: 32, fontSize: "0.72rem", textTransform: "none", fontWeight: 700, backgroundColor: "#0f766e", "&:hover": { backgroundColor: "#115e59" }, boxShadow: "none" }}
          >
            Refresh NMS
          </Button>

          <Button
            variant="contained"
            startIcon={<RefreshIcon sx={{ width: 14, height: 14 }} />}
            onClick={refreshOss}
            sx={{ height: 32, fontSize: "0.72rem", textTransform: "none", fontWeight: 700, backgroundColor: "#1e293b", boxShadow: "none" }}
          >
            Refresh OSS
          </Button>
        </Box>
      </Box>

      <Divider sx={{ mb: 2, borderColor: "#f1f5f9" }} />

      {/* GRID COLUMN LABELS ROW */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr 2fr 1fr",
          textAlign: "center",
          fontWeight: 700,
          mb: 1.5,
          py: 1,
          backgroundColor: "#f8fafc",
          borderRadius: "6px",
          borderBottom: "1px solid #e2e8f0"
        }}
      >
        <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Adapter</Typography>
        <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>NMS</Typography>
        <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>OSS</Typography>
        <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Difference</Typography>
        <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Last Run</Typography>
        <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: "#475569", textTransform: "uppercase" }}>Run</Typography>
      </Box>

      {/* CORE ADAPTER RECORDS ROW TRACK CONTAINER */}
      <Box sx={{ flex: 1, overflowY: "auto" }}>
        {data.map((row) => {
          const color = getAdapterColor(row.adapter);
          const isReconEnabled = RECON_ENABLED_ADAPTERS.includes(row.adapter);
          const isLocked = adapterLocks[row.adapter];
          const isRunning = runningRecon === row.adapter;
          const isNmsDisabled = ADAPTERS_NO_NMS.includes(row.adapter);

          return (
            <Box
              key={row.adapter}
              sx={{
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
                p: "10px 0",
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr 1fr 2fr 1fr",
                alignItems: "center",
                justifyItems: "center",
                mb: 1.2,
                backgroundColor: "#ffffff",
                transition: "all 0.15s ease",
                borderLeft: `4px solid ${color}`,
                "&:hover": { backgroundColor: "#f8fafc" }
              }}
            >
              {/* ADAPTER BADGE LABEL */}
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: "0.7rem",
                  color: "#fff",
                  backgroundColor: color,
                  px: 1.5,
                  py: 0.2,
                  borderRadius: "6px",
                }}
              >
                {row.adapter}
              </Typography>

              {/* NMS CELL CONTROLLER (WITH BLUR FOR TLMR/ADVA) */}
              <Box>
                {row.nmsCount === null ? (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => fetchNms(row.adapter)}
                    disabled={loadingNms[row.adapter] || isNmsDisabled || isRunning}
                    sx={{ 
                      height: 24, 
                      fontSize: "0.65rem", 
                      textTransform: "none", 
                      fontWeight: 700,
                      ...(isNmsDisabled && {
                        filter: "blur(1.5px)",
                        opacity: 0.6,
                        pointerEvents: "none"
                      })
                    }}
                  >
                    {loadingNms[row.adapter] ? <CircularProgress size={12} /> : "Get NMS"}
                  </Button>
                ) : (
                  <Typography sx={{ fontWeight: 700, fontSize: "0.75rem", color: "#334155" }}>
                    {isNmsDisabled ? "-" : row.nmsCount}
                  </Typography>
                )}
              </Box>

              {/* OSS PROCESS COUNTER SLOTS */}
              <Box>
                {loadingOss[row.adapter] ? (
                  <CircularProgress size={14} sx={{ color }} />
                ) : (
                  <Typography sx={{ fontWeight: 700, fontSize: "0.75rem", color: "#334155" }}>
                    {row.ossCount ?? "-"}
                  </Typography>
                )}
              </Box>

              {/* VARIANCE RECON DIFFERENCE FIELD TEXT MARKER */}
              <Typography
                sx={{
                  fontWeight: 900,
                  fontSize: "0.75rem",
                  color: isNmsDisabled ? "#94a3b8" : (row.diff === 0 ? "#16a34a" : "#dc2626"),
                }}
              >
                {isNmsDisabled
                  ? "-"
                  : row.diff === null
                  ? "-"
                  : row.diff === 0
                  ? "0"
                  : row.diff > 0
                  ? `+${row.diff}`
                  : row.diff}
              </Typography>

              {/* ORIGINAL TRACE LOG TIME STAMP METADATA */}
              <Typography sx={{ fontWeight: 700, fontSize: "0.72rem", color: "#475569" }}>
                {lastRunMap[row.adapter] ?? "-"}
              </Typography>

              {/* ACTION PIPELINE TRIGGER CONTROLLERS */}
              <IconButton
                onClick={() => {
                  if (isReconEnabled) {
                    // Only apply 7 min cooldown check for ADVA
                    if (row.adapter === "ADVA") {
                      const lastHit = parseInt(localStorage.getItem(`last_api_hit_${row.adapter}`) || "0", 10);
                      if (Date.now() - lastHit < 7 * 60 * 1000) {
                        setSnack({
                          open: true,
                          msg: `Cooldown active. Please wait 7 minutes before running recon for ADVA.`,
                          severity: "info",
                        });
                        return;
                      }
                    }
                    setSelectedAdapter(row.adapter);
                    setConfirmOpen(true);
                  }
                }}
                disabled={isRunning || !isReconEnabled || isLocked}
                sx={{
                  color: isRunning ? "transparent" : color,
                  backgroundColor: isRunning || !isReconEnabled || isLocked ? "transparent" : `${color}12`,
                  p: "4px",
                  "&:hover": { backgroundColor: `${color}20` },
                  "&.Mui-disabled": { color: "#cbd5e1" }
                }}
              >
                {isRunning ? (
                  <CircularProgress size={16} sx={{ color }} />
                ) : (
                  <PlayArrowIcon sx={{ width: 18, height: 18 }} />
                )}
              </IconButton>
            </Box>
          );
        })}
      </Box>

      {/* CONFIRM ACTIONS STAGING OVERLAYS */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} PaperProps={{ sx: { borderRadius: "12px" } }}>
        <DialogTitle sx={{ fontSize: "0.82rem", fontWeight: 700, textTransform: "uppercase", color: "#1e293b", pb: 1 }}>
          Confirm Reconciliation
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: "0.75rem", color: "#475569", lineHeight: 1.5 }}>
            Are you sure you want to run reconciliation?
            <br />
            This process may take time and affect existing data.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 1.5, gap: 1 }}>
          <Button onClick={() => setConfirmOpen(false)} sx={{ fontSize: "0.72rem", textTransform: "none", fontWeight: 700, color: "#64748b" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              if (selectedAdapter) {
                runReconciliation(selectedAdapter);
              }
              setConfirmOpen(false);
            }}
            sx={{ fontSize: "0.72rem", textTransform: "none", fontWeight: 700, px: 2.5, backgroundColor: getAdapterColor(selectedAdapter || ""), boxShadow: "none" }}
          >
            Yes, Run
          </Button>
        </DialogActions>
      </Dialog>

      {/* HISTORICAL RECON RECORD GRID LAYERS */}
      <Dialog open={logsOpen} onClose={() => setLogsOpen(false)} fullWidth maxWidth="lg" PaperProps={{ sx: { borderRadius: "12px" } }}>
        <DialogContent sx={{ p: 0 }}>
          <ReconciliationLogs
            loading={logsLoading}
            error={logsError}
            data={logsData}
            tableId={TABLE_ID}
            onRetry={fetchLogs}
          />
        </DialogContent>
      </Dialog>

      <ReconProgressBar
        open={progressOpen}
        adapter={runningRecon ?? selectedAdapter ?? ""}
        running={runningRecon !== null}
        progress={progress}
        elapsedSeconds={elapsedSeconds}
        duration={duration}
        onClose={() => setProgressOpen(false)}
      />

      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert severity={snack.severity} onClose={() => setSnack({ ...snack, open: false })} variant="filled" sx={{ fontSize: "0.72rem", fontWeight: 700, borderRadius: "8px" }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AlarmCount;