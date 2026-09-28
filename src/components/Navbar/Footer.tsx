import React from "react";
import { Box, Typography } from "@mui/material";

import logoVega from "../../assets/logo_vega.png"; 

const Footer: React.FC = () => {
  return (
    <Box
      sx={{
        height: "1.75rem",      
        minHeight: "1.75rem",   
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 0.8,               
        backgroundColor: "#ffffff",
        borderTop: "1px solid #e2e8f0",
        width: "100%",
        flexShrink: 0,
        zIndex: 10,
      }}
    >
      <Box 
        component="img" 
        src={logoVega} 
        sx={{ height: 12, opacity: 0.8 }}
        alt="Vegayan Logo" 
      />
      <Typography
        sx={{
          fontSize: "0.55rem", 
          color: "#64748b",
          fontWeight: 700,
          letterSpacing: "0.05em",
        }}
      >
        MANAGED BY VEGAYAN © 2025
      </Typography>
    </Box>
  );
};

export default Footer;