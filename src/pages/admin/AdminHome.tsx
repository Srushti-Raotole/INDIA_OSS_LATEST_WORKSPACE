import React, { useState } from "react";
import { Box, IconButton } from "@mui/material";
import { Outlet } from "react-router-dom";
import { Menu as MenuIcon } from "@mui/icons-material";

import SidebarMenu from "./SidebarMenu";
import AdminNavbar from "../../components/Navbar/AdminNavbar";

const SIDEBAR_WIDTH = 240;

const AdminHome: React.FC = () => {
  const [open, setOpen] = useState(true);

  return (
    <Box 
      sx={{ 
        display: "flex", 
        flexDirection: "column", 
        height: "100vh", 
        width: "100%", 
        overflow: "hidden",
        backgroundColor: "#ffffff"
      }}
    >
      {/* ================= TOP ADMIN NAVBAR (44px Fixed Height Track) ================= */}
      <AdminNavbar />

      {/* ================= PAGE BODY CORE CHASSIS CONTAINER ================= */}
      <Box
        sx={{
          display: "flex",
          height: "calc(100vh - 44px)",
          width: "100%",
          overflow: "hidden",
          position: "relative"
        }}
      >
        {/* ================= LEFT AREA: SIDEBAR DRAWER PANEL (Collapses fully to 0px) ================= */}
        <Box
          sx={{
            width: open ? SIDEBAR_WIDTH : 0,
            transition: "width 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            borderRight: open ? "1px solid #e2e8f0" : "none",
            backgroundColor: "#f8fafc",
            overflow: "hidden",
            position: "relative"
          }}
        >
          {open && (
            <SidebarMenu 
              open={open} 
              onClose={() => setOpen(false)} 
            />
          )}
        </Box>

        {/* ================= FLOATING MENU TOGGLE BAR ANCHOR (Only visible when sidebar is closed) ================= */}
        {!open && (
          <Box
            sx={{
              position: "absolute",
              left: 12,
              top: 18,
              zIndex: 1099,
            }}
          >
          </Box>
        )}

        {/* ================= RIGHT AREA: MAIN CONTENT CONTAINER VIEWPORT ================= */}
        <Box
          sx={{
            flexGrow: 1,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "#ffffff",
            position: "relative"
          }}
        >
          {/* Passes down sidebar layout states securely to downstream admin reports */}
          <Outlet context={{ open, setOpen }} />
        </Box>
      </Box>
    </Box>
  );
};

export default AdminHome;