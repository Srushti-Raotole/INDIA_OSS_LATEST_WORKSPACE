import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Label } from '../../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Badge } from '../../../components/ui/badge';
import { Checkbox } from '../../../components/ui/checkbox';
import { Input } from '../../../components/ui/input';
import { toast } from 'sonner';
import { Download, Search, Loader2, Database } from 'lucide-react';

// Row shape returned from the inventory API
export interface InventoryRow {
  id: string;
  sourceNode: string;
  srcIcon: string;
  srcIp: string;
  srcPort: string;
  destNode: string;
  dstIcon: string;
  dstIp: string;
  dstPort: string;
  label: string;
  style: string;
}

interface AddFromInventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddAll: (rows: InventoryRow[]) => void;
}

// ── Mock data (replace with real API call later) ──
const MOCK_INVENTORY: InventoryRow[] = [
  { id: 'inv-1', sourceNode: 'KLW-NCS1004', srcIcon: 'OTN', srcIp: '10.10.1.1', srcPort: 'Port-1/0/1', destNode: 'GPX-PSM', dstIcon: 'DWDM', dstIp: '10.10.1.2', dstPort: 'Port-2/0/1', label: 'KLW-GPX-W1', style: 'STRAIGHT' },
  { id: 'inv-2', sourceNode: 'GPX-PSM', srcIcon: 'DWDM', srcIp: '10.10.1.2', srcPort: 'Port-2/0/2', destNode: 'KLW-MD32', dstIcon: 'EDFA', dstIp: '10.10.1.3', dstPort: 'Port-3/0/1', label: 'GPX-KLW-P1', style: 'DASHED' },
  { id: 'inv-3', sourceNode: 'DEL-NCS2006', srcIcon: 'ROUTER', srcIp: '10.20.1.1', srcPort: 'Eth-1/0/0', destNode: 'MUM-ASR9K', dstIcon: 'ROUTER', dstIp: '10.20.1.2', dstPort: 'Eth-2/0/0', label: 'DEL-MUM-Core', style: 'STRAIGHT' },
  { id: 'inv-4', sourceNode: 'CHN-NCS1004', srcIcon: 'OTN', srcIp: '10.30.1.1', srcPort: 'Port-1/0/3', destNode: 'BLR-NCS1004', dstIcon: 'OTN', dstIp: '10.30.1.2', dstPort: 'Port-1/0/4', label: 'CHN-BLR-W1', style: 'CURVED' },
  { id: 'inv-5', sourceNode: 'KOL-ASR9K', srcIcon: 'ROUTER', srcIp: '10.40.1.1', srcPort: 'Te0/0/0/1', destNode: 'DEL-NCS2006', dstIcon: 'ROUTER', dstIp: '10.40.1.2', dstPort: 'Te0/0/0/2', label: 'KOL-DEL-Trunk', style: 'STRAIGHT' },
  { id: 'inv-6', sourceNode: 'MUM-ASR9K', srcIcon: 'ROUTER', srcIp: '', srcPort: '', destNode: 'PUN-NCS540', dstIcon: 'SWITCH', dstIp: '', dstPort: '', label: 'MUM-PUN-Metro', style: 'DASHED' },
];

const ADAPTER_OPTIONS = ['CONC', 'MCP', 'NFMT', 'TLMR', 'ADVA'];
const CLIENT_OPTIONS = ['Jio', 'Airtel', 'BSNL', 'Vodafone', 'Tata Communications', 'Microsoft', 'Google'];

export function AddFromInventoryDialog({ open, onOpenChange, onAddAll }: AddFromInventoryDialogProps) {
  const [adapter, setAdapter] = useState('');
  const [client, setClient] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<InventoryRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleGetData = useCallback(async () => {
    if (!adapter && !client) {
      toast.error('Please select at least Adapter or Client');
      return;
    }
    setLoading(true);
    setData([]);
    setSelectedIds(new Set());

    // TODO: Replace with real API call
    // const { data } = await axiosClient.get(`/api/inventory?adapter=${adapter}&client=${client}`);
    await new Promise(r => setTimeout(r, 800));
    setData(MOCK_INVENTORY);
    setLoading(false);
    toast.success(`Fetched ${MOCK_INVENTORY.length} records`);
  }, [adapter, client]);

  const filteredData = data.filter(row => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      row.sourceNode.toLowerCase().includes(q) ||
      row.destNode.toLowerCase().includes(q) ||
      row.label.toLowerCase().includes(q) ||
      row.srcIp.toLowerCase().includes(q) ||
      row.dstIp.toLowerCase().includes(q)
    );
  });

  const toggleRow = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredData.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredData.map(r => r.id)));
    }
  };

  const handleAddToTopology = () => {
    const rowsToAdd = data.filter(r => selectedIds.size === 0 || selectedIds.has(r.id));
    if (rowsToAdd.length === 0) {
      toast.error('No data to add');
      return;
    }
    onAddAll(rowsToAdd);
    toast.success(`Added ${rowsToAdd.length} connections to topology`);
    onOpenChange(false);
    setData([]);
    setAdapter('');
    setClient('');
    setSelectedIds(new Set());
  };

  const handleExport = () => {
    if (data.length === 0) {
      toast.error('No data to export');
      return;
    }
    const headers = ['Source Node', 'Src Icon', 'Src IP', 'Src Port', 'Dest Node', 'Dst Icon', 'Dst IP', 'Dst Port', 'Label', 'Style'];
    const rows = data.map(r => [r.sourceNode, r.srcIcon, r.srcIp, r.srcPort, r.destNode, r.dstIcon, r.dstIp, r.dstPort, r.label, r.style].map(v => `"${v}"`).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_${adapter || 'all'}_${client || 'all'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported to CSV');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Add from Inventory
          </DialogTitle>
        </DialogHeader>

        {/* Filters Row */}
        <div className="flex items-end gap-4 py-2">
          <div className="flex-1 max-w-[220px]">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Adapter</Label>
            <Select value={adapter} onValueChange={setAdapter}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select Adapter" />
              </SelectTrigger>
              <SelectContent>
                {ADAPTER_OPTIONS.map(a => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 max-w-[220px]">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Client</Label>
            <Select value={client} onValueChange={setClient}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select Client" />
              </SelectTrigger>
              <SelectContent>
                {CLIENT_OPTIONS.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleGetData} disabled={loading} className="h-9">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Search className="h-4 w-4 mr-1.5" />}
            Get Data
          </Button>
        </div>

        {/* Data Table */}
        {data.length > 0 && (
          <div className="flex-1 flex flex-col gap-2 overflow-hidden">
            {/* Search + Export bar */}
            <div className="flex items-center justify-between">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search inventory..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {selectedIds.size > 0 ? `${selectedIds.size} selected` : `${filteredData.length} records`}
                </Badge>
                <Button variant="outline" size="sm" onClick={handleExport} className="h-8">
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Export CSV
                </Button>
              </div>
            </div>

            {/* Scrollable table */}
            <div className="flex-1 overflow-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-10">
                      <Checkbox
                        checked={selectedIds.size === filteredData.length && filteredData.length > 0}
                        onCheckedChange={toggleAll}
                      />
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase">Source Node</TableHead>
                    <TableHead className="text-xs font-semibold uppercase">Src Icon</TableHead>
                    <TableHead className="text-xs font-semibold uppercase">Src IP</TableHead>
                    <TableHead className="text-xs font-semibold uppercase">Src Port</TableHead>
                    <TableHead className="text-xs font-semibold uppercase">Dest Node</TableHead>
                    <TableHead className="text-xs font-semibold uppercase">Dst Icon</TableHead>
                    <TableHead className="text-xs font-semibold uppercase">Dst IP</TableHead>
                    <TableHead className="text-xs font-semibold uppercase">Dst Port</TableHead>
                    <TableHead className="text-xs font-semibold uppercase">Label</TableHead>
                    <TableHead className="text-xs font-semibold uppercase">Style</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map(row => (
                    <TableRow
                      key={row.id}
                      className={selectedIds.has(row.id) ? 'bg-primary/5' : ''}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(row.id)}
                          onCheckedChange={() => toggleRow(row.id)}
                        />
                      </TableCell>
                      <TableCell className="text-sm font-medium">{row.sourceNode}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{row.srcIcon}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{row.srcIp || '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{row.srcPort || '—'}</TableCell>
                      <TableCell className="text-sm font-medium">{row.destNode}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{row.dstIcon}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{row.dstIp || '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{row.dstPort || '—'}</TableCell>
                      <TableCell className="text-sm">{row.label || '—'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">{row.style}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Empty state */}
        {data.length === 0 && !loading && (
          <div className="flex-1 flex items-center justify-center py-12 text-muted-foreground text-sm">
            Select Adapter and/or Client, then click "Get Data" to fetch inventory records.
          </div>
        )}

        {loading && (
          <div className="flex-1 flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Fetching inventory data...</span>
          </div>
        )}

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleAddToTopology} disabled={data.length === 0}>
            Add All to Topology
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
