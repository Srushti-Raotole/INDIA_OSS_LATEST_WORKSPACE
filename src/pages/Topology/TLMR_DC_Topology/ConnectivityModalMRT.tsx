import React, { useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { MaterialReactTable, type MRT_ColumnDef } from "material-react-table";
import type { ConnectivityRow } from "./telemetryTopologyTypes"; //  import same type
 
interface Props {
  open: boolean;
  title: string;
  loading?: boolean;
  rows: ConnectivityRow[];
  onClose: () => void;
}
 
const ConnectivityModalMRT: React.FC<Props> = ({
  open,
  title,
  loading = false,
  rows,
  onClose,
}) => {
  const columns = useMemo<MRT_ColumnDef<ConnectivityRow>[]>(
    () => [
      { accessorKey: "serviceId", header: "Service ID" },
      { accessorKey: "frequency", header: "Frequency" },
      { accessorKey: "lineRate", header: "Line Rate" },
      { accessorKey: "aEndNode", header: "A end Node" },
      { accessorKey: "aEndTrunkPort", header: "A end Trunk PORT" },
      { accessorKey: "aEndClient", header: "A end Client" },
      { accessorKey: "zEndNode", header: "Z end Node" },
      { accessorKey: "zEndTrunkPort", header: "Z end Trunk PORT" },
      { accessorKey: "zEndClient", header: "Z end Client" },
    ],
    [],
  );
 
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center" }}>
        <Typography sx={{ flexGrow: 1, fontSize: 15, fontWeight: 700 }}>
          {title}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
 
      <DialogContent sx={{ pb: 2 }}>
        {loading ? (
          <Typography sx={{ fontSize: 13 }}>Loading…</Typography>
        ) : !rows || rows.length === 0 ? (
          <Typography sx={{ fontSize: 13 }}>No connectivity data.</Typography>
        ) : (
          <Box sx={{ width: "100%" }}>
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
              enablePagination={false}
              muiTablePaperProps={{
                elevation: 0,
                sx: { boxShadow: "none" },
              }}
              muiTableHeadCellProps={{
                sx: {
                  backgroundColor: "#7e7d7dff",
                  fontWeight: 700,
                  color: "#ffffff",
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
                  whiteSpace: "nowrap",
                },
              }}
              muiTableBodyRowProps={({ row }) => ({
                sx: {
                  backgroundColor: row.index % 2 === 0 ? "#ffffff" : "#f8fafc",
                },
              })}
              muiTableContainerProps={{
                sx: {
                  maxHeight: 500,
                  overflowX: "auto",
                  overflowY: "auto",
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                  "&::-webkit-scrollbar": { display: "none" },
                },
              }}
            />
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};
 
export default ConnectivityModalMRT;