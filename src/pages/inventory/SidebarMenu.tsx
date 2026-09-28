
import React, { useEffect, useState } from "react";
import {
  List,
  ListItemButton,
  ListItemText,
  Collapse,
  Box,
  IconButton,
  Badge,
  Typography,
} from "@mui/material";
import {
  ExpandLess,
  ExpandMore,
  ChevronLeft as MuiChevronLeft,
} from "@mui/icons-material";
import { useLocation } from "react-router-dom";
import useRouteNavigator from "../../utils/customNevigator/useRouterNevigator";
import axiosClient from "@/api/axiosClient";
import { FETCH_INVENTORY_CONC_CLIENTS, FETCH_PERFORMANCE_INFR_CLIENTS } from "@/api/apis";

type SubMenuItem = { title: string; path: string };
type MenuItem = {
  title: string;
  path?: string;
  children?: SubMenuItem[];
};

type SidebarMenuProps = {
  open: boolean;
  onClose: () => void;
};

const INVENTORY_BASE = "/inventory";
const toInventory = (p?: string) => p ? `${INVENTORY_BASE}/${p.replace(/^\/+/, "")}` : INVENTORY_BASE;

const BASE_MENU_ITEMS: MenuItem[] = [
  { title: "All Physical Inventory", path: "all-physical-inventory" },
  { title: "CONC", children: [] },
  { title: "IFNR", children: [] },
    {
    title: "ADVA",
    children: [
      { title: "NE List Report (Microsoft)", path: "microsoft/adva/ne-list-report" },
    ],
  },
  {
    title: "TLMR",
    children: [
      { title: "NE List Report", path: "google/tlmr/ne-list-report" },
      { title: "Circuit Inventory Report", path: "google/tlmr/circuit-inventory-report" },
    ],
  },
  {
    title: "EPNM",
    children: [
      { title: "NE List Report", path: "google/epnm/ne-list-report" },
      { title: "Passive Inventory Report", path: "google/epnm/passive-inventory-report" },
      { title: "Service Inventory Report", path: "google/epnm/service-inventory-report" },
      { title: "Discovery Report", path: "google/epnm/discovery-report" },
      { title: "Inventory Dashboard", path: "google/epnm/inventory-dashboard" },
    ],
  },
  {
    title: "MCP",
    children: [
      { title: "NE List Report", path: "ciena/ne-list-report" },
      { title: "Equipment Details Report", path: "ciena/equipment-details-report" },
      { title: "Channel Details Report", path: "ciena/channel-details-report" },
      { title: "OTS Details Report", path: "ciena/ots-details-report" },
      { title: "Feasibility Report", path: "ciena/feasibility-ui" },
    ],
  },
  {
    title: "NFMT",
    children: [
      { title: "Device Details Report", path: "nfmt/device-details-report" },
      { title: "Equipment Details Report", path: "nfmt/equipment-details-report" },
    ],
  },
];

export default function SidebarMenu({ open, onClose }: SidebarMenuProps) {
  const { goTo } = useRouteNavigator();
  const location = useLocation();

  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(BASE_MENU_ITEMS);

  const isActivePath = (rel?: string) => rel ? location.pathname === toInventory(rel) : false;
  const handleToggle = (menu: string) => setOpenMenu((p) => (p === menu ? null : menu));

  useEffect(() => {
    let updatedMenu = [...BASE_MENU_ITEMS];

    axiosClient.get(FETCH_PERFORMANCE_INFR_CLIENTS).then((res) => {
      const clients: string[] = (res.data || []).map((c: any) => c.client || c.name);
      const ifnrChildren: SubMenuItem[] = clients.map((client) => ({
        title: `Circuit Inventory (${client})`,
        path: `ifnr/${encodeURIComponent(client)}/circuit-inventory-report`,
      }));
      updatedMenu = updatedMenu.map((item) =>
        item.title === "IFNR" ? { ...item, children: ifnrChildren } : item
      );
      setMenuItems([...updatedMenu]);
    }).catch((err) => console.error("IFNR load failed:", err));

    // -------- CONC Dynamic Loading --------
    axiosClient.get(FETCH_INVENTORY_CONC_CLIENTS).then((res) => {
      let raw: any[] = [];
      if (Array.isArray(res.data)) raw = res.data;
      else if (Array.isArray(res.data?.data)) raw = res.data.data;
      else if (Array.isArray(res.data?.clients)) raw = res.data.clients;
      else if (Array.isArray(res.data?.data?.clients)) raw = res.data.data.clients;

      const clients: string[] = raw.map((c: any) => typeof c === "string" ? c : c.client || c.name);
      const concChildren: SubMenuItem[] = clients.flatMap((client) => [
        { title: `NE List (${client})`, path: `microsoft/conc/${encodeURIComponent(client)}/ne-list-report` },
        { title: `Circuit Inventory (${client})`, path: `microsoft/conc/${encodeURIComponent(client)}/circuit-inventory-report` },
      ]);

      updatedMenu = updatedMenu.map((item) =>
        item.title === "CONC" ? { ...item, children: concChildren } : item
      );
      setMenuItems([...updatedMenu]);
    }).catch((err) => console.error("CONC load failed:", err));
  }, []);

  return (
    <Box
      sx={{
        width: open ? { xs: '250px', lg: '280px' } : 0,
        minWidth: open ? { xs: '250px', lg: '280px' } : 0,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflowY: 'auto',
        overflowX: 'hidden',
        borderRight: open ? '1px solid #e2e8f0' : 'none',
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1.5, borderBottom: '1px solid #e2e8f0' }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box sx={{ width: "4px", height: "24px", borderRadius: "2px", backgroundColor: "primary.main" }} />
          <Box>
            <Typography sx={{ fontSize: "0.85rem", fontWeight: 700, color: "#1e293b", lineHeight: 1.2, whiteSpace: "nowrap" }}>
              Inventory
            </Typography>
            <Typography sx={{ fontSize: "0.68rem", color: "#64748b", fontWeight: 500, whiteSpace: "nowrap" }}>
              Reports & Discovery
            </Typography>
          </Box>
        </Box>

        <IconButton 
          onClick={onClose} 
          size="small" 
          sx={{ bgcolor: "#f1f5f9", color: "#475569", width: 28, height: 28, borderRadius: 1.5, border: "1px solid #e2e8f0", "&:hover": { bgcolor: "#e2e8f0" } }}
        >
          <MuiChevronLeft sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      <List disablePadding sx={{ px: 1, py: 1, flex: 1, overflowY: "auto" }}>
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
                  position: "relative", borderRadius: "6px", py: "6px", px: "12px",
                  background: itemActive ? "rgba(25,118,210,0.08)" : "transparent",
                  "&::before": itemActive ? {
                    content: '""', position: "absolute", left: 0, top: "20%", height: "60%", width: "3px", borderRadius: "2px", backgroundColor: "primary.main"
                  } : {},
                  "&:hover": { backgroundColor: "rgba(25,118,210,0.04)" },
                }}
              >
                <ListItemText
                  primary={item.title}
                  primaryTypographyProps={{ sx: { fontWeight: 600, fontSize: "0.82rem", color: itemActive ? "primary.main" : "#334155" } }}
                />

                {item.children && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Badge
                      badgeContent={item.children.length}
                      sx={{ "& .MuiBadge-badge": { bgcolor: "#e2e8f0", color: "#475569", fontWeight: 700, fontSize: "0.65rem", height: 16, minWidth: 16 } }}
                    />
                    {isOpen ? <ExpandLess sx={{ fontSize: '1.2rem', color: '#64748b' }} /> : <ExpandMore sx={{ fontSize: '1.2rem', color: '#64748b' }} />}
                  </Box>
                )}
              </ListItemButton>

              {item.children && (
                <Collapse in={isOpen} timeout={180} unmountOnExit>
                  <List disablePadding sx={{ pl: 1.5, mt: 0.5 }}>
                    {item.children.map((child, cIdx) => {
                      const active = isActivePath(child.path);
                      return (
                        <ListItemButton
                          key={`${child.title}-${cIdx}`}
                          sx={{
                            py: "5px", pl: "16px", borderRadius: "4px", mb: 0.2,
                            background: active ? "rgba(25,118,210,0.04)" : "transparent",
                            "&:hover": { backgroundColor: "#f1f5f9" },
                          }}
                          onClick={() => child.path && goTo(toInventory(child.path))}
                        >
                          <ListItemText
                            primary={child.title}
                            primaryTypographyProps={{ sx: { fontSize: "0.76rem", fontWeight: active ? 700 : 500, color: active ? "primary.main" : "#475569" } }}
                          />
                        </ListItemButton>
                      );
                    })}
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