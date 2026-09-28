import React, { useMemo, useState } from "react";
import { Box } from "@mui/material";
import {
  MaterialReactTable,
  MRT_ColumnDef,
  MRT_PaginationState,
} from "material-react-table";

type TreeTableProps = {
  dataObjects: Record<string, any>[];
  columnOrder: string[];
  tableId?: string;
  defaultPageSize?: number;
};

const FINAL_COLUMN_ORDER = [
  "name",
  "adminState",
  "cardType",
  "softwareVersion",
  "primaryState",
  "equipmentLocation",
  "actualType",
  "serialNumber",
  "pid",
  "hardwarePartNumber",
  "clei",
  "versionId",
  "bootromRevision",
  "manufacturingDate",
  "geoLocation",
  "ipAdress",
  "vendor",
];

const HIDDEN_COLUMNS = new Set([
  "_children",
  "id",
  "Id",
  "parent1",
  "parent2",
  "shelfType",
]);

const HEADER_LABELS: Record<string, string> = {
  name: "Name",
  adminState: "Admin State",
  cardType: "Equipment Type",
  softwareVersion: "Software Revision",
  primaryState: "Equipment State",
  equipmentLocation: "Equipment Location",
  actualType: "Actual Equipment Type",
  serialNumber: "Serial No.",
  pid: "Product ID",
  hardwarePartNumber: "Hardware Part No.",
  clei: "CLEI Code",
  bootromRevision: "Boot ROM Revision",
  manufacturingDate: "Manufacturing Date",
  ipAdress: "IP Address",
  vendor: "Vendor",
  geoLocation: "Geographical location",
  versionId: "Version ID",
};

/* ===================== COMPONENT ===================== */
const TreeTable: React.FC<TreeTableProps> = ({
  dataObjects,
  columnOrder,
  tableId = "all-physical-tree-table",
  defaultPageSize = 25,
}) => {
  /* ---------------- Columns Engine ---------------- */
  const columns = useMemo<MRT_ColumnDef<any>[]>(() => {
    return FINAL_COLUMN_ORDER.filter(
      (key) => columnOrder.includes(key) && !HIDDEN_COLUMNS.has(key)
    ).map((key, index) => {
      const headerText = HEADER_LABELS[key] ?? key;

      return {
        accessorKey: key,
        header: headerText, //  CRITICAL FIX: Set header label text properties context explicitly
        size: index === 0 ? 250 : 160,
        minSize: 100,

        //  FIXED HEADER CALL: Dynamically parsing 10-word clipping loops safely
        Header: ({ column }) => {
          const text = column.columnDef.header ?? "";
          const words = text.split(/\s+/);
          const isLong = words.length > 10;
          const displayTitle = isLong ? words.slice(0, 10).join(" ") + "..." : text;
          
          return (
            <span title={text} style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {displayTitle}
            </span>
          );
        },
      };
    });
  }, [columnOrder]);

  /* ---------------- Pagination State ---------------- */
  const [pagination, setPagination] = useState<MRT_PaginationState>({
    pageIndex: 0,
    pageSize: defaultPageSize,
  });

  return (
    <Box
      id={tableId}
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#ffffff",
      }}
    >
      <MaterialReactTable
        columns={columns}
        data={dataObjects}

        /* ================= TREE HIERARCHY FEATURES ================= */
        enableExpanding
        enableExpandAll={false}
        getSubRows={(row) => row._children ?? []}
        positionExpandColumn="first"
        enableColumnPinning

        /* ================= TABLE LOCAL STATES ================= */
        state={{ pagination }}
        onPaginationChange={setPagination}

        initialState={{
          pagination: { pageIndex: 0, pageSize: defaultPageSize },
          density: "compact", 
          expanded: {},
        }}

        /* ================= SYSTEM ARCHITECTURE MODE ================= */
        layoutMode="grid"
        enableColumnResizing
        columnResizeMode="onEnd"
        enableStickyHeader
        enableColumnOrdering
        enableHiding
        enableGrouping

        muiTableBodyProps={{
          sx: {
            tableLayout: "fixed",
          },
        }}

        /* ================= RESPONSIVE VIEWPORT CONSTRAINTS ================= */
        muiTableContainerProps={{
          sx: {
            width: "100%",
            maxWidth: "100%",
            height: "100%",
            overflowY: "auto",
            overflowX: "auto",
            position: "relative",
            scrollbarWidth: "thin",
            scrollbarColor: "#cbd5e1 transparent",
            "&::-webkit-scrollbar": { width: "8px", height: "8px" },
            "&::-webkit-scrollbar-track": { background: "transparent" },
            "&::-webkit-scrollbar-thumb": {
              background: "#cbd5e1",
              borderRadius: "4px",
              "&:hover": { background: "#94a3b8" },
            },
          },
        }}

        muiTablePaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            border: "none",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            width: "100%"
          },
        }}

        defaultColumn={{
          filterFn: "equals",
        }}

        /* ================= UNIFIED ONE-LINE SYSTEM HEADER ================= */
        muiTableHeadCellProps={{
          sx: {
            backgroundColor: '#354a6b', 
            color: 'white',
            py: 0.75,
            px: 1.2,
            fontSize: '0.72rem',
            fontWeight: 600,
            borderBottom: 'none',
            whiteSpace: "nowrap",
            textAlign: "left",
            cursor: "pointer",

            "& .MuiTableHeadCell-SortLabel-Icon, & .MuiTableHeadCell-Content-Actions .MuiTableHeadCell-SortLabel-Icon, & .MuiIconButton-root:has(.MuiTableHeadCell-SortLabel-Icon)": {
              display: "none !important",
            },

            "& .MuiTableHeadCell-Content-Actions .MuiSvgIcon-root, & .MuiIconButton-root": {
              color: "#ffffff !important",
              display: "inline-flex !important",
            },
            
            "& .Mui-TableHeadCell-Content": {
              justifyContent: "flex-start",
              alignItems: "center",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              width: "100%"
            },
            "& .Mui-TableHeadCell-Content-Labels": {
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              padding: 0,
              margin: 0
            }
          },
        }}

        /* ================= COMPACT ZEBRA ROWS & ELLIPSIS ================= */
        muiTableBodyCellProps={{
          sx: {
            py: 0.4,
            px: 1.2,
            fontSize: "0.68rem",
            borderRight: "none",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            color: "#334155",
          },
        }}

        muiTableBodyRowProps={({ row }) => ({
          sx: {
            backgroundColor: row.index % 2 === 0 ? "#ffffff" : "#f8fafc",
            "&:hover": {
              backgroundColor: "#f1f5f9 !important",
            },
            "& td": { borderBottom: "1px solid #e2e8f0" }
          },
        })}

        /* ================= EXPANSION PLUGS ================= */
        muiExpandButtonProps={({ row }) => ({
          disabled: !row.original._children?.length,
          sx: {
            color: "#475569",
            padding: "2px",
            "&:hover": {
              backgroundColor: "#f1f5f9",
            },
          },
        })}

        muiTopToolbarProps={{
          sx: {
            color: '#1e293b !important', backgroundColor: '#ffffff', minHeight: '48px !important', py: 0, px: '8px', flexShrink: 0,
            '& .MuiToolbar-root': { minHeight: '48px !important', height: '48px', px: '4px', display: 'flex', flexDirection: 'row', alignItems: 'center', flexWrap: 'nowrap', overflow: 'hidden' },
            '& .MuiTextField-root': { margin: 0, width: '100%', '& .MuiInputBase-root': { fontSize: '0.75rem', height: '32px', padding: '0 10px', backgroundColor: '#f1f5f9', borderRadius: '6px', '& fieldset': { border: 'none' } } },
          },
        }}

        muiBottomToolbarProps={{
          sx: {
            p: 0, m: 0, minHeight: '36px', height: '36px', flexShrink: 0, backgroundColor: '#ffffff',
            '& .MuiToolbar-root': { minHeight: '36px !important', height: '36px' },
            '& .MuiTablePagination-root': { margin: 0, padding: 0, minHeight: '36px' },
            '& .MuiInputBase-root': { height: '28px', fontSize: '0.7rem' },
          },
        }}

        muiPaginationProps={{
          variant: "text",
          shape: "rounded",
          size: "small",
          rowsPerPageOptions: [10, 25, 50, 100, 200] //  CRITICAL FIX: Restored '25' option parameters mapping
        }}

        enableTopToolbar
        enableBottomToolbar
      />
    </Box>
  );
};

export default TreeTable;