
import { Box } from "@mui/material";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export const ResponsiveLayout = ({ children }: Props) => {
  return (
    <Box
      sx={{
        width: "100vw",           // full screen width
        height: "100vh",          // full screen height
        overflow: "auto",         // allows internal scroll if needed
        display: "flex",
        flexDirection: "column",
        padding: { xs: 1, sm: 2, md: 3 }, // responsive padding
        boxSizing: "border-box",
        backgroundColor: "#000",   // optional default bg
      }}
    >
      {children}
    </Box>
  );
};



