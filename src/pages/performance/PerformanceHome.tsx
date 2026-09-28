import React, { useState } from "react";
import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import SidebarMenu from "./SidebarMenu"; 

const SIDEBAR_WIDTH = 240;

const PerformanceHome: React.FC = () => {
  const [open, setOpen] = useState(true);

  return (
    <Box 
      sx={{ 
        display: "flex", 
        height: "calc(100vh - 44px)", 
        width: "100%", 
        overflow: "hidden",
        backgroundColor: "#ffffff"
      }}
    >
      <Box
        sx={{
          width: open ? SIDEBAR_WIDTH : 0,
          transition: "width 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          borderRight: open ? "1px solid #e2e8f0" : "none",
          backgroundColor: "#ffffff",
          overflow: "hidden"
        }}
      >
        {open && <SidebarMenu open={open} onClose={() => setOpen(false)} />}
      </Box>

      <Box
        sx={{
          flexGrow: 1,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#ffffff",
        }}
      >
        <Outlet context={{ open, setOpen }} />
      </Box>
    </Box>
  );
};

export default PerformanceHome;