import React, { useMemo, useState, useEffect } from "react";
import { Box, Chip } from "@mui/material";
import { MaterialReactTable, MRT_ColumnDef } from "material-react-table";

/* ================= TYPES ================= */
export interface ActivityLogRow {
  username: string;
  role: string;
  activity: string;
  action_name: string;
  module: string;
  created_at: string;
}

interface Props {
  dataObjects: ActivityLogRow[];
  pageSize?: number;
  tableId: string;
}

const LOCALSTORAGE_PREFIX = "visible_columns_map_";

const ROLE_STYLE: Record<string, { bg: string; color: string }> = {
  ADMIN: { bg: "#e0f2fe", color: "#0369a1" },
  USER: { bg: "#ede9fe", color: "#5b21b6" },
  VIDEO: { bg: "#fef3c7", color: "#d97706" },
};

const ACTIVITY_LOG_COLUMNS = [
  { key: "username", label: "Username", align: "left", size: 160 },
  { key: "role", label: "Role", align: "center", size: 100 },
  { key: "activity", label: "Activity", align: "left", size: 300 },
  { key: "action_name", label: "Action", align: "left", size: 180 },
  { key: "module", label: "Module", align: "center", size: 140 },
  { key: "created_at", label: "Timestamp", align: "left", size: 180 },
] as const;

/* ================= COMPONENT ================= */
const ActivityLogsTable: React.FC<Props> = ({
  dataObjects,
  pageSize = 25,
  tableId,
}) => {
  const [globalFilter, setGlobalFilter] = useState("");

  /* ================= COLUMNS (ALIGNED WITH INVENTORY SINGLE ROW RULES) ================= */
  const columns = useMemo<MRT_ColumnDef<ActivityLogRow>[]>(
    () =>
      ACTIVITY_LOG_COLUMNS.map((col) => ({
        accessorKey: col.key,
        header: col.label,
        size: col.size,
        minSize: 100,

        Header: ({ column }) => {
          const titleText = column.columnDef.header ?? "";
          return (
            <span title={titleText} style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {titleText}
            </span>
          );
        },

        muiTableHeadCellProps: { align: "left" },

        muiTableBodyCellProps: {
          sx: {
            py: 0.8,
            px: 1.2,
            fontSize: "0.68rem",
            borderRight: "none",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            color: "#334155",
            textAlign: col.align
          },
        },

        Cell: ({ cell }) => {
          const value = cell.getValue<any>();

          if (col.key === "role") {
            const s = ROLE_STYLE[String(value).toUpperCase()] || { bg: "#f1f5f9", color: "#475569" };
            return (
              <Chip
                label={value ?? "NA"}
                size="small"
                sx={{
                  fontWeight: 700,
                  fontSize: "0.62rem",
                  height: 18,
                  backgroundColor: s.bg,
                  color: s.color,
                  borderRadius: "4px"
                }}
              />
            );
          }

          if (col.key === "created_at") {
            return value ? new Date(value).toLocaleString() : "-";
          }

          return value ?? "-";
        },
      })),
    []
  );

  /* ================= VISIBILITY CORES ================= */
  const buildAllVisible = () =>
    ACTIVITY_LOG_COLUMNS.reduce((acc, col) => {
      acc[col.key] = true;
      return acc;
    }, {} as Record<string, boolean>);

  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem(`${LOCALSTORAGE_PREFIX}${tableId}`);
      return raw ? JSON.parse(raw) : buildAllVisible();
    } catch {
      return buildAllVisible();
    }
  });

  useEffect(() => {
    localStorage.setItem(`${LOCALSTORAGE_PREFIX}${tableId}`, JSON.stringify(columnVisibility));
  }, [columnVisibility, tableId]);

  return (
    <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", backgroundColor: "#ffffff" }}>
      <MaterialReactTable
        columns={columns}
        data={dataObjects}
        enableColumnPinning

        /* INVENTORY STYLE HOOK RULES */
        layoutMode="grid"
        enableColumnResizing
        columnResizeMode="onEnd"
        enableStickyHeader
        enablePagination
        enableColumnOrdering
        enableHiding
        enableGrouping
        enableClickToCopy
        enableColumnFilters

        initialState={{
          pagination: { pageIndex: 0, pageSize },
          density: "compact",
          sorting: [{ id: "created_at", desc: true }],
        }}

        state={{
          columnVisibility,
          globalFilter,
        }}
        onColumnVisibilityChange={setColumnVisibility}
        onGlobalFilterChange={setGlobalFilter}

        defaultColumn={{ filterFn: "equals" }}
        muiTableBodyProps={{ sx: { tableLayout: "fixed" } }}

        /*  CONTAINER SCROLL LAYOUT CONTROL CAPS */
        muiTableContainerProps={{
          sx: {
            width: "100%",
            maxWidth: "100%",
            flex: 1,
            maxHeight: "calc(100% - 96px)", // Protects layout spacing for top/bottom bars
            overflowY: "auto",
            overflowX: "auto",
            position: "relative",
            scrollbarWidth: "thin",
            scrollbarColor: "#cbd5e1 transparent",
            "&::-webkit-scrollbar": { width: "8px", height: "8px" },
            "&::-webkit-scrollbar-thumb": { background: "#cbd5e1", borderRadius: "4px" },
          },
        }}

        muiTablePaperProps={{
          elevation: 0,
          sx: { borderRadius: 3, border: "1px solid #e2e8f0", height: "100%", display: "flex", flexDirection: "column", width: "100%", overflow: "hidden" },
        }}

        /* MASTER THEMED HEADER DESIGN */
        muiTableHeadCellProps={{
          sx: {
            backgroundColor: "#354a6b", color: "#ffffff", py: 0.75, px: 1.2, fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "none", whiteSpace: "nowrap", textAlign: "left", cursor: "pointer", 
            "& .MuiTableHeadCell-SortLabel-Icon, & .MuiTableHeadCell-Content-Actions .MuiTableHeadCell-SortLabel-Icon, & .MuiIconButton-root:has(.MuiTableHeadCell-SortLabel-Icon)": { display: "none !important" },
            "& .MuiTableHeadCell-Content-Actions .MuiSvgIcon-root, & .MuiIconButton-root": { color: "#ffffff !important", display: "inline-flex !important" },
            "& .Mui-TableHeadCell-Content": { justifyContent: "flex-start", alignItems: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" },
            "& .Mui-TableHeadCell-Content-Labels": { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", padding: 0, margin: 0 }
          },
        }}

        muiTableBodyRowProps={({ row }) => ({
          sx: { backgroundColor: row.index % 2 === 0 ? "#ffffff" : "#f8fafc", "&:hover": { backgroundColor: "#f1f5f9 !important" }, "& td": { borderBottom: "1px solid #e2e8f0" } },
        })}

        /* DENSE TOOLBAR INJECTIONS */
        muiTopToolbarProps={{
          sx: {
            backgroundColor: "#ffffff", p: "4px 8px", borderBottom: "1px solid #e2e8f0", flexShrink: 0,
            "& .MuiToolbar-root": { minHeight: "36px !important", height: "36px", display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 2, p: 0 },
            "& .MuiTextField-root": { margin: 0, "& .MuiInputBase-root": { fontSize: "0.68rem", height: "28px", backgroundColor: "#f1f5f9", borderRadius: "6px", "& fieldset": { border: "none" }, "& input": { py: "4px" } } },
            "& .MuiIconButton-root": { padding: "6px", color: "#475569", "& .MuiSvgIcon-root": { fontSize: "1.1rem" } }
          },
        }}

        muiBottomToolbarProps={{
          sx: {
            p: 0, m: 0, minHeight: "40px", flexShrink: 0, backgroundColor: "#ffffff", borderTop: "1px solid #e2e8f0",
            "& .MuiToolbar-root": { minHeight: "40px !important", height: "40px", display: "flex", alignItems: "center", justifyContent: "flex-end" },
            "& .MuiTablePagination-root": { margin: 0, padding: 0 },
            "& .MuiInputBase-root": { height: "28px", fontSize: "0.7rem" },
          },
        }}

        muiPaginationProps={{
          variant: "text",
          shape: "rounded",
          size: "small",
          rowsPerPageOptions: [10, 25, 50, 100, 200]
        }}

        enableTopToolbar
        enableBottomToolbar
      />
    </Box>
  );
};

export default ActivityLogsTable;