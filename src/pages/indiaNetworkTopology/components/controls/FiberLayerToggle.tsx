
import { Cable, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../../../components/ui/popover';
import { Checkbox } from '../../../../components/ui/checkbox';
import { Label } from '../../../../components/ui/label';
import { Separator } from '../../../../components/ui/separator';
import type { FiberLayerState } from '../../types/fiberTypes';

// ============================================
// Props Interface
// ============================================

interface FiberLayerToggleProps {
  /** Current fiber layer visibility state */
  state: FiberLayerState;
  /** Callback when state changes */
  onStateChange: (state: FiberLayerState) => void;
  /** Whether fiber data is loaded */
  hasData: boolean;
}

// ============================================
// Component
// ============================================

/**
 * Toggle button with popover for fiber layer visibility
 * Shows fiber icon with indicator when layers are visible
 */
export function FiberLayerToggle({
  state,
  onStateChange,
  hasData,
}: FiberLayerToggleProps) {
  const isAnyVisible = state.showRoutes || state.showSites;

  const handleRoutesChange = (checked: boolean) => {
    onStateChange({ ...state, showRoutes: checked });
  };

  const handleSitesChange = (checked: boolean) => {
    onStateChange({ ...state, showSites: checked });
  };

  const handleToggleAll = () => {
    const newValue = !isAnyVisible;
    onStateChange({ showRoutes: newValue, showSites: newValue });
  };

  if (!hasData) {
    return null;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`h-9 gap-2 bg-background/95 backdrop-blur-sm shadow-lg hover:bg-muted ${
            isAnyVisible ? 'border-green-500 text-green-600 dark:text-green-400' : ''
          }`}
          title="Fiber layer visibility"
        >
          <Cable className="h-4 w-4" />
          <span className="text-xs font-medium">Fiber</span>
          {isAnyVisible && (
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          )}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-56 p-3" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Fiber Layers</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={handleToggleAll}
            >
              {isAnyVisible ? (
                <>
                  <EyeOff className="h-3 w-3 mr-1" />
                  Hide All
                </>
              ) : (
                <>
                  <Eye className="h-3 w-3 mr-1" />
                  Show All
                </>
              )}
            </Button>
          </div>

          <Separator />

          <div className="space-y-3">
            {/* Routes Toggle */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="fiber-routes"
                checked={state.showRoutes}
                onCheckedChange={handleRoutesChange}
              />
              <Label 
                htmlFor="fiber-routes" 
                className="text-sm cursor-pointer flex items-center gap-2"
              >
                <div className="w-8 h-1 bg-green-500 rounded" />
                Routes
              </Label>
            </div>

            {/* Sites Toggle */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="fiber-sites"
                checked={state.showSites}
                onCheckedChange={handleSitesChange}
              />
              <Label 
                htmlFor="fiber-sites" 
                className="text-sm cursor-pointer flex items-center gap-2"
              >
                <div 
                  className="w-3 h-3 bg-blue-500 border-2 border-white shadow-sm"
                  style={{ transform: 'rotate(45deg)' }}
                />
                Sites
              </Label>
            </div>
          </div>

          <Separator />

          <div className="text-[10px] text-muted-foreground">
            Fiber routes from KML data
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
