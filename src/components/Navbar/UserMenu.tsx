import React from "react";
import { useSelector } from "react-redux";
import {
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from "@mui/material";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz"; // Great icon for switching

import type { RootState } from "../../store/store";
import { openAdminPortal, openNocPortal } from "../../utils/portalRedirects";
import { getUser } from "../../utils/auth/auth";
import { logActivity } from "../../utils/activityLogger";

type PortalType = "NOC" | "ADMIN";

interface SidebarPortalSwitchProps {
  portalType: PortalType;
}

export default function SidebarPortalSwitch({ portalType }: SidebarPortalSwitchProps) {
  // 1. Fetch User & Roles
  const reduxUser = useSelector((state: RootState) => state.user.user);
  const authUser = reduxUser ?? getUser();
  
  const roles: string[] =
    (authUser as any)?.roles ??
    (authUser as any)?.authorities ??
    [(authUser as any)?.role].filter(Boolean);

  // 2. Permission Check
  const isIndiaAdmin = roles.includes("INDIA_ADMIN");

  // Hide entirely from the sidebar if the user doesn't have access
  if (!isIndiaAdmin) return null;

  // 3. Switch Logic
  const handleSwitchPortal = async () => {
    logActivity({
      activity: `Switched portal to ${portalType === "ADMIN" ? "NOC" : "ADMIN"}`,
      actionName: "PORTAL_SWITCH",
      module: "NAVIGATION",
    });

    if (portalType === "ADMIN") {
      openNocPortal(); // → /faults/active
    } else {
      openAdminPortal(); // → /admin
    }
  };

  const targetPortalName = portalType === "ADMIN" ? "NOC Portal" : "Admin Portal";

  return (
    <Tooltip title={`Switch to ${targetPortalName}`} placement="right">
      <ListItemButton
        onClick={handleSwitchPortal}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between", // Keeps text and swap icon on opposite ends
          borderRadius: 1,
          mx: 1,
          mb: 1,
          backgroundColor: "rgba(0, 0, 0, 0.04)", // Slight highlight to separate it from standard links
          "&:hover": {
            backgroundColor: "rgba(0, 0, 0, 0.08)",
          },
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <ListItemIcon sx={{ minWidth: 40 }}>
            {portalType === "ADMIN" ? (
              <HomeOutlinedIcon fontSize="small" />
            ) : (
              <AdminPanelSettingsOutlinedIcon fontSize="small" />
            )}
          </ListItemIcon>
          <ListItemText 
            primary={`Go to ${targetPortalName}`} 
            primaryTypographyProps={{ fontSize: "0.85rem", fontWeight: 600, whiteSpace: "nowrap" }} 
          />
        </div>
        
        {/* Adds a nice visual indicator that this is a switch action */}
        <SwapHorizIcon fontSize="small" sx={{ color: "text.secondary", ml: 1 }} />
      </ListItemButton>
    </Tooltip>
  );
}