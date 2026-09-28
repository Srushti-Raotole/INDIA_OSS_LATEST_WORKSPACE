import { useState, useEffect } from 'react';
import { X, Trash2, Save, ArrowRight } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Badge } from '../../../components/ui/badge';
import { CustomLink, LINK_STYLE_OPTIONS, LinkStyleType } from '../shared/types';

interface LinkEditPanelProps {
  link: CustomLink | null;
  onUpdate: (linkId: string, updates: Partial<CustomLink>) => void;
  onDelete: (linkId: string) => void;
  onClose: () => void;
  getNodeLabel?: (nodeId: string) => string;
}

export function LinkEditPanel({ link, onUpdate, onDelete, onClose, getNodeLabel }: LinkEditPanelProps) {
  const [formData, setFormData] = useState<Partial<CustomLink>>({});
  useEffect(() => { if (link) setFormData({ label: link.label, style: link.style, srcIp: link.srcIp, dstIp: link.dstIp, srcPortName: link.srcPortName, dstPortName: link.dstPortName }); }, [link]);
  if (!link) return null;
  const handleSave = () => onUpdate(link.id, formData);
  const handleDelete = () => { if (confirm('Delete this link?')) { onDelete(link.id); onClose(); } };
  const srcLabel = getNodeLabel ? getNodeLabel(link.source) : link.source;
  const dstLabel = getNodeLabel ? getNodeLabel(link.target) : link.target;

  return (
    <div className="w-72 border-l border-border bg-card h-full overflow-y-auto">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold">Edit Link</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
      </div>
      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <Label>Connection</Label>
          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border">
            <Badge variant="outline" className="text-xs font-medium">{srcLabel}</Badge>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <Badge variant="outline" className="text-xs font-medium">{dstLabel}</Badge>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="link-label">Label</Label>
          <Input id="link-label" value={formData.label || ''} onChange={(e) => setFormData({ ...formData, label: e.target.value })} placeholder="Link label" />
        </div>
        <div className="space-y-2">
          <Label>Style</Label>
          <Select value={formData.style || 'solid'} onValueChange={(value) => setFormData({ ...formData, style: value as LinkStyleType })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{LINK_STYLE_OPTIONS.map((opt) => (<SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>))}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Source Port</Label>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1"><Label className="text-xs text-muted-foreground">IP</Label><Input value={formData.srcIp || ''} onChange={(e) => setFormData({ ...formData, srcIp: e.target.value })} placeholder="e.g. 10.0.0.1" className="h-8 text-xs" /></div>
            <div className="space-y-1"><Label className="text-xs text-muted-foreground">Port</Label><Input value={formData.srcPortName || ''} onChange={(e) => setFormData({ ...formData, srcPortName: e.target.value })} placeholder="e.g. Gi0/0/1" className="h-8 text-xs" /></div>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Destination Port</Label>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1"><Label className="text-xs text-muted-foreground">IP</Label><Input value={formData.dstIp || ''} onChange={(e) => setFormData({ ...formData, dstIp: e.target.value })} placeholder="e.g. 10.0.0.2" className="h-8 text-xs" /></div>
            <div className="space-y-1"><Label className="text-xs text-muted-foreground">Port</Label><Input value={formData.dstPortName || ''} onChange={(e) => setFormData({ ...formData, dstPortName: e.target.value })} placeholder="e.g. Gi0/0/2" className="h-8 text-xs" /></div>
          </div>
        </div>
        <div className="flex gap-2 pt-4">
          <Button onClick={handleSave} className="flex-1"><Save className="h-4 w-4 mr-1" />Save</Button>
          <Button variant="destructive" onClick={handleDelete}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </div>
    </div>
  );
}
