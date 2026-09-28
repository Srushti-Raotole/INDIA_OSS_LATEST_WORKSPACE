
import React, { useMemo, useState, useEffect } from "react";
import { Box } from "@mui/material";
import { MaterialReactTable, MRT_ColumnDef } from "material-react-table";

/* ================= PROPS ================= */
interface Props {
  dataObjects: Record<string, any>[];
  pageSize?: number;
  tableId: string;
}

/* ================= CELL COLORING ================= */
const getCellStyle = (value: any) => {
  if (typeof value !== "string") return {};
  const v = value.toLowerCase();

  if (v === "yes")
    return { backgroundColor: "#dcfce7", color: "#166534", fontWeight: 600 };
  if (v === "no")
    return { backgroundColor: "#fee2e2", color: "#991b1b", fontWeight: 600 };
  if (v === "late")
    return { backgroundColor: "#fef3c7", color: "#92400e", fontWeight: 600 };

  return {};
};

const LOCALSTORAGE_PREFIX = "visible_columns_map_";

/* ================= COMPONENT ================= */
const SpanlossAuditTable: React.FC<Props> = ({
  dataObjects,
  pageSize = 25,
  tableId,
}) => {
  if (!dataObjects || dataObjects.length === 0) return null;

  /* ================= DYNAMIC COLUMNS ================= */
  const columns = useMemo<MRT_ColumnDef<any>[]>(() => {
    const keys = Object.keys(dataObjects[0]);

    return keys.map((key, index) => ({
      accessorFn: (row) => row[key],
      id: key,
      header: key,
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

      muiTableBodyCellProps: ({ cell }) => ({
        sx: {
          ...getCellStyle(cell.getValue()),
          py: 0.8,
          px: 1.2,
          fontSize: "0.68rem",
          borderRight: "none",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          color: "#334155",
        },
      }),
    }));
  }, [dataObjects]);

  /* ================= COLUMN VISIBILITY ================= */
  const buildAllVisible = (keys: string[]) =>
    keys.reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Record<string, boolean>);

  const loadVisibilityMap = (): Record<string, boolean> => {
    try {
      const keys = Object.keys(dataObjects[0]);
      const raw = localStorage.getItem(`${LOCALSTORAGE_PREFIX}${tableId}`);
      if (!raw) return buildAllVisible(keys);
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return buildAllVisible(keys);
      
      const map: Record<string, boolean> = { ...parsed };
      keys.forEach((k) => { if (typeof map[k] !== "boolean") map[k] = true; });
      Object.keys(map).forEach((k) => { if (!keys.includes(k)) delete map[k]; });
      return map;
    } catch {
      const keys = Object.keys(dataObjects[0]);
      return buildAllVisible(keys);
    }
  };

  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => loadVisibilityMap());

  useEffect(() => {
    localStorage.setItem(`${LOCALSTORAGE_PREFIX}${tableId}`, JSON.stringify(columnVisibility));
  }, [columnVisibility, tableId]);

  return (
    <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", backgroundColor: "#ffffff" }}>
      <MaterialReactTable
        columns={columns}
        data={dataObjects}
        enableColumnPinning
        layoutMode="grid"
        enableColumnResizing
        columnResizeMode="onEnd"
        enableStickyHeader
        enablePagination
        enableColumnOrdering
        enableHiding
        enableGrouping
        enableSelectAll={false}

        initialState={{
          pagination: { pageIndex: 0, pageSize },
          density: "compact",
        }}

        state={{ columnVisibility }}
        onColumnVisibilityChange={setColumnVisibility}

        muiTableBodyProps={{ sx: { tableLayout: "fixed" } }}

        /*  FIXED VIEWPORT CONTAINER: Maintains pagination visibility */
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

        /* ================= THEMED HEADERS ================= */
        muiTableHeadCellProps={{
          sx: {
            backgroundColor: "#354a6b", 
            color: "#ffffff", 
            py: 0.75, 
            px: 1.2, 
            fontSize: "0.72rem", 
            fontWeight: 700, 
            textTransform: "uppercase", 
            letterSpacing: "0.05em", 
            borderBottom: "none", 
            whiteSpace: "nowrap", 
            textAlign: "left", 
            cursor: "pointer", 
            "& .MuiTableHeadCell-SortLabel-Icon, & .MuiTableHeadCell-Content-Actions .MuiTableHeadCell-SortLabel-Icon, & .MuiIconButton-root:has(.MuiTableHeadCell-SortLabel-Icon)": { display: "none !important" },
            "& .MuiTableHeadCell-Content-Actions .MuiSvgIcon-root, & .MuiIconButton-root": { color: "#ffffff !important", display: "inline-flex !important" },
            "& .Mui-TableHeadCell-Content": { justifyContent: "flex-start", alignItems: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" },
            "& .Mui-TableHeadCell-Content-Labels": { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", padding: 0, margin: 0 }
          },
        }}

        muiTableBodyRowProps={({ row }) => ({
          sx: {
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

export default SpanlossAuditTable;