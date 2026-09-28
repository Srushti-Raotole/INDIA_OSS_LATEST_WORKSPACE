import React, { useEffect, useState } from "react";
import { Box, Divider } from "@mui/material";
import { useOutletContext, useParams } from "react-router-dom";

import axiosClient from "@/api/axiosClient";
import {
  FETCH_PERFORMANCE_IFNR_SPANLOSS_REPORT,
} from "@/api/apis";

import PerformanceFilterBar from "../../components/PerformanceFilterBar";
import PerformanceTable from "../../components/PerformanceTable";
import ExcelDownloadButton from "../../../../components/common/ExcelDownloadButton";
import ErrorState from "../../../../components/common/ErrorState";
import FullPageLoader from "../../../../components/common/FullPageLoader";
import { logActivity } from "../../../../utils/activityLogger";

/* ================= TYPES ================= */
type OutletContextType = { open: boolean };
type DbType = "live" | "current" | "historic";

/* ================= CONSTANTS ================= */
const TABLE_ID = "ifnr-spanloss-report";

/* ================= COMPONENT ================= */
const IFNRSpanlossReport: React.FC = () => {
  const { client } = useParams<{ client: string }>();
  const { open, setOpen } = useOutletContext<{ open: boolean; setOpen: React.Dispatch<React.SetStateAction<boolean>> }>();

  if (!client) {
    return (
      <ErrorState
        title="IFNR Spanloss Report"
        message="Client parameter missing from endpoint routing mapping context."
        severity="error"
      />
    );
  }

  const clientLabel = decodeURIComponent(client!).toUpperCase();

  /* ---------- TABLE ---------- */
  const [data, setData] = useState<Record<string, any>[]>([]);
  const [columns, setColumns] = useState<string[]>([]);

  /* ---------- TIME ---------- */
  const [dbType, setDbType] = useState<DbType>("live");
  const [fromTime, setFromTime] = useState("");
  const [toTime, setToTime] = useState("");

  /* ---------- UI ---------- */
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    logActivity({
      activity: `IFNR Spanloss Report page opened | Client=${clientLabel}`,
      actionName: "IFNR_REPORT",
      module: "PERFORMANCE",
    });
  }, [client, clientLabel]);

  /* ================= AUTO DATE ================= */
  useEffect(() => {
    const today = new Date();
    const fmt = (d: Date) => d.toISOString().slice(0, 10);

    if (dbType === "live") {
      setFromTime("");
      setToTime("");
    } else if (dbType === "current") {
      const t = fmt(today);
      setFromTime(`${t} 00:00`);
      setToTime(`${t} 23:59`);
    } else {
      const from = new Date(today);
      from.setDate(today.getDate() - 3);
      const to = new Date(today);
      to.setDate(today.getDate() - 1);

      setFromTime(`${fmt(from)} 00:00`);
      setToTime(`${fmt(to)} 23:59`);
    }
  }, [dbType]);

  /* ================= FETCH TABLE ================= */
  const fetchReport = async () => {
    setError(null);
    setLoading(true);

    try {
      const res = await axiosClient.get(
        FETCH_PERFORMANCE_IFNR_SPANLOSS_REPORT,
        {
          params: {
            client,
            dbType,
            fromTime: dbType === "live" ? "" : fromTime,
            toTime: dbType === "live" ? "" : toTime,
          },
        }
      );

      const rows = Array.isArray(res.data)
        ? res.data
        : res.data?.data || [];

      if (!rows.length) {
        setData([]);
        setColumns([]);
        setError("No data available");
        return;
      }

      setData(rows);
      setColumns(Object.keys(rows[0]));
    } catch {
      setError(`Failed to fetch IFNR ${clientLabel} Spanloss data`);
    } finally {
      setLoading(false);
    }
  };

  /* ================= AUTO LOAD ================= */
  useEffect(() => {
    fetchReport();
  }, [client]);

  return (
    <Box sx={{ height: "100%", width: "100%", backgroundColor: "#ffffff", p: 2, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {loading && (
        <FullPageLoader
          message={`Loading IFNR ${clientLabel} Spanloss data...`}
        />
      )}

      <PerformanceFilterBar
        title={`IFNR ${clientLabel} - SPANLOSS REPORT`}
        dbType={dbType}
        setDbType={setDbType}
        fromTime={fromTime}
        onToggleSidebar={() => setOpen((prev) => !prev)}
        isSidebarOpen={open}
        toTime={toTime}
        setFromTime={setFromTime}
        setToTime={setToTime}
        onView={fetchReport}
        rightActions={
          <ExcelDownloadButton
            data={data}
            columnOrder={columns}
            tableId={TABLE_ID}
            fileName={`IFNR_${clientLabel}_Spanloss_Report`}
          />
        }
      />

      <Divider sx={{ my: 1, borderColor: "#e2e8f0" }} />

      {/*  FIXED STRUCTURAL VIEWPORT CONTAINER FOR FLUID SCROLLBAR LIFTS */}
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}
      >
        {error ? (
          <ErrorState
            title={`IFNR ${clientLabel} - SPANLOSS REPORT`}
            message={error}
            severity="info"
            onRetry={fetchReport}
          />
        ) : (
          <PerformanceTable
            data={data}
            columns={columns}
            tableId={TABLE_ID}
          />
        )}
      </Box>
    </Box>
  );
};

export default IFNRSpanlossReport;