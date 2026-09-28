// ============================================
// Alarm Details Sidebar
// ============================================

import { AlertTriangle, MapPin, Clock, Hash, Route, Ruler, Wrench, Layers, Server, Shield } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '../../../../components/ui/sheet';
import { Separator } from '../../../../components/ui/separator';
import { Badge } from '../../../../components/ui/badge';
import type { FiberAlarm } from '../../types/alarmTypes';
import { ALARM_COLOR } from '../../types/alarmTypes';
import type { FiberRoute } from '../../types/fiberTypes';

function severityColor(sev: string) {
  const s = sev?.toLowerCase() || '';
  if (s === 'critical') return 'bg-red-600 text-white';
  if (s === 'major') return 'bg-orange-500 text-white';
  if (s === 'minor') return 'bg-amber-500 text-white';
  return 'bg-muted text-foreground';
}

interface AlarmDetailsSidebarProps {
  alarms: FiberAlarm[];
  open: boolean;
  onClose: () => void;
  container?: HTMLElement | null;
  selectedRoute?: FiberRoute | null;
}

export function AlarmDetailsSidebar({
  alarms,
  open,
  onClose,
  container,
  selectedRoute,
}: AlarmDetailsSidebarProps) {
  if (alarms.length === 0 && !selectedRoute) return null;

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="w-[400px] sm:w-[450px] overflow-y-auto z-[2147483647]" container={container}>
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Alarm Details {alarms.length > 0 && `(${alarms.length})`}
          </SheetTitle>
        </SheetHeader>

        {/* Route Info — comprehensive */}
        {selectedRoute && (
          <div className="mb-4 border border-border rounded-lg p-4 bg-muted/30 space-y-3">
            <span className="font-semibold text-sm text-foreground">{selectedRoute.routeName}</span>
            <Separator />
            <div className="space-y-2.5">
              <DetailRow icon={<Route className="h-4 w-4" />} label="Link Name" value={selectedRoute.linkName} />
              <DetailRow icon={<Hash className="h-4 w-4" />} label="Span ID" value={selectedRoute.spanid} mono />
              <DetailRow icon={<Layers className="h-4 w-4" />} label="Type" value={selectedRoute.type} />
              <DetailRow icon={<Wrench className="h-4 w-4" />} label="Methodology" value={selectedRoute.methodology} />
              <DetailRow icon={<Ruler className="h-4 w-4" />} label="Length" value={`${selectedRoute.lengthKms.toFixed(1)} Km`} />
              <DetailRow icon={<Wrench className="h-4 w-4" />} label="Construction" value={selectedRoute.construction} />
            </div>
          </div>
        )}

        {/* Alarm Cards */}
        <div className="space-y-3">
          {alarms.map((alarm) => (
            <div key={alarm.id} className="border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  style={{
                    backgroundColor: ALARM_COLOR,
                    color: '#fff',
                  }}
                >
                  ALARM
                </Badge>
                {alarm.trapSeverity && (
                  <Badge className={severityColor(alarm.trapSeverity)}>
                    {alarm.trapSeverity}
                  </Badge>
                )}
                {alarm.vendor && (
                  <Badge variant="outline" className="text-xs">
                    {alarm.vendor}
                  </Badge>
                )}
                <span className="font-bold text-sm">{alarm.trapType}</span>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Node</p>
                  <p className="text-sm font-bold">{alarm.nodeName}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Hash className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Span ID</p>
                  <p className="text-sm font-bold font-mono">{alarm.spanId}</p>
                </div>
              </div>

              {alarm.ifDescr && (
                <div className="flex items-start gap-3">
                  <Server className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Port</p>
                    <p className="text-sm font-bold font-mono">{alarm.ifDescr}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Received</p>
                  <p className="text-sm font-bold">{alarm.rcvdTime}</p>
                </div>
              </div>

              {alarm.vendor && (
                <div className="flex items-start gap-3">
                  <Shield className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Vendor</p>
                    <p className="text-sm font-bold">{alarm.vendor}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DetailRow({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`text-sm font-medium truncate ${mono ? 'font-mono' : ''}`}>{value || '-'}</div>
      </div>
    </div>
  );
}
