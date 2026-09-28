// running code with sidebar
import { Box } from "@mui/material";
import { MenuIcon } from "lucide-react";
import { useState } from "react";
import { Outlet } from "react-router-dom";
import SidebarMenu from "./SidebarMenu";

const TopologyHome = () => {
    const [open, setOpen] = useState(false);

    const handleDrawerOpen = () => {
        setOpen(true);
    };
    const handleDrawerClose = () => {
        setOpen(false);
    };
    return (
        <Box sx={{ display: "flex", height: "95vh", border: '1px solid green' }}>
            {/* Left Column - Menu Button Area */}
            <Box
                sx={{
                    width: open ? "19vw" : "5vh", // 19vw when open, 5vh when closed
                    backgroundColor: "white",
                    display: "flex",
                    ml: open ? '3vw' : '0',
                    justifyContent: "center",
                    alignItems: "flex-start",
                    pt: '2vh',
                    transition: "width 0.3s ease-in-out, background-color 0.3s ease",
                    boxShadow: open ? 3 : 0,
                    overflow: "hidden",
                    position: "relative",
                }}
            >
                {/* Menu Button */}
                <Box
                    onClick={open ? handleDrawerClose : handleDrawerOpen}
                    sx={{
                        cursor: "pointer",
                        display: "flex",
                        position: "relative",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "black",
                        p: 0.5,
                        "&:hover": { color: "#3c4b5aff" },
                    }}
                >
                    <MenuIcon />
                </Box>

                {/* SidebarMenu only if open */}
                {open && (

                    <SidebarMenu open={open} onClose={handleDrawerClose} />

                )}
            </Box>
            {/* Main Content */}
            <Box sx={{ flexGrow: 1, transition: "margin-left 1s ease-in-out", width: '100%' }}>
                <Outlet context={{ open }} />
            </Box>
        </Box>
    );
};
export default TopologyHome;

