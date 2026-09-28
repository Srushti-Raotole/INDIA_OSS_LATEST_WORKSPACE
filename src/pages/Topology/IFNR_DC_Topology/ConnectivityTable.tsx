import React, { useMemo } from "react";
import { MaterialReactTable, type MRT_ColumnDef, } from "material-react-table";
import { ConnectivityRow } from "./topologyTypes";
 
interface ConnectivityTableProps {
    rows: ConnectivityRow[];
    loading: boolean;
}
const ConnectivityTable: React.FC<ConnectivityTableProps> = ({
    rows,
    loading,
}) => {
    const columns = useMemo<MRT_ColumnDef<ConnectivityRow>[]>(
        () => [
            { accessorKey: "Linkid", header: "Link ID", },
            { accessorKey: "OriNodeName", header: "Source Node", },
            { accessorKey: "OriIfDescr", header: "Source IF Desc", },
            { accessorKey: "TerNodeName", header: "Dest Node", },
            { accessorKey: "TerIfDescr", header: "Dest IF Desc", },
            { accessorKey: "linkname", header: "Link Name", },
        ],
        [],
    );
 
    return (
        <MaterialReactTable
            columns={columns}
            data={rows}
            state={{ isLoading: loading }}
            enableColumnFilters={false}
            enableSorting={false}
            enableColumnActions={false}
            enableDensityToggle={false}
            enableFullScreenToggle={false}
            enableHiding={false}
            enableTopToolbar={false}
            enableBottomToolbar={false}
            muiTablePaperProps={{
                elevation: 0,
                sx: { boxShadow: "none" },
            }}
            muiTableHeadCellProps={{
                sx: {
                    backgroundColor: '#7e7d7dff',
                    fontWeight: 700,
                    color: '#ffffff',
                    fontSize: 12,
                    paddingY: 0.5,
                    whiteSpace: "nowrap",
 
                },
            }}
            muiTableBodyCellProps={{
                sx: {
                    fontSize: 12,
                    paddingY: 0.4,
                    paddingX: 1,
                },
            }}
            // alternate row colour (stripe effect)
            muiTableBodyRowProps={({ row }) => ({
                sx: {
                    backgroundColor:
                        row.index % 2 === 0 ? "#ffffff" : "#f8fafc",
                },
            })}
            muiTableContainerProps={{
                sx: {
                    maxHeight: 500,          // optional: bound inside dialog
                    overflowX: "auto",
                    overflowY: "auto",
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                    "&::-webkit-scrollbar": {
                        display: "none",
                    },
                },
            }}
        />
    );
};
 
export default ConnectivityTable;
 