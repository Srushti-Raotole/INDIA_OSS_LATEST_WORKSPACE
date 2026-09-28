// ============================================
// Dashboard Filters Component
// ============================================

import { useMemo } from 'react';
import { ToggleGroup, ToggleGroupItem } from '../../../../components/ui/toggle-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
import { CityWiseCapacity, DashboardFilterState } from './types';

interface DashboardFiltersProps {
  filters: DashboardFilterState;
  onFilterChange: (filters: DashboardFilterState) => void;
  cityData: CityWiseCapacity[];
}

export function DashboardFilters({ filters, onFilterChange, cityData }: DashboardFiltersProps) {
  // Extract unique cities filtered by current type and technology
  const cityOptions = useMemo(() => {
    let filteredData = cityData;
    if (filters.type !== 'ALL') {
      filteredData = filteredData.filter(row => row.Type === filters.type);
    }
    if (filters.technology !== 'ALL') {
      filteredData = filteredData.filter(row => row['Technology Name'] === filters.technology);
    }
    return [...new Set(filteredData.map(row => row.City))].filter(Boolean).sort();
  }, [cityData, filters.type, filters.technology]);

  const handleTechChange = (value: string) => {
    if (value) {
      onFilterChange({ ...filters, technology: value as 'ALL' | 'CIENA' | 'NOKIA', city: null });
    }
  };

  const handleTypeChange = (value: string) => {
    if (value) {
      onFilterChange({ ...filters, type: value as 'ALL' | 'NLD' | 'METRO' | 'OTHER', city: null });
    }
  };

  const handleCityChange = (value: string) => {
    onFilterChange({ ...filters, city: value === 'all' ? null : value });
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Technology Toggle */}
      <ToggleGroup 
        type="single" 
        value={filters.technology} 
        onValueChange={handleTechChange}
        className="bg-muted rounded-lg p-0.5"
      >
        <ToggleGroupItem value="ALL" size="sm" className="text-xs px-3 h-8 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm">ALL</ToggleGroupItem>
        <ToggleGroupItem value="CIENA" size="sm" className="text-xs px-3 h-8 data-[state=on]:bg-blue-500 data-[state=on]:text-white dark:data-[state=on]:bg-blue-600">CIENA</ToggleGroupItem>
        <ToggleGroupItem value="NOKIA" size="sm" className="text-xs px-3 h-8 data-[state=on]:bg-cyan-600 data-[state=on]:text-white dark:data-[state=on]:bg-cyan-700">NOKIA</ToggleGroupItem>
      </ToggleGroup>

      {/* Type Toggle */}
      <ToggleGroup 
        type="single" 
        value={filters.type} 
        onValueChange={handleTypeChange}
        className="bg-muted rounded-lg p-0.5"
      >
        <ToggleGroupItem value="ALL" size="sm" className="text-xs px-3 h-8 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm">ALL</ToggleGroupItem>
        <ToggleGroupItem value="NLD" size="sm" className="text-xs px-3 h-8 data-[state=on]:bg-blue-500 data-[state=on]:text-white dark:data-[state=on]:bg-blue-600">NLD</ToggleGroupItem>
        <ToggleGroupItem value="METRO" size="sm" className="text-xs px-3 h-8 data-[state=on]:bg-purple-500 data-[state=on]:text-white dark:data-[state=on]:bg-purple-600">METRO</ToggleGroupItem>
        <ToggleGroupItem value="OTHER" size="sm" className="text-xs px-3 h-8 data-[state=on]:bg-gray-500 data-[state=on]:text-white dark:data-[state=on]:bg-gray-600">OTHER</ToggleGroupItem>
      </ToggleGroup>

      {/* City Dropdown */}
      <Select value={filters.city || 'all'} onValueChange={handleCityChange}>
        <SelectTrigger className="w-[160px] h-8 text-xs bg-background border-border/60">
          <SelectValue placeholder="City" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" className="text-xs">City</SelectItem>
          {cityOptions.map((city) => (
            <SelectItem key={city} value={city} className="text-xs">{city}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
