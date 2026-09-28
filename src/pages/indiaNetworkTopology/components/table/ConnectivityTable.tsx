
import { useState, useMemo, useCallback, useEffect } from 'react';
import { DataGrid, GridColDef, GridToolbarContainer, GridToolbarColumnsButton, GridToolbarFilterButton, GridToolbarExport, GridToolbarDensitySelector, type GridColumnResizeParams, type GridColumnOrderChangeParams } from '@mui/x-data-grid';
import { 
  Search, 
  RotateCcw,
  Download,
  FileSpreadsheet,
} from 'lucide-react';

import { FiberTable } from './FiberTable';
import { SectorSummaryDashboard } from './SectorSummaryDashboard';
import { SectorDropdown } from '../controls/SectorDropdown';
import type { TableDomainView } from './TableDomainToggle';
import type { FiberRoute, FiberSite, FiberFilterState } from '../../types/fiberTypes';
import { DEFAULT_FIBER_FILTERS } from '../../types/fiberTypes';

import { Input } from '../../../../components/ui/input';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../../components/ui/dropdown-menu';
import { NetworkLink, NetworkNode, FilterState, DEFAULT_FILTERS } from '../../types';
import { calculateDistanceKm, formatDistance } from '../../utils/distanceUtils';

// ============================================
// Types
// ============================================

interface ConnectivityTableProps {
  links: NetworkLink[];
  nodes: NetworkNode[];
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  fiberRoutes?: FiberRoute[];
  fiberSites?: FiberSite[];
  fiberFilters?: FiberFilterState;
  onFiberFilterChange?: (filters: FiberFilterState) => void;
  tableDomain: TableDomainView;
  selectedSector?: string;
  availableSectors?: string[];
  onSectorChange?: (sector: string) => void;
}

// ============================================
// Utility Functions
// ============================================

function getUtilizationLevel(percent: number): 'high' | 'medium' | 'low' {
  if (percent >= 80) return 'high';
  if (percent >= 50) return 'medium';
  return 'low';
}

function getUtilizationColorClass(percent: number): string {
  if (percent >= 80) return 'bg-destructive';
  if (percent >= 50) return 'bg-yellow-500';
  return 'bg-green-500';
}

// ============================================
// MUI Theme that respects our CSS variables
// ============================================

// LocalStorage keys for column widths and order
const COLUMN_WIDTHS_KEY = 'connectivity-table-column-widths';
const COLUMN_ORDER_KEY = 'connectivity-table-column-order';

function loadColumnWidths(): Record<string, number> {
  try {
    const stored = localStorage.getItem(COLUMN_WIDTHS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch { return {}; }
}

function saveColumnWidths(widths: Record<string, number>) {
  localStorage.setItem(COLUMN_WIDTHS_KEY, JSON.stringify(widths));
}

function loadColumnOrder(): string[] {
  try {
    const stored = localStorage.getItem(COLUMN_ORDER_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function saveColumnOrder(order: string[]) {
  localStorage.setItem(COLUMN_ORDER_KEY, JSON.stringify(order));
}

// DataGrid custom sx styles
const dataGridSx = {
  height: '100%',
  border: 'none',
  fontFamily: 'inherit',
  fontSize: '0.75rem',
  // Smooth thin scrollbar — only on virtualScroller (the single scroll container)
  '& .MuiDataGrid-virtualScroller': {
    overflow: 'auto',
    scrollBehavior: 'smooth',
    '&::-webkit-scrollbar': {
      width: '6px',
      height: '6px',
    },
    '&::-webkit-scrollbar-track': {
      background: 'hsl(var(--muted) / 0.2)',
      borderRadius: '3px',
    },
    '&::-webkit-scrollbar-thumb': {
      background: 'hsl(var(--muted-foreground) / 0.3)',
      borderRadius: '3px',
      '&:hover': {
        background: 'hsl(var(--muted-foreground) / 0.5)',
      },
    },
    scrollbarWidth: 'thin',
    scrollbarColor: 'hsl(var(--muted-foreground) / 0.3) hsl(var(--muted) / 0.2)',
  },
  // Hide scrollbar on all other MUI containers
  '& .MuiDataGrid-main': {
    overflow: 'hidden',
  },
  '& .MuiDataGrid-footerContainer': {
    borderTop: '1px solid hsl(var(--border))',
    backgroundColor: 'hsl(var(--muted) / 0.1)',
    minHeight: '44px',
    overflow: 'hidden',
  },
  '& .MuiTablePagination-root': {
    color: 'hsl(var(--foreground))',
    fontSize: '0.75rem',
    overflow: 'hidden',
  },
  '& .MuiTablePagination-toolbar': {
    overflow: 'hidden',
  },
  '& .MuiDataGrid-scrollbar--vertical': {
    display: 'none',
  },
  '& .MuiDataGrid-scrollbar--horizontal': {
    display: 'none',
  },
  '& .MuiDataGrid-columnHeaders': {
    backgroundColor: 'hsl(var(--primary) / 0.12)',
    borderBottom: '2px solid hsl(var(--primary) / 0.3)',
    minHeight: '42px !important',
    maxHeight: '42px !important',
  },
  '& .MuiDataGrid-columnHeader': {
    color: 'hsl(var(--primary))',
    fontWeight: 700,
    fontSize: '0.7rem',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  '& .MuiDataGrid-columnHeaderTitle': {
    fontWeight: 700,
  },
  '& .MuiDataGrid-cell': {
    color: 'hsl(var(--foreground))',
    borderBottom: '1px solid hsl(var(--border) / 0.12)',
    fontSize: '0.75rem',
    padding: '4px 8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  '& .MuiDataGrid-row:hover': {
    backgroundColor: 'hsl(var(--muted) / 0.3)',
  },
  '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
    fontSize: '0.75rem',
    color: 'hsl(var(--muted-foreground))',
  },
  '& .MuiIconButton-root': {
    color: 'hsl(var(--foreground))',
  },
  '& .MuiDataGrid-columnSeparator': {
    color: 'hsl(var(--border))',
  },
  '& .MuiDataGrid-sortIcon': {
    color: 'hsl(var(--primary))',
  },
  '& .MuiDataGrid-toolbarContainer': {
    padding: '4px 8px',
    gap: '8px',
    '& .MuiButton-root': {
      color: 'hsl(var(--foreground))',
      fontSize: '0.7rem',
    },
  },
  '& .MuiDataGrid-overlay': {
    backgroundColor: 'hsl(var(--background) / 0.8)',
    color: 'hsl(var(--muted-foreground))',
  },
} as const;

// ============================================
// Custom Toolbar
// ============================================

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

// ============================================
// Column Definitions
// ============================================

function createColumns(): GridColDef[] {
  return [
    {
      field: 'circuitUserLabel',
      headerName: 'Circuit Label',
      width: 200,
      minWidth: 140,
      renderCell: (params) => (
        <span className="font-mono text-xs truncate" title={params.value}>{params.value}</span>
      ),
    },
    {
      field: 'channelName',
      headerName: 'Channel',
      width: 180,
      minWidth: 120,
      renderCell: (params) => (
        <span className="font-mono text-xs truncate" title={params.value}>{params.value}</span>
      ),
    },
    {
      field: 'type',
      headerName: 'Type',
      width: 90,
      minWidth: 70,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        if (!params.value) return null;
        const colorClass = params.value === 'NLD' ? 'bg-blue-500' : 'bg-amber-500';
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
      field: 'technology',
      headerName: 'Tech',
      width: 90,
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
    },
    {
      field: 'popASiteName',
      headerName: 'Src Site',
      width: 140,
      minWidth: 100,
      renderCell: (params) => <span className="text-xs truncate" title={params.value}>{params.value}</span>,
    },
    {
      field: 'popA',
      headerName: 'Src Dev',
      width: 140,
      minWidth: 100,
      renderCell: (params) => <span className="font-mono text-xs truncate" title={params.value}>{params.value}</span>,
    },
    {
      field: 'popAPort',
      headerName: 'Src Port',
      width: 120,
      minWidth: 80,
      renderCell: (params) => <span className="font-mono text-xs">{params.value}</span>,
    },
    {
      field: 'cityA',
      headerName: 'Src City',
      width: 110,
      minWidth: 80,
      renderCell: (params) => <span className="text-xs truncate" title={params.value}>{params.value}</span>,
    },
    {
      field: 'popACircle',
      headerName: 'Src Circle',
      width: 100,
      minWidth: 70,
      renderCell: (params) => params.value ? <Badge variant="outline" className="text-xs px-1.5 py-0">{params.value}</Badge> : null,
    },
    {
      field: 'popZSiteName',
      headerName: 'Dest Site',
      width: 140,
      minWidth: 100,
      renderCell: (params) => <span className="text-xs truncate" title={params.value}>{params.value}</span>,
    },
    {
      field: 'popZ',
      headerName: 'Dest Dev',
      width: 140,
      minWidth: 100,
      renderCell: (params) => <span className="font-mono text-xs truncate" title={params.value}>{params.value}</span>,
    },
    {
      field: 'popZPort',
      headerName: 'Dest Port',
      width: 120,
      minWidth: 80,
      renderCell: (params) => <span className="font-mono text-xs">{params.value}</span>,
    },
    {
      field: 'cityZ',
      headerName: 'Dest City',
      width: 110,
      minWidth: 80,
      renderCell: (params) => <span className="text-xs truncate" title={params.value}>{params.value}</span>,
    },
    {
      field: 'popZCircle',
      headerName: 'Dest Circle',
      width: 100,
      minWidth: 70,
      renderCell: (params) => params.value ? <Badge variant="outline" className="text-xs px-1.5 py-0">{params.value}</Badge> : null,
    },
    {
      field: 'layerRate',
      headerName: 'Rate',
      width: 80,
      minWidth: 60,
      renderCell: (params) => params.value ? <Badge variant="outline" className="text-xs px-1.5 py-0">{params.value}</Badge> : null,
    },
    {
      field: 'utilizationPercent',
      headerName: 'Util',
      width: 120,
      minWidth: 100,
      type: 'number',
      renderCell: (params) => {
        const percent = params.value as number;
        return (
          <div className="flex items-center gap-1 w-full">
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full ${getUtilizationColorClass(percent)} transition-all`}
                style={{ width: `${percent}%` }}
              />
            </div>
            <span className="text-xs font-medium w-8 text-right">{percent}%</span>
          </div>
        );
      },
    },
    {
      field: 'capacity',
      headerName: 'Cap',
      width: 80,
      minWidth: 60,
      type: 'number',
      renderCell: (params) => <span className="text-xs">{((params.value as number) / 1000).toFixed(1)}</span>,
    },
    {
      field: 'usedCapacity',
      headerName: 'Used',
      width: 80,
      minWidth: 60,
      type: 'number',
      renderCell: (params) => <span className="text-xs">{((params.value as number) / 1000).toFixed(1)}</span>,
    },
    {
      field: 'circuitType',
      headerName: 'Domain',
      width: 100,
      minWidth: 70,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        if (!params.value) return null;
        const colorClass = params.value === 'IP' ? 'bg-blue-500' : params.value === 'OPTICAL' ? 'bg-teal-500' : 'bg-muted';
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
      field: 'path',
      headerName: 'Path',
      width: 70,
      minWidth: 50,
      renderCell: (params) => <span className="text-xs font-mono">{params.value}</span>,
    },
    {
      field: 'customerName',
      headerName: 'Customer',
      width: 140,
      minWidth: 90,
      renderCell: (params) => <span className="text-xs font-medium truncate" title={params.value}>{params.value}</span>,
    },
  ];
}

// ============================================
// Component
// ============================================

export function ConnectivityTable({
  links,
  nodes,
  filters,
  onFilterChange,
  fiberRoutes = [],
  fiberSites = [],
  fiberFilters = DEFAULT_FIBER_FILTERS,
  onFiberFilterChange,
  tableDomain,
  selectedSector = '',
  availableSectors = [],
  onSectorChange,
}: ConnectivityTableProps) {
  const [globalFilter, setGlobalFilter] = useState('');
  const [storedWidths, setStoredWidths] = useState<Record<string, number>>(() => loadColumnWidths());
  const [storedOrder, setStoredOrder] = useState<string[]>(() => loadColumnOrder());

  const columns = useMemo(() => {
    let cols = createColumns();
    // Apply stored widths from localStorage
    cols = cols.map(col => storedWidths[col.field] ? { ...col, width: storedWidths[col.field] } : col);
    // Apply stored column order from localStorage
    if (storedOrder.length > 0) {
      const orderMap = new Map(storedOrder.map((field, idx) => [field, idx]));
      cols.sort((a, b) => {
        const aIdx = orderMap.get(a.field) ?? 999;
        const bIdx = orderMap.get(b.field) ?? 999;
        return aIdx - bIdx;
      });
    }
    return cols;
  }, [storedWidths, storedOrder]);

  const handleColumnResize = useCallback((params: GridColumnResizeParams) => {
    setStoredWidths(prev => {
      const updated = { ...prev, [params.colDef.field]: params.width };
      saveColumnWidths(updated);
      return updated;
    });
  }, []);

  const handleColumnOrderChange = useCallback((params: GridColumnOrderChangeParams) => {
    setStoredOrder(prev => {
      // Build current order from columns if no stored order
      const currentOrder = prev.length > 0 ? [...prev] : columns.map(c => c.field);
      const field = params.column.field;
      const oldIndex = currentOrder.indexOf(field);
      if (oldIndex > -1) currentOrder.splice(oldIndex, 1);
      currentOrder.splice(params.targetIndex, 0, field);
      saveColumnOrder(currentOrder);
      return currentOrder;
    });
  }, [columns]);

  const handleFiberFilterChange = useCallback((newFilters: FiberFilterState) => {
    if (onFiberFilterChange) onFiberFilterChange(newFilters);
  }, [onFiberFilterChange]);

  // Filter data
  const filteredData = useMemo(() => {
    return links.filter(link => {
      if (selectedSector) {
        const sector = link.circuit?.sector;
        if (!sector || sector !== selectedSector) return false;
      }
      if (filters.types.length > 0 && !filters.types.includes(link.circuit?.type?.toUpperCase())) return false;
      if (filters.technologies && filters.technologies.length > 0) {
        const technology = link.circuit?.technology?.toUpperCase() || 'CIENA';
        if (!filters.technologies.includes(technology)) return false;
      }
      if (filters.utilizationLevels.length > 0) {
        const level = getUtilizationLevel(link.utilizationPercent);
        if (!filters.utilizationLevels.includes(level)) return false;
      }
      if (filters.circles.length > 0) {
        const srcCircle = link.circuit?.popACircle || link.source?.circle;
        const dstCircle = link.circuit?.popZCircle || link.target?.circle;
        if (!filters.circles.includes(srcCircle) && !filters.circles.includes(dstCircle)) return false;
      }
      if (filters.domainTypes && filters.domainTypes.length > 0) {
        const domainType = link.circuit?.circuitType;
        if (!domainType || !filters.domainTypes.includes(domainType)) return false;
      }
      if (filters.pathTypes && filters.pathTypes.length > 0) {
        const pathType = link.circuit?.path;
        if (!pathType || !filters.pathTypes.includes(pathType)) return false;
      }
      return true;
    });
  }, [links, filters, selectedSector]);

  // Transform data to flat rows for DataGrid
  const rows = useMemo(() => {
    let data = filteredData;
    
    // Apply global search filter
    if (globalFilter) {
      const search = globalFilter.toLowerCase();
      data = data.filter(link => {
        const searchFields = [
          link.circuit?.circuitUserLabel,
          link.circuit?.channelName,
          link.circuit?.type,
          link.circuit?.technology,
          link.circuit?.popASiteName,
          link.circuit?.popA,
          link.circuit?.popAPort,
          link.circuit?.cityA,
          link.circuit?.popACircle,
          link.circuit?.popZSiteName,
          link.circuit?.popZ,
          link.circuit?.popZPort,
          link.circuit?.cityZ,
          link.circuit?.popZCircle,
          link.circuit?.customerName,
          link.circuit?.circuitType,
          link.circuit?.path,
        ];
        return searchFields.some(f => f?.toLowerCase().includes(search));
      });
    }

    return data.map((link, index) => ({
      id: link.id ? `${link.id}-${index}` : `row-${index}`,
      circuitUserLabel: link.circuit?.circuitUserLabel ?? '',
      channelName: link.circuit?.channelName ?? '',
      type: link.circuit?.type ?? '',
      technology: link.circuit?.technology ?? '',
      popASiteName: link.circuit?.popASiteName ?? '',
      popA: link.circuit?.popA ?? '',
      popAPort: link.circuit?.popAPort ?? '',
      cityA: link.circuit?.cityA ?? '',
      popACircle: link.circuit?.popACircle ?? '',
      popZSiteName: link.circuit?.popZSiteName ?? '',
      popZ: link.circuit?.popZ ?? '',
      popZPort: link.circuit?.popZPort ?? '',
      cityZ: link.circuit?.cityZ ?? '',
      popZCircle: link.circuit?.popZCircle ?? '',
      distance: calculateDistanceKm(
        link.source?.lat || 0, link.source?.lon || 0,
        link.target?.lat || 0, link.target?.lon || 0
      ),
      layerRate: link.circuit?.layerRate ?? '',
      utilizationPercent: link.utilizationPercent ?? 0,
      capacity: link.capacity ?? 0,
      usedCapacity: link.usedCapacity ?? 0,
      circuitType: link.circuit?.circuitType ?? '',
      path: link.circuit?.path ?? '',
      customerName: link.circuit?.customerName ?? '',
    }));
  }, [filteredData, globalFilter]);

  // Export functions
  const exportToCSV = useCallback(() => {
    const headers = [
      'Circuit Label', 'Channel Name', 'Type', 'Technology',
      'Source Site', 'Source Device', 'Source Port', 'Source City', 'Source Circle',
      'Dest Site', 'Dest Device', 'Dest Port', 'Dest City', 'Dest Circle',
      'Distance (km)', 'Layer Rate', 'Utilization (%)', 'Capacity (Gbps)', 'Used (Gbps)',
      'Domain', 'Path', 'Customer'
    ];
    const csvRows = rows.map(r => [
      r.circuitUserLabel, r.channelName, r.type, r.technology,
      r.popASiteName, r.popA, r.popAPort, r.cityA, r.popACircle,
      r.popZSiteName, r.popZ, r.popZPort, r.cityZ, r.popZCircle,
      r.distance.toFixed(2), r.layerRate, r.utilizationPercent, r.capacity, r.usedCapacity,
      r.circuitType, r.path, r.customerName
    ]);
    const csvContent = [headers.join(','), ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `connectivity_data_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [rows]);

  const exportToExcel = useCallback(() => {
    const headers = [
      'Circuit Label', 'Channel Name', 'Type', 'Technology',
      'Source Site', 'Source Device', 'Source Port', 'Source City', 'Source Circle',
      'Dest Site', 'Dest Device', 'Dest Port', 'Dest City', 'Dest Circle',
      'Distance (km)', 'Layer Rate', 'Utilization (%)', 'Capacity (Gbps)', 'Used (Gbps)',
      'Domain', 'Path', 'Customer'
    ];
    const tsvRows = rows.map(r => [
      r.circuitUserLabel, r.channelName, r.type, r.technology,
      r.popASiteName, r.popA, r.popAPort, r.cityA, r.popACircle,
      r.popZSiteName, r.popZ, r.popZPort, r.cityZ, r.popZCircle,
      r.distance.toFixed(2), r.layerRate, r.utilizationPercent, r.capacity, r.usedCapacity,
      r.circuitType, r.path, r.customerName
    ]);
    const tsvContent = [headers.join('\t'), ...tsvRows.map(row => row.join('\t'))].join('\n');
    const blob = new Blob([tsvContent], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `connectivity_data_${new Date().toISOString().split('T')[0]}.xls`;
    a.click();
    URL.revokeObjectURL(url);
  }, [rows]);

  // Quick filters
  const handleTypeFilter = (type: string) => {
    onFilterChange({ ...filters, types: type === 'all' ? [] : [type] });
  };
  const handleUtilFilter = (level: string) => {
    onFilterChange({ ...filters, utilizationLevels: level === 'all' ? [] : [level as 'high' | 'medium' | 'low'] });
  };

  // If FIBER domain, render FiberTable
  if (tableDomain === 'FIBER') {
    return (
      <FiberTable
        routes={fiberRoutes}
        sites={fiberSites}
        filters={fiberFilters}
        onFilterChange={handleFiberFilterChange}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-background gap-2">
      {/* Top Toolbar */}
      <div className="flex-shrink-0 flex items-center gap-3 p-2 bg-muted/20 rounded-lg border border-border/50 flex-wrap">
        {/* Global Search */}
        <div className="relative flex-1 max-w-[330px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search circuits, cities, devices..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-8 h-8 text-xs bg-background border-border/60"
          />
        </div>

        {/* Filters */}
        <Select
          value={filters.types.length === 1 ? filters.types[0] : 'all'}
          onValueChange={handleTypeFilter}
        >
          <SelectTrigger className="w-[130px] h-8 text-xs bg-background border-border/60">
            <SelectValue placeholder="Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">Types</SelectItem>
            <SelectItem value="NLD" className="text-xs">NLD</SelectItem>
            <SelectItem value="METRO" className="text-xs">METRO</SelectItem>
            <SelectItem value="OTHER" className="text-xs">OTHER</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.technologies?.length === 1 ? filters.technologies[0] : 'all'}
          onValueChange={(val) => onFilterChange({ ...filters, technologies: val === 'all' ? [] : [val] })}
        >
          <SelectTrigger className="w-[150px] h-8 text-xs bg-background border-border/60">
            <SelectValue placeholder="Technology" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">Technology</SelectItem>
            <SelectItem value="CIENA" className="text-xs">CIENA</SelectItem>
            <SelectItem value="NOKIA" className="text-xs">NOKIA</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.domainTypes?.length === 1 ? filters.domainTypes[0] : 'all'}
          onValueChange={(val) => onFilterChange({ ...filters, domainTypes: val === 'all' ? [] : [val as 'IP' | 'OPTICAL'] })}
        >
          <SelectTrigger className="w-[140px] h-8 text-xs bg-background border-border/60">
            <SelectValue placeholder="Domains" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">Domains</SelectItem>
            <SelectItem value="IP" className="text-xs">IP</SelectItem>
            <SelectItem value="OPTICAL" className="text-xs">OPTICAL</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.utilizationLevels.length === 1 ? filters.utilizationLevels[0] : 'all'}
          onValueChange={handleUtilFilter}
        >
          <SelectTrigger className="w-[150px] h-8 text-xs bg-background border-border/60">
            <SelectValue placeholder="Utilization" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">Utilization</SelectItem>
            <SelectItem value="high" className="text-xs">High (&gt;80%)</SelectItem>
            <SelectItem value="medium" className="text-xs">Medium (50-80%)</SelectItem>
            <SelectItem value="low" className="text-xs">Low (&lt;50%)</SelectItem>
          </SelectContent>
        </Select>

        {/* Sector Dropdown - right after Utilization */}
        {availableSectors && availableSectors.length > 0 && onSectorChange && (
          <SectorDropdown
            availableSectors={availableSectors}
            selectedSector={selectedSector || ''}
            onSectorChange={onSectorChange}
            compact
          />
        )}

        {(filters.types.length > 0 || filters.utilizationLevels.length > 0 ||
          (filters.technologies && filters.technologies.length > 0) ||
          (filters.domainTypes && filters.domainTypes.length > 0) ||
          (filters.pathTypes && filters.pathTypes.length > 0)) && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={() => onFilterChange(DEFAULT_FILTERS)}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}

        <div className="flex-1" />

        {/* Export Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1.5">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">Export</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="text-xs">Export Data</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem className="text-xs cursor-pointer" checked={false} onCheckedChange={() => exportToCSV()}>
              <Download className="h-3.5 w-3.5 mr-2" />
              Export as CSV
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem className="text-xs cursor-pointer" checked={false} onCheckedChange={() => exportToExcel()}>
              <FileSpreadsheet className="h-3.5 w-3.5 mr-2" />
              Export as Excel
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Sector Summary Dashboard */}
      {selectedSector && filteredData.length > 0 && (
        <SectorSummaryDashboard sectorName={selectedSector} />
      )}

      {/* MUI DataGrid */}
      <div className="flex-1 min-h-0 border border-border/60 rounded-lg shadow-sm overflow-hidden">
        <DataGrid
          rows={rows}
          columns={columns}
          initialState={{
            pagination: { paginationModel: { pageSize: 25, page: 0 } },
          }}
          pageSizeOptions={[10, 25, 50, 100]}
          disableRowSelectionOnClick
          density="compact"
          onColumnWidthChange={handleColumnResize}
          onColumnOrderChange={handleColumnOrderChange}
          slots={{
            toolbar: CustomToolbar,
          }}
          sx={dataGridSx}
        />
      </div>
    </div>
  );
}
