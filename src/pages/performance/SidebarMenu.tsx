import React, { useEffect, useState } from "react";
import {
  Box,
  List,
  ListItemButton,
  ListItemText,
  Collapse,
  IconButton,
  Divider,
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
import { FETCH_PERFORMANCE_INFR_CLIENTS, FETCH_PM_ADVA_CLIENTS, FETCH_PM_CONC_CLIENTS } from "@/api/apis";
import axiosClient from "@/api/axiosClient";

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

const PERFORMANCE_BASE = "/performance-report";
const toPerformance = (p?: string) =>
  p ? `${PERFORMANCE_BASE}/${p.replace(/^\/+/, "")}` : PERFORMANCE_BASE;

/* ================= STATIC MENU ================= */
const menuItems: MenuItem[] = [
  {
    title: "TLMR",
    children: [
      { title: "Ethernet Report", path: "tlmr/ethernet-report" },
      { title: "Temperature Report", path: "tlmr/temperature-report" },
      { title: "CPU Utilization Report", path: "tlmr/cpu-utilization-report" },
      { title: "Memory Utilization Report", path: "tlmr/memory-utilization-report" },
      { title: "OTN Report", path: "tlmr/otn-report" },
      { title: "Spanloss Report", path: "tlmr/spanloss-report" },
    ],
  },
  {
    title: "MCP",
    children: [
      { title: "Spanloss Report", path: "mcp/spanloss-report" },
      { title: "Adjacency Metrics Report", path: "mcp/oss-report" },
      { title: "ETTP Metrics Report", path: "mcp/oss-report/ettp" },
      { title: "PTP Metrics Report", path: "mcp/oss-report/ptp" },

    ],
  },
    {
    title: "NFMT",
    children: [
      { title: "Spanloss Report", path: "nfmt/spanloss-report" },
    ],
  },
  {
    title: "EPNM",
    children: [
      { title: "Ethernet Report", path: "epnm/ethernet-report" },
      { title: "Spanloss Report", path: "epnm/spanloss-report" },
      { title: "Temperature Report", path: "epnm/temperature-report" },
      { title: "CPU Utilization Report", path: "epnm/cpu-utilization-report" },
      { title: "Lambda Utilization Report", path: "epnm/lambda-utilization-report" },
      { title: "OTN Report", path: "epnm/otn-report" },
      { title: "List of Affected Services", path: "epnm/affected-services-report" },
      { title: "Ticketing Trend", path: "epnm/ticketing-report" },
    ],
  },
];

/* ================= REPORT TEMPLATES ================= */
const IFNR_REPORTS: SubMenuItem[] = [
  { title: "CPU Utilization Report", path: "cpu-utilization-report" },
  { title: "Memory Utilization Report", path: "memory-utilization-report" },
  { title: "Spanloss Report", path: "spanloss-report" },
  { title: "Ethernet Report", path: "ethernet-report" },
  { title: "OTN Report", path: "otn-report" },
];
const CONC_REPORTS: SubMenuItem[] = [
  { title: "Ethernet Report", path: "ethernet-report" },
  { title: "OTN Report", path: "otn-report" },
];
const ADVA_REPORTS: SubMenuItem[] = [
  { title: "Temperature Report", path: "temperature-report" },
  { title: "Spanloss Report", path: "spanloss-report" },
];

export default function SidebarMenu({ open, onClose }: SidebarMenuProps) {
  const { goTo } = useRouteNavigator();
  const location = useLocation();

  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [dynamicMenuItems, setDynamicMenuItems] = useState<MenuItem[]>(menuItems);

  const isActivePath = (rel?: string) =>
    rel ? location.pathname === toPerformance(rel) : false;

  const handleToggle = (menu: string) =>
    setOpenMenu((p) => (p === menu ? null : menu));

  useEffect(() => {
    Promise.all([
      axiosClient.get(FETCH_PM_CONC_CLIENTS),
      axiosClient.get(FETCH_PERFORMANCE_INFR_CLIENTS),
      axiosClient.get(FETCH_PM_ADVA_CLIENTS),
    ])
      .then(([concRes, ifnrRes, advaRes]) => {
        const concClients: string[] = (concRes.data || []).map((c: any) => c.client || c.name || c);
        const concMenus: MenuItem[] = concClients.map((client) => ({
          title: `CONC - ${client}`,
          children: CONC_REPORTS.map((r) => ({
            title: r.title,
            path: `conc/${encodeURIComponent(client)}/${r.path}`,
          })),
        }));

        const ifnrClients: string[] = (ifnrRes.data || []).map((c: any) => c.client || c.name);
        const ifnrMenus: MenuItem[] = ifnrClients.map((client) => ({
          title: `IFNR - ${client}`,
          children: IFNR_REPORTS.map((r) => ({
            title: r.title,
            path: `ifnr/${encodeURIComponent(client)}/${r.path}`,
          })),
        }));

        const advaClients: string[] = (advaRes.data || []).map((c: any) => c.client || c.name || c);
        const advaMenus: MenuItem[] = advaClients.map((client) => ({
          title: `ADVA - ${client}`,
          children: ADVA_REPORTS.map((r) => ({
            title: r.title,
            path: `adva/${encodeURIComponent(client)}/${r.path}`,
          })),
        }));

        const filtered = menuItems.filter(
          (m) => !m.title.startsWith("IFNR -") && !m.title.startsWith("CONC -") && !m.title.startsWith("ADVA -")
        );

        const insertIndex = filtered.findIndex((m) => m.title === "ADVA") + 1;

        const finalMenu = [
          ...filtered.slice(0, insertIndex),
          ...advaMenus,
          ...concMenus,
          ...ifnrMenus,
          ...filtered.slice(insertIndex),
        ];

        setDynamicMenuItems(finalMenu);
      })
      .catch((err) => {
        console.error("Dynamic PM menu load failed:", err);
        setDynamicMenuItems(menuItems);
      });
  }, []);

  return (
    <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", bgcolor: "#f8fafc" }}>
      {/* ================= SIDEBAR HEADER ================= */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1.5, flexShrink: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Box sx={{ width: 3.5, height: 16, borderRadius: "2px", bgcolor: "#f43f5e" }} />
          <Box>
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 800, color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.04em", lineHeight: 1.1 }}>
              Performance
            </Typography>
            <Typography sx={{ fontSize: "0.62rem", color: "#64748b", fontWeight: 600, mt: 0.2 }}>
              Monitoring & Analytics
            </Typography>
          </Box>
        </Box>

        <IconButton onClick={onClose} size="small" sx={{ color: "#64748b", p: "4px", "&:hover": { color: "#1e293b", bgcolor: "#e2e8f0" } }}>
          <MuiChevronLeft sx={{ width: 16, height: 16 }} />
        </IconButton>
      </Box>

      <Divider sx={{ borderColor: "#e2e8f0" }} />

      {/* ================= SCROLLABLE LINK LAYER ================= */}
      <List disablePadding sx={{ flex: 1, overflowY: "auto", px: 1, py: 1, gap: 0.5, display: "flex", flexDirection: "column", scrollbarWidth: "thin" }}>
        {dynamicMenuItems.map((item, idx) => {
          const isOpen = openMenu === item.title;
          const itemActive = isActivePath(item.path);

          return (
            <Box key={`${item.title}-${idx}`}>
              <ListItemButton
                onClick={() => {
                  if (item.children) handleToggle(item.title);
                  else if (item.path) goTo(toPerformance(item.path));
                }}
                sx={{
                  position: "relative",
                  borderRadius: "6px",
                  mb: "2px",
                  py: "6px",
                  px: 1.5,
                  background: itemActive ? "rgba(244, 63, 94, 0.08)" : "transparent",
                  color: itemActive ? "#f43f5e" : "#334155",
                  "&::before": itemActive ? {
                    content: '""',
                    position: "absolute",
                    left: 0,
                    top: "20%",
                    height: "60%",
                    width: "3px",
                    borderRadius: "2px",
                    backgroundColor: "#f43f5e",
                  } : {},
                  "&:hover": { background: "rgba(244, 63, 94, 0.05)", color: "#f43f5e" },
                  transition: "all 0.15s ease",
                }}
              >
                <ListItemText
                  primary={item.title}
                  primaryTypographyProps={{ sx: { fontWeight: 700, fontSize: "0.75rem", letterSpacing: "0.01em", color: "inherit" } }}
                />

                {item.children && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "#64748b" }}>
                    <Badge
                      badgeContent={item.children.length}
                      sx={{
                        "& .MuiBadge-badge": {
                          bgcolor: "#e2e8f0",
                          color: "#334155",
                          fontWeight: 700,
                          fontSize: "0.6rem",
                          height: 16,
                          minWidth: 16
                        },
                      }}
                    />
                    {isOpen ? <ExpandLess sx={{ width: 16, height: 16 }} /> : <ExpandMore sx={{ width: 16, height: 16 }} />}
                  </Box>
                )}
              </ListItemButton>

              {item.children && (
                <Collapse in={isOpen} timeout={150} unmountOnExit>
                  <List disablePadding sx={{ pl: 1.5, mt: "2px", mb: "4px", display: "flex", flexDirection: "column", gap: "2px" }}>
                    {item.children.map((child, cIdx) => {
                      const active = isActivePath(child.path);
                      return (
                        <ListItemButton
                          key={`${child.title}-${cIdx}`}
                          onClick={() => child.path && goTo(toPerformance(child.path))}
                          sx={{
                            py: "5px",
                            px: 1.5,
                            borderRadius: "4px",
                            background: active ? "rgba(244, 63, 94, 0.04)" : "transparent",
                            color: active ? "#f43f5e" : "#475569",
                            "&:hover": { backgroundColor: "#f1f5f9", color: "#f43f5e" },
                            transition: "all 0.1s ease",
                          }}
                        >
                          <ListItemText
                            primary={child.title}
                            primaryTypographyProps={{ sx: { fontSize: "0.72rem", fontWeight: active ? 700 : 500, color: "inherit" } }}
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