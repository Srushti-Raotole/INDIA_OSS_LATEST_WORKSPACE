

import { useState, useMemo } from 'react';
import { MapPin, X, Search, ChevronDown } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../../../components/ui/popover';
import { Input } from '../../../../components/ui/input';
import { ScrollArea } from '../../../../components/ui/scroll-area';

interface SectorDropdownProps {
  availableSectors: string[];
  selectedSector: string;
  onSectorChange: (sector: string) => void;
  compact?: boolean;
}

export function SectorDropdown({
  availableSectors,
  selectedSector,
  onSectorChange,
  compact = false,
}: SectorDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const isFiltered = selectedSector !== '';

  const filteredSectors = useMemo(() => {
    if (!search.trim()) return availableSectors;
    const q = search.toLowerCase();
    return availableSectors.filter(s => s.toLowerCase().includes(q));
  }, [availableSectors, search]);

  const handleSelect = (sector: string) => {
    onSectorChange(sector);
    setOpen(false);
    setSearch('');
  };

  const displayLabel = isFiltered ? selectedSector : 'Sectors';

  return (
    <div className="flex items-center gap-1">
      <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setSearch(''); }}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={`h-9 gap-1.5 text-xs font-medium justify-between ${
              compact ? 'w-[160px]' : ''
            } ${
              isFiltered 
                ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90' 
                : 'bg-background border-border/60 hover:bg-muted'
            }`}
          >
            <div className="flex items-center gap-1.5 truncate">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{displayLabel}</span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[220px] p-0 z-[1100]" align="start">
          {/* Search Input */}
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search sectors..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-7 h-8 text-xs"
                autoFocus
              />
            </div>
          </div>

          {/* Sector List */}
          <ScrollArea className="h-[300px]">
            <div className="p-1">
              {/* All Sectors option */}
              <button
                className={`w-full text-left px-3 py-2 text-xs rounded-md transition-colors ${
                  !isFiltered 
                    ? 'bg-primary/10 text-primary font-semibold' 
                    : 'hover:bg-muted text-foreground'
                }`}
                onClick={() => handleSelect('')}
              >
                Sectors
              </button>

              {filteredSectors.map((sector) => (
                <button
                  key={sector}
                  className={`w-full text-left px-3 py-2 text-xs rounded-md transition-colors flex items-center gap-2 ${
                    selectedSector === sector 
                      ? 'bg-primary/10 text-primary font-semibold' 
                      : 'hover:bg-muted text-foreground'
                  }`}
                  onClick={() => handleSelect(sector)}
                >
                  <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  {sector}
                </button>
              ))}

              {filteredSectors.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-3">
                  No sectors found
                </p>
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {isFiltered && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onSectorChange('')}
          title="Clear sector filter"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
