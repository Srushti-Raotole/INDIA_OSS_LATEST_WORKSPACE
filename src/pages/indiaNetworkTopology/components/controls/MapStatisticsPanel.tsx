
import { Network, Activity, TrendingUp } from 'lucide-react';
import { NetworkStatistics } from '../../types';

interface MapStatisticsPanelProps {
  /** Calculated network statistics */
  statistics: NetworkStatistics;
}


const getUtilizationColor = (percent: number): string => {
  if (percent >= 80) return 'text-destructive';    // High utilization (red)
  if (percent >= 50) return 'text-yellow-500';     // Medium utilization (yellow)
  return 'text-green-500';                          // Low utilization (green)
};


export function MapStatisticsPanel({ statistics }: MapStatisticsPanelProps) {
  return (
    <div className="bg-background/95 backdrop-blur-sm rounded-lg shadow-lg border border-border min-w-[180px]">
      {/* Header */}
      <div className="flex items-center gap-1.5 p-2.5 border-b border-border">
        <Activity className="h-3.5 w-3.5 text-primary" />
        <h3 className="text-xs font-semibold text-foreground">Network Stats</h3>
      </div>
      
      {/* Stats Content - Always visible */}
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
          {/* 
           * LIBRARY: Color function from this file (getUtilizationColor)
           * CHANGE THIS: Modify thresholds in getUtilizationColor above
           */}
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

          {/* ========== Capacity Info (Optional) ========== */}
          {/* 
          UNCOMMENT to show total capacity:
          <div className="pt-2 border-t border-border text-[10px]">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Total Capacity</span>
              <span className="font-medium">{statistics.totalCapacity}G</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-muted-foreground">Used Capacity</span>
              <span className="font-medium">{statistics.totalUsed}G</span>
            </div>
          </div>
          */}
        </div>
      </div>
    </div>
  );
}
