import React, { useEffect, useState } from "react";
import { Box, Divider, Snackbar, Alert } from "@mui/material";

import axiosClient from "@/api/axiosClient";
import {
  ADMIN_RECON_HISTORY_LOGS,
  ADMIN_RUN_RECONCILIATION,
  ADMIN_POST_RECONCILATION_LOGS,
} from "@/api/apis";

import FullPageLoader from "../../../components/common/FullPageLoader";
import ReconciliationLogs from "./ReconciliationLogs";
import ReconProgressBar from "./component/ReconProgressBar";
import { logActivity } from "../../../utils/activityLogger";
import { useSelector } from "react-redux";
import { RootState } from "../../../store/store";
import { getUser } from "../../../utils/auth/auth";
import ReconActionBar from "./component/ReconActionBar";
import { getUsername } from "../../../utils/auth/getUsername";

/* ================= CONSTANTS ================= */
const TABLE_ID = "reconciliation-logs-table";
const ADAPTERS = ["CONC", "IFNR", "MCP"];


const ReconciliationSettingsPage: React.FC = () => {
  const [adapter, setAdapter] = useState("");
  const [tableData, setTableData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const reduxUser = useSelector((state: RootState) => state.user.user);
  const username = getUsername(reduxUser);
  const [running, setRunning] = useState(false);
  const [progressOpen, setProgressOpen] = useState(false);
  const [progress, setProgress] = useState(0);

  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [duration, setDuration] = useState<number | null>(null);

  const [error, setError] = useState<string | null>(null);

  const [snack, setSnack] = useState<{
    open: boolean;
    msg: string;
    severity: "success" | "info" | "error";
  }>({
    open: false,
    msg: "",
    severity: "info",
  });
  const toISTString = (date: Date) => {
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(date.getTime() + istOffset);

    return istDate
      .toISOString()
      .replace("T", " ")
      .replace("Z", "")
      .split(".")[0]; // remove milliseconds
  };

  /* ================= FETCH LOGS ================= */
  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await axiosClient.get(ADMIN_RECON_HISTORY_LOGS);
      const data = res.data?.data || res.data || [];

      const normalized = data.map((row: any) =>
        Array.isArray(row)
          ? {
            adapter: row[1],
            vendor: row[2],
            startTime: row[3],
            endTime: row[4],
            status: row[6],
          }
          : row
      );

      setTableData(normalized);
    } catch {
      setError("Failed to load reconciliation logs");
      setTableData([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    logActivity({
      activity: "Reconciliation Settings page opened",
      actionName: "RECON_PAGE",
      module: "RECONCILIATION",
    });
  }, []);

  useEffect(() => {
    fetchLogs();
  }, []);

  /* ================= LIVE TIMER ================= */
  useEffect(() => {
    if (!running || !startTime) return;

    const timer = setInterval(() => {
      setElapsedSeconds(
        Math.floor((Date.now() - startTime) / 1000)
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [running, startTime]);

  /* ================= PROGRESS SIMULATION ================= */
  useEffect(() => {
    if (!running) return;

    setProgress(0);

    const timer = setInterval(() => {
      setProgress((prev) => (prev < 90 ? prev + 5 : prev));
    }, 800);

    return () => clearInterval(timer);
  }, [running]);

  const writeReconLogs = async ({
    adapter,
    startTime,
    endTime,
    status,
  }: {
    adapter: string;
    startTime: string;
    endTime: string;
    status: "SUCCESS" | "FAILED";
  }) => {
    await axiosClient.post(ADMIN_POST_RECONCILATION_LOGS, null, {
      params: {
        adapter,
        startTime,
        endTime,
        status,
        username,
      },
    });
  };



  const runReconciliation = async () => {
    if (!adapter) {
      setSnack({
        open: true,
        msg: "Please select an adapter",
        severity: "error",
      });
      return;
    }

    const startedAt = Date.now();
    const startTimeStr = toISTString(new Date(startedAt));

    try {
      setStartTime(startedAt);
      setElapsedSeconds(0);
      setDuration(null);
      setProgress(0);

      setRunning(true);
      setProgressOpen(true);

      await axiosClient.get(ADMIN_RUN_RECONCILIATION, {
        params: { adapter },
      });

      const endedAt = Date.now();
      const endTimeStr = toISTString(new Date(endedAt));
      const totalSeconds = Math.floor((endedAt - startedAt) / 1000);

      setProgress(100);
      setDuration(totalSeconds);

      await writeReconLogs({
        adapter,
        startTime: startTimeStr,
        endTime: endTimeStr,
        status: "SUCCESS",
      });

      setSnack({
        open: true,
        msg: `Reconciliation completed in ${totalSeconds} seconds`,
        severity: "success",
      });

      fetchLogs();
    } catch (err) {
      const failedAt = Date.now();
      const endTimeStr = toISTString(new Date(failedAt));

      await writeReconLogs({
        adapter,
        startTime: startTimeStr,
        endTime: endTimeStr,
        status: "FAILED",
      });

      setSnack({
        open: true,
        msg: "Reconciliation failed. Please try again.",
        severity: "error",
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <Box
      sx={{
        height: "calc(100vh - 5vh)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        p: 2,
        bgcolor: "#ffffff",
      }}
    >
      {loading && <FullPageLoader message="Loading data..." />}

      <ReconActionBar
        adapter={adapter}
        adapters={ADAPTERS}
        running={running}
        onAdapterChange={setAdapter}
        onRun={runReconciliation}
      />

      <Divider sx={{ my: 2 }} />

      <ReconciliationLogs
        loading={loading}
        error={error}
        data={tableData}
        tableId={TABLE_ID}
        onRetry={fetchLogs}
      />

      {/* ================= PROGRESS OVERLAY ================= */}
      <ReconProgressBar
        open={progressOpen}
        adapter={adapter}
        running={running}
        progress={progress}
        elapsedSeconds={elapsedSeconds}
        duration={duration}
        onClose={() => setProgressOpen(false)}
      />

      <Snackbar
        open={snack.open}
        autoHideDuration={5000}
        onClose={() => setSnack({ ...snack, open: false })}
      >
        <Alert
          severity={snack.severity}
          onClose={() => setSnack({ ...snack, open: false })}
        >
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ReconciliationSettingsPage;
