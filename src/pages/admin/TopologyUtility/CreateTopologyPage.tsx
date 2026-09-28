import React, { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  TextField,
  MenuItem,
  Divider,
} from "@mui/material";

import DownloadIcon from "@mui/icons-material/Download";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SaveIcon from "@mui/icons-material/Save";

/* ================= CONSTANTS ================= */
const CLIENTS = ["Microsoft", "Google", "GoogleEPNM"] as const;

const CLIENT_VENDOR_MAP: Record<string, string[]> = {
  Microsoft: ["CISCO", "ADVA"],
  Google: ["INFINERA", "CISCO"],
  GoogleEPNM: ["CISCO"],
};

const TOPOLOGY_TYPES = [
  { key: "datacenter", label: "Data Center" },
  { key: "node", label: "Node" },
];

/* ================= PAGE ================= */
const CreateTopologyPage: React.FC = () => {
  /* ---------- form state ---------- */
  const [client, setClient] = useState("");
  const [vendor, setVendor] = useState("");
  const [topologyType, setTopologyType] = useState("");
  const [topologyName, setTopologyName] = useState("");
  const [file, setFile] = useState<File | null>(null);

  /* ================= HANDLERS ================= */
  const handleDownloadTemplate = () => {
    if (!topologyType) {
      alert("Please select topology type");
      return;
    }
    // API / static CSV download hook here
    alert(`Download ${topologyType} topology template`);
  };

  const handleUpload = () => {
    if (!file) {
      alert("Please select a CSV file");
      return;
    }
    alert(`CSV uploaded: ${file.name}`);
  };

  const handleViewTopology = () => {
    alert("Render topology on canvas");
  };

  const handleSaveTopology = () => {
    if (!topologyName) {
      alert("Please enter topology name");
      return;
    }
    alert(`Topology saved: ${topologyName}`);
    setTopologyName("");
  };

  /* ================= RENDER ================= */
  return (
    <Box
      sx={{
        height: "calc(100vh - 5vh)",
        width: "100%",
        p: 3,
        bgcolor: "#fff",
        overflow: "auto",
      }}
    >
      {/* ================= HEADER ================= */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          mb: 3,
        }}
      >
        <Box
          sx={{
            width: 4,
            height: 40,
            borderRadius: 2,
            bgcolor: "primary.main",
          }}
        />
        <Box>
          <Typography fontWeight={700}>Create Topology</Typography>
          <Typography fontSize="0.8rem" color="text.secondary">
            Upload CSV and generate network topology
          </Typography>
        </Box>
      </Box>

      {/* ================= CARD ================= */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          border: "1px solid #e0e0e0",
        }}
      >
        {/* ===== Adapter Section ===== */}
        <Typography fontWeight={600} mb={2}>
          Adapter Configuration
        </Typography>

        <Stack direction="row" spacing={2} mb={3} flexWrap="wrap">
          <TextField
            select
            label="Client"
            size="small"
            value={client}
            onChange={(e) => {
              setClient(e.target.value);
              setVendor("");
            }}
            sx={{ width: 220 }}
          >
            {CLIENTS.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="Vendor"
            size="small"
            value={vendor}
            disabled={!client}
            onChange={(e) => setVendor(e.target.value)}
            sx={{ width: 220 }}
          >
            {(CLIENT_VENDOR_MAP[client] || []).map((v) => (
              <MenuItem key={v} value={v}>
                {v}
              </MenuItem>
            ))}
          </TextField>

          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            sx={{ height: 40 }}
            onClick={() => alert("Download NE List")}
          >
            Download NE List
          </Button>
        </Stack>

        <Divider sx={{ my: 3 }} />

        {/* ===== File Upload Section ===== */}
        <Typography fontWeight={600} mb={2}>
          File Upload
        </Typography>

        <Stack direction="row" spacing={2} mb={3} flexWrap="wrap">
          <TextField
            select
            label="Topology Type"
            size="small"
            value={topologyType}
            onChange={(e) => setTopologyType(e.target.value)}
            sx={{ width: 220 }}
          >
            {TOPOLOGY_TYPES.map((t) => (
              <MenuItem key={t.key} value={t.key}>
                {t.label}
              </MenuItem>
            ))}
          </TextField>

          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadTemplate}
            sx={{ height: 40 }}
          >
            Download Template
          </Button>

          <Button
            component="label"
            variant="outlined"
            startIcon={<UploadFileIcon />}
            sx={{ height: 40 }}
          >
            Upload CSV
            <input
              type="file"
              hidden
              accept=".csv"
              onChange={(e) =>
                setFile(e.target.files ? e.target.files[0] : null)
              }
            />
          </Button>

          <Button
            variant="contained"
            onClick={handleUpload}
            sx={{ height: 40 }}
          >
            Upload
          </Button>
        </Stack>

        <Divider sx={{ my: 3 }} />

        {/* ===== Topology Actions ===== */}
        <Typography fontWeight={600} mb={2}>
          Topology Management
        </Typography>

        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <Button
            variant="outlined"
            startIcon={<VisibilityIcon />}
            onClick={handleViewTopology}
          >
            View Topology
          </Button>

          <TextField
            label="Topology Name"
            size="small"
            value={topologyName}
            onChange={(e) => setTopologyName(e.target.value)}
            sx={{ width: 260 }}
          />

          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSaveTopology}
          >
            Save Topology
          </Button>
        </Stack>
      </Paper>

      {/* ================= CANVAS PLACEHOLDER ================= */}
      <Paper
        elevation={0}
        sx={{
          mt: 3,
          height: 480,
          borderRadius: 3,
          border: "2px dashed #e0e0e0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "text.secondary",
        }}
      >
        Topology visualization will appear here
      </Paper>
    </Box>
  );
};

export default CreateTopologyPage;
