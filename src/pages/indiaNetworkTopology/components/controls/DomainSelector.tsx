import { Cable, Layers, Network, Waves } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '../../../../components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../../components/ui/tooltip';

// ============================================
// Types
// ============================================

/** Available domain views */
export type DomainView = 'ALL' | 'FIBER' | 'IP_OPTICAL' | 'OVERSEAS';

interface DomainSelectorProps {
  /** Currently selected domain view */
  selectedDomain: DomainView;
  /** Callback when domain changes */
  onDomainChange: (domain: DomainView) => void;
  hasFiberData?: boolean;
}


export function DomainSelector({
  selectedDomain,
  onDomainChange,
  hasFiberData = true,
}: DomainSelectorProps) {
  return (
    <TooltipProvider>
      <div className="bg-background/95 backdrop-blur-sm rounded-lg shadow-lg border border-border p-1 flex items-center">
        <ToggleGroup
          type="single"
          value={selectedDomain}
          onValueChange={(value) => {
            if (value) onDomainChange(value as DomainView);
          }}
          className="gap-0.5"
        >
          {/* ALL - Show everything */}
          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem
                value="ALL"
                size="sm"
                aria-label="Show all domains"
                className={`h-8 px-3 text-xs font-medium transition-all ${selectedDomain === 'ALL' ? 'bg-[#b31e48] text-white shadow-md' : 'bg-transparent hover:bg-muted'}`}
              >
                <Layers className="h-4 w-4 mr-1.5" />
                ALL
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Show all: IP + OPTICAL + FIBER
            </TooltipContent>
          </Tooltip>

          {/* FIBER - Only fiber routes/sites */}
          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem
                value="FIBER"
                size="sm"
                aria-label="Show fiber only"
                className={`h-8 px-3 text-xs font-medium transition-all ${selectedDomain === 'FIBER' ? 'bg-[#b31e48] text-white shadow-md' : 'bg-transparent hover:bg-muted'}`}
              >
                <Cable className="h-4 w-4 mr-1.5" />
                FIBER
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Show FIBER routes and sites only
            </TooltipContent>
          </Tooltip>

          {/* IP + OPTICAL - IP and Optical circuits */}
          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem
                value="IP_OPTICAL"
                size="sm"
                aria-label="Show IP and OPTICAL"
                className={`h-8 px-3 text-xs font-medium transition-all ${selectedDomain === 'IP_OPTICAL' ? 'bg-[#b31e48] text-white shadow-md' : 'bg-transparent hover:bg-muted'}`}
              >
                <Network className="h-4 w-4 mr-1.5" />
                IP + OPTICAL
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Show IP and OPTICAL circuits
            </TooltipContent>
          </Tooltip>

          {/* OVERSEAS - Submarine cable systems */}
          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem
                value="OVERSEAS"
                size="sm"
                aria-label="Show overseas submarine cables"
                className={`h-8 px-3 text-xs font-medium transition-all ${selectedDomain === 'OVERSEAS' ? 'bg-[#b31e48] text-white shadow-md' : 'bg-transparent hover:bg-muted'}`}
              >
                <Waves className="h-4 w-4 mr-1.5" />
                OVERSEAS
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Show overseas submarine cable systems (JGA-N, JGA-S, SEA-US East)
            </TooltipContent>
          </Tooltip>
        </ToggleGroup>
      </div>
    </TooltipProvider>
  );
}
