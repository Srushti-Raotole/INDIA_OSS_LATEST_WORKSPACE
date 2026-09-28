import React, { useMemo, useState, useEffect } from "react";
import { Box, Avatar, Stack, Typography } from "@mui/material";
import { MaterialReactTable, MRT_ColumnDef } from "material-react-table";

import lightstormLogo from "../../../../assets/lightstormlogo.png";
import vegayanLogo from "../../../../assets/logo_vega.png";

export interface NotificationUserRow {
  id: number;
  userName: string;
  email: string;
  organization: string;
}

const COLUMNS = [
  { key: "userName", label: "Username", align: "left", size: 260 },
  { key: "email", label: "Email", align: "left", size: 300 },
  { key: "organization", label: "Organization", align: "center", size: 220 },
] as const;

interface Props {
  dataObjects: NotificationUserRow[];
  tableId: string;
  selectedUserId?: number | null;
  onSelectionChange?: (user: NotificationUserRow | null) => void;
}

const LOCALSTORAGE_PREFIX = "visible_columns_map_";

const NotificationTable: React.FC<Props> = ({
  dataObjects,
  tableId,
  selectedUserId,
  onSelectionChange,
}) => {
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  /* ================= COLUMNS CONFIGURATION ================= */
  const columns = useMemo<MRT_ColumnDef<NotificationUserRow>[]>(
    () =>
      COLUMNS.map((col) => ({
        accessorKey: col.key,
        header: col.label,
        size: col.size,
        minSize: 120,
        muiTableHeadCellProps: { align: "left" },

        Header: ({ column }) => {
          const titleText = column.columnDef.header ?? "";
          return (
            <span title={titleText} style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {titleText}
            </span>
          );
        },

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
            textAlign: col.align
          }
        },

        Cell: ({ cell }) => {
          const value = cell.getValue<any>();

          if (col.key === "organization") {
            const logo =
              String(value).toUpperCase() === "VEGAYAN"
                ? vegayanLogo
                : String(value).toUpperCase() === "LIGHTSTORM"
                  ? lightstormLogo
                  : undefined;

            return (
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                {logo && <Avatar src={logo} sx={{ width: 16, height: 16 }} />}
                <Typography sx={{ fontSize: "0.68rem", fontWeight: 700, color: "#475569" }}>
                  {value ?? "-"}
                </Typography>
              </Stack>
            );
          }

          return value ?? "-";
        },
      })),
    []
  );

  /* ================= RECOVER LOCAL STORAGE MAPS ================= */
  const buildAllVisible = () =>
    COLUMNS.reduce((acc, col) => {
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
        data={dataObjects}
        enableColumnPinning

        /* =================  FIXED: RESIZING HOOK ENGINES ACTIVATED ================= */
        layoutMode="grid"
        enableColumnResizing={true}    //  Turns on column edge grabbing
        columnResizeMode="onEnd"        //  Refreshes width calculations upon pointer drop
        enableStickyHeader
        enablePagination
        enableColumnOrdering
        enableHiding
        enableGrouping
        enableRowSelection
        enableMultiRowSelection={false}

        initialState={{
          pagination: { pageIndex: 0, pageSize: 25 },
          density: "compact",
        }}

        state={{ columnVisibility, rowSelection }}
        onColumnVisibilityChange={setColumnVisibility}

        onRowSelectionChange={(updater) => {
          const next = typeof updater === "function" ? updater(rowSelection) : updater;
          setRowSelection(next);
          const key = Object.keys(next)[0];
          onSelectionChange?.(key ? dataObjects[Number(key)] : null);
        }}

        muiTableBodyProps={{ sx: { tableLayout: "fixed" } }}

        /* CONTAINER SCROLL MECHANICS CALCULATIONS */
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

        /* THEMED HEADER CELLS */
        muiTableHeadCellProps={{
          sx: {
            backgroundColor: "#354a6b", color: "#ffffff", py: 0.75, px: 1.2, fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "none", whiteSpace: "nowrap", textAlign: "left", cursor: "pointer", 
            "& .MuiTableHeadCell-SortLabel-Icon, & .MuiTableHeadCell-Content-Actions .MuiTableHeadCell-SortLabel-Icon, & .MuiIconButton-root:has(.MuiTableHeadCell-SortLabel-Icon)": { display: "none !important" },
            "& .MuiTableHeadCell-Content-Actions .MuiSvgIcon-root, & .MuiIconButton-root": { color: "#ffffff !important", display: "inline-flex !important" },
            "& .Mui-TableHeadCell-Content": { justifyContent: "flex-start", alignItems: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" },
            "& .Mui-TableHeadCell-Content-Labels": { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", padding: 0, margin: 0 }
          },
        }}

        muiTableBodyRowProps={({ row }) => {
          const isSelected = row.original.id === selectedUserId;
          return {
            sx: {
              cursor: "pointer",
              backgroundColor: isSelected ? "rgba(53, 74, 107, 0.08)" : row.index % 2 === 0 ? "#ffffff" : "#f8fafc",
              "&:hover": { backgroundColor: isSelected ? "rgba(53, 74, 107, 0.14)" : "#f1f5f9 !important" },
              "& td": { borderBottom: "1px solid #e2e8f0" }
            },
          };
        }}

        /* TOOLBAR FORMATTING FOOTPRINTS */
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

export default NotificationTable;