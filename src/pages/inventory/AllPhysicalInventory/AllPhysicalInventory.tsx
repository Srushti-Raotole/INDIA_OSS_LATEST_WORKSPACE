import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Divider,
  ButtonBase,
  Typography,
  Chip,
  IconButton,
} from "@mui/material";
import { useOutletContext } from "react-router-dom";

import axiosClient from "@/api/axiosClient";
import {
  FETCH_PHYSICAL_INVENTORY_DATA,
  FETCH_PHYSICAL_INVENTORY_TLMR_DATA,
  FETCH_PHYSICAL_INVENTORY_EPNM_DATA,
  FETCH_PHYSICAL_INVENTORY_CAPTURED_TIME,
  FETCH_INVENTORY_INFR_CLIENTS,
  FETCH_PHYSICAL_INV_TREEVIEW_DOWNLOAD,
  FETCH_INVENTORY_ADVA_CLIENTS,
  FETCH_INVENTORY_CONC_CLIENTS,
} from "@/api/apis";

import TreeTable from "../AllPhysicalInventory/TreeTable";
import InvPhycialTable from "./InvCommonTable";
import ExcelDownloadButton from "../../../components/common/ExcelDownloadButton";
import ErrorState from "../../../components/common/ErrorState";
import FullPageLoader from "../../../components/common/FullPageLoader";
import { logActivity } from "../../../utils/activityLogger";
import { downloadAsCsv } from "./downloadAsCsv";

// ---------- Lucide React Custom Controls Icons ----------
import { Menu } from "lucide-react";

/* ---------------- Types ---------------- */
type OutletContextType = { 
  open: boolean;
  handleDrawerOpen: () => void; 
};

type TechOptionType = {
  key: string;
  label: string;
  apiTech: string;
  client: string | null;
};

type SelectedTech = {
  tech: string;
  client: string | null;
};

/* ---------------- Constants ---------------- */
const BASE_TECHS: TechOptionType[] = [
  { key: "TLMR", label: "TLMR", apiTech: "TLMR", client: null },
  { key: "EPNM", label: "EPNM", apiTech: "EPNM", client: null },
];

const TABLE_ID = "all-physical-inventory-table";
const REPORT_TYPE = "PHYSICAL_INVENTORY";

// ---------- Global Color Token Map For Vendor Badges ----------
const getVendorBadgeStyles = (tech: string, active: boolean) => {
  const t = tech.toUpperCase();
  let baseColor = "#607D8B"; // Default fallback Slate Grey

  if (t === "EPNM") baseColor = "#4CAF50";      // Green
  if (t === "CONC") baseColor = "#FF9800";      // Orange
  if (t === "ADVA") baseColor = "#9C27B0";      // Purple
  if (t === "IFNR") baseColor = "#3F51B5";      // Blue Indigo
  if (t === "TLMR") baseColor = "#E91E63";      // Pink
  if (t === "MCP")  baseColor = "#009688";      // Teal
  if (t === "NFMT") baseColor = "#8283eb";      // Lavender Indigo

  return {
    backgroundColor: active ? baseColor : "transparent",
    color: active ? "#ffffff" : "#475569",
    borderColor: active ? baseColor : "#e2e8f0",
    hoverBg: active ? baseColor : "#f1f5f9",
    glow: active ? `0 0 0 3px ${baseColor}25` : "none",
    marker: baseColor
  };
};

/* ---------------- Component ---------------- */
const AllPhysicalInventory: React.FC = () => {
  const { open, handleDrawerOpen } = useOutletContext<OutletContextType>();

  const [techOptions, setTechOptions] = useState<TechOptionType[]>(BASE_TECHS);
  const [selectedTech, setSelectedTech] = useState<SelectedTech>({
    tech: "TLMR",
    client: null,
  });

  const [tableData, setTableData] = useState<any[]>([]);
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [capturedTime, setCapturedTime] = useState("--:--");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleTreeViewDownload = async () => {
    try {
      const params: any = { adapter: selectedTech.tech };
      if (selectedTech.client) {
        params.client = selectedTech.client;
      }
      const resp = await axiosClient.get(FETCH_PHYSICAL_INV_TREEVIEW_DOWNLOAD, { params });
      downloadAsCsv(resp.data, "Physical_Inventory_TreeView.csv");
    } catch (e) {
      console.error("Tree view download failed", e);
    }
  };

  /* ---------------- Helpers ---------------- */
  const collectColumns = (rows: any[], set = new Set<string>()) => {
    rows.forEach((row) => {
      Object.keys(row).forEach((k) => {
        if (k !== "_children") set.add(k);
      });
      if (Array.isArray(row._children)) {
        collectColumns(row._children, set);
      }
    });
    return Array.from(set);
  };

  const normalizeRows = (rows: any[]): any[] =>
    rows.map((r) => ({
      ...r,
      _children: Array.isArray(r._children) ? normalizeRows(r._children) : r._children,
    }));

  const isTreeView = tableData.some(
    (r) => Array.isArray(r._children) && r._children.length > 0
  );

  const fetchDynamicClients = async () => {
    try {
      const [ifnrResp, advaResp, concResp] = await Promise.all([
        axiosClient.get(FETCH_INVENTORY_INFR_CLIENTS),
        axiosClient.get(FETCH_INVENTORY_ADVA_CLIENTS),
        axiosClient.get(FETCH_INVENTORY_CONC_CLIENTS),
      ]);

      const parseClients = (raw: any[], tech: string, labelPrefix: string): TechOptionType[] =>
        raw
          .map((c: any) => {
            const name = typeof c === "string" ? c : typeof c?.client === "string" ? c.client : null;
            if (!name) return null;
            return {
              key: `${tech}-${name}`,
              label: name, // Simplified to client name, technology identifier is shown via the pill marker color
              apiTech: tech,
              client: name,
            };
          })
          .filter(Boolean) as TechOptionType[];

      const ifnrClients = parseClients(Array.isArray(ifnrResp.data) ? ifnrResp.data : [], "IFNR", "IFNR");
      const advaClients = parseClients(Array.isArray(advaResp.data) ? advaResp.data : [], "ADVA", "ADVA");
      const concClients = parseClients(Array.isArray(concResp.data) ? concResp.data : [], "CONC", "CONC");

      setTechOptions([...BASE_TECHS, ...concClients, ...advaClients, ...ifnrClients]);
    } catch (e) {
      console.error("Failed to fetch dynamic clients", e);
    }
  };

  const fetchInventory = async () => {
    if (["CONC", "ADVA", "IFNR"].includes(selectedTech.tech) && !selectedTech.client) {
      return;
    }
    logActivity({
      activity: `Viewed Physical Inventory | Tech=${selectedTech.tech}`,
      actionName: "VIEW_PHYSICAL_INVENTORY",
      module: "INVENTORY",
    });

    setLoading(true);
    setErrorMsg(null);

    try {
      let resp;
      if (selectedTech.tech === "TLMR") {
        resp = await axiosClient.get(FETCH_PHYSICAL_INVENTORY_TLMR_DATA, {});
      } else if (selectedTech.tech === "EPNM") {
        resp = await axiosClient.get(FETCH_PHYSICAL_INVENTORY_EPNM_DATA, {});
      } else {
        resp = await axiosClient.get(FETCH_PHYSICAL_INVENTORY_DATA, {
          params: {
            tech: selectedTech.tech,
            report: REPORT_TYPE,
            client: selectedTech.client,
          },
        });
      }
      let data = resp?.data ?? [];
      if (data && !Array.isArray(data)) {
        data = data.data || data.result || data.items || [];
      }

      if (!Array.isArray(data) || data.length === 0) {
        setTableData([]);
        setColumnOrder([]);
        return;
      }

      const normalized = normalizeRows(data);
      setTableData(normalized);
      setColumnOrder(collectColumns(normalized));
    } catch (e) {
      console.error(e);
      setErrorMsg("Unable to fetch inventory data");
      setTableData([]);
      setColumnOrder([]);
    } military: {
      setLoading(false);
    }
  };

  const fetchCapturedTime = async () => {
    try {
      const resp = await axiosClient.get(FETCH_PHYSICAL_INVENTORY_CAPTURED_TIME, {
        params: { tech: selectedTech.tech, client: selectedTech.client },
      });
      setCapturedTime(String(resp.data).trim());
    } catch {
      setCapturedTime("--:--");
    }
  };

  useEffect(() => {
    fetchDynamicClients();
  }, []);

  useEffect(() => {
    fetchInventory();
    fetchCapturedTime();
  }, [selectedTech]);

  /* ---------------- Modern Badge Selection Button Component ---------------- */
  const TechButton = ({ opt }: { opt: TechOptionType }) => {
    const active = selectedTech.tech === opt.apiTech && selectedTech.client === opt.client;
    const styles = getVendorBadgeStyles(opt.apiTech, active);

    return (
      <ButtonBase
        onClick={() => setSelectedTech({ tech: opt.apiTech, client: opt.client })}
        sx={{
          px: 1.8,
          py: 0.5,
          borderRadius: "12px",
          fontSize: "0.68rem",
          fontWeight: 700,
          backgroundColor: styles.backgroundColor,
          color: styles.color,
          border: `1px solid ${styles.borderColor}`,
          boxShadow: styles.glow,
          display: "inline-flex",
          alignItems: "center",
          gap: 1,
          transition: "all 0.15s ease-in-out",
          textTransform: "uppercase",
          letterSpacing: "0.02em",
          "&:hover": {
            backgroundColor: styles.hoverBg,
          },
        }}
      >
        {/* Decorative inner circular technology indicator dots shown when badge goes unselected */}
        {!active && (
          <Box sx={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: styles.marker }} />
        )}
        {opt.client ? `${opt.apiTech} · ${opt.label}` : opt.label}
      </ButtonBase>
    );
  };

  const adapterName = selectedTech.tech === "IFNR" && selectedTech.client ? `IFNR - ${selectedTech.client}` : selectedTech.tech;

  return (
    <Box sx={{ background: "#fff", height: "auto", width: "100%", display: "flex", flexDirection: "column" }}>
      {loading && <FullPageLoader message="Loading Physical Inventory data..." />}

      {/* -------- Header Toolbar Configuration -------- */}
      <Box 
        sx={{ 
          display: 'flex', alignItems: 'center', flexWrap: 'nowrap', gap: 1.5, mb: 1, backgroundColor: '#f8fafc', p: 1, borderRadius: 2, border: '1px solid #f1f5f9',
          minHeight: '48px', position: 'relative'
        }}
      >
        {!open && handleDrawerOpen && (
          <IconButton
            onClick={handleDrawerOpen}
            aria-label="open menu"
            sx={{
              bgcolor: "#ffffff", color: "#475569", width: 32, height: 32, borderRadius: 1.5, border: "1px solid #e2e8f0",
              "&:hover": { bgcolor: "#f1f5f9" }, position: "absolute", left: 8, zIndex: 2
            }}
          >
            <Menu size={18} color="#475569" strokeWidth={2.5} />
          </IconButton>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', pl: !open ? '44px' : 0 }}>
          <ExcelDownloadButton
            {...(isTreeView
              ? {
                fetchUrl: FETCH_PHYSICAL_INV_TREEVIEW_DOWNLOAD,
                fetchParams: { adapter: selectedTech.tech, ...(selectedTech.client ? { client: selectedTech.client } : {}) },
                fileName: `Physical_Inventory_${adapterName}`,
              }
              : {
                data: tableData,
                columnOrder,
                tableId: TABLE_ID,
                fileName: `Physical_Inventory_${adapterName}`,
              })}
            disabled={loading}
          />
        </Box>

        {/*  CENTER ALIGNED TITLE HEADER LAYOUT */}
        <Typography 
          sx={{ 
            fontSize: '0.85rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em',
            position: 'absolute', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', pointerEvents: 'none'
          }}
        >
          ALL PHYSICAL INVENTORY
        </Typography>

        <Box sx={{ ml: "auto" }}>
          <Chip
            label={`Captured at: ${capturedTime}`}
            sx={{ fontWeight: 600, background: "#e8f5e9", color: "#2e7d32", border: "1px solid #c8e6c9", height: 28, fontSize: '0.7rem' }}
          />
        </Box>
      </Box>

      {/* -------- Modern Badge Filter Dashboard Strip -------- */}
      <Box 
        display="flex" 
        flexWrap="wrap" 
        gap={1} 
        mb={1.5} 
        px={1.5} 
        py={1} 
        sx={{ 
          borderRadius: 2, background: "#f8fafc", border: "1px solid #f1f5f9",
          maxHeight: "115px", overflowY: "auto", scrollbarWidth: "thin"
        }}
      >
        {techOptions.map((opt) => (
          <TechButton key={opt.key} opt={opt} />
        ))}
      </Box>

      <Divider sx={{ mb: 1.5, borderColor: '#e2e8f0' }} />

      {/* -------- Spreadsheet Viewport Section -------- */}
      <Box sx={{ width: "100%", height: "calc(100vh - 195px)", overflow: "hidden", position: "relative" }}>
        {errorMsg ? (
          <ErrorState title="Error" message={errorMsg} severity="error" />
        ) : tableData.length === 0 && !loading ? (
          <ErrorState title="No Data" message="No data available" severity="info" />
        ) : isTreeView ? (
          <TreeTable dataObjects={tableData} columnOrder={columnOrder} tableId={TABLE_ID} />
        ) : (
          <InvPhycialTable dataObjects={tableData} tableId={TABLE_ID} />
        )}
      </Box>
    </Box>
  );
};

export default AllPhysicalInventory;