import { useMemo, useState, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { OtsDetail } from '../../services/otsApi';
import { ChevronRight, ChevronDown, Radio, Users, Zap, Cable, ChevronsUpDown, ChevronsDownUp, BarChart3, X, AlertTriangle, Info, HelpCircle, Share2, Search, Copy, Check } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../components/ui/select';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../../components/ui/tooltip';

interface OtsPathVisualizationProps {
  data: OtsDetail[];
  spanId: string;
  customerFilter: string;
  chStateFilter: string;
  cktStateFilter: string;
}

interface CustomerGroup {
  customerName: string;
  channels: ChannelGroup[];
  totalCircuits: number;
  upCircuits: number;
  downCircuits: number;
}

interface ChannelGroup {
  channelName: string;
  channelState: string;
  channelStateTime: string | null;
  createdCapacity_ch: number | null;
  usedCapacity_ch: number | null;
  utilizationPercent_ch: number | null;
  circuits: CombinedCircuit[];
}

/** A circuit combined from A→B and B→A directions */
interface CombinedCircuit {
  circuitLabel: string;
  qualifier_ckt: string | null;
  directions: {
    nodeA: string;
    nodeB: string;
    portA: string;
    portB: string;
    circuitState: string;
    circuitStateTime: string | null;
    createdCapacity: number | null;
    usedCapacity: number | null;
    utilizationPercent: number | null;
  }[];
}

/** Channel sharing info: which customers share a channel and their capacity usage */
interface ChannelSharingInfo {
  channelName: string;
  customers: { customerName: string; circuitCount: number; totalCapacity: number }[];
}

function buildTree(data: OtsDetail[]): CustomerGroup[] {
  const custMap = new Map<string, OtsDetail[]>();
  for (const d of data) {
    const cust = d.customerName || 'Unknown';
    if (!custMap.has(cust)) custMap.set(cust, []);
    custMap.get(cust)!.push(d);
  }

  return Array.from(custMap.entries()).map(([customerName, items]) => {
    const chMap = new Map<string, OtsDetail[]>();
    for (const item of items) {
      const key = item.channelFinalName;
      if (!chMap.has(key)) chMap.set(key, []);
      chMap.get(key)!.push(item);
    }

    // Count unique circuits (A→B and B→A = 1 circuit)
    const uniqueCkts = new Set<string>();
    items.forEach(i => uniqueCkts.add(i.circuitUserLabel));
    const totalUnique = uniqueCkts.size;

    const upLabels = new Set<string>();
    items.forEach(i => {
      if (i.circuit_opr_state?.toLowerCase().includes('in service up')) {
        upLabels.add(i.circuitUserLabel);
      }
    });

    return {
      customerName,
      totalCircuits: totalUnique,
      upCircuits: upLabels.size,
      downCircuits: totalUnique - upLabels.size,
      channels: Array.from(chMap.entries()).map(([channelName, cItems]) => {
        // Combine circuits with same label (A→B and B→A)
        const cktMap = new Map<string, OtsDetail[]>();
        for (const c of cItems) {
          if (!cktMap.has(c.circuitUserLabel)) cktMap.set(c.circuitUserLabel, []);
          cktMap.get(c.circuitUserLabel)!.push(c);
        }

        const combinedCircuits: CombinedCircuit[] = Array.from(cktMap.entries()).map(([label, dirs]) => ({
          circuitLabel: label,
          qualifier_ckt: dirs[0].qualifier_ckt ?? null,
          directions: dirs.map(d => ({
            nodeA: d.nodeA,
            nodeB: d.nodeB,
            portA: d.portA || '',
            portB: d.portB || '',
            circuitState: d.circuit_opr_state,
            circuitStateTime: d.CircuitOperationalStateTime,
            createdCapacity: d.createdCapacity ?? null,
            usedCapacity: d.usedCapacity_c ?? null,
            utilizationPercent: d.utilizationPercent_c ?? null,
          })),
        }));

        return {
          channelName,
          channelState: cItems[0].channel_opr_state,
          channelStateTime: cItems[0].ChannelOperationalStateTime,
          createdCapacity_ch: cItems[0].createdCapacity_ch ?? null,
          usedCapacity_ch: cItems[0].usedCapacity_ch ?? null,
          utilizationPercent_ch: cItems[0].utilizationPercent_ch ?? null,
          circuits: combinedCircuits,
        };
      }),
    };
  });
}

function buildChannelSharingMap(data: OtsDetail[]): Map<string, ChannelSharingInfo> {
  const chCustMap = new Map<
    string,
    Map<string, {
      circuits: Set<string>;
      capacityMap: Map<string, number>; 
    }>
  >();

  for (const d of data) {
    const ch = d.channelFinalName;
    const cust = d.customerName || 'Unknown';
    const circuitId = d.circuitUserLabel;

    if (!chCustMap.has(ch)) chCustMap.set(ch, new Map());
    const custMap = chCustMap.get(ch)!;

    if (!custMap.has(cust)) {
      custMap.set(cust, {
        circuits: new Set(),
        capacityMap: new Map(),
      });
    }

    const info = custMap.get(cust)!;

    // ✅ UNIQUE circuit
    info.circuits.add(circuitId);

    // ✅ Capacity counted ONLY ONCE per circuit
    if (!info.capacityMap.has(circuitId) && d.qualifier_ckt) {
      const cap = parseFloat(d.qualifier_ckt.replace(/[^0-9.]/g, ''));
      if (!isNaN(cap)) {
        info.capacityMap.set(circuitId, cap);
      }
    }
  }

  const result = new Map<string, ChannelSharingInfo>();

  chCustMap.forEach((custMap, channelName) => {
    if (custMap.size > 1) {
      result.set(channelName, {
        channelName,
        customers: Array.from(custMap.entries()).map(([customerName, info]) => ({
          customerName,
          circuitCount: info.circuits.size,
          totalCapacity: Array.from(info.capacityMap.values())
            .reduce((sum, v) => sum + v, 0), // ✅ correct total
        })),
      });
    }
  });

  return result;
}
const StatusDot = ({ isUp }: { isUp: boolean }) => (
  <span className={`h-2 w-2 rounded-full shrink-0 ${isUp ? 'bg-emerald-500' : 'bg-red-500'}`} />
);

const StatusBadge = ({ state, upCheck }: { state: string; upCheck: string }) => {
  const isUp = state?.toLowerCase().includes(upCheck);
  return (
    <span
      className={`inline-flex items-center gap-1 text-[14px] font-semibold px-2 py-0.5 rounded-full leading-none ${isUp
        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
        : 'bg-red-500/15 text-red-700 dark:text-red-400'
        }`}
    >
      <StatusDot isUp={isUp} />
      {isUp ? 'Up' : 'Down'}
    </span>
  );
};

function utilColor(val: number | null) {
  if (val == null) return '';
  if (val >= 80) return 'text-red-600 dark:text-red-400';
  if (val >= 50) return 'text-amber-600 dark:text-amber-400';
  return 'text-emerald-600 dark:text-emerald-400';
}

function utilBg(val: number | null) {
  if (val == null) return '';
  if (val >= 80) return 'bg-red-500/10';
  if (val >= 50) return 'bg-amber-500/10';
  return 'bg-emerald-500/10';
}

export function OtsPathVisualization({ data, spanId, customerFilter, chStateFilter, cktStateFilter }: OtsPathVisualizationProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'up' | 'down'>('all');
  const [showQuickStats, setShowQuickStats] = useState(false);
  const [showTreeInfo, setShowTreeInfo] = useState(false);
  const [showImpactInfo, setShowImpactInfo] = useState(false);
  const [quickFilterCustomer, setQuickFilterCustomer] = useState<string | null>(null);
  const [showSharingChannel, setShowSharingChannel] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [utilFilter, setUtilFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');

  const copyToClipboard = useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(() => {});
  }, []);

  const filteredData = useMemo(() => {
    let result = data;
    if (customerFilter !== 'all') result = result.filter(r => (r.customerName || '—') === customerFilter);
    if (chStateFilter !== 'all') result = result.filter(r => r.channel_opr_state === chStateFilter);
    if (cktStateFilter !== 'all') result = result.filter(r => r.circuit_opr_state === cktStateFilter);
    if (statusFilter === 'up') result = result.filter(r => r.circuit_opr_state?.toLowerCase().includes('in service up'));
    else if (statusFilter === 'down') result = result.filter(r => !r.circuit_opr_state?.toLowerCase().includes('in service up'));
    if (quickFilterCustomer) result = result.filter(r => (r.customerName || 'Unknown') === quickFilterCustomer);
    // Utilization filter
    if (utilFilter !== 'all') {
      result = result.filter(r => {
        const u = r.utilizationPercent_c ?? r.utilizationPercent_ch ?? 0;
        if (utilFilter === 'low') return u < 50;
        if (utilFilter === 'medium') return u >= 50 && u < 80;
        return u >= 80; // high
      });
    }
    return result;
  }, [data, customerFilter, chStateFilter, cktStateFilter, statusFilter, quickFilterCustomer, utilFilter]);

  // Build sharing map from ALL data (not filtered) so we can detect cross-customer sharing
  const channelSharingMap = useMemo(() => buildChannelSharingMap(data), [data]);

  const tree = useMemo(() => {
    const fullTree = buildTree(filteredData);
    if (!searchQuery.trim()) return fullTree;
    const q = searchQuery.toLowerCase();
    return fullTree.map(cust => {
      const filteredChannels = cust.channels.map(ch => {
        const channelNameMatches = ch.channelName.toLowerCase().includes(q);
        // If channel name matches search, keep ALL its circuits
        const filteredCircuits = channelNameMatches
          ? ch.circuits
          : ch.circuits.filter(ckt =>
              ckt.circuitLabel.toLowerCase().includes(q) ||
              ckt.directions.some(d => d.portA.toLowerCase().includes(q) || d.portB.toLowerCase().includes(q) || d.nodeA.toLowerCase().includes(q) || d.nodeB.toLowerCase().includes(q))
            );
        return { ...ch, circuits: filteredCircuits };
      }).filter(ch => ch.channelName.toLowerCase().includes(q) || ch.circuits.length > 0);
      // Recalculate circuit counts after filtering
      const totalCircuits = new Set(filteredChannels.flatMap(ch => ch.circuits.map(c => c.circuitLabel))).size;
      const upLabels = new Set(filteredChannels.flatMap(ch => ch.circuits.filter(c => c.directions.some(d => d.circuitState?.toLowerCase().includes('in service up'))).map(c => c.circuitLabel)));
      return {
        ...cust,
        channels: filteredChannels,
        totalCircuits,
        upCircuits: upLabels.size,
        downCircuits: totalCircuits - upLabels.size,
      };
    }).filter(cust => cust.customerName.toLowerCase().includes(q) || cust.channels.length > 0);
  }, [filteredData, searchQuery]);

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || utilFilter !== 'all' || quickFilterCustomer;

  const clearAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setUtilFilter('all');
    setQuickFilterCustomer(null);
  };

  const totalCustomers = tree.length;
  const totalChannels = useMemo(() => {
    const set = new Set<string>();
    tree.forEach(cust => cust.channels.forEach(ch => set.add(ch.channelName)));
    return set.size;
  }, [tree]);

  // Unique circuit count
  const uniqueCktLabels = useMemo(() => {
    const set = new Set<string>();
    filteredData.forEach(d => set.add(d.circuitUserLabel));
    return set;
  }, [filteredData]);
  const totalCircuits = uniqueCktLabels.size;

  const upCktLabels = useMemo(() => {
    const set = new Set<string>();
    filteredData.forEach(d => {
      if (d.circuit_opr_state?.toLowerCase().includes('in service up')) {
        set.add(d.circuitUserLabel);
      }
    });
    return set;
  }, [filteredData]);
  const upCircuits = upCktLabels.size;
  const downCircuits = totalCircuits - upCircuits;

  const customerStats = useMemo(() => {
    return tree.map(cust => ({
      name: cust.customerName,
      total: cust.totalCircuits,
      up: cust.upCircuits,
      down: cust.downCircuits,
      impactPct: cust.totalCircuits > 0 ? Math.round((cust.downCircuits / cust.totalCircuits) * 100) : 0,
    })).sort((a, b) => b.down - a.down);
  }, [tree]);

  const channelStats = useMemo(() => {
    let allUp = 0, partial = 0, allDown = 0;
    const seen = new Map<string, OtsDetail[]>();
    filteredData.forEach(d => {
      if (!seen.has(d.channelFinalName)) seen.set(d.channelFinalName, []);
      seen.get(d.channelFinalName)!.push(d);
    });
    seen.forEach(items => {
      const cUp = items.filter(c => c.circuit_opr_state?.toLowerCase().includes('in service up')).length;
      if (cUp === items.length) allUp++;
      else if (cUp === 0) allDown++;
      else partial++;
    });
    return { allUp, partial, allDown };
  }, [filteredData]);

  const allCustomerKeys = useMemo(() => tree.map(c => c.customerName), [tree]);
  const allChannelKeys = useMemo(() => {
    const keys: string[] = [];
    tree.forEach(cust => cust.channels.forEach(ch => keys.push(`${cust.customerName}::${ch.channelName}`)));
    return keys;
  }, [tree]);

  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(() => new Set(allCustomerKeys));
  const [expandedChannels, setExpandedChannels] = useState<Set<string>>(new Set());

  const toggleCustomer = (name: string) => {
    setExpandedCustomers((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const toggleChannel = (key: string) => {
    setExpandedChannels((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedCustomers(new Set(allCustomerKeys));
    setExpandedChannels(new Set(allChannelKeys));
  };

  const collapseAll = () => {
    setExpandedCustomers(new Set());
    setExpandedChannels(new Set());
  };

  // Get sharing info for dialog
  const sharingInfo = showSharingChannel ? channelSharingMap.get(showSharingChannel) : null;

  return (
    <div className="h-full overflow-auto p-4">
      {/* Top summary bar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap bg-muted/30 rounded-lg p-3 border">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Radio className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="text-[13.5px] text-muted-foreground uppercase tracking-wider">Span</div>
            <div className="text-xs font-bold font-mono text-foreground">{spanId}</div>
          </div>
        </div>

        <div className="h-8 w-px bg-border" />

        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-base font-bold text-foreground leading-none">{totalCustomers}</div>
            <div className="text-[13.5px] text-muted-foreground">Customers</div>
          </div>
          <div className="text-center">
            <div className="text-base font-bold text-foreground leading-none">{totalChannels}</div>
            <div className="text-[13.5px] text-muted-foreground">Channels</div>
          </div>
          <div className="text-center">
            <div className="text-base font-bold text-foreground leading-none">{totalCircuits}</div>
            <div className="text-[13.5px] text-muted-foreground">Circuits</div>
          </div>
        </div>

        <div className="h-8 w-px bg-border" />

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-emerald-500" />
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{upCircuits}</span>
            <span className="text-xs text-muted-foreground">Up</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-red-500" />
            <span className="text-sm font-bold text-red-600 dark:text-red-400">{downCircuits}</span>
            <span className="text-xs text-muted-foreground">Down</span>
          </div>
        </div>

        {/* Status quick-filter */}
        <div className="flex items-center border rounded-md bg-background p-0.5 gap-0.5 ml-1">
          {(['all', 'up', 'down'] as const).map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? 'default' : 'ghost'}
              size="sm"
              className={`h-6 px-2.5 text-[13.5px] gap-1 ${statusFilter !== s ? '' :
                s === 'up' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' :
                  s === 'down' ? 'bg-red-600 hover:bg-red-700 text-white' : ''
                }`}
              onClick={() => setStatusFilter(s)}
            >
              {s === 'all' ? 'All' : s === 'up' ? 'Up' : 'Down'}
            </Button>
          ))}
        </div>

        {quickFilterCustomer && (
          <div className="flex items-center gap-1 bg-primary/10 border border-primary/30 rounded-md px-2 py-1">
            <Users className="h-3 w-3 text-primary" />
            <span className="text-[13.5px] font-semibold text-primary truncate max-w-[120px]">{quickFilterCustomer}</span>
            <button onClick={() => setQuickFilterCustomer(null)} className="ml-0.5 hover:text-destructive transition-colors">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        <div className="ml-auto flex items-center gap-1">
          <TooltipProvider>
            <UITooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setShowTreeInfo(true)}>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">Tree structure guide</TooltipContent>
            </UITooltip>
          </TooltipProvider>
          <Button
            variant={showQuickStats ? 'default' : 'outline'}
            size="sm"
            className="h-6 px-2 text-[13.5px] gap-1"
            onClick={() => setShowQuickStats(!showQuickStats)}
          >
            <BarChart3 className="h-3 w-3" />
            Stats
          </Button>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-[13.5px] gap-1" onClick={expandAll}>
            <ChevronsUpDown className="h-3 w-3" />Expand All
          </Button>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-[13.5px] gap-1" onClick={collapseAll}>
            <ChevronsDownUp className="h-3 w-3" />Collapse All
          </Button>
        </div>
      </div>

      {/* Search bar + Utilization filter */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search customer, channel, circuit, port..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
          {searchQuery && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 flex items-center justify-center rounded hover:bg-muted"
              onClick={() => setSearchQuery('')}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <Select value={utilFilter} onValueChange={(v) => setUtilFilter(v as any)}>
          <SelectTrigger className="h-8 w-[120px] text-xs">
            <SelectValue placeholder="Utilization" />
          </SelectTrigger>
          <SelectContent style={{ zIndex: 2147483647 }}>
            <SelectItem value="all" className="text-xs">All Util</SelectItem>
            <SelectItem value="low" className="text-xs">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> &lt;50%</span>
            </SelectItem>
            <SelectItem value="medium" className="text-xs">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-500" /> 50-80%</span>
            </SelectItem>
            <SelectItem value="high" className="text-xs">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-500" /> &gt;80%</span>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Active filters + Clear all */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {searchQuery && (
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              Search: "{searchQuery}"
              <button onClick={() => setSearchQuery('')} className="hover:text-destructive"><X className="h-2.5 w-2.5" /></button>
            </span>
          )}
          {statusFilter !== 'all' && (
            <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full ${statusFilter === 'up' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-red-500/15 text-red-700 dark:text-red-400'}`}>
              Status: {statusFilter}
              <button onClick={() => setStatusFilter('all')} className="hover:text-destructive"><X className="h-2.5 w-2.5" /></button>
            </span>
          )}
          {utilFilter !== 'all' && (
            <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full ${utilFilter === 'low' ? 'bg-emerald-500/15 text-emerald-700' : utilFilter === 'medium' ? 'bg-amber-500/15 text-amber-700' : 'bg-red-500/15 text-red-700'}`}>
              Util: {utilFilter === 'low' ? '<50%' : utilFilter === 'medium' ? '50-80%' : '>80%'}
              <button onClick={() => setUtilFilter('all')} className="hover:text-destructive"><X className="h-2.5 w-2.5" /></button>
            </span>
          )}
          {quickFilterCustomer && (
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              Customer: {quickFilterCustomer}
              <button onClick={() => setQuickFilterCustomer(null)} className="hover:text-destructive"><X className="h-2.5 w-2.5" /></button>
            </span>
          )}
          <Button variant="ghost" size="sm" className="h-5 px-2 text-[11px] text-muted-foreground" onClick={clearAllFilters}>
            Clear all
          </Button>
        </div>
      )}

      {/* Tree Info Dialog */}
      <Dialog open={showTreeInfo} onOpenChange={setShowTreeInfo}>
        <DialogContent className="max-w-md" style={{ zIndex: 2147483647 }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Info className="h-4 w-4 text-primary" />
              Path Tree Structure
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Radio className="h-3 w-3 text-primary" />
              </div>
              <div><span className="font-semibold text-foreground">Span</span> — Root level, the physical fiber span.</div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
                <Users className="h-3 w-3 text-blue-500" />
              </div>
              <div><span className="font-semibold text-foreground">Customer</span> — Each customer on this span with circuit counts.</div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                <Cable className="h-3 w-3 text-emerald-500" />
              </div>
              <div><span className="font-semibold text-foreground">Channel</span> — Optical channel. Shows Created | Used | Util%. Shared channels are flagged with a sharing indicator.</div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                <Zap className="h-3 w-3 text-amber-500" />
              </div>
              <div><span className="font-semibold text-foreground">Circuit</span> — Individual circuit with A↔B directions combined, showing ports and capacity per direction.</div>
            </div>
            {/* Sample Tree Structure */}
            <div className="rounded-lg border p-3 bg-muted/20">
              <div className="font-semibold text-foreground mb-2">Sample Structure</div>

              <div className="font-mono text-xs leading-relaxed text-muted-foreground bg-background p-2 rounded border">
                <div>SPAN-1</div>
                <div className="ml-3">└── GOOGLE</div>
                <div className="ml-6">└── Channel-A [100G | 60G | 60%]</div>
                <div className="ml-9">└── CKT-123 (A ↔ B)</div>
              </div>

              <div className="mt-2 text-xs text-muted-foreground">
                Example showing hierarchy from <span className="font-semibold text-foreground">Span → Customer → Channel → Circuit</span>.
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Channel Customer Breakdown Dialog */}
      <Dialog open={!!showSharingChannel} onOpenChange={() => setShowSharingChannel(null)}>
        <DialogContent className="max-w-lg" style={{ zIndex: 2147483647 }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-primary" />
              Channel — Customer Breakdown
            </DialogTitle>
          </DialogHeader>
          {sharingInfo && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground bg-muted/50 p-2 rounded break-all">
                <Cable className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="flex-1">{sharingInfo.channelName}</span>
                <button
                  className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted transition-colors shrink-0"
                  onClick={() => copyToClipboard(sharingInfo.channelName, `sharing-ch-${sharingInfo.channelName}`)}
                  title="Copy channel name"
                >
                  {copiedId === `sharing-ch-${sharingInfo.channelName}` ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
              <div className="space-y-2">
                {sharingInfo.customers.map((c) => {
                  // Find circuits for this customer on this channel from raw data
                  const customerCircuits = data.filter(d =>
                    d.channelFinalName === sharingInfo.channelName &&
                    (d.customerName || 'Unknown') === c.customerName
                  );
                  const uniqueLabels = [...new Set(customerCircuits.map(d => d.circuitUserLabel))];

                  return (
                    <div key={c.customerName} className="rounded-lg border bg-card overflow-hidden">
                      <div className="flex items-center justify-between p-2.5">
                        <div className="flex items-center gap-2">
                          <Users className="h-3.5 w-3.5 text-primary" />
                          <span className="text-sm font-semibold text-foreground">{c.customerName}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">
                            {c.circuitCount} circuit{c.circuitCount > 1 ? 's' : ''}
                          </span>
                          {c.totalCapacity > 0 && (
                            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                              {c.totalCapacity}G
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Show circuits for this customer */}
                      {uniqueLabels.length > 0 && (
                        <div className="border-t border-border/50 px-2.5 py-2 space-y-1 bg-muted/20">
                          {uniqueLabels.map(label => {
                            const cktData = customerCircuits.find(d => d.circuitUserLabel === label);
                            const isUp = cktData?.circuit_opr_state?.toLowerCase().includes('in service up');
                            return (
                              <div key={label} className="flex items-center gap-2 text-xs">
                                <StatusDot isUp={!!isUp} />
                                <span className="font-mono text-foreground truncate flex-1">{label}</span>
                                {cktData?.qualifier_ckt && (
                                  <span className="text-[11px] font-bold px-1 py-0 rounded bg-violet-500/10 text-violet-700 dark:text-violet-400">
                                    {cktData.qualifier_ckt}
                                  </span>
                                )}
                                <button
                                  className="h-4 w-4 flex items-center justify-center rounded hover:bg-muted transition-colors shrink-0"
                                  onClick={() => copyToClipboard(label, `sharing-ckt-${label}`)}
                                  title="Copy circuit name"
                                >
                                  {copiedId === `sharing-ckt-${label}` ? <Check className="h-2.5 w-2.5 text-emerald-500" /> : <Copy className="h-2.5 w-2.5" />}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Quick Stats Dialog */}
      <Dialog open={showQuickStats} onOpenChange={setShowQuickStats}>
        <DialogContent className="max-w-2xl" style={{ zIndex: 2147483647 }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4 text-primary" />
              Quick Stats — Impact Analysis
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-1" onClick={() => setShowImpactInfo(true)}>
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-4">
            {/* Channel Summary with Donut */}
            <div className="rounded-lg border bg-card p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">Channel Health</div>
              <div className="h-[140px] min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'All Up', value: channelStats.allUp || 0, fill: 'hsl(142, 71%, 45%)' },
                        { name: 'Partial', value: channelStats.partial || 0, fill: 'hsl(38, 92%, 50%)' },
                        { name: 'All Down', value: channelStats.allDown || 0, fill: 'hsl(0, 84%, 60%)' },
                      ].filter(d => d.value > 0)}
                      cx="50%" cy="50%" innerRadius="45%" outerRadius="75%"
                      paddingAngle={3} dataKey="value" strokeWidth={0}
                    >
                      {[
                        { fill: 'hsl(142, 71%, 45%)' },
                        { fill: 'hsl(38, 92%, 50%)' },
                        { fill: 'hsl(0, 84%, 60%)' },
                      ].map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }: any) =>
                        active && payload?.[0] ? (
                          <div className="bg-background border rounded-lg shadow-lg p-2 text-xs">
                            <span className="font-semibold">{payload[0].name}:</span> {payload[0].value}
                          </div>
                        ) : null
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 mt-2">
                {[
                  { label: 'All Up', value: channelStats.allUp, color: 'bg-emerald-500' },
                  { label: 'Partial Down', value: channelStats.partial, color: 'bg-amber-500' },
                  { label: 'All Down', value: channelStats.allDown, color: 'bg-red-500' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`h-2.5 w-2.5 rounded-sm ${item.color}`} />
                      <span className="text-xs text-muted-foreground">{item.label}</span>
                    </div>
                    <span className="text-sm font-bold text-foreground">{item.value}</span>
                  </div>
                ))}
                <div className="pt-1.5 border-t border-border flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">Total</span>
                  <span className="text-sm font-bold text-foreground">{totalChannels}</span>
                </div>
              </div>
            </div>

            {/* Circuit Up/Down Donut */}
            <div className="rounded-lg border bg-card p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">Circuit Status</div>
              <div className="h-[140px] min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Up', value: upCircuits || 0, fill: 'hsl(142, 71%, 45%)' },
                        { name: 'Down', value: downCircuits || 0, fill: 'hsl(0, 84%, 60%)' },
                      ].filter(d => d.value > 0)}
                      cx="50%" cy="50%" innerRadius="45%" outerRadius="75%"
                      paddingAngle={3} dataKey="value" strokeWidth={0}
                    >
                      <Cell fill="hsl(142, 71%, 45%)" />
                      <Cell fill="hsl(0, 84%, 60%)" />
                    </Pie>
                    <Tooltip
                      content={({ active, payload }: any) =>
                        active && payload?.[0] ? (
                          <div className="bg-background border rounded-lg shadow-lg p-2 text-xs">
                            <span className="font-semibold">{payload[0].name}:</span> {payload[0].value}
                          </div>
                        ) : null
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 mt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                    <span className="text-xs text-muted-foreground">Up</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{upCircuits}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-sm bg-red-500" />
                    <span className="text-xs text-muted-foreground">Down</span>
                  </div>
                  <span className="text-sm font-bold text-red-600 dark:text-red-400">{downCircuits}</span>
                </div>
                <div className="pt-1.5 border-t border-border flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">Total</span>
                  <span className="text-sm font-bold text-foreground">{totalCircuits}</span>
                </div>
              </div>
            </div>

            {/* Top Impacted Customers */}
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Top Impacted</span>
              </div>
              <div className="space-y-2 max-h-[260px] overflow-auto">
                {customerStats.filter(c => c.down > 0).length === 0 ? (
                  <div className="text-xs text-emerald-600 dark:text-emerald-400 italic py-4 text-center">All customers healthy ✓</div>
                ) : (
                  customerStats.filter(c => c.down > 0).slice(0, 8).map((c) => (
                    <div key={c.name} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span
                          className="text-xs font-medium text-foreground truncate max-w-[120px] cursor-pointer hover:text-primary hover:underline transition-colors"
                          onClick={() => { setQuickFilterCustomer(c.name); setShowQuickStats(false); }}
                          title={`Filter to ${c.name}`}
                        >{c.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[13.5px] font-mono text-emerald-600 dark:text-emerald-400">{c.up}↑</span>
                          <span className="text-[13.5px] font-mono text-red-600 dark:text-red-400">{c.down}↓</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-red-500 transition-all" style={{ width: `${c.impactPct}%` }} />
                        </div>
                        <span className="text-[13.5px] font-semibold text-muted-foreground w-8 text-right">{c.impactPct}%</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Full Customer Impact Table */}
          {customerStats.length > 0 && (
            <div className="rounded-lg border bg-card p-4 mt-1">
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">All Customer Impact</div>
              <div className="max-h-[200px] overflow-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-1.5 px-2 text-muted-foreground font-semibold">Customer</th>
                      <th className="text-center py-1.5 px-2 text-muted-foreground font-semibold">Total</th>
                      <th className="text-center py-1.5 px-2 text-emerald-600 dark:text-emerald-400 font-semibold">Up</th>
                      <th className="text-center py-1.5 px-2 text-red-600 dark:text-red-400 font-semibold">Down</th>
                      <th className="text-center py-1.5 px-2 text-muted-foreground font-semibold">Impact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerStats.map((c) => (
                      <tr key={c.name} className="border-b border-border/50 hover:bg-accent/30 cursor-pointer" onClick={() => { setQuickFilterCustomer(c.name); setShowQuickStats(false); }}>
                        <td className="py-1.5 px-2 font-medium text-foreground truncate max-w-[150px] hover:text-primary transition-colors">{c.name}</td>
                        <td className="py-1.5 px-2 text-center text-foreground font-semibold">{c.total}</td>
                        <td className="py-1.5 px-2 text-center text-emerald-600 dark:text-emerald-400 font-semibold">{c.up}</td>
                        <td className="py-1.5 px-2 text-center text-red-600 dark:text-red-400 font-semibold">{c.down}</td>
                        <td className="py-1.5 px-2">
                          <div className="flex items-center gap-1.5 justify-center">
                            <div className="w-14 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full bg-red-500" style={{ width: `${c.impactPct}%` }} />
                            </div>
                            <span className="text-[13.5px] font-semibold text-muted-foreground">{c.impactPct}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Impact Methodology Info */}
          <Dialog open={showImpactInfo} onOpenChange={setShowImpactInfo}>
            <DialogContent className="max-w-lg" style={{ zIndex: 2147483647 }}>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-sm">
                  <HelpCircle className="h-4 w-4 text-primary" />
                  Impact Analysis Methodology
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="rounded-lg border p-3 bg-muted/20">
                  <div className="font-semibold text-foreground mb-1">Channel Health Categories</div>
                  <ul className="space-y-1.5 ml-1">
                    <li className="flex items-start gap-2">
                      <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500 mt-1 shrink-0" />
                      <span><strong className="text-foreground">All Up</strong> — Every circuit within the channel reports "In Service Up".</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-2.5 w-2.5 rounded-sm bg-amber-500 mt-1 shrink-0" />
                      <span><strong className="text-foreground">Partial Down</strong> — Some circuits Up, some Down. Degraded service.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="h-2.5 w-2.5 rounded-sm bg-red-500 mt-1 shrink-0" />
                      <span><strong className="text-foreground">All Down</strong> — No circuits operational. Complete outage.</span>
                    </li>
                  </ul>
                </div>
                <div className="rounded-lg border p-3 bg-muted/20">
                  <div className="font-semibold text-foreground mb-1">Circuit Counting</div>
                  <p>A↔B and B↔A with the same circuit label are counted as <strong className="text-foreground">1 circuit</strong> (bidirectional pair).</p>
                </div>
                <div className="rounded-lg border p-3 bg-muted/20">
                  <div className="font-semibold text-foreground mb-1">Customer Impact %</div>
                  <p>Calculated as: <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">(Down Circuits / Total Circuits) × 100</code></p>
                </div>
                <div className="rounded-lg border p-3 bg-muted/20">
                  <div className="font-semibold text-foreground mb-1">Circuit State Detection</div>
                  <p>A circuit is <strong className="text-emerald-600">Up</strong> if state contains "In Service Up". All others are <strong className="text-red-600">Down</strong>.</p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </DialogContent>
      </Dialog>

      {/* Tree: Customers */}
      <div className="relative">
        <div className="border-l-2 border-primary/20 pl-0">
          {tree.map((customer) => {
            const isCustExpanded = expandedCustomers.has(customer.customerName);
            const hasDown = customer.downCircuits > 0;

            return (
              <div key={customer.customerName} className="relative">
                <div className="absolute left-0 top-5 w-4 border-t-2 border-primary/20" />

                <div className="ml-6 mb-2">
                  <button
                    onClick={() => toggleCustomer(customer.customerName)}
                    className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors group text-left"
                  >
                    <div className={`h-6 w-6 rounded-md flex items-center justify-center shrink-0 ${hasDown ? 'bg-red-500/15' : 'bg-emerald-500/15'}`}>
                      <Users className={`h-3 w-3 ${hasDown ? 'text-red-600' : 'text-emerald-600'}`} />
                    </div>
                    {isCustExpanded ? (
                      <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                    )}
                    {/* <span className="text-[15px] font-semibold text-foreground truncate flex-1">{customer.customerName}</span> */}
                    <span className="text-[15px] font-bold text-foreground uppercase truncate flex-1">
                      {customer.customerName}
                    </span>
                    <span className="text-[15px] font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
                      {customer.channels.length} Channel · {customer.totalCircuits} Circuits
                    </span>
                  </button>

                  {isCustExpanded && (
                    <div className="ml-4 border-l-2 border-accent/40 pl-0 mt-1">
                      {customer.channels.map((channel) => {

                        const sharingInfo = channelSharingMap.get(channel.channelName);

                        const currentCustomerUsage = sharingInfo?.customers.find(
                          c => c.customerName === customer.customerName
                        );

                        // fallback if NOT shared → use channel used (approx for single customer)
                        const customerUsedCapacity =
                          currentCustomerUsage?.totalCapacity ??
                          channel.usedCapacity_ch ??
                          0;
                        const chKey = `${customer.customerName}::${channel.channelName}`;
                        const isChExpanded = expandedChannels.has(chKey);
                        const chIsUp = channel.channelState?.toLowerCase().includes('up');
                        const isShared = channelSharingMap.has(channel.channelName);

                        return (
                          <div key={chKey} className="relative">
                            <div className="absolute left-0 top-4 w-3 border-t-2 border-accent/40" />

                            <div className="ml-5 mb-1">
                              <button
                                onClick={() => toggleChannel(chKey)}
                                className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-accent/30 transition-colors text-left"
                              >
                                <div className={`h-5 w-5 rounded-md flex items-center justify-center shrink-0 ${chIsUp ? 'bg-emerald-500/15' : 'bg-red-500/15'}`}>
                                  <Cable className={`h-3 w-3 ${chIsUp ? 'text-emerald-600' : 'text-red-600'}`} />
                                </div>
                                {isChExpanded ? (
                                  <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                                ) : (
                                  <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                                )}
                                <div>
                                  <span className="text-[14px] font-semibold text-foreground truncate flex-1 min-w-0">{channel.channelName} </span>

                                  {/* {channel.createdCapacity_ch != null && (
                                    <span className="text-[14px] font-semibold px-1 py-1 rounded bg-blue-500/10 text-blue-700 dark:text-blue-400">
                                      {channel.createdCapacity_ch}G | {channel.usedCapacity_ch ?? 0}G
                                    </span>
                                  )} */}
                                  {channel.createdCapacity_ch != null && (
                                    <span
                                      className={`text-[14px] font-semibold px-1 py-1 rounded ${utilBg(channel.utilizationPercent_ch)} ${utilColor(channel.utilizationPercent_ch)}`}
                                    >
                                      {channel.createdCapacity_ch}G | {channel.usedCapacity_ch ?? 0}G | {channel.utilizationPercent_ch ?? 0}%
                                    </span>
                                  )}
                                </div>

                                {/* Channel capacity: Created | Used | Util% */}
                                {/* Right side container */}
                                <div className="flex items-center gap-2 ml-auto">

                                  {/* Channel total capacity */}
                                  {/* {channel.createdCapacity_ch != null && (
                                    <span className="text-[14px] font-semibold px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-700 dark:text-blue-400">
                                      {channel.createdCapacity_ch}G | {channel.usedCapacity_ch ?? 0}G
                                    </span>
                                  )} */}

                                  {/* Customer usage (ALWAYS visible) */}
                                  <span className="text-[13px] font-bold px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-700 dark:text-purple-400">
                                    {/* Customer Used: {customerUsedCapacity}G */}
                                    {customerUsedCapacity}G

                                  </span>

                                  {/* Multi-Customer button */}
                                  {isShared && (
                                    <TooltipProvider>
                                      <UITooltip>
                                        <TooltipTrigger asChild>
                                          <span
                                            className="inline-flex items-center gap-0.5 text-[13px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-400 cursor-pointer hover:bg-amber-500/25 transition-colors"
                                            onClick={(e) => { e.stopPropagation(); setShowSharingChannel(channel.channelName); }}
                                          >
                                            <Users className="h-3 w-3" />
                                            Multi-Customer
                                          </span>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="text-xs">
                                          This channel serves multiple customers. Click to view breakdown.
                                        </TooltipContent>
                                      </UITooltip>
                                    </TooltipProvider>
                                  )}

                                  {/* Copy channel info */}
                                  <button
                                    className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted transition-colors shrink-0"
                                    onClick={(e) => { e.stopPropagation(); copyToClipboard(channel.channelName, `ch-${chKey}`); }}
                                    title="Copy channel info"
                                  >
                                    {copiedId === `ch-${chKey}` ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
                                  </button>

                                </div>
                                <StatusBadge state={channel.channelState} upCheck="up" />
                                <span className="text-[14px] font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
                                  {channel.circuits.length} Circuits
                                </span>
                              </button>

                              {isChExpanded && (
                                <div className="ml-4 border-l border-border/50 pl-0 mt-0.5">
                                  {channel.circuits.map((circuit, idx) => {
                                    const allUp = circuit.directions.every(d => d.circuitState?.toLowerCase().includes('in service up'));
                                    const allDown = circuit.directions.every(d => !d.circuitState?.toLowerCase().includes('in service up'));

                                    return (
                                      <div key={idx} className="relative">
                                        <div className="absolute left-0 top-3 w-3 border-t border-border/50" />
                                        <div className={`ml-5 mb-1 p-2.5 rounded-md border ${allUp ? 'border-emerald-500/20 bg-emerald-500/5' : allDown ? 'border-red-500/20 bg-red-500/5' : 'border-amber-500/20 bg-amber-500/5'}`}>
                                          {/* Circuit header */}
                                          <div className="flex items-center gap-2 mb-2">
                                            <Zap className={`h-3.5 w-3.5 shrink-0 ${allUp ? 'text-emerald-600' : 'text-red-600'}`} />
                                            <span className="text-[14px] font-semibold text-foreground truncate flex-1">{circuit.circuitLabel}</span>
                                            {circuit.qualifier_ckt && (
                                              <span className="text-[13.5px] font-bold px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-700 dark:text-violet-400 shrink-0">
                                                {circuit.qualifier_ckt}
                                              </span>
                                            )}
                                            <button
                                              className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted transition-colors shrink-0"
                                              onClick={() => copyToClipboard(circuit.circuitLabel, `ckt-${idx}-${circuit.circuitLabel}`)}
                                              title="Copy circuit info"
                                            >
                                              {copiedId === `ckt-${idx}-${circuit.circuitLabel}` ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
                                            </button>
                                          </div>

                                          {/* Directions (A→B / B→A combined) — bigger font for visibility */}
                                          {circuit.directions.map((dir, dIdx) => {
                                            const dUp = dir.circuitState?.toLowerCase().includes('in service up');
                                            return (
                                              <div key={dIdx} className={`py-0.001 ${dIdx > 0 ? 'border-t border-border/30 mt-1.5 pt-1.5' : ''}`}>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                  {/* Util on left of status */}
                                                  {dir.utilizationPercent != null && (
                                                    <span className={`text-[14px] font-bold px-1.5 py-0.5 rounded shrink-0 ${utilBg(dir.utilizationPercent)} ${utilColor(dir.utilizationPercent)}`}>
                                                      {dir.utilizationPercent}%
                                                    </span>
                                                  )}
                                                  <StatusDot isUp={dUp} />

                                                  <span className="text-[14px] font-mono font-medium text-foreground">{dir.nodeA}</span>
                                                  <span className="text-muted-foreground text-[14px]">→</span>
                                                  <span className="text-[14px] font-mono font-medium text-foreground">{dir.nodeB}</span>

                                                  {(dir.portA || dir.portB) && (
                                                    <>
                                                      <span className="text-border">|</span>
                                                      <span className="text-[14px] font-mono text-muted-foreground">{dir.portA} → {dir.portB}</span>
                                                    </>
                                                  )}

                                                  {dir.circuitStateTime && (
                                                    <span className="text-[14px] font-mono text-muted-foreground ml-auto">{dir.circuitStateTime}</span>
                                                  )}
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
