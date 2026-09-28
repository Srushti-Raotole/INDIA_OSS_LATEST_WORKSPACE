
import { MapPin, Gauge, Activity, Building2, ArrowRight, Cable, User, Ruler, Layers, Server, Hash, Loader2, Users, Table2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../../../components/ui/sheet';
import { Badge } from '../../../../components/ui/badge';
import { Separator } from '../../../../components/ui/separator';
import { ScrollArea } from '../../../../components/ui/scroll-area';
import { Progress } from '../../../../components/ui/progress';
import { Button } from '../../../../components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { NetworkLink } from '../../types';
import { calculateDistanceKm, formatDistance } from '../../utils/distanceUtils';
import { getUtilizationColorClass, getUtilizationBgClass } from '../../utils/colorUtils';
import { fetchSectorSummary, type MergedSectorSummary } from '../../services/sectorSummaryApi';

// ============================================
// Props Interface
// ============================================

interface LinkDetailsSidebarProps {
  /** Link to display details for */
  link: NetworkLink | null;
  /** Whether sidebar is open */
  open: boolean;
  /** Callback when sidebar is closed */
  onClose: () => void;
  /** Container for portal (for fullscreen support) */
  container?: HTMLElement | null;
  /** All links in the same sector (for sector breakdown table) */
  sectorLinks?: NetworkLink[];
  /** Callback to switch to connectivity table with sector filter */
  onViewInTable?: (sector: string) => void;
}

// ============================================
// Component
// ============================================

/**
 * Sidebar that displays full link/circuit details
 * Opens when user clicks on a link in the map
 */
export function LinkDetailsSidebar({ link, open, onClose, container, sectorLinks = [], onViewInTable }: LinkDetailsSidebarProps) {
  const sector = link?.circuit?.sector;
  
  // Fetch sector summary from API (same data as left panel)
  const { data: sectorApiData, isLoading: sectorApiLoading } = useQuery<MergedSectorSummary>({
    queryKey: ['sectorSummary', sector],
    queryFn: () => fetchSectorSummary(sector!),
    enabled: !!sector && open,
    staleTime: 5 * 60 * 1000,
  });

  if (!link) return null;

  const { circuit, source, target, utilizationPercent, capacity, usedCapacity } = link;
  
  // Calculate distance between source and target
  const distance = calculateDistanceKm(source.lat, source.lon, target.lat, target.lon);
  const formattedDistance = formatDistance(distance);

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent 
        side="right"
        className="w-[450px] sm:w-[550px] max-w-[90vw] z-[2147483647] p-0 overflow-hidden"
        container={container}
      >
        <SheetHeader className="p-4 pb-2 border-b bg-muted/30">
          <SheetTitle className="text-lg font-semibold flex items-center gap-2">
            <Cable className="h-5 w-5 text-primary" />
            {circuit.sector ? `Sector Details` : 'Circuit Details'}
          </SheetTitle>
          {/* Circuit User Label - Main identifier shown to users */}

        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="p-4 space-y-4">
            
         

            {/* Sector info */}
            {circuit.sector && (
              <div className="flex items-center justify-between gap-2 p-2 bg-primary/10 rounded-lg">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Sector</p>
                    <p className="text-sm font-semibold">{circuit.sector}</p>
                  </div>
                </div>
                {onViewInTable && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={() => { onViewInTable(circuit.sector!); onClose(); }}
                  >
                    <Table2 className="h-3 w-3" />
                    View in Table
                  </Button>
                )}
              </div>
            )}


            <Separator />



            {/* ========== Sector Summary (API-driven — same as left panel) ========== */}
            {sector && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Sector: {sector}
                </h4>

                {sectorApiLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="ml-2 text-xs text-muted-foreground">Loading sector data...</span>
                  </div>
                ) : sectorApiData ? (
                  <>
                    {/* Summary Counts */}
                    <div className="grid grid-cols-4 gap-1.5 text-center">
                      {[
                        { label: 'Pairs', value: sectorApiData.pairs },
                        { label: 'Channels', value: sectorApiData.channels },
                        { label: 'Circuits', value: sectorApiData.circuits },
                        { label: 'Customers', value: sectorApiData.customers },
                      ].map(item => (
                        <div key={item.label} className="p-1.5 bg-muted/50 rounded-lg">
                          <p className="text-[10px] text-muted-foreground">{item.label}</p>
                          <p className="text-sm font-bold">{item.value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Path Counts */}
                    <div className="flex gap-2">
                      <Badge variant="outline" className="flex-1 justify-center text-[10px] border-amber-400 text-amber-600 dark:text-amber-400">
                        ⚡ Working: {sectorApiData.working}
                      </Badge>
                      <Badge variant="outline" className="flex-1 justify-center text-[10px] border-green-400 text-green-600 dark:text-green-400">
                        🛡️ Protected: {sectorApiData.protected}
                      </Badge>
                    </div>

                    {/* Capacity */}
                    <div className="p-2.5 bg-muted/30 rounded-lg space-y-1.5">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground font-medium">Capacity</span>
                        <span className={`font-bold text-sm ${
                          sectorApiData.avgUtilization >= 80 ? 'text-destructive' :
                          sectorApiData.avgUtilization >= 50 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {sectorApiData.avgUtilization}%
                        </span>
                      </div>
                      <Progress value={sectorApiData.avgUtilization} className="h-2" />
                      <div className="grid grid-cols-3 gap-2 text-center text-xs mt-1">
                        <div>
                          <p className="text-muted-foreground">Total</p>
                          <p className="font-bold">{(sectorApiData.capacityTotal / 1000).toFixed(2)} TB</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Used</p>
                          <p className="font-bold">{(sectorApiData.capacityUsed / 1000).toFixed(2)} TB</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Available</p>
                          <p className="font-bold">{(sectorApiData.capacityAvailable / 1000).toFixed(2)} TB</p>
                        </div>
                      </div>
                    </div>

                    {/* Utilization Breakdown */}
                    <div className="p-2.5 bg-muted/30 rounded-lg">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1.5">Utilization Breakdown</p>
                      <div className="grid grid-cols-3 gap-1.5 text-center">
                        <div className="p-1.5 bg-destructive/10 rounded-lg border border-destructive/20">
                          <p className="text-[10px] text-destructive font-semibold">🔴 High</p>
                          <p className="text-sm font-bold text-destructive">{sectorApiData.utilHigh}</p>
                        </div>
                        <div className="p-1.5 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                          <p className="text-[10px] text-yellow-600 dark:text-yellow-400 font-semibold">🟡 Medium</p>
                          <p className="text-sm font-bold text-yellow-600 dark:text-yellow-400">{sectorApiData.utilMed}</p>
                        </div>
                        <div className="p-1.5 bg-green-500/10 rounded-lg border border-green-500/20">
                          <p className="text-[10px] text-green-600 dark:text-green-400 font-semibold">🟢 Low</p>
                          <p className="text-sm font-bold text-green-600 dark:text-green-400">{sectorApiData.utilLow}</p>
                        </div>
                      </div>
                    </div>

                    {/* Domain */}
                    {Object.keys(sectorApiData.domainCounts).length > 0 && (
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Domain</p>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(sectorApiData.domainCounts).map(([d, c]) => (
                            <span key={d} className={`px-2 py-0.5 rounded-md text-xs font-semibold ${d === 'IP' ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30' : 'bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30'}`}>
                              {d}: {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Type */}
                    {Object.keys(sectorApiData.typeCounts).length > 0 && (
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Type</p>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(sectorApiData.typeCounts).map(([t, c]) => (
                            <Badge key={t} variant={t === 'NLD' ? 'default' : 'secondary'} className="text-xs">
                              {t}: {c}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Technology */}
                    {Object.keys(sectorApiData.techCounts).length > 0 && (
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Technology</p>
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(sectorApiData.techCounts).map(([t, c]) => (
                            <span key={t} className={`px-2 py-0.5 rounded-md text-xs font-semibold ${t === 'NOKIA' ? 'bg-cyan-600/20 text-cyan-700 dark:text-cyan-300 border border-cyan-600/30' : 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30'}`}>
                              {t === 'NOKIA' ? '🔴' : '🔵'} {t}: {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Customers */}
                    {sectorApiData.customerNames.length > 0 && (
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1.5 flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Customers ({sectorApiData.customerNames.length})
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {sectorApiData.customerNames.map(c => (
                            <Badge key={c} variant="outline" className="text-[9px] h-5">
                              {c}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-destructive">Failed to load sector data</p>
                )}
              </div>
            )}

            <Separator />


          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
