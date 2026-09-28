
import { useState } from 'react';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../../../../components/ui/collapsible';
import { ALARM_SEVERITY_COLORS, TECHNOLOGY_COLORS_HEX } from '../../utils/technologyColors';

export function AlarmLegend() {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="bg-background/95 backdrop-blur-sm rounded-lg shadow-lg border border-border">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full flex items-center justify-between gap-2 p-2.5 h-auto hover:bg-transparent"
          >
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">Alarm Legend</span>
            </div>
            {isOpen ? (
              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </Button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-3 py-2.5 space-y-2.5 text-[11px] border-t border-border">
            {/* Fiber Route Status */}
            <div className="pb-2 border-b border-border">
              <p className="text-muted-foreground mb-1.5 font-semibold uppercase text-[9px] tracking-wider">Fiber Routes</p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-1.5 rounded-full" style={{ backgroundColor: ALARM_SEVERITY_COLORS.NORMAL }} />
                <span className="text-foreground font-medium">Normal</span>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="w-8 h-1.5 rounded-full" style={{ backgroundColor: ALARM_SEVERITY_COLORS.ALARM }} />
                <span className="text-foreground font-medium">Active Alarm</span>
              </div>
            </div>

            {/* Technology Sites */}
            <div>
              <p className="text-muted-foreground mb-1.5 font-semibold uppercase text-[9px] tracking-wider">Site Technology</p>
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: TECHNOLOGY_COLORS_HEX.CIENA }}
                />
                <span className="text-foreground font-medium">CIENA</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: TECHNOLOGY_COLORS_HEX.NOKIA }}
                />
                <span className="text-foreground font-medium">NOKIA</span>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
