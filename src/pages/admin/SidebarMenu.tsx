
import React, { useState } from "react";
import { Drawer, List, ListItemButton, ListItemText, Collapse, Box, IconButton, Divider, Badge, Typography } from "@mui/material";
import { ExpandLess, ExpandMore, ChevronLeft as MuiChevronLeft } from "@mui/icons-material";
import { useLocation } from "react-router-dom";
import useRouteNavigator from "../../utils/customNevigator/useRouterNevigator";

type SubMenuItem = { title: string; path: string; newTab?: boolean };
type ChildMenuItem = {
  title: string;
  path?: string;
  newTab?: boolean;
  children?: SubMenuItem[];
};
type MenuItem = {
  title: string;
  icon?: React.ReactNode;
  path?: string;
  children?: ChildMenuItem[];
};

type SidebarMenuProps = {
  open: boolean;
  onClose: () => void;
};

const ADMIN_BASE = "/admin";
const toInventory = (p?: string) =>
  p ? `${ADMIN_BASE}/${p.replace(/^\/+/, "")}` : ADMIN_BASE;

const menuItems: MenuItem[] = [
  { title: "Activity Logs", path: "users/admin-activity-logs" },
  { title: "Notification Setting", path: "users/notification-setting" },
];

export default function SidebarMenu({ open, onClose }: SidebarMenuProps) {
  const { goTo } = useRouteNavigator();
  const location = useLocation();
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const isActivePath = (rel?: string) =>
    rel ? location.pathname === toInventory(rel) : false;

  const handleToggle = (menu: string) =>
    setOpenMenu((p) => (p === menu ? null : menu));

  return (
    <Box sx={{ height: "100%", width: "100%", display: "flex", flexDirection: "column", backgroundColor: "#f8fafc" }}>
      {/* ---------- HEADER PARTITION PANEL ---------- */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box sx={{ width: 4, height: 24, borderRadius: "2px", bgcolor: "#354a6b" }} />
          <Box>
            <Typography sx={{ fontSize: "0.72rem", fontWeight: 700, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.03em", lineHeight: 1.2 }}>
              User Management
            </Typography>
          </Box>
        </Box>

        <IconButton onClick={onClose} size="small" sx={{ color: "#475569", p: "4px", "&:hover": { backgroundColor: "#cbd5e1" } }}>
          <MuiChevronLeft sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      <Divider sx={{ borderColor: "#e2e8f0" }} />

      {/* ---------- INTERACTIVE LINKS NAV TREE ---------- */}
      <List disablePadding sx={{ p: 1 }}>
        {menuItems.map((item, idx) => {
          const isOpen = openMenu === item.title;
          const itemActive = isActivePath(item.path);

          return (
            <Box key={`${item.title}-${idx}`} sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => {
                  if (item.children) handleToggle(item.title);
                  else if (item.path) goTo(toInventory(item.path));
                }}
                sx={{
                  position: "relative",
                  borderRadius: "6px",
                  height: 32,
                  px: 1.5,
                  backgroundColor: itemActive ? "rgba(53, 74, 107, 0.08)" : "transparent",
                  "&::before": itemActive ? {
                    content: '""',
                    position: "absolute",
                    left: 0,
                    top: "20%",
                    height: "60%",
                    width: "3px",
                    borderRadius: "2px",
                    backgroundColor: "#354a6b",
                  } : {},
                  "&:hover": { backgroundColor: "rgba(53, 74, 107, 0.04)" },
                  transition: "all 0.15s ease",
                }}
              >
                <ListItemText
                  primary={item.title}
                  primaryTypographyProps={{
                    sx: { fontWeight: itemActive ? 700 : 600, fontSize: "0.72rem", color: itemActive ? "#354a6b" : "#475569" },
                  }}
                />

                {item.children && (
                  <>
                    <Badge
                      badgeContent={item.children.length}
                      sx={{ "& .MuiBadge-badge": { bgcolor: "#e2e8f0", color: "#475569", fontWeight: 700, fontSize: "0.6rem" } }}
                    />
                    {isOpen ? <ExpandLess sx={{ fontSize: 16 }} /> : <ExpandMore sx={{ fontSize: 16 }} />}
                  </>
                )}
              </ListItemButton>

              {item.children && (
                <Collapse in={isOpen} timeout={150} unmountOnExit>
                  <List disablePadding sx={{ pl: 1.5, mt: 0.5 }}>
                    {item.children.map((child, cIdx) => (
                      <ListItemButton
                        key={`${child.title}-${cIdx}`}
                        sx={{ height: 28, borderRadius: "4px", "&:hover": { backgroundColor: "#f1f5f9" } }}
                        onClick={() => child.path && goTo(toInventory(child.path))}
                      >
                        <ListItemText
                          primary={child.title}
                          primaryTypographyProps={{
                            sx: { fontSize: "0.68rem", fontWeight: 700, color: "#64748b" },
                          }}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              )}
            </Box>
          );
        })}
      </List>
    </Box>
  );
}