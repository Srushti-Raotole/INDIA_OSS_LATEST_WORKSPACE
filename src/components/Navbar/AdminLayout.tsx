import React, { useState } from "react";
import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";

// CRITICAL: This must match the exact spelling of your file name!
import AdminSidebarNav from "../Navbar/AdminSidebarNav"; 
import Footer from "../Navbar/Footer"; 

const AdminLayout = () => {
  const [open, setOpen] = useState(true); // Controls the sidebar width

  return (
    <Box sx={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden", backgroundColor: "#f8fafc" }}>
      
      {/* Passes the state and the toggle function down to the sidebar */}
      <AdminSidebarNav open={open} onToggle={() => setOpen(!open)} />
      
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
        <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <Outlet context={{ open, setOpen }} />
        </Box>
        <Footer />
      </Box>
    </Box>
  );
};

export default AdminLayout;