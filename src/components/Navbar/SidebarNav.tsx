import React, { useState } from "react";
import { PORTALS_URL } from "../../api/config";
import {
  Box,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
  Divider,
  Button,
  Avatar,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Menu as MenuIcon,
  MenuOpen as MenuOpenIcon,
  Dashboard,
  Warning,
  History,
  Assignment,
  Inventory,
  Assessment,
  Hub,
  Settings,
  ListAlt,
  Schedule,
  AdminPanelSettingsOutlined,
  LogoutOutlined,
  SwapHoriz as SwapHorizIcon,
} from "@mui/icons-material";

import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import { getUser, logout } from "../../utils/auth/auth";
import { openAdminPortal } from "../../utils/portalRedirects";
import { logActivity } from "../../utils/activityLogger";

import logo from "../../assets/favicon.png";
import VersionDialog from "./VersionDialog"; //  Import the new Version Dialog

const DRAWER_WIDTH_OPEN = 230;
const DRAWER_WIDTH_CLOSED = 60;

const NAV_ITEMS = [
  { label: "DASHBOARD", path: "/indianetwork/map", icon: <Dashboard /> },

  { isHeader: true, label: "FAULTS & TICKETING" },
  { label: "ACTIVE FAULTS", path: "/faults/active", icon: <Warning /> },
  { label: "HISTORIC FAULTS", path: "/faults/historical", icon: <History /> },
  { label: "TICKETING", path: "/faults/ticketing", icon: <Assignment /> },

  { isHeader: true, label: "NETWORK & REPORTS" },
  { label: "INVENTORY", path: "/inventory", icon: <Inventory /> },
  { label: "PERFORMANCE", path: "/performance-report", icon: <Assessment /> },
  { label: "SCHEDULED", path: "/scheduled-report", icon: <Schedule /> },
  { label: "TOPOLOGY", path: "/topology", icon: <Hub /> },

  { isHeader: true, label: "UTILITIES" },
  { label: "CONFIG", path: "/utility/config", icon: <Settings /> },
  { label: "SI LIST", path: "/utility/si-list", icon: <ListAlt /> },
];

interface Props {
  open: boolean;
  onToggle: () => void;
}

const SidebarNav: React.FC<Props> = ({ open, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [versionOpen, setVersionOpen] = useState(false); //  State for Version Dialog

  const reduxUser = useSelector((state: RootState) => state.user.user);
  const authUser = reduxUser ?? getUser();

  const username =
    (authUser as any)?.userName ?? (authUser as any)?.username ?? "User";
  const roles: string[] =
    (authUser as any)?.roles ??
    (authUser as any)?.authorities ??
    [(authUser as any)?.role].filter(Boolean);
  const isIndiaAdmin = roles.includes("INDIA_ADMIN");

  const getInitials = (name: string) => {
    if (!name || name.trim() === "") return "US";
    return name
      .trim()
      .split(" ")
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };
  const initials = getInitials(username);

  const isActive = (path?: string) =>
    path ? location.pathname.includes(path) : false;

  const handleSwitchPortal = async () => {
    logActivity({
      activity: "Switched portal to ADMIN",
      actionName: "PORTAL_SWITCH",
      module: "NAVIGATION",
    });
    openAdminPortal();
  };

  const handleLogout = async () => {
    logActivity({
      activity: "User Logout",
      actionName: "LOGOUT",
      module: "AUTH",
    });
    await logout();
  };

  return (
    <>
      <Box
        sx={{
          width: open ? DRAWER_WIDTH_OPEN : DRAWER_WIDTH_CLOSED,
          height: "100vh",
          backgroundColor: "#1e293b",
          borderRight: "1px solid #334155",
          transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          overflowX: "hidden",
          display: "flex",
          flexDirection: "column",
          flexShrink: 0,
          zIndex: 1200,
        }}
      >
        {/* HEADER */}
        <Box
          sx={{
            minHeight: open ? 56 : 90,
            display: "flex",
            flexDirection: open ? "row" : "column",
            alignItems: "center",
            justifyContent: open ? "space-between" : "center",
            px: open ? 1.5 : 0,
            py: open ? 0 : 1,
            borderBottom: "1px solid #334155",
            transition: "all 0.25s ease",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              overflow: "hidden",
              mb: open ? 0 : 1,
            }}
          >
            <Box
              component="img"
              src={logo}
              sx={{
                height: open ? 18 : 22,
                width: open ? 18 : 22,
                objectFit: "contain",
                flexShrink: 0,
              }}
              alt="Logo"
            />
            {open && (
              <Typography
                noWrap
                sx={{
                  color: "#ffffff",
                  fontWeight: 800,
                  fontSize: "0.75rem",
                  letterSpacing: "0.05em",
                }}
              >
                LIGHTSTORM
              </Typography>
            )}
          </Box>
          <IconButton
            onClick={onToggle}
            sx={{
              flexShrink: 0,
              color: "#cbd5e1",
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.1)",
                color: "#ffffff",
              },
            }}
          >
            {open ? (
              <MenuOpenIcon sx={{ fontSize: "1.2rem" }} />
            ) : (
              <MenuIcon sx={{ fontSize: "1.2rem" }} />
            )}
          </IconButton>
        </Box>

        {/* NAVIGATION LINKS */}
        <List
          sx={{ flexGrow: 1, overflowY: "auto", overflowX: "hidden", pb: 2 }}
        >
          {NAV_ITEMS.map((item, index) => {
            if (item.isHeader) {
              return open ? (
                <Typography
                  key={`header-${index}`}
                  noWrap
                  sx={{
                    color: "#64748b",
                    fontSize: "0.6rem",
                    fontWeight: 800,
                    letterSpacing: "0.05em",
                    px: 2.5,
                    mt: 1.5,
                    mb: 0.5,
                  }}
                >
                  {item.label}
                </Typography>
              ) : (
                <Divider
                  key={`divider-${index}`}
                  sx={{ borderColor: "#334155", my: 1.5, mx: 1.5 }}
                />
              );
            }

            const isSingleActive = isActive(item.path);

            return (
              <Tooltip
                key={item.label}
                title={!open ? item.label : ""}
                placement="right"
                disableInteractive
              >
                <ListItem
                  onClick={() => navigate(item.path!)}
                  sx={{
                    justifyContent: "center",
                    px: open ? 2.5 : 0,
                    py: 1,
                    color: isSingleActive ? "#f43f5e" : "#cbd5e1",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    "&:hover": {
                      color: "#ffffff",
                      backgroundColor: "rgba(255,255,255,0.05)",
                    },
                    borderLeft: isSingleActive
                      ? "3px solid #f43f5e"
                      : "3px solid transparent",
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: open ? 2 : 0,
                      color: "inherit",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      "& .MuiSvgIcon-root": { fontSize: "1.15rem" },
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>

                  {open && (
                    <ListItemText
                      primary={item.label}
                      sx={{
                        m: 0,
                        "& span": {
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          letterSpacing: "0.02em",
                        },
                      }}
                    />
                  )}
                </ListItem>
              </Tooltip>
            );
          })}
        </List>

        {/* BOTTOM FOOTER MENU */}
        <Divider sx={{ borderColor: "#334155" }} />
        <Box
          sx={{
            p: open ? 1.5 : 1,
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
            backgroundColor: "rgba(0,0,0,0.15)",
          }}
        >
          {/* User Profile */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: open ? "flex-start" : "center",
              gap: 1.5,
            }}
          >
            <Avatar
              sx={{
                width: 26,
                height: 26,
                fontSize: "0.7rem",
                fontWeight: 700,
                bgcolor: "#475569",
              }}
            >
              {initials}
            </Avatar>
            {open && (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
              >
                <Typography
                  noWrap
                  sx={{ fontSize: "0.7rem", fontWeight: 700, color: "#fff" }}
                >
                  {username}
                </Typography>
                <Typography
                  noWrap
                  sx={{ fontSize: "0.55rem", color: "#94a3b8" }}
                >
                  NOC Portal
                </Typography>
              </Box>
            )}
          </Box>

          <Divider sx={{ borderColor: "#334155", my: -0.5 }} />

          {/* Actions */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            {/* 1. External Portal Switcher */}
            <Tooltip
              title={!open ? "Switch Portal" : ""}
              placement="right"
              disableInteractive
            >
              <Button
                variant={open ? "outlined" : "text"}
                onClick={() => {
                  window.location.href =
                    PORTALS_URL;
                }}
                sx={{
                  color: "#e5e7eb",
                  borderColor: open ? "#475569" : "transparent",
                  textTransform: "none",
                  fontSize: "0.65rem",
                  fontWeight: 600,
                  height: 28,
                  minWidth: 0,
                  px: open ? 1.2 : 0,
                  justifyContent: open ? "flex-start" : "center",
                  transition: "all 0.15s ease-in-out",
                  "& .MuiButton-startIcon": { mr: open ? 1 : 0, ml: 0 },
                  "& .MuiSvgIcon-root": { fontSize: "1.15rem" },
                  "&:hover": {
                    borderColor: "#b71d4c",
                    backgroundColor: "rgba(183,29,76,0.1)",
                    color: "#ffffff",
                  },
                }}
              >
                <SwapHorizIcon />
                {open && "Switch Portal"}
              </Button>
            </Tooltip>

            {/* 2. Admin Switcher (If India Admin) */}
            {isIndiaAdmin && (
              <Tooltip
                title={!open ? "Switch to Admin" : ""}
                placement="right"
                disableInteractive
              >
                <Button
                  onClick={handleSwitchPortal}
                  variant="text"
                  sx={{
                    minWidth: 0,
                    height: 28,
                    px: open ? 1.2 : 0,
                    color: "#cbd5e1",
                    justifyContent: open ? "flex-start" : "center",
                    "& .MuiButton-startIcon": { mr: open ? 1 : 0, ml: 0 },
                    "&:hover": {
                      color: "#fff",
                      bgcolor: "rgba(255,255,255,0.05)",
                    },
                  }}
                >
                  <AdminPanelSettingsOutlined sx={{ fontSize: "1.15rem" }} />
                  {open && (
                    <Typography
                      sx={{
                        fontSize: "0.65rem",
                        fontWeight: 600,
                        textTransform: "none",
                      }}
                    >
                      Switch to Admin
                    </Typography>
                  )}
                </Button>
              </Tooltip>
            )}

            {/* 3. Logout */}
            <Tooltip
              title={!open ? "Logout" : ""}
              placement="right"
              disableInteractive
            >
              <Button
                onClick={handleLogout}
                variant="text"
                sx={{
                  minWidth: 0,
                  height: 28,
                  px: open ? 1.2 : 0,
                  color: "#f43f5e",
                  justifyContent: open ? "flex-start" : "center",
                  "& .MuiButton-startIcon": { mr: open ? 1 : 0, ml: 0 },
                  "&:hover": { color: "#fff", bgcolor: "rgba(244,63,94,0.15)" },
                }}
              >
                <LogoutOutlined sx={{ fontSize: "1.15rem" }} />
                {open && (
                  <Typography
                    sx={{
                      fontSize: "0.65rem",
                      fontWeight: 600,
                      textTransform: "none",
                    }}
                  >
                    Logout
                  </Typography>
                )}
              </Button>
            </Tooltip>
          </Box>

          {/* Version Dialog Trigger */}
          <Box
            onClick={() => setVersionOpen(true)}
            sx={{
              display: "flex",
              justifyContent: "center",
              cursor: "pointer",
              opacity: 0.6,
              "&:hover": { opacity: 1 },
            }}
          >
            <Typography
              sx={{ fontSize: "0.55rem", color: "#94a3b8", fontWeight: 600 }}
            >
              v3.0.0
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Embedded Version Dialog */}
      <VersionDialog open={versionOpen} onClose={() => setVersionOpen(false)} />
    </>
  );
};

export default SidebarNav;
