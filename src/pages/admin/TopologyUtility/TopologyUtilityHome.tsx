import React from "react";
import { Box, Paper, Typography, Button, Stack } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import { useNavigate } from "react-router-dom";

const TopologyUtilityHome: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        height: "calc(100vh - 5vh)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        p: 3,
      }}
    >
      {/* CREATE */}
      <Paper
        elevation={0}
        sx={{
          width: 380,
          p: 4,
          textAlign: "center",
          borderRadius: 3,
          border: "1px solid #e0e0e0",
          transition: "0.25s",
          "&:hover": {
            boxShadow: 6,
            transform: "translateY(-6px)",
          },
        }}
      >
        <AddIcon sx={{ fontSize: 56, color: "primary.main", mb: 2 }} />
        <Typography fontWeight={700} mb={1}>
          Create Topology
        </Typography>
        <Typography fontSize="0.85rem" color="text.secondary" mb={3}>
          Create a new network topology
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate("create")}
        >
          Create
        </Button>
      </Paper>

      {/* MANAGE */}
      <Paper
        elevation={0}
        sx={{
          width: 380,
          p: 4,
          textAlign: "center",
          borderRadius: 3,
          border: "1px solid #e0e0e0",
          transition: "0.25s",
          "&:hover": {
            boxShadow: 6,
            transform: "translateY(-6px)",
          },
        }}
      >
        <EditIcon sx={{ fontSize: 56, color: "primary.main", mb: 2 }} />
        <Typography fontWeight={700} mb={1}>
          Manage Topologies
        </Typography>
        <Typography fontSize="0.85rem" color="text.secondary" mb={3}>
          View or edit existing topologies
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate("manage")}
        >
          Manage
        </Button>
      </Paper>
    </Box>
  );
};

export default TopologyUtilityHome;
