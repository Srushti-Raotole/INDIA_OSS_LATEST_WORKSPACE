import React, { useEffect, useState } from "react";
import { Box, Divider, Snackbar, Alert } from "@mui/material";

import axiosClient from "@/api/axiosClient";
import {
  ADMIN_CURRENT_DISCOVERY_SETTING,
  ADMIN_DISCOVERY_RECORD,
} from "@/api/apis";

import FullPageLoader from "../../../components/common/FullPageLoader";
import ErrorState from "../../../components/common/ErrorState";

import DiscoveryActionBar, {
  ViewType,
} from "./DiscoveryActionBar";

import CurrentDiscoveryTable from "./Table/CurrentDiscoveryTable";
import DiscoveryRecordsTable from "./Table/DiscoveryRecordsTable";
import SetDiscoveryDialog from "./SetDiscoveryDialog";

/* ================= PAGE ================= */
const DiscoverySettingPage: React.FC = () => {
  const [view, setView] = useState<ViewType>("CURRENT");
  const [openDialog, setOpenDialog] = useState(false);

  const [currentData, setCurrentData] = useState<any[]>([]);
  const [recordData, setRecordData] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  /* ================= FETCH ================= */
  const fetchCurrentDiscovery = async () => {
    const res = await axiosClient.get(
      ADMIN_CURRENT_DISCOVERY_SETTING
    );
    setCurrentData(res.data?.data || res.data || []);
  };

  const fetchDiscoveryRecords = async () => {
    const res = await axiosClient.get(
      ADMIN_DISCOVERY_RECORD
    );
    setRecordData(res.data?.data || res.data || []);
  };

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError(null);
      await Promise.all([
        fetchCurrentDiscovery(),
        fetchDiscoveryRecords(),
      ]);
    } catch {
      setError("Unable to load discovery data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  return (
    <Box
      sx={{
        height: "calc(100vh - 5vh)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        p: 2,
        bgcolor: "#ffffff",
      }}
    >
      {loading && (
        <FullPageLoader message="Loading discovery settings..." />
      )}

      <Snackbar
        open={!!successMsg}
        autoHideDuration={5000}
        onClose={() => setSuccessMsg(null)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert severity="success" variant="filled">
          {successMsg}
        </Alert>
      </Snackbar>

      <DiscoveryActionBar
        view={view}
        onViewChange={setView}
        onSetDiscovery={() => setOpenDialog(true)}
      />

      <SetDiscoveryDialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        onSuccess={(msg) => {
          setSuccessMsg(msg);
          fetchAll();
        }}
      />

      <Divider sx={{ my: 2 }} />

      <Box sx={{ flex: 1, overflow: "hidden" }}>
        {!loading && error && (
          <ErrorState
            title="Discovery Error"
            message={error}
            severity="error"
            onRetry={fetchAll}
          />
        )}

        {!loading &&
          !error &&
          view === "CURRENT" &&
          currentData.length > 0 && (
            <CurrentDiscoveryTable
              tableId="current-discovery"
              dataObjects={currentData}
            />
          )}

        {!loading &&
          !error &&
          view === "RECORDS" &&
          recordData.length > 0 && (
            <DiscoveryRecordsTable
              tableId="discovery-records"
              dataObjects={recordData}
            />
          )}
      </Box>
    </Box>
  );
};

export default DiscoverySettingPage;
