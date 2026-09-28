
import { useState } from 'react';
import { Filter, X, RotateCcw } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../../../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import { Badge } from '../../../../components/ui/badge';
import { Label } from '../../../../components/ui/label';
import { Checkbox } from '../../../../components/ui/checkbox';
import { Separator } from '../../../../components/ui/separator';
import type { FilterState, DomainType, PathType } from '../../types';
import type { FiberFilterState, FiberData } from '../../types/fiberTypes';
import { AVAILABLE_TECHNOLOGIES, AVAILABLE_DOMAIN_TYPES, AVAILABLE_PATH_TYPES } from '../../types';
import { AVAILABLE_CONSTRUCTIONS } from '../../types/fiberTypes';

// ============================================
// Props Interface
// ============================================

interface UnifiedFilterDialogProps {
  /** Circuit filter state */
  circuitFilters: FilterState;
  /** Callback when circuit filters change */
  onCircuitFilterChange: (filters: FilterState) => void;
  /** Available circles for filtering */
  availableCircles: string[];
  /** Available sectors for filtering */
  availableSectors: string[];
  /** Fiber filter state (using linkName for single selection) */
  fiberFilters: FiberFilterState;
  /** Callback when fiber filters change */
  onFiberFilterChange: (filters: FiberFilterState) => void;
  /** Fiber data for extracting filter options */
  fiberData: FiberData;
  /** Whether fiber data is loaded */
  hasFiberData: boolean;
}

// ============================================
// Component
// ============================================

export function UnifiedFilterDialog({
  circuitFilters,
  onCircuitFilterChange,
  availableCircles,
  availableSectors,
  fiberFilters,
  onFiberFilterChange,
  fiberData,
  hasFiberData,
}: UnifiedFilterDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'circuit' | 'fiber'>('circuit');

  // Count active filters
  const circuitFilterCount = 
    circuitFilters.types.length +
    circuitFilters.utilizationLevels.length +
    circuitFilters.circles.length +
    circuitFilters.technologies.length +
    circuitFilters.domainTypes.length +
    circuitFilters.pathTypes.length +
    circuitFilters.sectors.length;

  const fiberFilterCount =
    fiberFilters.types.length +
    fiberFilters.technologies.length +
    fiberFilters.methodologies.length +
    fiberFilters.linkNames.length +
    fiberFilters.constructions.length;

  const totalFilterCount = circuitFilterCount + fiberFilterCount;

  // Extract unique values from fiber data
  const fiberTypes = [...new Set(fiberData.routes.map(r => r.type))].filter(Boolean).sort();
  const fiberTechnologies = [...new Set(fiberData.sites.map(s => s.technology))].filter(Boolean).sort();
  const fiberMethodologies = [...new Set(fiberData.routes.map(r => r.methodology))].filter(Boolean).sort();
  const fiberLinkNames = [...new Set([
    ...fiberData.routes.map(r => r.linkName),
    ...fiberData.sites.map(s => s.linkName),
  ])].filter(Boolean).sort();

  // Circuit filter handlers
  const handleCircuitTypeToggle = (type: string) => {
    const newTypes = circuitFilters.types.includes(type)
      ? circuitFilters.types.filter(t => t !== type)
      : [...circuitFilters.types, type];
    onCircuitFilterChange({ ...circuitFilters, types: newTypes });
  };

  const handleUtilizationToggle = (level: 'high' | 'medium' | 'low') => {
    const newLevels = circuitFilters.utilizationLevels.includes(level)
      ? circuitFilters.utilizationLevels.filter(l => l !== level)
      : [...circuitFilters.utilizationLevels, level];
    onCircuitFilterChange({ ...circuitFilters, utilizationLevels: newLevels });
  };

  const handleTechnologyToggle = (tech: string) => {
    const newTechs = circuitFilters.technologies.includes(tech)
      ? circuitFilters.technologies.filter(t => t !== tech)
      : [...circuitFilters.technologies, tech];
    onCircuitFilterChange({ ...circuitFilters, technologies: newTechs });
  };

  const handleDomainTypeToggle = (domain: DomainType) => {
    const newDomains = circuitFilters.domainTypes.includes(domain)
      ? circuitFilters.domainTypes.filter(d => d !== domain)
      : [...circuitFilters.domainTypes, domain];
    onCircuitFilterChange({ ...circuitFilters, domainTypes: newDomains });
  };

  const handlePathTypeToggle = (path: PathType) => {
    const newPaths = circuitFilters.pathTypes.includes(path)
      ? circuitFilters.pathTypes.filter(p => p !== path)
      : [...circuitFilters.pathTypes, path];
    onCircuitFilterChange({ ...circuitFilters, pathTypes: newPaths });
  };

  const handleCircleToggle = (circle: string) => {
    const newCircles = circuitFilters.circles.includes(circle)
      ? circuitFilters.circles.filter(c => c !== circle)
      : [...circuitFilters.circles, circle];
    onCircuitFilterChange({ ...circuitFilters, circles: newCircles });
  };

  const handleSectorToggle = (sector: string) => {
    const newSectors = circuitFilters.sectors.includes(sector)
      ? circuitFilters.sectors.filter(s => s !== sector)
      : [...circuitFilters.sectors, sector];
    onCircuitFilterChange({ ...circuitFilters, sectors: newSectors });
  };

  const clearCircuitFilters = () => {
    onCircuitFilterChange({
      types: [],
      utilizationLevels: [],
      circles: [],
      technologies: [],
      domainTypes: [],
      pathTypes: [],
      sectors: [],
    });
  };

  // Fiber filter handlers
  const handleFiberTypeToggle = (type: string) => {
    const newTypes = fiberFilters.types.includes(type)
      ? fiberFilters.types.filter(t => t !== type)
      : [...fiberFilters.types, type];
    onFiberFilterChange({ ...fiberFilters, types: newTypes });
  };

  const handleFiberTechToggle = (tech: string) => {
    const newTechs = fiberFilters.technologies.includes(tech)
      ? fiberFilters.technologies.filter(t => t !== tech)
      : [...fiberFilters.technologies, tech];
    onFiberFilterChange({ ...fiberFilters, technologies: newTechs });
  };

  const handleFiberMethodologyToggle = (method: string) => {
    const newMethods = fiberFilters.methodologies.includes(method)
      ? fiberFilters.methodologies.filter(m => m !== method)
      : [...fiberFilters.methodologies, method];
    onFiberFilterChange({ ...fiberFilters, methodologies: newMethods });
  };

  const handleFiberConstructionToggle = (construction: string) => {
    const newConstructions = fiberFilters.constructions.includes(construction)
      ? fiberFilters.constructions.filter(c => c !== construction)
      : [...fiberFilters.constructions, construction];
    onFiberFilterChange({ ...fiberFilters, constructions: newConstructions });
  };

  const handleFiberLinkNameChange = (linkName: string) => {
    const newLinkNames = linkName ? [linkName] : [];
    onFiberFilterChange({ ...fiberFilters, linkNames: newLinkNames });
  };

  const clearFiberFilters = () => {
    onFiberFilterChange({
      types: [],
      technologies: [],
      methodologies: [],
      linkNames: [],
      constructions: [],
      routeNames: [],
    });
  };

  const clearAllFilters = () => {
    clearCircuitFilters();
    clearFiberFilters();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-2 bg-background/95 backdrop-blur-sm shadow-lg hover:bg-muted relative"
        >
          <Filter className="h-4 w-4" />
          <span className="text-xs font-medium">Filters</span>
          {totalFilterCount > 0 && (
            <Badge 
              variant="destructive" 
              className="h-5 w-5 p-0 flex items-center justify-center text-[10px] absolute -top-1.5 -right-1.5"
            >
              {totalFilterCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl z-[1100]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Network Filters
            </DialogTitle>
            {totalFilterCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                onClick={clearAllFilters}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset All
              </Button>
            )}
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'circuit' | 'fiber')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="circuit" className="relative data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              IP + OPTICAL
              {circuitFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1.5 h-5 min-w-5 px-1 text-[10px]">
                  {circuitFilterCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="fiber" 
              className="relative data-[state=active]:bg-emerald-500 data-[state=active]:text-white" 
              disabled={!hasFiberData}
            >
              FIBER
              {fiberFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1.5 h-5 min-w-5 px-1 text-[10px]">
                  {fiberFilterCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Circuit Filters Tab - Grid Layout */}
          <TabsContent value="circuit" className="mt-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Left Column */}
              <div className="space-y-4">
                {/* Domain Type Filter */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground">Domain Type</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {AVAILABLE_DOMAIN_TYPES.map((domain) => (
                      <Button
                        key={domain}
                        variant={circuitFilters.domainTypes.includes(domain) ? 'default' : 'outline'}
                        size="sm"
                        className={`h-7 text-xs ${
                          circuitFilters.domainTypes.includes(domain)
                            ? domain === 'IP' 
                              ? 'bg-blue-500 hover:bg-blue-600' 
                              : 'bg-orange-500 hover:bg-orange-600'
                            : ''
                        }`}
                        onClick={() => handleDomainTypeToggle(domain)}
                      >
                        {domain}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Circuit Type Filter (NLD/METRO) */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground">Circuit Type</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {['NLD', 'METRO'].map((type) => (
                      <Button
                        key={type}
                        variant={circuitFilters.types.includes(type) ? 'default' : 'outline'}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleCircuitTypeToggle(type)}
                      >
                        {type}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Technology Filter */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground">Technology</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {AVAILABLE_TECHNOLOGIES.map((tech) => (
                      <Button
                        key={tech}
                        variant={circuitFilters.technologies.includes(tech) ? 'default' : 'outline'}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleTechnologyToggle(tech)}
                      >
                        {tech}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Path Type Filter */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground">Path Type</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {AVAILABLE_PATH_TYPES.map((path) => (
                      <Button
                        key={path}
                        variant={circuitFilters.pathTypes.includes(path) ? 'default' : 'outline'}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handlePathTypeToggle(path)}
                      >
                        {path === 'P' ? 'Protected' : path === 'W' ? 'Working' : 'Other'}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Utilization Filter */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground">Utilization</Label>
                  <div className="flex flex-wrap gap-1.5">
                    <Button
                      variant={circuitFilters.utilizationLevels.includes('high') ? 'default' : 'outline'}
                      size="sm"
                      className={`h-7 text-xs ${circuitFilters.utilizationLevels.includes('high') ? 'bg-red-500 hover:bg-red-600' : ''}`}
                      onClick={() => handleUtilizationToggle('high')}
                    >
                      High
                    </Button>
                    <Button
                      variant={circuitFilters.utilizationLevels.includes('medium') ? 'default' : 'outline'}
                      size="sm"
                      className={`h-7 text-xs ${circuitFilters.utilizationLevels.includes('medium') ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : ''}`}
                      onClick={() => handleUtilizationToggle('medium')}
                    >
                      Medium
                    </Button>
                    <Button
                      variant={circuitFilters.utilizationLevels.includes('low') ? 'default' : 'outline'}
                      size="sm"
                      className={`h-7 text-xs ${circuitFilters.utilizationLevels.includes('low') ? 'bg-green-500 hover:bg-green-600' : ''}`}
                      onClick={() => handleUtilizationToggle('low')}
                    >
                      Low
                    </Button>
                  </div>
                </div>

                {/* Circle Filter */}
                {availableCircles.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground">Circle</Label>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 max-h-16 overflow-y-auto">
                      {availableCircles.map((circle) => (
                        <div key={circle} className="flex items-center space-x-1">
                          <Checkbox
                            id={`circle-${circle}`}
                            checked={circuitFilters.circles.includes(circle)}
                            onCheckedChange={() => handleCircleToggle(circle)}
                            className="h-3.5 w-3.5"
                          />
                          <Label htmlFor={`circle-${circle}`} className="text-[11px] cursor-pointer">
                            {circle}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Clear Button - Full Width */}
            {circuitFilterCount > 0 && (
              <div className="mt-4 pt-3 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-8 text-xs text-destructive hover:text-destructive"
                  onClick={clearCircuitFilters}
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear All Circuit Filters
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Fiber Filters Tab - Grid Layout */}
          <TabsContent value="fiber" className="mt-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Left Column */}
              <div className="space-y-4">
                {/* Route Type Filter */}
                {fiberTypes.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground">Route Type</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {fiberTypes.map((type) => (
                        <Button
                          key={type}
                          variant={fiberFilters.types.includes(type) ? 'default' : 'outline'}
                          size="sm"
                          className={`h-7 text-xs ${
                            fiberFilters.types.includes(type)
                              ? type === 'NLD' 
                                ? 'bg-green-500 hover:bg-green-600' 
                                : 'bg-purple-500 hover:bg-purple-600'
                              : ''
                          }`}
                          onClick={() => handleFiberTypeToggle(type)}
                        >
                          {type}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Methodology Filter */}
                {fiberMethodologies.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground">Methodology</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {fiberMethodologies.map((method) => (
                        <Button
                          key={method}
                          variant={fiberFilters.methodologies.includes(method) ? 'default' : 'outline'}
                          size="sm"
                          className={`h-7 text-xs ${
                            fiberFilters.methodologies.includes(method)
                              ? method === 'OPGW' 
                                ? 'bg-emerald-500 hover:bg-emerald-600' 
                                : method === 'UG'
                                ? 'bg-orange-500 hover:bg-orange-600'
                                : method === 'AERIAL'
                                ? 'bg-sky-500 hover:bg-sky-600'
                                : 'bg-purple-500 hover:bg-purple-600'
                              : ''
                          }`}
                          onClick={() => handleFiberMethodologyToggle(method)}
                        >
                          {method}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Construction Status Filter */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-muted-foreground">Construction Status</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {AVAILABLE_CONSTRUCTIONS.map((status) => (
                      <Button
                        key={status}
                        variant={fiberFilters.constructions.includes(status) ? 'default' : 'outline'}
                        size="sm"
                        className={`h-7 text-xs ${
                          fiberFilters.constructions.includes(status)
                            ? status === 'Completed' 
                              ? 'bg-green-500 hover:bg-green-600' 
                              : 'bg-amber-500 hover:bg-amber-600'
                            : ''
                        }`}
                        onClick={() => handleFiberConstructionToggle(status)}
                      >
                        <span className={`w-2 h-2 rounded-full mr-1.5 ${
                          status === 'Completed' ? 'bg-green-300' : 'bg-amber-300'
                        }`} />
                        {status === 'Work In Progress' ? 'WIP' : status}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Technology Filter */}
                {fiberTechnologies.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground">Technology</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {fiberTechnologies.map((tech) => (
                        <Button
                          key={tech}
                          variant={fiberFilters.technologies.includes(tech) ? 'default' : 'outline'}
                          size="sm"
                          className={`h-7 text-xs ${
                            fiberFilters.technologies.includes(tech)
                              ? tech.toLowerCase().includes('ciena')
                                ? 'bg-blue-500 hover:bg-blue-600'
                                : 'bg-red-500 hover:bg-red-600'
                              : ''
                          }`}
                          onClick={() => handleFiberTechToggle(tech)}
                        >
                          {tech}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Link Name Filter */}
                {fiberLinkNames.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground">Link Name</Label>
                    <select
                      value={fiberFilters.linkNames[0] || ''}
                      onChange={(e) => handleFiberLinkNameChange(e.target.value)}
                      className="w-full h-8 px-2 text-xs rounded-md border border-input bg-background"
                    >
                      <option value="">All Links</option>
                      {fiberLinkNames.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Clear Button - Full Width */}
            {fiberFilterCount > 0 && (
              <div className="mt-4 pt-3 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-8 text-xs text-destructive hover:text-destructive"
                  onClick={clearFiberFilters}
                >
                  <X className="h-3 w-3 mr-1" />
                  Clear All Fiber Filters
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}