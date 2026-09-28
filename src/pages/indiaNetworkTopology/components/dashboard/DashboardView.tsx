// ============================================
// Dashboard View Component
// ============================================

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DashboardFilters } from './DashboardFilters';
import { Button } from '../../../../components/ui/button';
import { RotateCcw } from 'lucide-react';
import { TypeWiseCapacityTable } from './TypeWiseCapacityTable';
import { UtilizationPieChart } from './UtilizationPieChart';
import { CustomerPieChart } from './CustomerPieChart';
import { CapacitySummaryTable } from './CapacitySummaryTable';
import { CapacityBarChart } from './CapacityBarChart';
import { TopCustomersBarChart } from './TopCustomersBarChart';
import { DashboardFilterState, DEFAULT_DASHBOARD_FILTERS } from './types';
import { ViewToggle, ViewMode } from '../controls/ViewToggle';
import { DashboardDomainSelector, DashboardDomainView } from './DashboardDomainSelector';
import { LastCaptureTime } from './LastCaptureTime';
import {
  fetchSectorWiseCapacity,
  fetchTotalCapacitySummary,
  fetchTopCustomers,
} from '../../services/dashboardApi';
import { Loader2 } from 'lucide-react';

interface DashboardViewProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  selectedDomain?: DashboardDomainView;
  onDomainChange?: (domain: DashboardDomainView) => void;
}

export function DashboardView({ 
  currentView, 
  onViewChange,
  selectedDomain = 'IP_OPTICAL',
  onDomainChange,
}: DashboardViewProps) {
  const [filters, setFilters] = useState<DashboardFilterState>(DEFAULT_DASHBOARD_FILTERS);

  // Fetch all 3 datasets from live APIs
  const { data: cityData = [], isLoading: loadingCity } = useQuery({
    queryKey: ['dashboard-sector-wise-capacity'],
    queryFn: fetchSectorWiseCapacity,
    staleTime: 60000,
  });

  const { data: typeData = [], isLoading: loadingType } = useQuery({
    queryKey: ['dashboard-total-capacity-summary'],
    queryFn: fetchTotalCapacitySummary,
    staleTime: 60000,
  });

  const { data: customerData = [], isLoading: loadingCustomers } = useQuery({
    queryKey: ['dashboard-top-customers'],
    queryFn: fetchTopCustomers,
    staleTime: 60000,
  });

  const isLoading = loadingCity || loadingType || loadingCustomers;

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Loading dashboard data…</span>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col p-3 gap-2 overflow-hidden bg-background">
      {/* Top Bar */}
      <div className="flex-shrink-0 flex items-center gap-4">
        {onDomainChange && (
          <DashboardDomainSelector 
            selectedDomain={selectedDomain || 'IP_OPTICAL'}
            onDomainChange={onDomainChange}
          />
        )}
        <div className="flex-1 flex items-center gap-3">
          <DashboardFilters 
            filters={filters} 
            onFilterChange={setFilters}
            cityData={cityData}
          />
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setFilters(DEFAULT_DASHBOARD_FILTERS)}
            className="h-8 px-2.5 text-xs gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Clear
          </Button>
        </div>
        <LastCaptureTime domain="IP_OPTICAL" />
        <ViewToggle 
          currentView={currentView} 
          onViewChange={onViewChange} 
        />
      </div>

      {/* Main Content: 50-50 Split */}
      <div className="flex-1 grid grid-cols-2 gap-2 min-h-0">
        {/* Left Column: Tables */}
        <div className="flex flex-col gap-2 min-h-0">
          <div className="shrink-0 h-[180px]">
            <TypeWiseCapacityTable data={typeData} filters={filters} />
          </div>
          <div className="flex-1 min-h-0">
            <CapacitySummaryTable data={cityData} filters={filters} />
          </div>
        </div>

        {/* Right Column: Charts */}
        <div className="flex flex-col gap-2 min-h-0">
          <div className="flex-1 grid grid-cols-2 gap-2 min-h-[180px]">
            <UtilizationPieChart data={typeData} filters={filters} />
            <CustomerPieChart data={typeData} filters={filters} />
          </div>
          <div className="flex-1 min-h-0 min-h-[180px]">
            <CapacityBarChart data={cityData} filters={filters} />
          </div>
          <div className="flex-1 min-h-0 min-h-[180px]">
            <TopCustomersBarChart data={customerData} filters={filters} />
          </div>
        </div>
      </div>
    </div>
  );
}
