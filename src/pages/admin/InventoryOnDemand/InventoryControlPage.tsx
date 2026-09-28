import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  LinearProgress,
  Chip,
} from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";

import { useSelector } from "react-redux";
import { getUsername } from "../../../utils/auth/getUsername";
import { RootState } from "../../../store/store";
import axiosClient from "@/api/axiosClient";
import { INVENTORY_ON_DEMAND_LOGS, INVENTORY_ON_DEMAND_RUN } from "@/api/apis";

/* ================= VENDORS ================= */
const VENDORS = ["MCP", "NFMT", "EPNM", "CONC", "ADVA", "IFNR", "TLMR"];

const getVendorColor = (val: string) =>
  val === "MCP" ? "#009688" :
  val === "NFMT" ? "#8283eb" :
  val === "EPNM" ? "#4CAF50" :
  val === "CONC" ? "#FF9800" :
  val === "ADVA" ? "#9C27B0" :
  val === "IFNR" ? "#3F51B5" :
  val === "TLMR" ? "#E91E63" :
  "#607D8B";

/* ================= HELPERS ================= */
const formatTime = (val?: string) => {
  if (!val) return "-";
  const d = new Date(val);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getDuration = (start?: string, end?: string) => {
  if (!start || !end) return "-";
  const diff = new Date(end).getTime() - new Date(start).getTime();
  const sec = Math.floor(diff / 1000);
  const min = Math.floor(sec / 60);
  return min > 0 ? `${min}m ${sec % 60}s` : `${sec}s`;
};

const isRestrictedTime = () => {
  const now = new Date();
  const start = new Date();
  start.setHours(9, 55, 0);
  const end = new Date();
  end.setHours(10, 30, 0);
  return now >= start && now <= end;
};

/* ================= COMPONENT ================= */
const InventoryControlPage: React.FC = () => {
  const reduxUser = useSelector((state: RootState) => state.user.user);
  const username = getUsername(reduxUser);

  const [runningVendor, setRunningVendor] = useState<string | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const [locks, setLocks] = useState<Record<string, boolean>>({});
  const [detailsMap, setDetailsMap] = useState<Record<string, any>>({});
  const [avgTimeMap, setAvgTimeMap] = useState<Record<string, string>>({});

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);

  const [snack, setSnack] = useState({
    open: false,
    msg: "",
    severity: "info" as "success" | "error",
  });

  /* ================= FETCH LOGS ================= */
  const fetchLogs = async () => {
    try {
      const res = await axiosClient.get(INVENTORY_ON_DEMAND_LOGS);
      const data = res.data?.data || res.data || [];

      const latest: any = {};
      const lockMap: any = {};
      const details: any = {};
      const avgMap: any = {};
      const now = Date.now();

      data.forEach((log: any) => {
        const v = log.vendor;
        const start = new Date(log.start_time).getTime();

        if (!latest[v] || start > latest[v]) {
          latest[v] = start;

          details[v] = {
            start: log.start_time,
            end: log.end_time,
            status: log.status,
          };
        }

        // calculate avg duration
        if (log.start_time && log.end_time) {
          const dur = new Date(log.end_time).getTime() - new Date(log.start_time).getTime();
          if (!avgMap[v]) avgMap[v] = [];
          avgMap[v].push(dur);
        }
      });

      Object.keys(latest).forEach((v) => {
        const diff = (now - latest[v]) / (1000 * 60);
        if (diff < 30) lockMap[v] = true;
      });

      // calculate avg time
      const avgTime: any = {};
      Object.keys(avgMap).forEach((v) => {
        const arr = avgMap[v];
        const avg = arr.reduce((a: number, b: number) => a + b, 0) / arr.length;
        const sec = Math.floor(avg / 1000);
        const min = Math.floor(sec / 60);
        avgTime[v] = min > 0 ? `${min}m ${sec % 60}s` : `${sec}s`;
      });

      setLocks(lockMap);
      setDetailsMap(details);
      setAvgTimeMap(avgTime);
    } catch {}
  };

  /* ================= RUN ================= */
  const runInventory = async (vendor: string) => {
    setRunningVendor(vendor);
    const startTime = new Date().toISOString();

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setProgressMap((prev) => ({ ...prev, [vendor]: progress }));
      if (progress >= 90) clearInterval(interval);
    }, 400);

    try {
      await axiosClient.post(INVENTORY_ON_DEMAND_RUN, null, {
        params: { adapter: vendor },
      });

      const endTime = new Date().toISOString();

      await axiosClient.post(INVENTORY_ON_DEMAND_LOGS, null, {
        params: {
          vendor,
          startTime,
          endTime,
          status: "SUCCESS",
          username,
        },
      });

      setSnack({
        open: true,
        msg: `Inventory completed for ${vendor}`,
        severity: "success",
      });

      fetchLogs();
    } catch {
      const endTime = new Date().toISOString();

      await axiosClient.post(INVENTORY_ON_DEMAND_LOGS, null, {
        params: {
          vendor,
          startTime,
          endTime,
          status: "FAILED",
          username,
        },
      });

      setSnack({
        open: true,
        msg: `Inventory failed for ${vendor}`,
        severity: "error",
      });
    }

    setTimeout(() => {
      setRunningVendor(null);
      setProgressMap((prev) => ({ ...prev, [vendor]: 0 }));
    }, 1200);
  };

  useEffect(() => {
    fetchLogs();
    const i = setInterval(fetchLogs, 60000);
    return () => clearInterval(i);
  }, []);

  const restricted = isRestrictedTime();

  return (
    <Box sx={{ minHeight: "100vh", px: 4, py: 3, background: "#f8fafc" }}>
      <Typography fontSize="1.6rem" fontWeight={800} mb={2}>
        INVENTORY CONTROL
      </Typography>

      {restricted && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Disabled between 9:55–10:30 AM (Scheduled Run)
        </Alert>
      )}

      <Divider sx={{ mb: 3 }} />

      {/* HEADER */}
      <Box sx={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr",
        px: 2,
        mb: 2,
        fontSize: "0.8rem",
        fontWeight: 700
      }}>
        <Typography>Vendor</Typography>
        <Typography>Status</Typography>
        <Typography>Start</Typography>
        <Typography>End</Typography>
        <Typography>Duration</Typography>
        <Typography>Avg Time</Typography>
        <Typography>Progress</Typography>
        <Typography>Action</Typography>
      </Box>

      {/* ROWS */}
      {VENDORS.map((vendor) => {
        const d = detailsMap[vendor] || {};
        const progress = progressMap[vendor] || 0;

        return (
          <Box key={vendor} sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr",
            alignItems: "center",
            mb: 2,
            p: 3,
            borderRadius: "14px",
            background: d.status === "FAILED" ? "#fff1f2" : "#fff",
            borderLeft: `5px solid ${getVendorColor(vendor)}`,
          }}>
            <Typography fontWeight={800}>{vendor}</Typography>

            <Chip label={d.status || "-"} size="small" />

            <Typography>{formatTime(d.start)}</Typography>
            <Typography>{formatTime(d.end)}</Typography>
            <Typography>{getDuration(d.start, d.end)}</Typography>
            <Typography>{avgTimeMap[vendor] || "-"}</Typography>

            <LinearProgress value={progress} variant="determinate" />

            <Button
              size="small"
              onClick={() => {
                setSelectedVendor(vendor);
                setConfirmOpen(true);
              }}
              disabled={runningVendor === vendor || restricted}
            >
              Run
            </Button>
          </Box>
        );
      })}

      {/* CONFIRM */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirm</DialogTitle>
        <DialogContent>
          Run inventory for {selectedVendor}?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              if (selectedVendor) runInventory(selectedVendor);
              setConfirmOpen(false);
            }}
          >
            Run
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={4000}>
        <Alert severity={snack.severity}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
};

export default InventoryControlPage;