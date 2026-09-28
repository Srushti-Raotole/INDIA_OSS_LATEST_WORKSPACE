import React, { useEffect, useMemo, useState } from "react";
import { Box, Divider } from "@mui/material";
import { useOutletContext, useParams } from "react-router-dom";

import axiosClient from "@/api/axiosClient";
import {
  FETCH_PERFORMANCE_ADVA_SPANLOSS_REPORT,
  FETCH_PERFORMANCE_ADVA_SPANLOSS_SPANFILTER,
  FETCH_PERFORMANCE_ADVA_SPANLOSS_PLOT,
} from "@/api/apis";

import PerformanceFilterBar from "../../components/PerformanceFilterBar";
import PerformanceTable from "../../components/PerformanceTable";
import ExcelDownloadButton from "../../../../components/common/ExcelDownloadButton";
import ErrorState from "../../../../components/common/ErrorState";
import FullPageLoader from "../../../../components/common/FullPageLoader";
import CommonChartModal from "../../components/CommonChartModal";
import { logActivity } from "../../../../utils/activityLogger";

/* ================= TYPES ================= */
type OutletContextType = { 
  open: boolean; 
  setOpen: React.Dispatch<React.SetStateAction<boolean>> 
};
type DbType = "live" | "current" | "historic";

const TABLE_ID = "adva-spanloss-report";

const ADVASpanlossReport: React.FC = () => {
  const { open, setOpen } = useOutletContext<OutletContextType>();
  const { client } = useParams<{ client: string }>();

  /* ---------- CLIENT SAFETY ---------- */
  if (!client) {
    return (
      <ErrorState
        title="ADVA Spanloss"
        message="Client context parameters were not provided within routing endpoints."
        severity="error"
      />
    );
  }

  const clientLabel = decodeURIComponent(client).toUpperCase();

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

  /* ================= LOG ACTIVITY ================= */
  useEffect(() => {
    logActivity({
      activity: `ADVA Spanloss Report page opened | Client=${clientLabel}`,
      actionName: "ADVA_SPANLOSS",
      module: "PERFORMANCE",
    });
  }, [client, clientLabel]);

  /* ================= LOAD SPAN LIST ================= */
 useEffect(() => {
  axiosClient
    .get(FETCH_PERFORMANCE_ADVA_SPANLOSS_SPANFILTER, {
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

  const filterOptions = useMemo(
    () => [
      { label: "ALL", value: "ALL" },
      ...spans.map((s) => ({ label: s, value: s })),
    ],
    [spans]
  );

  /* ================= FETCH TABLE ================= */
  const fetchReport = async () => {
    setError(null);
    setLoading(true);

    try {
      const res = await axiosClient.get(
        FETCH_PERFORMANCE_ADVA_SPANLOSS_REPORT,
        {
          params: {
            flag: selectedSpan,
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
      setError(`Failed to fetch ADVA ${clientLabel} Spanloss data`);
    }   finally {
      setLoading(false);
    }
  };

  /* ================= FETCH GRAPH ================= */
  const fetchSpanLossPlot = async (row: any) => {
    setPlotLoading(true);
    try {
      const res = await axiosClient.get(
        FETCH_PERFORMANCE_ADVA_SPANLOSS_PLOT,
        {
          params: {
            nodeName: row.aEndNode,
            interfaceName: row.aEndNodeInterface,
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
    <Box
      sx={{
        height: "100%",
        width: "100%",
        backgroundColor: "#ffffff",
        p: 2,
        boxSizing: "border-box", //  Keeps padding calculation bounded inside the container framework
        display: "flex",
        flexDirection: "column",
        overflow: "hidden" 
      }}
    >
      {loading && (
        <FullPageLoader
          message={`Loading ADVA ${clientLabel} Spanloss data...`}
        />
      )}

      <PerformanceFilterBar
        title={`ADVA ${clientLabel} – SPANLOSS REPORT`}
        filterLabel="Span ID"
        filterValue={selectedSpan}
        onToggleSidebar={() => setOpen((prev) => !prev)}
        isSidebarOpen={open}
        filterOptions={filterOptions}
        onFilterChange={setSelectedSpan}
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
            fileName={`ADVA_${clientLabel}_Spanloss`}
          />
        }
      />

      <Divider sx={{ my: 1, borderColor: "#e2e8f0" }} />

      {/* 🔽 RESPONSIVE CONTAINER SHIFTS WITH REMAINING FLEX VIEWPORT SPACE */}
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
            title="SPANLOSS REPORT"
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
              await fetchSpanLossPlot(row);
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
            ? `Span Loss | ${selectedRow.aEndNode} / ${selectedRow.aEndNodeInterface}`
            : "Span Loss"
        }
        data={plotData}
        xKey="timeseries"
        xAxisLabel="Duration"
        yAxisLabel="Power (dBM)"
        series={[
          { key: "spanLossMax", label: "Span Loss Max", color: "#10b981" },
          { key: "spanLossMin", label: "Span Loss Min", color: "#2563eb" },
        ]}
        tableColumns={[
          { key: "timeseries", label: "Time" },
          { key: "spanLossMax", label: "Span Loss Max" },
          { key: "spanLossMin", label: "Span Loss Min" },
        ]}
      />
    </Box>
  );
};

export default ADVASpanlossReport;