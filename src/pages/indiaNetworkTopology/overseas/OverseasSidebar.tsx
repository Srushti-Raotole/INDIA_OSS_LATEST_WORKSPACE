
import { Cable, Ruler, MapPin, X, Maximize2, Info, Tag, ChevronDown, ChevronUp, Globe2, Table as TableIcon } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Switch } from '../../../components/ui/switch';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Separator } from '../../../components/ui/separator';
import { Badge } from '../../../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../../components/ui/dialog';
import type { OverseasCable, OverseasCableId, OverseasSegment, OverseasVisibility } from './types';

interface OverseasSidebarProps {
  cables: OverseasCable[];
  visibility: OverseasVisibility;
  onToggleCable: (id: OverseasCableId) => void;
  visibleTotalLengthKm: number;
  selectedSegment: OverseasSegment | null;
  onClearSelection: () => void;
  /** Fly the map to the bounds of all currently visible overseas cables */
  onFitToBounds?: () => void;
  /** Fly the map to the bounds of a single cable */
  onFitCable?: (id: OverseasCableId) => void;
  /** Always-on landing labels toggle (active past zoom 5) */
  showLandingLabels: boolean;
  onToggleLandingLabels: (v: boolean) => void;
  /** Open the rotatable 3D globe view */
  onOpenGlobe?: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export function OverseasSidebar({
  cables,
  visibility,
  onToggleCable,
  visibleTotalLengthKm,
  selectedSegment,
  onClearSelection,
  onFitToBounds,
  onFitCable,
  showLandingLabels,
  onToggleLandingLabels,
  onOpenGlobe,
  isLoading,
  error,
}: OverseasSidebarProps) {
  const hasVisible = cables.some((c) => visibility[c.id]);
  const [collapsed, setCollapsed] = useState(false);
  return (
    <Card className="w-[410px] shadow-xl bg-background/95 backdrop-blur-sm border-border">
      <CardHeader className="py-2.5 px-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm flex items-center gap-2 min-w-0">
            <Cable className="h-4 w-4 text-primary shrink-0" />
            <span className="truncate">Overseas Cables</span>
            {collapsed && (
              <span className="text-[10px] font-normal text-muted-foreground tabular-nums shrink-0">
                · {formatKm(visibleTotalLengthKm)} km
              </span>
            )}
          </CardTitle>
          <div className="flex items-center gap-1 shrink-0">
 
            {onFitToBounds && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-[11px] gap-1"
                onClick={onFitToBounds}
                disabled={!hasVisible}
                title="Fit map to all visible overseas cables"
              >
                <Maximize2 className="h-3 w-3" />
                Fit
              </Button>
            )}
            {/* Collapse / expand toggle */}
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => setCollapsed((c) => !c)}
              title={collapsed ? 'Expand panel' : 'Collapse panel'}
              aria-label={collapsed ? 'Expand panel' : 'Collapse panel'}
            >
              {collapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
      </CardHeader>
      {!collapsed && (
      <CardContent className="px-3 pb-3 space-y-2.5">
        {/* Total length summary */}
        {/* <div className="rounded-md bg-muted/50 p-2.5">
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Total length (visible)
          </div>
          <div className="text-xl font-semibold tabular-nums">
            {formatKm(visibleTotalLengthKm)}
            <span className="text-xs font-normal text-muted-foreground ml-1">km</span>
          </div>
        </div> */}

        {/* Landing labels toggle */}
        <div className="flex items-center justify-between rounded-md border border-border px-2.5 py-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <Tag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <div className="text-[11px] font-medium leading-tight">Landing labels</div>
              {/* <div className="text-[10px] text-muted-foreground leading-tight">
                Auto-show past zoom 5
              </div> */}
            </div>
          </div>
          <Switch
            checked={showLandingLabels}
            onCheckedChange={onToggleLandingLabels}
            aria-label="Toggle landing labels"
          />
        </div>

        {/* 3D Globe view (Overseas only) */}
        {onOpenGlobe && (
          <Button
            size="sm"
            variant="outline"
            className="w-full h-8 gap-1 justify-center"
            onClick={onOpenGlobe}
          >
            <Globe2 className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] font-medium">Open 3D Globe View</span>
          </Button>
        )}

        {isLoading && (
          <div className="text-xs text-muted-foreground">Loading KML files…</div>
        )}
        {error && (
          <div className="text-xs text-destructive bg-destructive/10 rounded p-2">{error}</div>
        )}

        <Separator />

        {/* Per-cable list, grouped by `group` */}
        <ScrollArea className="max-h-[320px] pr-2">
          <div className="space-y-3">
            {(['core', 'additional'] as const).map((groupKey) => {
              const list = cables.filter((c) => (c.group ?? 'core') === groupKey);
              if (list.length === 0) return null;
              return (
                <div key={groupKey} className="space-y-1.5">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground px-0.5">
                    {groupKey === 'core' ? 'Core cables (KML)' : ''}
                  </div>
                  {list.map((cable) => (
                    <CableRow
                      key={cable.id}
                      cable={cable}
                      visible={!!visibility[cable.id]}
                      onToggle={() => onToggleCable(cable.id)}
                      onFit={onFitCable ? () => onFitCable(cable.id) : undefined}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Selected segment details */}
        {selectedSegment && (
          <>
            <Separator />
            <div className="rounded-md border border-border p-2 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <div className="text-[11px] font-semibold truncate" title={selectedSegment.name}>
                  {selectedSegment.name}
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-5 w-5 shrink-0"
                  onClick={onClearSelection}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              {/* <div className="text-[10px] text-muted-foreground">
                {selectedSegment.coordinates.length} points · {formatKm(selectedSegment.lengthKm)} km
              </div> */}
            </div>
          </>
        )}
      </CardContent>
      )}
    </Card>
  );
}

function formatKm(km: number): string {
  if (km >= 1000) return km.toLocaleString(undefined, { maximumFractionDigits: 0 });
  return km.toFixed(1);
}

// ---------------------------------------------------------------------------
// CableRow + PlotDataDialog
// ---------------------------------------------------------------------------
function CableRow({
  cable,
  visible,
  onToggle,
  onFit,
}: {
  cable: OverseasCable;
  visible: boolean;
  onToggle: () => void;
  onFit?: () => void;
}) {
  return (
    <div className="rounded-md border border-border p-2 space-y-1.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-1.5 min-w-0 flex-1">
          <span
            className="inline-block h-3 w-3 rounded-sm shrink-0 mt-0.5"
            style={{ background: cable.color }}
          />
          <span
            className="text-[11px] font-medium leading-snug break-words"
            title={cable.displayName}
          >
            {cable.displayName}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <PlotDataDialog cable={cable} />
          {onFit && (
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={onFit}
              disabled={!visible}
              title={`Fit to ${cable.id}`}
            >
              <Maximize2 className="h-3 w-3" />
            </Button>
          )}
          <Switch
            checked={visible}
            onCheckedChange={onToggle}
            aria-label={`Toggle ${cable.id}`}
          />
        </div>
      </div>
      <div className="flex items-center gap-1 flex-wrap">
        {/* <Badge variant="secondary" className="h-4 text-[9px] gap-1 px-1.5">
          <Ruler className="h-2.5 w-2.5" />
          {formatKm(cable.totalLengthKm)} km
        </Badge> */}
        {/* <Badge variant="outline" className="h-4 text-[9px] px-1.5">
          {cable.segments.length} seg
        </Badge> */}
        {/* <Badge variant="outline" className="h-4 text-[9px] gap-1 px-1.5">
          <MapPin className="h-2.5 w-2.5" />
          {cable.landings.length}
        </Badge> */}
      </div>
    </div>
  );
}

function PlotDataDialog({ cable }: { cable: OverseasCable }) {
  const totalPoints = cable.segments.reduce((a, s) => a + s.coordinates.length, 0);
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          title="View data used to plot this cable"
        >
          <TableIcon className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{ background: cable.color }}
            />
            {cable.displayName}
          </DialogTitle>
          <DialogDescription>
            Source: <strong>{cable.source === 'kml' ? 'Bundled KML' : 'TeleGeography GeoJSON'}</strong>
            {' · '}{cable.segments.length} segments · {totalPoints} points · {formatKm(cable.totalLengthKm)} km
            {cable.meta?.lengthKmReported
              ? ` · reported ${formatKm(cable.meta.lengthKmReported)} km`
              : ''}
            {cable.meta?.rfs ? ` · RFS ${cable.meta.rfs}` : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-auto pr-1">
          {/* Segments table */}
          <section>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
              Segments ({cable.segments.length})
            </div>
            <div className="rounded-md border border-border overflow-hidden">
              <table className="w-full text-[11px]">
                <thead className="bg-muted/60">
                  <tr className="text-left">
                    <th className="px-2 py-1.5 font-medium">#</th>
                    <th className="px-2 py-1.5 font-medium">Name</th>
                    <th className="px-2 py-1.5 font-medium text-right">Points</th>
                    <th className="px-2 py-1.5 font-medium text-right">Length (km)</th>
                    <th className="px-2 py-1.5 font-medium">Start [lon, lat]</th>
                    <th className="px-2 py-1.5 font-medium">End [lon, lat]</th>
                  </tr>
                </thead>
                <tbody>
                  {cable.segments.map((seg, i) => {
                    const s = seg.coordinates[0];
                    const e = seg.coordinates[seg.coordinates.length - 1];
                    return (
                      <tr key={seg.id} className="border-t border-border">
                        <td className="px-2 py-1 tabular-nums text-muted-foreground">{i + 1}</td>
                        <td className="px-2 py-1">{seg.name}</td>
                        <td className="px-2 py-1 text-right tabular-nums">{seg.coordinates.length}</td>
                        <td className="px-2 py-1 text-right tabular-nums">{seg.lengthKm.toFixed(1)}</td>
                        <td className="px-2 py-1 tabular-nums text-muted-foreground">
                          {s ? `${s[0].toFixed(3)}, ${s[1].toFixed(3)}` : '—'}
                        </td>
                        <td className="px-2 py-1 tabular-nums text-muted-foreground">
                          {e ? `${e[0].toFixed(3)}, ${e[1].toFixed(3)}` : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Landings table */}
          {cable.landings.length > 0 && (
            <section>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">
                Landings ({cable.landings.length})
              </div>
              <div className="rounded-md border border-border overflow-hidden">
                <table className="w-full text-[11px]">
                  <thead className="bg-muted/60">
                    <tr className="text-left">
                      <th className="px-2 py-1.5 font-medium">#</th>
                      <th className="px-2 py-1.5 font-medium">Name</th>
                      <th className="px-2 py-1.5 font-medium">Longitude</th>
                      <th className="px-2 py-1.5 font-medium">Latitude</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cable.landings.map((l, i) => (
                      <tr key={l.id} className="border-t border-border">
                        <td className="px-2 py-1 tabular-nums text-muted-foreground">{i + 1}</td>
                        <td className="px-2 py-1">{l.name}</td>
                        <td className="px-2 py-1 tabular-nums">{l.coordinates[0].toFixed(4)}</td>
                        <td className="px-2 py-1 tabular-nums">{l.coordinates[1].toFixed(4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
