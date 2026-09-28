import React, { useMemo, useState, useEffect } from "react";
import axiosClient from "@/api/axiosClient";
import { FETCH_DISCOVERY_NE_LIST } from "@/api/apis";
import {
  Box,
  Chip,
  Typography,
  IconButton,
  Tooltip,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import { MaterialReactTable, MRT_ColumnDef } from "material-react-table";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

/* ================= API ROW TYPE ================= */
export interface DiscoveryRecordApiRow {
  Adapter: string;
  Discovery_type: string;
  Discovery_subtype: string;
  Discovery_date: string;
  Starttime: string;
  Endtime: string | null;
  Status: string;
  Remark: string | null;
}

/* ================= NORMALIZED TABLE ROW ================= */
interface DiscoveryRecordTableRow {
  adapter: string;
  type: string;
  subType: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  remark: string;
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

/* ================= DISCOVERY TYPE STYLE ================= */
const DISCOVERY_TYPE_STYLE: Record<string, { bg: string; color: string }> = {
  Automatic: { bg: "#dbeafe", color: "#1e40af" },
  OnDemand: { bg: "#ede9fe", color: "#5b21b6" },
  NA: { bg: "#f1f5f9", color: "#475569" },
};

/* ================= STATUS STYLE ================= */
const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  Success: { bg: "#dcfce7", color: "#166534" },
  Failed: { bg: "#fee2e2", color: "#991b1b" },
  NA: { bg: "#f1f5f9", color: "#475569" },
};

/* ================= COLUMN CONFIG ================= */
const DISCOVERY_RECORD_COLUMNS = [
  { key: "adapter", label: "Adapter", align: "center", size: 50 },
  { key: "type", label: "Discovery Type", align: "center", size: 50 },
  { key: "subType", label: "Sub Type", align: "center", size: 50 },
  { key: "date", label: "Discovery Date", align: "center", size: 50 },
  { key: "startTime", label: "Start Time", align: "center", size: 50 },
  { key: "endTime", label: "End Time", align: "center", size: 50 },
  { key: "status", label: "Status", align: "center", size: 50 },
  { key: "remark", label: "Remark", align: "left", size: 50 },

  /*  ONLY ADDITION */
  { key: "download", label: "Download", align: "center", size: 40 },
] as const;

/* ================= PROPS ================= */
interface Props {
  dataObjects: DiscoveryRecordApiRow[];
  pageSize?: number;
  tableId: string;
}

const LOCALSTORAGE_PREFIX = "visible_columns_map_";

/* ================= COMPONENT ================= */
const DiscoveryRecordsTable: React.FC<Props> = ({
  dataObjects,
  pageSize = 25,
  tableId,
}) => {
  if (!dataObjects || dataObjects.length === 0) return null;

  /* ================= NORMALIZE DATA ================= */
  const tableData = useMemo<DiscoveryRecordTableRow[]>(
    () =>
      dataObjects.map((row) => ({
        adapter: row.Adapter,
        type: row.Discovery_type,
        subType: row.Discovery_subtype,
        date: row.Discovery_date,
        startTime: row.Starttime,
        endTime: row.Endtime ?? "-",
        status: row.Status,
        remark: row.Remark ?? "-",
      })),
    [dataObjects]
  );

  /* ================= EXCEL DOWNLOAD (CUSTOM) ================= */
  const downloadNEExcel = async (batch: string, adapter: string) => {
    try {
      const res = await axiosClient.get(FETCH_DISCOVERY_NE_LIST, {
        params: { batch, adapter },
      });

      const json = res.data;
      if (!Array.isArray(json) || json.length === 0) {
        alert("No data available");
        return;
      }

      const ws = XLSX.utils.json_to_sheet(json);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "NE_LIST");

      const buffer = XLSX.write(wb, {
        bookType: "xlsx",
        type: "array",
      });

      saveAs(
        new Blob([buffer], { type: "application/octet-stream" }),
        `NE_LIST_${adapter}_${batch.replace(/[: ]/g, "_")}.xlsx`
      );
    } catch (e) {
      console.error(e);
      alert("Excel download failed");
    }
  };

  /* ================= COLUMNS ================= */
  const columns = useMemo<MRT_ColumnDef<DiscoveryRecordTableRow>[]>(
    () =>
      DISCOVERY_RECORD_COLUMNS.map((col) => ({
        accessorKey: col.key,
        header: col.label,
        size: col.size,
        muiTableHeadCellProps: { align: "left" },
        muiTableBodyCellProps: { align: col.align },

        Cell: ({ cell, row }) => {
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

          if (col.key === "type") {
            const s =
              DISCOVERY_TYPE_STYLE[value] ??
              DISCOVERY_TYPE_STYLE.NA;

            return (
              <Chip
                label={value}
                size="small"
                sx={{
                  fontWeight: 700,
                  backgroundColor: s.bg,
                  color: s.color,
                }}
              />
            );
          }

          if (col.key === "status") {
            const s =
              STATUS_STYLE[value] ?? STATUS_STYLE.NA;

            return (
              <Chip
                label={value}
                size="small"
                sx={{
                  fontWeight: 700,
                  backgroundColor: s.bg,
                  color: s.color,
                }}
              />
            );
          }

          if (col.key === "remark") {
            return (
              <Typography fontSize="0.72rem" noWrap title={value}>
                {value}
              </Typography>
            );
          }

          /*  DOWNLOAD CELL (NO CSS CHANGE) */
          if (col.key === "download") {
            return (
              <Tooltip title="Download Excel">
                <span>
                  <IconButton
                    size="small"
                    disabled={row.original.status !== "Success"}
                    onClick={() =>
                      downloadNEExcel(
                        row.original.startTime,
                        row.original.adapter
                      )
                    }
                  >
                    <DownloadIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            );
          }

          return value || "-";
        },
      })),
    []
  );

  /* ================= COLUMN VISIBILITY ================= */
  const buildAllVisible = () =>
    DISCOVERY_RECORD_COLUMNS.reduce((acc, col) => {
      acc[col.key] = true;
      return acc;
    }, {} as Record<string, boolean>);

  const loadVisibilityMap = () => {
    try {
      const raw = localStorage.getItem(
        `${LOCALSTORAGE_PREFIX}${tableId}`
      );
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

  /* ================= RENDER ================= */
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
        layoutMode="grid"
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
              id: "endTime",
              desc: true, // newest first
            },
          ],
        }}
          defaultColumn={{
          filterFn: "equals",
        }}
        state={{ columnVisibility }}
        onColumnVisibilityChange={setColumnVisibility}
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
            "&::-webkit-scrollbar": { width: "12px", height: "12px" },
            "&::-webkit-scrollbar-track": {
              background: "#f1f1f1",
              borderRadius: "6px",
            },
            "&::-webkit-scrollbar-thumb": {
              background: "#94a3b8",
              borderRadius: "6px",
              "&:hover": { background: "#94a3b8" },
            },
            "&::-webkit-scrollbar-corner": {
              background: "#f1f1f1",
            },
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

export default DiscoveryRecordsTable;
