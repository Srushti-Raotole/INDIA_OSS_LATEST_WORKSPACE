import React, { useEffect, useMemo, useState } from "react";
import { Box, Divider } from "@mui/material";
import { useOutletContext, useParams } from "react-router-dom";

import axiosClient from "@/api/axiosClient";
import {
  FETCH_PERFORMANCE_ADVA_TEMPERATURE_REPORT,
  FETCH_PERFORMANCE_ADVA_TEMPERATURE_SPANFILTER,
  FETCH_PERFORMANCE_ADVA_TEMPERATURE_PLOT,
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

const TABLE_ID = "adva-temperature-report";

/* ================= COMPONENT ================= */
const AdvaTemperatureReport: React.FC = () => {
  const { client } = useParams<{ client: string }>();
  const { open, setOpen } = useOutletContext<{ open: boolean; setOpen: React.Dispatch<React.SetStateAction<boolean>> }>();

  const clientLabel = decodeURIComponent(client || "").toUpperCase();

  /* ---------- TABLE ---------- */
  const [data, setData] = useState<Record<string, any>[]>([]);
  const [columns, setColumns] = useState<string[]>([]);

  /* ---------- SPAN FILTER ---------- */
  const [spans, setSpans] = useState<string[]>([]);
  const [selectedSpan, setSelectedSpan] = useState<string>("ALL");

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
    if (client) {
      logActivity({
        activity: `ADVA Temperature Report page opened | Client=${clientLabel}`,
        actionName: "TEMPERATURE_REPORT",
        module: "PERFORMANCE",
      });
    }
  }, [client, clientLabel]);

  /* ================= LOAD SPAN LIST ================= */
useEffect(() => {
  if (!client) return;

  axiosClient
    .get(FETCH_PERFORMANCE_ADVA_TEMPERATURE_SPANFILTER, {
      params: { client },
    })
    .then((res) => {
      const rows = Array.isArray(res.data) ? res.data : [];
      setSpans(rows.map((r) => r.spanId).filter(Boolean));
    })
    .catch(() => setSpans([]));
}, [client]);

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

  /* ================= DROPDOWN OPTIONS ================= */
  const filterOptions = useMemo(
    () => [
      { label: "ALL", value: "ALL" },
      ...spans.map((s) => ({ label: s, value: s })),
    ],
    [spans]
  );

  /* ================= FETCH TABLE ================= */
  const fetchReport = async () => {
    if (!client) return;

    setError(null);
    setLoading(true);

    try {
      const res = await axiosClient.get(
        FETCH_PERFORMANCE_ADVA_TEMPERATURE_REPORT,
        {
          params: {
            client,
            flag: selectedSpan,
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
        setError("No data available"); //  UNCHANGED DEFAULT STATE TEXT
        return;
      }

      setData(rows);
      setColumns(Object.keys(rows[0]));
    } catch {
      setError(`Failed to fetch ADVA ${clientLabel} Temperature data`); //  UNCHANGED STANDARD ERROR FALLBACK
    } finally {
      setLoading(false);
    }
  };

  /* ================= FETCH GRAPH ================= */
  const fetchTemperaturePlot = async (row: any) => {
    if (!client) return;

    setPlotLoading(true);

    const node =
      row["DEVICE NAME"] ||
      row.NodeName ||
      row.Nodename ||
      row.nodeName;

    const port =
      row["ENTITY"] ||
      row.Port ||
      row.port ||
      row.interfaceName;

    try {
      const res = await axiosClient.get(
        FETCH_PERFORMANCE_ADVA_TEMPERATURE_PLOT,
        {
          params: {
            client,
            nodeName: node,
            interfaceName: port,
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
    if (client) fetchReport();
  }, [client]);

  return (
    <Box sx={{ height: "100%", width: "100%", backgroundColor: "#ffffff", p: 2, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {loading && (
        <FullPageLoader
          message={`Loading ADVA ${clientLabel} Temperature data...`}
        />
      )}

      <PerformanceFilterBar
        title={`ADVA ${clientLabel} - TEMPERATURE REPORT`}
        filterLabel="Span ID"
        filterValue={selectedSpan}
        filterOptions={filterOptions}
        onFilterChange={setSelectedSpan}
        onToggleSidebar={() => setOpen((prev) => !prev)}
        isSidebarOpen={open}
        dbType={dbType}
        setDbType={setDbType}
        fromTime={fromTime}
        toTime={toTime}
        setFromTime={setFromTime}
        setToTime={setToTime}
        onView={fetchReport}
        rightActions={
          <ExcelDownloadButton
            data={data}
            columnOrder={columns}
            tableId={TABLE_ID}
            fileName={`ADVA_${clientLabel}_Temperature_Report`}
          />
        }
      />

      <Divider sx={{ my: 1, borderColor: "#e2e8f0" }} />

      {/*  FIXED STRUCTURAL VIEWPORT CONTAINER FOR FLUID SCROLLBAR POSITIONING */}
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
            title={`ADVA ${clientLabel} - TEMPERATURE REPORT`}
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
              await fetchTemperaturePlot(row);
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
            ? `Temperature | ${selectedRow["DEVICE NAME"] || selectedRow.NodeName || selectedRow.Nodename} / ${selectedRow["ENTITY"] || selectedRow.Port || selectedRow.port}`
            : "Temperature"
        }
        data={plotData}
        xKey="timeseries"
        xAxisLabel="Date / Time"
        yAxisLabel="Temp. (°C)"
        series={[
          {
            key: "maxTemperature",
            label: "Max Temperature",
            color: "#d97706",
          },
        ]}
        tableColumns={[
          { key: "timeseries", label: "Time" },
          { key: "maxTemperature", label: "Max Temperature (°C)" },
        ]}
      />
    </Box>
  );
};

export default AdvaTemperatureReport;