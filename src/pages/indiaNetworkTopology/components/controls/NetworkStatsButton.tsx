import { BarChart3, Network, Activity, TrendingUp } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../../../components/ui/popover';
import { Button } from '../../../../components/ui/button';
import { NetworkStatistics } from '../../types';

// ============================================
// Types
// ============================================

interface NetworkStatsButtonProps {
  /** Calculated network statistics */
  statistics: NetworkStatistics;
  /** Count of NLD circuits */
  nldCount?: number;
  /** Count of METRO circuits */
  metroCount?: number;
}

// ============================================
// Utility Functions
// ============================================

/**
 * Get text color class based on utilization percentage
 * 
 * LIBRARY: Tailwind CSS utility classes
 * CHANGE THIS: Modify thresholds to change color breakpoints
 */
const getUtilizationColor = (percent: number): string => {
  if (percent >= 80) return 'text-destructive';
  if (percent >= 50) return 'text-yellow-500';
  return 'text-green-500';
};

// ============================================
// Component
// ============================================

/**
 * Button that opens network statistics popover
 * 
 * LIBRARY: shadcn/ui Popover component
 * Reference: https://ui.shadcn.com/docs/components/popover
 * 
 * POSITION: Bottom-right, controlled by parent
 */
export function NetworkStatsButton({ 
  statistics, 
  nldCount = 0, 
  metroCount = 0 
}: NetworkStatsButtonProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 bg-background/95 backdrop-blur-sm shadow-lg hover:bg-muted"
          title="View network statistics"
        >
          <BarChart3 className="h-4 w-4" />
        </Button>
      </PopoverTrigger>

      <PopoverContent 
        side="top" 
        align="end" 
        className="w-56 p-0"
      >
        {/* Header */}
        <div className="flex items-center gap-1.5 p-2.5 border-b border-border">
          <Activity className="h-3.5 w-3.5 text-primary" />
          <h3 className="text-xs font-semibold text-foreground">Network Statistics</h3>
        </div>
        
        {/* Stats Content */}
        <div className="px-3 py-2.5">
          <div className="space-y-2 text-xs">
            {/* ========== Node & Link Count ========== */}
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-1">
                <Network className="h-3 w-3" /> Nodes
              </span>
              <span className="font-semibold text-foreground">{statistics.totalNodes}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Links</span>
              <span className="font-semibold text-foreground">{statistics.totalLinks}</span>
            </div>
            
            {/* ========== Average Utilization ========== */}
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> Avg Util
              </span>
              <span className={`font-semibold ${getUtilizationColor(statistics.avgUtilization)}`}>
                {statistics.avgUtilization}%
              </span>
            </div>

            {/* ========== Utilization Breakdown ========== */}
            <div className="pt-2 border-t border-border">
              <p className="text-[10px] text-muted-foreground mb-1.5 font-medium">By Utilization</p>
              <div className="flex justify-between items-center text-[10px]">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-destructive" />
                  High (&gt;80%)
                </span>
                <span className="font-medium">{statistics.highUtilLinks}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] mt-1">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-yellow-500" />
                  Medium (50-80%)
                </span>
                <span className="font-medium">{statistics.mediumUtilLinks}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] mt-1">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Low (&lt;50%)
                </span>
                <span className="font-medium">{statistics.lowUtilLinks}</span>
              </div>
            </div>

            {/* ========== Type Breakdown ========== */}
            <div className="pt-2 border-t border-border">
              <p className="text-[10px] text-muted-foreground mb-1.5 font-medium">By Type</p>
              <div className="flex justify-between items-center text-[10px]">
                <span className="flex items-center gap-1">
                  <span className="w-4 h-0.5 bg-primary" />
                  NLD
                </span>
                <span className="font-medium">{nldCount}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] mt-1">
                <span className="flex items-center gap-1">
                  <span className="w-4 h-0.5 border-t-2 border-dashed border-primary" />
                  METRO
                </span>
                <span className="font-medium">{metroCount}</span>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
