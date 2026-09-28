
import { Building2, MapPin, Network, Layers } from 'lucide-react';
import { NetworkNode, TooltipPosition } from '../../types';
import { calculateNodeCapacity, calculateNodeAvgUtilization } from '../../utils/nodeUtils';
import { getUtilizationColorClass, getUtilizationBgClass } from '../../utils/colorUtils';

interface NodeTooltipProps {
  node: NetworkNode | null;
  position: TooltipPosition;
}


export function NodeTooltip({ node, position }: NodeTooltipProps) {
  if (!node) return null;

  const uniqueCircuits = node.circuits.length;
  const totalCapacity = calculateNodeCapacity(node);
  const avgUtilization = calculateNodeAvgUtilization(node);

  return (
    <div
      className="fixed z-[2000] pointer-events-none"
      style={{
        left: position.x + 15,
        top: position.y - 10,
      }}
    >
      <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-lg shadow-xl p-3 min-w-[280px] max-w-[350px]">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
          <div className="p-1.5 bg-primary/10 rounded-md">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold text-sm text-foreground">{node.siteName}</h4>
            <p className="text-xs text-muted-foreground">{node.name}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">City:</span>
            <span className="font-medium text-foreground">{node.city}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Network className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">Circle:</span>
            <span className="font-medium text-foreground">{node.circle}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Layers className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">Circuits:</span>
            <span className="font-medium text-foreground">{uniqueCircuits}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Capacity:</span>
            <span className="font-medium text-foreground">{totalCapacity}G</span>
          </div>
        </div>

        <div className="mt-2 pt-2 border-t border-border">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Avg Utilization</span>
            <span className={`font-semibold ${getUtilizationColorClass(avgUtilization)}`}>
              {avgUtilization}%
            </span>
          </div>
          <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${getUtilizationBgClass(avgUtilization)}`}
              style={{ width: `${avgUtilization}%` }}
            />
          </div>
        </div>

        <div className="mt-2 text-[10px] text-muted-foreground">
          <span>Lat: {node.lat.toFixed(5)}, Lon: {node.lon.toFixed(5)}</span>
        </div>
      </div>
    </div>
  );
}
