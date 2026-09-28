import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../../../components/ui/dialog';
import { Badge } from '../../../components/ui/badge';
import { Separator } from '../../../components/ui/separator';
import {
  AlertTriangle,
  Hash,
  Shield,
  Server,
  ArrowRight,
  Clock,
  Radio,
} from 'lucide-react';
import type { ApiAlarm } from '../types';

interface AlarmDetailsDialogProps {
  alarm: ApiAlarm | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ALARM_COLOR = '#ef4444';

function severityClass(sev?: string) {
  const s = (sev || '').toLowerCase();
  if (s === 'critical') return 'bg-red-600 text-white hover:bg-red-600';
  if (s === 'major') return 'bg-orange-500 text-white hover:bg-orange-500';
  if (s === 'minor') return 'bg-amber-500 text-white hover:bg-amber-500';
  if (s === 'warning') return 'bg-yellow-500 text-white hover:bg-yellow-500';
  if (s === 'clear') return 'bg-emerald-600 text-white hover:bg-emerald-600';
  return 'bg-muted text-foreground';
}

export function AlarmDetailsDialog({ alarm, open, onOpenChange }: AlarmDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
        <DialogTitle className="sr-only">Alarm Details</DialogTitle>
        <DialogDescription className="sr-only">
          Detailed information for the selected alarm.
        </DialogDescription>

        {/* Header */}
        <div className="px-5 py-3 border-b bg-destructive/5 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <span className="text-base font-semibold tracking-tight">Alarm Details</span>
        </div>

        {!alarm ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No alarm selected.
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {/* Top badges + trap type */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge style={{ backgroundColor: ALARM_COLOR, color: '#fff' }} className="hover:opacity-90">
                  ALARM
                </Badge>
                {alarm.TrapSeverity && (
                  <Badge className={severityClass(alarm.TrapSeverity)}>
                    {alarm.TrapSeverity}
                  </Badge>
                )}
                {alarm.vendor && (
                  <Badge variant="outline" className="text-xs">{alarm.vendor}</Badge>
                )}
              </div>
              <div className="text-lg font-bold leading-tight">
                {alarm.traptype || alarm.alarmName || 'Unknown Alarm'}
              </div>
            </div>

            <Separator />

            {/* Meta rows */}
            <div className="space-y-3">
              {alarm.alarmid && (
                <DetailRow icon={<Hash className="h-4 w-4" />} label="Alarm ID" value={alarm.alarmid} mono />
              )}
              {alarm.vendor && (
                <DetailRow icon={<Shield className="h-4 w-4" />} label="Vendor" value={alarm.vendor} />
              )}
              {alarm.max_rcvd_time && (
                <DetailRow icon={<Clock className="h-4 w-4" />} label="Received" value={alarm.max_rcvd_time} />
              )}
            </div>

            <Separator />

            {/* Source → Destination */}
            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Radio className="h-3.5 w-3.5" />
                Endpoint
              </div>

              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <EndpointCard
                  label="Source"
                  node={alarm.sourceNode || alarm.source_label}
                  port={alarm.sourcePort}
                />
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                <EndpointCard
                  label="Destination"
                  node={alarm.destNode || alarm.target_label}
                  port={alarm.destPort}
                />
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function EndpointCard({ label, node, port }: { label: string; node?: string; port?: string }) {
  return (
    <div className="rounded-md border bg-background p-3 min-w-0">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
        {label}
      </div>
      <div className="flex items-start gap-1.5">
        <Server className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
        <div className="text-sm font-bold font-mono truncate" title={node || '-'}>
          {node || '-'}
        </div>
      </div>
      {port && (
        <div className="text-xs text-muted-foreground font-mono mt-1 truncate" title={port}>
          {port}
        </div>
      )}
    </div>
  );
}

function DetailRow({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">{label}</div>
        <div className={`text-sm font-semibold truncate ${mono ? 'font-mono' : ''}`}>{value}</div>
      </div>
    </div>
  );
}
