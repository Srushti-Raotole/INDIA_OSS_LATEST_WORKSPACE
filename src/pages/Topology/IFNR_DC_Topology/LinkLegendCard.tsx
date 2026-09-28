import React from "react";
import { Card, CardContent, Typography, Box } from "@mui/material";
 
type Props = {
  dragEnabled: boolean;
  onToggleDrag: () => void;
};
 
const LinkLegendCard: React.FC<Props> = ({  }) => {
  return (
    <Card
      sx={{
        position: "absolute",
        top: "65vh",
        right: "1vw",
        width: "14vw",
        zIndex: 20,
        boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
        fontSize: 12,
      }}
    >
      <CardContent sx={{ p: 1.2 }}>
        <Typography sx={{ fontWeight: 600, mb: 1.2, fontSize: 13 }}>
          LINK LEGEND
        </Typography>
 
        <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
          <Box sx={{ width: 20, height: 5, borderRadius: 1, bgcolor: "#28a745", mr: 1 }} />
          <Typography sx={{ fontSize: 12 }}>Up Link</Typography>
        </Box>
 
        <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
          <Box sx={{ width: 20, height: 5, borderRadius: 1, bgcolor: "#FF0000", mr: 1 }} />
          <Typography sx={{ fontSize: 12 }}>Down Link</Typography>
        </Box>
 
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Box
            sx={{
              width: 20,
              height: 3,
              borderRadius: 1,
              borderTop: "3px dotted #000",
              bgcolor: "transparent",
              mr: 1,
            }}
          />
          <Typography sx={{ fontSize: 12 }}>Protection Path</Typography>
        </Box>
 
        {/*  Drag toggle (same style as conc) */}
        {/* <Box
          sx={{ display: "flex", alignItems: "center", gap: 1, cursor: "pointer", mt: 1 }}
          onClick={onToggleDrag}
        >
          <Box
            sx={{
              width: 28,
              height: 14,
              borderRadius: 999,
              bgcolor: dragEnabled ? "#0d6efd" : "#adb5bd",
              position: "relative",
              transition: "background-color 0.2s ease",
            }}
          >
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: "50%",
                bgcolor: "#fff",
                position: "absolute",
                top: 1,
                left: dragEnabled ? 15 : 1,
                transition: "left 0.2s ease",
                boxShadow: "0 0 2px rgba(0,0,0,0.3)",
              }}
            />
          </Box>
          <Typography sx={{ fontSize: 12, fontWeight: 800 }}>Drag</Typography>
        </Box> */}
      </CardContent>
    </Card>
  );
};
 
export default LinkLegendCard;