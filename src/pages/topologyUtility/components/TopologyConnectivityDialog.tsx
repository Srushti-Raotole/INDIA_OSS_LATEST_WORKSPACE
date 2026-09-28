
import { useMemo } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../../../components/ui/dialog';
import { Badge } from '../../../components/ui/badge';
import { Network } from 'lucide-react';
import { MaterialReactTable, useMaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import type { CustomNode, CustomLink } from '../shared/types';

export interface TopologyConnectivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nodes: CustomNode[];
  links: CustomLink[];
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
  label: string;
}

export function TopologyConnectivityDialog({
  open,
  onOpenChange,
  nodes,
  links,
  topologyName,
}: TopologyConnectivityDialogProps) {
  const nodeMap = useMemo(() => {
    const m = new Map<string, CustomNode>();
    nodes.forEach(n => m.set(n.id, n));
    return m;
  }, [nodes]);

  const data = useMemo<Row[]>(() => {
    return links.map(l => {
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
        label: l.label || '',
      };
    });
  }, [links, nodeMap]);

  const columns = useMemo<MRT_ColumnDef<Row>[]>(() => [
    { accessorKey: 'sourceNode', header: 'Source Node', size: 200 },
    { accessorKey: 'sourcePort', header: 'Src Port', size: 130 },
    { accessorKey: 'sourceIp', header: 'Source IP', size: 140 },
    { accessorKey: 'destNode', header: 'Dest Node', size: 200 },
    { accessorKey: 'destPort', header: 'Dst Port', size: 130 },
    { accessorKey: 'destIp', header: 'Dest IP', size: 140 },
    { accessorKey: 'label', header: 'Label', size: 180 },
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
    muiTableBodyCellProps: { sx: { fontSize: '0.8rem' } },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-[80vw] w-[80vw] h-[85vh] max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden [&>button]:z-50">
        <DialogTitle className="sr-only">Topology Connectivity</DialogTitle>
        <DialogDescription className="sr-only">Read-only list of every link in this topology.</DialogDescription>
        <div className="px-6 pr-14 py-3 border-b flex items-center gap-2">
          <Network className="h-4 w-4 text-primary" />
          <h2 className="text-base font-semibold tracking-tight">
            Connectivity {topologyName && <span className="text-muted-foreground font-normal">— {topologyName}</span>}
          </h2>
          <Badge variant="outline" className="text-[10px] ml-1">Read-only</Badge>
          <span className="ml-auto text-xs text-muted-foreground">
            {data.length} link{data.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="p-4 flex-1 min-h-0 overflow-auto">
          <MaterialReactTable table={table} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
