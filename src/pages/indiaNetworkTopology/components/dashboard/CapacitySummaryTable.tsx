
import { useMemo, useState, useCallback } from 'react';
import { DataGrid, GridColDef, GridToolbarContainer, GridToolbarColumnsButton, GridToolbarFilterButton, GridToolbarExport, GridToolbarDensitySelector, type GridColumnResizeParams } from '@mui/x-data-grid';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../../components/ui/dialog';
import { Maximize2, Minimize2, Globe, Download } from 'lucide-react';
import { CityWiseCapacity, DashboardFilterState } from './types';
import { exportToExcel } from '../../utils/exportExcel';

interface CapacitySummaryTableProps {
  data: CityWiseCapacity[];
  filters: DashboardFilterState;
}

function formatCapacityTB(num: number): string { return (num / 1000).toFixed(2); }
function formatPercent(num: number): string { return `${Math.round(num)}%`; }

function getUtilizationColorClass(percent: number): string {
  if (percent >= 80) return 'bg-destructive';
  if (percent >= 50) return 'bg-yellow-500';
  return 'bg-green-500';
}

const COLUMN_WIDTHS_KEY = 'dashboard-domain-capacity-column-widths';

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
    minHeight: '44px',
  },
  '& .MuiTablePagination-root': { color: 'hsl(var(--foreground))', fontSize: '0.75rem' },
  '& .MuiTablePagination-toolbar': { minHeight: '44px' },
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

function createColumns(showTech: boolean): GridColDef[] {
  const cols: GridColDef[] = [
    {
      field: 'Type',
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
      field: 'City',
      headerName: 'City',
      flex: 1.5,
      minWidth: 100,
      renderCell: (params) => (
        <span className="text-xs font-medium truncate" title={params.value}>{params.value || '-'}</span>
      ),
    },
  ];

  if (showTech) {
    cols.push({
      field: 'Technology Name',
      headerName: 'Tech',
      flex: 1,
      minWidth: 70,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        if (!params.value) return null;
        const colorClass = params.value === 'NOKIA' ? 'bg-purple-500' : 'bg-cyan-600';
        return (
          <div className="flex items-center justify-center w-full h-full">
            <Badge className={`text-xs px-2.5 py-0.5 rounded-md font-semibold tracking-wide shadow-sm border-0 text-white ${colorClass}`}>
              {params.value}
            </Badge>
          </div>
        );
      },
    });
  }

  cols.push(
    {
      field: 'Sum Of Customer Name',
      headerName: 'Channel',
      flex: 1,
      minWidth: 70,
      type: 'number',
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => <span className="text-xs font-medium">{params.value}</span>,
    },
    {
      field: 'Sum Of Created Capacity',
      headerName: 'Created (TB)',
      flex: 1,
      minWidth: 80,
      type: 'number',
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => <span className="text-xs font-medium">{formatCapacityTB(params.value as number)}</span>,
    },
    {
      field: 'Sum Of Used Capacity',
      headerName: 'Used (TB)',
      flex: 1,
      minWidth: 80,
      type: 'number',
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => <span className="text-xs font-medium">{formatCapacityTB(params.value as number)}</span>,
    },
    {
      field: 'AVG Of Utilization Percent',
      headerName: 'Util %',
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
            <span className="text-xs font-semibold w-12 text-right">{formatPercent(percent)}</span>
          </div>
        );
      },
    },
  );

  return cols;
}

export function CapacitySummaryTable({ data, filters }: CapacitySummaryTableProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [storedWidths, setStoredWidths] = useState<Record<string, number>>(() => loadColumnWidths());

  const handleColumnResize = useCallback((params: GridColumnResizeParams) => {
    setStoredWidths(prev => {
      const updated = { ...prev, [params.colDef.field]: params.width };
      saveColumnWidths(updated);
      return updated;
    });
  }, []);

  const showTech = filters.technology === 'ALL';

  const filteredData = useMemo(() => {
    let result = [...data];
    if (filters.type !== 'ALL') result = result.filter(row => row.Type === filters.type);
    if (filters.city) result = result.filter(row => row.City === filters.city);
    if (filters.technology !== 'ALL') result = result.filter(row => row['Technology Name'] === filters.technology);
    return result;
  }, [data, filters]);

  const columns = useMemo(() => {
    const cols = createColumns(showTech);
    return cols.map(col => storedWidths[col.field] ? { ...col, width: storedWidths[col.field] } : col);
  }, [showTech, storedWidths]);

  const rows = useMemo(() => filteredData.map((row, i) => ({ id: i, ...row })), [filteredData]);

  const handleDownload = useCallback(() => {
    exportToExcel(
      filteredData as any[],
      [
        { key: 'Type', header: 'Type' },
        { key: 'City', header: 'City' },
        ...(showTech ? [{ key: 'Technology Name', header: 'Technology' }] : []),
        { key: 'Sum Of Customer Name', header: 'Channel' },
        { key: 'Sum Of Created Capacity', header: 'Created (TB)', format: (v: number) => Number((v / 1000).toFixed(2)) },
        { key: 'Sum Of Used Capacity', header: 'Used (TB)', format: (v: number) => Number((v / 1000).toFixed(2)) },
        { key: 'AVG Of Utilization Percent', header: 'Utilization %', format: (v: number) => Math.round(v) },
      ],
      'domain_wise_capacity',
      'Domain Wise Capacity',
    );
  }, [filteredData, showTech]);

  const TableContent = () => (
    <DataGrid
      rows={rows}
      columns={columns}
      density="compact"
      disableRowSelectionOnClick
      hideFooter
      onColumnWidthChange={handleColumnResize}
      slots={{ toolbar: CustomToolbar }}
      initialState={{
        sorting: { sortModel: [{ field: 'AVG Of Utilization Percent', sort: 'desc' }] },
      }}
      sx={dataGridSx}
    />
  );

  return (
    <>
      <Card className="h-full flex flex-col border-border/60 shadow-sm">
        <CardHeader className="py-2 px-3 border-b border-border/50 bg-primary/10 flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
              <Globe className="h-4 w-4" />
              Domain Wise Capacity ({filteredData.length})
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                title="Download as Excel"
                onClick={handleDownload}
              >
                <Download className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsFullscreen(true)}
              >
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
        <DialogContent className="max-w-[90vw] w-[90vw] h-[90vh] flex flex-col">
          <DialogHeader className="flex flex-row items-center justify-between flex-shrink-0">
            <DialogTitle className="text-foreground">Domain Wise Capacity (Full View)</DialogTitle>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" title="Download as Excel" onClick={handleDownload}>
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(false)}>
                <Minimize2 className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 min-h-0 border border-border/60 rounded-lg shadow-sm overflow-hidden">
            <TableContent />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
