
import { X, Users, BarChart3, Loader2 } from 'lucide-react';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { ScrollArea } from '../../../../components/ui/scroll-area';
import { Progress } from '../../../../components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { fetchSectorSummary, type MergedSectorSummary } from '../../services/sectorSummaryApi';

interface SectorSummaryPanelProps {
  sector: string;
  onClear: () => void;
  container?: HTMLElement | null;
}

export function SectorSummaryPanel({ sector, onClear }: SectorSummaryPanelProps) {
  const { data: stats, isLoading, isError } = useQuery<MergedSectorSummary>({
    queryKey: ['sectorSummary', sector],
    queryFn: () => fetchSectorSummary(sector),
    enabled: !!sector,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="absolute top-16 left-4 z-[500] w-[320px] bg-background/95 backdrop-blur-sm border border-border rounded-xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-primary/10 border-b border-border">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <span className="font-bold text-sm">📍 {sector}</span>
        </div>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onClear}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <ScrollArea className="max-h-[calc(100vh-160px)]">
        <div className="p-3 space-y-3">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="ml-2 text-xs text-muted-foreground">Loading...</span>
            </div>
          )}

          {isError && (
            <div className="text-xs text-destructive text-center py-4">Failed to load sector data</div>
          )}

          {stats && <SectorPanelContent stats={stats} />}
        </div>
      </ScrollArea>
    </div>
  );
}

function SectorPanelContent({ stats }: { stats: MergedSectorSummary }) {
  const utilColorClass = stats.avgUtilization >= 80
    ? 'text-destructive'
    : stats.avgUtilization >= 50
      ? 'text-yellow-600'
      : 'text-green-600';

  return (
    <>
      {/* Summary Counts Row */}
      <div className="grid grid-cols-4 gap-1.5 text-center">
        {[
          { label: 'Pairs', value: stats.pairs },
          { label: 'Channels', value: stats.channels },
          { label: 'Circuits', value: stats.circuits },
          { label: 'Customers', value: stats.customers },
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
          ⚡ Working: {stats.working}
        </Badge>
        <Badge variant="outline" className="flex-1 justify-center text-[10px] border-green-400 text-green-600 dark:text-green-400">
          🛡️ Protected: {stats.protected}
        </Badge>
      </div>

      {/* Capacity */}
      <div className="p-2.5 bg-muted/30 rounded-lg space-y-1.5">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-muted-foreground font-medium">Capacity</span>
          <span className={`font-bold text-sm ${utilColorClass}`}>
            {stats.avgUtilization}%
          </span>
        </div>
        <Progress value={stats.avgUtilization} className="h-2" />
        <div className="grid grid-cols-3 gap-2 text-center text-xs mt-1">
          <div>
            <p className="text-muted-foreground">Total</p>
            <p className="font-bold">{(stats.capacityTotal / 1000).toFixed(2)} TB</p>
          </div>
          <div>
            <p className="text-muted-foreground">Used</p>
            <p className="font-bold">{(stats.capacityUsed / 1000).toFixed(2)} TB</p>
          </div>
          <div>
            <p className="text-muted-foreground">Available</p>
            <p className="font-bold">{(stats.capacityAvailable / 1000).toFixed(2)} TB</p>
          </div>
        </div>
      </div>

      {/* Utilization Breakdown */}
      <div className="p-2.5 bg-muted/30 rounded-lg">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1.5">Utilization Breakdown</p>
        <div className="grid grid-cols-3 gap-1.5 text-center">
          <div className="p-1.5 bg-destructive/10 rounded-lg border border-destructive/20">
            <p className="text-[10px] text-destructive font-semibold">🔴 High</p>
            <p className="text-sm font-bold text-destructive">{stats.utilHigh}</p>
          </div>
          <div className="p-1.5 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
            <p className="text-[10px] text-yellow-600 dark:text-yellow-400 font-semibold">🟡 Medium</p>
            <p className="text-sm font-bold text-yellow-600 dark:text-yellow-400">{stats.utilMed}</p>
          </div>
          <div className="p-1.5 bg-green-500/10 rounded-lg border border-green-500/20">
            <p className="text-[10px] text-green-600 dark:text-green-400 font-semibold">🟢 Low</p>
            <p className="text-sm font-bold text-green-600 dark:text-green-400">{stats.utilLow}</p>
          </div>
        </div>
      </div>

      {/* Domain */}
      {Object.keys(stats.domainCounts).length > 0 && (
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Domain</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(stats.domainCounts).map(([d, c]) => (
              <span key={d} className={`px-2 py-0.5 rounded-md text-xs font-semibold ${d === 'IP' ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30' : 'bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30'}`}>
                {d}: {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Type */}
      {Object.keys(stats.typeCounts).length > 0 && (
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Type</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(stats.typeCounts).map(([t, c]) => (
              <Badge key={t} variant={t === 'NLD' ? 'default' : 'secondary'} className="text-xs">
                {t}: {c}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Technology */}
      {Object.keys(stats.techCounts).length > 0 && (
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">Technology</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(stats.techCounts).map(([t, c]) => (
              <span key={t} className={`px-2 py-0.5 rounded-md text-xs font-semibold ${t === 'NOKIA' ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30' : 'bg-cyan-600/20 text-cyan-700 dark:text-cyan-300 border border-cyan-600/30'}`}>
                {t === 'NOKIA' ? '🔴' : '🔵'} {t}: {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Customers */}
      {stats.customerNames.length > 0 && (
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1.5 flex items-center gap-1">
            <Users className="h-3 w-3" />
            Customers ({stats.customerNames.length})
          </p>
          <div className="flex flex-wrap gap-1">
            {stats.customerNames.map(c => (
              <Badge key={c} variant="outline" className="text-[9px] h-5">
                {c}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
