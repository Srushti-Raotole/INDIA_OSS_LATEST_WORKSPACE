
import { Cable, Network } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '../../../../components/ui/toggle-group';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../../components/ui/tooltip';

export type TableDomainView = 'FIBER' | 'IP_OPTICAL';

interface TableDomainToggleProps {
  selectedDomain: TableDomainView;
  onDomainChange: (domain: TableDomainView) => void;
}

export function TableDomainToggle({
  selectedDomain,
  onDomainChange,
}: TableDomainToggleProps) {
  return (
    <TooltipProvider>
      <div className="bg-background/95 backdrop-blur-sm rounded-lg shadow-sm border border-border p-0.5 flex items-center">
        <ToggleGroup
          type="single"
          value={selectedDomain}
          onValueChange={(value) => {
            if (value) onDomainChange(value as TableDomainView);
          }}
          className="gap-0"
        >
          {/* IP + OPTICAL - First */}
          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem
                value="IP_OPTICAL"
                size="sm"
                aria-label="Show IP and OPTICAL circuits"
                className={`h-8 px-3 text-xs font-medium transition-all rounded-r-none ${selectedDomain === 'IP_OPTICAL' ? 'bg-[#b31e48] text-white shadow-md' : 'bg-transparent hover:bg-muted'}`}
              >
                <Network className="h-4 w-4 mr-1.5" />
                IP + OPTICAL
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Show IP and OPTICAL circuit data
            </TooltipContent>
          </Tooltip>

          {/* FIBER - Second */}
          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem
                value="FIBER"
                size="sm"
                aria-label="Show fiber data"
                className={`h-8 px-3 text-xs font-medium transition-all rounded-l-none ${selectedDomain === 'FIBER' ? 'bg-[#b31e48] text-white shadow-md' : 'bg-transparent hover:bg-muted'}`}
              >
                <Cable className="h-4 w-4 mr-1.5" />
                FIBER
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Show fiber routes and sites data
            </TooltipContent>
          </Tooltip>
        </ToggleGroup>
      </div>
    </TooltipProvider>
  );
}
