import React, { useRef, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Tabs,
  Tab,
  Typography,
  Divider,
  IconButton,
  CircularProgress,
  Box,
  Tooltip,
} from "@mui/material";
import html2canvas from "html2canvas";
import { Download, Maximize2, Minimize2, X, FileSpreadsheet } from "lucide-react";
import * as XLSX from "xlsx";

import CommonLineChart, { LineSeriesConfig } from "./CommonLineChart";
import CommonDataTable from "./CommonDataTable";

/* ================= PROPS ================= */
type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  loading?: boolean;
  data: any[];
  xKey: string;
  series: LineSeriesConfig[];
  tableColumns: { key: string; label: string }[];
  xAxisLabel?: string;
  yAxisLabel?: string;
};

/* ================= COMPONENT ================= */
const CommonChartModal: React.FC<Props> = ({
  open,
  onClose,
  title,
  loading = false,
  data,
  xKey,
  series,
  tableColumns,
  xAxisLabel,
  yAxisLabel,
}) => {
  const [tab, setTab] = useState<0 | 1>(1); // 0 = Data, 1 = Graph
  const [fullScreen, setFullScreen] = useState(false);

  const graphExportRef = useRef<HTMLDivElement>(null);

  /* ================= EXPORT GRAPH ================= */
  const exportGraph = async () => {
    if (tab !== 1 || !graphExportRef.current) return;

    const canvas = await html2canvas(graphExportRef.current, {
      backgroundColor: "#fff",
      scale: window.devicePixelRatio || 2,
    });

    const link = document.createElement("a");
    link.download = `${title}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  /* ================= EXPORT DATA (EXCEL) ================= */
  const exportExcel = () => {
    if (tab !== 0 || !data?.length) return;

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
    XLSX.writeFile(workbook, `${title}.xlsx`);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      //  OPTIMIZED DIALOG CONSTRAINTS (Shrunk width scaling footprint safely)
      maxWidth={fullScreen ? false : "md"}
      PaperProps={{
        sx: fullScreen
          ? { width: "100vw", height: "100vh", maxWidth: "100%", borderRadius: 0 }
          : { borderRadius: "10px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" },
      }}
    >
      {/* ================= HEADER CONTROLS SLAT ================= */}
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          px: 2,
          py: 1, // High density condensed row height
          backgroundColor: "#f8fafc",
          borderBottom: "1px solid #e2e8f0"
        }}
      >
        <Typography sx={{ fontWeight: 800, fontSize: "0.85rem", color: "#1e293b", textTransform: "uppercase", letterSpacing: "0.04em", flexGrow: 1 }} noWrap>
          {title}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          {tab === 1 && (
            <Tooltip title="Download graph">
              <IconButton onClick={exportGraph} size="small" sx={{ color: "#64748b", p: "4px" }}>
                <Download size={16} />
              </IconButton>
            </Tooltip>
          )}

          {tab === 0 && (
            <Tooltip title="Download data (Excel)">
              <IconButton onClick={exportExcel} size="small" sx={{ color: "#64748b", p: "4px" }}>
                <FileSpreadsheet size={16} />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title={fullScreen ? "Exit fullscreen" : "Fullscreen"}>
            <IconButton onClick={() => setFullScreen((p) => !p)} size="small" sx={{ color: "#64748b", p: "4px" }}>
              {fullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Close">
            <IconButton onClick={onClose} size="small" sx={{ color: "#64748b", p: "4px", "&:hover": { bgcolor: "#f1f5f9", color: "#1e293b" } }}>
              <X size={16} />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>

      {/* ================= DATA TABS REGISTRY ================= */}
      <Tabs 
        value={tab} 
        onChange={(_, v) => setTab(v)} 
        sx={{ 
          px: 2, 
          minHeight: "36px !important", 
          height: "36px",
          borderBottom: "1px solid #e2e8f0",
          "& .MuiTab-root": {
            minHeight: "36px !important",
            height: "36px",
            fontSize: "0.72rem",
            fontWeight: 700,
            textTransform: "none",
            color: "#64748b",
            "&.Mui-selected": { color: "#354a6b" }
          },
          "& .MuiTabs-indicator": { backgroundColor: "#354a6b" }
        }}
      >
        <Tab label="Data View" />
        <Tab label="Graph View" />
      </Tabs>

      {/* ================= INTERACTIVE VIEWPORT Frame ================= */}
      <DialogContent sx={{ p: tab === 1 ? 1.5 : 2, backgroundColor: "#ffffff" }}>
        {loading ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 6, gap: 1.5 }}>
            <CircularProgress size={24} sx={{ color: "#354a6b" }} />
            <Typography sx={{ fontSize: "0.7rem", fontWeight: 600, color: "#64748b" }}>Generating analytics stream...</Typography>
          </Box>
        ) : tab === 1 ? (
          /* ===== GRAPH PANEL RENDERING OVERLAYS ===== */
          <Box ref={graphExportRef} sx={{ position: "relative", p: 0.5 }}>
            {/* 🔒 HIDDEN TITLE — GRAPH CANVAS BACKDROP LAYER */}
            <Typography sx={{
              position: "absolute",
              top: 0,
              left: 0,
              opacity: 0,
              pointerEvents: "none",
              fontWeight: 800,
              fontSize: "0.85rem",
              color: "#1e293b",
              textTransform: "uppercase"
            }}>
              {title}
            </Typography>

            <CommonLineChart
              data={data}
              xKey={xKey}
              series={series}
              xAxisLabel={xAxisLabel}
              yAxisLabel={yAxisLabel}
              yTickCount={5}
              height={fullScreen ? "75vh" : 320} //  Height compacted cleanly to maintain tight screen composition
            />
          </Box>
        ) : (
          /* ===== PROGRAMMATIC INLINE GRID DATATABLES ===== */
          <Box sx={{ width: "100%", maxHeight: fullScreen ? "75vh" : "400px", overflow: "auto" }}>
            <CommonDataTable
              data={data}
              columns={tableColumns.map((c) => c.key)}
              tableId="chart-modal-table"
              pageSize={10}
            />
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CommonChartModal;