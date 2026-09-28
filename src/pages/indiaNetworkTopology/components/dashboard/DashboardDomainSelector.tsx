// ============================================
// Dashboard Domain Selector Component
// ============================================

import { Cable, Network } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '../../../../components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../../components/ui/tooltip';

export type DashboardDomainView = 'FIBER' | 'IP_OPTICAL';

interface DashboardDomainSelectorProps {
  selectedDomain: DashboardDomainView;
  onDomainChange: (domain: DashboardDomainView) => void;
}

export function DashboardDomainSelector({
  selectedDomain,
  onDomainChange,
}: DashboardDomainSelectorProps) {
  return (
    <TooltipProvider>
      <div className="bg-background/95 backdrop-blur-sm rounded-lg shadow-lg border border-border p-1 flex items-center">
        <ToggleGroup
          type="single"
          value={selectedDomain}
          onValueChange={(value) => {
            if (value) onDomainChange(value as DashboardDomainView);
          }}
          className="gap-0.5"
        >
          {/* IP + OPTICAL - First */}
          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem
                value="IP_OPTICAL"
                size="sm"
                aria-label="IP + OPTICAL Dashboard"
                className={`h-8 px-3 text-xs font-medium transition-all ${
                  selectedDomain === 'IP_OPTICAL' 
                    ? 'bg-[#b31e48] text-white shadow-md' 
                    : 'bg-transparent hover:bg-muted'
                }`}
              >
                <Network className="h-4 w-4 mr-1.5" />
                IP + OPTICAL
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              IP and OPTICAL circuits dashboard
            </TooltipContent>
          </Tooltip>

          {/* FIBER - Second */}
          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem
                value="FIBER"
                size="sm"
                aria-label="Fiber Dashboard"
                className={`h-8 px-3 text-xs font-medium transition-all ${
                  selectedDomain === 'FIBER' 
                    ? 'bg-[#b31e48] text-white shadow-md' 
                    : 'bg-transparent hover:bg-muted'
                }`}
              >
                <Cable className="h-4 w-4 mr-1.5" />
                FIBER
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Fiber routes and sites dashboard
            </TooltipContent>
          </Tooltip>
        </ToggleGroup>
      </div>
    </TooltipProvider>
  );
}
