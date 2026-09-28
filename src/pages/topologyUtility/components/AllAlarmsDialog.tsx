import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../../../components/ui/dialog';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import {
  AlertTriangle, ArrowRight, Server, Radio, Clock, Shield, Zap,
  Cable, Search, X, Building2, Copy, Check,
} from 'lucide-react';
import type { ApiAlarm } from '../types';

export interface AllAlarmsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alarms: ApiAlarm[];
  topologyName?: string;
}

interface Row {
  alarmid: string;
  traptype: string;
  TrapSeverity: string;
  vendor: string;
  client: string;
  parameter1: string;
  sourceNode: string;
  sourcePort: string;
  destNode: string;
  destPort: string;
  rcvdTime: string;
  linkKey: string;
}

const SEVERITY_META: Record<string, { label: string; dot: string; chip: string; ring: string; border: string; bg: string }> = {
  critical: { label: 'Critical', dot: 'bg-red-600',     chip: 'bg-red-600 text-white hover:bg-red-600',        ring: 'ring-red-600/30',    border: 'border-red-500/40',    bg: 'bg-red-500/5' },
  major:    { label: 'Major',    dot: 'bg-orange-500',  chip: 'bg-orange-500 text-white hover:bg-orange-500',  ring: 'ring-orange-500/30', border: 'border-orange-500/40', bg: 'bg-orange-500/5' },
  minor:    { label: 'Minor',    dot: 'bg-amber-500',   chip: 'bg-amber-500 text-white hover:bg-amber-500',    ring: 'ring-amber-500/30',  border: 'border-amber-500/40', bg: 'bg-amber-500/5' },
  warning:  { label: 'Warning',  dot: 'bg-yellow-500',  chip: 'bg-yellow-500 text-white hover:bg-yellow-500',  ring: 'ring-yellow-500/30', border: 'border-yellow-500/40', bg: 'bg-yellow-500/5' },
  clear:    { label: 'Clear',    dot: 'bg-emerald-600', chip: 'bg-emerald-600 text-white hover:bg-emerald-600',ring: 'ring-emerald-600/30',border: 'border-emerald-600/40',bg: 'bg-emerald-500/5' },
};

const SEV_RANK: Record<string, number> = { critical: 0, major: 1, minor: 2, warning: 3, clear: 4 };

function sevMeta(sev: string) {
  return SEVERITY_META[(sev || '').toLowerCase()] ?? {
    label: sev || '—', dot: 'bg-muted-foreground', chip: 'bg-muted text-foreground',
    ring: 'ring-border', border: 'border-border', bg: 'bg-muted/30',
  };
}

export function AllAlarmsDialog({ open, onOpenChange, alarms, topologyName }: AllAlarmsDialogProps) {
  const [query, setQuery] = useState('');
  const [sevFilter, setSevFilter] = useState<string | null>(null);

  const rows = useMemo<Row[]>(() => {
    return alarms
      .filter(a => (a.severity || a.TrapSeverity || '').toUpperCase() !== 'CLEAR')
      .map(a => {
        const sourceNode = a.sourceNode || a.source_label || '—';
        const sourcePort = a.sourcePort || '—';
        const destNode = a.destNode || a.target_label || '—';
        const destPort = a.destPort || '—';
        return {
          alarmid: a.alarmid || '—',
          traptype: a.traptype || a.alarmName || '—',
          TrapSeverity: a.TrapSeverity || a.severity || '—',
          vendor: a.vendor || '—',
          client: (a as any).client || '—',
          parameter1: (a as any).Parameter1 || (a as any).parameter1 || '—',
          sourceNode, sourcePort, destNode, destPort,
          rcvdTime: a.max_rcvd_time || (a as any).rcvd_Time || '—',
          linkKey: (a as any).linkId || `${sourceNode}||${destNode}`,
        };
      });
  }, [alarms]);

  const summary = useMemo(() => {
    const counts: Record<string, number> = {};
    rows.forEach(r => {
      const k = (r.TrapSeverity || '').toLowerCase() || 'other';
      counts[k] = (counts[k] || 0) + 1;
    });
    return counts;
  }, [rows]);

  // Group by linkKey
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = rows.filter(r => {
      if (sevFilter && (r.TrapSeverity || '').toLowerCase() !== sevFilter) return false;
      if (!q) return true;
      return (
        r.traptype.toLowerCase().includes(q) ||
        r.sourceNode.toLowerCase().includes(q) ||
        r.destNode.toLowerCase().includes(q) ||
        r.sourcePort.toLowerCase().includes(q) ||
        r.destPort.toLowerCase().includes(q) ||
        r.alarmid.toLowerCase().includes(q) ||
        r.vendor.toLowerCase().includes(q) ||
        r.client.toLowerCase().includes(q)
      );
    });
    const map = new Map<string, Row[]>();
    filtered.forEach(r => {
      const arr = map.get(r.linkKey) || [];
      arr.push(r);
      map.set(r.linkKey, arr);
    });
    // Sort each group by severity, then sort groups by worst severity
    const list = Array.from(map.entries()).map(([key, items]) => {
      items.sort((a, b) =>
        (SEV_RANK[a.TrapSeverity.toLowerCase()] ?? 9) - (SEV_RANK[b.TrapSeverity.toLowerCase()] ?? 9)
      );
      const worst = items[0]?.TrapSeverity.toLowerCase() || 'other';
      return { key, items, worst };
    });
    list.sort((a, b) => (SEV_RANK[a.worst] ?? 9) - (SEV_RANK[b.worst] ?? 9));
    return list;
  }, [rows, query, sevFilter]);

  const severityOrder = ['critical', 'major', 'minor', 'warning'];
  const totalShown = groups.reduce((n, g) => n + g.items.length, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[80vw] w-[80vw] h-[85vh] max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden [&>button]:z-50">
        <DialogTitle className="sr-only">Active Alarms</DialogTitle>
        <DialogDescription className="sr-only">
          Active alarms grouped by span with full endpoint details.
        </DialogDescription>

        {/* Header */}
        <div className="px-6 pr-14 py-3 border-b bg-gradient-to-r from-destructive/10 via-destructive/5 to-transparent flex items-center gap-3 flex-wrap">
          <div className="h-9 w-9 rounded-md bg-destructive/15 flex items-center justify-center ring-1 ring-destructive/20">
            <AlertTriangle className="h-4.5 w-4.5 text-destructive" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-base font-semibold tracking-tight leading-tight flex items-center gap-2">
              Active Alarms
              <span className="text-xs font-normal text-muted-foreground">({rows.length} total)</span>
              {topologyName && <span className="text-muted-foreground font-normal">— {topologyName}</span>}
            </h2>
            <span className="text-[11px] text-muted-foreground">
              Grouped by span · {groups.length} affected link{groups.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setSevFilter(null)}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                !sevFilter ? 'bg-foreground text-background border-foreground' : 'bg-background/70 hover:bg-muted'
              }`}
            >
              <Cable className="h-3 w-3" />
              <span className="font-medium">{groups.length} Spans</span>
            </button>
            {severityOrder.map(sev => {
              const count = summary[sev] || 0;
              if (!count) return null;
              const m = sevMeta(sev);
              const active = sevFilter === sev;
              return (
                <button
                  key={sev}
                  onClick={() => setSevFilter(active ? null : sev)}
                  className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition-colors ${
                    active ? `${m.chip} border-transparent` : 'bg-background/70 hover:bg-muted'
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${active ? 'bg-white' : m.dot}`} />
                  <span className="font-bold tabular-nums">{count}</span>
                  <span className="font-medium">{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search */}
        <div className="px-6 py-2.5 border-b bg-muted/20 flex items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search node, port, trap, vendor, alarm id…"
              className="h-8 pl-8 pr-8 text-xs bg-background"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="text-[11px] text-muted-foreground ml-auto">
            Showing <span className="font-semibold text-foreground">{totalShown}</span> of {rows.length}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 min-h-0 overflow-y-auto scroll-smooth px-6 py-4 space-y-3 bg-muted/10">
          {groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="h-14 w-14 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                <AlertTriangle className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="text-sm font-medium">
                {rows.length === 0 ? 'No active alarms' : 'No matches'}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {rows.length === 0 ? 'All links are operating normally.' : 'Try a different search or clear the severity filter.'}
              </div>
            </div>
          ) : (
            groups.map(group => <SpanGroup key={group.key} items={group.items} worst={group.worst} />)
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SpanGroup({ items, worst }: { items: Row[]; worst: string }) {
  const m = sevMeta(worst);
  const first = items[0];
  return (
    <div className={`rounded-lg border ${m.border} ${m.bg} overflow-hidden shadow-sm`}>
      {/* Span header — endpoint arrow */}
      <div className="px-4 py-2.5 border-b bg-background/60 flex items-center gap-3 flex-wrap">
        <span className={`h-2 w-2 rounded-full ${m.dot} ring-2 ${m.ring}`} />
        <EndpointInline node={first.sourceNode} port={first.sourcePort} />
        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
        <EndpointInline node={first.destNode} port={first.destPort} />
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] font-medium">
            {items.length} alarm{items.length !== 1 ? 's' : ''}
          </Badge>
          <Badge className={`text-[10px] font-semibold ${m.chip}`}>{m.label}</Badge>
        </div>
      </div>

      {/* Alarm rows */}
      <div className="divide-y">
        {items.map((r, idx) => (
          <AlarmRow key={`${r.alarmid}-${idx}`} row={r} />
        ))}
      </div>
    </div>
  );
}

function AlarmRow({ row }: { row: Row }) {
  const m = sevMeta(row.TrapSeverity);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(row.alarmid);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="px-4 py-3 hover:bg-background/60 transition-colors">
      <div className="flex items-start gap-3">
        <div className={`h-7 w-7 rounded-md ${m.chip} flex items-center justify-center shrink-0 mt-0.5`}>
          <Zap className="h-3.5 w-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-foreground">{row.traptype}</span>
            <Badge className={`text-[10px] font-semibold ${m.chip}`}>{m.label}</Badge>
            <Badge variant="outline" className="text-[10px] font-mono">{row.alarmid}</Badge>
            <button
              onClick={handleCopy}
              title="Copy alarm ID"
              className="inline-flex items-center justify-center rounded-md border bg-background p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
            </button>
          </div>
          <div className="mt-1.5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-1 text-[11px]">
            <Meta icon={Server} label="Source Node" value={row.sourceNode} mono />
            <Meta icon={Radio} label="Source Port" value={row.sourcePort} mono />
            <Meta icon={Server} label="Dest Node" value={row.destNode} mono />
            <Meta icon={Radio} label="Dest Port" value={row.destPort} mono />
            <Meta icon={Building2} label="Client" value={row.client} />
            <Meta icon={Shield} label="Vendor" value={row.vendor} />
            <Meta icon={Zap} label="Parameter" value={row.parameter1} />
            <Meta icon={Clock} label="Received" value={row.rcvdTime} mono />
          </div>
        </div>
      </div>
    </div>
  );
}

function Meta({ icon: Icon, label, value, mono }: { icon: any; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <Icon className="h-3 w-3 text-muted-foreground shrink-0" />
      <span className="text-muted-foreground">{label}:</span>
      <span className={`font-medium text-foreground truncate ${mono ? 'font-mono' : ''}`} title={value}>
        {value}
      </span>
    </div>
  );
}

function EndpointInline({ node, port }: { node: string; port: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-md border bg-background px-2 py-1 min-w-0">
      <Server className="h-3.5 w-3.5 text-primary shrink-0" />
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-semibold font-mono truncate leading-tight" title={node}>{node}</span>
        {port && port !== '—' && (
          <span className="text-[10px] text-muted-foreground font-mono truncate leading-tight" title={port}>{port}</span>
        )}
      </div>
    </div>
  );
}
