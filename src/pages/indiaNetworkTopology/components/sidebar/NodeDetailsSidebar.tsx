
import { useState, useMemo, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../../../components/ui/sheet';
import { Badge } from '../../../../components/ui/badge';
import { ScrollArea } from '../../../../components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { 
  Building2, MapPin, Network, Layers, Activity,
  ArrowRight, Cpu, Ruler, Cable, User, Tag, Hash, Filter,
} from 'lucide-react';
import { NetworkNode } from '../../types';
import {
  calculateCapacityStats,
  calculateCountStats,
} from '../../utils/capacityCalculations';
import { 
  getUtilizationColorClass, 
  getUtilizationBgWithOpacity 
} from '../../utils/colorUtils';
import { calculateDistanceKm, formatDistance } from '../../utils/distanceUtils';

// ============================================
// Props Interface
// ============================================

interface NodeDetailsSidebarProps {
  node: NetworkNode | null;
  open: boolean;
  onClose: () => void;
  container?: HTMLElement | null;
}

// ============================================
// Component
// ============================================

/**
 * Slide-out sidebar showing complete node details.
 * Uses shared calculateCapacityStats / calculateCountStats from capacityCalculations.ts
 * for consistent metrics with the sector summary dashboard.
 */
export function NodeDetailsSidebar({ node, open, onClose, container }: NodeDetailsSidebarProps) {
  const [sectorFilter, setSectorFilter] = useState<string>('all');

  useEffect(() => {
    setSectorFilter('all');
  }, [node?.id]);

  // Get unique sectors from this node's circuits
  const availableSectors = useMemo(() => {
    if (!node) return [];
    const sectors = [...new Set(node.circuits.map(c => c.sector).filter(Boolean))] as string[];
    return sectors.sort();
  }, [node]);

  // Filter circuits by selected sector
  const filteredCircuits = useMemo(() => {
    if (!node) return [];
    if (sectorFilter === 'all') return node.circuits;
    return node.circuits.filter(c => c.sector === sectorFilter);
  }, [node, sectorFilter]);

  if (!node) return null;

  // ===== Stats from shared calculations (distinct Working channels) =====
  // Uses capacityCalculations.ts: same logic as SectorSummaryDashboard
  const capacityStats = calculateCapacityStats(filteredCircuits);
  const countStats = calculateCountStats(filteredCircuits);

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent 
        side="right"
        className="w-[450px] sm:w-[550px] max-w-[90vw] z-[2147483647] p-0 flex flex-col"
        container={container}
      >
        {/* ========== Header ========== */}
        <SheetHeader className="p-4 pb-2 border-b border-border flex-shrink-0">
          <SheetTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-5 w-5 text-primary flex-shrink-0" />
            <span className="truncate">{node.siteName}</span>
          </SheetTitle>
        </SheetHeader>

        {/* ========== Scrollable Content ========== */}
        <ScrollArea className="flex-1 px-4 py-4">
          <div className="space-y-4">
            
            {/* ========== Basic Info ========== */}
            <div className="p-3 bg-muted/50 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">City:</span>
                <span className="font-medium">{node.city}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Network className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">Circle:</span>
                <Badge variant="outline">{node.circle}</Badge>
              </div>
              {node.technology && (
                <div className="flex items-center gap-2 text-sm">
                  <Cpu className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">Technology:</span>
                  <Badge variant="secondary" className="text-xs">{node.technology}</Badge>
                </div>
              )}
              <div className="flex items-start gap-2 text-sm">
                <Cable className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground">Device ID:</span>
                <code className="text-xs bg-background px-1.5 py-0.5 rounded break-all flex-1">{node.name}</code>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Port:</span>
                <code className="text-xs bg-background px-1.5 py-0.5 rounded">{node.port}</code>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Coordinates:</span>
                <span className="text-xs font-mono">{node.lat.toFixed(6)}, {node.lon.toFixed(6)}</span>
              </div>
            </div>

            {/* ========== Sector Filter ========== */}
            {availableSectors.length > 1 && (
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Select value={sectorFilter} onValueChange={setSectorFilter}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Filter by sector" />
                  </SelectTrigger>
                  <SelectContent className="z-[2147483647]">
                    <SelectItem value="all">All Sectors ({node.circuits.length} circuits)</SelectItem>
                    {availableSectors.map(s => (
                      <SelectItem key={s} value={s}>{s} ({node.circuits.filter(c => c.sector === s).length})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* ========== Per-Sector Capacity Breakdown (when All Sectors) ========== */}
            {sectorFilter === 'all' && availableSectors.length > 1 && (
              <div className="p-3 bg-muted/30 rounded-lg">
                <h4 className="text-xs font-semibold mb-2 flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  Sector-wise Utilization
                </h4>
                <div className="space-y-2">
                  {availableSectors.map(sector => {
                    const sectorCircuits = node.circuits.filter(c => c.sector === sector);
                    // Uses shared calculateCapacityStats (distinct Working channels)
                    const sectorCap = calculateCapacityStats(sectorCircuits);
                    return (
                      <div key={sector} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <button
                            className="font-medium text-left hover:text-primary transition-colors truncate max-w-[60%]"
                            onClick={() => setSectorFilter(sector)}
                            title={`Filter to ${sector}`}
                          >
                            {sector}
                          </button>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span>{sectorCap.totalUsed}/{sectorCap.totalCapacity}G</span>
                            <span className={`font-bold ${
                              sectorCap.avgUtilization >= 80 ? 'text-red-500' : sectorCap.avgUtilization >= 50 ? 'text-yellow-500' : 'text-green-500'
                            }`}>{sectorCap.avgUtilization}%</span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              sectorCap.avgUtilization >= 80 ? 'bg-red-500' : sectorCap.avgUtilization >= 50 ? 'bg-yellow-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(sectorCap.avgUtilization, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ========== Statistics Cards ========== */}
            {/* Stats use shared calculateCapacityStats & calculateCountStats */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-primary/10 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Hash className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Distinct Channels</span>
                </div>
                <p className="text-xl font-bold text-foreground">{countStats.distinctChannels}</p>
                <p className="text-[10px] text-muted-foreground">
                  ({countStats.totalPairs} total circuits)
                </p>
              </div>
              <div className={`p-3 rounded-lg ${getUtilizationBgWithOpacity(capacityStats.avgUtilization)}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Avg Utilization</span>
                </div>
                <p className={`text-xl font-bold ${getUtilizationColorClass(capacityStats.avgUtilization)}`}>
                  {capacityStats.avgUtilization}%
                </p>
                <p className="text-[10px] text-muted-foreground">
                  (Working path, distinct channels)
                </p>
              </div>
            </div>
            
            {/* Capacity Card - Full Width */}
            {/* Capacity from distinct Working channels via calculateCapacityStats */}
            <div className="p-3 bg-secondary/10 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Layers className="h-4 w-4 text-secondary" />
                <span className="text-sm font-medium">Capacity (Distinct Working Channels)</span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold text-foreground">{capacityStats.totalCapacity}G</p>
                  <p className="text-[10px] text-muted-foreground">Created</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{capacityStats.totalUsed}G</p>
                  <p className="text-[10px] text-muted-foreground">Used</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-foreground">{(capacityStats.totalCapacity - capacityStats.totalUsed)}G</p>
                  <p className="text-[10px] text-muted-foreground">Available</p>
                </div>
              </div>
              <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    capacityStats.avgUtilization >= 80 ? 'bg-red-500' :
                    capacityStats.avgUtilization >= 50 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(capacityStats.avgUtilization, 100)}%` }}
                />
              </div>
            </div>

            {/* ========== Connected Circuits List ========== */}
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Layers className="h-4 w-4 flex-shrink-0" />
                <span>Connected Circuits ({filteredCircuits.length})</span>
              </h4>
              <div className="space-y-3">
                {filteredCircuits.map((circuit, index) => {
                  const distanceKm = calculateDistanceKm(
                    circuit.popALat, circuit.popALon,
                    circuit.popZLat, circuit.popZLon
                  );

                  return (
                    <div key={index} className="p-3 border border-border rounded-lg text-xs bg-card">
                      {/* Circuit Header */}
                      <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
                        <div className="flex items-center gap-1 flex-wrap">
                          <Badge variant="outline" className={`text-[10px] ${circuit.type === 'NLD' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-300' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-300'}`}>
                            {circuit.type}
                          </Badge>
                          {circuit.circuitType && (
                            <Badge className={`text-[10px] ${circuit.circuitType === 'IP' ? 'bg-blue-500 text-white hover:bg-blue-500' : 'bg-orange-500 text-white hover:bg-orange-500'}`}>
                              {circuit.circuitType}
                            </Badge>
                          )}
                          {circuit.path && (
                            <Badge variant="outline" className={`text-[10px] ${circuit.path === 'P' ? 'border-green-500 text-green-600 dark:text-green-400' : circuit.path === 'W' ? 'border-amber-500 text-amber-600 dark:text-amber-400' : ''}`}>
                              {circuit.path === 'P' ? 'Protected' : circuit.path === 'W' ? 'Working' : 'Other'}
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-[10px]">{circuit.layerRate}</Badge>
                          <Badge className="text-[10px] bg-slate-600">{circuit.layerRateCircuit}</Badge>
                        </div>
                        <span className={`font-semibold ${getUtilizationColorClass(circuit.utilizationPercent)}`}>
                          {circuit.utilizationPercent}%
                        </span>
                      </div>
                      
                      {/* Channel Name */}
                      <p className="text-muted-foreground mb-2 text-[10px] break-all" title={circuit.channelName}>
                        <span className="text-foreground font-medium">Channel:</span> {circuit.channelName}
                      </p>
                      
                      {/* Source → Destination with Distance */}
                      <div className="bg-muted/30 rounded-md p-2 mb-2">
                        <div className="flex items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 mb-1">
                              <div className="w-2 h-2 rounded-full bg-blue-500" />
                              <span className="text-[10px] font-medium text-blue-600">SOURCE</span>
                              <Badge variant="outline" className="text-[9px] px-1 h-4">{circuit.popACircle}</Badge>
                            </div>
                            <p className="font-semibold break-words" title={circuit.popASiteName}>{circuit.popASiteName}</p>
                            <p className="text-muted-foreground text-[10px] break-all" title={circuit.popA}>{circuit.popA}</p>
                            <p className="text-muted-foreground text-[10px]">Port: {circuit.popAPort}</p>
                            <p className="text-muted-foreground text-[10px]">{circuit.cityA}</p>
                          </div>
                          <div className="flex flex-col items-center justify-center py-2 flex-shrink-0">
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            <div className="flex items-center gap-1 mt-1 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded">
                              <Ruler className="h-3 w-3 text-amber-600" />
                              <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">{formatDistance(distanceKm)}</span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0 text-right">
                            <div className="flex items-center justify-end gap-1 mb-1">
                              <Badge variant="outline" className="text-[9px] px-1 h-4">{circuit.popZCircle}</Badge>
                              <span className="text-[10px] font-medium text-green-600">DEST</span>
                              <div className="w-2 h-2 rounded-full bg-green-500" />
                            </div>
                            <p className="font-semibold break-words" title={circuit.popZSiteName}>{circuit.popZSiteName}</p>
                            <p className="text-muted-foreground text-[10px] break-all" title={circuit.popZ}>{circuit.popZ}</p>
                            <p className="text-muted-foreground text-[10px]">Port: {circuit.popZPort}</p>
                            <p className="text-muted-foreground text-[10px]">{circuit.cityZ}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Sector, Capacity & Customer */}
                      {circuit.sector && (
                        <div className="flex items-center gap-1 mb-1 text-[10px]">
                          <MapPin className="h-3 w-3 text-primary" />
                          <span className="text-muted-foreground">Sector:</span>
                          <span className="font-semibold">{circuit.sector}</span>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-muted-foreground">Capacity:</span>
                          <span className="font-medium ml-1">{circuit.usedCapacity}/{circuit.createdCapacity}G</span>
                        </div>
                        {circuit.customerName && (
                          <div className="text-right">
                            <User className="h-3 w-3 inline mr-1 text-muted-foreground" />
                            <span className="font-medium">{circuit.customerName}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Circuit User Label */}
                      {circuit.circuitUserLabel && (
                        <div className="mt-2 pt-2 border-t border-border">
                          <div className="flex items-start gap-1">
                            <Tag className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <span className="text-[10px] text-muted-foreground break-all">{circuit.circuitUserLabel}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
