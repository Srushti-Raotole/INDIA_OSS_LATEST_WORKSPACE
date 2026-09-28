// NocLayout.tsx
import React, { useState } from "react";
import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import SidebarNav from "./SidebarNav";
import Footer from "./Footer"; //  Import the new Footer

const SIDEBAR_STATE_KEY = "sidebar_open";

const NocLayout = () => {
  const [open, setOpen] = useState(() => {
    try {
      const saved = localStorage.getItem(SIDEBAR_STATE_KEY);
      return saved !== null ? saved === "true" : false;
    } catch {
      return false;
    }
  });

  const handleToggle = () => {
    setOpen((prev) => {
      const next = !prev;
      try { localStorage.setItem(SIDEBAR_STATE_KEY, String(next)); } catch {}
      return next;
    });
  };

  return (
    <Box sx={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden", backgroundColor: "#f8fafc" }}>
      {/* ================= PERSISTENT LEFT STRIP ================= */}
      <SidebarNav open={open} onToggle={handleToggle} />
      
      {/* ================= MAIN CONTENT AREA ================= */}
      <Box 
        sx={{ 
          flexGrow: 1, 
          display: "flex", 
          flexDirection: "column", 
          overflow: "hidden",
          position: "relative"
        }}
      >
        {/* Main Viewport (Scrollable) */}
        <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <Outlet context={{ open, setOpen }} />
        </Box>

        {/* 2.3rem Permanent Footer */}
        <Footer />
      </Box>
    </Box>
  );
};

export default NocLayout;