import React, { useEffect, useState } from "react";
import { Box, Divider } from "@mui/material";

import axiosClient from "@/api/axiosClient";
import {
  FETCH_TICKETING_ALARMS,
  CREATE_TICKETING_ALARM,
} from "@/api/apis";

import FullPageLoader from "../../../components/common/FullPageLoader";
import ErrorState from "../../../components/common/ErrorState";

import AddAlarmDialog from "./Dialog/AddAlarmDialog";
import BulkAddAlarmDialog from "./Dialog/BulkAddAlarmDialog";
import AdminTicketingTable from "./AdminTicketingTable";
import TicketingActionBar, { TechType } from "./TicketingActionBar";
import TicketingDelDialog from "./Dialog/TicketingDelDialog";
import EditAlarmDialog from "./Dialog/EditAlarmDialog";
import { logActivity } from "../../../utils/activityLogger";

const TABLE_ID = "ticketing-alarm-table";

const EXCEL_COLUMN_ORDER = [
  "adapter",
  "family",
  "alarm",
  "treated",
  "persistence",
  "shortPeriod",
  "shortRepetition",
];

const TicketingPageAdmin: React.FC = () => {
  const [activeAdapter, setActiveAdapter] = useState<TechType>("ALL");
  const [tableData, setTableData] = useState<any[]>([]);
  const [selectedRow, setSelectedRow] = useState<any | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  /* ================= FETCH ================= */

  const fetchAlarms = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await axiosClient.get(FETCH_TICKETING_ALARMS, {
        params: { adapter: activeAdapter },
      });

      const data = res.data?.data || res.data || [];
      setTableData(Array.isArray(data) ? data : []);
      setSelectedRow(null);
    } catch {
      setError("Failed to load alarm configuration");
      setTableData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlarms();
  }, [activeAdapter]);

  return (
    /* ================= PAGE ROOT ================= */
    <Box
      sx={{
        height: "calc(100vh - 5vh)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        p: 2,
        backgroundColor: "#ffffff",
      }}
    >
      {/* ================= ACTION BAR ================= */}
      <TicketingActionBar
        selectedTech={activeAdapter}
        onTechChange={setActiveAdapter}
        onAdd={() => setAddOpen(true)}
        onEdit={() => selectedRow && setEditOpen(true)}
        onBulkAdd={() => setBulkOpen(true)}
        onDownloadSample={() => { }}
        selectedRow={selectedRow}
        onDelete={() => selectedRow && setDeleteOpen(true)}
        excelData={tableData}
        excelColumns={EXCEL_COLUMN_ORDER}
        tableId={TABLE_ID}
      />

      <Divider sx={{ my: 1 }} />

      {/* ================= TABLE AREA ================= */}
      <Box sx={{ flex: 1, overflow: "hidden" }}>
        {loading && (
          <FullPageLoader message="Loading alarm configuration..." />
        )}

        {!loading && error && (
          <ErrorState title="Error" message={error} onRetry={fetchAlarms} />
        )}

        {!loading && !error && tableData.length === 0 && (
          <ErrorState
            title="No Data"
            message="No alarm configuration found"
            severity="info"
          />
        )}

        {!loading && !error && tableData.length > 0 && (
          <AdminTicketingTable
            tableId={TABLE_ID}
            dataObjects={tableData}
            pageSize={25}
            onRowSelect={setSelectedRow}
          />
        )}
      </Box>

      {/* ================= DIALOGS ================= */}
      <AddAlarmDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={async (payload) => {
          await axiosClient.post(CREATE_TICKETING_ALARM, payload);
          logActivity({
            activity: `Added ticketing alarm | Adapter=${payload?.adapter} | Alarm=${payload?.alarm}`,
            actionName: "ADD_TICKETING_ALARM",
            module: "TICKETING",
          });

          setAddOpen(false);
          fetchAlarms();
        }}
      />
      {/* 
      <BulkAddAlarmDialog
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onSuccess={() => {
          logActivity({
            activity: "Bulk added ticketing alarms",
            actionName: "BULK_ADD_TICKETING_ALARM",
            module: "TICKETING",
          });
          setBulkOpen(false);
          fetchAlarms();
        }}
      /> */}
      <BulkAddAlarmDialog
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onSuccess={() => {
          logActivity({
            activity: "Bulk added ticketing alarms",
            actionName: "BULK_ADD_TICKETING_ALARM",
            module: "TICKETING",
          });

          setBulkOpen(false);
          fetchAlarms();
        }}
      />

      {/* <TicketingDelDialog
        open={deleteOpen}
        alarmRow={selectedRow}
        onClose={() => setDeleteOpen(false)}
        onSuccess={() => {
          setDeleteOpen(false);
          fetchAlarms();
        }}
      /> */}
      <TicketingDelDialog
        open={deleteOpen}
        alarmRow={selectedRow}
        onClose={() => setDeleteOpen(false)}
        onSuccess={() => {
          logActivity({
            activity: `Deleted ticketing alarm | Alarm=${selectedRow?.alarm} | Adapter=${selectedRow?.adapter}`,
            actionName: "DELETE_TICKETING_ALARM",
            module: "TICKETING",
          });

          setDeleteOpen(false);
          fetchAlarms();
        }}
      />

      {/* <EditAlarmDialog
        open={editOpen}
        alarmRow={selectedRow}
        onClose={() => setEditOpen(false)}
        onSuccess={() => {
          setEditOpen(false);
          fetchAlarms();
        }}
      /> */}
      <EditAlarmDialog
        open={editOpen}
        alarmRow={selectedRow}
        onClose={() => setEditOpen(false)}
        onSuccess={() => {
          logActivity({
            activity: `Edited ticketing alarm | Alarm=${selectedRow?.alarm} | Adapter=${selectedRow?.adapter}`,
            actionName: "EDIT_TICKETING_ALARM",
            module: "TICKETING",
          });

          setEditOpen(false);
          fetchAlarms();
        }}
      />

    </Box>
  );
};

export default TicketingPageAdmin;
