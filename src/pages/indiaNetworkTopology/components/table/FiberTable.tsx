
import { useState, useMemo, useCallback } from 'react';
import { DataGrid, GridColDef, GridToolbarContainer, GridToolbarColumnsButton, GridToolbarFilterButton, GridToolbarExport, GridToolbarDensitySelector, type GridColumnResizeParams } from '@mui/x-data-grid';
import { 
  Search, 
  RotateCcw,
  Download,
  FileSpreadsheet,
  Route,
  MapPin
} from 'lucide-react';

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
import { ToggleGroup, ToggleGroupItem } from '../../../../components/ui/toggle-group';
import type { FiberRoute, FiberSite, FiberFilterState } from '../../types/fiberTypes';
import { DEFAULT_FIBER_FILTERS } from '../../types/fiberTypes';

// ============================================
// Types
// ============================================

interface FiberTableProps {
  routes: FiberRoute[];
  sites: FiberSite[];
  filters: FiberFilterState;
  onFilterChange: (filters: FiberFilterState) => void;
}

type FiberDataTab = 'routes' | 'sites';

// ============================================
// LocalStorage for column width persistence
// ============================================

const ROUTE_WIDTHS_KEY = 'fiber-routes-table-column-widths';
const SITE_WIDTHS_KEY = 'fiber-sites-table-column-widths';

function loadColumnWidths(key: string): Record<string, number> {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : {};
  } catch { return {}; }
}

function saveColumnWidths(key: string, widths: Record<string, number>) {
  localStorage.setItem(key, JSON.stringify(widths));
}

// ============================================
// Shared DataGrid sx (matches ConnectivityTable)
// ============================================

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
      background: 'hsl(var(--muted-foreground) / 0.3)',
      borderRadius: '3px',
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
    overflow: 'hidden',
  },
  '& .MuiTablePagination-root': { color: 'hsl(var(--foreground))', fontSize: '0.75rem', overflow: 'hidden' },
  '& .MuiTablePagination-toolbar': { overflow: 'hidden' },
  '& .MuiDataGrid-scrollbar--vertical': { display: 'none' },
  '& .MuiDataGrid-scrollbar--horizontal': { display: 'none' },
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
    fontSize: '0.75rem',
    color: 'hsl(var(--muted-foreground))',
  },
  '& .MuiIconButton-root': { color: 'hsl(var(--foreground))' },
  '& .MuiDataGrid-columnSeparator': { color: 'hsl(var(--border))' },
  '& .MuiDataGrid-sortIcon': { color: 'hsl(var(--primary))' },
  '& .MuiDataGrid-toolbarContainer': {
    padding: '4px 8px',
    gap: '8px',
    '& .MuiButton-root': { color: 'hsl(var(--foreground))', fontSize: '0.7rem' },
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
// Route Column Definitions
// ============================================

function createRouteColumns(): GridColDef[] {
  return [
    {
      field: 'routeName',
      headerName: 'Route Name',
      flex: 2,
      minWidth: 100,
      renderCell: (params) => (
        <span className="font-medium text-xs truncate" title={params.value}>{params.value}</span>
      ),
    },
    {
      field: 'spanid',
      headerName: 'Span ID',
      flex: 0.8,
      minWidth: 70,
      renderCell: (params) => (
        <span className="font-mono text-xs truncate" title={params.value}>{params.value || '-'}</span>
      ),
    },
    {
      field: 'linkName',
      headerName: 'Link Name',
      flex: 1.2,
      minWidth: 80,
      renderCell: (params) => (
        <span className="font-mono text-xs truncate" title={params.value}>{params.value}</span>
      ),
    },
    {
      field: 'type',
      headerName: 'Type',
      flex: 0.8,
      minWidth: 60,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
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
      field: 'methodology',
      headerName: 'Methodology',
      flex: 1,
      minWidth: 80,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        const m = params.value;
        const colorClass = m === 'OPGW' ? 'bg-emerald-600'
          : m === 'UG' ? 'bg-orange-600'
          : m === 'AERIAL' ? 'bg-sky-500'
          : m === 'UTILITY' ? 'bg-purple-600'
          : 'bg-muted-foreground';
        return (
          <div className="flex items-center justify-center w-full h-full">
            <Badge className={`text-xs px-2.5 py-0.5 rounded-md font-semibold tracking-wide shadow-sm border-0 text-white ${colorClass}`}>
              {m}
            </Badge>
          </div>
        );
      },
    },
    {
      field: 'construction',
      headerName: 'Status',
      flex: 1,
      minWidth: 90,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        const isCompleted = params.value === 'Completed';
        return (
          <div className="flex items-center justify-center w-full h-full">
            <Badge variant="outline" className={`text-xs px-2.5 py-0.5 rounded-md font-semibold tracking-wide shadow-sm ${isCompleted ? 'border-green-500 text-green-600 bg-green-500/10' : 'border-amber-500 text-amber-600 bg-amber-500/10'}`}>
              {params.value}
            </Badge>
          </div>
        );
      },
    },
    {
      field: 'lengthKms',
      headerName: 'Length (km)',
      flex: 1,
      minWidth: 70,
      type: 'number',
      renderCell: (params) => (
        <span className="text-xs font-medium text-primary">{(params.value as number).toFixed(2)} km</span>
      ),
    },
    {
      field: 'segments',
      headerName: 'Segments',
      flex: 0.7,
      minWidth: 50,
      type: 'number',
    },
    {
      field: 'layer',
      headerName: 'Layer',
      flex: 1,
      minWidth: 60,
      renderCell: (params) => <span className="text-xs text-muted-foreground truncate">{params.value}</span>,
    },
  ];
}

// ============================================
// Site Column Definitions
// ============================================

function createSiteColumns(): GridColDef[] {
  return [
    {
      field: 'name',
      headerName: 'ERP Site Name',
      flex: 2,
      minWidth: 120,
      renderCell: (params) => (
        <span className="font-medium text-xs truncate" title={params.value}>{params.value}</span>
      ),
    },
    {
      field: 'nodeName',
      headerName: 'Node Name',
      flex: 1.5,
      minWidth: 100,
      renderCell: (params) => (
        <span className="font-mono text-xs truncate" title={params.value}>{params.value}</span>
      ),
    },
    {
      field: 'nodeIP',
      headerName: 'Node IP',
      flex: 1,
      minWidth: 90,
      renderCell: (params) => (
        <span className="font-mono text-xs truncate" title={params.value}>{params.value}</span>
      ),
    },
    {
      field: 'technology',
      headerName: 'Technology',
      flex: 1,
      minWidth: 70,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        const tech = (params.value as string)?.toUpperCase();
        const colorClass = tech === 'CIENA' ? 'bg-blue-500'
          : tech === 'NOKIA' ? 'bg-red-500'
          : 'bg-gray-500';
        return (
          <div className="flex items-center justify-center w-full h-full">
            <Badge className={`text-xs px-2.5 py-0.5 rounded-md font-semibold tracking-wide shadow-sm border-0 text-white ${colorClass}`}>
              {tech || 'N/A'}
            </Badge>
          </div>
        );
      },
    },
    {
      field: 'connType',
      headerName: 'Conn Type',
      flex: 1,
      minWidth: 70,
      renderCell: (params) => <span className="text-xs">{params.value || ''}</span>,
    },
    {
      field: 'lat',
      headerName: 'Lat',
      flex: 0.8,
      minWidth: 70,
      type: 'number',
      renderCell: (params) => <span className="text-xs font-mono text-muted-foreground">{params.value}</span>,
    },
    {
      field: 'lng',
      headerName: 'Lng',
      flex: 0.8,
      minWidth: 70,
      type: 'number',
      renderCell: (params) => <span className="text-xs font-mono text-muted-foreground">{params.value}</span>,
    },
  ];
}

// ============================================
// Component
// ============================================

export function FiberTable({
  routes,
  sites,
  filters,
  onFilterChange,
}: FiberTableProps) {
  const [dataTab, setDataTab] = useState<FiberDataTab>('routes');
  const [globalFilter, setGlobalFilter] = useState('');
  const [routeWidths, setRouteWidths] = useState<Record<string, number>>(() => loadColumnWidths(ROUTE_WIDTHS_KEY));
  const [siteWidths, setSiteWidths] = useState<Record<string, number>>(() => loadColumnWidths(SITE_WIDTHS_KEY));

  // Columns with stored widths
  const routeColumns = useMemo(() => {
    const cols = createRouteColumns();
    return cols.map(col => routeWidths[col.field] ? { ...col, width: routeWidths[col.field] } : col);
  }, [routeWidths]);

  const siteColumns = useMemo(() => {
    const cols = createSiteColumns();
    return cols.map(col => siteWidths[col.field] ? { ...col, width: siteWidths[col.field] } : col);
  }, [siteWidths]);

  const handleColumnResize = useCallback((params: GridColumnResizeParams) => {
    if (dataTab === 'routes') {
      setRouteWidths(prev => {
        const updated = { ...prev, [params.colDef.field]: params.width };
        saveColumnWidths(ROUTE_WIDTHS_KEY, updated);
        return updated;
      });
    } else {
      setSiteWidths(prev => {
        const updated = { ...prev, [params.colDef.field]: params.width };
        saveColumnWidths(SITE_WIDTHS_KEY, updated);
        return updated;
      });
    }
  }, [dataTab]);

  // Filter & transform route rows
  const routeRows = useMemo(() => {
    let data = routes;
    if (filters.types.length > 0) data = data.filter(r => filters.types.includes(r.type));
    if (filters.methodologies.length > 0) data = data.filter(r => filters.methodologies.includes(r.methodology));
    if (filters.linkNames.length > 0) data = data.filter(r => filters.linkNames.includes(r.linkName));
    if (filters.constructions.length > 0) data = data.filter(r => filters.constructions.includes(r.construction));
    if (filters.routeNames?.length > 0) data = data.filter(r => filters.routeNames.includes(r.routeName));

    if (globalFilter) {
      const search = globalFilter.toLowerCase();
      data = data.filter(r =>
        r.routeName?.toLowerCase().includes(search) ||
        r.linkName?.toLowerCase().includes(search) ||
        r.type?.toLowerCase().includes(search) ||
        r.methodology?.toLowerCase().includes(search) ||
        r.construction?.toLowerCase().includes(search) ||
        r.layer?.toLowerCase().includes(search)
      );
    }

    return data.map((r, i) => ({
      id: r.id || `route-${i}`,
      routeName: r.routeName,
      spanid: r.spanid || '',
      linkName: r.linkName,
      type: r.type,
      methodology: r.methodology,
      construction: r.construction,
      lengthKms: r.lengthKms,
      segments: r.coordinates?.length || 0,
      layer: r.layer,
    }));
  }, [routes, filters, globalFilter]);

  // Filter & transform site rows
  const siteRows = useMemo(() => {
    let data = sites;
    if (filters.technologies.length > 0) data = data.filter(s => filters.technologies.includes(s.technology?.toUpperCase()));
    if (filters.linkNames.length > 0) data = data.filter(s => filters.linkNames.includes(s.linkName));

    if (globalFilter) {
      const search = globalFilter.toLowerCase();
      data = data.filter(s =>
        s.name?.toLowerCase().includes(search) ||
        s.nodeName?.toLowerCase().includes(search) ||
        s.nodeIP?.toLowerCase().includes(search) ||
        s.technology?.toLowerCase().includes(search) ||
        s.connType?.toLowerCase().includes(search)
      );
    }

    return data.map((s, i) => ({
      id: s.id || `site-${i}`,
      name: s.name,
      nodeName: s.nodeName,
      nodeIP: s.nodeIP,
      technology: s.technology,
      connType: s.connType,
      lat: s.latitude?.toFixed(4) ?? s.coordinates?.[1]?.toFixed(4) ?? '',
      lng: s.longitude?.toFixed(4) ?? s.coordinates?.[0]?.toFixed(4) ?? '',
    }));
  }, [sites, filters, globalFilter]);

  // Export CSV
  const exportToCSV = useCallback(() => {
    if (dataTab === 'routes') {
      const headers = ['Route Name', 'Link Name', 'Type', 'Methodology', 'Status', 'Length (km)', 'Segments', 'Layer'];
      const csvRows = routeRows.map(r => [r.routeName, r.linkName, r.type, r.methodology, r.construction, r.lengthKms, r.segments, r.layer]);
      const csvContent = [headers.join(','), ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fiber_routes_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const headers = ['ERP Site Name', 'Node Name', 'Node IP', 'Technology', 'Conn Type', 'Lat', 'Lng'];
      const csvRows = siteRows.map(r => [r.name, r.nodeName, r.nodeIP, r.technology, r.connType, r.lat, r.lng]);
      const csvContent = [headers.join(','), ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fiber_sites_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [dataTab, routeRows, siteRows]);

  const exportToExcel = useCallback(() => {
    const rows = dataTab === 'routes' ? routeRows : siteRows;
    const headers = dataTab === 'routes'
      ? ['Route Name', 'Link Name', 'Type', 'Methodology', 'Status', 'Length (km)', 'Segments', 'Layer']
      : ['ERP Site Name', 'Node Name', 'Node IP', 'Technology', 'Conn Type', 'Lat', 'Lng'];
    const values = dataTab === 'routes'
      ? rows.map((r: any) => [r.routeName, r.linkName, r.type, r.methodology, r.construction, r.lengthKms, r.segments, r.layer])
      : rows.map((r: any) => [r.name, r.nodeName, r.nodeIP, r.technology, r.connType, r.lat, r.lng]);
    const tsvContent = [headers.join('\t'), ...values.map(row => row.join('\t'))].join('\n');
    const blob = new Blob([tsvContent], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fiber_${dataTab}_${new Date().toISOString().split('T')[0]}.xls`;
    a.click();
    URL.revokeObjectURL(url);
  }, [dataTab, routeRows, siteRows]);

  const hasActiveFilters = filters.types.length > 0 || filters.methodologies.length > 0 || 
    filters.constructions.length > 0 || filters.linkNames.length > 0 || filters.technologies.length > 0 || (filters.routeNames?.length || 0) > 0;

  // Extract unique route names and link names for dropdowns
  const uniqueRouteNames = useMemo(() => [...new Set(routes.map(r => r.routeName).filter(Boolean))].sort(), [routes]);
  const uniqueLinkNames = useMemo(() => [...new Set([...routes.map(r => r.linkName), ...sites.map(s => s.linkName)].filter(Boolean))].sort(), [routes, sites]);

  const currentRows = dataTab === 'routes' ? routeRows : siteRows;
  const currentColumns = dataTab === 'routes' ? routeColumns : siteColumns;

  return (
    <div className="flex flex-col h-full bg-background gap-2">
      {/* Top Toolbar */}
      <div className="flex-shrink-0 flex items-center gap-3 p-2 bg-muted/20 rounded-lg border border-border/50 flex-wrap">
        {/* Routes/Sites Tab Toggle */}
        <div className="bg-background/95 rounded-lg border border-border p-0.5 flex items-center">
          <ToggleGroup
            type="single"
            value={dataTab}
            onValueChange={(value) => { if (value) setDataTab(value as FiberDataTab); }}
            className="gap-0"
          >
            <ToggleGroupItem
              value="routes"
              size="sm"
              aria-label="Show routes"
              className={`h-8 px-3 text-xs font-medium transition-all rounded-r-none ${dataTab === 'routes' ? 'bg-[#b31e48] text-white shadow-md' : 'bg-transparent hover:bg-muted'}`}
            >
              <Route className="h-4 w-4 mr-1.5" />
              Routes
            </ToggleGroupItem>
            <ToggleGroupItem
              value="sites"
              size="sm"
              aria-label="Show sites"
              className={`h-8 px-3 text-xs font-medium transition-all rounded-l-none ${dataTab === 'sites' ? 'bg-[#b31e48] text-white shadow-md' : 'bg-transparent hover:bg-muted'}`}
            >
              <MapPin className="h-4 w-4 mr-1.5" />
              Sites
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Global Search */}
        <div className="relative flex-1 max-w-[280px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={dataTab === 'routes' ? 'Search routes...' : 'Search sites...'}
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-8 h-8 text-xs bg-background border-border/60"
          />
        </div>

        {/* Conditional Filters */}
        {dataTab === 'routes' ? (
          <>
            <Select
              value={filters.types.length === 1 ? filters.types[0] : 'all'}
              onValueChange={(val) => onFilterChange({ ...filters, types: val === 'all' ? [] : [val] })}
            >
              <SelectTrigger className="w-[130px] h-8 text-xs bg-background border-border/60">
                <SelectValue placeholder="Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Types</SelectItem>
                <SelectItem value="NLD" className="text-xs">NLD</SelectItem>
                <SelectItem value="METRO" className="text-xs">METRO</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.methodologies.length === 1 ? filters.methodologies[0] : 'all'}
              onValueChange={(val) => onFilterChange({ ...filters, methodologies: val === 'all' ? [] : [val] })}
            >
              <SelectTrigger className="w-[150px] h-8 text-xs bg-background border-border/60">
                <SelectValue placeholder="Methodology" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Methodology</SelectItem>
                <SelectItem value="OPGW" className="text-xs">OPGW</SelectItem>
                <SelectItem value="UG" className="text-xs">UG</SelectItem>
                <SelectItem value="AERIAL" className="text-xs">AERIAL</SelectItem>
                <SelectItem value="UTILITY" className="text-xs">UTILITY</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.constructions.length === 1 ? filters.constructions[0] : 'all'}
              onValueChange={(val) => onFilterChange({ ...filters, constructions: val === 'all' ? [] : [val] })}
            >
              <SelectTrigger className="w-[130px] h-8 text-xs bg-background border-border/60">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Status</SelectItem>
                <SelectItem value="Completed" className="text-xs">Completed</SelectItem>
                <SelectItem value="Work In Progress" className="text-xs">WIP</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.linkNames.length === 1 ? filters.linkNames[0] : 'all'}
              onValueChange={(val) => onFilterChange({ ...filters, linkNames: val === 'all' ? [] : [val] })}
            >
              <SelectTrigger className="w-[160px] h-8 text-xs bg-background border-border/60">
                <SelectValue placeholder="Link Name" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="all" className="text-xs">Link Name</SelectItem>
                {uniqueLinkNames.map((name) => (
                  <SelectItem key={name} value={name} className="text-xs">{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={(filters.routeNames?.length === 1) ? filters.routeNames[0] : 'all'}
              onValueChange={(val) => onFilterChange({ ...filters, routeNames: val === 'all' ? [] : [val] })}
            >
              <SelectTrigger className="w-[180px] h-8 text-xs bg-background border-border/60">
                <SelectValue placeholder="Route Name" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="all" className="text-xs">Route Name</SelectItem>
                {uniqueRouteNames.map((name) => (
                  <SelectItem key={name} value={name} className="text-xs">{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        ) : (
          <>
            <Select
              value={filters.technologies.length === 1 ? filters.technologies[0] : 'all'}
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
              value={filters.linkNames.length === 1 ? filters.linkNames[0] : 'all'}
              onValueChange={(val) => onFilterChange({ ...filters, linkNames: val === 'all' ? [] : [val] })}
            >
              <SelectTrigger className="w-[160px] h-8 text-xs bg-background border-border/60">
                <SelectValue placeholder="Link Name" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="all" className="text-xs">Link Name</SelectItem>
                {uniqueLinkNames.map((name) => (
                  <SelectItem key={name} value={name} className="text-xs">{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}

        {/* Clear button - always visible */}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2.5 text-xs gap-1.5"
          onClick={() => { onFilterChange(DEFAULT_FIBER_FILTERS); setGlobalFilter(''); }}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Clear
        </Button>

        <div className="flex-1" />

        <div className="text-xs text-muted-foreground">
          {currentRows.length} {dataTab}
        </div>

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

      {/* MUI DataGrid */}
      <div className="flex-1 min-h-0 border border-border/60 rounded-lg shadow-sm overflow-hidden">
        <DataGrid
          rows={currentRows}
          columns={currentColumns}
          initialState={{
            pagination: { paginationModel: { pageSize: 25, page: 0 } },
          }}
          pageSizeOptions={[10, 25, 50, 100]}
          disableRowSelectionOnClick
          density="compact"
          onColumnWidthChange={handleColumnResize}
          slots={{
            toolbar: CustomToolbar,
          }}
          sx={dataGridSx}
        />
      </div>
    </div>
  );
}
