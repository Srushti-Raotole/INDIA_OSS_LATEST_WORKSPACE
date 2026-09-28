import React, { useMemo } from "react";
import { MaterialReactTable } from "material-react-table";
import type { MRT_ColumnDef } from "material-react-table";
import { Box } from "@mui/material";

type TreeTableProps = {
    dataObjects: Record<string, any>[];
    columnOrder: string[];
    pageSize?: number;
    tableId?: string;
    onRowClick?: (row: Record<string, any>) => void;
};

const TreeTable: React.FC<TreeTableProps> = ({
    dataObjects,
    columnOrder,
    pageSize = 25,
    tableId,
    onRowClick,
}) => {
    const columns = useMemo<MRT_ColumnDef<any>[]>(() => {
        return columnOrder.map((key) => ({
            accessorKey: key,
            header: key,
            size: 160,
        }));
    }, [columnOrder]);

    return (
        <Box id={tableId}>
            <MaterialReactTable
                columns={columns}
                data={dataObjects}

                /* ========= TREE ========= */
                enableExpanding
                enableExpandAll={false}
                getSubRows={(row) => row._children ?? []}
                positionExpandColumn="first"

                /* Expand on row click */
                muiTableBodyRowProps={({ row }) => ({
                    onClick: () => {
                        row.toggleExpanded();
                        onRowClick?.(row.original);
                    },
                    sx: {
                        cursor: "pointer",
                        "&:hover": { backgroundColor: "#f7f7f7" },
                    },
                })}

                /* ========= TABLE ========= */
                enableColumnOrdering
                enableColumnResizing
                enableStickyHeader
                enablePagination
                enableDensityToggle={false}
                enableFullScreenToggle={false}

                initialState={{
                    // pagination: { pageSize },
                    expanded: {},           
                    density: "compact",
                }}


                /* ========= STYLES ========= */
                muiTablePaperProps={{
                    elevation: 0,
                    sx: {
                        border: "1px solid #e0e0e0",
                        borderRadius: "6px",
                    },
                }}

                muiTableHeadCellProps={{
                    sx: {
                        fontWeight: 700,
                        fontSize: "0.85rem",
                        backgroundColor: "#334155",
                        borderBottom: "2px solid #e0e0e0",
                    },
                }}

                muiTableBodyCellProps={{
                    sx: {
                        fontSize: "0.8rem",
                        borderRight: "1px solid #eee",
                    },
                }}

                muiExpandButtonProps={{
                    size: "small",
                    sx: { color: "#374151" },
                }}

                renderEmptyRowsFallback={() => (
                    <Box sx={{ p: 2, textAlign: "center", color: "#6b7280" }}>
                        No data available
                    </Box>
                )}
            />
        </Box>
    );
};

export default TreeTable;
