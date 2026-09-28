import React from "react";
import { Card, CardContent, Typography, Box } from "@mui/material";
 
type Props = {
  dragEnabled: boolean;
  onToggleDrag: () => void;
};
 
const LinkLegendCard: React.FC<Props> = ({ }) => {
  return (
    <Card
      sx={{
        position: "absolute",
        top: "31.1vw",
        right: "3vw",
        width: "12vw",
        zIndex: 20,
        boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
        fontSize: "1vh",
      }}
    >
      <CardContent sx={{ p: 1.2 }}>
        <Typography sx={{ fontWeight: 600, mb: 1.2, fontSize: "1vw" }}>
          LINK LEGEND
        </Typography>
 
        <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
          <Box sx={{ width: "1.6vw", height: "0.6vh", borderRadius: 1, bgcolor: "#28a745", mr: 1 }} />
          <Typography sx={{ fontSize: "1vw" }}>Up Link</Typography>
        </Box>
 
        <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
          <Box sx={{ width: "1.6vw", height: "0.6vh", borderRadius: 1, bgcolor: "#FF0000", mr: 1 }} />
          <Typography sx={{ fontSize: "1vw" }}>Down Link</Typography>
        </Box>
 
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Box
            sx={{
              width: "1.6vw",
              height: "0.9vh",
              borderRadius: 1,
              borderTop: "3px dotted #000",
              bgcolor: "transparent",
              mr: 1,
            }}
          />
          <Typography sx={{ fontSize: "1vw" }}>Protection Path</Typography>
        </Box>
      </CardContent>
    </Card>
  );
};
export default LinkLegendCard;