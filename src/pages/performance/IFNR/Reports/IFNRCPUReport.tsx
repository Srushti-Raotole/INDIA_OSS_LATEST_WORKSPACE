import React, { useEffect, useState } from "react";
import { Box, Divider } from "@mui/material";
import { useOutletContext, useParams } from "react-router-dom";

import axiosClient from "@/api/axiosClient";
import {
  FETCH_PERFORMANCE_INFR_CPU_REPORT,
  FETCH_PERFORMANCE_INFR_CPU_PLOT,
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
const TABLE_ID = "ifnr-cpu-utilization-report";

/* ================= COMPONENT ================= */
const IFNRCPUReport: React.FC = () => {
  const { client } = useParams<{ client: string }>();
  const { open, setOpen } = useOutletContext<{ open: boolean; setOpen: React.Dispatch<React.SetStateAction<boolean>> }>();

  if (!client) {
    return (
      <ErrorState
        title="IFNR CPU Report"
        message="Client context parameters were not provided within routing endpoints."
        severity="error"
      />
    );
  }

  const clientLabel = decodeURIComponent(client).toUpperCase();

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
        FETCH_PERFORMANCE_INFR_CPU_REPORT,
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
      setError(`Failed to fetch IFNR ${clientLabel} CPU utilization data`);
    } finally {
      setLoading(false);
    }
  };

  /* ================= FETCH GRAPH ================= */
  const fetchCpuPlot = async (row: any) => {
    setPlotLoading(true);
    try {
      const res = await axiosClient.get(
        FETCH_PERFORMANCE_INFR_CPU_PLOT,
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

  useEffect(() => {
    logActivity({
      activity: `IFNR CPU Utilization Report page opened | Client=${clientLabel}`,
      actionName: "IFNR_CPU_REPORT",
      module: "PERFORMANCE",
    });
  }, [clientLabel]);

  /* ================= AUTO LOAD ================= */
  useEffect(() => {
    fetchReport();
  }, [client]);

  return (
    <Box sx={{ height: "100%", width: "100%", backgroundColor: "#ffffff", p: 2, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {loading && (
        <FullPageLoader
          message={`Loading IFNR ${clientLabel} CPU utilization data...`}
        />
      )}

      <PerformanceFilterBar
        title={`IFNR ${clientLabel} – CPU UTILIZATION REPORT`}
        dbType={dbType}
        setDbType={setDbType}
        fromTime={fromTime}
        toTime={toTime}
        setFromTime={setFromTime}
        onToggleSidebar={() => setOpen((prev) => !prev)}
        isSidebarOpen={open}
        setToTime={setToTime}
        onView={fetchReport}
        rightActions={
          <ExcelDownloadButton
            data={data}
            columnOrder={columns}
            tableId={TABLE_ID}
            fileName={`IFNR_${clientLabel}_CPU_Utilization_Report`}
          />
        }
      />

      <Divider sx={{ my: 1, borderColor: "#e2e8f0" }} />

      {/*  FIXED STRUCTURAL VIEWPORT FRAME: Stops the lower table pagination footer from clipping */}
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
            title={`IFNR ${clientLabel} – CPU UTILIZATION REPORT`}
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
              await fetchCpuPlot(row);
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
            ? `CPU Utilization | ${selectedRow["DEVICE NAME"]} / ${selectedRow["EQUIPMENT NAME"]}`
            : "CPU Utilization"
        }
        data={plotData}
        xKey="timeseries"
        xAxisLabel="Duration"
        yAxisLabel="CPU Util (%)"
        series={[
          {
            key: "currUtil",
            label: "CPU Utilization",
            color: "#dc2626", // Clean desaturated line trace match color
          },
        ]}
        tableColumns={[
          { key: "timeseries", label: "Time" },
          { key: "currUtil", label: "CPU Utilization (%)" },
        ]}
      />
    </Box>
  );
};

export default IFNRCPUReport;