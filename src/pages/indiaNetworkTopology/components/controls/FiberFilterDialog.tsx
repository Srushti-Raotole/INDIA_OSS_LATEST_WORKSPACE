import { useState, useCallback, useMemo } from 'react';
import { SlidersHorizontal, X, CheckCircle2 } from 'lucide-react';
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
import type { FiberFilterState, FiberData } from '../../types/fiberTypes';
import { DEFAULT_FIBER_FILTERS, AVAILABLE_METHODOLOGIES, AVAILABLE_CONSTRUCTIONS } from '../../types/fiberTypes';

// ============================================
// Props Interface
// ============================================

interface FiberFilterDialogProps {
  /** Current filter state */
  filters: FiberFilterState;
  /** Callback when filters change */
  onFilterChange: (filters: FiberFilterState) => void;
  /** Fiber data to extract available options */
  fiberData: FiberData;
}

// ============================================
// Component
// ============================================

export function FiberFilterDialog({
  filters,
  onFilterChange,
  fiberData,
}: FiberFilterDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<FiberFilterState>(filters);

  // Extract unique values from data
  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    fiberData.routes.forEach(r => types.add(r.type));
    return Array.from(types).sort();
  }, [fiberData.routes]);

  const availableTechnologies = useMemo(() => {
    const techs = new Set<string>();
    fiberData.sites.forEach(s => techs.add(s.technology));
    return Array.from(techs).sort();
  }, [fiberData.sites]);

  const availableLinkNames = useMemo(() => {
    const links = new Set<string>();
    fiberData.routes.forEach(r => links.add(r.linkName));
    fiberData.sites.forEach(s => links.add(s.linkName));
    return Array.from(links).filter(Boolean).sort();
  }, [fiberData]);

  // Count active filters
  const activeFilterCount =
    (localFilters.types.length > 0 ? 1 : 0) +
    (localFilters.technologies.length > 0 ? 1 : 0) +
    (localFilters.methodologies.length > 0 ? 1 : 0) +
    (localFilters.linkNames.length > 0 ? 1 : 0) +
    (localFilters.constructions.length > 0 ? 1 : 0);

  const toggleType = useCallback((type: string) => {
    setLocalFilters(prev => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter(t => t !== type)
        : [...prev.types, type],
    }));
  }, []);

  const toggleTechnology = useCallback((tech: string) => {
    setLocalFilters(prev => ({
      ...prev,
      technologies: prev.technologies.includes(tech)
        ? prev.technologies.filter(t => t !== tech)
        : [...prev.technologies, tech],
    }));
  }, []);

  const toggleMethodology = useCallback((method: string) => {
    setLocalFilters(prev => ({
      ...prev,
      methodologies: prev.methodologies.includes(method)
        ? prev.methodologies.filter(m => m !== method)
        : [...prev.methodologies, method],
    }));
  }, []);

  const toggleConstruction = useCallback((construction: string) => {
    setLocalFilters(prev => ({
      ...prev,
      constructions: prev.constructions.includes(construction)
        ? prev.constructions.filter(c => c !== construction)
        : [...prev.constructions, construction],
    }));
  }, []);

  const toggleLinkName = useCallback((link: string) => {
    setLocalFilters(prev => ({
      ...prev,
      linkNames: prev.linkNames.includes(link)
        ? prev.linkNames.filter(l => l !== link)
        : [...prev.linkNames, link],
    }));
  }, []);

  const handleApply = useCallback(() => {
    onFilterChange(localFilters);
    setIsOpen(false);
  }, [localFilters, onFilterChange]);

  const handleClear = useCallback(() => {
    setLocalFilters(DEFAULT_FIBER_FILTERS);
    onFilterChange(DEFAULT_FIBER_FILTERS);
    setIsOpen(false);
  }, [onFilterChange]);

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
          title="Filter fiber data"
        >
          <SlidersHorizontal className="h-4 w-4" />
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

      <DialogContent className="sm:max-w-md max-h-[90vh] z-[1100]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5" />
            Filter Fiber Data
          </DialogTitle>
          <DialogDescription>
            Filter fiber routes and sites by type, technology, methodology, or link.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh] pr-4">
          <div className="space-y-4 py-4">
            {/* Type Filter (NLD/METRO) */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Route Type</Label>
              <div className="flex flex-wrap gap-3">
                {availableTypes.map(type => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`fiber-type-${type}`}
                      checked={localFilters.types.includes(type)}
                      onCheckedChange={() => toggleType(type)}
                    />
                    <Label htmlFor={`fiber-type-${type}`} className="text-sm cursor-pointer">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        type === 'NLD' 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                      }`}>
                        {type}
                      </span>
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Technology Filter (CIENA/NOKIA) */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Site Technology</Label>
              <div className="flex flex-wrap gap-3">
                {availableTechnologies.map(tech => (
                  <div key={tech} className="flex items-center space-x-2">
                    <Checkbox
                      id={`fiber-tech-${tech}`}
                      checked={localFilters.technologies.includes(tech)}
                      onCheckedChange={() => toggleTechnology(tech)}
                    />
                    <Label htmlFor={`fiber-tech-${tech}`} className="text-sm cursor-pointer flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        tech === 'CIENA' ? 'bg-blue-500' : 'bg-red-500'
                      }`} />
                      {tech}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Methodology Filter (OPGW/UG) */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Methodology</Label>
              <div className="flex flex-wrap gap-3">
                {AVAILABLE_METHODOLOGIES.map(method => (
                  <div key={method} className="flex items-center space-x-2">
                    <Checkbox
                      id={`fiber-method-${method}`}
                      checked={localFilters.methodologies.includes(method)}
                      onCheckedChange={() => toggleMethodology(method)}
                    />
                    <Label htmlFor={`fiber-method-${method}`} className="text-sm cursor-pointer">
                      {method === 'OPGW' ? 'OPGW (Overhead)' : method === 'UG' ? 'UG (Underground)' : method === 'AERIAL' ? 'AERIAL' : 'UTILITY'}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Construction Status Filter */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Construction Status</Label>
              <div className="flex flex-wrap gap-3">
                {AVAILABLE_CONSTRUCTIONS.map(status => (
                  <div key={status} className="flex items-center space-x-2">
                    <Checkbox
                      id={`fiber-construction-${status}`}
                      checked={localFilters.constructions.includes(status)}
                      onCheckedChange={() => toggleConstruction(status)}
                    />
                    <Label htmlFor={`fiber-construction-${status}`} className="text-sm cursor-pointer flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        status === 'Completed' ? 'bg-green-500' : 'bg-amber-500'
                      }`} />
                      {status}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Link Name Filter */}
            {availableLinkNames.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Link Name</Label>
                  <div className="flex flex-wrap gap-2">
                    {availableLinkNames.map(link => (
                      <Button
                        key={link}
                        variant={localFilters.linkNames.includes(link) ? 'default' : 'outline'}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => toggleLinkName(link)}
                      >
                        {link}
                        {localFilters.linkNames.includes(link) && (
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
