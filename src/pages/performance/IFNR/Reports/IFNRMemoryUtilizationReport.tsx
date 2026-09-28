import React, { useEffect, useMemo, useState } from "react";
import { Box, Divider } from "@mui/material";
import { useOutletContext, useParams } from "react-router-dom";

import axiosClient from "@/api/axiosClient";
import {
  FETCH_PERFORMANCE_IFNR_MEMORY_REPORT,
  FETCH_PERFORMANCE_IFNR_MEMORY_PLOT,
} from "@/api/apis";

import PerformanceFilterBar from "../../components/PerformanceFilterBar";
import PerformanceTable from "../../components/PerformanceTable";
import ExcelDownloadButton from "../../../../components/common/ExcelDownloadButton";
import ErrorState from "../../../../components/common/ErrorState";
import FullPageLoader from "../../../../components/common/FullPageLoader";
import CommonChartModal from "../../components/CommonChartModal";
import { logActivity } from "../../../../utils/activityLogger";

/* ================= TYPES ================= */
type OutletContextType = { open: boolean };
type DbType = "live" | "current" | "historic";

/* ================= CONSTANTS ================= */
const TABLE_ID = "ifnr-memory-utilization-report";

/* ================= COMPONENT ================= */
const IFNRMemoryUtilizationReport: React.FC = () => {
  const { client } = useParams<{ client: string }>();
  const { open, setOpen } = useOutletContext<{ open: boolean; setOpen: React.Dispatch<React.SetStateAction<boolean>> }>();

  if (!client) {
    return (
      <ErrorState
        title="IFNR Memory Report"
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

  /* ---------- GRAPH ---------- */
  const [chartOpen, setChartOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [plotData, setPlotData] = useState<any[]>([]);
  const [plotLoading, setPlotLoading] = useState(false);

  useEffect(() => {
    logActivity({
      activity: `IFNR Memory Utilization Report page opened | Client=${clientLabel}`,
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
        FETCH_PERFORMANCE_IFNR_MEMORY_REPORT,
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
      setError(`Failed to fetch IFNR ${clientLabel} Memory Utilization data`);
    } finally {
      setLoading(false);
    }
  };

  /* ================= FETCH GRAPH ================= */
  const fetchMemoryPlot = async (row: any) => {
    setPlotLoading(true);
    try {
      const res = await axiosClient.get(
        FETCH_PERFORMANCE_IFNR_MEMORY_PLOT,
        {
          params: {
            client,
            nodeName: row["DEVICE NAME"],
            interfaceName: row["EQUIPMENT NAME"],
            dbType,
            fromTime: dbType === "live" ? "" : fromTime,
            toTime: dbType === "live" ? "" : toTime,
          },
        }
      );

      const rows = Array.isArray(res.data)
        ? res.data
        : res.data?.data || [];

      setPlotData(rows);
    } catch {
      setPlotData([]);
    } finally {
      setPlotLoading(false);
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
          message={`Loading IFNR ${clientLabel} Memory Utilization data...`}
        />
      )}

      <PerformanceFilterBar
        title={`IFNR ${clientLabel} - MEMORY UTILIZATION REPORT`}
        dbType={dbType}
        setDbType={setDbType}
        fromTime={fromTime}
        toTime={toTime}
        setFromTime={setFromTime}
        setToTime={setToTime}
        onToggleSidebar={() => setOpen((prev) => !prev)}
        isSidebarOpen={open}
        onView={fetchReport}
        rightActions={
          <ExcelDownloadButton
            data={data}
            columnOrder={columns}
            tableId={TABLE_ID}
            fileName={`IFNR_${clientLabel}_Memory_Utilization_Report`}
          />
        }
      />

      <Divider sx={{ my: 1, borderColor: "#e2e8f0" }} />

      {/*  FIXED STRUCTURAL FLEX VIEWPORT FRAME */}
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
            title={`IFNR ${clientLabel} - MEMORY UTILIZATION REPORT`}
            message={error}
            severity="info"
            onRetry={fetchReport}
          />
        ) : (
          <PerformanceTable
            data={data}
            columns={columns}
            tableId={TABLE_ID}
            onRowClick={async (row) => {
              setSelectedRow(row);
              setChartOpen(true);
              await fetchMemoryPlot(row);
            }}
          />
        )}
      </Box>

      <CommonChartModal
        open={chartOpen}
        onClose={() => setChartOpen(false)}
        loading={plotLoading}
        title={
          selectedRow
            ? `IFNR ${clientLabel} Memory Utilization | ${selectedRow["DEVICE NAME"]} / ${selectedRow["EQUIPMENT NAME"]}`
            : `IFNR ${clientLabel} Memory Utilization`
        }
        data={plotData}
        xKey="timeseries"
        xAxisLabel="Duration"
        yAxisLabel="Memory Utilization (%)"
        series={[
          {
            key: "currUtil",
            label: "Memory Utilization",
            color: "#2563eb", // Balanced enterprise layout line configuration code
          },
        ]}
        tableColumns={[
          { key: "timeseries", label: "Time" },
          { key: "currUtil", label: "Memory Util (%)" },
        ]}
      />
    </Box>
  );
};

export default IFNRMemoryUtilizationReport;