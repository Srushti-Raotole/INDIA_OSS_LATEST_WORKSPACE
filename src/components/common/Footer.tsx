import { Box, Typography } from "@mui/material";
import vegayanLogo from "../../assets/logo_vega.png";

type FooterProps = {
  sidebarOpen: boolean;
  drawerWidth: string;
};

const Footer: React.FC<FooterProps> = ({ sidebarOpen, drawerWidth }) => {
  return (
    <Box
      component="footer"
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        height: "4vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 1,
        px: 2,
        borderTop: "1px solid #e0e0e0",
        backgroundColor: "#fff",
        fontSize: "0.75rem",
        color: "#6b7280",

        ml: sidebarOpen ? drawerWidth : 0,
        transition: "margin-left 0.3s ease",
        zIndex: 1200, // ensures it stays above content
      }}
    >
      <Typography variant="caption">Managed by</Typography>

      <Box
        component="img"
        src={vegayanLogo}
        alt="Vegayan"
        sx={{ height: "2.2vh" }}
      />

      <Typography variant="caption" fontWeight={600}>
        Vegayan
      </Typography>

      <Typography variant="caption">
        © {new Date().getFullYear()}
      </Typography>
    </Box>
  );
};

export default Footer;
