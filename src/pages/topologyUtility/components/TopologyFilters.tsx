import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/select';
import { Search, X } from 'lucide-react';
import { CLIENT_OPTIONS, VENDOR_OPTIONS } from '../types';

export interface TopologyFiltersState {
  search: string;
  status: string;
  client: string;
  vendor: string;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
}

interface TopologyFiltersProps {
  filters: TopologyFiltersState;
  onFiltersChange: (filters: TopologyFiltersState) => void;
}

export function TopologyFilters({ filters, onFiltersChange }: TopologyFiltersProps) {
  const updateFilter = <K extends keyof TopologyFiltersState>(
    key: K,
    value: TopologyFiltersState[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const hasActiveFilters = filters.search || filters.client !== 'all' || filters.vendor !== 'all';

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      status: 'all',
      client: 'all',
      vendor: 'all',
      dateFrom: undefined,
      dateTo: undefined,
    });
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, client, vendor..."
          value={filters.search}
          onChange={(e) => updateFilter('search', e.target.value)}
          className="pl-9 h-9"
        />
        {filters.search && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
            onClick={() => updateFilter('search', '')}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Client filter */}
      <Select value={filters.client} onValueChange={(v) => updateFilter('client', v)}>
        <SelectTrigger className="w-[130px] h-9">
          <SelectValue placeholder="Clients" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Clients</SelectItem>
          {CLIENT_OPTIONS.map((c) => (
            <SelectItem key={c.value} value={c.value}>
              {c.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Vendor filter */}
      <Select value={filters.vendor} onValueChange={(v) => updateFilter('vendor', v)}>
        <SelectTrigger className="w-[150px] h-9">
          <SelectValue placeholder="All Vendors" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Vendors</SelectItem>
          {VENDOR_OPTIONS.map((v) => (
            <SelectItem key={v.value} value={v.value}>
              {v.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Clear all */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" className="h-9 text-muted-foreground" onClick={clearFilters}>
          Clear all
        </Button>
      )}
    </div>
  );
}
