import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
} from "@mui/material";

import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import CommonTable from "../../../components/common/CommonTable";
import FullPageLoader from "../../../components/common/FullPageLoader";
import ErrorState from "../../../components/common/ErrorState";

/* ================= TYPES ================= */
type TopologyRow = {
  id: number;
  fileName: string;
  topologyType: "dc-to-dc" | "node-to-node";
  createdOn: string;
};

/* ================= CONSTANTS ================= */
const TABLE_ID = "manage-topology-table";

/* ================= PAGE ================= */
const ManageTopologyPage: React.FC = () => {
  /* ---------- table state ---------- */
  const [data, setData] = useState<TopologyRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* ---------- edit modal ---------- */
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState<TopologyRow | null>(null);

  /* ================= FETCH ================= */
  const fetchTopologies = async () => {
    try {
      setLoading(true);
      setError(null);

      // 🔹 replace with API call later
      const mock: TopologyRow[] = [
        {
          id: 1,
          fileName: "Topology_Test",
          topologyType: "dc-to-dc",
          createdOn: "2025-10-20",
        },
        {
          id: 2,
          fileName: "Topology_Node_1",
          topologyType: "node-to-node",
          createdOn: "2025-10-15",
        },
      ];

      setData(mock);
      setColumns(["fileName", "topologyType", "createdOn", "actions"]);
    } catch (e) {
      console.error(e);
      setError("Failed to load topologies");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopologies();
  }, []);

  /* ================= ACTIONS ================= */
  const handleView = (row: TopologyRow) => {
    alert(`View topology: ${row.fileName}`);
  };

  const handleEdit = (row: TopologyRow) => {
    setEditRow(row);
    setEditOpen(true);
  };

  const handleDelete = (row: TopologyRow) => {
    if (!window.confirm(`Delete topology "${row.fileName}"?`)) return;

    setData((prev) => prev.filter((r) => r.id !== row.id));
  };

  const handleSaveEdit = () => {
    if (!editRow) return;

    setData((prev) =>
      prev.map((r) => (r.id === editRow.id ? editRow : r))
    );
    setEditOpen(false);
  };

  /* ================= TABLE DATA ================= */
  const tableData = data.map((r) => ({
    ...r,
    topologyType:
      r.topologyType === "dc-to-dc"
        ? "Data Center to Data Center"
        : "Node to Node",
    actions: (
      <Stack direction="row" spacing={1}>
        <Button
          size="small"
          startIcon={<VisibilityIcon />}
          onClick={() => handleView(r)}
        >
          View
        </Button>
        <Button
          size="small"
          startIcon={<EditIcon />}
          onClick={() => handleEdit(r)}
        >
          Edit
        </Button>
        <Button
          size="small"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={() => handleDelete(r)}
        >
          Delete
        </Button>
      </Stack>
    ),
  }));

  /* ================= RENDER ================= */
  return (
    <Box
      sx={{
        height: "calc(100vh - 5vh)",
        width: "100%",
        p: 3,
        bgcolor: "#fff",
        overflow: "hidden",
      }}
    >
      {loading && <FullPageLoader message="Loading topologies..." />}

      {/* ================= HEADER ================= */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
        <Box
          sx={{
            width: 4,
            height: 40,
            borderRadius: 2,
            bgcolor: "primary.main",
          }}
        />
        <Box>
          <Typography fontWeight={700}>Manage Topologies</Typography>
          <Typography fontSize="0.8rem" color="text.secondary">
            View, edit or delete saved network topologies
          </Typography>
        </Box>
      </Box>

      {/* ================= TABLE ================= */}
      <Paper
        elevation={0}
        sx={{
          height: "calc(100% - 80px)",
          borderRadius: 3,
          border: "1px solid #e0e0e0",
          p: 1,
        }}
      >
        {error ? (
          <ErrorState title="Error" message={error} severity="error" />
        ) : data.length === 0 ? (
          <ErrorState
            title="No Topologies"
            message="No saved topologies available"
            severity="info"
          />
        ) : (
          <CommonTable
            tableId={TABLE_ID}
            dataObjects={tableData}
            columnOrder={columns}
            pageSize={10}
          />
        )}
      </Paper>

      {/* ================= EDIT DIALOG ================= */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Edit Topology</DialogTitle>

        <DialogContent dividers>
          <Stack spacing={2}>
            <TextField
              label="File Name"
              value={editRow?.fileName || ""}
              onChange={(e) =>
                setEditRow((p) =>
                  p ? { ...p, fileName: e.target.value } : p
                )
              }
              fullWidth
            />

            <TextField
              select
              label="Topology Type"
              value={editRow?.topologyType || ""}
              onChange={(e) =>
                setEditRow((p) =>
                  p ? { ...p, topologyType: e.target.value as any } : p
                )
              }
              fullWidth
            >
              <MenuItem value="dc-to-dc">Data Center to Data Center</MenuItem>
              <MenuItem value="node-to-node">Node to Node</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveEdit}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManageTopologyPage;
