import React, { useMemo, useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import { MaterialReactTable, MRT_ColumnDef } from "material-react-table";

/* ================= API ROW TYPE ================= */
export interface ReconciliationApiRow {
  adapter: string;
  start_time: string;
  end_time: string;
  status: string;
  username: string;
}

/* ================= NORMALIZED TABLE ROW ================= */
interface ReconciliationTableRow {
  adapter: string;
  username: string;
  startTime: string;
  endTime: string;
  timeTaken: string;
  status: string;
}

const getAdapterColor = (val: string) =>
  val === "MCP" ? "#009688" :
  val === "NFMT" ? "#8283eb" :
  val === "EPNM" ? "#4caf50" :
  val === "CONC" ? "#ff9800" :
  val === "ADVA" ? "#9c27b0" :
  val === "IFNR" ? "#3f51b5" :
  val === "TLMR" ? "#e91e63" : "#607d8b";

const getStatusStyle = (val: string) => {
  const key = val.toLowerCase();
  if (key === "success") return { bg: "#e6f4ea", color: "#166534" };
  if (key === "failed") return { bg: "#fdecea", color: "#991b1b" };
  return { bg: "#f1f5f9", color: "#475569" };
};

const getTimeTaken = (start: string, end: string) => {
  if (!start || !end) return "-";
  const startDate = new Date(start.replace(" ", "T"));
  const endDate = new Date(end.replace(" ", "T"));
  const diffMs = endDate.getTime() - startDate.getTime();
  if (diffMs < 0) return "-";

  const totalSeconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return minutes === 0 ? `${seconds}s` : `${minutes}m ${seconds}s`;
};

const RECONCILIATION_COLUMNS = [
  { key: "adapter", label: "Adapter", align: "left", size: 120 },
  { key: "username", label: "User Principal", align: "left", size: 130 },
  { key: "startTime", label: "Start Time", align: "left", size: 160 },
  { key: "endTime", label: "End Time", align: "left", size: 160 },
  { key: "timeTaken", label: "Duration", align: "left", size: 110 },
  { key: "status", label: "Status State", align: "left", size: 120 },
] as const;

interface Props {
  dataObjects: ReconciliationApiRow[];
  pageSize?: number;
  tableId: string;
}

const LOCALSTORAGE_PREFIX = "visible_columns_map_";

/* ================= COMPONENT ================= */
const ReconciliationTable: React.FC<Props> = ({
  dataObjects,
  pageSize = 25,
  tableId,
}) => {
  if (!dataObjects || dataObjects.length === 0) return null;

  const tableData = useMemo<ReconciliationTableRow[]>(
    () =>
      dataObjects.map((row) => ({
        adapter: row.adapter ?? "NA",
        username: row.username ?? "NA",
        startTime: row.start_time ?? "-",
        endTime: row.end_time ?? "-",
        timeTaken: getTimeTaken(row.start_time, row.end_time),
        status: row.status ?? "NA",
      })),
    [dataObjects]
  );

  const columns = useMemo<MRT_ColumnDef<ReconciliationTableRow>[]>(
    () =>
      RECONCILIATION_COLUMNS.map((col) => ({
        accessorKey: col.key,
        header: col.label,
        size: col.size,
        
        Header: ({ column }) => (
          <span style={{ whiteSpace: "nowrap" }}>
            {column.columnDef.header}
          </span>
        ),

        Cell: ({ cell }) => {
          const value = cell.getValue<string>();

          if (col.key === "adapter") {
            return (
              <Typography
                sx={{
                  fontSize: "0.68rem", fontWeight: 700, color: "#ffffff", backgroundColor: getAdapterColor(value),
                  px: 1.2, py: 0.2, borderRadius: "5px", display: "inline-block", minWidth: 55, textAlign: "center"
                }}
              >
                {value}
              </Typography>
            );
          }

          if (col.key === "status") {
            const { bg, color } = getStatusStyle(value);
            return (
              <Typography
                sx={{
                  fontSize: "0.65rem", fontWeight: 700, color, backgroundColor: bg, px: 1.2, py: 0.2, borderRadius: "5px",
                  display: "inline-block", minWidth: 70, textAlign: "center", textTransform: "uppercase"
                }}
              >
                {value}
              </Typography>
            );
          }

          if (col.key === "timeTaken") {
            return <span style={{ fontFamily: "monospace", fontWeight: 600 }}>{value}</span>;
          }

          return <span style={{ color: "#334155", fontWeight: 500 }}>{value || "-"}</span>;
        },
      })),
    []
  );

  const buildAllVisible = () =>
    RECONCILIATION_COLUMNS.reduce((acc, col) => {
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
        data={tableData}
        layoutMode="grid"
        enableColumnResizing
        columnResizeMode="onEnd"
        enableStickyHeader
        enablePagination
        enableColumnOrdering
        enableHiding

        initialState={{
          pagination: { pageIndex: 0, pageSize },
          density: "compact",
          sorting: [{ id: "endTime", desc: true }],
        }}
        
        state={{ columnVisibility }}
        onColumnVisibilityChange={setColumnVisibility}

        muiTableBodyProps={{ sx: { tableLayout: "fixed" } }}

        muiTableContainerProps={{
          sx: {
            width: "100%", maxWidth: "100%", height: "100%", maxHeight: "55vh", overflowY: "auto", overflowX: "auto", position: "relative",
            scrollbarWidth: "thin", scrollbarColor: "#cbd5e1 transparent",
            "&::-webkit-scrollbar": { width: "6px", height: "6px" },
            "&::-webkit-scrollbar-thumb": { background: "#cbd5e1", borderRadius: "3px" },
          },
        }}

        muiTableHeadCellProps={{
          sx: {
            backgroundColor: "#354a6b", color: "#ffffff", py: 0.75, px: 1.5, fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", borderBottom: "none", whiteSpace: "nowrap", textAlign: "left", cursor: "pointer",
            "& .MuiTableHeadCell-SortLabel-Icon, & .MuiTableHeadCell-Content-Actions .MuiTableHeadCell-SortLabel-Icon, & .MuiIconButton-root:has(.MuiTableHeadCell-SortLabel-Icon)": { display: "none !important" },
            "& .MuiTableHeadCell-Content-Actions .MuiSvgIcon-root, & .MuiIconButton-root": { color: "#ffffff !important", display: "inline-flex !important" },
            "& .Mui-TableHeadCell-Content": { justifyContent: "flex-start", alignItems: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" },
          },
        }}

        muiTableBodyCellProps={{
          sx: { py: 0.8, px: 1.5, fontSize: "0.72rem", borderBottom: "1px solid #f1f5f9" }, //  ROW CELL PADDING GAP EQUALIZATION
        }}

        muiTableBodyRowProps={({ row }) => ({
          sx: { backgroundColor: row.index % 2 === 0 ? "#ffffff" : "#f8fafc", "&:hover": { backgroundColor: "#f1f5f9 !important" } },
        })}

        muiTopToolbarProps={{
          sx: {
            backgroundColor: "#ffffff", p: 1, flexShrink: 0, borderBottom: "1px solid #e2e8f0",
            "& .MuiToolbar-root": { minHeight: "48px !important", display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 2, px: 1 },
          },
        }}

        muiBottomToolbarProps={{
          sx: {
            p: 0, m: 0, minHeight: "36px", flexShrink: 0, backgroundColor: "#ffffff", borderTop: "1px solid #e2e8f0",
            "& .MuiToolbar-root": { minHeight: "36px !important", height: "36px" },
            "& .MuiTablePagination-root": { margin: 0, padding: 0 },
            "& .MuiInputBase-root": { height: "26px", fontSize: "0.68rem" },
          },
        }}

        muiPaginationProps={{
          variant: "text", shape: "rounded", size: "small",
          rowsPerPageOptions: [10, 20, 50, 100]
        }}
      />
    </Box>
  );
};

export default ReconciliationTable;