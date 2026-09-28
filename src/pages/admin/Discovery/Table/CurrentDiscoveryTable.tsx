import React, { useMemo, useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import { MaterialReactTable, MRT_ColumnDef } from "material-react-table";

/* ================= API ROW TYPE ================= */
export interface CurrentDiscoveryApiRow {
  Adapter: string;
  Discovery_type: string;
  Discovery_subtype: string;
  Discovery_time: string;
  Setting_time: string;
}

/* ================= NORMALIZED TABLE ROW ================= */
interface CurrentDiscoveryTableRow {
  adapter: string;
  type: string;
  subType: string;
  discoveryTime: string;
  settingTime: string;
}

/* ================= ADAPTER COLOR ================= */
const getAdapterColor = (val: string) =>
  val === "MCP" ? "#009688" :
    val === "NFMT" ? "#8283eb" :
      val === "EPNM" ? "#4CAF50" :
        val === "CONC" ? "#FF9800" :
          val === "ADVA" ? "#9C27B0" :
            val === "IFNR" ? "#3F51B5" :
              val === "TLMR" ? "#E91E63" :
                "#607D8B";

/* ================= COLUMN CONFIG ================= */
const CURRENT_DISCOVERY_COLUMNS = [
  { key: "adapter", label: "Adapter", align: "center", size: 160 },
  { key: "type", label: "Discovery Type", align: "center", size: 200 },
  { key: "subType", label: "Sub Type", align: "center", size: 160 },
  { key: "discoveryTime", label: "Discovery Time", align: "center", size: 240 },
  { key: "settingTime", label: "Setting Time", align: "center", size: 240 },
] as const;

/* ================= PROPS ================= */
interface Props {
  dataObjects: CurrentDiscoveryApiRow[];
  pageSize?: number;
  tableId: string;
}

const LOCALSTORAGE_PREFIX = "visible_columns_map_";

/* ================= COMPONENT ================= */
const CurrentDiscoveryTable: React.FC<Props> = ({
  dataObjects,
  pageSize = 25,
  tableId,
}) => {
  if (!dataObjects || dataObjects.length === 0) return null;

  /* ================= NORMALIZE DATA ================= */
  const tableData = useMemo<CurrentDiscoveryTableRow[]>(
    () =>
      dataObjects.map((row) => ({
        adapter: row.Adapter,
        type: row.Discovery_type,
        subType: row.Discovery_subtype,
        discoveryTime: row.Discovery_time,
        settingTime: row.Setting_time,
      })),
    [dataObjects]
  );

  /* ================= COLUMNS ================= */
  const columns = useMemo<MRT_ColumnDef<CurrentDiscoveryTableRow>[]>(
    () =>
      CURRENT_DISCOVERY_COLUMNS.map((col) => ({
        accessorKey: col.key,
        header: col.label,
        size: col.size,
        muiTableHeadCellProps: { align: "center" },
        muiTableBodyCellProps: { align: col.align },

        Cell: ({ cell }) => {
          const value = cell.getValue<string>();

          if (col.key === "adapter") {
            return (
              <Typography
                sx={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: "#ffffff",
                  backgroundColor: getAdapterColor(value),
                  px: 1,
                  py: 0.3,
                  borderRadius: "6px",
                  display: "inline-block",
                  minWidth: 60,
                  textAlign: "center",
                }}
              >
                {value}
              </Typography>
            );
          }

          return value || "-";
        },
      })),
    []
  );

  /* ================= COLUMN VISIBILITY ================= */
  const buildAllVisible = () =>
    CURRENT_DISCOVERY_COLUMNS.reduce((acc, col) => {
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
        data={tableData}

        // enableColumnResizing
        columnResizeMode="onChange"
        enableStickyHeader
        enablePagination
        enableColumnOrdering
        enableHiding

        // initialState={{
        //   pagination: { pageIndex: 0, pageSize },
        //   density: "compact",
        // }}
        initialState={{
          pagination: { pageIndex: 0, pageSize },
          density: "compact",
          sorting: [
            {
              id: "discoveryTime",
              desc: true, // newest first
            },
          ],
        }}

        state={{ columnVisibility }}
        onColumnVisibilityChange={setColumnVisibility}

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
        defaultColumn={{
          filterFn: "equals",
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
            borderRight: "1px solid rgba(255,255,255,0.15)",
            "& .MuiSvgIcon-root": {
              color: "#e5e7eb !important",
            },
          },
        }}

        muiTableBodyCellProps={{
          sx: {
            py: 0.4,
            px: 1.2,
            fontSize: "0.72rem",
            borderRight: "1px solid #e5e7eb",
          },
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

export default CurrentDiscoveryTable;
