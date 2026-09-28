import { Cable, Workflow } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '../../../../components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../../components/ui/tooltip';

/** Fiber route color modes */
export type FiberColorMode = 'type' | 'methodology';

interface FiberColorModeToggleProps {
  /** Current color mode */
  mode: FiberColorMode;
  /** Callback when mode changes */
  onModeChange: (mode: FiberColorMode) => void;
}

/**
 * Toggle between Type and Methodology coloring modes for fiber routes
 * 
 * Type mode: Routes colored by type (NLD=green, METRO=purple)
 * Methodology mode: Routes colored by methodology (OPGW=blue, UG=amber)
 */
export function FiberColorModeToggle({ mode, onModeChange }: FiberColorModeToggleProps) {
  return (
    <TooltipProvider>
      <div className="bg-background/95 backdrop-blur-sm rounded-lg shadow-lg border border-border p-1 flex items-center">
        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={(value) => {
            if (value) onModeChange(value as FiberColorMode);
          }}
          className="gap-0.5"
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem
                value="type"
                size="sm"
                aria-label="Route type coloring"
                className={`h-8 w-8 p-0 transition-all ${mode === 'type' ? 'bg-[#b31e48] text-white shadow-md' : 'bg-transparent hover:bg-muted'}`}
              >
                <Cable className="h-4 w-4" />
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Route Type (NLD/METRO)
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem
                value="methodology"
                size="sm"
                aria-label="Methodology coloring"
                className={`h-8 w-8 p-0 transition-all ${mode === 'methodology' ? 'bg-[#b31e48] text-white shadow-md' : 'bg-transparent hover:bg-muted'}`}
              >
                <Workflow className="h-4 w-4" />
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Methodology (OPGW/UG)
            </TooltipContent>
          </Tooltip>
        </ToggleGroup>
      </div>
    </TooltipProvider>
  );
}
