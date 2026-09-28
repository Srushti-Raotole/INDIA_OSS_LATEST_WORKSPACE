import React, { useState } from "react";
import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import SidebarMenu from "./SidebarMenu";

const InventoryHome = () => {
  const [open, setOpen] = useState(false);

  const handleDrawerOpen = () => setOpen(true);
  const handleDrawerClose = () => setOpen(false);

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        height: '100%', 
        width: '100%', 
        overflow: 'hidden',
        backgroundColor: '#f1f5f9' // Matches the new global backdrop
      }}
    >
      {/* ================= IN-PAGE SIDEBAR ================= */}
      <SidebarMenu open={open} onClose={handleDrawerClose} />

      {/* ================= MAIN CONTENT ENVELOPE ================= */}
      <Box 
        sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          minWidth: 0, 
          overflow: 'hidden' 
        }}
      >
        <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
          {/* Pass down `open` and `handleDrawerOpen` so child pages (like AllPhysicalInventory) 
            know when to display their toggle button.
          */}
          <Outlet context={{ open, handleDrawerOpen, setOpen }} />
        </Box>
      </Box>
    </Box>
  );
};

export default InventoryHome;