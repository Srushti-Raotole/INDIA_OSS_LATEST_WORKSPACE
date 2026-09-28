
import React from "react";
import { Box, Typography, Paper } from "@mui/material";
import ErrorState from "../../../components/common/ErrorState";
import ReconciliationTable from "./component/ReconciliationTable";

interface Props {
  loading: boolean;
  error: string | null;
  data: any[];
  tableId: string;
  onRetry: () => void;
}

const ReconciliationLogs: React.FC<Props> = ({
  loading,
  error,
  data,
  tableId,
  onRetry,
}) => {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", width: "100%", p: 2.5, backgroundColor: "#ffffff" }}>
      
      {/* Heading Block */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 2, flexShrink: 0 }}>
        <Box sx={{ width: 3.5, height: 16, borderRadius: 1, bgcolor: "#354a6b" }} />
        <Typography sx={{ fontSize: "0.82rem", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Reconciliation Log History
        </Typography>
      </Box>

      {/* Viewport Frame */}
      <Paper elevation={0} sx={{ flex: 1, border: "1px solid #e2e8f0", borderRadius: 3, overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 0 }}>
        {error ? (
          <ErrorState
            title="Database Trace Fault"
            message={error}
            severity="error"
            onRetry={onRetry}
          />
        ) : !loading && data.length === 0 ? (
          <ErrorState
            title="Empty Dataset"
            message="No historical reconciliation execution parameters found inside this cluster partition index."
            severity="info"
          />
        ) : (
          <ReconciliationTable
            tableId={tableId}
            dataObjects={data}
            pageSize={20}
          />
        )}
      </Paper>
    </Box>
  );
};

export default ReconciliationLogs;