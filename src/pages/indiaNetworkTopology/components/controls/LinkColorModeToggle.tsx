import { Activity, Layers } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '../../../../components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../../components/ui/tooltip';
import type { LinkColorMode } from '../../types';

interface LinkColorModeToggleProps {
  /** Current color mode */
  mode: LinkColorMode;
  /** Callback when mode changes */
  onModeChange: (mode: LinkColorMode) => void;
}

/**
 * Toggle between Utilization and Domain coloring modes
 * 
 * Utilization mode: Links colored by utilization % (green/yellow/red)
 * Domain mode: Links colored by circuitType (IP=blue, OPTICAL=orange)
 */
export function LinkColorModeToggle({ mode, onModeChange }: LinkColorModeToggleProps) {
  return (
    <TooltipProvider>
      <div className="bg-background/95 backdrop-blur-sm rounded-lg shadow-lg border border-border p-1 flex items-center">
        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={(value) => {
            if (value) onModeChange(value as LinkColorMode);
          }}
          className="gap-0.5"
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem
                value="utilization"
                size="sm"
                aria-label="Utilization coloring"
                className={`h-8 w-8 p-0 transition-all ${mode === 'utilization' ? 'bg-[#b31e48] text-white shadow-md' : 'bg-transparent hover:bg-muted'}`}
              >
                <Activity className="h-4 w-4" />
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Utilization View
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem
                value="domain"
                size="sm"
                aria-label="Domain coloring"
                className={`h-8 w-8 p-0 transition-all ${mode === 'domain' ? 'bg-[#b31e48] text-white shadow-md' : 'bg-transparent hover:bg-muted'}`}
              >
                <Layers className="h-4 w-4" />
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Domain View
            </TooltipContent>
          </Tooltip>
        </ToggleGroup>
      </div>
    </TooltipProvider>
  );
}