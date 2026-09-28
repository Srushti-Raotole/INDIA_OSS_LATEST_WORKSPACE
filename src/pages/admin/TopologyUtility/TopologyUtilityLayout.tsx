import React from "react";
import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";

const TopologyUtilityLayout: React.FC = () => {
  return (
    <Box
      sx={{
        height: "100%",
        width: "100%",
        backgroundColor: "#fff",
      }}
    >
      <Outlet />
    </Box>
  );
};

export default TopologyUtilityLayout;
