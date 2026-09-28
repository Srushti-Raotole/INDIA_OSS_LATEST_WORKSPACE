import React, { useEffect, useMemo, useState } from "react";
import { Box, Divider } from "@mui/material";
import { useOutletContext } from "react-router-dom";

import axiosClient from "@/api/axiosClient";
import {
  FETCH_PERFORMANCE_TLMR_OTN_REPORT,
  FETCH_PERFORMANCE_TLMR_OTN_NODELIST,
} from "@/api/apis";

import PerformanceFilterBar from "../components/PerformanceFilterBar";
import PerformanceTable from "../components/PerformanceTable";
import ExcelDownloadButton from "../../../components/common/ExcelDownloadButton";
import ErrorState from "../../../components/common/ErrorState";
import FullPageLoader from "../../../components/common/FullPageLoader";
import { logActivity } from "../../../utils/activityLogger";

/* ================= TYPES ================= */
type OutletContextType = { open: boolean };
type DbType = "live" | "current" | "historic";

const TABLE_ID = "tlmr-otn-report";

/* ================= COMPONENT ================= */
const TlmrOtnReport: React.FC = () => {
  const { open, setOpen } = useOutletContext<{ open: boolean; setOpen: React.Dispatch<React.SetStateAction<boolean>> }>();

  /* ---------- TABLE ---------- */
  const [data, setData] = useState<Record<string, any>[]>([]);
  const [columns, setColumns] = useState<string[]>([]);

  /* ---------- NODE FILTER ---------- */
  const [nodes, setNodes] = useState<string[]>([]);
  const [selectedNode, setSelectedNode] = useState<string>("ALL");

  /* ---------- TIME ---------- */
  const [dbType, setDbType] = useState<DbType>("live");
  const [fromTime, setFromTime] = useState("");
  const [toTime, setToTime] = useState("");

  /* ---------- UI ---------- */
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    logActivity({
      activity: "TLMR OTN Report page opened",
      actionName: "TLMR_REPORT",
      module: "PERFORMANCE",
    });
  }, []);

  /* ================= LOAD NODE LIST ================= */
  useEffect(() => {
    axiosClient
      .get(FETCH_PERFORMANCE_TLMR_OTN_NODELIST)
      .then((res) => {
        const rows = Array.isArray(res.data) ? res.data : [];
        const nodeList = rows.map((r) => r.nodeName).filter(Boolean);
        setNodes(nodeList);
      })
      .catch(() => setNodes([]));
  }, []);

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
      ...nodes.map((n) => ({ label: n, value: n })),
    ],
    [nodes]
  );

  /* ================= FETCH TABLE ================= */
  const fetchReport = async () => {
    setError(null);
    setLoading(true);

    try {
      const res = await axiosClient.get(
        FETCH_PERFORMANCE_TLMR_OTN_REPORT,
        {
          params: {
            flag: selectedNode,
            dbType,
            fromTime: dbType === "live" ? "" : fromTime,
            toTime: dbType === "live" ? "" : toTime,
          },
        }
      );

      const rows = Array.isArray(res.data) ? res.data : res.data?.data || [];

      if (!rows.length) {
        setData([]);
        setColumns([]);
        setError("No data available");
        return;
      }

      setData(rows);
      setColumns(Object.keys(rows[0]));
    } catch {
      setError("Failed to fetch TLMR OTN data");
    } finally {
      setLoading(false);
    }
  };

  /* ================= AUTO LOAD ================= */
  useEffect(() => {
    fetchReport();
  }, []);

  return (
    <Box sx={{ height: "100%", width: "100%", backgroundColor: "#ffffff", p: 2, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {loading && <FullPageLoader message="Loading TLMR OTN data..." />}

      <PerformanceFilterBar
        title="TLMR – OTN REPORT"
        filterLabel="Node Name"
        filterValue={selectedNode}
        filterOptions={filterOptions}
        onToggleSidebar={() => setOpen((prev) => !prev)}
        isSidebarOpen={open}
        onFilterChange={setSelectedNode}
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
            fileName="TLMR_OTN_Report"
          />
        }
      />

      <Divider sx={{ my: 1, borderColor: "#e2e8f0" }} />

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
            title="TLMR OTN REPORT"
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

export default TlmrOtnReport;