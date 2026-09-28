import React, { useEffect, useState } from "react";
import { Box, Divider } from "@mui/material";
import { useOutletContext } from "react-router-dom";

import axiosClient from "@/api/axiosClient";
import { FETCH_ADMIN_ACTIVITY_LOGS } from "@/api/apis";

import FullPageLoader from "../../../../components/common/FullPageLoader";
import ErrorState from "../../../../components/common/ErrorState";
import ActivityLogsActionBar from "./ActivityLogsActionBar";
import ActivityLogsTable from "./ActivityLogsTable";

import dayjs, { Dayjs } from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { logActivity } from "../../../../utils/activityLogger";

dayjs.extend(utc);
dayjs.extend(timezone);

type OutletContextType = { 
  open: boolean; 
  setOpen: React.Dispatch<React.SetStateAction<boolean>> 
};
type RangeType = "1D" | "3D" | "7D";

const TABLE_ID = "admin-activity-logs-table";

const AdminActivityLogs: React.FC = () => {
  const [tableData, setTableData] = useState<any[]>([]);
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [range, setRange] = useState<RangeType>("1D");
  const [fromDate, setFromDate] = useState<Dayjs>(dayjs().subtract(1, "day"));
  const [toDate, setToDate] = useState<Dayjs>(dayjs());

  const convertToIST = (val: any) => {
    if (!val) return val;
    const str = String(val).trim();
    const hasTZ = /Z$/.test(str) || /[+-]\d{2}:\d{2}$/.test(str);

    const d = hasTZ
      ? dayjs(str).tz("Asia/Kolkata")
      : dayjs.tz(str, "Asia/Kolkata");

    return d.isValid() ? d.format("YYYY-MM-DD HH:mm:ss") : val;
  };

  const fetchLogs = async (from: Dayjs, to: Dayjs) => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        fromTime: from.format("YYYY-MM-DD HH:mm"),
        toTime: to.format("YYYY-MM-DD HH:mm"),
      };

      const res = await axiosClient.get(FETCH_ADMIN_ACTIVITY_LOGS, { params });

      let data = res.data?.data || res.data || [];
      if (!Array.isArray(data)) {
        throw new Error("Invalid activity log response");
      }

      const updated = data.map((item: any) => ({
        ...item,
        created_at: item.created_at ? convertToIST(item.created_at) : item.created_at,
      }));

      setTableData(updated);
      if (updated.length) {
        setColumnOrder(Object.keys(updated[0]));
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load activity logs");
      setTableData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    logActivity({
      activity: "Admin Activity Logs page opened",
      actionName: "ACTIVITY_LOGS_PAGE",
      module: "AUDIT",
    });
  }, []);

  useEffect(() => {
    const now = dayjs();
    let from = now;

    if (range === "1D") from = now.subtract(1, "day");
    if (range === "3D") from = now.subtract(3, "day");
    if (range === "7D") from = now.subtract(7, "day");

    setFromDate(from);
    setToDate(now);
    fetchLogs(from, now);
  }, [range]);

  const handleSearch = () => {
    fetchLogs(fromDate, toDate);
  };

  return (
    <Box
      sx={{
        height: "100%", 
        width: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        p: 2,
        boxSizing: "border-box", 
        backgroundColor: "#ffffff",
      }}
    >
      {/* ================= ACTION BAR (Cleaned up from extra toggle attributes) ================= */}
      <ActivityLogsActionBar
        range={range}
        onRangeChange={setRange}
        fromDate={fromDate}
        toDate={toDate}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
        onSearch={handleSearch}
        excelData={tableData}
        excelColumns={columnOrder}
        tableId={TABLE_ID}
      />

      <Divider sx={{ my: 1, borderColor: "#e2e8f0" }} />

      {/* ================= TABLE AREA ================= */}
      <Box sx={{ flex: 1, minHeight: 0, width: "100%", display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
        {loading && (
          <FullPageLoader message="Loading activity logs..." />
        )}

        {!loading && error && (
          <ErrorState
            title="Error"
            message={error}
            severity="error"
            onRetry={() => fetchLogs(fromDate, toDate)}
          />
        )}

        {!loading && !error && tableData.length === 0 && (
          <ErrorState
            title="No Data"
            message="No activity logs found for the selected time range"
            severity="info"
          />
        )}

        {!loading && !error && tableData.length > 0 && (
          <ActivityLogsTable
            tableId={TABLE_ID}
            dataObjects={tableData}
            pageSize={25}
          />
        )}
      </Box>
    </Box>
  );
};

export default AdminActivityLogs;