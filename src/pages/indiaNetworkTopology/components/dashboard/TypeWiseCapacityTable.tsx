
import { useMemo, useState, useCallback } from 'react';
import { DataGrid, GridColDef, GridToolbarContainer, GridToolbarColumnsButton, GridToolbarFilterButton, GridToolbarExport, GridToolbarDensitySelector, type GridColumnResizeParams } from '@mui/x-data-grid';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../../components/ui/dialog';
import { Maximize2, Minimize2, BarChart3, Download } from 'lucide-react';
import { TypeWiseCapacity, DashboardFilterState } from './types';
import { exportToExcel } from '../../utils/exportExcel';

interface TypeWiseCapacityTableProps {
  data: TypeWiseCapacity[];
  filters: DashboardFilterState;
}

function formatCapacityTB(num: number): string {
  return (num / 1000).toFixed(2);
}

function formatPercent(num: number): string {
  return `${Math.round(num)}%`;
}

function getUtilizationColorClass(percent: number): string {
  if (percent >= 80) return 'bg-destructive';
  if (percent >= 50) return 'bg-yellow-500';
  return 'bg-green-500';
}

const COLUMN_WIDTHS_KEY = 'dashboard-sector-capacity-column-widths';

function loadColumnWidths(): Record<string, number> {
  try {
    const stored = localStorage.getItem(COLUMN_WIDTHS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch { return {}; }
}

function saveColumnWidths(widths: Record<string, number>) {
  localStorage.setItem(COLUMN_WIDTHS_KEY, JSON.stringify(widths));
}

const dataGridSx = {
  height: '100%',
  border: 'none',
  fontFamily: 'inherit',
  fontSize: '0.75rem',
  '& .MuiDataGrid-virtualScroller': {
    overflow: 'auto',
    scrollBehavior: 'smooth',
    '&::-webkit-scrollbar': { width: '6px', height: '6px' },
    '&::-webkit-scrollbar-track': { background: 'hsl(var(--muted) / 0.2)', borderRadius: '3px' },
    '&::-webkit-scrollbar-thumb': {
      background: 'hsl(var(--muted-foreground) / 0.3)', borderRadius: '3px',
      '&:hover': { background: 'hsl(var(--muted-foreground) / 0.5)' },
    },
    scrollbarWidth: 'thin',
    scrollbarColor: 'hsl(var(--muted-foreground) / 0.3) hsl(var(--muted) / 0.2)',
  },
  '& .MuiDataGrid-main': { overflow: 'hidden' },
  '& .MuiDataGrid-footerContainer': {
    borderTop: '1px solid hsl(var(--border))',
    backgroundColor: 'hsl(var(--muted) / 0.1)',
    minHeight: '40px',
    overflow: 'hidden',
  },
  '& .MuiTablePagination-root': { color: 'hsl(var(--foreground))', fontSize: '0.75rem', overflow: 'hidden' },
  '& .MuiTablePagination-toolbar': { overflow: 'hidden' },
  '& .MuiDataGrid-scrollbar--vertical': { display: 'none' },
  '& .MuiDataGrid-scrollbar--horizontal': { display: 'none' },
  '& .MuiDataGrid-columnHeaders': {
    backgroundColor: 'hsl(var(--primary) / 0.12)',
    borderBottom: '2px solid hsl(var(--primary) / 0.3)',
    minHeight: '40px !important',
    maxHeight: '40px !important',
  },
  '& .MuiDataGrid-columnHeader': {
    color: 'hsl(var(--primary))',
    fontWeight: 700,
    fontSize: '0.7rem',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700 },
  '& .MuiDataGrid-cell': {
    color: 'hsl(var(--foreground))',
    borderBottom: '1px solid hsl(var(--border) / 0.12)',
    fontSize: '0.75rem',
    padding: '4px 8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  '& .MuiDataGrid-row:hover': { backgroundColor: 'hsl(var(--muted) / 0.3)' },
  '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
    fontSize: '0.75rem', color: 'hsl(var(--muted-foreground))',
  },
  '& .MuiIconButton-root': { color: 'hsl(var(--foreground))' },
  '& .MuiDataGrid-columnSeparator': { color: 'hsl(var(--border))' },
  '& .MuiDataGrid-sortIcon': { color: 'hsl(var(--primary))' },
  '& .MuiDataGrid-toolbarContainer': {
    padding: '4px 8px', gap: '8px',
    '& .MuiButton-root': { color: 'hsl(var(--foreground))', fontSize: '0.7rem' },
  },
  '& .MuiDataGrid-overlay': {
    backgroundColor: 'hsl(var(--background) / 0.8)',
    color: 'hsl(var(--muted-foreground))',
  },
} as const;

function CustomToolbar() {
  return (
    <GridToolbarContainer>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarDensitySelector />
      <GridToolbarExport />
    </GridToolbarContainer>
  );
}

function createColumns(): GridColDef[] {
  return [
    {
      field: 'type',
      headerName: 'Type',
      flex: 1,
      minWidth: 70,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        if (!params.value) return null;
        const colorClass = params.value === 'NLD' ? 'bg-blue-500' : params.value === 'METRO' ? 'bg-purple-500' : 'bg-muted-foreground';
        return (
          <div className="flex items-center justify-center w-full h-full">
            <Badge className={`text-xs px-2.5 py-0.5 rounded-md font-semibold tracking-wide shadow-sm border-0 text-white ${colorClass}`}>
              {params.value}
            </Badge>
          </div>
        );
      },
    },
    {
      field: 'customers',
      headerName: 'Channel',
      flex: 1,
      minWidth: 70,
      type: 'number',
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => <span className="text-xs font-medium">{params.value}</span>,
    },
    {
      field: 'created',
      headerName: 'Created (TB)',
      flex: 1,
      minWidth: 80,
      type: 'number',
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => <span className="text-xs font-medium">{formatCapacityTB(params.value as number)}</span>,
    },
    {
      field: 'used',
      headerName: 'Used (TB)',
      flex: 1,
      minWidth: 80,
      type: 'number',
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => <span className="text-xs font-medium">{formatCapacityTB(params.value as number)}</span>,
    },
    {
      field: 'utilPercent',
      headerName: 'Avg Util',
      flex: 1.2,
      minWidth: 100,
      type: 'number',
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        const percent = params.value as number;
        return (
          <div className="flex items-center gap-1.5 w-full justify-center">
            <div className="flex-1 max-w-[60px] h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full ${getUtilizationColorClass(percent)} transition-all`}
                style={{ width: `${Math.min(percent, 100)}%` }}
              />
            </div>
            <span className="text-xs font-semibold w-10 text-right">{formatPercent(percent)}</span>
          </div>
        );
      },
    },
  ];
}

export function TypeWiseCapacityTable({ data, filters }: TypeWiseCapacityTableProps) {
  const [storedWidths, setStoredWidths] = useState<Record<string, number>>(() => loadColumnWidths());
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleColumnResize = useCallback((params: GridColumnResizeParams) => {
    setStoredWidths(prev => {
      const updated = { ...prev, [params.colDef.field]: params.width };
      saveColumnWidths(updated);
      return updated;
    });
  }, []);

  const displayData = useMemo(() => {
    let filtered = data;
    if (filters.technology !== 'ALL') {
      filtered = filtered.filter(row => row.Technology === filters.technology);
    }

    const map = new Map<string, { customers: number; created: number; used: number; utilSum: number; count: number }>();
    filtered.forEach(row => {
      const existing = map.get(row.type) || { customers: 0, created: 0, used: 0, utilSum: 0, count: 0 };
      existing.customers += row['Sum Of Customer Name'];
      existing.created += row['Sum Of Created Capacity'];
      existing.used += row['Sum Of Used Capacity'];
      existing.utilSum += row['AVG Of Utilization Percent'];
      existing.count += 1;
      map.set(row.type, existing);
    });

    return Array.from(map.entries()).map(([type, agg], i) => ({
      id: i,
      type,
      customers: agg.customers,
      created: agg.created,
      used: agg.used,
      utilPercent: agg.count > 0 ? agg.utilSum / agg.count : 0,
    }));
  }, [data, filters.technology]);

  const columns = useMemo(() => {
    const cols = createColumns();
    return cols.map(col => storedWidths[col.field] ? { ...col, width: storedWidths[col.field] } : col);
  }, [storedWidths]);

  const handleDownload = useCallback(() => {
    exportToExcel(
      displayData as any[],
      [
        { key: 'type', header: 'Type' },
        { key: 'customers', header: 'Channel' },
        { key: 'created', header: 'Created (TB)', format: (v: number) => Number((v / 1000).toFixed(2)) },
        { key: 'used', header: 'Used (TB)', format: (v: number) => Number((v / 1000).toFixed(2)) },
        { key: 'utilPercent', header: 'Avg Utilization %', format: (v: number) => Math.round(v) },
      ],
      'sector_wise_capacity',
      'Sector Wise Capacity',
    );
  }, [displayData]);

  const TableContent = () => (
    <DataGrid
      rows={displayData}
      columns={columns}
      density="compact"
      disableRowSelectionOnClick
      disableColumnMenu
      hideFooter
      onColumnWidthChange={handleColumnResize}
      sx={dataGridSx}
    />
  );

  return (
    <>
      <Card className="h-full border-border/60 shadow-sm flex flex-col">
        <CardHeader className="py-2 px-3 border-b border-border/50 bg-primary/10 flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <BarChart3 className="h-4 w-4" />
              Sector Wise Capacity ({displayData.length})
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-6 w-6" title="Download as Excel" onClick={handleDownload}>
                <Download className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsFullscreen(true)}>
                <Maximize2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 overflow-hidden">
          <TableContent />
        </CardContent>
      </Card>

      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex flex-row items-center justify-between flex-shrink-0">
            <DialogTitle className="text-foreground">Sector Wise Capacity</DialogTitle>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" title="Download as Excel" onClick={handleDownload}>
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(false)}>
                <Minimize2 className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 min-h-0 border border-border/60 rounded-lg shadow-sm" style={{ maxHeight: '70vh', overflow: 'auto' }}>
            <TableContent />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
