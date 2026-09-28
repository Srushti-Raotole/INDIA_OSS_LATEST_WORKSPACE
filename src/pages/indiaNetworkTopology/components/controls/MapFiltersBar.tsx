
import { useState } from 'react';
import { SlidersHorizontal, X, Activity, Layers, Cable, Workflow, Tag, Tags, MapPin, Filter } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { LinkColorModeToggle } from './LinkColorModeToggle';
import { FiberColorModeToggle, FiberColorMode } from './FiberColorModeToggle';
import { LabelToggle } from './LabelToggle';
import { SectorDropdown } from './SectorDropdown';
import { UnifiedFilterDialog } from './UnifiedFilterDialog';
import type { LinkColorMode, FilterState } from '../../types';
import type { FiberFilterState, FiberData } from '../../types/fiberTypes';

interface MapFiltersBarProps {
  // Sector
  availableSectors: string[];
  selectedSector: string;
  onSectorChange: (sector: string) => void;
  // Link color
  linkColorMode: LinkColorMode;
  onLinkColorModeChange: (mode: LinkColorMode) => void;
  // Fiber color
  fiberColorMode: FiberColorMode;
  onFiberColorModeChange: (mode: FiberColorMode) => void;
  // Labels
  showSiteLabels: boolean;
  onSiteLabelsToggle: (show: boolean) => void;
  // Unified filter
  circuitFilters: FilterState;
  onCircuitFilterChange: (filters: FilterState) => void;
  availableCircles: string[];
  fiberFilters: FiberFilterState;
  onFiberFilterChange: (filters: FiberFilterState) => void;
  fiberData: FiberData;
  // Domain visibility
  selectedDomain: string;
  hasFiberData: boolean;
  fiberLoaded: boolean;
  fiberRoutesCount: number;
}

export function MapFiltersBar({
  availableSectors,
  selectedSector,
  onSectorChange,
  linkColorMode,
  onLinkColorModeChange,
  fiberColorMode,
  onFiberColorModeChange,
  showSiteLabels,
  onSiteLabelsToggle,
  circuitFilters,
  onCircuitFilterChange,
  availableCircles,
  fiberFilters,
  onFiberFilterChange,
  fiberData,
  selectedDomain,
  hasFiberData,
  fiberLoaded,
  fiberRoutesCount,
}: MapFiltersBarProps) {
  const [open, setOpen] = useState(false);

  const showSector = (selectedDomain === 'ALL' || selectedDomain === 'IP_OPTICAL') && availableSectors.length > 0;
  const showLinkColor = selectedDomain === 'ALL' || selectedDomain === 'IP_OPTICAL';
  const showFiberColor = (selectedDomain === 'ALL' || selectedDomain === 'FIBER') && fiberLoaded && fiberRoutesCount > 0;

  return (
    <div className="flex items-center gap-2">
      {/* Toggle button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(!open)}
        className={`h-9 gap-1.5 text-xs font-medium bg-background/95 backdrop-blur-sm shadow-lg border-border transition-all ${
          open ? 'bg-muted border-primary' : 'hover:bg-muted'
        }`}
      >
        <SlidersHorizontal className="h-3.5 w-3.5" />
        Filters
        {open && <X className="h-3 w-3 ml-1 opacity-60" />}
      </Button>

      {/* Expanded filter controls - single line */}
      {open && (
        <div className="flex items-center gap-2 bg-background/95 backdrop-blur-sm rounded-lg shadow-lg border border-border px-2 py-1 animate-in slide-in-from-left-2 duration-200">
          {/* Sector */}
          {showSector && (
            <SectorDropdown
              availableSectors={availableSectors}
              selectedSector={selectedSector}
              onSectorChange={onSectorChange}
            />
          )}

          {/* Link Color Mode - with text */}
          {showLinkColor && (
            <div className="flex items-center gap-1 border-l border-border/50 pl-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onLinkColorModeChange(linkColorMode === 'utilization' ? 'domain' : 'utilization')}
                className={`h-8 gap-1.5 text-xs px-2 ${
                  linkColorMode === 'utilization' ? 'text-primary font-semibold' : 'text-muted-foreground'
                }`}
              >
                <Activity className="h-3.5 w-3.5" />
                Utilization
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onLinkColorModeChange(linkColorMode === 'domain' ? 'utilization' : 'domain')}
                className={`h-8 gap-1.5 text-xs px-2 ${
                  linkColorMode === 'domain' ? 'text-primary font-semibold' : 'text-muted-foreground'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                Domain
              </Button>
            </div>
          )}

          {/* Fiber Color Mode - with text */}
          {showFiberColor && (
            <div className="flex items-center gap-1 border-l border-border/50 pl-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFiberColorModeChange(fiberColorMode === 'type' ? 'methodology' : 'type')}
                className={`h-8 gap-1.5 text-xs px-2 ${
                  fiberColorMode === 'type' ? 'text-primary font-semibold' : 'text-muted-foreground'
                }`}
              >
                <Cable className="h-3.5 w-3.5" />
                Route Type
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFiberColorModeChange(fiberColorMode === 'methodology' ? 'type' : 'methodology')}
                className={`h-8 gap-1.5 text-xs px-2 ${
                  fiberColorMode === 'methodology' ? 'text-primary font-semibold' : 'text-muted-foreground'
                }`}
              >
                <Workflow className="h-3.5 w-3.5" />
                Methodology
              </Button>
            </div>
          )}

          {/* Labels toggle - with text */}
          <div className="border-l border-border/50 pl-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSiteLabelsToggle(!showSiteLabels)}
              className={`h-8 gap-1.5 text-xs px-2 ${
                showSiteLabels ? 'text-primary font-semibold' : 'text-muted-foreground'
              }`}
            >
              {showSiteLabels ? <Tags className="h-3.5 w-3.5" /> : <Tag className="h-3.5 w-3.5" />}
              Labels
            </Button>
          </div>

          {/* Advanced filters dialog */}
          <div className="border-l border-border/50 pl-2">
            <UnifiedFilterDialog
              circuitFilters={circuitFilters}
              onCircuitFilterChange={onCircuitFilterChange}
              availableCircles={availableCircles}
              availableSectors={availableSectors}
              fiberFilters={fiberFilters}
              onFiberFilterChange={onFiberFilterChange}
              fiberData={fiberData}
              hasFiberData={hasFiberData}
            />
          </div>
        </div>
      )}
    </div>
  );
}
