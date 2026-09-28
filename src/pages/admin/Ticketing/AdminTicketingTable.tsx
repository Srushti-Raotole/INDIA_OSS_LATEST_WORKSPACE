import React, { useMemo, useState, useEffect } from "react";
import { Box } from "@mui/material";
import { MaterialReactTable, MRT_ColumnDef } from "material-react-table";

/* ================= COLUMN CONFIG ================= */
const ADMIN_TICKETING_COLUMNS = [
  { key: "adapter", label: "Adapter", align: "center", size: 160 },
  { key: "family", label: "Family", align: "center", size: 130 },
  {
    key: "alarm",
    label: "Alarm Name",
    align: "left",
    grow: true,
    minSize: 250,
    maxSize: 350,
  },
  { key: "treated", label: "Treated", align: "center", size: 160 },
  { key: "persistence", label: "Persistence (sec)", align: "center", size: 170 },
  { key: "shortPeriod", label: "Short Period", align: "center", size: 170 },
  { key: "shortRepetition", label: "Short Repetition", align: "center", size: 230 },
] as const;

const normalizeTreated = (val?: string) => {
  if (!val) return "NA";
  const v = val.toUpperCase();
  if (v === "YES") return "Y";
  if (v === "NO") return "N";
  return v;
};

/* ================= ADAPTER BADGE ================= */
const getAdapterColor = (val: string) =>
  val === "MCP" ? "#009688" :
    val === "NFMT" ? "#8283eb" :
      val === "EPNM" ? "#4CAF50" :
        val === "CONC" ? "#FF9800" :
          val === "ADVA" ? "#9C27B0" :
            val === "IFNR" ? "#3F51B5" :
              val === "TLMR" ? "#E91E63" :
                "#607D8B";

const AdapterBadge = ({ value }: { value?: string }) => {
  const val = (value ?? "").trim().toUpperCase();

  return (
    <Box
      sx={{
        px: 1.2,
        py: 0.2,
        lineHeight: 1.6,
        bgcolor: getAdapterColor(val),
        color: "#fff",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "10px",
        fontSize: "0.72rem",
        fontWeight: 700,
        minWidth: 64,
        textTransform: "uppercase",
      }}
    >
      {val || "NA"}
    </Box>
  );
};

/* ================= TREATED COLORS ================= */
const TREATED_COLOR_MAP: Record<string, { bg: string; color: string }> = {
  Y: { bg: "#e6f4ea", color: "#166534" },
  N: { bg: "#fdecea", color: "#991b1b" },
  YES: { bg: "#e6f4ea", color: "#166534" },
  NO: { bg: "#fdecea", color: "#991b1b" },
};

interface Props {
  dataObjects: Record<string, any>[];
  pageSize?: number;
  onRowClick?: (row: Record<string, any>) => void;
  onRowSelect?: (row: Record<string, any> | null) => void;
  tableId: string;
}

const LOCALSTORAGE_PREFIX = "visible_columns_map_";

/* ================= COMPONENT ================= */
const AdminTicketingTable: React.FC<Props> = ({
  dataObjects,
  pageSize = 25,
  onRowClick,
  onRowSelect,
  tableId,
}) => {
  if (!dataObjects || dataObjects.length === 0) return null;

  /* ================= COLUMNS ================= */
  const columns = useMemo<MRT_ColumnDef<any>[]>(
    () =>
      ADMIN_TICKETING_COLUMNS.map((col: any) => ({
        accessorKey: col.key,
        header: col.label,
        size: col.size,
        grow: col.grow,
        minSize: col.minSize ?? 60,
        maxSize: col.maxSize ?? 400,
        muiTableHeadCellProps: { align: "left" },
        muiTableBodyCellProps: { align: col.align },

        ...(col.key === "adapter" && {
          Cell: ({ cell }) => (
            <AdapterBadge value={cell.getValue<string>()} />
          ),
        }),
      })),
    []
  );

  /* ================= COLUMN VISIBILITY ================= */
  const buildAllVisible = () =>
    ADMIN_TICKETING_COLUMNS.reduce((acc, col) => {
      acc[col.key] = true;
      return acc;
    }, {} as Record<string, boolean>);

  const loadVisibilityMap = () => {
    try {
      const raw = localStorage.getItem(`${LOCALSTORAGE_PREFIX}${tableId}`);
      return raw ? JSON.parse(raw) : buildAllVisible();
    } catch {
      return buildAllVisible();
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

  /* ================= SINGLE ROW SELECTION ================= */
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!onRowSelect) return;

    const selectedId = Object.keys(rowSelection)[0];
    onRowSelect(selectedId ? dataObjects[Number(selectedId)] : null);
  }, [rowSelection, dataObjects, onRowSelect]);

  return (
    <Box
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

        enableRowSelection
        enableMultiRowSelection={false}
        state={{ columnVisibility, rowSelection }}
        onRowSelectionChange={setRowSelection}
        onColumnVisibilityChange={setColumnVisibility}

        enableColumnResizing
        columnResizeMode="onChange"
        enableStickyHeader
        enablePagination
        enableColumnOrdering
        enableHiding
        enableGrouping

        initialState={{
          pagination: { pageIndex: 0, pageSize },
          density: "compact",
        }}

        muiTableContainerProps={{
          sx: {
            width: '100%',
            maxWidth: '100%',
            maxHeight: '66vh',
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

        muiTablePaperProps={{
          sx: {
            borderRadius: "10px",
            border: "1px solid #e5e7eb",
            boxShadow:
              "0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.06)",
          },
        }}

        muiTableHeadCellProps={{
          sx: {
            py: 0.6,
            px: 1.2,
            fontSize: "0.72rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            backgroundColor: "#334155",
            color: "#f8fafc",
            whiteSpace: "nowrap",
            textAlign: "left",
            borderRight: "1px solid rgba(255,255,255,0.15)",
            "& .MuiSvgIcon-root": {
              color: "#e5e7eb !important",
            },
          },
        }}

        muiTableBodyCellProps={({ cell }) => {
          const treatedRaw = cell.row.original.treated;
          const treated = normalizeTreated(treatedRaw);
          const treatedStyle = TREATED_COLOR_MAP[treated];


          return {
            sx: {
              py: 0.6,
              px: 1.2,
              fontSize: "0.72rem",
              borderRight: "1px solid #e5e7eb",
              textAlign: cell.column.id === "alarm" ? "left" : "center",

              ...(cell.column.id === "alarm" && {
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }),

              ...(cell.column.id === "treated" && treatedStyle && {
                backgroundColor: treatedStyle.bg,
                color: treatedStyle.color,
                fontWeight: 700,
                borderRadius: "6px",
              }),
            },
          };
        }}

        muiTableBodyRowProps={({ row }) => ({
          onClick: () => {
            setRowSelection({ [row.id]: true });
            onRowClick?.(row.original);
          },
          sx: {
            backgroundColor: row.getIsSelected()
              ? "#dbeafe"
              : row.index % 2 === 0
                ? "#ffffff"
                : "#f8fafc",
            "&:hover": {
              backgroundColor: "#bfdbfe",
            },
            cursor: "pointer",
          },
        })}

        muiPaginationProps={{
          variant: "outlined",
          shape: "rounded",
          size: "small",
        }}
        defaultColumn={{
          filterFn: "equals",
        }}
        muiBottomToolbarProps={{
          sx: {
            position: "sticky",
            bottom: 0,
            backgroundColor: "#ffffff",
            borderTop: "1px solid #e5e7eb",
            zIndex: 2,
          },
        }}

        enableTopToolbar
        enableBottomToolbar
      />
    </Box>
  );
};

export default AdminTicketingTable;
