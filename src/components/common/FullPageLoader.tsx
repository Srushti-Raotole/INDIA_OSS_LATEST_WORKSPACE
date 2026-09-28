import React from "react";
import { Box, LinearProgress, Typography, Fade } from "@mui/material";

type Props = {
  message?: string;
};

const FullPageLoader: React.FC<Props> = ({ message = "Loading data..." }) => {
  return (
    <Fade in timeout={200}>
      <Box
        sx={{
          /* Centered floating asset layer without background blur */
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 1300,
          backgroundColor: "#ffffff",
          border: "1px solid #cbd5e1",
          borderRadius: "8px",
          p: 2,
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          width: 320,
          boxSizing: "border-box",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)"
        }}
      >
        {/* Status Copy Information Slot */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.2, minWidth: 0 }}>
          {/* <Typography
            sx={{
              fontSize: "0.68rem",
              fontWeight: 700,
              color: "#354a6b",
              textTransform: "uppercase",
              letterSpacing: "0.05em"
            }}
          >
            Requesting 
          </Typography> */}
          
          <Typography
            sx={{
              fontSize: "0.72rem",
              fontWeight: 600,
              color: "#475569",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}
          >
            {message}
          </Typography>
        </Box>

        {/* Linear Processing Bar Gauge */}
        <LinearProgress
          sx={{
            height: 4,
            borderRadius: "2px",
            backgroundColor: "#f1f5f9",
            "& .MuiLinearProgress-bar": {
              backgroundColor: "#354a6b",
            }
          }}
        />

        {/* Subtext Wait Anchor */}
        <Box sx={{ display: "flex", alignItems: "center", mt: 0.2 }}>
          <Typography sx={{ fontSize: "0.62rem", fontWeight: 500, color: "#94a3b8" }}>
                     </Typography>
        </Box>
      </Box>
    </Fade>
  );
};

export default FullPageLoader;