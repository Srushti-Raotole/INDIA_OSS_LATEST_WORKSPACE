
// ============================================
// Page Mode Toggle - Alarm / Management
// ============================================

import { Shield, Settings } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '../../../../components/ui/toggle-group';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../../components/ui/tooltip';
import type { PageMode } from '../../types/alarmTypes';
import { logActivity } from '../../../../utils/activityLogger';

interface PageModeToggleProps {
  mode: PageMode;
  onModeChange: (mode: PageMode) => void;
}

export function PageModeToggle({ mode, onModeChange }: PageModeToggleProps) {
  return (
    <TooltipProvider>
      <div className="bg-background/95 backdrop-blur-sm rounded-lg shadow-lg border border-border p-1 flex items-center">
        <ToggleGroup
          type="single"
          value={mode}
          // onValueChange={(v) => v && onModeChange(v as PageMode)}
          onValueChange={(v) => {
            if (!v) return;

            const selectedMode = v as PageMode;

            // 🔹 Log activity
            logActivity({
              activity:
                selectedMode === "management"
                  ? "Switched to Management View on Map"
                  : "Switched to Alarm View on Map",
              actionName:
                selectedMode === "management"
                  ? "MANAGEMENT_VIEW_OPEN"
                  : "ALARM_VIEW_OPEN",
              module: "ACTIVE SERVER",
            });

            // 🔹 Call original handler
            onModeChange(selectedMode);
          }}
          className="gap-0.5"
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem
                value="management"
                size="sm"
                className={`h-8 px-3 text-xs font-medium transition-all gap-1.5 ${mode === 'management'
                    ? 'bg-[#b31e48] text-white shadow-md'
                    : 'bg-transparent hover:bg-muted'
                  }`}
                aria-label="Management view"
              >
                <Settings className="h-3.5 w-3.5" />
                Management
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Network management &amp; analytics
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem
                value="alarm"
                size="sm"
                className={`h-8 px-3 text-xs font-medium transition-all gap-1.5 ${mode === 'alarm'
                    ? 'bg-destructive text-destructive-foreground shadow-md'
                    : 'bg-transparent hover:bg-muted'
                  }`}
                aria-label="Alarm view"
              >
                <Shield className="h-3.5 w-3.5" />
                Alarm
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Fiber alarm monitoring
            </TooltipContent>
          </Tooltip>
        </ToggleGroup>
      </div>
    </TooltipProvider>
  );
}
