import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../../../components/ui/dialog';
import { Badge } from '../../../components/ui/badge';
import { Bell, Loader2 } from 'lucide-react';
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from 'material-react-table';
import type { CustomNode, CustomLink } from '../shared/types';
import { getAlarmSuperimpose } from '../services/topologyApi';

export interface MonitoredAlarmsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodes: CustomNode[];
  links: CustomLink[];
  topologyId: string;
  vendor?: string;
  topologyName?: string;
}

interface Row {
  id: string;
  sourceNode: string;
  sourcePort: string;
  sourceIp: string;
  destNode: string;
  destPort: string;
  destIp: string;
  monitoringAlarms: string;
  trapCount: number;
}

export function MonitoredAlarmsDialog({
  open,
  onOpenChange,
  nodes,
  links,
  topologyId,
  vendor,
  topologyName,
}: MonitoredAlarmsDialogProps) {
  const [rowsMap, setRowsMap] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);

  const nodeMap = useMemo(() => {
    const m = new Map<string, CustomNode>();
    nodes.forEach(n => m.set(n.id, n));
    return m;
  }, [nodes]);

  useEffect(() => {
    if (!open || !topologyId) return;
    let cancelled = false;
    setLoading(true);
    getAlarmSuperimpose(topologyId, vendor)
      .then(existing => {
        if (cancelled) return;
        const linkIds = new Set(links.map(l => l.id));
        const map: Record<string, string[]> = {};

        existing.forEach((row: any) => {
          const traps: string[] = (row.trapType || row.trapTypes || '')
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

          let matchedId: string | undefined;
          if (rawKey && linkIds.has(rawKey)) {
            matchedId = rawKey;
          } else if (srcNode && dstNode) {
            const match = links.find(l => {
              const s = nodeMap.get(l.source);
              const d = nodeMap.get(l.target);
              if (!s || !d) return false;
              const sLbl = s.label;
              const dLbl = d.label;
              const nodeMatch =
                (sLbl === srcNode && dLbl === dstNode) ||
                (sLbl === dstNode && dLbl === srcNode);
              if (!nodeMatch) return false;
              // If ports supplied, prefer exact port match
              if (srcPort || dstPort) {
                const sp = l.srcPortName || '';
                const dp = l.dstPortName || '';
                return (
                  (sp === srcPort && dp === dstPort) ||
                  (sp === dstPort && dp === srcPort) ||
                  (!srcPort && !dstPort)
                );
              }
              return true;
            });
            matchedId = match?.id;
          }
          if (matchedId) {
            const prev = map[matchedId] || [];
            map[matchedId] = Array.from(new Set([...prev, ...traps]));
          }
        });
        setRowsMap(map);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, topologyId, vendor, links, nodeMap]);

  const data = useMemo<Row[]>(() => {
    return links
      .map(l => {
        const traps = rowsMap[l.id] || [];
        if (traps.length === 0) return null;
        const s = nodeMap.get(l.source);
        const d = nodeMap.get(l.target);
        return {
          id: l.id,
          sourceNode: s?.label || l.source,
          sourcePort: l.srcPortName || '',
          sourceIp: l.srcIp || '',
          destNode: d?.label || l.target,
          destPort: l.dstPortName || '',
          destIp: l.dstIp || '',
          monitoringAlarms: traps.join(', '),
          trapCount: traps.length,
        } as Row;
      })
      .filter((r): r is Row => r !== null);
  }, [links, nodeMap, rowsMap]);

  const columns = useMemo<MRT_ColumnDef<Row>[]>(() => [
    { accessorKey: 'sourceNode', header: 'Source Node', size: 180 },
    { accessorKey: 'sourcePort', header: 'Src Port', size: 120 },
    { accessorKey: 'sourceIp', header: 'Source IP', size: 130 },
    { accessorKey: 'destNode', header: 'Dest Node', size: 180 },
    { accessorKey: 'destPort', header: 'Dst Port', size: 120 },
    { accessorKey: 'destIp', header: 'Dest IP', size: 130 },
    {
      accessorKey: 'monitoringAlarms',
      header: 'Monitoring Alarms',
      size: 340,
      Cell: ({ row }) => {
        const traps = row.original.monitoringAlarms.split(',').map(t => t.trim()).filter(Boolean);
        return (
          <div className="flex flex-wrap gap-1 py-0.5">
            {traps.map(t => (
              <Badge
                key={t}
                variant="outline"
                className="text-[10px] h-5 px-1.5 font-mono bg-primary/10 text-primary border-primary/20"
              >
                {t}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: 'trapCount',
      header: '# Traps',
      size: 90,
      Cell: ({ cell }) => (
        <Badge variant="secondary" className="text-[10px] h-5">
          {cell.getValue<number>()}
        </Badge>
      ),
    },
  ], []);

  const table = useMaterialReactTable({
    columns,
    data,
    enableColumnFilters: true,
    enableColumnOrdering: false,
    enableDensityToggle: false,
    enableHiding: true,
    enableGlobalFilter: true,
    enablePagination: true,
    initialState: {
      density: 'compact',
      columnVisibility: { sourceIp: false, destIp: false },
      pagination: { pageIndex: 0, pageSize: 25 },
      showGlobalFilter: true,
    },
    muiTableContainerProps: { sx: { maxHeight: '60vh' } },
    muiTablePaperProps: { elevation: 0, sx: { border: '1px solid hsl(var(--border))', borderRadius: 8 } },
    muiTableHeadCellProps: {
      sx: {
        backgroundColor: 'hsl(var(--muted) / 0.6)',
        fontSize: '0.72rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      },
    },
    muiTableBodyCellProps: { sx: { fontSize: '0.8rem', verticalAlign: 'top' } },
  });

  const totalTraps = data.reduce((acc, r) => acc + r.trapCount, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[80vw] w-[80vw] h-[85vh] max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden [&>button]:z-50">
        <DialogTitle className="sr-only">Monitored Alarms</DialogTitle>
        <DialogDescription className="sr-only">
          Read-only list of monitored trap types per source/destination link.
        </DialogDescription>
        <div className="px-6 pr-14 py-3 border-b flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold tracking-tight">
            Monitored Alarms{' '}
            {topologyName && <span className="text-muted-foreground font-normal">— {topologyName}</span>}
          </h2>
          <Badge variant="outline" className="text-[10px] ml-1">Read-only</Badge>
          <span className="ml-auto text-xs text-muted-foreground flex items-center gap-2">
            {loading && <Loader2 className="h-3 w-3 animate-spin" />}
            {data.length} link{data.length !== 1 ? 's' : ''} · {totalTraps} trap{totalTraps !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="p-4 flex-1 min-h-0 overflow-auto">
          {loading && data.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading monitored alarms…
            </div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Bell className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <div className="text-sm font-medium">No alarms are being monitored</div>
              <div className="text-xs text-muted-foreground mt-1">
                Configure trap types per link in Edit mode to start monitoring.
              </div>
            </div>
          ) : (
            <MaterialReactTable table={table} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
