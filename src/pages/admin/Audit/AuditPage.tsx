
import React, { useEffect, useState } from "react";
import { Box, Divider } from "@mui/material";
import dayjs, { Dayjs } from "dayjs";

import axiosClient from "@/api/axiosClient";
import FullPageLoader from "../../../components/common/FullPageLoader";
import ErrorState from "../../../components/common/ErrorState";
import { logActivity } from "../../../utils/activityLogger";

import AuditFilterBar from "./AuditFilterBar";
import AlarmAuditTable from "./Table/AlarmAuditTable";
import SpanlossAuditTable from "./Table/SpanlossAuditTable";

/* ================= TYPES ================= */
type AuditType = "ALARMS" | "SPANLOSS";

/* ================= CONSTANTS ================= */
const ALARM_ADAPTERS = ["CONC", "ADVA", "IFNR", "TLMR"];
const SPANLOSS_ADAPTERS = ["ADVA", "IFNR"];

const TABLE_ID_ALARM = "alarm-audit-table";
const TABLE_ID_SPANLOSS = "spanloss-audit-table";

/* ================= PAGE COMPONENT ================= */
const AuditPage: React.FC = () => {
  const [auditType, setAuditType] = useState<AuditType>("SPANLOSS");
  const [adapter, setAdapter] = useState("ADVA");

  const [fromDate, setFromDate] = useState<Dayjs>(dayjs().subtract(6, "hour"));
  const [toDate, setToDate] = useState<Dayjs>(dayjs());

  const [tableData, setTableData] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ================= AUTOMATED AUDIT TRAIL ACTIVITY TRACKING ================= */
  useEffect(() => {
    logActivity({
      activity: "Opened Ticketing Audit Reports page",
      actionName: "OPEN_AUDIT_REPORTS_PAGE",
      module: "AUDIT",
    });
  }, []);

  /* ================= FETCH DATASET GAUGE ================= */
  const fetchAudit = async () => {
    try {
      setLoading(true);
      setError(null);

      const url =
        auditType === "ALARMS"
          ? "/v1/admin/audit/alarms"
          : "/v1/admin/audit/spanloss";

      const res = await axiosClient.get(url, {
        params: {
          adapter,
          fromTime: fromDate.format("YYYY-MM-DD HH:mm:ss"),
          toTime: toDate.format("YYYY-MM-DD HH:mm:ss"),
        },
      });

      const data = res.data?.data || res.data || [];
      if (!Array.isArray(data)) {
        throw new Error("Invalid telemetry return map pattern array layout");
      }

      setTableData(data);
    } catch (err) {
      console.error("TELEMETRY FETCH FAULT:", err);
      setError("Failed to load audit data");
      setTableData([]);
    } finally {
      setLoading(false);
    }
  };

  /* ================= DEFAULTS ON TYPE CHANGE ================= */
  useEffect(() => {
    setAdapter(auditType === "ALARMS" ? "CONC" : "ADVA");
    setFromDate(dayjs().subtract(12, "hour"));
    setToDate(dayjs());
  }, [auditType]);

  useEffect(() => {
    fetchAudit();
  }, [auditType, adapter]);

  const tableId = auditType === "ALARMS" ? TABLE_ID_ALARM : TABLE_ID_SPANLOSS;

  return (
    <Box
      sx={{
        height: "100%", 
        width: "100%",
        p: 2,
        boxSizing: "border-box", // Halts layout layout leakage over viewport limits
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        backgroundColor: "#ffffff",
      }}
    >
      {/* ================= HEADER CONTROL PANEL ACTION RIBBON ================= */}
      <AuditFilterBar
        auditType={auditType}
        onAuditTypeChange={setAuditType}
        adapter={adapter}
        adapters={auditType === "ALARMS" ? ALARM_ADAPTERS : SPANLOSS_ADAPTERS}
        onAdapterChange={setAdapter}
        fromDate={fromDate}
        toDate={toDate}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
        onSearch={fetchAudit}
        excelData={tableData}
        excelColumns={tableData.length ? Object.keys(tableData[0]) : []}
        tableId={tableId}
        /*  HIDES SIDEBAR HOOK INTERFACES FOR NON-SIDEBAR LAYOUT CHASSIS */
        onToggleSidebar={undefined}
        isSidebarOpen={false}
      />

      <Divider sx={{ my: 1, borderColor: "#e2e8f0" }} />

      {/* ================= STRUCTURAL SCROLL GRIDS ENVELOPE ================= */}
      <Box 
        sx={{ 
          flex: 1, 
          minHeight: 0, 
          width: "100%", 
          display: "flex", 
          flexDirection: "column", 
          overflow: "hidden", 
          position: "relative" 
        }}
      >
        {loading && <FullPageLoader message="Loading audit data..." />}

        {!loading && error && (
          <ErrorState title="Error" message={error} onRetry={fetchAudit} />
        )}

        {!loading && !error && tableData.length === 0 && (
          <ErrorState
            title="No Data"
            message="No audit data found for the designated query bounds"
            severity="info"
          />
        )}

        {!loading && !error && tableData.length > 0 && (
          auditType === "ALARMS" ? (
            <AlarmAuditTable
              dataObjects={tableData}
              tableId={TABLE_ID_ALARM}
              pageSize={25}
            />
          ) : (
            <SpanlossAuditTable
              dataObjects={tableData}
              tableId={TABLE_ID_SPANLOSS}
              pageSize={25}
            />
          )
        )}
      </Box>
    </Box>
  );
};

export default AuditPage;