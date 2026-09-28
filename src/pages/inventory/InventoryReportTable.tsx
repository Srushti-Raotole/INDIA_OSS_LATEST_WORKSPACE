import React, { useMemo, useState, useEffect } from "react";
import { Box } from "@mui/material";
import { MaterialReactTable, MRT_ColumnDef } from "material-react-table";

interface Props {
  dataObjects: Record<string, any>[];
  pageSize?: number;
  tableId: string;
  renderTopToolbarCustomActions?: (props: { table: any }) => React.ReactNode;
}

const LOCALSTORAGE_PREFIX = "visible_columns_map_";

const InvReportTable: React.FC<Props> = ({
  dataObjects,
  pageSize = 25,
  tableId,
  renderTopToolbarCustomActions,
}) => {
  if (!Array.isArray(dataObjects) || dataObjects.length === 0) return null;

  const columns = useMemo<MRT_ColumnDef<any>[]>(() => {
    const keys = Object.keys(dataObjects[0]).filter((k) => k !== "_children");

    return keys.map((key, index) => ({
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

      Cell: ({ cell }) => {
        const value = cell.getValue();
        if (value === null || value === undefined) return "";
        if (typeof value === "object") return JSON.stringify(value);
        return String(value);
      },

      muiTableBodyCellProps: {
        sx: {
          py: 0.8, //  INCREASED ROW CELL GAP PADDING
          px: 1.2,
          fontSize: "0.68rem",
          borderRight: "none",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          color: "#334155",
        },
      },
    }));
  }, [dataObjects]);

  /* ================= COLUMN VISIBILITY ================= */
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

  return (
    <Box sx={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", backgroundColor: "#ffffff" }}>
      <MaterialReactTable
        columns={columns}
        data={dataObjects}
        enableColumnPinning

        /* ================= FEATURES ================= */
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

        muiTableContainerProps={{
          sx: {
            width: '100%',
            maxWidth: '100%',
            height: '100%', 
            overflowY: 'auto',
            overflowX: 'auto',
            position: 'relative',
            scrollbarWidth: 'thin',
            scrollbarColor: "#cbd5e1 transparent",
            '&::-webkit-scrollbar': { width: '8px', height: '8px' },
            '&::-webkit-scrollbar-thumb': { background: '#cbd5e1', borderRadius: '4px' },
          },
        }}

        muiTablePaperProps={{
          sx: { borderRadius: 3, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "none", height: "100%", display: "flex", flexDirection: "column", width: "100%" },
        }}
        
        defaultColumn={{ filterFn: "equals" }}

        muiTableHeadCellProps={{
          sx: {
            backgroundColor: "#354a6b", color: "#ffffff", py: 0.75, px: 1.2, fontSize: "0.72rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "none", whiteSpace: "nowrap", textAlign: "left", cursor: "pointer", 
            "& .MuiTableHeadCell-SortLabel-Icon, & .MuiTableHeadCell-Content-Actions .MuiTableHeadCell-SortLabel-Icon, & .MuiIconButton-root:has(.MuiTableHeadCell-SortLabel-Icon)": { display: "none !important" },
            "& .MuiTableHeadCell-Content-Actions .MuiSvgIcon-root, & .MuiIconButton-root": { color: "#ffffff !important", display: "inline-flex !important" },
            "& .Mui-TableHeadCell-Content": { justifyContent: "flex-start", alignItems: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" },
            "& .Mui-TableHeadCell-Content-Labels": { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", padding: 0, margin: 0 }
          },
        }}

        muiTableBodyRowProps={({ row }) => ({
          sx: { backgroundColor: row.index % 2 === 0 ? "#ffffff" : "#f8fafc", '&:hover': { backgroundColor: '#f1f5f9 !important' }, "& td": { borderBottom: "1px solid #e2e8f0" } },
        })}

        muiTopToolbarProps={{
          sx: {
            backgroundColor: '#ffffff', p: 1, flexShrink: 0,
            '& .MuiToolbar-root': { minHeight: '56px !important', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 2, px: 1 },
            '& .MuiCollapse-wrapperInner .MuiTextField-root': { margin: 0, minWidth: '200px', '& .MuiInputBase-root': { fontSize: '0.75rem', height: '36px', backgroundColor: '#f1f5f9', borderRadius: '6px', '& fieldset': { border: 'none' } } },
            '& .MuiIconButton-root': { padding: '6px', color: '#475569', '&:hover': { backgroundColor: '#f1f5f9' } }
          },
        }}

        muiBottomToolbarProps={{
          sx: {
            p: 0, m: 0, minHeight: '40px', flexShrink: 0, backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0',
            '& .MuiToolbar-root': { minHeight: '40px !important', height: '40px' },
            '& .MuiTablePagination-root': { margin: 0, padding: 0 },
            '& .MuiInputBase-root': { height: '28px', fontSize: '0.7rem' },
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

export default InvReportTable;