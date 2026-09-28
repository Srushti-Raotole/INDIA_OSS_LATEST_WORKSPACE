
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  MenuItem,
  Select,
  FormControl,
  Chip,
  Button,
  Stack,
  TextField,
  InputAdornment,
  IconButton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useOutletContext } from "react-router-dom";
import axiosClient from "@/api/axiosClient";
import { FEASIBILITY_NORMAL_JSON } from "@/api/apis";
import ExcelDownloadButton from "../../../components/common/ExcelDownloadButton";
import FullPageLoader from "../../../components/common/FullPageLoader";
import { logActivity } from "../../../utils/activityLogger";
import { Menu } from "lucide-react";

// ---------- Material React Table for Column Resizing ----------
import { MaterialReactTable, MRT_ColumnDef } from "material-react-table";

type OutletContextType = { 
  open: boolean;
  handleDrawerOpen: () => void;
};

const COLUMN_ORDER = [
  "opsType",
  "aEndPristate",
  "aEndSecstate",
  "aEndEquipId",
  "aEndClientPort",
  "aEndLinePort",
  "zEndLinePort",
  "zEndClientPort",
  "zEndEquipId",
  "zEndPriState",
  "zEndSecState",
  "channelName",
  "portSpeed",
] as const;
type ColKey = (typeof COLUMN_ORDER)[number];

const COLUMN_LABELS: Record<ColKey, string> = {
  opsType: "opsType",
  aEndPristate: "aEndPristate",
  aEndSecstate: "aEndSecstate",
  aEndEquipId: "aEndEquipId",
  aEndClientPort: "aEndClientPort",
  aEndLinePort: "aEndLinePort",
  zEndLinePort: "zEndLinePort",
  zEndClientPort: "zEndClientPort",
  zEndEquipId: "zEndEquipId",
  zEndPriState: "zEndPriState",
  zEndSecState: "zEndSecState",
  channelName: "channelName",
  portSpeed: "portSpeed",
};

const FILTERABLE_COLUMNS: ColKey[] = [
  "opsType",
  "aEndPristate",
  "aEndSecstate",
  "zEndPriState",
  "zEndSecState",
  "portSpeed",
];

const VALUE_COLORS: Record<string, { bg: string; fg: string }> = {
  IS: { bg: "#E6F4EA", fg: "#1B5E20" },
  "OOS-AUMA": { bg: "#FFF4E5", fg: "#E65100" },
  OOS: { bg: "#FDECEA", fg: "#B71C1C" },
  ACT: { bg: "#E3F2FD", fg: "#0D47A1" },
  IDLE: { bg: "#e0da5c", fg: "#090909" },
  UEQ: { bg: "#F3E5F5", fg: "#4A148C" },
  FLT: { bg: "#FDECEA", fg: "#B71C1C" },
  CLIENT: { bg: "#E8EAF6", fg: "#1A237E" },
  TT: { bg: "#FFF8E1", fg: "#795548" },
  "10G": { bg: "#E0F7FA", fg: "#006064" },
  "100G": { bg: "#E8F5E9", fg: "#1B5E20" },
  "400G": { bg: "#FCE4EC", fg: "#880E4F" },
};

const ValueBadge: React.FC<{ value: any }> = ({ value }) => {
  if (value === null || value === undefined || value === "") {
    return <span style={{ color: "#bdbdbd", fontFamily: "monospace", fontSize: 12 }}>—</span>;
  }
  const c = VALUE_COLORS[String(value)] ?? { bg: "#ECEFF1", fg: "#37474F" };
  return (
    <Chip
      label={String(value)}
      size="small"
      sx={{ bgcolor: c.bg, color: c.fg, fontWeight: 600, fontSize: 11, height: 22, borderRadius: 1 }}
    />
  );
};

/* ============================================================
   5. FEASIBILITY TABLE COMPONENT (Upgraded to MaterialReactTable)
   ============================================================ */
const FeasibilityTable: React.FC<{ data: any[] }> = ({ data }) => {
  const columns = useMemo<MRT_ColumnDef<any>[]>(
    () =>
      COLUMN_ORDER.map((col) => ({
        accessorKey: col,
        header: COLUMN_LABELS[col],
        size: col === "channelName" ? 220 : 140, // Give more width to longer fields
        muiTableHeadCellProps: { align: "left" },
        Cell: ({ cell }) => {
          const v = cell.getValue();
          const useBadge = FILTERABLE_COLUMNS.includes(col);
          return useBadge ? (
            <ValueBadge value={v} />
          ) : v == null || v === "" ? (
            "—"
          ) : (
            String(v)
          );
        },
      })),
    []
  );

  return (
    <Box sx={{ height: "100%", width: "100%", display: "flex", flexDirection: "column" }}>
      <MaterialReactTable
        columns={columns}
        data={data}
        
        /*  ENABLES COLUMN RESIZING  */
        enableColumnResizing
        columnResizeMode="onEnd"
        
        enableTopToolbar={false} // Hiding because you have custom search/filters above
        enableStickyHeader
        enablePagination
        enableSorting
        
        initialState={{
          pagination: { pageIndex: 0, pageSize: 25 },
          density: "compact",
        }}

        muiTablePaperProps={{
          sx: { 
            height: "100%", 
            display: "flex", 
            flexDirection: "column", 
            boxShadow: "none", 
            borderRadius: 3, 
            border: "1px solid #e2e8f0" 
          }
        }}

        muiTableContainerProps={{
          sx: {
            flex: 1,
            minHeight: 0,
            scrollbarWidth: "thin",
            "&::-webkit-scrollbar": { width: "8px", height: "8px" },
            "&::-webkit-scrollbar-thumb": { background: "#cbd5e1", borderRadius: "4px" },
          }
        }}

        muiTableHeadCellProps={{
          sx: {
            backgroundColor: "#354a6b", 
            color: "#ffffff", 
            py: 0.75, 
            px: 1.5, 
            fontSize: "0.72rem", 
            fontWeight: 600, 
            borderBottom: "none",
            "& .Mui-TableHeadCell-Content-Labels": { color: "#ffffff" },
            "& .MuiTableHeadCell-SortLabel-Icon": { color: "#ffffff !important" }
          }
        }}

        muiTableBodyCellProps={{
          sx: { 
            py: 0.6, 
            px: 1.5, 
            fontSize: "0.68rem", 
            color: "#334155", 
            borderBottom: "1px solid #e2e8f0",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }
        }}

        muiTableBodyRowProps={({ row }) => ({
          sx: { 
            backgroundColor: row.index % 2 === 0 ? "#ffffff" : "#f8fafc", 
            "&:hover": { backgroundColor: "#f1f5f9 !important" } 
          }
        })}

        muiBottomToolbarProps={{
          sx: { 
            minHeight: "40px", 
            height: "40px", 
            borderTop: "1px solid #e2e8f0",
            "& .MuiTablePagination-root": { margin: 0, padding: 0 }
          }
        }}

        muiPaginationProps={{
          variant: "text", 
          shape: "rounded", 
          size: "small", 
          rowsPerPageOptions: [10, 25, 50, 100]
        }}
      />
    </Box>
  );
};

/* ============================================================
   6. MAIN PAGE
   ============================================================ */
const FeasibilityDetailsReport: React.FC = () => {
  const { open, handleDrawerOpen } = useOutletContext<OutletContextType>();
  const [rawData, setRawData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [filters, setFilters] = useState<Record<string, string>>(
    Object.fromEntries(FILTERABLE_COLUMNS.map((c) => [c, "ALL"]))
  );

  useEffect(() => {
    logActivity({
      activity: "CIENA Feasibility Details Report page opened",
      actionName: "FEASIBILITY_DETAILS_REPORT",
      module: "INVENTORY",
    });
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await axiosClient.get(`${FEASIBILITY_NORMAL_JSON}`, {});
        let apiData: any = res.data;
        if (apiData && !Array.isArray(apiData)) {
          apiData = apiData.data || apiData.result || apiData.results || apiData.items;
        }
        setRawData(Array.isArray(apiData) ? apiData : []);
      } catch (e) {
        console.error("Error fetching feasibility details:", e);
        setRawData([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const distinctValues = useMemo(() => {
    const map: Record<string, string[]> = {};
    FILTERABLE_COLUMNS.forEach((col) => {
      const set = new Set<string>();
      rawData.forEach((row) => {
        const v = row?.[col];
        if (v !== null && v !== undefined && v !== "") set.add(String(v));
      });
      map[col] = Array.from(set).sort();
    });
    return map;
  }, [rawData]);

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rawData.filter((row) => {
      const passFilters = FILTERABLE_COLUMNS.every((col) => {
        const sel = filters[col];
        if (!sel || sel === "ALL") return true;
        return String(row?.[col] ?? "") === sel;
      });
      if (!passFilters) return false;
      if (!q) return true;
      return COLUMN_ORDER.some((c) =>
        String(row?.[c] ?? "").toLowerCase().includes(q)
      );
    });
  }, [rawData, filters, search]);

  const resetFilters = () => {
    setFilters(Object.fromEntries(FILTERABLE_COLUMNS.map((c) => [c, "ALL"])));
    setSearch("");
  };

  const activeFilterCount =
    Object.values(filters).filter((v) => v && v !== "ALL").length + (search ? 1 : 0);

  return (
    <Box sx={{ backgroundColor: "#f1f5f9", height: "100%", width: "100%", display: "flex", flexDirection: "column", overflow: "hidden", p: 1.5 }}>
      
      {/* Unified Compact Navbar Row */}
      <Box 
        sx={{ 
          display: 'flex', alignItems: 'center', flexWrap: 'nowrap', gap: 1.5, mb: 1.5, backgroundColor: '#ffffff', p: 1, borderRadius: 2, border: '1px solid #e2e8f0',
          minHeight: '48px', position: 'relative', overflow: 'hidden', flexShrink: 0
        }}
      >
        {!open && handleDrawerOpen && (
          <IconButton
            onClick={handleDrawerOpen}
            aria-label="open menu"
            sx={{
              bgcolor: "#f1f5f9", color: "#475569", width: 32, height: 32, borderRadius: 1.5, border: "1px solid #e2e8f0",
              "&:hover": { bgcolor: "#e2e8f0" }, position: "absolute", left: 8, zIndex: 2
            }}
          >
            <Menu size={18} color="#475569" strokeWidth={2.5} />
          </IconButton>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', pl: !open ? '44px' : 0, flexShrink: 0 }}>
          <ExcelDownloadButton data={filteredData} fileName="Feasibility_Details_Report" />
        </Box>

        <Typography
          title="CIENA – FEASIBILITY DETAILS REPORT"
          sx={{
            fontSize: '0.82rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em',
            position: 'absolute', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', pointerEvents: 'auto',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: open ? '35vw' : '50vw'
          }}
        >
          CIENA – FEASIBILITY DETAILS REPORT
        </Typography>
      </Box>

      {/* Filter Options Strip */}
      <Paper
        elevation={0}
        sx={{
          p: 1.5,
          mb: 1.5,
          border: "1px solid #e2e8f0",
          borderRadius: 2,
          bgcolor: "#ffffff",
          flexShrink: 0
        }}
      >
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          sx={{ flexWrap: "nowrap", overflowX: "auto", scrollbarWidth: "none" }}
        >
          <Typography sx={{ fontWeight: 700, fontSize: "0.75rem", color: "#475569", whiteSpace: "nowrap" }}>
            Filters
          </Typography>

          {FILTERABLE_COLUMNS.map((col) => (
            <FormControl key={col} size="small" sx={{ minWidth: 140, flexShrink: 0 }}>
              <Select
                displayEmpty
                value={filters[col] ?? "ALL"}
                onChange={(e) => setFilters((p) => ({ ...p, [col]: e.target.value }))}
                sx={{
                  height: 32,
                  fontSize: "0.75rem",
                  backgroundColor: "#f1f5f9",
                  "& fieldset": { border: "none" },
                  "& .MuiSelect-select": { display: "flex", alignItems: "center", py: 0 }
                }}
                renderValue={(v) => {
                  if (v === "ALL") {
                    return <span style={{ color: "#64748b", fontWeight: 600 }}>{COLUMN_LABELS[col]}</span>;
                  }
                  return <ValueBadge value={v} />;
                }}
              >
                <MenuItem value="ALL" sx={{ fontSize: "0.75rem" }}><em>All</em></MenuItem>
                {distinctValues[col]?.map((v) => (
                  <MenuItem key={v} value={v} sx={{ fontSize: "0.75rem" }}>
                    <ValueBadge value={v} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ))}

          <TextField
            size="small"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ 
              minWidth: 180, flexShrink: 0,
              "& .MuiInputBase-root": { height: 32, fontSize: "0.75rem", backgroundColor: "#f1f5f9", "& fieldset": { border: "none" } }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 16, color: "#64748b" }} />
                </InputAdornment>
              ),
            }}
          />

          <Box sx={{ flexGrow: 1 }} />

          {activeFilterCount > 0 && (
            <Chip label={`${activeFilterCount} active`} size="small" color="primary" sx={{ height: 20, fontSize: 10, fontWeight: 600 }} />
          )}
          
          <Typography variant="caption" sx={{ whiteSpace: "nowrap", color: "#64748b", fontWeight: 600, fontSize: "0.7rem" }}>
            {filteredData.length} / {rawData.length}
          </Typography>
          
          <Button
            size="small"
            variant="outlined"
            onClick={resetFilters}
            disabled={!activeFilterCount}
            sx={{ height: 32, fontSize: "0.7rem", textTransform: "none", fontWeight: 600, borderColor: '#e2e8f0', color: '#475569' }}
          >
            Reset
          </Button>
        </Stack>
      </Paper>

      {/* -------- Main Scrollable Data Presentation Area -------- */}
      <Box sx={{ flex: 1, minHeight: 0, width: "100%", overflow: "hidden", position: "relative" }}>
        {loading ? (
          <FullPageLoader message="Loading Feasibility logs..." />
        ) : (
          <FeasibilityTable data={filteredData} />
        )}
      </Box>
    </Box>
  );
};

export default FeasibilityDetailsReport;