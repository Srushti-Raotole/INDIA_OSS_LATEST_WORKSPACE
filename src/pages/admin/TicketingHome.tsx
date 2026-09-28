import React from "react";
import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import AdminNavbar from "../../components/Navbar/AdminNavbar";

const TicketingHome: React.FC = () => {
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
      {/* ================= TOP NAVBAR (44px Fixed Height Track) ================= */}
      <AdminNavbar />

      {/* ================= PAGE CONTENT VIEWPORT (NO sidebar full bleed layout) ================= */}
      <Box
        sx={{
          flexGrow: 1,
          height: "calc(100vh - 44px)", // Deducts precise navigation offset bounds
          width: "100%",               // Bounded at 100% instead of raw vw view elements
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          position: "relative"
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default TicketingHome;