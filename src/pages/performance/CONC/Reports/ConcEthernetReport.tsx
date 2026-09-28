import React, { useEffect, useMemo, useState } from "react";
import { Box, Divider } from "@mui/material";
import { useOutletContext, useParams } from "react-router-dom";
import { logActivity } from "../../../../utils/activityLogger";
import axiosClient from "@/api/axiosClient";
import {
  FETCH_PERFORMANCE_CONC_ETHERNET_NODELIST,
  FETCH_PERFORMANCE_CONC_ETHERNET_REPORT,
} from "@/api/apis";
import FullPageLoader from "../../../../components/common/FullPageLoader";
import PerformanceFilterBar from "../../components/PerformanceFilterBar";
import ExcelDownloadButton from "../../../../components/common/ExcelDownloadButton";
import ErrorState from "../../../../components/common/ErrorState";
import PerformanceTable from "../../components/PerformanceTable";

type OutletContextType = { 
  open: boolean; 
  setOpen: React.Dispatch<React.SetStateAction<boolean>> 
};
type DbType = "live" | "current" | "historic";
const TABLE_ID = "CONC-ethernet-report";

const CONCETHERNETReport: React.FC = () => {
  const { client } = useParams<{ client: string }>();
  
  /*  GRABS ROUTING MANAGERS FROM HOME PANEL SLOTS */
  const { open, setOpen } = useOutletContext<OutletContextType>();

  if (!client) {
    return <ErrorState title="CONC Ethernet Report" message="Client not provided in URL" severity="error" />;
  }
  const clientLabel = decodeURIComponent(client).toUpperCase();

  const [data, setData] = useState<Record<string, any>[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [nodes, setNodes] = useState<string[]>([]);
  const [selectedNode, setSelectedNode] = useState<string>("ALL");
  const [dbType, setDbType] = useState<DbType>("live");
  const [fromTime, setFromTime] = useState("");
  const [toTime, setToTime] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    logActivity({
      activity: `CONC Ethernet Report page opened | Client=${clientLabel}`,
      actionName: "CONC_ETHERNET_REPORT",
      module: "PERFORMANCE",
    });
  }, [clientLabel]);

  useEffect(() => {
    axiosClient
      .get(FETCH_PERFORMANCE_CONC_ETHERNET_NODELIST, { params: { client } })
      .then((res) => {
        const rows = Array.isArray(res.data) ? res.data : [];
        setNodes(rows.map((r) => r.nodeName).filter(Boolean));
      })
      .catch(() => setNodes([]));
  }, [client]);

  useEffect(() => {
    const today = new Date();
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    if (dbType === "live") {
      setFromTime(""); setToTime(""); setSelectedNode("ALL");
    } else if (dbType === "current") {
      const t = fmt(today); setFromTime(`${t} 00:00`); setToTime(`${t} 23:59`); setSelectedNode("ALL");
    } else {
      const from = new Date(today); from.setDate(today.getDate() - 3);
      const to = new Date(today); to.setDate(today.getDate() - 1);
      setFromTime(`${fmt(from)} 00:00`); setToTime(`${fmt(to)} 23:59`);
    }
  }, [dbType]);

  const filterOptions = useMemo(() => [
    { label: "ALL", value: "ALL" }, ...nodes.map((n) => ({ label: n, value: n }))
  ], [nodes]);

  const fetchReport = async () => {
    setError(null); setLoading(true);
    try {
      const res = await axiosClient.get(FETCH_PERFORMANCE_CONC_ETHERNET_REPORT, {
        params: { flag: selectedNode, client, dbType, fromTime: dbType === "live" ? "" : fromTime, toTime: dbType === "live" ? "" : toTime },
      });
      const rows = Array.isArray(res.data) ? res.data : res.data?.data || [];
      if (!rows.length) {
        setData([]); setColumns([]); setError("No data available"); return;
      }
      setData(rows); setColumns(Object.keys(rows[0]));
    } catch {
      setError(`Failed to fetch CONC ${clientLabel} Ethernet data`);
    }   finally { setLoading(false); }
  };

  useEffect(() => { fetchReport(); }, [client]);

  return (
    <Box sx={{ height: "100%", width: "100%", p: 2, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {loading && <FullPageLoader message={`Loading CONC ${clientLabel} Ethernet data...`} />}

      <PerformanceFilterBar
        title={`CONC ${clientLabel} - ETHERNET REPORT`}
        onToggleSidebar={() => setOpen((p) => !p)} //  NEW SIDEBAR PROPS LINK
        isSidebarOpen={open}                     //  NEW SIDEBAR PROPS LINK
        filterLabel="Node Name"
        filterValue={selectedNode}
        filterOptions={filterOptions}
        onFilterChange={setSelectedNode}
        dbType={dbType}
        setDbType={setDbType}
        fromTime={fromTime}
        toTime={toTime}
        setFromTime={setFromTime}
        setToTime={setToTime}
        onView={fetchReport}
        rightActions={<ExcelDownloadButton data={data} columnOrder={columns} tableId={TABLE_ID} fileName={`CONC_${clientLabel}_Ethernet_Report`} />}
      />

      <Divider sx={{ my: 1, borderColor: "#e2e8f0" }} />

      {/*  PURE FLEX BOX CONTAINER ELEMENT FOR THE SPREADSHEETS */}
      <Box sx={{ flex: 1, minHeight: 0, width: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {error ? (
          <ErrorState title={`CONC ${clientLabel} - ETHERNET REPORT`} message={error} severity="info" onRetry={fetchReport} />
        ) : (
          <PerformanceTable data={data} columns={columns} tableId={TABLE_ID} />
        )}
      </Box>
    </Box>
  );
};

export default CONCETHERNETReport;