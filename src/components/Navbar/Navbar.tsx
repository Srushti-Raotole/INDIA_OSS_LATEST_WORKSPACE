import React, { useState } from "react";
import { PORTALS_URL } from "../../api/config";
import { useNavigate, useLocation } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Box,
  Typography,
  IconButton,
  Drawer,
  Menu,
  MenuItem,
  Stack,
  Divider,
  Button,
} from "@mui/material";

// CONSOLIDATED ICON IMPORTS TO PREVENT VITE DESYNC
import {
  Menu as MenuIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  SwapHoriz as SwapHorizIcon,
} from "@mui/icons-material";

import logo from "../../assets/lscircle.png";
import logoVega from "../../assets/logo_vega.png";

import UserMenu from "./UserMenu";
import DateTimeDisplay from "./Utils/DateTimeDisplay";
import VersionDialog from "./Utils/VersionDialog";

/* ================= NAV TYPES & ITEMS ================= */
type NavLeaf = { label: string; path: string };
type NavGroup = { label: string; menu: NavLeaf[] };
type NavItem = NavLeaf | NavGroup;

const NAV_ITEMS: NavItem[] = [
  { label: "DASHBOARD", path: "indianetwork/map" },
  { label: "FAULT", path: "/faults/active" },
  { label: "INVENTORY", path: "/inventory" },
  {
    label: "REPORTS",
    menu: [
      { label: "PERFORMANCE", path: "/performance-report" },
      { label: "SCHEDULED", path: "/scheduled-report" },
    ],
  },
  { label: "TOPOLOGY", path: "/topology" },
  {
    label: "UTILITY",
    menu: [
      { label: "CONFIG", path: "/utility/config" },
      { label: "SI LIST", path: "/utility/si-list" },
    ],
  },
];

const isGroup = (item: NavItem): item is NavGroup => "menu" in item;

/* ================= COMPONENT ================= */
const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [versionOpen, setVersionOpen] = useState(false);

  // Track targeted submenu anchors independently to prevent dropdown collisions
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [activeMenuLabel, setActiveMenuLabel] = useState<string | null>(null);

  const handleDropdownOpen = (
    event: React.MouseEvent<HTMLElement>,
    label: string,
  ) => {
    setAnchorEl(event.currentTarget);
    setActiveMenuLabel(label);
  };

  const handleDropdownClose = () => {
    setAnchorEl(null);
    setActiveMenuLabel(null);
  };

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          height: "44px", // SHRUNK NAVBAR HEIGHT FOR COMPACT DASHBOARD LOOK
          minHeight: "44px",
          backgroundColor: "#1e293b",
          borderBottom: "1px solid #334155",
          justifyContent: "center",
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar
          disableGutters
          sx={{
            px: 1.5,
            minHeight: "44px !important",
            height: "44px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* ================= LEFT SECTION ================= */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              overflow: "hidden",
            }}
          >
            <IconButton
              onClick={() => setMobileOpen(true)}
              edge="start"
              sx={{
                display: { xs: "flex", md: "none" },
                color: "#f8fafc",
                p: 0.5,
              }}
            >
              <MenuIcon fontSize="small" />
            </IconButton>

            {/* Standardized Logo Bounds */}
            <Box
              component="img"
              src={logo}
              alt="Brand Logo"
              sx={{
                height: 20, // COMPACT LOGO SCALE
                width: "auto",
                objectFit: "contain",
                flexShrink: 0,
              }}
            />

            {/* Desktop Navigation Link Track */}
            <Box
              sx={{
                display: { xs: "none", md: "flex" },
                alignItems: "center",
                gap: 1.8, // REDUCED TEXT INNER GAPS FOR EXTRA COMPRESSION
                ml: 2,
                height: "100%",
              }}
            >
              {NAV_ITEMS.map((item) => {
                if (isGroup(item)) {
                  const isSubActive = item.menu.some((sub) =>
                    isActive(sub.path),
                  );
                  return (
                    <Box
                      key={item.label}
                      onClick={(e) => handleDropdownOpen(e, item.label)}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        cursor: "pointer",
                        fontSize: "0.72rem", // COMPACT TEXT FOR SINGLE LINE ALLOTMENT
                        fontWeight: 700,
                        color: isSubActive ? "#f43f5e" : "#cbd5e1",
                        transition: "all 0.15s ease",
                        "&:hover": { color: "#f43f5e" },
                      }}
                    >
                      {item.label}
                      <KeyboardArrowDownIcon
                        sx={{
                          width: 12,
                          height: 12,
                          ml: 0.2,
                          color: "inherit",
                        }}
                      />
                    </Box>
                  );
                }

                return (
                  <Typography
                    key={item.label}
                    onClick={() => navigate(item.path)}
                    sx={{
                      cursor: "pointer",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      color: isActive(item.path) ? "#f43f5e" : "#cbd5e1",
                      position: "relative",
                      py: "4px",
                      whiteSpace: "nowrap",
                      transition: "color 0.15s ease",
                      "&:hover": { color: "#f43f5e" },
                      "&::after": {
                        content: '""',
                        position: "absolute",
                        bottom: -2,
                        left: 0,
                        width: isActive(item.path) ? "100%" : "0%",
                        height: "1.5px",
                        backgroundColor: "#f43f5e",
                        transition: "width 0.15s ease",
                      },
                      "&:hover::after": { width: "100%" },
                    }}
                  >
                    {item.label}
                  </Typography>
                );
              })}
            </Box>
          </Box>

          {/* ================= RIGHT UTILS SECTION ================= */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              flexShrink: 0,
            }}
          >
            {/* Real-time Clock display wrapper */}
            <Box sx={{ display: { xs: "none", lg: "block" } }}>
              <DateTimeDisplay />
            </Box>

            <Button
              variant="outlined"
              size="small"
              startIcon={
                <SwapHorizIcon
                  sx={{ "& .MuiSvgIcon-root": { fontSize: "0.85rem" } }}
                />
              }
              onClick={() => {
                window.location.href =
                  PORTALS_URL;
              }}
              sx={{
                color: "#e5e7eb",
                borderColor: "#475569",
                textTransform: "none",
                fontSize: "0.68rem",
                fontWeight: 600,
                height: 24,
                px: 1.2,
                borderRadius: "4px",
                transition: "all 0.15s ease-in-out",
                "& .MuiButton-startIcon": { mr: 0.5, ml: -0.2 },
                "& .MuiSvgIcon-root": { fontSize: "0.95rem" },
                "&:hover": {
                  borderColor: "#b71d4c",
                  backgroundColor: "rgba(183,29,76,0.1)",
                  color: "#ffffff",
                },
              }}
            >
              Switch Portal
            </Button>

            <Divider
              orientation="vertical"
              flexItem
              sx={{ borderColor: "#334155", my: 1.2 }}
            />

            {/* Micro Version Badge */}
            <Stack
              direction="row"
              spacing={0.3}
              alignItems="center"
              onClick={() => setVersionOpen(true)}
              sx={{
                cursor: "pointer",
                px: 0.8,
                py: 0.3,
                borderRadius: "4px",
                transition: "background-color 0.15s ease",
                "&:hover": { backgroundColor: "rgba(255,255,255,0.05)" },
              }}
            >
              <Box
                component="img"
                src={logoVega}
                sx={{ height: 14, width: "auto" }}
              />
              <Typography
                sx={{ fontSize: "0.65rem", color: "#94a3b8", fontWeight: 700 }}
              >
                v2.1.2
              </Typography>
            </Stack>

            <Divider
              orientation="vertical"
              flexItem
              sx={{ borderColor: "#334155", my: 1.2 }}
            />

            {/* User Profile Action Pipeline Dropdown */}
            <UserMenu portalType="NOC" />
          </Box>
        </Toolbar>
      </AppBar>

      {/* ================= REUSABLE MENU OVERLAY DROPDOWN ================= */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleDropdownClose}
        disableScrollLock
        MenuListProps={{ onMouseLeave: handleDropdownClose }}
        sx={{
          "& .MuiPaper-root": {
            backgroundColor: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "6px",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3)",
            minWidth: 160,
            mt: 0.5,
          },
        }}
      >
        {NAV_ITEMS.filter(isGroup)
          .find((item) => item.label === activeMenuLabel)
          ?.menu.map((sub) => (
            <MenuItem
              key={sub.path}
              onClick={() => {
                navigate(sub.path);
                handleDropdownClose();
              }}
              sx={{
                fontSize: "0.7rem",
                fontWeight: 700,
                py: 0.8,
                px: 1.8,
                color: isActive(sub.path) ? "#f43f5e" : "#cbd5e1",
                "&:hover": {
                  backgroundColor: "#334155",
                  color: "#f43f5e",
                },
              }}
            >
              {sub.label}
            </MenuItem>
          ))}
      </Menu>

      {/* ================= MOBILE NAVIGATION DRAWER ================= */}
      <Drawer
        anchor="left"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{ "& .MuiPaper-root": { width: 240, background: "#0f172a", p: 2 } }}
      >
        <Stack spacing={1} sx={{ mt: 2 }}>
          {NAV_ITEMS.map((item) => (
            <Box key={item.label}>
              <Typography
                sx={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "#94a3b8",
                  px: 1,
                  py: 0.5,
                  letterSpacing: "0.05em",
                }}
              >
                {item.label}
              </Typography>

              {isGroup(item) ? (
                <Stack spacing={0.5} sx={{ pl: 2, mt: 0.5, mb: 1.5 }}>
                  {item.menu.map((sub) => (
                    <Typography
                      key={sub.path}
                      onClick={() => {
                        navigate(sub.path);
                        setMobileOpen(false);
                      }}
                      sx={{
                        py: 0.8,
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: isActive(sub.path) ? "#f43f5e" : "#cbd5e1",
                        cursor: "pointer",
                        "&:hover": { color: "#f43f5e" },
                      }}
                    >
                      • {sub.label}
                    </Typography>
                  ))}
                </Stack>
              ) : (
                <Typography
                  onClick={() => {
                    navigate(item.path);
                    setMobileOpen(false);
                  }}
                  sx={{
                    pl: 2,
                    py: 0.8,
                    mb: 1.5,
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    color: isActive(item.path) ? "#f43f5e" : "#cbd5e1",
                    cursor: "pointer",
                    "&:hover": { color: "#f43f5e" },
                  }}
                >
                  Navigate View
                </Typography>
              )}
            </Box>
          ))}
        </Stack>
      </Drawer>

      <VersionDialog open={versionOpen} onClose={() => setVersionOpen(false)} />
    </>
  );
};

export default Navbar;
