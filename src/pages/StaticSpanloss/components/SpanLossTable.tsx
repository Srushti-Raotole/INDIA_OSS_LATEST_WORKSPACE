import { useMemo } from 'react';
import {
  DataGrid,
  type GridColDef,
  type GridRenderCellParams,
  GridToolbarContainer,
  GridToolbarColumnsButton,
  GridToolbarFilterButton,
  GridToolbarDensitySelector,
  GridToolbarExport,
  GridToolbarQuickFilter,
  type GridRowModel,
} from '@mui/x-data-grid';
import { Box, Chip } from '@mui/material';
import type { SpanLossRow } from '../types';
import { EDITABLE_FIELDS } from '../types';
import { getVendorColor } from '../constants/vendorColors';
import { rowMatchKey } from '../utils/rowMatching';
import { useToast } from '../../../hooks/use-toast';

interface SpanLossTableProps {
  rows: SpanLossRow[];
  loading: boolean;
  dirtyIds: Set<string>;
  onRowEdit: (updated: SpanLossRow, original: SpanLossRow) => SpanLossRow;
  vendorColor?: string;
}

function CustomToolbar() {
  return (
    <GridToolbarContainer sx={{ p: 1, gap: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarDensitySelector />
      <GridToolbarExport />
      <Box sx={{ flex: 1 }} />
      <GridToolbarQuickFilter debounceMs={300} />
    </GridToolbarContainer>
  );
}

export function SpanLossTable({ rows, loading, dirtyIds, onRowEdit, vendorColor = '#3b82f6' }: SpanLossTableProps) {
  const { toast } = useToast();
  const columns = useMemo<GridColDef<SpanLossRow>[]>(
    () => [
      {
        field: 'spanId',
        headerName: 'Span ID',
        width: 180,
        renderCell: (p: GridRenderCellParams<SpanLossRow>) => (
          <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{p.value}</span>
        ),
      },
      { field: 'deviceNameA', headerName: 'Device A', width: 180 },
      { field: 'portA', headerName: 'Port A', width: 110 },
      { field: 'deviceNameB', headerName: 'Device B', width: 180 },
      { field: 'portB', headerName: 'Port B', width: 110 },
      {
        field: 'designLoss',
        headerName: 'Design Loss (dB)',
        width: 150,
        type: 'number',
        editable: true,
        cellClassName: 'editable-cell',
      },
      {
        field: 'spanMargin',
        headerName: 'Span Margin (dB)',
        width: 150,
        type: 'number',
        editable: true,
        cellClassName: 'editable-cell',
      },
      {
        field: 'designEol',
        headerName: 'Design EOL (dB)',
        width: 150,
        type: 'number',
        editable: true,
        cellClassName: 'editable-cell',
      },
      {
        field: 'fiberDistance',
        headerName: 'Fiber Distance (km)',
        width: 160,
        type: 'number',
        editable: true,
        cellClassName: 'editable-cell',
      },
      {
        field: 'vendor',
        headerName: 'Vendor',
        width: 110,
        renderCell: (p) => {
          const color = getVendorColor(String(p.value));
          return (
            <Chip
              label={p.value}
              size="small"
              variant="outlined"
              sx={{
                color,
                borderColor: color,
                fontWeight: 700,
                bgcolor: `${color}14`,
              }}
            />
          );
        },
      },
      { field: 'client', headerName: 'Client', flex: 1, minWidth: 130 },
    ],
    [],
  );

  const gridRows = useMemo(
    () => rows.map((r) => ({ ...r, id: rowMatchKey(r) })),
    [rows],
  );

  const processRowUpdate = (newRow: GridRowModel, oldRow: GridRowModel) => {
    const updated = newRow as SpanLossRow & { id: string };
    const original = oldRow as SpanLossRow & { id: string };
    // Coerce editable fields to numbers / null and reject negatives.
    for (const f of EDITABLE_FIELDS) {
      const v = (updated as any)[f];
      if (v === '' || v === null || v === undefined) {
        (updated as any)[f] = null;
        continue;
      }
      const num = Number(v);
      if (!Number.isFinite(num)) {
        (updated as any)[f] = null;
        continue;
      }
      if (num < 0) {
        // Reject the edit — keep the original value and surface a validation error.
        throw new Error(`${f} cannot be negative`);
      }
      (updated as any)[f] = num;
    }
    return onRowEdit(updated, original);
  };

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        '& .editable-cell': {
          backgroundColor: `${vendorColor}10`,
          cursor: 'cell',
        },
        '& .editable-cell:hover': {
          backgroundColor: `${vendorColor}1F`,
        },
        '& .row-dirty': {
          backgroundColor: 'rgba(234, 179, 8, 0.10)',
        },
        '& .MuiDataGrid-columnHeaders': {
          background: `linear-gradient(180deg, ${vendorColor}26 0%, ${vendorColor}14 100%)`,
          borderBottom: `2px solid ${vendorColor}`,
          color: 'hsl(var(--foreground))',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          fontSize: 12,
        },
        '& .MuiDataGrid-columnHeaderTitle': {
          fontWeight: 800,
        },
        '& .MuiDataGrid-row:hover': {
          backgroundColor: `${vendorColor}08`,
        },
        '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
          outline: `2px solid ${vendorColor}`,
          outlineOffset: '-2px',
        },
        '& .MuiDataGrid-footerContainer': {
          borderTop: '1px solid',
          borderColor: 'divider',
          background: `${vendorColor}08`,
        },
      }}
    >
      <DataGrid
        rows={gridRows}
        columns={columns}
        loading={loading}
        density="compact"
        disableRowSelectionOnClick
        processRowUpdate={processRowUpdate}
        onProcessRowUpdateError={(err) => {
          console.error('[SpanLossTable] update error', err);
          toast({
            title: 'Invalid value',
            description: String((err as Error)?.message ?? err),
            variant: 'destructive',
          });
        }}
        getRowClassName={(p) => (dirtyIds.has(String(p.id)) ? 'row-dirty' : '')}
        slots={{ toolbar: CustomToolbar }}
        slotProps={{
          toolbar: { showQuickFilter: true },
        }}
        initialState={{
          pagination: { paginationModel: { pageSize: 25, page: 0 } },
        }}
        pageSizeOptions={[10, 25, 50, 100]}
        sx={{ height: '100%', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
      />
    </Box>
  );
}
