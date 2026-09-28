import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";
import { useEffect } from "react";
import AdminNavbar from "../Navbar/AdminNavbar";

const NAVBAR_HEIGHT = "5vh"; 

function AdminLayout() {
  useEffect(() => {
    document.title = "INDIA OSS | ADMIN PORTAL";
  }, []);

  return (
    <Box
      sx={{
        height: "100vh",          // FULL viewport
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",       // prevent double scroll
      }}
    >
      {/* ===== ADMIN NAVBAR ===== */}
      <AdminNavbar />

      {/* ===== ADMIN CONTENT ===== */}
      <Box
        component="main"
        sx={{
          flex: 1,                                
          height: `calc(100vh - ${NAVBAR_HEIGHT})`,
          overflow: "auto",                       
          backgroundColor: "#f4f6f8",
          boxSizing: "border-box",
          p: 2,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}

export default AdminLayout;
