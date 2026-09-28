import React, { useMemo, useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import { MaterialReactTable, MRT_ColumnDef } from "material-react-table";

/* ================= PROPS ================= */
export type HighlightConfig = {
  columnKey: string;
  thresholds: {
    normalMax: number;
    warningMax: number;
  };
};

type Props = {
  data: Record<string, any>[];
  columns: string[];
  tableId: string;
  onRowClick?: (row: Record<string, any>) => void;
  pageSize?: number;
  highlightConfig?: HighlightConfig;
};

const LOCALSTORAGE_PREFIX = "visible_columns_map_";

/* ================= HELPERS ================= */
const parseNumber = (val: any): number | null => {
  if (val === null || val === undefined) return null;
  const match = String(val).match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
};

const isHighlightColumn = (colId: string, key?: string) =>
  key && colId.toLowerCase() === key.toLowerCase();

const getThresholdStyle = (
  value: number,
  thresholds: HighlightConfig["thresholds"]
) => {
  if (value > thresholds.warningMax) {
    return {
      backgroundColor: "rgba(211,47,47,0.15)",
      color: "#d32f2f",
      fontWeight: 700,
    };
  }

  if (value > thresholds.normalMax) {
    return {
      backgroundColor: "rgba(237,108,2,0.15)",
      color: "#ed6c02",
      fontWeight: 600,
    };
  }

  return {
    backgroundColor: "rgba(46,125,50,0.12)",
    color: "#2e7d32",
    fontWeight: 600,
  };
};

/* ================= COMPONENT ================= */
const CommonDataTable: React.FC<Props> = ({
  data,
  columns: columnOrder,
  tableId,
  onRowClick,
  pageSize = 25,
  highlightConfig,
}) => {
  /* ---------- EMPTY STATE ---------- */
  if (!data || data.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography>No data available</Typography>
      </Box>
    );
  }

  /* ---------- COLUMNS ---------- */
  const columns = useMemo<MRT_ColumnDef<any>[]>(
    () =>
      columnOrder.map((col) => ({
        accessorKey: col,
        header: col,
        minSize: 180,
      })),
    [columnOrder]
  );

  /* ---------- COLUMN VISIBILITY ---------- */
  const buildAllVisible = (keys: string[]) =>
    keys.reduce((acc, k) => {
      acc[k] = true;
      return acc;
    }, {} as Record<string, boolean>);

  const loadVisibilityMap = (): Record<string, boolean> => {
    try {
      const raw = localStorage.getItem(`${LOCALSTORAGE_PREFIX}${tableId}`);
      if (!raw) return buildAllVisible(columnOrder);
      return JSON.parse(raw);
    } catch {
      return buildAllVisible(columnOrder);
    }
  };

  const [columnVisibility, setColumnVisibility] =
    useState<Record<string, boolean>>(loadVisibilityMap);

  useEffect(() => {
    localStorage.setItem(
      `${LOCALSTORAGE_PREFIX}${tableId}`,
      JSON.stringify(columnVisibility)
    );
  }, [columnVisibility, tableId]);

  /* ---------- RENDER ---------- */
  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      <MaterialReactTable
        layoutMode="semantic"
        columns={columns}
        data={data}

        /* ===== ONLY SEARCH ===== */
        enableTopToolbar
        enableGlobalFilter
        enablePagination
        enableStickyHeader
        enableBottomToolbar

        /* ❌ DISABLE EVERYTHING ELSE */
        enableColumnOrdering={false}
        enableHiding={false}
        enableGrouping={false}
        enableDensityToggle={false}
        enableFullScreenToggle={false}

        /* ===== STATE ===== */
        state={{ columnVisibility }}
        onColumnVisibilityChange={setColumnVisibility}

        initialState={{
          pagination: { pageIndex: 0, pageSize },
          density: "compact",
          showGlobalFilter: true, //  SEARCH ALWAYS VISIBLE
        }}

        /* ===== TABLE PAPER ===== */
        muiTablePaperProps={{
          elevation: 0,
          sx: {
            height: "100%",
            border: "1px solid #e0e0e0",
            display: "flex",
            flexDirection: "column",
          },
        }}

        /* ===== SCROLL ===== */
        // muiTableContainerProps={{
        //   sx: {
        //     maxHeight: "65vh",
        //     overflowY: "auto",
        //     overflowX: "auto",
        //   },
        // }}
        muiTableContainerProps={{
          sx: {
            width: '100%',
            maxWidth: '100%',
            maxHeight: '68vh',
            overflowY: 'auto',
            overflowX: 'auto',
            position: 'relative',
            scrollbarWidth: 'thin',
            scrollbarColor: "#94a3b8 transparent",
            '&::-webkit-scrollbar': { width: '12px', height: '12px' },
            '&::-webkit-scrollbar-track': { background: '#f1f1f1', borderRadius: '6px' },
            '&::-webkit-scrollbar-thumb': {
              background: '#94a3b8',
              borderRadius: '6px',
              '&:hover': { background: '#94a3b8' },
            },
            '&::-webkit-scrollbar-corner': { background: '#f1f1f1' },
          },
        }}
        /* ===== HEADER STYLE ===== */
        muiTableHeadCellProps={{
          sx: {
            backgroundColor: "#334155",
            color: "#fff",
            fontWeight: 700,
            fontSize: "0.75rem",
            whiteSpace: "nowrap",
            position: "sticky",
            top: 0,
            zIndex: 2,
            borderRight: "1px solid rgba(255,255,255,0.3)",
          },
        }}

        /* ===== BODY CELLS ===== */
        muiTableBodyCellProps={({ cell }) => {
          const value = parseNumber(cell.getValue());

          if (
            highlightConfig &&
            value !== null &&
            isHighlightColumn(cell.column.id, highlightConfig.columnKey)
          ) {
            return {
              sx: {
                ...getThresholdStyle(value, highlightConfig.thresholds),
                whiteSpace: "nowrap",
                fontSize: "0.7rem",
              },
            };
          }

          return {
            sx: {
              fontSize: "0.7rem",
              whiteSpace: "nowrap",
            },
          };
        }}
        defaultColumn={{
          filterFn: "equals",
        }}
        /* ===== ROW ===== */
        muiTableBodyRowProps={({ row }) => ({
          onClick: onRowClick ? () => onRowClick(row.original) : undefined,
          sx: {
            cursor: onRowClick ? "pointer" : "default",
            backgroundColor: row.index % 2 === 0 ? "#ffffff" : "#f8fafc",
            "&:hover": {
              backgroundColor: onRowClick ? "#eaeaea" : undefined,
            },
          },
        })}

        muiPaginationProps={{
          size: "small",
          shape: "rounded",
        }}
      />
    </Box>
  );
};

export default CommonDataTable;
