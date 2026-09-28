
import { useState, useMemo } from 'react';
import {
  Cable, MapPin, Hash, Info,
  AlertTriangle, Database, Clock, CheckCircle, ChevronDown, ChevronRight, Eye,
  Cpu, Timer,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '../../../../components/ui/sheet';
import { Separator } from '../../../../components/ui/separator';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import type { FiberAlarm, PlotAlarmLink, SitePairGroup } from '../../types/alarmTypes';
import { ALARM_COLOR } from '../../types/alarmTypes';
import { OtsInsightsDialog } from './OtsInsightsDialog';

interface AlarmRouteDetailsSidebarProps {
  group?: SitePairGroup | null;
  getAlarmsForSpan: (spanId: string) => FiberAlarm[];
  spanHasAlarm: (spanId: string) => boolean;
  open: boolean;
  onClose: () => void;
  container?: HTMLElement | null;
}

/** Format duration from rcvdTime to now */
function getAlarmDuration(rcvdTime: string): string {
  const ms = Date.now() - new Date(rcvdTime).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hrs < 24) return `${hrs}h ${remMins}m ago`;
  const days = Math.floor(hrs / 24);
  const remHrs = hrs % 24;
  return `${days}d ${remHrs}h ago`;
}

export function AlarmRouteDetailsSidebar({
  group,
  getAlarmsForSpan,
  spanHasAlarm,
  open,
  onClose,
  container,
}: AlarmRouteDetailsSidebarProps) {
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [insightsSpanId, setInsightsSpanId] = useState('');
  const [insightsRouteName, setInsightsRouteName] = useState('');
  const [expandedSpans, setExpandedSpans] = useState<Set<string>>(new Set());

  if (!group) return null;

  const totalSpans = group.spans.length;
  const alarmedCount = group.spans.filter(s => spanHasAlarm(s.spanId)).length;
  const pathName = `${group.siteA} → ${group.siteB}`;

  const toggleSpanDetails = (spanId: string) => {
    setExpandedSpans(prev => {
      const next = new Set(prev);
      next.has(spanId) ? next.delete(spanId) : next.add(spanId);
      return next;
    });
  };

  const handleInsights = (span: PlotAlarmLink) => {
    setInsightsSpanId(span.spanId);
    setInsightsRouteName(`${span.erpSiteNameA} → ${span.erpSiteNameB}`);
    setInsightsOpen(true);
    onClose();
  };

  return (
    <>
      <Sheet open={open && !insightsOpen} onOpenChange={(isOpen) => !isOpen && onClose()}>
        <SheetContent className="w-[440px] sm:w-[480px] overflow-y-auto z-[2147483647] p-0" container={container}>
          {/* Header */}
          <div className="px-5 pt-5 pb-4">
            <SheetHeader className="pb-0">
              <SheetTitle className="flex items-center gap-2 text-base">
                <Cable className="h-5 w-5 text-primary" />
                Link Details
              </SheetTitle>
            </SheetHeader>

            <div className="mt-3 space-y-2.5">
              <h3 className="text-[15px] font-bold leading-snug">{pathName}</h3>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-[14px] px-2 py-0.5 font-medium">
                  {totalSpans} Span{totalSpans > 1 ? 's' : ''}
                </Badge>
                {alarmedCount > 0 ? (
                  <Badge className="text-[14px] px-2 py-0.5 border-0 text-white font-semibold" style={{ backgroundColor: ALARM_COLOR }}>
                    ⚠ {alarmedCount} Alarmed
                  </Badge>
                ) : (
                  <Badge className="text-[14px] px-2 py-0.5 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-medium">
                    No Alarms
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Span list */}
          <div className="px-5 py-4 space-y-3">
            <h4 className="font-semibold text-[15px] text-muted-foreground uppercase tracking-wider">
              Spans on this Link
            </h4>

            <div className="space-y-2.5">
              {group.spans.map((span) => (
                <SpanCard
                  key={span.spanId}
                  span={span}
                  hasAlarm={spanHasAlarm(span.spanId)}
                  alarms={getAlarmsForSpan(span.spanId)}
                  isExpanded={expandedSpans.has(span.spanId)}
                  onToggleExpand={() => toggleSpanDetails(span.spanId)}
                  onInsights={() => handleInsights(span)}
                />
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <OtsInsightsDialog
        open={insightsOpen}
        onClose={() => setInsightsOpen(false)}
        spanId={insightsSpanId}
        adapter="MCP"
        routeName={insightsRouteName}
      />
    </>
  );
}

// ---- Span Card ----
function SpanCard({
  span,
  hasAlarm,
  alarms,
  isExpanded,
  onToggleExpand,
  onInsights,
}: {
  span: PlotAlarmLink;
  hasAlarm: boolean;
  alarms: FiberAlarm[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onInsights: () => void;
}) {
  return (
    <div
      className={`rounded-lg border transition-colors ${
        hasAlarm
          ? 'border-red-500/40 bg-red-500/10 dark:bg-red-900/20'
          : 'border-border bg-card'
      }`}
    >
      {/* Main row */}
      <div className="flex items-center gap-3 px-3.5 py-3">
        <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${hasAlarm ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-bold font-mono">{span.spanId}</span>
            <span className="text-[15px] font-mono text-muted-foreground">OTS: {span.otsId}</span>
          </div>
          <p className="text-[14px] text-muted-foreground mt-0.5 truncate">
            {span.erpSiteNameA} → {span.erpSiteNameB}
          </p>
        </div>
        {hasAlarm && alarms.length > 0 ? (
          <Badge className="text-[15px] px-1.5 py-0 border-0 text-white shrink-0" style={{ backgroundColor: ALARM_COLOR }}>
            {alarms.length} Alarm{alarms.length > 1 ? 's' : ''}
          </Badge>
        ) : (
          <span className="text-[15px] text-emerald-600 dark:text-emerald-400 font-medium shrink-0">No Alarms</span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 px-3.5 pb-3">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-[14px] px-2.5 gap-1.5 text-muted-foreground hover:text-foreground"
          onClick={onToggleExpand}
        >
          {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          <Eye className="h-3.5 w-3.5" />
          View Information
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-[14px] px-3 gap-1.5 border-primary/30 text-primary hover:bg-primary/10 ml-auto font-semibold"
          onClick={onInsights}
        >
          <Database className="h-3.5 w-3.5" />
          INSIGHTS
        </Button>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="px-3.5 pb-3.5 border-t border-border/50">
          <div className="pt-3 space-y-3">
            {/* Span Information */}
            <div className="space-y-2">
              <h5 className="font-semibold text-[15px] text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Info className="h-3 w-3" />
                Span Information
              </h5>
              <div className="grid gap-1.5 bg-muted/30 rounded-md p-3">
                <DetailRow icon={<Hash className="h-3 w-3" />} label="Span ID" value={span.spanId} mono />
                <DetailRow icon={<Cable className="h-3 w-3" />} label="OTS ID" value={span.otsId} mono />
                {span.technology && (
                  <DetailRow icon={<Cpu className="h-3 w-3" />} label="Technology" value={span.technology} />
                )}
                <Separator className="my-1" />
                <DetailRow icon={<MapPin className="h-3 w-3" />} label="Site A" value={span.erpSiteNameA} />
                <DetailRow icon={<Cpu className="h-3 w-3" />} label="Node A" value={span.nodeNameA} mono />
                <DetailRow icon={<MapPin className="h-3 w-3" />} label="Coord A" value={`${span.latitudeA.toFixed(4)}, ${span.longitudeA.toFixed(4)}`} mono />
                <Separator className="my-1" />
                <DetailRow icon={<MapPin className="h-3 w-3" />} label="Site B" value={span.erpSiteNameB} />
                <DetailRow icon={<Cpu className="h-3 w-3" />} label="Node B" value={span.nodeNameB} mono />
                <DetailRow icon={<MapPin className="h-3 w-3" />} label="Coord B" value={`${span.latitudeB.toFixed(4)}, ${span.longitudeB.toFixed(4)}`} mono />
              </div>
            </div>

            {/* Alarms */}
            {hasAlarm && alarms.length > 0 && (
              <div className="space-y-2">
                <h5 className="font-semibold text-[15px] text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3" />
                  Active Alarms ({alarms.length})
                </h5>
                <div className="space-y-1.5">
                  {alarms.map((alarm) => (
                    <AlarmCard key={alarm.id} alarm={alarm} />
                  ))}
                </div>
              </div>
            )}

            {!hasAlarm && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-md p-2.5 text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle className="h-3.5 w-3.5" />
                No active alarms on this span
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Alarm Card ----
function AlarmCard({ alarm }: { alarm: FiberAlarm }) {
  const duration = getAlarmDuration(alarm.rcvdTime);

  return (
    <div
      className="rounded-md p-3 space-y-2 bg-red-50 dark:bg-red-900/15"
      style={{ border: `1px solid ${ALARM_COLOR}40` }}
    >
      <div className="flex items-center justify-between flex-wrap gap-1">
        <div className="flex items-center gap-1.5">
          <Badge className="text-[15px] px-1.5 py-0 border-0 text-white" style={{ backgroundColor: ALARM_COLOR }}>
            {alarm.trapSeverity || 'ALARM'}
          </Badge>
          <span className="font-bold text-xs">{alarm.trapType}</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Timer className="h-3 w-3" />
          <span className="text-[15px] font-medium">{duration}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[14px]">
        <div>
          <span className="text-muted-foreground">Node: </span>
          <span className="font-semibold">{alarm.nodeName}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Port: </span>
          <span className="font-bold font-mono text-[15px]">{alarm.ifDescr || '—'}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Vendor: </span>
          <span className="font-semibold">{alarm.vendor || '—'}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="font-bold text-[15px]">{alarm.rcvdTime}</span>
        </div>
      </div>
    </div>
  );
}

// ---- Detail Row ----
function DetailRow({
  icon,
  label,
  value,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-muted-foreground shrink-0">{icon}</div>
      <span className="text-[15px] font-medium text-muted-foreground w-16 shrink-0">{label}</span>
      <span className={`text-[14px] ${mono ? 'font-mono text-[15px]' : 'font-semibold'} truncate`}>
        {value || '—'}
      </span>
    </div>
  );
}
