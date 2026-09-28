import React, { useMemo, useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import { MaterialReactTable, MRT_ColumnDef } from "material-react-table";

interface Props {
  data: Record<string, any>[];
  columns: string[];
  tableId: string;
  onRowClick?: (row: Record<string, any>) => void;
  pageSize?: number;
  renderTopToolbarCustomActions?: (props: { table: any }) => React.ReactNode;
}

const LOCALSTORAGE_PREFIX = "visible_columns_map_";

/* ================= ANALYTICS THRESHOLDS ================= */
const SPAN_LOSS_THRESHOLDS = {
  normalMax: 2.5,
  warningMax: 3.0,
};

/* ================= REGEX PARSING UTILS ================= */
const parseNumber = (val: any): number | null => {
  if (val === null || val === undefined) return null;
  const match = String(val).match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
};

const isSpanLossColumn = (colId: string) =>
  colId.toLowerCase() === "sp_rx_mean";

/* ================= COMPONENT ================= */
const PerformanceTable: React.FC<Props> = ({
  data,
  columns: columnOrder,
  tableId,
  onRowClick,
  pageSize = 25,
  renderTopToolbarCustomActions,
}) => {
  /* ---------- CONDITIONAL ALERT COLOR FORMATTERS ---------- */
  const getSpanLossStyle = (value: number) => {
    if (value > SPAN_LOSS_THRESHOLDS.warningMax) {
      return { backgroundColor: "rgba(220, 38, 38, 0.08)", color: "#dc2626", fontWeight: 700 };
    }
    if (value > SPAN_LOSS_THRESHOLDS.normalMax) {
      return { backgroundColor: "rgba(245, 158, 11, 0.08)", color: "#d97706", fontWeight: 700 };
    }
    return { backgroundColor: "rgba(16, 185, 129, 0.08)", color: "#059669", fontWeight: 700 };
  };

  /* ================= DYNAMIC COLUMNS (SYNCD WITH INVENTORY RULES) ================= */
  const columns = useMemo<MRT_ColumnDef<any>[]>(() => {
    return columnOrder.map((key, index) => ({
      accessorKey: key,
      header: key,
      size: index === 0 ? 240 : 160,
      minSize: 100,

      Header: ({ column }) => {
        const titleText = column.columnDef.header ?? "";
        const words = titleText.split(/\s+/);
        const isLong = words.length > 10;
        const displayTitle = isLong ? words.slice(0, 10).join(" ") + "..." : titleText;
        
        return (
          <span title={titleText} style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {displayTitle}
          </span>
        );
      },

      muiTableHeadCellProps: { align: "left" },

      muiTableBodyCellProps: ({ cell }) => {
        const colId = cell.column.id;
        const value = parseNumber(cell.getValue());

        const baseStyles = {
          py: 0.8, 
          px: 1.2,
          fontSize: "0.68rem",
          borderRight: "none",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          color: "#334155",
        };

        // Inject analytics color alerting onto live cells dynamically
        if (isSpanLossColumn(colId) && value !== null) {
          return {
            sx: {
              ...baseStyles,
              ...getSpanLossStyle(value),
            },
          };
        }

        return { sx: baseStyles };
      },
    }));
  }, [columnOrder]);

  /* ================= COLUMN VISIBILITY REGISTRY ================= */
  const buildAllVisible = () =>
    columns.reduce((acc, col) => {
      acc[col.accessorKey as string] = true;
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

  /* ---------- EMPTY STATE PLUG ---------- */
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: "center", border: "1px solid #e2e8f0", borderRadius: "8px", m: 1 }}>
        <Typography sx={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b" }}>

        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", backgroundColor: "#ffffff" }}>
      <MaterialReactTable
        columns={columns}
        data={data}
        enableColumnPinning

        /* ================= INVENTORY MODE FEATURES ================= */
        layoutMode="grid"
        enableColumnResizing
        columnResizeMode="onEnd"
        enableStickyHeader
        enablePagination
        enableColumnOrdering
        enableHiding
        enableGrouping

        initialState={{
          pagination: { pageIndex: 0, pageSize },
          density: "compact",
        }}

        state={{ columnVisibility }}
        onColumnVisibilityChange={setColumnVisibility}
        renderTopToolbarCustomActions={renderTopToolbarCustomActions}

        muiTableBodyProps={{ sx: { tableLayout: "fixed" } }}

        /* ================= CONTAINER SCROLL CONFIGS ================= */
        muiTableContainerProps={{
          sx: {
            width: "100%",
            maxWidth: "100%",
            flex: 1, 
            maxHeight: "calc(100% - 96px)", // Dynamic compensation for custom layouts
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
          sx: { borderRadius: 3, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "none", height: "100%", display: "flex", flexDirection: "column", width: "100%" },
        }}
        
        defaultColumn={{ filterFn: "equals" }}

        /* ================= THEMED HEADER STYLES ================= */
        muiTableHeadCellProps={{
          sx: {
            backgroundColor: "#354a6b", color: "#ffffff", py: 0.75, px: 1.2, fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "none", whiteSpace: "nowrap", textAlign: "left", cursor: "pointer", 
            "& .MuiTableHeadCell-SortLabel-Icon, & .MuiTableHeadCell-Content-Actions .MuiTableHeadCell-SortLabel-Icon, & .MuiIconButton-root:has(.MuiTableHeadCell-SortLabel-Icon)": { display: "none !important" },
            "& .MuiTableHeadCell-Content-Actions .MuiSvgIcon-root, & .MuiIconButton-root": { color: "#ffffff !important", display: "inline-flex !important" },
            "& .Mui-TableHeadCell-Content": { justifyContent: "flex-start", alignItems: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" },
            "& .Mui-TableHeadCell-Content-Labels": { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", padding: 0, margin: 0 }
          },
        }}

        /* ================= ROW INTERACTION HOOKS ================= */
        muiTableBodyRowProps={({ row }) => ({
          onClick: onRowClick ? () => onRowClick(row.original) : undefined,
          sx: { 
            cursor: onRowClick ? "pointer" : "default",
            backgroundColor: row.index % 2 === 0 ? "#ffffff" : "#f8fafc", 
            "&:hover": { backgroundColor: "#f1f5f9 !important" }, 
            "& td": { borderBottom: "1px solid #e2e8f0" } 
          },
        })}

        /* ================= COMPACT TOOLBAR ELEMENTS ================= */
        muiTopToolbarProps={{
          sx: {
            backgroundColor: "#ffffff", p: 1, flexShrink: 0,
            "& .MuiToolbar-root": { minHeight: "56px !important", display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 2, px: 1 },
            "& .MuiCollapse-wrapperInner .MuiTextField-root": { margin: 0, minWidth: "200px", "& .MuiInputBase-root": { fontSize: "0.75rem", height: "36px", backgroundColor: "#f1f5f9", borderRadius: "6px", "& fieldset": { border: "none" } } },
            "& .MuiIconButton-root": { padding: "6px", color: "#475569", "&:hover": { backgroundColor: "#f1f5f9" } }
          },
        }}

        muiBottomToolbarProps={{
          sx: {
            p: 0, m: 0, minHeight: "40px", flexShrink: 0, backgroundColor: "#ffffff", borderTop: "1px solid #e2e8f0",
            "& .MuiToolbar-root": { minHeight: "40px !important", height: "40px" },
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

export default PerformanceTable;