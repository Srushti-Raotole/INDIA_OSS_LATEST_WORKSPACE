import React from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Stack,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";

/* ================= PAGE ================= */
const TopologyUtilityPage: React.FC = () => {
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
          mb: 4,
        }}
      >
        {/* Accent bar */}
        <Box
          sx={{
            width: 4,
            height: 42,
            borderRadius: 2,
            bgcolor: "primary.main",
          }}
        />

        <Box>
          <Typography
            sx={{
              fontSize: "1.25rem",
              fontWeight: 700,
            }}
          >
            Topology Utility
          </Typography>

          <Typography
            sx={{
              fontSize: "0.85rem",
              color: "text.secondary",
            }}
          >
            Create and manage network topologies
          </Typography>
        </Box>
      </Box>

      {/* ================= CARDS CONTAINER ================= */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          gap: 4,
          flexWrap: "wrap", // responsive
        }}
      >
        {/* ===== CREATE TOPOLOGY ===== */}
        <Paper
          elevation={0}
          sx={{
            width: 420,
            maxWidth: "100%",
            p: 4,
            borderRadius: 3,
            border: "1px solid #e0e0e0",
            textAlign: "center",
            transition: "all 0.25s ease",
            "&:hover": {
              transform: "translateY(-6px)",
              boxShadow: "0 18px 40px rgba(0,0,0,0.08)",
            },
          }}
        >
          <Stack spacing={3} alignItems="center">
            <AddCircleOutlineIcon
              sx={{
                fontSize: 72,
                color: "primary.main",
              }}
            />

            <Typography
              sx={{
                fontSize: "1.1rem",
                fontWeight: 700,
              }}
            >
              Create Topology
            </Typography>

            <Typography
              sx={{
                fontSize: "0.85rem",
                color: "text.secondary",
                maxWidth: 300,
              }}
            >
              Create a new network topology from scratch using CSV
              templates or manual configuration.
            </Typography>

            <Button
              variant="contained"
              size="large"
              startIcon={<AddCircleOutlineIcon />}
              sx={{
                px: 4,
                borderRadius: 2,
              }}
              onClick={() => {
                // navigate("/admin/topology/create");
              }}
            >
              Create Topology
            </Button>
          </Stack>
        </Paper>

        {/* ===== MANAGE TOPOLOGY ===== */}
        <Paper
          elevation={0}
          sx={{
            width: 420,
            maxWidth: "100%",
            p: 4,
            borderRadius: 3,
            border: "1px solid #e0e0e0",
            textAlign: "center",
            transition: "all 0.25s ease",
            "&:hover": {
              transform: "translateY(-6px)",
              boxShadow: "0 18px 40px rgba(0,0,0,0.08)",
            },
          }}
        >
          <Stack spacing={3} alignItems="center">
            <EditOutlinedIcon
              sx={{
                fontSize: 72,
                color: "primary.main",
              }}
            />

            <Typography
              sx={{
                fontSize: "1.1rem",
                fontWeight: 700,
              }}
            >
              Manage Topology
            </Typography>

            <Typography
              sx={{
                fontSize: "0.85rem",
                color: "text.secondary",
                maxWidth: 300,
              }}
            >
              View, edit, delete or visualize existing
              network topologies.
            </Typography>

            <Button
              variant="contained"
              size="large"
              startIcon={<EditOutlinedIcon />}
              sx={{
                px: 4,
                borderRadius: 2,
              }}
              onClick={() => {
                // navigate("/admin/topology/manage");
              }}
            >
              Manage Topologies
            </Button>
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
};

export default TopologyUtilityPage;
