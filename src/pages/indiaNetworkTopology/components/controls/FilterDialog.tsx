import { useState, useCallback } from 'react';
import { Filter, X, CheckCircle2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '../../../../components/ui/dialog';
import { Button } from '../../../../components/ui/button';
import { Checkbox } from '../../../../components/ui/checkbox';
import { Label } from '../../../../components/ui/label';
import { Badge } from '../../../../components/ui/badge';
import { Separator } from '../../../../components/ui/separator';
import { ScrollArea } from '../../../../components/ui/scroll-area';

// Import shared FilterState from types
import { 
  FilterState, 
  DEFAULT_FILTERS, 
  AVAILABLE_TECHNOLOGIES, 
  AVAILABLE_DOMAIN_TYPES,
  AVAILABLE_PATH_TYPES,
  DomainType,
  PathType,
} from '../../types';

// ============================================
// Props Interface
// ============================================

interface FilterDialogProps {
  /** Current filter state */
  filters: FilterState;
  /** Callback when filters change */
  onFilterChange: (filters: FilterState) => void;
  /** Available circle codes for filtering */
  availableCircles?: string[];
}

// ============================================
// Path Type Labels
// ============================================
const PATH_TYPE_LABELS: Record<PathType, string> = {
  P: 'Protected (P)',
  W: 'Working (W)',
  OTHER: 'Other',
};

// ============================================
// Component
// ============================================

/**
 * Filter Dialog Component
 * Opens a modal with filter options for network data
 * 
 * LIBRARY: shadcn/ui Dialog component
 * Reference: https://ui.shadcn.com/docs/components/dialog
 * 
 * Filters available:
 * - Circuit Type: NLD (Long Distance), METRO (Metropolitan)
 * - Technology: CIENA (can add more in types/index.ts)
 * - Utilization Level: High (>80%), Medium (50-80%), Low (<50%)
 * - Circle/Region: Dynamic based on available data
 * - Domain: IP, OPTICAL
 * - Path: P (Protected), W (Working), OTHER
 */
export function FilterDialog({ 
  filters, 
  onFilterChange,
  availableCircles = [],
}: FilterDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

  /**
   * Count active filters for badge display
   */
  const activeFilterCount = 
    (localFilters.types.length > 0 ? 1 : 0) +
    (localFilters.utilizationLevels.length > 0 ? 1 : 0) +
    (localFilters.circles.length > 0 ? 1 : 0) +
    (localFilters.technologies.length > 0 ? 1 : 0) +
    (localFilters.domainTypes.length > 0 ? 1 : 0) +
    (localFilters.pathTypes.length > 0 ? 1 : 0);

  /**
   * Toggle a type filter (NLD/METRO)
   */
  const toggleType = useCallback((type: string) => {
    setLocalFilters(prev => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter(t => t !== type)
        : [...prev.types, type],
    }));
  }, []);

  /**
   * Toggle a technology filter (CIENA, etc.)
   */
  const toggleTechnology = useCallback((tech: string) => {
    setLocalFilters(prev => ({
      ...prev,
      technologies: prev.technologies.includes(tech)
        ? prev.technologies.filter(t => t !== tech)
        : [...prev.technologies, tech],
    }));
  }, []);

  /**
   * Toggle a utilization level filter
   */
  const toggleUtilization = useCallback((level: 'high' | 'medium' | 'low') => {
    setLocalFilters(prev => ({
      ...prev,
      utilizationLevels: prev.utilizationLevels.includes(level)
        ? prev.utilizationLevels.filter(l => l !== level)
        : [...prev.utilizationLevels, level],
    }));
  }, []);

  /**
   * Toggle a circle filter
   */
  const toggleCircle = useCallback((circle: string) => {
    setLocalFilters(prev => ({
      ...prev,
      circles: prev.circles.includes(circle)
        ? prev.circles.filter(c => c !== circle)
        : [...prev.circles, circle],
    }));
  }, []);

  /**
   * Toggle a domain type filter (IP/OPTICAL)
   */
  const toggleDomainType = useCallback((domain: DomainType) => {
    setLocalFilters(prev => ({
      ...prev,
      domainTypes: prev.domainTypes.includes(domain)
        ? prev.domainTypes.filter(d => d !== domain)
        : [...prev.domainTypes, domain],
    }));
  }, []);

  /**
   * Toggle a path type filter (P/W/OTHER)
   */
  const togglePathType = useCallback((path: PathType) => {
    setLocalFilters(prev => ({
      ...prev,
      pathTypes: prev.pathTypes.includes(path)
        ? prev.pathTypes.filter(p => p !== path)
        : [...prev.pathTypes, path],
    }));
  }, []);

  /**
   * Apply filters and close dialog
   */
  const handleApply = useCallback(() => {
    onFilterChange(localFilters);
    setIsOpen(false);
  }, [localFilters, onFilterChange]);

  /**
   * Clear all filters
   */
  const handleClear = useCallback(() => {
    setLocalFilters(DEFAULT_FILTERS);
    onFilterChange(DEFAULT_FILTERS);
    setIsOpen(false);
  }, [onFilterChange]);

  /**
   * Reset local filters when dialog opens
   */
  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (open) {
      setLocalFilters(filters);
    }
  }, [filters]);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 bg-background/95 backdrop-blur-sm shadow-lg hover:bg-muted relative"
          title="Filter network data"
        >
          <Filter className="h-4 w-4" />
          {/* Active filter count badge */}
          {activeFilterCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg max-h-[90vh] z-[1100]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Network Data
          </DialogTitle>
          <DialogDescription>
            Select filters to show specific circuit types, technologies, domains, or utilization levels.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4 py-4">
            {/* ========== Technology Filter ========== */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Technology</Label>
              <div className="flex flex-wrap gap-3">
                {AVAILABLE_TECHNOLOGIES.map(tech => (
                  <div key={tech} className="flex items-center space-x-2">
                    <Checkbox
                      id={`tech-${tech}`}
                      checked={localFilters.technologies.includes(tech)}
                      onCheckedChange={() => toggleTechnology(tech)}
                    />
                    <Label htmlFor={`tech-${tech}`} className="text-sm cursor-pointer">
                      {tech}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* ========== Circuit Type Filter ========== */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Connection Type</Label>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="type-nld"
                    checked={localFilters.types.includes('NLD')}
                    onCheckedChange={() => toggleType('NLD')}
                  />
                  <Label htmlFor="type-nld" className="text-sm cursor-pointer flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      NLD
                    </span>
                    Long Distance
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="type-metro"
                    checked={localFilters.types.includes('METRO')}
                    onCheckedChange={() => toggleType('METRO')}
                  />
                  <Label htmlFor="type-metro" className="text-sm cursor-pointer flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                      METRO
                    </span>
                    Metropolitan
                  </Label>
                </div>
              </div>
            </div>

            <Separator />

            {/* ========== Domain Type Filter (IP/OPTICAL) ========== */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Domain Type</Label>
              <div className="flex flex-wrap gap-3">
                {AVAILABLE_DOMAIN_TYPES.map(domain => (
                  <div key={domain} className="flex items-center space-x-2">
                    <Checkbox
                      id={`domain-${domain}`}
                      checked={localFilters.domainTypes.includes(domain)}
                      onCheckedChange={() => toggleDomainType(domain)}
                    />
                    <Label htmlFor={`domain-${domain}`} className="text-sm cursor-pointer flex items-center gap-2">
                      <span 
                        className={`w-3 h-3 rounded-full ${
                          domain === 'IP' 
                            ? 'bg-blue-500' 
                            : 'bg-orange-500'
                        }`} 
                      />
                      {domain}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* ========== Path Type Filter (P/W/OTHER) ========== */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Path Type</Label>
              <div className="flex flex-wrap gap-3">
                {AVAILABLE_PATH_TYPES.map(path => (
                  <div key={path} className="flex items-center space-x-2">
                    <Checkbox
                      id={`path-${path}`}
                      checked={localFilters.pathTypes.includes(path)}
                      onCheckedChange={() => togglePathType(path)}
                    />
                    <Label htmlFor={`path-${path}`} className="text-sm cursor-pointer">
                      {PATH_TYPE_LABELS[path]}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* ========== Utilization Level Filter ========== */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Utilization Level</Label>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="util-high"
                    checked={localFilters.utilizationLevels.includes('high')}
                    onCheckedChange={() => toggleUtilization('high')}
                  />
                  <Label htmlFor="util-high" className="text-sm cursor-pointer flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-util-high" />
                    High (&gt;80%)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="util-medium"
                    checked={localFilters.utilizationLevels.includes('medium')}
                    onCheckedChange={() => toggleUtilization('medium')}
                  />
                  <Label htmlFor="util-medium" className="text-sm cursor-pointer flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-util-medium" />
                    Medium (50-80%)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="util-low"
                    checked={localFilters.utilizationLevels.includes('low')}
                    onCheckedChange={() => toggleUtilization('low')}
                  />
                  <Label htmlFor="util-low" className="text-sm cursor-pointer flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-util-low" />
                    Low (&lt;50%)
                  </Label>
                </div>
              </div>
            </div>

            {/* ========== Circle/Region Filter ========== */}
            {availableCircles.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Circle/Region</Label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {availableCircles.map(circle => (
                      <Button
                        key={circle}
                        variant={localFilters.circles.includes(circle) ? 'default' : 'outline'}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => toggleCircle(circle)}
                      >
                        {circle}
                        {localFilters.circles.includes(circle) && (
                          <CheckCircle2 className="h-3 w-3 ml-1" />
                        )}
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClear} className="flex-1 sm:flex-none">
            <X className="h-4 w-4 mr-1" />
            Clear All
          </Button>
          <Button onClick={handleApply} className="flex-1 sm:flex-none">
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Apply Filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
