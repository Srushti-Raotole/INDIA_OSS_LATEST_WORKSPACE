


import { useMemo } from 'react';
import { ArrowRight, Building2, Gauge, Activity, Ruler, Cable, User, Layers, BarChart3, Loader2, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { NetworkLink, TooltipPosition } from '../../types';
import { getUtilizationColorClass, getUtilizationBgClass } from '../../utils/colorUtils';
import { calculateDistanceKm, formatDistance } from '../../utils/distanceUtils';
import { fetchSectorSummary, type MergedSectorSummary } from '../../services/sectorSummaryApi';

interface LinkTooltipProps {
  link: NetworkLink | null;
  position: TooltipPosition;
  /** All links for sector aggregation */
  allLinks?: NetworkLink[];
}

/**
 * Floating tooltip — shows sector summary from API when multiple links share a sector,
 * otherwise shows individual circuit details.
 */
export function LinkTooltip({ link, position, allLinks = [] }: LinkTooltipProps) {
  const sector = link?.circuit?.sector;

  // Check if this sector has multiple links (worth showing sector summary)
  const hasSectorLinks = useMemo(() => {
    if (!sector || allLinks.length === 0) return false;
    return allLinks.filter(l => l.circuit?.sector === sector).length > 1;
  }, [sector, allLinks]);

  // Fetch sector summary from API (cached for 5 min)
  const { data: sectorStats, isLoading: sectorLoading } = useQuery<MergedSectorSummary>({
    queryKey: ['sectorSummary', sector],
    queryFn: () => fetchSectorSummary(sector!),
    enabled: !!sector && hasSectorLinks,
    staleTime: 5 * 60 * 1000,
  });

  if (!link) return null;

  // ====== Sector Summary Tooltip (API-driven) ======
  if (hasSectorLinks && sector) {
    const utilColorClass = sectorStats
      ? sectorStats.avgUtilization >= 80
        ? 'text-destructive'
        : sectorStats.avgUtilization >= 50
          ? 'text-yellow-600'
          : 'text-green-600'
      : '';

    return (
      <div
        className="fixed z-[2000] pointer-events-none"
        style={{ left: position.x + 15, top: position.y - 10 }}
      >
        <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-lg shadow-xl p-3 min-w-[340px] max-w-[420px]">
          {/* Sector Header */}
          <div className="mb-3 pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <span className="font-semibold text-sm text-foreground">Sector: {sector}</span>
            </div>
          </div>

          {sectorLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="ml-2 text-xs text-muted-foreground">Loading sector data...</span>
            </div>
          ) : sectorStats ? (
            <>
              {/* Summary Counts */}
              <div className="grid grid-cols-4 gap-1.5 text-center mb-2">
                {[
                  { label: 'Pairs', value: sectorStats.pairs },
                  { label: 'Channels', value: sectorStats.channels },
                  { label: 'Circuits', value: sectorStats.circuits },
                  { label: 'Customers', value: sectorStats.customers },
                ].map(item => (
                  <div key={item.label} className="p-1.5 bg-muted/30 rounded">
                    <p className="text-muted-foreground text-[10px]">{item.label}</p>
                    <p className="text-xs font-bold text-foreground">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Path counts */}
              <div className="flex gap-2 mb-2">
                <div className="flex-1 text-center text-[10px] p-1 bg-muted/20 rounded border border-amber-400/30">
                  <span className="text-amber-600 dark:text-amber-400 font-semibold">⚡ Working: {sectorStats.working}</span>
                </div>
                <div className="flex-1 text-center text-[10px] p-1 bg-muted/20 rounded border border-green-400/30">
                  <span className="text-green-600 dark:text-green-400 font-semibold">🛡️ Protected: {sectorStats.protected}</span>
                </div>
              </div>

              {/* Capacity */}
              <div className="p-2 bg-muted/30 rounded-lg mb-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground font-medium">Capacity</span>
                  <span className={`font-bold ${utilColorClass}`}>
                    {sectorStats.avgUtilization}%
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-1.5">
                  <div
                    className={`h-full rounded-full transition-all ${getUtilizationBgClass(sectorStats.avgUtilization)}`}
                    style={{ width: `${sectorStats.avgUtilization}%` }}
                  />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                  <div>
                    <p className="text-muted-foreground">Total</p>
                    <p className="font-bold text-foreground">{(sectorStats.capacityTotal / 1000).toFixed(2)} TB</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Used</p>
                    <p className="font-bold text-foreground">{(sectorStats.capacityUsed / 1000).toFixed(2)} TB</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Available</p>
                    <p className="font-bold text-foreground">{(sectorStats.capacityAvailable / 1000).toFixed(2)} TB</p>
                  </div>
                </div>
              </div>

              {/* Utilization Breakdown */}
              <div className="grid grid-cols-3 gap-1.5 text-center mb-2">
                <div className="p-1.5 bg-destructive/10 rounded border border-destructive/20">
                  <p className="text-[10px] text-destructive font-semibold">🔴 High</p>
                  <p className="text-xs font-bold text-destructive">{sectorStats.utilHigh}</p>
                </div>
                <div className="p-1.5 bg-yellow-500/10 rounded border border-yellow-500/20">
                  <p className="text-[10px] text-yellow-600 dark:text-yellow-400 font-semibold">🟡 Medium</p>
                  <p className="text-xs font-bold text-yellow-600 dark:text-yellow-400">{sectorStats.utilMed}</p>
                </div>
                <div className="p-1.5 bg-green-500/10 rounded border border-green-500/20">
                  <p className="text-[10px] text-green-600 dark:text-green-400 font-semibold">🟢 Low</p>
                  <p className="text-xs font-bold text-green-600 dark:text-green-400">{sectorStats.utilLow}</p>
                </div>
              </div>

              {/* Domain Breakdown */}
              {Object.keys(sectorStats.domainCounts).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {Object.entries(sectorStats.domainCounts).map(([d, c]) => (
                    <span key={d} className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${d === 'IP' ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30' : 'bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30'}`}>
                      {d}: {c}
                    </span>
                  ))}
                </div>
              )}

              {/* Technology */}
              {Object.keys(sectorStats.techCounts).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {Object.entries(sectorStats.techCounts).map(([t, c]) => (
                    <span key={t} className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${t === 'NOKIA' ? 'bg-cyan-600/20 text-cyan-700 dark:text-cyan-300 border border-cyan-600/30' : 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30'}`}>
                      {t}: {c}
                    </span>
                  ))}
                </div>
              )}
            </>
          ) : null}

          {/* Hovered circuit info */}
          <div className="mt-2 pt-2 border-t border-border text-[10px] text-muted-foreground">
            <p className="italic">
              Hovering: {link.circuit.circuitUserLabel || link.circuit.channelName}
            </p>
            <p>
              {link.circuit.popASiteName} → {link.circuit.popZSiteName} • {link.utilizationPercent}% util
            </p>
          </div>

          {/* Click hint */}
          <div className="mt-1 text-center text-[10px] text-muted-foreground italic">
            Click link for full details
          </div>
        </div>
      </div>
    );
  }

  // ====== Individual Link Tooltip (no sector / single link) ======
  const { circuit, source, target, utilizationPercent, capacity, usedCapacity } = link;
  const distance = calculateDistanceKm(source.lat, source.lon, target.lat, target.lon);
  const formattedDistance = formatDistance(distance);

  return (
    <div
      className="fixed z-[2000] pointer-events-none"
      style={{ left: position.x + 15, top: position.y - 10 }}
    >
      <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-lg shadow-xl p-3 min-w-[350px] max-w-[450px]">
        {/* Header */}
        <div className="mb-3 pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <Cable className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm text-foreground">Circuit Connection</span>
            <span className={`ml-auto text-xs px-2 py-0.5 rounded ${
              circuit.type === 'NLD' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
            }`}>
              {circuit.type}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 font-mono break-all">
            {circuit.circuitUserLabel || circuit.channelName}
          </p>
        </div>

        {/* Source and Destination */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 p-2 bg-blue-50 dark:bg-blue-950/40 rounded-md border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-1.5 mb-1">
              <Building2 className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">SOURCE</span>
            </div>
            <p className="text-xs font-semibold text-foreground">{circuit.popASiteName}</p>
            <p className="text-[10px] text-muted-foreground">{circuit.cityA} ({circuit.popACircle})</p>
            <p className="text-[10px] text-muted-foreground font-mono truncate" title={circuit.popA}>
              {circuit.popA}
            </p>
            <p className="text-[10px] text-muted-foreground">Port: {circuit.popAPort}</p>
          </div>

          <div className="flex flex-col items-center">
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <span className="text-[10px] text-primary font-semibold">{formattedDistance}</span>
          </div>

          <div className="flex-1 p-2 bg-green-50 dark:bg-green-950/40 rounded-md border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-1.5 mb-1">
              <Building2 className="h-3 w-3 text-green-600 dark:text-green-400" />
              <span className="text-[10px] font-semibold text-green-600 dark:text-green-400">DESTINATION</span>
            </div>
            <p className="text-xs font-semibold text-foreground">{circuit.popZSiteName}</p>
            <p className="text-[10px] text-muted-foreground">{circuit.cityZ} ({circuit.popZCircle})</p>
            <p className="text-[10px] text-muted-foreground font-mono truncate" title={circuit.popZ}>
              {circuit.popZ}
            </p>
            <p className="text-[10px] text-muted-foreground">Port: {circuit.popZPort}</p>
          </div>
        </div>

        {/* Capacity Metrics */}
        <div className="grid grid-cols-4 gap-2 text-xs mb-2">
          <div className="text-center p-1.5 bg-muted/30 rounded">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Gauge className="h-3 w-3 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-[10px]">Capacity</p>
            <p className="font-semibold text-foreground">{capacity}G</p>
          </div>
          <div className="text-center p-1.5 bg-muted/30 rounded">
            <div className="flex items-center justify-center gap-1 mb-0.5">
              <Activity className="h-3 w-3 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-[10px]">Used</p>
            <p className="font-semibold text-foreground">{usedCapacity}G</p>
          </div>
          <div className="text-center p-1.5 bg-muted/30 rounded">
            <p className="text-muted-foreground text-[10px]">Available</p>
            <p className="font-semibold text-foreground">{(capacity - usedCapacity).toFixed(1)}G</p>
          </div>
          <div className="text-center p-1.5 bg-muted/30 rounded">
            <p className="text-muted-foreground text-[10px]">Utilization</p>
            <p className={`font-semibold ${getUtilizationColorClass(utilizationPercent)}`}>
              {utilizationPercent}%
            </p>
          </div>
        </div>

        {/* Utilization Bar */}
        <div className="mb-3">
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${getUtilizationBgClass(utilizationPercent)}`}
              style={{ width: `${utilizationPercent}%` }}
            />
          </div>
        </div>

        {/* Additional Info */}
        <div className="pt-2 border-t border-border grid grid-cols-2 gap-2 text-[10px]">
          <div className="flex items-center gap-1">
            <Layers className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">Layer Rate: </span>
            <span className="font-medium text-foreground">{circuit.layerRate}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground">Circuit: </span>
            <span className="font-medium text-foreground">{circuit.layerRateCircuit}</span>
          </div>
          <div className="flex items-center gap-1">
            <Ruler className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">Distance: </span>
            <span className="font-medium text-primary">{formattedDistance}</span>
          </div>
          {circuit.customerName && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">Customer: </span>
              <span className="font-medium text-foreground">{circuit.customerName}</span>
            </div>
          )}
        </div>

        {/* Click hint */}
        <div className="mt-2 pt-2 border-t border-border text-center text-[10px] text-muted-foreground italic">
          Click link for full details
        </div>
      </div>
    </div>
  );
}
