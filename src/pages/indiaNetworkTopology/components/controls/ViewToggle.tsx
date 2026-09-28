import { LayoutDashboard, MapPinned, Grid3x3 } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '../../../../components/ui/toggle-group';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../../components/ui/tooltip';
import { logActivity } from '../../../../utils/activityLogger'; 

// ============================================
// Types
// ============================================

export type ViewMode = 'dashboard' | 'map' | 'connectivity';

interface ViewToggleProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

// ============================================
// Component
// ============================================

export function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {

  const handleViewChange = (value: string) => {
    if (!value) return;

    const view = value as ViewMode;

    logActivity({
      activity: `${view.toUpperCase()} view opened`,
      actionName: `${view.toUpperCase()}_VIEW`,
      module: 'DASHBOARD',
    });

    onViewChange(view);
  };

  return (
    <TooltipProvider>
      <div className="bg-background/95 backdrop-blur-sm rounded-lg shadow-lg border border-border p-1 flex items-center">
        <ToggleGroup 
          type="single" 
          value={currentView} 
          onValueChange={handleViewChange} 
          className="gap-0.5"
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem 
                value="dashboard" 
                size="sm"
                className={`h-8 w-8 p-0 transition-all ${
                  currentView === 'dashboard'
                    ? 'bg-[#b31e48] text-white shadow-md'
                    : 'bg-transparent hover:bg-muted'
                }`}
                aria-label="Dashboard view"
              >
                <LayoutDashboard className="h-4 w-4" />
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Dashboard
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem 
                value="map" 
                size="sm"
                className={`h-8 w-8 p-0 transition-all ${
                  currentView === 'map'
                    ? 'bg-[#b31e48] text-white shadow-md'
                    : 'bg-transparent hover:bg-muted'
                }`}
                aria-label="Map view"
              >
                <MapPinned className="h-4 w-4" />
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Map
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem 
                value="connectivity" 
                size="sm"
                className={`h-8 w-8 p-0 transition-all ${
                  currentView === 'connectivity'
                    ? 'bg-[#b31e48] text-white shadow-md'
                    : 'bg-transparent hover:bg-muted'
                }`}
                aria-label="Table view"
              >
                <Grid3x3 className="h-4 w-4" />
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Table
            </TooltipContent>
          </Tooltip>
        </ToggleGroup>
      </div>
    </TooltipProvider>
  );
}