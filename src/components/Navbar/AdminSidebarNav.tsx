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
  Assignment,
  Settings,
  ListAlt,
  Notifications,
  CompareArrows,
  FactCheck,
  Search,
  Storage,
  Timeline,
  AddBox,
  DashboardOutlined,
  LogoutOutlined,
  SwapHoriz as SwapHorizIcon,
  NotificationsOff, //  Added Icon for Alarm Masking
} from "@mui/icons-material";

import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import { getUser, logout } from "../../utils/auth/auth";
import { logActivity } from "../../utils/activityLogger";

import logo from "../../assets/lscircle.png";
import { openNocPortal } from "../../utils/portalRedirects";
import VersionDialog from "../Navbar/VersionDialog";

const DRAWER_WIDTH_OPEN = 230;
const DRAWER_WIDTH_CLOSED = 60;

// Admin Navigation Items
const NAV_ITEMS = [
  { isHeader: true, label: "ADMINISTRATION" },
  {
    label: "ACTIVITY LOGS",
    path: "/admin/users/admin-activity-logs",
    icon: <ListAlt />,
  },
  {
    label: "NOTIFICATIONS",
    path: "/admin/users/notification-setting",
    icon: <Notifications />,
  },

  { isHeader: true, label: "TICKETING & RECON" },
  { label: "TICKETING", path: "/admin/ticketing", icon: <Assignment /> },
  {
    label: "TICKET MASKING",
    path: "/admin/alarm-masking",
    icon: <NotificationsOff />,
  }, // Added Menu Item
  {
    label: "RECONCILATION",
    path: "/admin/alarm-count",
    icon: <CompareArrows />,
  },
  { label: "AUDIT", path: "/admin/audit", icon: <FactCheck /> },

  { isHeader: true, label: "SYSTEM & UTILITIES" },
  { label: "DISCOVERY", path: "/admin/inv-discovery", icon: <Search /> },
  { label: "SERVER SWITCH", path: "/admin/active-server", icon: <Storage /> },
  { label: "SPANLOSS", path: "/admin/static-span-loss", icon: <Timeline /> },

  { isHeader: true, label: "TOPOLOGY" },
  {
    label: "CREATE TOPOLOGY",
    path: "/admin/create-topology",
    icon: <AddBox />,
  },
  {
    label: "MANAGE TOPOLOGY",
    path: "/admin/manage-topology",
    icon: <Settings />,
  },
];

interface Props {
  open: boolean;
  onToggle: () => void;
}

const AdminSidebarNav: React.FC<Props> = ({ open, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [versionOpen, setVersionOpen] = useState(false);

  const reduxUser = useSelector((state: RootState) => state.user.user);
  const authUser = reduxUser ?? getUser();

  const username =
    (authUser as any)?.userName ?? (authUser as any)?.username ?? "Admin User";
  const roles: string[] =
    (authUser as any)?.roles ??
    (authUser as any)?.authorities ??
    [(authUser as any)?.role].filter(Boolean);
  const isIndiaAdmin = roles.includes("INDIA_ADMIN");

  const getInitials = (name: string) => {
    if (!name || name.trim() === "") return "AD";
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
      activity: "Switched portal to NOC",
      actionName: "PORTAL_SWITCH",
      module: "NAVIGATION",
    });
    openNocPortal();
  };

  const handleLogout = async () => {
    logActivity({
      activity: "Admin Logout",
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
                bgcolor: "#f43f5e",
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
                  Admin Portal
                </Typography>
              </Box>
            )}
          </Box>

          <Divider sx={{ borderColor: "#334155", my: -0.5 }} />

          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
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

            {isIndiaAdmin && (
              <Tooltip
                title={!open ? "Switch to NOC" : ""}
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
                  <DashboardOutlined
                    sx={{ fontSize: "1.15rem", mr: open ? 1 : 0 }}
                  />
                  {open && (
                    <Typography
                      sx={{
                        fontSize: "0.65rem",
                        fontWeight: 600,
                        textTransform: "none",
                      }}
                    >
                      Switch to NOC
                    </Typography>
                  )}
                </Button>
              </Tooltip>
            )}

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
                <LogoutOutlined
                  sx={{ fontSize: "1.15rem", mr: open ? 1 : 0 }}
                />
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

      <VersionDialog open={versionOpen} onClose={() => setVersionOpen(false)} />
    </>
  );
};

export default AdminSidebarNav;
