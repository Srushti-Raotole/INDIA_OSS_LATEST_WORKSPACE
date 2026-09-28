import React, { useMemo, useState, useEffect } from "react";
import { Box } from "@mui/material";
import { MaterialReactTable, MRT_ColumnDef } from "material-react-table";
import ErrorState from "../../../../common/ErrorState";

/* ================= COLUMN CONFIG ================= */
const ADMIN_TICKETING_COLUMNS = [
    { key: "adapter", label: "Adapter", align: "center", size: 120 },
    { key: "family", label: "Family", align: "center", size: 140 },
    {
        key: "alarm",
        label: "Alarm Name",
        align: "left",
        grow: true,
        minSize: 230,
        maxSize: 800,
    },
    { key: "treated", label: "Treated", align: "center", size: 150 },
    { key: "persistence", label: "Persistence (sec)", align: "center", size: 200 },
    { key: "shortPeriod", label: "Short Period", align: "center", size: 200 },
    { key: "shortRepetition", label: "Short Repetition", align: "center", size: 200 },
] as const;

interface Props {
    tableId: string;
    pageSize?: number;
    data: any[]; 
}

const LOCALSTORAGE_PREFIX = "visible_columns_map_";

/* ---------- System Theme Adapter Badge Renderer ---------- */
const AdapterBadge = (raw?: string) => {
  const val = (raw ?? '').trim().toUpperCase();
  const bg =
    val === 'MCP' ? '#009688 !important' :
    val === 'NFMT' ? '#8283eb !important' :
    val === 'EPNM' ? '#4CAF50 !important' :
    val === 'CONC' ? '#FF9800 !important' :
    val === 'ADVA' ? '#9C27B0 !important' :
    val === 'IFNR' ? '#3F51B5 !important' :
    val === 'TLMR' ? '#E91E63 !important' : '#607D8B';
    
  return (
    <Box sx={{
      px: 3, py: 0.1, lineHeight: 1.4, bgcolor: bg, color: '#fff',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: '10px', fontSize: '0.68rem', fontWeight: 700,
      minWidth: 64, textTransform: 'uppercase',
    }}>{val || 'NA'}</Box>
  );
};

const AutoTTTable: React.FC<Props> = ({
    tableId,
    pageSize = 25,
    data,
}) => {
    const [columnVisibility, setColumnVisibility] =
        useState<Record<string, boolean>>(() => {
            try {
                const raw = localStorage.getItem(`${LOCALSTORAGE_PREFIX}${tableId}`);
                return raw
                    ? JSON.parse(raw)
                    : ADMIN_TICKETING_COLUMNS.reduce((acc, col) => {
                        acc[col.key] = true;
                        return acc;
                    }, {} as Record<string, boolean>);
            } catch {
                return {};
            }
        });

    useEffect(() => {
        localStorage.setItem(
            `${LOCALSTORAGE_PREFIX}${tableId}`,
            JSON.stringify(columnVisibility)
        );
    }, [columnVisibility, tableId]);

    const columns = useMemo<MRT_ColumnDef<any>[]>(
        () =>
            ADMIN_TICKETING_COLUMNS.map((col: any) => {
                const base: MRT_ColumnDef<any> = {
                    accessorKey: col.key,
                    header: col.label,
                    size: col.size,
                    grow: col.grow,
                    minSize: col.minSize ?? 60,
                    maxSize: col.maxSize ?? 400,
                    muiTableHeadCellProps: { align: "left" },
                    muiTableBodyCellProps: { align: col.align },
                };

                // Inject custom adapter layout badges natively into columns map pipeline
                if (col.key === "adapter") {
                    base.Cell = ({ cell }) => (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                            {AdapterBadge(cell.getValue<string>())}
                        </Box>
                    );
                    base.muiTableBodyCellProps = { align: 'center' as const };
                }

                return base;
            }),
        []
    );

    if (!data || data.length === 0) {
        return (
            <ErrorState
                title="No Data"
                message="No alarm configuration found"
                severity="info"
            />
        );
    }

    return (
        <Box sx={{ width: "100%", height: "100%" }}>
            <MaterialReactTable
                columns={columns}
                data={data}
                state={{ columnVisibility }}
                onColumnVisibilityChange={setColumnVisibility}
                enableStickyHeader
                enablePagination
                enableColumnOrdering
                enableHiding
                enableGrouping
                enableEditing={false} // Guarantees row edit option is disabled
                initialState={{
                    pagination: { pageIndex: 0, pageSize },
                    density: "compact",
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
                muiTableBodyRowProps={({ row }) => ({
                    sx: {
                        cursor: "pointer",
                        backgroundColor:
                            row.index % 2 === 0 ? "#ffffff" : "#f8fafc",
                        "&:hover": { backgroundColor: "#bfdbfe !important" },
                    },
                })}
                muiTableContainerProps={{
                    sx: {
                        width: '100%',
                        maxWidth: '100%',
                        maxHeight: '60vh',
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
                enableTopToolbar
                enableBottomToolbar
            />
        </Box>
    );
};

export default AutoTTTable;