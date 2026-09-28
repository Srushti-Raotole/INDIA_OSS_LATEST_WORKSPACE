import React, { useMemo, useState, useEffect } from "react";
import { Box } from "@mui/material";
import {
  MaterialReactTable,
  MRT_ColumnDef,
  MRT_RowSelectionState,
} from "material-react-table";

interface CommonTableProps {
  columnOrder: string[];
  dataObjects: Record<string, any>[];
  pageSize?: number;
  onRowClick?: (row: Record<string, any>) => void;
  tableId: string;
  enableRowSelection?: boolean;
  onRowSelectionChange?: (rows: Record<string, any>[]) => void;
}

const LOCALSTORAGE_PREFIX = "visible_columns_map_";

const AdminCommonTable: React.FC<CommonTableProps> = ({
  columnOrder,
  dataObjects,
  pageSize = 10,
  onRowClick,
  tableId,
  enableRowSelection = false,
  onRowSelectionChange,
}) => {
  if (!dataObjects || dataObjects.length === 0) return null;

  /* ---------- Columns Def Generator ---------- */
  const columns = useMemo<MRT_ColumnDef<any>[]>(
    () =>
      columnOrder.map((col, index) => ({
        accessorFn: (row) => row[col],
        id: col,
        header: col,
        size: index === 0 ? 240 : 160,
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
          },
        },
      })),
    [columnOrder],
  );

  /* ---------- Storage Caches Hooks ---------- */
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
      if (!parsed || typeof parsed !== "object") return buildAllVisible(columnOrder);
      
      const map: Record<string, boolean> = { ...parsed };
      columnOrder.forEach((k) => { if (typeof map[k] !== "boolean") map[k] = true; });
      Object.keys(map).forEach((k) => { if (!columnOrder.includes(k)) delete map[k]; });
      return map;
    } catch {
      return buildAllVisible(columnOrder);
    }
  };

  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => loadVisibilityMap());

  useEffect(() => {
    localStorage.setItem(`${LOCALSTORAGE_PREFIX}${tableId}`, JSON.stringify(columnVisibility));
  }, [columnVisibility, tableId]);

  useEffect(() => {
    setColumnVisibility((prev) => {
      const next = { ...prev };
      columnOrder.forEach((k) => { if (typeof next[k] !== "boolean") next[k] = true; });
      Object.keys(next).forEach((k) => { if (!columnOrder.includes(k)) delete next[k]; });
      return next;
    });
  }, [columnOrder]);

  const orderedData = useMemo(
    () =>
      dataObjects.map((obj) =>
        columnOrder.reduce((acc, key) => {
          acc[key] = obj[key] ?? "";
          return acc;
        }, {} as Record<string, any>),
      ),
    [dataObjects, columnOrder],
  );

  /* ---------- Row Selection Mapping Tracking ---------- */
  const [rowSelection, setRowSelection] = useState<MRT_RowSelectionState>({});

  useEffect(() => {
    if (!enableRowSelection || !onRowSelectionChange) return;

    const selectedRows = Object.keys(rowSelection)
      .filter((k) => rowSelection[k])
      .map((idx) => orderedData[Number(idx)])
      .filter(Boolean);

    onRowSelectionChange(selectedRows);
  }, [rowSelection, orderedData, enableRowSelection, onRowSelectionChange]);

  return (
    <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", backgroundColor: "#ffffff" }}>
      <MaterialReactTable
        columns={columns}
        data={orderedData}
        enableColumnPinning

        /* MANAGEMENT CORE CONTROLS */
        layoutMode="grid"
        enableColumnResizing
        columnResizeMode="onEnd"
        enableStickyHeader
        enablePagination
        enableColumnOrdering
        enableHiding
        enableGrouping
        enableRowSelection={enableRowSelection}
        enableSelectAll={false}

        state={{
          columnVisibility,
          rowSelection,
        }}
        onColumnVisibilityChange={setColumnVisibility}
        onRowSelectionChange={setRowSelection}

        initialState={{
          pagination: { pageIndex: 0, pageSize },
          density: "compact",
        }}

        muiTableBodyProps={{ sx: { tableLayout: "fixed" } }}

        /*  FIXED SCROLL ENVELOPE: Prevents bottom bar cropping */
        muiTableContainerProps={{
          sx: {
            width: "100%",
            maxWidth: "100%",
            flex: 1,
            maxHeight: "calc(100% - 96px)", 
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
        
        defaultColumn={{ filterFn: "equals" }}

        /* UNIFIED enterprise STYLINGS HEADERS */
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
          onClick: onRowClick ? () => onRowClick(row.original) : undefined,
          sx: {
            cursor: onRowClick ? "pointer" : "default",
            backgroundColor: row.index % 2 === 0 ? "#ffffff" : "#f8fafc",
            "&:hover": { backgroundColor: "#f1f5f9 !important" },
            "& td": { borderBottom: "1px solid #e2e8f0" }
          },
        })}

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
        }}

        enableTopToolbar
        enableBottomToolbar
      />
    </Box>
  );
};

export default AdminCommonTable;