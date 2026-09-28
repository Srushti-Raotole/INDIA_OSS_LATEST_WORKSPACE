import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { ToggleGroup, ToggleGroupItem } from '../../../../components/ui/toggle-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../../components/ui/dialog';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LabelList,
} from 'recharts';
import { Route, MapPin, RotateCcw, Maximize2, Minimize2, Download } from 'lucide-react';
import type { FiberRoute, FiberSite } from '../../types/fiberTypes';
import { getStatusColor, TECHNOLOGY_COLORS_HEX } from '../../utils/technologyColors';
import { ViewToggle, ViewMode } from '../controls/ViewToggle';
import { DashboardDomainSelector, DashboardDomainView } from './DashboardDomainSelector';
import { LastCaptureTime } from './LastCaptureTime';
import { exportToExcel } from '../../utils/exportExcel';

// ============================================
// Types
// ============================================

interface FiberDashboardViewProps {
  routes: FiberRoute[];
  sites: FiberSite[];
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  selectedDomain: DashboardDomainView;
  onDomainChange: (domain: DashboardDomainView) => void;
}

interface FiberDashboardFilters {
  type: string;
  methodology: string;
  construction: string;
  technology: string;
  linkName: string;
}

const DEFAULT_FILTERS: FiberDashboardFilters = {
  type: 'ALL',
  methodology: 'ALL',
  construction: 'ALL',
  technology: 'ALL',
  linkName: 'ALL',
};

// ============================================
// Chart Colors
// ============================================

const CHART_COLORS = {
  nld: '#3b82f6',           // Blue
  metro: '#a855f7',         // Purple
  opgw: '#10b981',          // Emerald
  ug: '#f97316',            // Orange
  aerial: '#51aee4',        // Light blue
  utility: '#ad4ade',       // Purple
  ciena: TECHNOLOGY_COLORS_HEX.CIENA,
  nokia: TECHNOLOGY_COLORS_HEX.NOKIA,
};

// ============================================
// Fullscreen Dialog Component
// ============================================

interface FullscreenDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function FullscreenDialog({ open, onClose, title, children, isTable = false }: FullscreenDialogProps & { isTable?: boolean }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between flex-shrink-0">
          <DialogTitle className="text-foreground">{title}</DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <Minimize2 className="h-4 w-4" />
          </Button>
        </DialogHeader>
        {isTable ? (
          <div 
            className="flex-1 min-h-0 border border-border/60 rounded-lg shadow-sm"
            style={{ 
              overflowX: 'auto',
              overflowY: 'auto',
              maxHeight: '70vh',
            }}
          >
            {children}
          </div>
        ) : (
          <div className="flex-1 min-h-[500px]">
            {children}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Component
// ============================================

export function FiberDashboardView({
  routes,
  sites,
  currentView,
  onViewChange,
  selectedDomain,
  onDomainChange,
}: FiberDashboardViewProps) {
  // Dashboard-local filters (separate from map/table filters)
  const [filters, setFilters] = useState<FiberDashboardFilters>(DEFAULT_FILTERS);
  
  // Fullscreen states
  const [fullscreenRoutesTable, setFullscreenRoutesTable] = useState(false);
  const [fullscreenSitesTable, setFullscreenSitesTable] = useState(false);
  const [fullscreenConstruction, setFullscreenConstruction] = useState(false);
  const [fullscreenTechnology, setFullscreenTechnology] = useState(false);
  const [fullscreenRoutesByType, setFullscreenRoutesByType] = useState(false);
  const [fullscreenRoutesByMethod, setFullscreenRoutesByMethod] = useState(false);
  const [fullscreenLengthByType, setFullscreenLengthByType] = useState(false);
  const [fullscreenLengthByMethod, setFullscreenLengthByMethod] = useState(false);

  // Unique link names for filter dropdown
  const uniqueLinkNames = useMemo(() => {
    const routeLinkNames = routes.map(r => r.linkName).filter(Boolean);
    const siteLinkNames = sites.map(s => s.linkName).filter(Boolean);
    return [...new Set([...routeLinkNames, ...siteLinkNames])].sort();
  }, [routes, sites]);

  // Apply filters to routes
  const filteredRoutes = useMemo(() => {
    return routes.filter(route => {
      if (filters.type !== 'ALL' && route.type !== filters.type) return false;
      if (filters.methodology !== 'ALL' && route.methodology?.toUpperCase() !== filters.methodology) return false;
      if (filters.construction !== 'ALL' && route.construction !== filters.construction) return false;
      if (filters.linkName !== 'ALL' && route.linkName !== filters.linkName) return false;
      return true;
    });
  }, [routes, filters]);

  // Apply filters to sites
  const filteredSites = useMemo(() => {
    return sites.filter(site => {
      if (filters.technology !== 'ALL' && site.technology?.toUpperCase() !== filters.technology) return false;
      if (filters.linkName !== 'ALL' && site.linkName !== filters.linkName) return false;
      return true;
    });
  }, [sites, filters]);

  // Calculate statistics from filtered data
  const stats = useMemo(() => {
    const totalRoutes = filteredRoutes.length;
    const totalSites = filteredSites.length;
    const totalLengthKm = filteredRoutes.reduce((sum, r) => sum + (r.lengthKms || 0), 0);
    
    const completedRoutes = filteredRoutes.filter(r => r.construction?.toLowerCase() === 'completed').length;
    const wipRoutes = filteredRoutes.filter(r => r.construction?.toLowerCase() === 'work in progress').length;
    
    const nldRoutes = filteredRoutes.filter(r => r.type?.toUpperCase() === 'NLD');
    const metroRoutes = filteredRoutes.filter(r => r.type?.toUpperCase() === 'METRO');
    
    const opgwRoutes = filteredRoutes.filter(r => r.methodology?.toUpperCase() === 'OPGW');
    const ugRoutes = filteredRoutes.filter(r => r.methodology?.toUpperCase() === 'UG');
    const aerialRoutes = filteredRoutes.filter(r => r.methodology?.toUpperCase() === 'AERIAL');
    const utilityRoutes = filteredRoutes.filter(r => r.methodology?.toUpperCase() === 'UTILITY');
    
    const cienaSites = filteredSites.filter(s => s.technology?.toUpperCase() === 'CIENA').length;
    const nokiaSites = filteredSites.filter(s => s.technology?.toUpperCase() === 'NOKIA').length;
    
    return {
      totalRoutes,
      totalSites,
      totalLengthKm,
      completedRoutes,
      wipRoutes,
      nldCount: nldRoutes.length,
      metroCount: metroRoutes.length,
      nldLength: nldRoutes.reduce((sum, r) => sum + (r.lengthKms || 0), 0),
      metroLength: metroRoutes.reduce((sum, r) => sum + (r.lengthKms || 0), 0),
      opgwCount: opgwRoutes.length,
      ugCount: ugRoutes.length,
      aerialCount: aerialRoutes.length,
      utilityCount: utilityRoutes.length,
      opgwLength: opgwRoutes.reduce((sum, r) => sum + (r.lengthKms || 0), 0),
      ugLength: ugRoutes.reduce((sum, r) => sum + (r.lengthKms || 0), 0),
      aerialLength: aerialRoutes.reduce((sum, r) => sum + (r.lengthKms || 0), 0),
      utilityLength: utilityRoutes.reduce((sum, r) => sum + (r.lengthKms || 0), 0),
      cienaSites,
      nokiaSites,
    };
  }, [filteredRoutes, filteredSites]);

  // Pie chart data — construction is dynamic from data
  const constructionPieData = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    filteredRoutes.forEach(r => {
      const s = r.construction?.trim() || 'Unknown';
      statusCounts[s] = (statusCounts[s] || 0) + 1;
    });
    return Object.entries(statusCounts).map(([name, value]) => ({
      name,
      value,
      color: getStatusColor(name),
    }));
  }, [filteredRoutes]);

  const technologyPieData = useMemo(() => [
    { name: 'CIENA', value: stats.cienaSites, color: CHART_COLORS.ciena },
    { name: 'NOKIA', value: stats.nokiaSites, color: CHART_COLORS.nokia },
  ], [stats]);

  const typePieData = useMemo(() => [
    { name: 'NLD', value: stats.nldCount, color: CHART_COLORS.nld },
    { name: 'METRO', value: stats.metroCount, color: CHART_COLORS.metro },
  ], [stats]);

  const methodologyPieData = useMemo(() => [
    { name: 'OPGW', value: stats.opgwCount, color: CHART_COLORS.opgw },
    { name: 'UG', value: stats.ugCount, color: CHART_COLORS.ug },
    { name: 'AERIAL', value: stats.aerialCount, color: CHART_COLORS.aerial },
    { name: 'UTILITY', value: stats.utilityCount, color: CHART_COLORS.utility },
  ], [stats]);

  // Bar chart data
  const typeBarData = useMemo(() => [
    { name: 'NLD', value: Math.round(stats.nldLength), fill: CHART_COLORS.nld },
    { name: 'METRO', value: Math.round(stats.metroLength), fill: CHART_COLORS.metro },
  ], [stats]);

  const methodologyBarData = useMemo(() => [
    { name: 'OPGW', value: Math.round(stats.opgwLength), fill: CHART_COLORS.opgw },
    { name: 'UG', value: Math.round(stats.ugLength), fill: CHART_COLORS.ug },
    { name: 'AERIAL', value: Math.round(stats.aerialLength), fill: CHART_COLORS.aerial },
    { name: 'UTILITY', value: Math.round(stats.utilityLength), fill: CHART_COLORS.utility },
  ], [stats]);

  // Reset all filters
  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  // Custom pie chart label renderer - shows outside with value and percentage
  const renderPieLabel = ({ cx, cy, midAngle, outerRadius, name, value, percent }: any) => {
    if (value === 0) return null;
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 28;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    
    return (
      <text
        x={x}
        y={y}
        fill="hsl(var(--foreground))"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={13}
        fontWeight={700}
      >
        {`${name} ${value} (${(percent * 100).toFixed(0)}%)`}
      </text>
    );
  };

  // Render bar value label
  const renderBarLabel = (props: any) => {
    const { x, y, width, value } = props;
    return (
      <text
        x={x + width / 2}
        y={y - 5}
        fill="hsl(var(--foreground))"
        textAnchor="middle"
        fontSize={12}
        fontWeight={700}
      >
        {value.toLocaleString()} km
      </text>
    );
  };

  // ============================================
  // Chart Components (reusable for normal & fullscreen)
  // ============================================

  const ConstructionPieChart = ({ height = "100%" }: { height?: string | number }) => (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={constructionPieData}
          cx="50%"
          cy="50%"
          innerRadius="20%"
          outerRadius="55%"
          paddingAngle={2}
          dataKey="value"
          labelLine={true}
          label={renderPieLabel}
        >
          {constructionPieData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => [`${value} routes`, 'Count']} />
        <Legend 
          verticalAlign="bottom" 
          height={24}
          formatter={(value) => <span className="text-xs">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );

  const TechnologyPieChart = ({ height = "100%" }: { height?: string | number }) => (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={technologyPieData}
          cx="50%"
          cy="50%"
          innerRadius="20%"
          outerRadius="55%"
          paddingAngle={2}
          dataKey="value"
          labelLine={true}
          label={renderPieLabel}
        >
          {technologyPieData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => [`${value} sites`, 'Count']} />
        <Legend 
          verticalAlign="bottom" 
          height={24}
          formatter={(value) => <span className="text-xs">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );

  const RoutesByTypePieChart = ({ height = "100%" }: { height?: string | number }) => (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={typePieData}
          cx="50%"
          cy="50%"
          innerRadius="20%"
          outerRadius="55%"
          paddingAngle={2}
          dataKey="value"
          labelLine={true}
          label={renderPieLabel}
        >
          {typePieData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => [`${value} routes`, 'Count']} />
        <Legend 
          verticalAlign="bottom" 
          height={24}
          formatter={(value) => <span className="text-xs">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );

  const RoutesByMethodPieChart = ({ height = "100%" }: { height?: string | number }) => (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={methodologyPieData}
          cx="50%"
          cy="50%"
          innerRadius="20%"
          outerRadius="55%"
          paddingAngle={2}
          dataKey="value"
          labelLine={true}
          label={renderPieLabel}
        >
          {methodologyPieData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => [`${value} routes`, 'Count']} />
        <Legend 
          verticalAlign="bottom" 
          height={24}
          formatter={(value) => <span className="text-xs">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );

  const LengthByTypeBarChart = ({ height = "100%" }: { height?: string | number }) => (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={typeBarData} margin={{ top: 25, right: 20, left: 20, bottom: 5 }}>
        <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 600 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip 
          contentStyle={{ fontSize: 11 }}
          formatter={(value: number) => [`${value.toLocaleString()} km`, 'Length']}
        />
        <Bar dataKey="value" name="Length (km)" radius={[4, 4, 0, 0]}>
          {typeBarData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
          <LabelList dataKey="value" content={renderBarLabel} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  const LengthByMethodBarChart = ({ height = "100%" }: { height?: string | number }) => (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={methodologyBarData} margin={{ top: 25, right: 20, left: 20, bottom: 5 }}>
        <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 600 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip 
          contentStyle={{ fontSize: 11 }}
          formatter={(value: number) => [`${value.toLocaleString()} km`, 'Length']}
        />
        <Bar dataKey="value" name="Length (km)" radius={[4, 4, 0, 0]}>
          {methodologyBarData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
          <LabelList dataKey="value" content={renderBarLabel} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  // DataGrid sx matching other tables
  const tableGridSx = {
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
    '& .MuiDataGrid-footerContainer': { display: 'none' },
    '& .MuiDataGrid-scrollbar--vertical': { display: 'none' },
    '& .MuiDataGrid-scrollbar--horizontal': { display: 'none' },
    '& .MuiDataGrid-columnHeaders': {
      backgroundColor: 'hsl(var(--primary) / 0.12)',
      borderBottom: '2px solid hsl(var(--primary) / 0.3)',
      minHeight: '36px !important',
      maxHeight: '36px !important',
    },
    '& .MuiDataGrid-columnHeader': {
      color: 'hsl(var(--primary))',
      fontWeight: 700,
      fontSize: '0.7rem',
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
    },
    '& .MuiDataGrid-columnHeaderTitleContainer': {
      justifyContent: 'center',
    },
    '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700 },
    '& .MuiDataGrid-cell': {
      color: 'hsl(var(--foreground))',
      borderBottom: '1px solid hsl(var(--border) / 0.12)',
      fontSize: '0.75rem',
      padding: '2px 8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '32px !important',
      maxHeight: '32px !important',
    },
    '& .MuiDataGrid-row': {
      minHeight: '32px !important',
      maxHeight: '32px !important',
    },
    '& .MuiDataGrid-cell--withRenderer': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    '& .MuiDataGrid-row:hover': { backgroundColor: 'hsl(var(--muted) / 0.3)' },
    '& .MuiDataGrid-columnSeparator': { color: 'hsl(var(--border))' },
    '& .MuiDataGrid-sortIcon': { color: 'hsl(var(--primary))' },
  } as const;

  const routeColumns: GridColDef[] = useMemo(() => [
    {
      field: 'routeName',
      headerName: 'Route Name',
      flex: 2,
      minWidth: 100,
      renderCell: (params) => <span className="font-medium text-xs truncate" title={params.value}>{params.value}</span>,
    },
    {
      field: 'linkName',
      headerName: 'Link Name',
      flex: 1.2,
      minWidth: 80,
      renderCell: (params) => <span className="font-mono text-xs truncate" title={params.value}>{params.value || '-'}</span>,
    },
    {
      field: 'type',
      headerName: 'Type',
      flex: 0.8,
      minWidth: 60,
      align: 'center' as const,
      headerAlign: 'center' as const,
      renderCell: (params) => {
        const colorClass = params.value === 'NLD' ? 'bg-blue-500' : 'bg-purple-500';
        return (
          <div className="flex items-center justify-center w-full h-full">
            <Badge className={`text-xs px-2.5 py-0.5 rounded-md font-semibold tracking-wide shadow-sm border-0 text-white ${colorClass}`}>
              {params.value || '-'}
            </Badge>
          </div>
        );
      },
    },
    {
      field: 'methodology',
      headerName: 'Method',
      flex: 1,
      minWidth: 70,
      align: 'center' as const,
      headerAlign: 'center' as const,
      renderCell: (params) => {
        const m = params.value;
        const colorClass = m === 'OPGW' ? 'bg-emerald-600' : m === 'UG' ? 'bg-orange-600' : m === 'AERIAL' ? 'bg-sky-500' : m === 'UTILITY' ? 'bg-purple-600' : 'bg-muted-foreground';
        return (
          <div className="flex items-center justify-center w-full h-full">
            <Badge className={`text-xs px-2.5 py-0.5 rounded-md font-semibold tracking-wide shadow-sm border-0 text-white ${colorClass}`}>
              {m || '-'}
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
      type: 'number' as const,
      align: 'center' as const,
      headerAlign: 'center' as const,
      renderCell: (params) => <span className="text-xs font-medium text-primary">{(params.value as number)?.toFixed(2) ?? '-'}</span>,
    },
    {
      field: 'construction',
      headerName: 'Status',
      flex: 0.8,
      minWidth: 60,
      align: 'center' as const,
      headerAlign: 'center' as const,
      renderCell: (params) => {
        const statusVal = params.value as string || 'Unknown';
        const color = getStatusColor(statusVal);
        return (
          <div className="flex items-center justify-center w-full h-full">
            <Badge variant="outline" className="text-xs px-2.5 py-0.5 rounded-md font-semibold tracking-wide shadow-sm" style={{ borderColor: color, color, backgroundColor: `${color}15` }}>
              {statusVal}
            </Badge>
          </div>
        );
      },
    },
  ], []);

  const routeRows = useMemo(() => filteredRoutes.map((r) => ({ ...r })), [filteredRoutes]);

  const siteColumns: GridColDef[] = useMemo(() => [
    {
      field: 'name',
      headerName: 'Site Name',
      flex: 2,
      minWidth: 100,
      renderCell: (params) => <span className="font-medium text-xs truncate" title={params.value}>{params.value}</span>,
    },
    {
      field: 'linkName',
      headerName: 'Link Name',
      flex: 1.2,
      minWidth: 80,
      renderCell: (params) => <span className="font-mono text-xs truncate" title={params.value}>{params.value || '-'}</span>,
    },
    {
      field: 'technology',
      headerName: 'Technology',
      flex: 1,
      minWidth: 70,
      align: 'center' as const,
      headerAlign: 'center' as const,
      renderCell: (params) => {
        const tech = (params.value as string)?.toUpperCase();
        const colorClass = tech === 'CIENA' ? 'bg-blue-500' : tech === 'NOKIA' ? 'bg-cyan-600' : 'bg-gray-500';
        return (
          <div className="flex items-center justify-center w-full h-full">
            <Badge className={`text-xs px-2.5 py-0.5 rounded-md font-semibold tracking-wide shadow-sm border-0 text-white ${colorClass}`}>
              {tech || '-'}
            </Badge>
          </div>
        );
      },
    },
    {
      field: 'connType',
      headerName: 'Connection',
      flex: 1,
      minWidth: 70,
      align: 'center' as const,
      headerAlign: 'center' as const,
      renderCell: (params) => <span className="text-xs">{params.value || '-'}</span>,
    },
    {
      field: 'coordinates',
      headerName: 'Coordinates',
      flex: 1.2,
      minWidth: 100,
      align: 'center' as const,
      headerAlign: 'center' as const,
      renderCell: (params) => {
        const coords = params.value as number[] | undefined;
        return <span className="text-xs font-mono text-muted-foreground">{coords ? `${coords[1]?.toFixed(4)}, ${coords[0]?.toFixed(4)}` : '-'}</span>;
      },
    },
  ], []);

  const siteRows = useMemo(() => filteredSites.map((s) => ({ ...s })), [filteredSites]);

  const handleDownloadRoutes = () => {
    exportToExcel(
      filteredRoutes as any[],
      [
        { key: 'linkName', header: 'Link Name' },
        { key: 'type', header: 'Type' },
        { key: 'methodology', header: 'Methodology' },
        { key: 'lengthKms', header: 'Length (km)', format: (v: number) => v != null ? Number(v.toFixed(2)) : '' },
        { key: 'construction', header: 'Status' },
      ],
      'fiber_routes',
      'Fiber Routes',
    );
  };

  const handleDownloadSites = () => {
    exportToExcel(
      filteredSites as any[],
      [
        { key: 'name', header: 'Site Name' },
        { key: 'linkName', header: 'Link Name' },
        { key: 'technology', header: 'Technology' },
        { key: 'connType', header: 'Connection' },
        { key: 'coordinates', header: 'Coordinates', format: (c: number[] | undefined) => c ? `${c[1]?.toFixed(4)}, ${c[0]?.toFixed(4)}` : '' },
      ],
      'fiber_sites',
      'Fiber Sites',
    );
  };


  const RoutesTableContent = () => (
    <DataGrid
      rows={routeRows}
      columns={routeColumns}
      density="compact"
      disableRowSelectionOnClick
      disableColumnMenu
      hideFooter
      rowHeight={32}
      sx={tableGridSx}
    />
  );

  const SitesTableContent = () => (
    <DataGrid
      rows={siteRows}
      columns={siteColumns}
      density="compact"
      disableRowSelectionOnClick
      disableColumnMenu
      hideFooter
      rowHeight={32}
      sx={tableGridSx}
    />
  );

  return (
    <div className="h-full w-full flex flex-col p-3 gap-2 overflow-hidden bg-background">
      {/* ========== Top Bar: Domain Selector + View Toggle ========== */}
      <div className="flex-shrink-0 flex items-center gap-4">
        <div className="flex-1 flex items-center gap-3">
          <DashboardDomainSelector
            selectedDomain={selectedDomain}
            onDomainChange={onDomainChange}
          />
          
          {/* Route Filters */}
          <div className="flex items-center gap-3">
            {/* Type Filter */}
            <ToggleGroup 
              type="single" 
              value={filters.type} 
              onValueChange={(v) => v && setFilters(f => ({ ...f, type: v as any }))}
              className="bg-muted rounded-lg p-0.5"
            >
              <ToggleGroupItem 
                value="ALL" 
                size="sm"
                className={`text-xs px-3 h-8 ${filters.type === 'ALL' ? 'bg-[#b31e48] text-white shadow-sm' : ''}`}
              >
                ALL
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="NLD" 
                size="sm"
                className={`text-xs px-3 h-8 ${filters.type === 'NLD' ? 'bg-[#b31e48] text-white shadow-sm' : ''}`}
              >
                NLD
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="METRO" 
                size="sm"
                className={`text-xs px-3 h-8 ${filters.type === 'METRO' ? 'bg-[#b31e48] text-white shadow-sm' : ''}`}
              >
                METRO
              </ToggleGroupItem>
            </ToggleGroup>

            {/* Methodology Filter */}
            <Select value={filters.methodology} onValueChange={(v) => setFilters(f => ({ ...f, methodology: v as any }))}>
              <SelectTrigger className="w-[150px] h-8 text-xs bg-background border-border/60">
                <SelectValue placeholder="Methodology" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">Methodology</SelectItem>
                <SelectItem value="OPGW" className="text-xs">OPGW</SelectItem>
                <SelectItem value="UG" className="text-xs">UG</SelectItem>
                <SelectItem value="AERIAL" className="text-xs">AERIAL</SelectItem>
                <SelectItem value="UTILITY" className="text-xs">UTILITY</SelectItem>
              </SelectContent>
            </Select>

            {/* Construction Filter — Dynamic from data */}
            <Select value={filters.construction} onValueChange={(v) => setFilters(f => ({ ...f, construction: v }))}>
              <SelectTrigger className="w-[160px] h-8 text-xs bg-background border-border/60">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">Status</SelectItem>
                {[...new Set(routes.map(r => r.construction).filter(Boolean))].sort().map(s => (
                  <SelectItem key={s} value={s} className="text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: getStatusColor(s) }} />
                      {s}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Technology Filter (for Sites) */}
            <Select value={filters.technology} onValueChange={(v) => setFilters(f => ({ ...f, technology: v as any }))}>
              <SelectTrigger className="w-[150px] h-8 text-xs bg-background border-border/60">
                <SelectValue placeholder="Technology" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">Technology</SelectItem>
                <SelectItem value="CIENA" className="text-xs">CIENA</SelectItem>
                <SelectItem value="NOKIA" className="text-xs">NOKIA</SelectItem>
              </SelectContent>
            </Select>

            {/* Link Name Filter */}
            <Select value={filters.linkName} onValueChange={(v) => setFilters(f => ({ ...f, linkName: v }))}>
              <SelectTrigger className="w-[160px] h-8 text-xs bg-background border-border/60">
                <SelectValue placeholder="Link Name" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                <SelectItem value="ALL" className="text-xs">Link Name</SelectItem>
                {uniqueLinkNames.map((name) => (
                  <SelectItem key={name} value={name} className="text-xs">{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleResetFilters}
              className="h-8 px-2.5 text-xs gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Clear
            </Button>
          </div>
        </div>
        
        <LastCaptureTime domain="FIBER" />
        <ViewToggle
          currentView={currentView}
          onViewChange={onViewChange}
        />
      </div>

      {/* ========== Main Content: 50-50 Split ========== */}
      <div className="flex-1 grid grid-cols-2 gap-2 min-h-0">
        
        {/* ========== Left Column: Two Tables ========== */}
        <div className="flex flex-col gap-2 min-h-0">
          {/* Routes Table */}
          <Card className="flex-1 min-h-0 flex flex-col">
            <CardHeader className="py-2 px-3 border-b border-border/50 bg-primary/10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Route className="h-4 w-4" />
                  Fiber Routes ({filteredRoutes.length})
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    Total: {stats.totalLengthKm.toFixed(0)} km
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    title="Download as Excel"
                    onClick={handleDownloadRoutes}
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setFullscreenRoutesTable(true)}
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 min-h-0">
              <RoutesTableContent />
            </CardContent>
          </Card>

          {/* Sites Table */}
          <Card className="flex-1 min-h-0 flex flex-col">
            <CardHeader className="py-2 px-3 border-b border-border/50 bg-primary/10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Fiber Sites ({filteredSites.length})
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    title="Download as Excel"
                    onClick={handleDownloadSites}
                  >
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setFullscreenSitesTable(true)}
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 min-h-0">
              <SitesTableContent />
            </CardContent>
          </Card>
        </div>

        {/* ========== Right Column: Charts (3 rows of 2) ========== */}
        <div className="flex flex-col gap-2 min-h-0">
          {/* Row 1: Construction Progress | Technology */}
          <div className="flex-1 grid grid-cols-2 gap-2 min-h-[100px]">
            <Card className="bg-card border-border/50 flex flex-col">
              <CardHeader className="py-1.5 px-3 border-b border-border/50 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-medium">Construction Progress</CardTitle>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setFullscreenConstruction(true)}>
                  <Maximize2 className="h-3 w-3" />
                </Button>
              </CardHeader>
              <CardContent className="flex-1 p-1">
                <ConstructionPieChart />
              </CardContent>
            </Card>

            <Card className="bg-card border-border/50 flex flex-col">
              <CardHeader className="py-1.5 px-3 border-b border-border/50 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-medium">Technology (Sites)</CardTitle>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setFullscreenTechnology(true)}>
                  <Maximize2 className="h-3 w-3" />
                </Button>
              </CardHeader>
              <CardContent className="flex-1 p-1">
                <TechnologyPieChart />
              </CardContent>
            </Card>
          </div>

          {/* Row 2: Routes by Type | Routes by Methodology */}
          <div className="flex-1 grid grid-cols-2 gap-2 min-h-[100px]">
            <Card className="bg-card border-border/50 flex flex-col">
              <CardHeader className="py-1.5 px-3 border-b border-border/50 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-medium">Routes by Type</CardTitle>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setFullscreenRoutesByType(true)}>
                  <Maximize2 className="h-3 w-3" />
                </Button>
              </CardHeader>
              <CardContent className="flex-1 p-1">
                <RoutesByTypePieChart />
              </CardContent>
            </Card>

            <Card className="bg-card border-border/50 flex flex-col">
              <CardHeader className="py-1.5 px-3 border-b border-border/50 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-medium">Routes by Methodology</CardTitle>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setFullscreenRoutesByMethod(true)}>
                  <Maximize2 className="h-3 w-3" />
                </Button>
              </CardHeader>
              <CardContent className="flex-1 p-1">
                <RoutesByMethodPieChart />
              </CardContent>
            </Card>
          </div>

          {/* Row 3: Length by Type | Length by Methodology (Bar Charts) */}
          <div className="flex-1 grid grid-cols-2 gap-2 min-h-[100px]">
            <Card className="bg-card border-border/50 flex flex-col">
              <CardHeader className="py-1.5 px-3 border-b border-border/50 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-medium">Length by Type (km)</CardTitle>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setFullscreenLengthByType(true)}>
                  <Maximize2 className="h-3 w-3" />
                </Button>
              </CardHeader>
              <CardContent className="flex-1 p-2">
                <LengthByTypeBarChart />
              </CardContent>
            </Card>

            <Card className="bg-card border-border/50 flex flex-col">
              <CardHeader className="py-1.5 px-3 border-b border-border/50 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-medium">Length by Methodology (km)</CardTitle>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setFullscreenLengthByMethod(true)}>
                  <Maximize2 className="h-3 w-3" />
                </Button>
              </CardHeader>
              <CardContent className="flex-1 p-2">
                <LengthByMethodBarChart />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* ========== Fullscreen Dialogs ========== */}
      
      {/* Routes Table Fullscreen */}
      <FullscreenDialog
        open={fullscreenRoutesTable}
        onClose={() => setFullscreenRoutesTable(false)}
        title={`Fiber Routes (${filteredRoutes.length}) - Total: ${stats.totalLengthKm.toFixed(0)} km`}
        isTable
      >
        <RoutesTableContent />
      </FullscreenDialog>

      {/* Sites Table Fullscreen */}
      <FullscreenDialog
        open={fullscreenSitesTable}
        onClose={() => setFullscreenSitesTable(false)}
        title={`Fiber Sites (${filteredSites.length})`}
        isTable
      >
        <SitesTableContent />
      </FullscreenDialog>

      {/* Construction Progress Fullscreen */}
      <FullscreenDialog
        open={fullscreenConstruction}
        onClose={() => setFullscreenConstruction(false)}
        title="Construction Progress"
      >
        <ConstructionPieChart height={450} />
      </FullscreenDialog>

      {/* Technology Fullscreen */}
      <FullscreenDialog
        open={fullscreenTechnology}
        onClose={() => setFullscreenTechnology(false)}
        title="Technology Distribution (Sites)"
      >
        <TechnologyPieChart height={450} />
      </FullscreenDialog>

      {/* Routes by Type Fullscreen */}
      <FullscreenDialog
        open={fullscreenRoutesByType}
        onClose={() => setFullscreenRoutesByType(false)}
        title="Routes by Type"
      >
        <RoutesByTypePieChart height={450} />
      </FullscreenDialog>

      {/* Routes by Methodology Fullscreen */}
      <FullscreenDialog
        open={fullscreenRoutesByMethod}
        onClose={() => setFullscreenRoutesByMethod(false)}
        title="Routes by Methodology"
      >
        <RoutesByMethodPieChart height={450} />
      </FullscreenDialog>

      {/* Length by Type Fullscreen */}
      <FullscreenDialog
        open={fullscreenLengthByType}
        onClose={() => setFullscreenLengthByType(false)}
        title="Length by Type (km)"
      >
        <LengthByTypeBarChart height={450} />
      </FullscreenDialog>

      {/* Length by Methodology Fullscreen */}
      <FullscreenDialog
        open={fullscreenLengthByMethod}
        onClose={() => setFullscreenLengthByMethod(false)}
        title="Length by Methodology (km)"
      >
        <LengthByMethodBarChart height={450} />
      </FullscreenDialog>
    </div>
  );
}
