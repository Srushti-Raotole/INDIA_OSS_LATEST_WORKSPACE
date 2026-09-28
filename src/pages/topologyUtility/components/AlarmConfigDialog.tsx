import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { DataGrid, type GridColDef, type GridRenderCellParams } from '@mui/x-data-grid';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { Checkbox } from '../../../components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Bell, Search, Save, Loader2, X, AlertTriangle, ArrowRight, CheckCircle2, RotateCcw } from 'lucide-react';
import type { CustomNode, CustomLink } from '../shared/types';
import {
  fetchTrapTypes,
  getAlarmSuperimpose,
  saveAlarmSuperimpose,
  saveAlarmSuperimposeBatch,
  type AlarmSuperimposeRequest,
} from '../services/topologyApi';
import { VENDOR_OPTIONS, CLIENT_OPTIONS } from '../types';
import { toast } from 'sonner';

export interface AlarmConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodes: CustomNode[];
  links: CustomLink[];
  topologyId: string;
  vendor: string;
  client?: string;
  /** Read-only mode for Monitor view — shows distinct "what is being monitored" UI */
  readOnly?: boolean;
  /** Called when the user picks a different vendor/client inside the dialog so the parent can keep the topology save in sync. */
  onContextChange?: (next: { vendor: string; client: string }) => void;
}

interface AlarmRow {
  id: string;        // linkId
  linkId: string;
  sourceNode: string;
  sourcePort: string;
  destNode: string;
  destPort: string;
  trapTypes: string[];
}

// ─── localStorage helpers (draft persistence) ─────────────────────────────
const draftKey = (topologyId: string, vendor: string, client?: string) =>
  `topo-alarm-cfg-draft:${topologyId}::${vendor}::${client || ''}`;

interface DraftPayload {
  rowsMap: Record<string, string[]>;
  vendor: string;
  client: string;
  updatedAt: string;
}

function loadDraft(topologyId: string, vendor: string, client?: string): DraftPayload | null {
  try {
    const raw = localStorage.getItem(draftKey(topologyId, vendor, client));
    return raw ? (JSON.parse(raw) as DraftPayload) : null;
  } catch {
    return null;
  }
}

function saveDraft(topologyId: string, vendor: string, client: string, rowsMap: Record<string, string[]>) {
  try {
    const payload: DraftPayload = { rowsMap, vendor, client, updatedAt: new Date().toISOString() };
    localStorage.setItem(draftKey(topologyId, vendor, client), JSON.stringify(payload));
  } catch {}
}

function clearDraft(topologyId: string, vendor: string, client?: string) {
  try {
    localStorage.removeItem(draftKey(topologyId, vendor, client));
  } catch {}
}

// ─── Trap multi-select ────────────────────────────────────────────────────
function TrapMultiSelect({
  value,
  options,
  onChange,
  disabled,
}: {
  value: string[];
  options: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    const s = search.toLowerCase();
    return options.filter(o => o.toLowerCase().includes(s));
  }, [options, search]);

  const toggle = (t: string) => {
    onChange(value.includes(t) ? value.filter(x => x !== t) : [...value, t]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          type="button"
          className="flex flex-wrap items-center gap-1 w-full min-h-[28px] px-2 py-1 rounded border border-input bg-background hover:border-primary/60 transition-colors text-left disabled:opacity-60 disabled:cursor-not-allowed"
          onClick={(e) => e.stopPropagation()}
        >
          {value.length === 0 ? (
            <span className="text-xs text-muted-foreground">Select trap types…</span>
          ) : value.length <= 2 ? (
            value.map(v => (
              <Badge key={v} variant="secondary" className="text-[10px] h-5 px-1.5 font-mono">{v}</Badge>
            ))
          ) : (
            <>
              <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-mono">{value[0]}</Badge>
              <Badge variant="outline" className="text-[10px] h-5 px-1.5">+{value.length - 1} more</Badge>
            </>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start" onClick={(e) => e.stopPropagation()}>
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              placeholder="Search…"
              className="h-7 pl-7 text-xs"
            />
          </div>
        </div>
        <div className="px-2 py-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{value.length} selected</span>
          {value.length > 0 && (
            <button type="button" className="text-primary hover:underline" onClick={() => onChange([])}>
              Clear
            </button>
          )}
        </div>
        <ScrollArea className="h-56">
          <div className="p-1">
            {filtered.length === 0 ? (
              <div className="px-2 py-3 text-center text-xs text-muted-foreground">No trap types</div>
            ) : (
              filtered.map(t => {
                const checked = value.includes(t);
                return (
                  <label
                    key={t}
                    className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted/60 cursor-pointer text-xs"
                  >
                    <Checkbox checked={checked} onCheckedChange={() => toggle(t)} />
                    <span className="font-mono">{t}</span>
                  </label>
                );
              })
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// Monitor-mode view: distinct read-only "what is being monitored" UI
// ═════════════════════════════════════════════════════════════════════════
function MonitorAlarmConfigView({
  rows,
  vendor,
  client,
}: {
  rows: AlarmRow[];
  vendor: string;
  client?: string;
}) {
  const [search, setSearch] = useState('');
  const configured = useMemo(() => rows.filter(r => r.trapTypes.length > 0), [rows]);
  const filtered = useMemo(() => {
    if (!search.trim()) return configured;
    const s = search.toLowerCase();
    return configured.filter(r =>
      r.sourceNode.toLowerCase().includes(s) ||
      r.destNode.toLowerCase().includes(s) ||
      r.sourcePort.toLowerCase().includes(s) ||
      r.destPort.toLowerCase().includes(s) ||
      r.trapTypes.some(t => t.toLowerCase().includes(s))
    );
  }, [configured, search]);

  const totalTraps = useMemo(
    () => configured.reduce((acc, r) => acc + r.trapTypes.length, 0),
    [configured],
  );

  return (
    <div className="flex flex-col h-full">
      {/* Summary banner */}
      <div className="px-6 py-3 border-b bg-gradient-to-r from-primary/5 via-primary/10 to-transparent">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center">
                <Bell className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Monitoring</div>
                <div className="text-sm font-semibold text-foreground">
                  {configured.length} link{configured.length !== 1 ? 's' : ''} · {totalTraps} trap{totalTraps !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="flex items-center gap-3 text-xs">
              <div>
                <div className="text-[10px] uppercase text-muted-foreground">Vendor</div>
                <div className="font-mono font-semibold">{vendor || '—'}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-muted-foreground">Client</div>
                <div className="font-mono font-semibold">{client || '—'}</div>
              </div>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter monitored links…"
              className="h-9 w-64 pl-9 text-sm"
            />
          </div>
        </div>
      </div>

      {/* List of monitored links */}
      <ScrollArea className="flex-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-6">
            <Bell className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <div className="text-sm font-medium text-foreground">
              {configured.length === 0 ? 'No alarms are being monitored' : 'No links match your search'}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {configured.length === 0
                ? 'Configure trap-types per link in Edit mode to start monitoring.'
                : 'Try a different search term.'}
            </div>
          </div>
        ) : (
          <div className="divide-y">
            {filtered.map(row => (
              <div
                key={row.linkId}
                className="px-6 py-3 hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-sm font-semibold truncate">{row.sourceNode}</span>
                      {row.sourcePort && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1 font-mono shrink-0">{row.sourcePort}</Badge>
                      )}
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-sm font-semibold truncate">{row.destNode}</span>
                      {row.destPort && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1 font-mono shrink-0">{row.destPort}</Badge>
                      )}
                    </div>
                  </div>
                  <Badge variant="secondary" className="shrink-0 text-[10px] h-5">
                    {row.trapTypes.length} trap{row.trapTypes.length !== 1 ? 's' : ''}
                  </Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5 pl-0">
                  {row.trapTypes.map(t => (
                    <Badge
                      key={t}
                      className="text-[10px] h-5 px-1.5 font-mono bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15"
                      variant="outline"
                    >
                      <Bell className="h-2.5 w-2.5 mr-1" />
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// Main dialog
// ═════════════════════════════════════════════════════════════════════════
export function AlarmConfigDialog({
  open,
  onOpenChange,
  nodes,
  links,
  topologyId,
  vendor: vendorProp,
  client: clientProp,
  readOnly = false,
  onContextChange,
}: AlarmConfigDialogProps) {
  // Vendor/Client are user-editable inside the dialog (no longer locked).
  // Changes are propagated to the parent so the topology save stays in sync.
  const [vendor, setVendor] = useState(vendorProp || '');
  const [client, setClient] = useState(clientProp || '');

  // Re-sync when the dialog opens or parent values change externally
  useEffect(() => { setVendor(vendorProp || ''); }, [vendorProp, open]);
  useEffect(() => { setClient(clientProp || ''); }, [clientProp, open]);

  const updateVendor = (v: string) => {
    setVendor(v);
    onContextChange?.({ vendor: v, client });
  };
  const updateClient = (c: string) => {
    setClient(c);
    onContextChange?.({ vendor, client: c });
  };



  const [searchText, setSearchText] = useState('');
  const [trapOptions, setTrapOptions] = useState<string[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [rowsMap, setRowsMap] = useState<Record<string, string[]>>({});
  const [savedRowsMap, setSavedRowsMap] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);

  const nodeMap = useMemo(() => {
    const m = new Map<string, CustomNode>();
    nodes.forEach(n => m.set(n.id, n));
    return m;
  }, [nodes]);

  const rows = useMemo<AlarmRow[]>(() => {
    return links.map(link => {
      const src = nodeMap.get(link.source);
      const dst = nodeMap.get(link.target);
      return {
        id: link.id,
        linkId: link.id,
        sourceNode: src?.label || link.source,
        sourcePort: link.srcPortName || '',
        destNode: dst?.label || link.target,
        destPort: link.dstPortName || '',
        trapTypes: rowsMap[link.id] || [],
      };
    });
  }, [links, nodeMap, rowsMap]);

  const filteredRows = useMemo(() => {
    if (!searchText) return rows;
    const s = searchText.toLowerCase();
    return rows.filter(r =>
      r.sourceNode.toLowerCase().includes(s) ||
      r.destNode.toLowerCase().includes(s) ||
      r.sourcePort.toLowerCase().includes(s) ||
      r.destPort.toLowerCase().includes(s) ||
      r.trapTypes.some(t => t.toLowerCase().includes(s))
    );
  }, [rows, searchText]);

  // Dirty state — compare current rowsMap against last-saved snapshot
  const isDirty = useMemo(() => {
    const norm = (m: Record<string, string[]>) =>
      Object.entries(m)
        .filter(([, v]) => v.length > 0)
        .map(([k, v]) => `${k}:${[...v].sort().join(',')}`)
        .sort()
        .join('|');
    return norm(rowsMap) !== norm(savedRowsMap);
  }, [rowsMap, savedRowsMap]);

  // Fetch trap-type options for vendor when dialog opens (edit mode only)
  useEffect(() => {
    if (!open || !vendor || readOnly) {
      if (readOnly) setTrapOptions([]);
      return;
    }
    let cancelled = false;
    setLoadingOptions(true);
    fetchTrapTypes(vendor)
      .then(list => { if (!cancelled) setTrapOptions(list); })
      .finally(() => { if (!cancelled) setLoadingOptions(false); });
    return () => { cancelled = true; };
  }, [open, vendor, readOnly]);

  // Hydrate state: load API → overlay localStorage draft (if any)
  useEffect(() => {
    if (!open || !topologyId) return;
    let cancelled = false;
    setLoadingExisting(true);
    getAlarmSuperimpose(topologyId, vendor)
      .then((existing) => {
        if (cancelled) return;
        const apiMap: Record<string, string[]> = {};
        const linkIds = new Set(links.map(l => l.id));
        existing.forEach((row: any) => {
          const traps = (row.trapType || row.trapTypes || '')
            .toString()
            .split(',')
            .map((t: string) => t.trim())
            .filter(Boolean);
          if (!traps.length) return;

          const rawKey = row.linkId || row.link_id;
          const srcNode = row.sourceNode || row.source_node || row.source_label;
          const srcPort = row.sourcePort || row.source_port || '';
          const dstNode = row.destNode || row.dest_node || row.target_label;
          const dstPort = row.destPort || row.dest_port || '';

          // Prefer linkId only if it matches a current link; otherwise fall back
          // to source/dest node (+port) matching so backend-stored ids don't
          // orphan the config after a topology reload.
          let matchedId: string | undefined;
          if (rawKey && linkIds.has(rawKey)) {
            matchedId = rawKey;
          } else if (srcNode && dstNode) {
            const match = links.find(l => {
              const s = nodeMap.get(l.source)?.label;
              const d = nodeMap.get(l.target)?.label;
              if (s !== srcNode || d !== dstNode) return false;
              // If ports were saved, prefer an exact port match; otherwise accept.
              if (srcPort && l.srcPortName && l.srcPortName !== srcPort) return false;
              if (dstPort && l.dstPortName && l.dstPortName !== dstPort) return false;
              return true;
            }) || links.find(l => {
              const s = nodeMap.get(l.source)?.label;
              const d = nodeMap.get(l.target)?.label;
              return s === srcNode && d === dstNode;
            });
            if (match) matchedId = match.id;
          }
          if (matchedId) {
            apiMap[matchedId] = Array.from(new Set([...(apiMap[matchedId] || []), ...traps]));
          }
        });
        setSavedRowsMap(apiMap);

        // In edit mode, prefer localStorage draft if newer
        if (!readOnly) {
          const draft = loadDraft(topologyId, vendor, client);
          if (draft && draft.vendor === vendor && (draft.client || '') === (client || '')) {
            setRowsMap(draft.rowsMap);
            setHasDraft(true);
          } else {
            setRowsMap(apiMap);
            setHasDraft(false);
          }
        } else {
          setRowsMap(apiMap);
        }
      })
      .finally(() => { if (!cancelled) setLoadingExisting(false); });
    return () => { cancelled = true; };
  }, [open, topologyId, vendor, client, readOnly, links, nodeMap]);

  // Per-link debounced auto-save: each linkId gets its own timer so quickly
  // editing multiple rows never drops earlier POSTs.
  const autoSaveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const handleTrapChange = useCallback((linkId: string, next: string[]) => {
    setRowsMap(prev => {
      const updated = { ...prev, [linkId]: next };
      if (!readOnly && topologyId && vendor) {
        saveDraft(topologyId, vendor, client, updated);
        setHasDraft(true);
        // Reset only this link's timer
        const prevTimer = autoSaveTimers.current.get(linkId);
        if (prevTimer) clearTimeout(prevTimer);
        const t = setTimeout(async () => {
          const changedRow = rows.find(r => r.linkId === linkId);
          if (!changedRow) return;
          const req: AlarmSuperimposeRequest = {
            topologyId,
            vendor,
            client,
            linkId: changedRow.linkId,
            sourceNode: changedRow.sourceNode,
            sourcePort: changedRow.sourcePort,
            destNode: changedRow.destNode,
            destPort: changedRow.destPort,
            trapType: next.join(','),
          };
          const ok = await saveAlarmSuperimpose(req).then(() => true).catch(() => false);
          autoSaveTimers.current.delete(linkId);
          if (ok) {
            setSavedRowsMap(m => ({ ...m, [linkId]: next }));
            // Only clear the localStorage draft when there are no other
            // pending timers — otherwise other rows would lose their draft.
            if (autoSaveTimers.current.size === 0) {
              clearDraft(topologyId, vendor, client);
              setHasDraft(false);
            }
          }
        }, 800);
        autoSaveTimers.current.set(linkId, t);
      }
      return updated;
    });
  }, [readOnly, topologyId, vendor, client, rows]);

  // Warn on close with unsaved draft
  const handleOpenChange = useCallback((next: boolean) => {
    if (!next && !readOnly && isDirty) {
      toast.warning('Unsaved alarm config — your changes are kept locally. Click "Save Alarm Config" to persist to server.', {
        duration: 5000,
      });
    }
    onOpenChange(next);
  }, [onOpenChange, readOnly, isDirty]);

  const handleDiscardDraft = useCallback(() => {
    clearDraft(topologyId, vendor, client);
    setRowsMap(savedRowsMap);
    setHasDraft(false);
    toast.info('Reverted to last saved configuration');
  }, [topologyId, vendor, client, savedRowsMap]);

  const handleSave = async () => {
    if (!topologyId || !vendor) {
      toast.error('Topology and vendor are required to save alarm config');
      return;
    }
    setSaving(true);
    try {
      const payload: AlarmSuperimposeRequest[] = rows
        .filter(r => r.trapTypes.length > 0)
        .map(r => ({
          topologyId,
          vendor,
          client,
          linkId: r.linkId,
          sourceNode: r.sourceNode,
          sourcePort: r.sourcePort,
          destNode: r.destNode,
          destPort: r.destPort,
          trapType: r.trapTypes.join(','),
        }));
      await saveAlarmSuperimposeBatch(payload);
      setSavedRowsMap(rowsMap);
      clearDraft(topologyId, vendor, client);
      setHasDraft(false);
      toast.success(`Alarm config saved (${payload.length} link${payload.length === 1 ? '' : 's'})`);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(`Save failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const columns: GridColDef<AlarmRow>[] = useMemo(() => [
    {
      field: 'sourceNode',
      headerName: 'Source Node',
      flex: 1,
      minWidth: 160,
      renderCell: (p) => <span className="text-sm font-medium">{p.value}</span>,
    },
    {
      field: 'sourcePort',
      headerName: 'Src Port',
      width: 130,
      renderCell: (p) => <span className="text-sm text-foreground/80">{p.value || '—'}</span>,
    },
    {
      field: 'destNode',
      headerName: 'Dest Node',
      flex: 1,
      minWidth: 160,
      renderCell: (p) => <span className="text-sm font-medium">{p.value}</span>,
    },
    {
      field: 'destPort',
      headerName: 'Dst Port',
      width: 130,
      renderCell: (p) => <span className="text-sm text-foreground/80">{p.value || '—'}</span>,
    },
    {
      field: 'trapTypes',
      headerName: 'Trap Types (multi-select)',
      flex: 2,
      minWidth: 280,
      sortable: false,
      filterable: false,
      renderCell: (p: GridRenderCellParams<AlarmRow>) => (
        <div className="w-full py-1">
          <TrapMultiSelect
            value={p.row.trapTypes}
            options={trapOptions}
            onChange={(next) => handleTrapChange(p.row.linkId, next)}
            disabled={loadingOptions}
          />
        </div>
      ),
    },
  ], [trapOptions, loadingOptions, handleTrapChange]);

  const selectedCount = rows.filter(r => r.trapTypes.length > 0).length;

  // ───── Read-only Monitor view ─────
  if (readOnly) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-3xl w-full max-h-[85vh] flex flex-col p-0 gap-0 [&>button]:z-50">
          <DialogTitle className="sr-only">Monitored Alarms</DialogTitle>
          <DialogDescription className="sr-only">View trap-types configured for monitoring on this topology's links.</DialogDescription>
          <div className="px-6 pr-14 py-3 border-b">
            <h2 className="text-base font-semibold text-foreground tracking-tight flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              Monitored Alarms
              <Badge variant="outline" className="text-[10px] ml-1">Read-only</Badge>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Trap-types configured for monitoring on this topology's links
            </p>
          </div>
          {loadingExisting ? (
            <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Loading monitored alarms…
            </div>
          ) : (
            <MonitorAlarmConfigView rows={rows} vendor={vendor} client={client} />
          )}
        </DialogContent>
      </Dialog>
    );
  }

  // ───── Edit / Admin view ─────
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="!max-w-[80vw] w-[80vw] h-[85vh] max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden [&>button]:z-50">
        <DialogTitle className="sr-only">Alarm Configuration</DialogTitle>
        <DialogDescription className="sr-only">Configure trap types for each link in this topology.</DialogDescription>
        {/* Header */}
        <div className="px-6 pr-14 py-4 border-b border-border bg-muted/30 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground tracking-tight flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Alarm Config
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {filteredRows.length} link{filteredRows.length !== 1 ? 's' : ''} • {selectedCount} configured
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search links…"
                  className="h-9 w-60 pl-9 text-sm rounded-lg border-border/60 bg-background"
                />
              </div>
              {hasDraft && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDiscardDraft}
                  className="h-9 px-3 text-xs"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
                  Discard Draft
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving || !vendor || !topologyId}
                className="h-9 px-4 text-sm font-medium shrink-0"
              >
                {saving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
                Save Alarm Config
              </Button>
            </div>
          </div>

          {/* Vendor + Client selectors — kept in sync with the Save dialog */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Vendor</span>
              <Select value={vendor} onValueChange={updateVendor}>
                <SelectTrigger className="h-8 w-40 text-xs">
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  {VENDOR_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">Client</span>
              <Select value={client} onValueChange={updateClient}>
                <SelectTrigger className="h-8 w-40 text-xs">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  {CLIENT_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <span className="text-[10px] text-muted-foreground italic">
              These values will also be applied when you save the topology.
            </span>
          </div>
        </div>


        {/* Unsaved-changes banner */}
        {isDirty && (
          <div className="flex items-center gap-2 px-6 py-2 text-xs text-amber-700 dark:text-amber-300 border-b bg-amber-50/60 dark:bg-amber-950/30">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span className="font-medium">Unsaved changes</span>
            <span className="text-muted-foreground">— kept locally in your browser. Click "Save Alarm Config" to persist to server.</span>
          </div>
        )}
        {!isDirty && hasDraft === false && selectedCount > 0 && (
          <div className="flex items-center gap-2 px-6 py-1.5 text-xs text-emerald-700 dark:text-emerald-300 border-b bg-emerald-50/40 dark:bg-emerald-950/20">
            <CheckCircle2 className="h-3.5 w-3.5" />
            All changes saved
          </div>
        )}

        {/* Status strip */}
        {(loadingOptions || loadingExisting) && (
          <div className="flex items-center gap-2 px-6 py-1.5 text-xs text-muted-foreground border-b bg-muted/20">
            <Loader2 className="h-3 w-3 animate-spin" />
            {loadingExisting ? 'Loading saved configuration…' : `Loading trap types for ${vendor}…`}
          </div>
        )}
        {!vendor && (
          <div className="flex items-center gap-2 px-6 py-2 text-xs text-amber-600 dark:text-amber-400 border-b bg-amber-50/40 dark:bg-amber-950/30">
            <X className="h-3.5 w-3.5" />
            No vendor on topology — save the topology first to set vendor/client.
          </div>
        )}
        {(!topologyId || /^(untitled|new\s*topology)/i.test(topologyId)) ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8 py-16 gap-3">
            <div className="h-14 w-14 rounded-full bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center">
              <AlertTriangle className="h-7 w-7 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-base font-semibold text-foreground">Save the topology first</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Per-link alarm configs must be attached to a saved topology. Close this dialog, click <span className="font-medium text-foreground">Save</span> on the toolbar, then re-open Alarm Config.
            </p>
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="mt-2">
              Close
            </Button>
          </div>
        ) : (
        <div className="flex-1 min-h-0 overflow-hidden px-2 pb-2">

          <DataGrid
            rows={filteredRows}
            columns={columns}
            pageSizeOptions={[10, 20, 50, 100]}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            pagination
            density="standard"
            disableRowSelectionOnClick
            getRowHeight={() => 'auto'}
            sx={{
              height: '100%',
              border: 'none',
              '& .MuiDataGrid-cell': {
                fontSize: '0.875rem',
                borderColor: 'hsl(var(--border) / 0.3)',
                py: 1,
                alignItems: 'center',
                display: 'flex',
              },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: 'hsl(var(--muted) / 0.6)',
                borderColor: 'hsl(var(--border) / 0.6)',
              },
              '& .MuiDataGrid-columnHeaderTitle': {
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'hsl(var(--foreground) / 0.7)',
              },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: 'hsl(var(--muted) / 0.2)',
              },
              '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
                outline: 'none',
              },
            }}
          />
        </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
