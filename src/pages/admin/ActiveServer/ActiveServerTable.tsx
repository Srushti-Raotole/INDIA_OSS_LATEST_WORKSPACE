import React, { useMemo, useState, useEffect } from "react";
import { Box } from "@mui/material";
import {
  MaterialReactTable,
  MRT_ColumnDef,
  MRT_RowSelectionState,
} from "material-react-table";

/* ================= PROPS ================= */
interface CommonTableProps {
  columnOrder: string[];
  dataObjects: Record<string, any>[];
  pageSize?: number;
  onRowClick?: (row: Record<string, any>) => void;

  /** REQUIRED: shared id with ExcelDownloadButton */
  tableId: string;

  /** Row selection support */
  enableRowSelection?: boolean;
  onRowSelectionChange?: (rows: Record<string, any>[]) => void;
}

const LOCALSTORAGE_PREFIX = "visible_columns_map_";

/* ================= HELPERS ================= */
const hasTimeColumn = (cols: string[]) =>
  cols.some((c) => c.toLowerCase() === "time");

/* ================= COMPONENT ================= */
const ActiveServerTable: React.FC<CommonTableProps> = ({
  columnOrder,
  dataObjects,
  pageSize = 10,
  onRowClick,
  tableId,
  enableRowSelection = false,
  onRowSelectionChange,
}) => {
  if (!dataObjects || dataObjects.length === 0) return null;

  /* ---------- Columns ---------- */
  const columns: MRT_ColumnDef<any>[] = useMemo(
    () =>
      columnOrder.map((col) => ({
        accessorFn: (row) => row[col],
        id: col,
        header: col,
      })),
    [columnOrder]
  );

  /* ---------- Column Visibility ---------- */
  const buildAllVisible = (keys: string[]) =>
    keys.reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Record<string, boolean>);

  const loadVisibilityMap = (): Record<string, boolean> => {
    try {
      const raw = localStorage.getItem(`${LOCALSTORAGE_PREFIX}${tableId}`);
      if (!raw) return buildAllVisible(columnOrder);

      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") {
        return buildAllVisible(columnOrder);
      }

      const map: Record<string, boolean> = { ...parsed };
      columnOrder.forEach((k) => {
        if (typeof map[k] !== "boolean") map[k] = true;
      });
      Object.keys(map).forEach((k) => {
        if (!columnOrder.includes(k)) delete map[k];
      });

      return map;
    } catch {
      return buildAllVisible(columnOrder);
    }
  };

  const [columnVisibility, setColumnVisibility] =
    useState<Record<string, boolean>>(() => loadVisibilityMap());

  useEffect(() => {
    localStorage.setItem(
      `${LOCALSTORAGE_PREFIX}${tableId}`,
      JSON.stringify(columnVisibility)
    );
  }, [columnVisibility, tableId]);

  useEffect(() => {
    setColumnVisibility((prev) => {
      const next = { ...prev };
      columnOrder.forEach((k) => {
        if (typeof next[k] !== "boolean") next[k] = true;
      });
      Object.keys(next).forEach((k) => {
        if (!columnOrder.includes(k)) delete next[k];
      });
      return next;
    });
  }, [columnOrder]);

  /* ---------- Ordered Data ---------- */
  const orderedData = useMemo(
    () =>
      dataObjects.map((obj) =>
        columnOrder.reduce((acc, key) => {
          acc[key] = obj[key] ?? "";
          return acc;
        }, {} as Record<string, any>)
      ),
    [dataObjects, columnOrder]
  );

  /* ---------- Row Selection ---------- */
  const [rowSelection, setRowSelection] =
    useState<MRT_RowSelectionState>({});

  useEffect(() => {
    if (!enableRowSelection || !onRowSelectionChange) return;

    const selectedRows = Object.keys(rowSelection)
      .filter((k) => rowSelection[k])
      .map((idx) => orderedData[Number(idx)])
      .filter(Boolean);

    onRowSelectionChange(selectedRows);
  }, [rowSelection, orderedData, enableRowSelection, onRowSelectionChange]);

  /* ================= RENDER ================= */
  return (
    <Box
      sx={{
        p: 0,
        m: 0,
        width: "100%",
        maxWidth: "100%",
        overflow: "hidden",
      }}
    >
      <MaterialReactTable
        layoutMode="grid"
        columns={columns}
        data={orderedData}

        /* --- Selection --- */
        enableRowSelection={enableRowSelection}
        enableSelectAll={false}
        onRowSelectionChange={setRowSelection}

        /* --- State --- */
        state={{
          columnVisibility,
          rowSelection,
        }}

        /* --- Column Visibility --- */
        enableHiding
        onColumnVisibilityChange={setColumnVisibility}

        /* --- Row Click --- */
        muiTableBodyRowProps={({ row }) => ({
          onClick: onRowClick ? () => onRowClick(row.original) : undefined,
          sx: {
            cursor: onRowClick ? "pointer" : "default",
            backgroundColor: row.index % 2 === 0 ? "#ffffff" : "#f8fafc",
            "&:hover": {
              backgroundColor: onRowClick ? "#f5f5f5" : "inherit",
            },
          },
        })}

        /* --- Table Styling --- */
        muiTablePaperProps={{
          sx: {
            boxShadow: "none",
            border: "1px solid #e0e0e0",
            m: 0,
            width: "100%",
            maxWidth: "100%",
          },
        }}

        muiTableHeadCellProps={{
          sx: {
            py: 0.2,
            px: 1,
            fontSize: "0.75rem",
            fontWeight: "bold",
            color: "white",
            backgroundColor: "#334155",
            whiteSpace: "nowrap",
            position: "sticky",
            top: 0,
            zIndex: 2,
            borderRight: "1px solid grey",
            "& .MuiSvgIcon-root": { color: "white !important" },
            "& .Mui-TableSortLabel-icon": {
              color: "white !important",
            },
          },
        }}

        /* --- BODY CELL STYLING + COLOR CODING --- */
        muiTableBodyCellProps={({ cell }) => {
          const value = cell.getValue<string>();

          const isPrimary = value === "PRIMARY";
          const isSecondary = value === "SECONDARY";

          return {
            sx: {
              py: 0.4,
              px: 1,
              fontSize: "0.7rem",
              whiteSpace: "nowrap",
              borderRight: "1px solid grey",

              ...(isPrimary && {
                fontWeight: 700,
                color: "#15803d",
                backgroundColor: "#dcfce7",
                borderRadius: "6px",
              }),

              ...(isSecondary && {
                fontWeight: 700,
                color: "#b45309",
                backgroundColor: "#fef3c7",
                borderRadius: "6px",
              }),
            },
          };
        }}

        /* --- Scrollbars --- */
        muiTableContainerProps={{
          sx: {
            width: "100%",
            maxWidth: "100%",
            maxHeight: "68vh",
            overflowY: "auto",
            overflowX: "auto",
            position: "relative",
            scrollbarWidth: "thin",
            scrollbarColor: "#94a3b8 transparent",
            "&::-webkit-scrollbar": { width: 12, height: 12 },
            "&::-webkit-scrollbar-track": {
              background: "#f1f1f1",
              borderRadius: "6px",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "#94a3b8",
              borderRadius: "6px",
            },
            "&::-webkit-scrollbar-corner": {
              background: "#f1f1f1",
            },
          },
        }}

        /* --- Pagination & Sorting --- */
        enablePagination
        initialState={{
          pagination: { pageIndex: 0, pageSize },
          sorting: hasTimeColumn(columnOrder)
            ? [{ id: "time", desc: true }]
            : [],
        }}
        muiPaginationProps={{
          variant: "outlined",
          shape: "rounded",
          size: "small",
        }}

        /* --- Toolbars --- */
        enableTopToolbar
        enableBottomToolbar
        enableStickyHeader
        enableStickyFooter
        enableColumnOrdering
        enableGrouping
        defaultColumn={{
          filterFn: "equals",
        }}
      />
    </Box>
  );
};

export default ActiveServerTable;
