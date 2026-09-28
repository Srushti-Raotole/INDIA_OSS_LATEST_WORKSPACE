import { useState, useRef } from 'react';
import { Upload, Download, FileText, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Badge } from '../../../components/ui/badge';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { toast } from 'sonner';
import { CustomNode, CustomLink } from '../shared/types';

interface CSVUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (nodes: Omit<CustomNode, 'id'>[], links: Omit<CustomLink, 'id'>[]) => void;
  existingNodes: CustomNode[];
}

interface ParsedData {
  nodes: Omit<CustomNode, 'id'>[];
  links: Omit<CustomLink, 'id'>[];
  errors: string[];
  warnings: string[];
}

const SAMPLE_CSV = `Source Node,Source Icon,Source IP,Source Port,Destination Node,Destination Icon,Dest IP,Dest Port,Link Label
"Router-A","router","10.0.0.1","Gi0/0/1","Switch-B","switch","10.0.0.2","Gi0/1/1","Uplink Port 1"
"Router-A","router","10.0.0.1","Gi0/0/2","Switch-B","switch","10.0.0.2","Gi0/1/2","Uplink Port 2"
"Router-A","router","10.0.0.1","Gi0/0/3","Switch-B","switch","10.0.0.2","Gi0/1/3","Uplink Port 3"
"Switch-B","switch","10.0.0.2","Gi0/2/1","Server-C","server","10.0.0.3","Eth0","Access Port 1"
"Switch-B","switch","10.0.0.2","Gi0/2/2","Server-C","server","10.0.0.3","Eth1","Access Port 2"
"Router-A","router","10.0.0.1","Gi0/0/4","Server-D","server","10.0.0.4","Eth0","Direct Link"`;

export function CSVUploadDialog({ open, onOpenChange, onImport, existingNodes }: CSVUploadDialogProps) {
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadSampleCSV = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = 'topology-sample.csv'; a.click(); URL.revokeObjectURL(url);
    toast.success('Sample CSV downloaded');
  };

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = []; let current = ''; let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') { if (inQuotes && i + 1 < line.length && line[i + 1] === '"') { current += '"'; i++; } else inQuotes = !inQuotes; }
      else if (char === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
      else current += char;
    }
    result.push(current.trim()); return result;
  };

  const findColumnIndex = (headers: string[], possibleNames: string[]): number => {
    const normalize = (name: string) => name.toLowerCase().replace(/[\s_-]+/g, '').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const normalizedHeaders = headers.map(normalize);
    const normalizedPossibleNames = possibleNames.map(normalize);
    for (const name of normalizedPossibleNames) { const idx = normalizedHeaders.indexOf(name); if (idx !== -1) return idx; }
    for (const name of normalizedPossibleNames) { const idx = normalizedHeaders.findIndex(h => h.startsWith(name)); if (idx !== -1) return idx; }
    for (const name of normalizedPossibleNames) { const idx = normalizedHeaders.findIndex(h => h.includes(name)); if (idx !== -1) return idx; }
    return -1;
  };

  const parseCSV = (content: string): ParsedData => {
    const lines = content.trim().split(/\r\n|\n/);
    const nodes: Omit<CustomNode, 'id'>[] = []; const links: Omit<CustomLink, 'id'>[] = [];
    const errors: string[] = []; const warnings: string[] = []; const nodeNameSet = new Set<string>();
    existingNodes.forEach(n => nodeNameSet.add(n.label.toLowerCase()));
    if (lines.length < 2) { errors.push('CSV must have a header row and at least one data row'); return { nodes, links, errors, warnings }; }
    const header = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
    const isManageFormat = findColumnIndex(header, ['sourcenode', 'source node']) !== -1 && findColumnIndex(header, ['destinationnode', 'destination node', 'destnode', 'dest node']) !== -1;
    if (isManageFormat) return parseManageCSV(lines, header, nodeNameSet, warnings, errors);

    const nodeNameIdx = findColumnIndex(header, ['node_name', 'nodename', 'name', 'node']);
    const nodeTypeIdx = findColumnIndex(header, ['node_type', 'nodetype', 'type']);
    const nodeStatusIdx = findColumnIndex(header, ['node_status', 'nodestatus', 'status']);
    const nodeXIdx = findColumnIndex(header, ['node_x', 'nodex', 'x', 'posx', 'pos_x']);
    const nodeYIdx = findColumnIndex(header, ['node_y', 'nodey', 'y', 'posy', 'pos_y']);
    const sourceIdx = findColumnIndex(header, ['source', 'source_node', 'from', 'src']);
    const targetIdx = findColumnIndex(header, ['target', 'target_node', 'to', 'dest', 'destination']);
    const linkLabelIdx = findColumnIndex(header, ['link_label', 'linklabel', 'label']);
    const linkStyleIdx = findColumnIndex(header, ['link_style', 'linkstyle', 'style']);
    const bandwidthIdx = findColumnIndex(header, ['bandwidth', 'bw', 'capacity']);
    if (nodeNameIdx === -1 && sourceIdx === -1) { errors.push('CSV must have either "node_name" or "source"/"target" columns'); return { nodes, links, errors, warnings }; }

    let autoNodeIndex = existingNodes.length;
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]); if (values.every(v => !v)) continue;
      const nodeName = nodeNameIdx >= 0 ? values[nodeNameIdx] || '' : '';
      const source = sourceIdx >= 0 ? values[sourceIdx] || '' : '';
      const target = targetIdx >= 0 ? values[targetIdx] || '' : '';
      if (nodeName && !nodeNameSet.has(nodeName.toLowerCase())) {
        const providedX = nodeXIdx >= 0 ? parseFloat(values[nodeXIdx]) : NaN;
        const providedY = nodeYIdx >= 0 ? parseFloat(values[nodeYIdx]) : NaN;
        let x: number, y: number;
        if (!isNaN(providedX) && !isNaN(providedY)) { x = providedX; y = providedY; }
        else { const gridCols = 5; const spacing = 150; x = (autoNodeIndex % gridCols) * spacing + 100; y = Math.floor(autoNodeIndex / gridCols) * spacing + 100; autoNodeIndex++; }
        nodes.push({ label: nodeName, x, y, type: (nodeTypeIdx >= 0 ? values[nodeTypeIdx] || 'server' : 'server') as CustomNode['type'], status: (nodeStatusIdx >= 0 ? values[nodeStatusIdx] || 'active' : 'active') as CustomNode['status'] });
        nodeNameSet.add(nodeName.toLowerCase());
      }
      if (source && target) {
        if (!nodeNameSet.has(source.toLowerCase())) { warnings.push(`Row ${i + 1}: Source node "${source}" not found - creating it`); const gridCols = 5; const spacing = 150; nodes.push({ label: source, x: (autoNodeIndex % gridCols) * spacing + 100, y: Math.floor(autoNodeIndex / gridCols) * spacing + 100, type: 'server', status: 'active' }); nodeNameSet.add(source.toLowerCase()); autoNodeIndex++; }
        if (!nodeNameSet.has(target.toLowerCase())) { warnings.push(`Row ${i + 1}: Target node "${target}" not found - creating it`); const gridCols = 5; const spacing = 150; nodes.push({ label: target, x: (autoNodeIndex % gridCols) * spacing + 100, y: Math.floor(autoNodeIndex / gridCols) * spacing + 100, type: 'server', status: 'active' }); nodeNameSet.add(target.toLowerCase()); autoNodeIndex++; }
        links.push({ source, target, label: (linkLabelIdx >= 0 ? values[linkLabelIdx] : '') || undefined, style: ((linkStyleIdx >= 0 ? values[linkStyleIdx] : '') || 'solid') as CustomLink['style'], bandwidth: (bandwidthIdx >= 0 ? values[bandwidthIdx] : '') || undefined, status: 'active' });
      }
    }
    if (nodes.length === 0 && links.length === 0) errors.push('No valid nodes or links found in CSV');
    return { nodes, links, errors, warnings };
  };

  const parseManageCSV = (lines: string[], header: string[], nodeNameSet: Set<string>, warnings: string[], errors: string[]): ParsedData => {
    const nodes: Omit<CustomNode, 'id'>[] = []; const links: Omit<CustomLink, 'id'>[] = [];
    const srcNameIdx = findColumnIndex(header, ['sourcenode', 'source node']);
    const srcIconIdx = findColumnIndex(header, ['sourceicon', 'source icon']);
    const srcXIdx = findColumnIndex(header, ['sourcex', 'source x']);
    const srcYIdx = findColumnIndex(header, ['sourcey', 'source y']);
    const srcIpIdx = findColumnIndex(header, ['sourceip', 'source ip', 'srcip', 'src ip']);
    const srcPortIdx = findColumnIndex(header, ['sourceport', 'source port', 'srcport', 'src port']);
    const srcGroupIdx = findColumnIndex(header, ['sourcegroup', 'source group', 'srcgroup']);
    const srcNloxIdx = findColumnIndex(header, ['sourcenodelabeloffsetx', 'source node label offset x']);
    const srcNloyIdx = findColumnIndex(header, ['sourcenodelabeloffsety', 'source node label offset y']);
    const destNameIdx = findColumnIndex(header, ['destinationnode', 'destination node', 'destnode', 'dest node']);
    const destIconIdx = findColumnIndex(header, ['destinationicon', 'destination icon', 'desticon', 'dest icon']);
    const destXIdx = findColumnIndex(header, ['destx', 'dest x']);
    const destYIdx = findColumnIndex(header, ['desty', 'dest y']);
    const destIpIdx = findColumnIndex(header, ['destip', 'dest ip', 'dstip', 'dst ip', 'destinationip']);
    const destPortIdx = findColumnIndex(header, ['destport', 'dest port', 'dstport', 'dst port', 'destinationport']);
    const destGroupIdx = findColumnIndex(header, ['destgroup', 'dest group', 'destinationgroup', 'destination group']);
    const destNloxIdx = findColumnIndex(header, ['destnodelabeloffsetx', 'dest node label offset x']);
    const destNloyIdx = findColumnIndex(header, ['destnodelabeloffsety', 'dest node label offset y']);
    const linkLabelIdx = findColumnIndex(header, ['linklabel', 'link label']);
    const linkTypeIdx = findColumnIndex(header, ['linktype', 'link type']);
    const showArrowsIdx = findColumnIndex(header, ['showarrows', 'show arrows']);
    const curveOffXIdx = findColumnIndex(header, ['curveoffsetx', 'curve offset x']);
    const curveOffYIdx = findColumnIndex(header, ['curveoffsety', 'curve offset y']);
    const labelOffXIdx = findColumnIndex(header, ['labeloffsetx', 'label offset x']);
    const labelOffYIdx = findColumnIndex(header, ['labeloffsety', 'label offset y']);
    const nodeDataMap = new Map<string, Omit<CustomNode, 'id'>>();

    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]); if (values.every(v => !v)) continue;
      const srcName = srcNameIdx >= 0 ? values[srcNameIdx]?.trim() : '';
      const destName = destNameIdx >= 0 ? values[destNameIdx]?.trim() : '';
      if (!srcName) { warnings.push(`Row ${i + 1}: Missing source name`); continue; }
      const srcIcon = srcIconIdx >= 0 ? values[srcIconIdx]?.trim() || 'server' : 'server';
      const srcX = srcXIdx >= 0 ? parseFloat(values[srcXIdx]) : NaN;
      const srcY = srcYIdx >= 0 ? parseFloat(values[srcYIdx]) : NaN;
      const srcGroup = srcGroupIdx >= 0 ? values[srcGroupIdx]?.trim() || '' : '';
      const srcNlox = srcNloxIdx >= 0 ? parseFloat(values[srcNloxIdx]) : 0;
      const srcNloy = srcNloyIdx >= 0 ? parseFloat(values[srcNloyIdx]) : 0;
      const srcIp = srcIpIdx >= 0 ? values[srcIpIdx]?.trim() || '' : '';
      const srcPortName = srcPortIdx >= 0 ? values[srcPortIdx]?.trim() || '' : '';
      const srcKey = srcName.toLowerCase();
      if (!nodeDataMap.has(srcKey) && !nodeNameSet.has(srcKey)) {
        const autoIdx = nodeDataMap.size + existingNodes.length;
        nodeDataMap.set(srcKey, { label: srcName, x: !isNaN(srcX) ? srcX : (autoIdx % 5) * 150 + 100, y: !isNaN(srcY) ? srcY : Math.floor(autoIdx / 5) * 150 + 100, type: srcIcon.toLowerCase() as CustomNode['type'], status: 'active', group: srcGroup || undefined, nodeLabelOffsetX: srcNlox || undefined, nodeLabelOffsetY: srcNloy || undefined });
      }

      // Handle standalone source node (no destination)
      if (!destName) continue;

      const destIcon = destIconIdx >= 0 ? values[destIconIdx]?.trim() || 'server' : 'server';
      const destX = destXIdx >= 0 ? parseFloat(values[destXIdx]) : NaN;
      const destY = destYIdx >= 0 ? parseFloat(values[destYIdx]) : NaN;
      const destGroup = destGroupIdx >= 0 ? values[destGroupIdx]?.trim() || '' : '';
      const destNlox = destNloxIdx >= 0 ? parseFloat(values[destNloxIdx]) : 0;
      const destNloy = destNloyIdx >= 0 ? parseFloat(values[destNloyIdx]) : 0;
      const destIp = destIpIdx >= 0 ? values[destIpIdx]?.trim() || '' : '';
      const destPortName = destPortIdx >= 0 ? values[destPortIdx]?.trim() || '' : '';
      const destKey = destName.toLowerCase();
      if (!nodeDataMap.has(destKey) && !nodeNameSet.has(destKey)) {
        const autoIdx = nodeDataMap.size + existingNodes.length;
        nodeDataMap.set(destKey, { label: destName, x: !isNaN(destX) ? destX : (autoIdx % 5) * 150 + 100, y: !isNaN(destY) ? destY : Math.floor(autoIdx / 5) * 150 + 100, type: destIcon.toLowerCase() as CustomNode['type'], status: 'active', group: destGroup || undefined, nodeLabelOffsetX: destNlox || undefined, nodeLabelOffsetY: destNloy || undefined });
      }
      const linkLabel = linkLabelIdx >= 0 ? values[linkLabelIdx]?.trim() || '' : '';
      const linkType = linkTypeIdx >= 0 ? values[linkTypeIdx]?.trim() || 'STRAIGHT' : 'STRAIGHT';
      const styleMap: Record<string, string> = { 'STRAIGHT': 'solid', 'DASHED': 'dashed', 'DOTTED': 'dotted', 'CURVED': 'curved' };
      const showArrows = showArrowsIdx >= 0 ? ['true', '1', 'yes'].includes((values[showArrowsIdx] || '').trim().toLowerCase()) : false;
      const curveOX = curveOffXIdx >= 0 ? parseFloat(values[curveOffXIdx]) : 0;
      const curveOY = curveOffYIdx >= 0 ? parseFloat(values[curveOffYIdx]) : 0;
      const labelOX = labelOffXIdx >= 0 ? parseFloat(values[labelOffXIdx]) : 0;
      const labelOY = labelOffYIdx >= 0 ? parseFloat(values[labelOffYIdx]) : 0;
      links.push({ source: srcName, target: destName, label: linkLabel || undefined, style: (styleMap[linkType] || linkType || 'solid') as CustomLink['style'], status: 'active', srcIp: srcIp || undefined, dstIp: destIp || undefined, srcPortName: srcPortName || undefined, dstPortName: destPortName || undefined, curveOffsetX: curveOX || undefined, curveOffsetY: curveOY || undefined, labelOffsetX: labelOX || undefined, labelOffsetY: labelOY || undefined, showArrows });
    }
    nodes.push(...nodeDataMap.values());
    if (nodes.length === 0 && links.length === 0) errors.push('No valid nodes or links found in CSV');
    return { nodes, links, errors, warnings };
  };

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.csv')) { toast.error('Please upload a CSV file'); return; }
    const reader = new FileReader();
    reader.onload = (e) => { setParsedData(parseCSV(e.target?.result as string)); };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!parsedData || parsedData.errors.length > 0) return;
    onImport(parsedData.nodes, parsedData.links); setParsedData(null); onOpenChange(false);
    toast.success(`Imported ${parsedData.nodes.length} nodes and ${parsedData.links.length} links`);
  };

  return (
    <Dialog open={open} onOpenChange={() => { setParsedData(null); onOpenChange(false); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Topology from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file with nodes and links to quickly build your topology.{' '}
            <button onClick={downloadSampleCSV} className="text-primary hover:underline font-medium inline-flex items-center gap-1">
              <Download className="h-3 w-3" />Sample download
            </button>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {!parsedData && (
            <div onDrop={(e) => { e.preventDefault(); setDragActive(false); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }} onDragLeave={() => setDragActive(false)}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200 ${dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50'}`}>
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium mb-1">Drop your CSV file here or click to browse</p>
              <p className="text-xs text-muted-foreground">Supports node_name, node_type, source, target, link_label, link_style, bandwidth</p>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept=".csv" onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); e.target.value = ''; }} className="hidden" />
          {parsedData && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Import Preview</h4>
                <Button variant="ghost" size="sm" onClick={() => setParsedData(null)}><X className="h-4 w-4 mr-1" />Clear</Button>
              </div>
              {parsedData.errors.length > 0 && (<Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription><ul className="list-disc list-inside text-sm">{parsedData.errors.map((err, i) => <li key={i}>{err}</li>)}</ul></AlertDescription></Alert>)}
              {parsedData.warnings.length > 0 && (<Alert><AlertCircle className="h-4 w-4" /><AlertDescription><ScrollArea className="max-h-20"><ul className="list-disc list-inside text-sm">{parsedData.warnings.map((warn, i) => <li key={i}>{warn}</li>)}</ul></ScrollArea></AlertDescription></Alert>)}
              {parsedData.errors.length === 0 && (
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex gap-4"><div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /><span className="text-sm">Ready to import</span></div><Badge variant="secondary">{parsedData.nodes.length} Nodes</Badge><Badge variant="secondary">{parsedData.links.length} Links</Badge></div>
                  <ScrollArea className="h-40 border rounded">
                    <div className="p-2 space-y-2">
                      {parsedData.nodes.length > 0 && (<div><p className="text-xs font-medium text-muted-foreground mb-1">Nodes:</p><div className="flex flex-wrap gap-1">{parsedData.nodes.map((n, i) => <Badge key={i} variant="outline" className="text-xs">{n.label}</Badge>)}</div></div>)}
                      {parsedData.links.length > 0 && (<div><p className="text-xs font-medium text-muted-foreground mb-1">Links:</p><div className="flex flex-wrap gap-1">{parsedData.links.map((l, i) => <Badge key={i} variant="outline" className="text-xs">{l.source} → {l.target}</Badge>)}</div></div>)}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setParsedData(null); onOpenChange(false); }}>Cancel</Button>
          <Button onClick={handleImport} disabled={!parsedData || parsedData.errors.length > 0}><Upload className="h-4 w-4 mr-1" />Import {parsedData ? `(${parsedData.nodes.length + parsedData.links.length} items)` : ''}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
