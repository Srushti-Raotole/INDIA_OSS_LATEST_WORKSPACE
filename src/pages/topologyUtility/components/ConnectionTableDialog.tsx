import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { DataGrid, type GridColDef, type GridRenderCellParams, type GridRenderEditCellParams, type GridRowModel } from '@mui/x-data-grid';
import { Dialog, DialogContent } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover';
import { Label } from '../../../components/ui/label';
import { Checkbox } from '../../../components/ui/checkbox';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Trash2, Plus, Search, Edit2, Palette, Bell, Loader2 } from 'lucide-react';
import type { CustomNode, CustomLink, GroupBox } from '../shared/types';
import { GROUP_COLOR_OPTIONS, GROUP_COLORS } from '../shared/types';
import { EQUIPMENT_ICON_OPTIONS } from '../../../pages/topologyUtility/utils/nodeIcons';
import { GROUP_LABEL_POSITIONS, parseGroupName, encodeGroupName, type GroupLabelPosition } from '../../../pages/topologyUtility/utils/groupLabelPosition';
import { fetchTrapTypes, getAlarmSuperimpose, saveAlarmSuperimpose } from '../services/topologyApi';
import { toast } from 'sonner';

const LINK_STYLE_OPTIONS: { value: string; label: string }[] = [
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' },
  { value: 'curved', label: 'Curved' },
  { value: 'step', label: 'Step' },
  { value: 'animated', label: 'Animated' },
  { value: 'glow', label: 'Glow' },
];

interface ConnectionRow {
  id: string;
  linkId: string;
  sourceNode: string;
  sourceIcon: string;
  sourceGroup: string;
  destNode: string;
  destIcon: string;
  destGroup: string;
  linkLabel: string;
  linkType: string;
  srcIp: string;
  dstIp: string;
  srcPortName: string;
  dstPortName: string;
}

interface ConnectionTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodes: CustomNode[];
  links: CustomLink[];
  groups?: GroupBox[];
  onUpdateRow: (linkId: string, field: string, value: string) => void;
  onBatchUpdateRow?: (linkId: string, updates: Record<string, string>) => void;
  onDeleteRow: (linkId: string) => void;
  onAddRow: () => void;
  onUpdateGroup?: (groupName: string, updates: { name?: string; label?: string; color?: string }) => void;
  /** Enables the Alarm Types column. When absent, column is hidden. */
  topologyId?: string;
  vendor?: string;
  client?: string;
}

// Group color popover for display mode
function GroupColorPopover({
  groupName,
  group,
  groupMap,
  onUpdateGroup,
}: {
  groupName: string;
  group?: GroupBox;
  groupMap: Map<string, GroupBox>;
  onUpdateGroup?: (groupName: string, updates: { name?: string; label?: string; color?: string }) => void;
}) {
  if (!onUpdateGroup) return null;
  const bgColor = group?.color || GROUP_COLORS[0];

  return (
    <div className="flex items-center gap-2">
      <span
        className="w-3 h-3 rounded shrink-0 border border-border/40"
        style={{ background: bgColor.replace('20', '60') }}
      />
      <span className="text-sm text-foreground">{groupName}</span>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
            <Palette className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" align="start">
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Group Label</Label>
              <Input
                defaultValue={group?.label || groupName}
                onBlur={(e) => onUpdateGroup(groupName, { label: e.target.value })}
                className="h-8 text-sm"
                onKeyDown={(e) => e.stopPropagation()}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Label Position</Label>
              <Select
                defaultValue={parseGroupName(groupName).position}
                onValueChange={(pos) => {
                  const newName = encodeGroupName(groupName, pos as GroupLabelPosition);
                  onUpdateGroup(groupName, { name: newName, label: newName });
                }}
              >
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GROUP_LABEL_POSITIONS.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Background Color</Label>
              <div className="grid grid-cols-4 gap-1.5">
                {GROUP_COLOR_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    className={`w-full h-8 rounded border-2 transition-all ${
                      group?.color === opt.bg ? 'border-foreground scale-110' : 'border-transparent hover:border-muted-foreground/40'
                    }`}
                    style={{ background: opt.bg.replace('20', '40') }}
                    onClick={() => onUpdateGroup(groupName, { color: opt.bg })}
                    title={opt.label}
                  />
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function ConnectionTableDialog({
  open, onOpenChange, nodes, links, groups,
  onUpdateRow, onBatchUpdateRow, onDeleteRow, onAddRow, onUpdateGroup,
  topologyId, vendor, client,
}: ConnectionTableDialogProps) {
  const [searchText, setSearchText] = useState('');
  const alarmsEnabled = !!(topologyId && vendor);
  const [trapOptions, setTrapOptions] = useState<string[]>([]);
  const [loadingTraps, setLoadingTraps] = useState(false);
  const [alarmMap, setAlarmMap] = useState<Record<string, string[]>>({});
  const [savingLinkId, setSavingLinkId] = useState<string | null>(null);
  const nodeMap = useMemo(() => {
    const m = new Map<string, CustomNode>();
    nodes.forEach(n => m.set(n.id, n));
    return m;
  }, [nodes]);

  // Fetch trap-type options for vendor when dialog opens
  useEffect(() => {
    if (!open || !alarmsEnabled) return;
    let cancelled = false;
    setLoadingTraps(true);
    fetchTrapTypes(vendor)
      .then(list => { if (!cancelled) setTrapOptions(list); })
      .finally(() => { if (!cancelled) setLoadingTraps(false); });
    return () => { cancelled = true; };
  }, [open, alarmsEnabled, vendor]);

  // Hydrate existing per-link alarm config from API (matches AlarmConfigDialog logic)
  useEffect(() => {
    if (!open || !alarmsEnabled) return;
    let cancelled = false;
    getAlarmSuperimpose(topologyId!, vendor).then(existing => {
      if (cancelled) return;
      const linkIds = new Set(links.map(l => l.id));
      const map: Record<string, string[]> = {};
      existing.forEach((row: any) => {
        const traps = (row.trapType || row.trapTypes || '')
          .toString().split(',').map((t: string) => t.trim()).filter(Boolean);
        if (!traps.length) return;
        const rawKey = row.linkId || row.link_id;
        const srcNode = row.sourceNode || row.source_node || row.source_label;
        const srcPort = row.sourcePort || row.source_port || '';
        const dstNode = row.destNode || row.dest_node || row.target_label;
        const dstPort = row.destPort || row.dest_port || '';
        let matchedId: string | undefined;
        if (rawKey && linkIds.has(rawKey)) matchedId = rawKey;
        else if (srcNode && dstNode) {
          const match = links.find(l => {
            const s = nodeMap.get(l.source)?.label;
            const d = nodeMap.get(l.target)?.label;
            if (s !== srcNode || d !== dstNode) return false;
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
          map[matchedId] = Array.from(new Set([...(map[matchedId] || []), ...traps]));
        }
      });
      setAlarmMap(map);
    });
    return () => { cancelled = true; };
  }, [open, alarmsEnabled, topologyId, vendor, links, nodeMap]);

  const saveTraps = useCallback(async (linkId: string, traps: string[]) => {
    if (!alarmsEnabled) return;
    const link = links.find(l => l.id === linkId);
    if (!link) return;
    const src = nodeMap.get(link.source);
    const dst = nodeMap.get(link.target);
    setSavingLinkId(linkId);
    const ok = await saveAlarmSuperimpose({
      topologyId: topologyId!,
      vendor: vendor!,
      client,
      trapType: traps.join(','),
      linkId,
      sourceNode: src?.label || link.source,
      sourcePort: link.srcPortName || '',
      destNode: dst?.label || link.target,
      destPort: link.dstPortName || '',
    });
    setSavingLinkId(null);
    if (ok) toast.success(`Alarm types saved for ${src?.label || 'link'} → ${dst?.label || ''}`);
    else toast.error('Failed to save alarm types');
  }, [alarmsEnabled, topologyId, vendor, client, links, nodeMap]);

  const groupMap = useMemo(() => {
    const map = new Map<string, GroupBox>();
    (groups || []).forEach(g => map.set(g.name, g));
    return map;
  }, [groups]);

  const allGroupNames = useMemo(() => {
    const names = new Set<string>();
    nodes.forEach(n => { if (n.group) names.add(n.group); });
    return Array.from(names);
  }, [nodes]);

  const rows = useMemo<ConnectionRow[]>(() => {
    return links.map(link => {
      const src = nodes.find(n => n.id === link.source);
      const dest = nodes.find(n => n.id === link.target);
      return {
        id: link.id,
        linkId: link.id,
        sourceNode: src?.label || link.source,
        sourceIcon: src?.type || 'datacenter',
        sourceGroup: src?.group || '',
        destNode: dest?.label || link.target,
        destIcon: dest?.type || 'datacenter',
        destGroup: dest?.group || '',
        linkLabel: link.label || '',
        linkType: link.style || 'solid',
        srcIp: link.srcIp || '',
        dstIp: link.dstIp || '',
        srcPortName: link.srcPortName || '',
        dstPortName: link.dstPortName || '',
      };
    });
  }, [nodes, links]);

  const filteredRows = useMemo(() => {
    if (!searchText) return rows;
    const s = searchText.toLowerCase();
    return rows.filter(r =>
      r.sourceNode.toLowerCase().includes(s) ||
      r.destNode.toLowerCase().includes(s) ||
      r.linkLabel.toLowerCase().includes(s) ||
      r.srcIp.toLowerCase().includes(s) ||
      r.dstIp.toLowerCase().includes(s)
    );
  }, [rows, searchText]);

  // Icon select cell for edit mode
  const renderIconSelectEditCell = (field: 'sourceIcon' | 'destIcon') => (params: GridRenderEditCellParams) => {
    return (
      <Select
        value={params.value || 'datacenter'}
        onValueChange={(v) => {
          params.api.setEditCellValue({ id: params.id, field, value: v });
        }}
      >
        <SelectTrigger className="h-8 w-full text-xs border-0 shadow-none">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {EQUIPMENT_ICON_OPTIONS.map(o => (
            <SelectItem key={o.value} value={o.value}>
              <span className="flex items-center gap-1.5">
                <img src={o.imageUrl} alt={o.label} className="w-4 h-4 object-contain" />
                {o.label}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  // Link style select for edit mode
  const renderLinkStyleEditCell = (params: GridRenderEditCellParams) => {
    return (
      <Select
        value={params.value || 'solid'}
        onValueChange={(v) => {
          params.api.setEditCellValue({ id: params.id, field: 'linkType', value: v });
        }}
      >
        <SelectTrigger className="h-8 w-full text-xs border-0 shadow-none">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LINK_STYLE_OPTIONS.map(o => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  };

  const columns: GridColDef[] = useMemo(() => [
    {
      field: 'sourceNode',
      headerName: 'Source Node',
      flex: 1,
      minWidth: 140,
      editable: true,
      renderCell: (params: GridRenderCellParams) => {
        const iconOpt = EQUIPMENT_ICON_OPTIONS.find(o => o.value === params.row.sourceIcon);
        return (
          <span className="flex items-center gap-2 text-sm font-medium">
            <img src={iconOpt?.imageUrl || '/topology-icons/router.png'} alt="" className="w-4 h-4 object-contain shrink-0" />
            {params.value}
          </span>
        );
      },
    },
    {
      field: 'sourceIcon',
      headerName: 'Src Icon',
      width: 120,
      editable: true,
      renderCell: (params: GridRenderCellParams) => (
        <Badge variant="outline" className="text-xs capitalize">{params.value}</Badge>
      ),
      renderEditCell: renderIconSelectEditCell('sourceIcon'),
    },
    {
      field: 'srcIp',
      headerName: 'Src IP',
      width: 130,
      editable: true,
      renderCell: (params: GridRenderCellParams) => (
        <span className="text-sm text-foreground/80">{params.value || '—'}</span>
      ),
    },
    {
      field: 'srcPortName',
      headerName: 'Src Port',
      width: 120,
      editable: true,
      renderCell: (params: GridRenderCellParams) => (
        <span className="text-sm text-foreground/80">{params.value || '—'}</span>
      ),
    },
    {
      field: 'sourceGroup',
      headerName: 'Src Group',
      width: 160,
      editable: true,
      renderCell: (params: GridRenderCellParams) => {
        const groupName = params.value as string;
        if (!groupName) return <span className="text-sm text-muted-foreground">—</span>;
        const group = groupMap.get(groupName);
        return (
          <GroupColorPopover
            groupName={groupName}
            group={group}
            groupMap={groupMap}
            onUpdateGroup={onUpdateGroup}
          />
        );
      },
    },
    {
      field: 'destNode',
      headerName: 'Dest Node',
      flex: 1,
      minWidth: 140,
      editable: true,
      renderCell: (params: GridRenderCellParams) => {
        const iconOpt = EQUIPMENT_ICON_OPTIONS.find(o => o.value === params.row.destIcon);
        return (
          <span className="flex items-center gap-2 text-sm font-medium">
            <img src={iconOpt?.imageUrl || '/topology-icons/router.png'} alt="" className="w-4 h-4 object-contain shrink-0" />
            {params.value}
          </span>
        );
      },
    },
    {
      field: 'destIcon',
      headerName: 'Dst Icon',
      width: 120,
      editable: true,
      renderCell: (params: GridRenderCellParams) => (
        <Badge variant="outline" className="text-xs capitalize">{params.value}</Badge>
      ),
      renderEditCell: renderIconSelectEditCell('destIcon'),
    },
    {
      field: 'dstIp',
      headerName: 'Dst IP',
      width: 130,
      editable: true,
      renderCell: (params: GridRenderCellParams) => (
        <span className="text-sm text-foreground/80">{params.value || '—'}</span>
      ),
    },
    {
      field: 'dstPortName',
      headerName: 'Dst Port',
      width: 120,
      editable: true,
      renderCell: (params: GridRenderCellParams) => (
        <span className="text-sm text-foreground/80">{params.value || '—'}</span>
      ),
    },
    {
      field: 'destGroup',
      headerName: 'Dst Group',
      width: 160,
      editable: true,
      renderCell: (params: GridRenderCellParams) => {
        const groupName = params.value as string;
        if (!groupName) return <span className="text-sm text-muted-foreground">—</span>;
        const group = groupMap.get(groupName);
        return (
          <GroupColorPopover
            groupName={groupName}
            group={group}
            groupMap={groupMap}
            onUpdateGroup={onUpdateGroup}
          />
        );
      },
    },
    {
      field: 'linkLabel',
      headerName: 'Label',
      width: 120,
      editable: true,
      renderCell: (params: GridRenderCellParams) => (
        <span className="text-sm">{params.value || '—'}</span>
      ),
    },
    {
      field: 'linkType',
      headerName: 'Style',
      width: 110,
      editable: true,
      renderCell: (params: GridRenderCellParams) => (
        <Badge variant="secondary" className="text-xs capitalize">{params.value}</Badge>
      ),
      renderEditCell: renderLinkStyleEditCell,
    },
    ...(alarmsEnabled ? [{
      field: 'alarmTypes',
      headerName: 'Alarm Types',
      width: 260,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams) => {
        const linkId = params.row.linkId as string;
        const traps = alarmMap[linkId] || [];
        const saving = savingLinkId === linkId;
        return (
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1 flex-wrap w-full min-h-[28px] px-1.5 py-0.5 rounded hover:bg-muted/50 text-left"
                title="Click to configure monitored alarm types"
              >
                {saving && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                {traps.length === 0 ? (
                  <span className="text-xs text-muted-foreground italic flex items-center gap-1">
                    <Bell className="h-3 w-3" /> None — click to add
                  </span>
                ) : (
                  traps.map(t => (
                    <Badge key={t} variant="outline" className="text-[10px] h-5 px-1.5 font-mono bg-primary/10 text-primary border-primary/20">
                      {t}
                    </Badge>
                  ))
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0" align="start" onClick={e => e.stopPropagation()}>
              <div className="px-3 py-2 border-b flex items-center justify-between">
                <span className="text-xs font-semibold">Monitored Alarm Types</span>
                <span className="text-[10px] text-muted-foreground">{traps.length} selected</span>
              </div>
              {loadingTraps ? (
                <div className="flex items-center gap-2 px-3 py-4 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> Loading trap types…
                </div>
              ) : trapOptions.length === 0 ? (
                <div className="px-3 py-4 text-xs text-muted-foreground">No trap types available for {vendor}.</div>
              ) : (
                <ScrollArea className="h-56">
                  <div className="p-2 space-y-1">
                    {trapOptions.map(opt => {
                      const checked = traps.includes(opt);
                      return (
                        <label key={opt} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted/50 cursor-pointer">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(v) => {
                              const next = v
                                ? Array.from(new Set([...traps, opt]))
                                : traps.filter(t => t !== opt);
                              setAlarmMap(prev => ({ ...prev, [linkId]: next }));
                              saveTraps(linkId, next);
                            }}
                          />
                          <span className="text-xs font-mono">{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </PopoverContent>
          </Popover>
        );
      },
    } as GridColDef] : []),
    {
      field: 'actions',
      headerName: 'Actions',
      width: 80,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params: GridRenderCellParams) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
          onClick={() => onDeleteRow(params.row.linkId)}
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ], [groupMap, onUpdateGroup, onDeleteRow, alarmsEnabled, alarmMap, savingLinkId, loadingTraps, trapOptions, vendor, saveTraps]);

  const processRowUpdate = useCallback((newRow: GridRowModel, oldRow: GridRowModel) => {
    const linkId = newRow.linkId;
    const updates: Record<string, string> = {};

    const fields = ['sourceNode', 'sourceIcon', 'sourceGroup', 'destNode', 'destIcon', 'destGroup', 'linkLabel', 'linkType', 'srcIp', 'dstIp', 'srcPortName', 'dstPortName'];
    fields.forEach(f => {
      if (newRow[f] !== oldRow[f]) {
        updates[f] = newRow[f] || '';
      }
    });

    if (Object.keys(updates).length > 0) {
      if (onBatchUpdateRow) {
        onBatchUpdateRow(linkId, updates);
      } else {
        Object.entries(updates).forEach(([field, value]) => {
          onUpdateRow(linkId, field, value);
        });
      }
    }
    return newRow;
  }, [onBatchUpdateRow, onUpdateRow]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[85vw] w-full max-h-[90vh] flex flex-col p-0 gap-0 [&>button]:z-50">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pr-14 py-4 border-b border-border bg-muted/30">
          <div>
            <h2 className="text-lg font-semibold text-foreground tracking-tight">Connection Table</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {filteredRows.length} connection{filteredRows.length !== 1 ? 's' : ''} total
              <span className="ml-2 text-xs text-muted-foreground/70">• Double-click any cell to edit</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                placeholder="Search connections..."
                className="h-9 w-60 pl-9 text-sm rounded-lg border-border/60 bg-background"
              />
            </div>
            <Button size="sm" onClick={onAddRow} className="h-9 px-4 text-sm font-medium shrink-0">
              <Plus className="h-4 w-4 mr-1.5" /> Add Row
            </Button>
          </div>
        </div>

        {/* MUI DataGrid */}
        <div className="flex-1 min-h-0" style={{ height: 'calc(90vh - 140px)' }}>
          <DataGrid
            rows={filteredRows}
            columns={columns}
            processRowUpdate={processRowUpdate}
            onProcessRowUpdateError={(err) => console.error('Row update error:', err)}
            pageSizeOptions={[10, 20, 50, 100]}
            initialState={{
              pagination: { paginationModel: { pageSize: 20 } },
            }}
            density="compact"
            disableRowSelectionOnClick
            getRowClassName={(params) =>
              params.indexRelativeToCurrentPage % 2 === 0
                ? 'bg-background'
                : 'bg-muted/10'
            }
            sx={{
              border: 'none',
              '& .MuiDataGrid-cell': {
                fontSize: '0.875rem',
                borderColor: 'hsl(var(--border) / 0.3)',
                py: 0.5,
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
                outline: '2px solid hsl(var(--primary))',
                outlineOffset: '-2px',
              },
              '& .MuiDataGrid-footerContainer': {
                borderColor: 'hsl(var(--border))',
                backgroundColor: 'hsl(var(--muted) / 0.2)',
              },
              '& .MuiTablePagination-root': {
                color: 'hsl(var(--foreground) / 0.7)',
                fontSize: '0.875rem',
              },
              '& .MuiDataGrid-cell--editing': {
                backgroundColor: 'hsl(var(--primary) / 0.05) !important',
                '& input': {
                  fontSize: '0.875rem',
                },
              },
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
