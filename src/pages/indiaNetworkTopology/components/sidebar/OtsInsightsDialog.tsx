import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../../components/ui/dialog';
import { Input } from '../../../../components/ui/input';
import { Button } from '../../../../components/ui/button';
import { Loader2, Search, Database, ArrowUpCircle, ArrowDownCircle, Table2, GitBranch, Download } from 'lucide-react';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
import { fetchOtsDetails, type OtsDetail } from '../../services/otsApi';
import { OtsPathVisualization } from './OtsPathVisualization';

const COLUMN_ORDER_KEY = 'ots-insights-column-order';
const COLUMN_WIDTHS_KEY = 'ots-insights-column-widths';

interface OtsInsightsDialogProps {
  open: boolean;
  onClose: () => void;
  spanId: string;
  adapter: 'MCP' | 'NFMT';
  routeName: string;
}

const StatusCell = ({ value, upCheck }: { value: string; upCheck: string }) => {
  const isUp = value?.toLowerCase().includes(upCheck);
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full leading-none ${isUp
        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
        : 'bg-red-500/15 text-red-700 dark:text-red-400'
        }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${isUp ? 'bg-emerald-500' : 'bg-red-500'}`} />
      {isUp ? 'Up' : 'Down'}
    </span>
  );
};

const defaultColumns: GridColDef[] = [
  {
    field: 'customerName',
    headerName: 'Customer',
    width: 120,
    renderCell: (params) =>
      params.value ? (
        <span className="font-semibold text-[11px] text-foreground uppercase">
          {params.value}
        </span>
      ) : (
        <span className="text-muted-foreground/60 italic text-[10px]">—</span>
      ),
  },
  { field: 'circuitUserLabel', headerName: 'Circuit Label', minWidth: 240, flex: 1 },
  { field: 'channelFinalName', headerName: 'Channel Name', minWidth: 280, flex: 1 },
  { field: 'nodeA', headerName: 'Node A', width: 160 },
  { field: 'nodeB', headerName: 'Node B', width: 160 },
  { field: 'portA', headerName: 'Port A', width: 130 },
  { field: 'portB', headerName: 'Port B', width: 130 },
  {
    field: 'qualifier_ckt',
    headerName: 'Ckt Capacity',
    width: 100,
    headerAlign: 'center',
    align: 'center',
    renderCell: (params) => (
      <span className="text-[11px] font-semibold text-foreground">{params.value || '—'}</span>
    ),
  },
  {
    field: 'technology',
    headerName: 'Technology',
    width: 100,
    renderCell: (params) => (
      <span className="text-[11px] font-semibold text-foreground">{params.value || '—'}</span>
    ),
  },
  {
    field: 'channel_opr_state',
    headerName: 'Ch. State',
    width: 90,
    headerAlign: 'center',
    align: 'center',
    renderCell: (params) => <StatusCell value={params.value as string} upCheck="up" />,
  },
  {
    field: 'ChannelOperationalStateTime',
    headerName: 'Ch. State Time',
    width: 150,
    renderCell: (params) => (
      <span className="text-[10px] text-muted-foreground font-mono">{params.value || '—'}</span>
    ),
  },
  {
    field: 'circuit_opr_state',
    headerName: 'Ckt. State',
    width: 90,
    headerAlign: 'center',
    align: 'center',
    renderCell: (params) => <StatusCell value={params.value as string} upCheck="in service up" />,
  },
  {
    field: 'CircuitOperationalStateTime',
    headerName: 'Ckt. State Time',
    width: 150,
    renderCell: (params) => (
      <span className="text-[10px] text-muted-foreground font-mono">{params.value || '—'}</span>
    ),
  },
  {
    field: 'createdCapacity_ch',
    headerName: 'Ch. Created Cap.',
    width: 120,
    headerAlign: 'center',
    align: 'center',
    renderCell: (params) => (
      <span className="text-[11px] font-semibold text-foreground">
        {params.value != null ? `${params.value} Gbps` : '—'}
      </span>
    ),
  },
  {
    field: 'usedCapacity_ch',
    headerName: 'Ch. Used Cap.',
    width: 110,
    headerAlign: 'center',
    align: 'center',
    renderCell: (params) => (
      <span className="text-[11px] font-semibold text-foreground">
        {params.value != null ? `${params.value} Gbps` : '—'}
      </span>
    ),
  },
  {
    field: 'utilizationPercent_ch',
    headerName: 'Ch. Util. %',
    width: 90,
    headerAlign: 'center',
    align: 'center',
    renderCell: (params) => {
      const val = params.value as number | null;
      if (val == null) return <span className="text-muted-foreground/60 text-[10px]">—</span>;
      const color = val >= 80 ? 'text-red-600 dark:text-red-400' : val >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400';
      return <span className={`text-[11px] font-bold ${color}`}>{val}%</span>;
    },
  },
  // {
  //   field: 'createdCapacity',
  //   headerName: 'Ckt Created Cap.',
  //   width: 120,
  //   headerAlign: 'center',
  //   align: 'center',
  //   renderCell: (params) => (
  //     <span className="text-[11px] font-semibold text-foreground">
  //       {params.value != null ? `${params.value} Gbps` : '—'}
  //     </span>
  //   ),
  // },
  // {
  //   field: 'usedCapacity_c',
  //   headerName: 'Ckt Used Cap.',
  //   width: 110,
  //   headerAlign: 'center',
  //   align: 'center',
  //   renderCell: (params) => (
  //     <span className="text-[11px] font-semibold text-foreground">
  //       {params.value != null ? `${params.value} Gbps` : '—'}
  //     </span>
  //   ),
  // },
  // {
  //   field: 'utilizationPercent_c',
  //   headerName: 'Ckt Util. %',
  //   width: 90,
  //   headerAlign: 'center',
  //   align: 'center',
  //   renderCell: (params) => {
  //     const val = params.value as number | null;
  //     if (val == null) return <span className="text-muted-foreground/60 text-[10px]">—</span>;
  //     const color = val >= 80 ? 'text-red-600 dark:text-red-400' : val >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400';
  //     return <span className={`text-[11px] font-bold ${color}`}>{val}%</span>;
  //   },
  // },
];

function exportToCSV(data: OtsDetail[], filename: string) {
  const headers = [
    'Customer', 'Circuit Label', 'Channel Name', 'Node A', 'Node B', 'Port A', 'Port B',
    'Ckt Capacity', 'Technology',
    'Ch. State', 'Ch. State Time', 'Ckt. State', 'Ckt. State Time',
    'Ch. Created Cap. (Gbps)', 'Ch. Used Cap. (Gbps)', 'Ch. Util. %',
    'Ckt Created Cap. (Gbps)', 'Ckt Used Cap. (Gbps)', 'Ckt Util. %',
  ];
  const csvRows = [
    headers.join(','),
    ...data.map(d => [
      `"${(d.customerName || '').replace(/"/g, '""')}"`,
      `"${d.circuitUserLabel.replace(/"/g, '""')}"`,
      `"${d.channelFinalName.replace(/"/g, '""')}"`,
      `"${d.nodeA}"`,
      `"${d.nodeB}"`,
      `"${d.portA || ''}"`,
      `"${d.portB || ''}"`,
      `"${d.qualifier_ckt || ''}"`,
      `"${d.technology || ''}"`,
      `"${d.channel_opr_state}"`,
      `"${d.ChannelOperationalStateTime || ''}"`,
      `"${d.circuit_opr_state}"`,
      `"${d.CircuitOperationalStateTime || ''}"`,
      d.createdCapacity_ch ?? '',
      d.usedCapacity_ch ?? '',
      d.utilizationPercent_ch ?? '',
      d.createdCapacity ?? '',
      d.usedCapacity_c ?? '',
      d.utilizationPercent_c ?? '',
    ].join(',')),
  ];
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
// Add near the top of the component (after other consts)
const paginationMenuPaperSx = {
  bgcolor: 'hsl(var(--popover))',
  color: 'hsl(var(--popover-foreground))',
  border: '1px solid hsl(var(--border))',
  zIndex: 9999,
  '& .MuiMenuItem-root': {
    fontSize: '0.875rem',
    color: 'hsl(var(--popover-foreground))',
    '&:hover': { bgcolor: 'hsl(var(--accent))' },
    '&.Mui-selected': {
      bgcolor: 'hsl(var(--accent))',
      '&:hover': { bgcolor: 'hsl(var(--accent))' },
    },
  },
};

const paginationSlotProps = {
  select: {
    MenuProps: {
      disablePortal: true,
      PaperProps: { sx: paginationMenuPaperSx },
    },
  },
};

function loadColumnOrder(): string[] | null {
  try {
    const saved = localStorage.getItem(COLUMN_ORDER_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch { return null; }
}

function loadColumnWidths(): Record<string, number> | null {
  try {
    const saved = localStorage.getItem(COLUMN_WIDTHS_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch { return null; }
}

export function OtsInsightsDialog({ open, onClose, spanId, adapter, routeName }: OtsInsightsDialogProps) {
  const [data, setData] = useState<OtsDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [customerFilter, setCustomerFilter] = useState('all');
  const [chStateFilter, setChStateFilter] = useState('all');
  const [cktStateFilter, setCktStateFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'path'>('table');
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => loadColumnWidths() || {});
  const [columnOrder, setColumnOrder] = useState<string[]>(() => loadColumnOrder() || defaultColumns.map(c => c.field));

  useEffect(() => {
    if (!open || !spanId) return;
    setLoading(true);
    setError(null);
    setCustomerFilter('all');
    setChStateFilter('all');
    setCktStateFilter('all');
    setSearch('');
    fetchOtsDetails(spanId, adapter)
      .then(setData)
      .catch((err) => {
        console.error('OTS fetch error:', err);
        setError('Failed to fetch OTS details');
      })
      .finally(() => setLoading(false));
  }, [open, spanId, adapter]);

  const columns = useMemo(() => {
    const withWidths = defaultColumns.map(col => ({
      ...col,
      ...(columnWidths[col.field] ? { width: columnWidths[col.field], flex: undefined } : {}),
    }));

    const ordered: GridColDef[] = [];
    for (const field of columnOrder) {
      const col = withWidths.find(c => c.field === field);
      if (col) ordered.push(col);
    }
    for (const col of withWidths) {
      if (!ordered.find(c => c.field === col.field)) ordered.push(col);
    }
    return ordered;
  }, [columnWidths, columnOrder]);

  const handleColumnWidthChange = useCallback((params: any) => {
    if (params?.colDef?.field && params?.width) {
      setColumnWidths(prev => {
        const next = { ...prev, [params.colDef.field]: params.width };
        localStorage.setItem(COLUMN_WIDTHS_KEY, JSON.stringify(next));
        return next;
      });
    }
  }, []);

  const handleColumnOrderChange = useCallback((params: any) => {
    if (params?.field && params?.targetIndex != null) {
      setColumnOrder(prev => {
        const field = params.field as string;
        const targetIndex = params.targetIndex as number;
        const newOrder = prev.filter(f => f !== field);
        newOrder.splice(targetIndex, 0, field);
        localStorage.setItem(COLUMN_ORDER_KEY, JSON.stringify(newOrder));
        return newOrder;
      });
    }
  }, []);

  const distinctCustomers = useMemo(() => [...new Set(data.map(d => d.customerName || '—').filter(Boolean))].sort(), [data]);
  const distinctChStates = useMemo(() => [...new Set(data.map(d => d.channel_opr_state))].sort(), [data]);
  const distinctCktStates = useMemo(() => [...new Set(data.map(d => d.circuit_opr_state))].sort(), [data]);

  const filteredData = useMemo(() => {
    let result = data;
    if (customerFilter !== 'all') result = result.filter(r => (r.customerName || '—') === customerFilter);
    if (chStateFilter !== 'all') result = result.filter(r => r.channel_opr_state === chStateFilter);
    if (cktStateFilter !== 'all') result = result.filter(r => r.circuit_opr_state === cktStateFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (row) =>
          row.customerName?.toLowerCase().includes(q) ||
          row.circuitUserLabel.toLowerCase().includes(q) ||
          row.channelFinalName.toLowerCase().includes(q) ||
          row.nodeA.toLowerCase().includes(q) ||
          row.nodeB.toLowerCase().includes(q) ||
          row.portA?.toLowerCase().includes(q) ||
          row.portB?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [data, search, customerFilter, chStateFilter, cktStateFilter]);

  const rows = useMemo(
    () => filteredData.map((d, i) => ({ id: `${d.ots_id}-${i}`, ...d })),
    [filteredData]
  );

  // const upCount = data.filter((d) => d.circuit_opr_state.toLowerCase().includes('in service up')).length;
  // const downCount = data.length - upCount;
  const circuitMap = useMemo(() => {
    const map = new Map<string, OtsDetail[]>();

    data.forEach(d => {
      const key = d.circuitUserLabel;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(d);
    });

    return map;
  }, [data]);
  const totalCircuits = circuitMap.size;

  const upCount = Array.from(circuitMap.values()).filter(dirs =>
    dirs.every(d => d.circuit_opr_state?.toLowerCase().includes('in service up'))
  ).length;

  const downCount = totalCircuits - upCount;
  const handleExportFiltered = useCallback(() => {
    exportToCSV(filteredData, `ots-insights-${spanId}-filtered.csv`);
  }, [filteredData, spanId]);

  const handleExportAll = useCallback(() => {
    exportToCSV(data, `ots-insights-${spanId}-all.csv`);
  }, [data, spanId]);

  const hasActiveFilters = customerFilter !== 'all' || chStateFilter !== 'all' || cktStateFilter !== 'all' || search.trim();

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        className="max-w-[94vw] w-[1400px] h-[88vh] flex flex-col p-0 gap-0 overflow-hidden rounded-xl border shadow-2xl"
        style={{ zIndex: 2147483647 }}
      >
        {/* Header */}
        <div className="px-4 pt-3 pb-2.5 border-b bg-muted/30 shrink-0">
          <DialogHeader className="p-0">
            <DialogTitle className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Database className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="font-bold text-base">OTS Insights</span>
              </div>

              <div className="flex items-center gap-2.5 mr-8">
                <span className="text-xs font-mono text-muted-foreground bg-background border px-2 py-1 rounded-md">
                  {spanId}
                </span>
                <span className={`text-xs font-semibold px-2 py-1 rounded-md border ${adapter === 'NFMT'
                  ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20'
                  : 'bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20'
                  }`}>
                  {adapter === 'NFMT' ? 'Nokia' : 'Ciena'}
                </span>
                <div className="h-4 w-px bg-border" />
                {/* <span className="text-sm font-bold text-foreground">{data.length}</span> */}
                <span className="text-xs text-muted-foreground">Total Circuits</span>

                <span className="text-sm font-bold text-foreground">{totalCircuits}</span>
                {/* <span className="text-xs text-muted-foreground">Circuits</span> */}
                <div className="h-4 w-px bg-border" />
                <div className="flex items-center gap-1">
                  <ArrowUpCircle className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{upCount}</span>
                </div>
                <div className="flex items-center gap-1">
                  <ArrowDownCircle className="h-3.5 w-3.5 text-red-500" />
                  <span className="text-sm font-bold text-red-600 dark:text-red-400">{downCount}</span>
                </div>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="flex items-center gap-2 mt-2.5">
            <div className="flex items-center border rounded-md bg-background p-0.5 gap-0.5 shrink-0">
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                className="h-7 px-3 text-[13px] gap-1"
                onClick={() => setViewMode('table')}
              >
                <Table2 className="h-3 w-3" />
                Table
              </Button>
              <Button
                variant={viewMode === 'path' ? 'default' : 'ghost'}
                size="sm"
                className="h-7 px-3 text-[13px] gap-1"
                onClick={() => setViewMode('path')}
              >
                <GitBranch className="h-4 w-4" />
                Path
              </Button>
            </div>

            <div className="flex items-center gap-1.5 bg-background border rounded-md px-2.5 py-1 shrink min-w-0">
              <span className="text-[15px] font-semibold text-foreground truncate max-w-[350px]">{routeName}</span>
            </div>

            <div className="ml-auto flex items-center gap-2 shrink-0">
              {viewMode === 'table' && (
                <div className="relative w-[180px]">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-7 h-7 text-[11px] bg-background"
                  />
                </div>
              )}
              <FilterSelect label="Customer" value={customerFilter} onChange={setCustomerFilter} options={distinctCustomers} />
              <FilterSelect label="Ch. State" value={chStateFilter} onChange={setChStateFilter} options={distinctChStates} />
              <FilterSelect label="Ckt. State" value={cktStateFilter} onChange={setCktStateFilter} options={distinctCktStates} />
              {viewMode === 'table' && (
                <div className="flex items-center gap-1">
                  {hasActiveFilters && (
                    <Button variant="outline" size="sm" className="h-7 px-2.5 text-[10px] gap-1" onClick={handleExportFiltered} title="Export filtered data">
                      <Download className="h-3 w-3" />
                      Filtered ({filteredData.length})
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="h-7 px-2.5 text-[10px] gap-1" onClick={handleExportAll} title="Export all data">
                    <Download className="h-3 w-3" />
                    {hasActiveFilters ? 'All' : 'CSV'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-full gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Loading OTS details...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full text-destructive text-sm">{error}</div>
          ) : viewMode === 'path' ? (
            <OtsPathVisualization
              data={filteredData}
              spanId={spanId}
              customerFilter={customerFilter}
              chStateFilter={chStateFilter}
              cktStateFilter={cktStateFilter}
            />
          ) : (
            <DataGrid
              rows={rows}
              columns={columns}
              density="compact"
              pageSizeOptions={[25, 50, 100]}
              initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
              disableRowSelectionOnClick
              disableColumnMenu={true}
              onColumnWidthChange={handleColumnWidthChange}
              onColumnOrderChange={handleColumnOrderChange}
              slotProps={{
                pagination: {
                  slotProps: paginationSlotProps,
                },
              }}
              sx={{
                border: 'none',
                '& .MuiDataGrid-menu': { zIndex: 2147483647 },
                '& .MuiPopper-root': { zIndex: '2147483647 !important' },
                height: '100%',
                '& .MuiDataGrid-main': { overflow: 'auto' },
                '& .MuiDataGrid-virtualScroller': { overflow: 'auto !important' },
                '& .MuiDataGrid-cell': {
                  fontSize: '13px',
                  py: '2px',
                  borderColor: 'hsl(var(--border))',
                  display: 'flex',
                  alignItems: 'center',
                },
                '& .MuiDataGrid-columnHeader': {
                  fontSize: '13px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: 'hsl(var(--muted-foreground))',
                  backgroundColor: 'hsl(var(--muted) / 0.3)',
                },
                '& .MuiDataGrid-columnSeparator': {
                  display: 'block',
                  color: 'hsl(var(--border))',
                },
                '& .MuiDataGrid-row': {
                  minHeight: '32px !important',
                  maxHeight: '32px !important',
                  '&:hover': { backgroundColor: 'hsl(var(--accent) / 0.5)' },
                },
                '& .MuiDataGrid-footerContainer': {
                  minHeight: '32px',
                  borderColor: 'hsl(var(--border))',
                },
                '& .MuiTablePagination-root': { fontSize: '14px' },
                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                  fontSize: '14px',
                },
                '& .MuiDataGrid-menuIcon': {
                  visibility: 'visible !important',
                  width: 'auto !important',
                },
              }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-7 text-[11px] w-auto min-w-[100px] max-w-[160px] bg-background gap-1 px-2.5">
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent className="z-[2147483647]">
        <SelectItem value="all" className="text-[11px]">All {label}</SelectItem>
        {options.map((opt) => (
          <SelectItem key={opt} value={opt} className="text-[13px]">{opt}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
