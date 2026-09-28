import React, { useEffect, useState } from "react";
import { Box, Divider } from "@mui/material";
import { useOutletContext } from "react-router-dom"; //  GRABS CONTEXT UTILS

import axiosClient from "@/api/axiosClient";
import {
  FETCH_NOTIFICATION_USERS,
  DELETE_NOTIFICATION_USERS,
} from "@/api/apis";
import { logActivity } from "@/utils/activityLogger";

import NotificationTable, {
  NotificationUserRow,
} from "./NotificationTable";
import AddNotificationUserDialog from "./Dialog/AddNotificationUserDialog";

import FullPageLoader from "../../../../components/common/FullPageLoader";
import ErrorState from "../../../../components/common/ErrorState";
import NotificationSettingActionBar from "./NotificationSettingsActionBar";
import EditNotificationUserDialog from "./Dialog/EditNotificationUserDialog";

/* ================= TYPES ================= */
type OutletContextType = { 
  open: boolean; 
  setOpen: React.Dispatch<React.SetStateAction<boolean>> 
};

const TABLE_ID = "notification-setting-table";

const NotificationSetting: React.FC = () => {
  //  HOOKS INTO SHARED SIDEBAR STATE MANAGERS 
  const { open, setOpen } = useOutletContext<OutletContextType>();

  const [data, setData] = useState<NotificationUserRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedUser, setSelectedUser] = useState<NotificationUserRow | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  /* ================= FETCH DATASET ================= */
  const fetchNotificationUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await axiosClient.get(FETCH_NOTIFICATION_USERS);
      const list: NotificationUserRow[] = res.data?.data || res.data || [];

      if (!Array.isArray(list)) {
        throw new Error("Invalid response structural signature array pattern");
      }

      setData(list);
      setColumns(list.length ? Object.keys(list[0]) : []);
    } catch (e) {
      console.error("FETCH ERROR:", e);
      setError("Failed to load notification users");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    logActivity({ activity: "Notification Settings page opened", actionName: "NOTIFICATION_SETTINGS_PAGE", module: "ADMIN" });
  }, []);

  useEffect(() => {
    fetchNotificationUsers();
  }, []);

  /* ================= EXECUTING DELETES ================= */
  const handleDelete = async () => {
    if (!selectedUser) return;

    try {
      setLoading(true);
      await axiosClient.post(DELETE_NOTIFICATION_USERS, {
        ids: [selectedUser.id], 
      });

      setSelectedUser(null);
      await fetchNotificationUsers();
    } catch (e) {
      console.error("DELETE ERROR:", e);
      setError("Failed to delete notification user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box 
      sx={{ 
        height: "100%", 
        width: "100%", 
        backgroundColor: "#ffffff", 
        p: 2,
        boxSizing: "border-box", 
        display: "flex", 
        flexDirection: "column", 
        overflow: "hidden" 
      }}
    >
      {/* ---------- ACTION BAR ---------- */}
      <NotificationSettingActionBar
        onAdd={() => setAddOpen(true)}
        onEdit={() => setEditOpen(true)}
        onDelete={handleDelete}
        hasSelection={!!selectedUser}
        excelData={data}
        excelColumns={columns}
        tableId={TABLE_ID}
        onToggleSidebar={() => setOpen((prev) => !prev)}
        isSidebarOpen={open}
      />

      <Divider sx={{ my: 1, borderColor: "#e2e8f0" }} />

      {/* ---------- CONTENT SPREADSHEET AREA BLOCK ---------- */}
      <Box sx={{ flex: 1, minHeight: 0, width: "100%", display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
        {loading && <FullPageLoader message="Loading notification users..." />}

        {!loading && error && (
          <ErrorState
            title="Error"
            message={error}
            severity="error"
            onRetry={fetchNotificationUsers}
          />
        )}

        {!loading && !error && data.length === 0 && (
          <ErrorState
            title="No Data"
            message="No notification users configured"
            severity="info"
          />
        )}

        {!loading && !error && data.length > 0 && (
          <NotificationTable
            tableId={TABLE_ID}
            dataObjects={data}
            selectedUserId={selectedUser?.id ?? null}
            onSelectionChange={setSelectedUser}
          />
        )}
      </Box>

      {/* ---------- MODAL DIALOG HOOK TRACKS ---------- */}
      <AddNotificationUserDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSuccess={fetchNotificationUsers}
      />

      <EditNotificationUserDialog
        open={editOpen}
        user={selectedUser}
        onClose={() => setEditOpen(false)}
        onSuccess={fetchNotificationUsers}
      />
    </Box>
  );
};

export default NotificationSetting;