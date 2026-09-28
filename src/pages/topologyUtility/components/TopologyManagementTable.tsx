
import { useMemo, useState } from 'react';
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from 'material-react-table';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../components/ui/tooltip';
import {
  Eye,
  Edit,
  Download,
  Trash2,
  Network,
} from 'lucide-react';
import { Switch } from '../../../components/ui/switch';
import { ApiTopology } from '../types';

interface TopologyManagementTableProps {
  topologies: ApiTopology[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onExport: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleMonitor?: (id: string, enabled: boolean) => void;
}

interface Row {
  id: string;
  name: string;
  client: string;
  vendor: string;
  nodes: number;
  links: number;
  monitorEnabled: boolean;
  raw: ApiTopology;
}

export function TopologyManagementTable({
  topologies,
  onView,
  onEdit,
  onExport,
  onDelete,
  onToggleMonitor,
}: TopologyManagementTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const data = useMemo<Row[]>(() => {
    return topologies.map((t) => ({
      id: String(t.id),
      name: t.name || '—',
      client: t.client || '—',
      vendor: t.vendor || '—',
      nodes: t.nodes?.length || 0,
      links: t.links?.length || 0,
      monitorEnabled: t.monitorEnabled || false,
      raw: t,
    }));
  }, [topologies]);

  const columns = useMemo<MRT_ColumnDef<Row>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Topology Name',
        size: 240,
        Cell: ({ row }) => (
          <span className="font-medium text-foreground block truncate max-w-full">
            {row.original.name}
          </span>
        ),
      },
      {
        accessorKey: 'client',
        header: 'Client',
        size: 160,
        Cell: ({ row }) => (
          <span className="text-sm text-muted-foreground block truncate max-w-full">
            {row.original.client}
          </span>
        ),
      },
      {
        accessorKey: 'vendor',
        header: 'Vendor',
        size: 120,
        Cell: ({ row }) => (
          <span className="text-sm text-muted-foreground capitalize block truncate max-w-full">
            {row.original.vendor}
          </span>
        ),
      },
      {
        accessorKey: 'nodes',
        header: 'Nodes',
        size: 90,
        Cell: ({ row }) => (
          <Badge variant="secondary" className="font-mono text-xs">
            {row.original.nodes}
          </Badge>
        ),
      },
      {
        accessorKey: 'links',
        header: 'Links',
        size: 90,
        Cell: ({ row }) => (
          <Badge variant="secondary" className="font-mono text-xs">
            {row.original.links}
          </Badge>
        ),
      },
      {
        accessorKey: 'monitorEnabled',
        header: 'Monitor',
        size: 100,
        Cell: ({ row }) => (
          <div className="flex items-center h-full">
            <Switch
              checked={row.original.monitorEnabled}
              onCheckedChange={(checked) => onToggleMonitor?.(row.original.id, checked)}
              className="scale-75"
            />
          </div>
        ),
      },
      {
        accessorKey: 'actions',
        header: 'Actions',
        size: 160,
        Cell: ({ row }) => (
          <TooltipProvider delayDuration={200}>
            <div className="flex items-center gap-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => onView(row.original.id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">View</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => onEdit(row.original.id)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Edit</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={() => onExport(row.original.id)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Download CSV</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => setDeleteId(row.original.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">Delete</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        ),
      },
    ],
    [onView, onEdit, onExport, onDelete]
  );

  const table = useMaterialReactTable({
    columns,
    data,
    /* ================= REMOVED FILTERS, SORTING & PLAIN HEADER CONTROLS ================= */
    enableColumnFilters: false,   // Completely hides the internal filter input row
    enableSorting: false,         // Disables sorting interactions and hides spacing icons
    enableColumnActions: false,   // Removes the column menu dropdown button entirely
    enableColumnOrdering: false,
    enableDensityToggle: false,
    enableHiding: false,
    enableGlobalFilter: true,     // Keeps the top-level main search input box active
    enablePagination: true,
    layoutMode: 'grid',
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    enableStickyHeader: true,
    
    initialState: {
      density: 'compact',
      pagination: { pageIndex: 0, pageSize: 25 },
      showGlobalFilter: true,
    },

    /* ================= VIEWPORT CONTAINER SCROLL ================= */
    muiTablePaperProps: {
      elevation: 0,
      sx: {
        border: '1px solid hsl(var(--border))',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
        height: '100%',
        minHeight: 0, 
        overflow: 'hidden',
      },
    },

    muiTableContainerProps: {
      sx: {
        flexGrow: 1,
        maxHeight: 'calc(100vh - 280px)', // Forces pagination to stick perfectly to the bottom
        minHeight: '200px',
        overflowY: 'auto',
        overflowX: 'auto',
        scrollbarWidth: 'thin',
      },
    },

    /* ================= FIX: NO-OVERLAP PLAIN HEADERS ================= */
    muiTableHeadProps: {
      sx: {
        '& tr': {
          height: '36px', // Compact height boundary
        },
      },
    },

    muiTableHeadCellProps: {
      sx: {
        backgroundColor: 'hsl(var(--muted) / 0.6)',
        fontSize: '0.75rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        py: 0,
        px: 1.5,
        height: '100%',
        verticalAlign: 'middle',
        borderRight: '1px solid hsl(var(--border))',
        // Centers text cleanly without any filter or icon wrappers interfering
        '& .Mui-TableHeadCell-Content': {
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          overflow: 'hidden',
          height: '100%',
        },
        '& .Mui-TableHeadCell-Content-Labels': {
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          display: 'block',
          width: '100%',
        },
      },
    },

    /* ================= COMPACT INTERACTIVE CELL ROWS ================= */
    muiTableBodyRowProps: {
      sx: {
        height: '32px',
        transition: 'background-color 0.15s ease',
      },
    },

    muiTableBodyCellProps: {
      sx: {
        fontSize: '0.78rem',
        py: 0.3,
        px: 1.5,
        verticalAlign: 'middle',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        borderRight: '1px solid hsl(var(--border) / 0.5)',
      },
    },

    /* ================= TOOLBAR & BOTTOM PAGINATION STICKY ANCHORING ================= */
    muiTopToolbarProps: {
      sx: {
        borderBottom: '1px solid hsl(var(--border))',
        p: 0.5,
      },
    },

    muiBottomToolbarProps: {
      sx: {
        borderTop: '1px solid hsl(var(--border))',
        mt: 'auto',
      },
    },

    muiPaginationProps: {
      size: 'small',
      variant: 'outlined',
      shape: 'rounded',
      showFirstButton: true,
      showLastButton: true,
    },

    renderEmptyRowsFallback: () => (
      <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
        <Network className="h-10 w-10 opacity-30 mb-3" />
        <div className="text-sm font-medium">No topologies found</div>
        <div className="text-xs mt-1">Create your first topology to get started</div>
      </div>
    ),
  });

  const handleConfirmDelete = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="w-full h-full flex flex-col min-h-0 overflow-hidden">
      <div className="flex-1 min-h-0 w-full flex flex-col">
        <MaterialReactTable table={table} />
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Topology</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The topology and all its data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}