import React, { useEffect, useState } from "react";
import { Box, Divider, TextField, Autocomplete } from "@mui/material";
import { useOutletContext } from "react-router-dom";

import axiosClient from "@/api/axiosClient";
import {
  FETCH_PERFORMANCE_MCP_ETTP_OSS_METRICS_REPORT,
  FETCH_PERFORMANCE_MCP_NODE_LIST_6500,
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

const TABLE_ID = "MCP-OSS METRICS REPORT";

/* ================= COMPONENT ================= */
const MCPOSS_ETTP_METRICSReport: React.FC = () => {
  const { open, setOpen } = useOutletContext<{ open: boolean; setOpen: React.Dispatch<React.SetStateAction<boolean>> }>();

  /* ---------- TABLE ---------- */
  const [data, setData] = useState<Record<string, any>[]>([]);
  const [columns, setColumns] = useState<string[]>([]);

  /* ---------- TIME & FILTERS ---------- */
  const [dbType, setDbType] = useState<DbType>("live");
  const [fromTime, setFromTime] = useState("");
  const [toTime, setToTime] = useState("");
  
  /* ---------- DEVICE NAME (NODE) ---------- */
  const [nodeList, setNodeList] = useState<string[]>([]);
  // Default is now "ALL"
  const [deviceName, setDeviceName] = useState<string>("ALL");

  /* ---------- UI ---------- */
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    logActivity({
      activity: "MCP OSS-METRICS Report",
      actionName: "MCP_REPORT",
      module: "PERFORMANCE",
    });
  }, []);

  /* ================= FETCH NODE LIST ================= */
  useEffect(() => {
    const fetchNodes = async () => {
      try {
        const res = await axiosClient.get(FETCH_PERFORMANCE_MCP_NODE_LIST_6500);
        
        const rawData = Array.isArray(res.data) ? res.data : res.data?.data || [];
        
        // Extract nodeNames and filter out invalid data
        const nodes: string[] = rawData
          .map((item: any) => item?.nodeName)
          .filter((name: any) => typeof name === "string" && name.trim() !== "");
        
        // Prepend "ALL" to the top of the dropdown list
        setNodeList(["ALL", ...nodes]);
        
      } catch (err) {
        console.error("Failed to fetch node list", err);
        setError("Failed to fetch device nodes.");
      }
    };
    
    fetchNodes();
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

  /* ================= FETCH TABLE ================= */
  const fetchReport = async () => {
    if (!deviceName) {
      setError("Please select a device name first.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await axiosClient.get(
        FETCH_PERFORMANCE_MCP_ETTP_OSS_METRICS_REPORT,
        {
          params: {
            dbType,
            deviceName, // Will send "ALL" by default
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
      setError("Failed to fetch MCP OSS-METRICS data");
    } finally {
      setLoading(false);
    }
  };

  /* ================= AUTO LOAD ================= */
  useEffect(() => {
    if (deviceName) {
      fetchReport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceName]); 

  return (
    <Box sx={{ height: "100%", width: "100%", backgroundColor: "#ffffff", p: 2, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {loading && (
        <FullPageLoader message="Loading MCP OSS-METRICS data..." />
      )}

      {/* --- Filter Controls --- */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1, flexWrap: "wrap" }}>
        
        {/* Device Name Searchable Dropdown */}
        <Autocomplete
          size="small"
          options={nodeList}
          value={deviceName}
          disableClearable
          onChange={(event, newValue) => {
            setDeviceName(newValue || "ALL");
          }}
          sx={{ minWidth: 250, bgcolor: 'background.paper' }}
          ListboxProps={{
            style: { maxHeight: 300, overflow: 'auto' } // Enforces a scrollable area
          }}
          renderInput={(params) => (
            <TextField {...params} label="Device Name" placeholder="Search device..." />
          )}
        />

        <Box sx={{ flexGrow: 1 }}>
          <PerformanceFilterBar
            title="MCP – ETTP REPORT"
            dbType={dbType}
            setDbType={setDbType}
            fromTime={fromTime}
            toTime={toTime}
            onToggleSidebar={() => setOpen((prev) => !prev)}
            isSidebarOpen={open}
            setFromTime={setFromTime}
            setToTime={setToTime}
            onView={fetchReport}
            rightActions={
              <ExcelDownloadButton
                data={data}
                columnOrder={columns}
                tableId={TABLE_ID}
                fileName="MCP_OSS-METRICS_Report"
              />
            }
          />
        </Box>
      </Box>

      <Divider sx={{ my: 1, borderColor: "#e2e8f0" }} />

      {/* FIXED STRUCTURAL VIEWPORT FRAME */}
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
            title="MCP OSS-METRICS REPORT"
            message={error}
            severity={error === "No data available" ? "info" : "error"}
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

export default MCPOSS_ETTP_METRICSReport;