import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Separator } from '../../../components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '../../../components/ui/toggle-group';
import { Check, ChevronsUpDown, UserPlus, Users } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { LinkStyleType as CustomLinkStyle } from '../shared/types';
import { EQUIPMENT_ICON_OPTIONS } from '../utils/nodeIcons';

const ICON_OPTIONS = EQUIPMENT_ICON_OPTIONS;

const LINK_TYPE_OPTIONS: { value: CustomLinkStyle; label: string }[] = [
  { value: 'solid', label: 'Straight' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' },
  { value: 'curved', label: 'Curved' },
  { value: 'step', label: 'Step' },
  { value: 'animated', label: 'Animated' },
  { value: 'glow', label: 'Glow' },
];

interface AddElementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingNodes?: { id: string; label: string }[];
  onAdd: (data: {
    sourceNode: string;
    sourceIcon: string;
    destNode: string;
    destIcon: string;
    linkLabel: string;
    linkType: CustomLinkStyle;
    srcIp?: string;
    dstIp?: string;
    srcPortName?: string;
    dstPortName?: string;
  }) => void;
}

type NodeMode = 'existing' | 'new';

function ExistingNodeSelector({
  value,
  onChange,
  nodes,
  placeholder,
}: {
  value: string;
  onChange: (val: string) => void;
  nodes: { id: string; label: string }[];
  placeholder: string;
}) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return nodes;
    return nodes.filter(n => n.label.toLowerCase().includes(search.toLowerCase()));
  }, [nodes, search]);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <div className="px-2 pb-2">
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search nodes..."
            className="h-8 text-xs"
            onKeyDown={e => e.stopPropagation()}
          />
        </div>
        {filtered.length === 0 && (
          <div className="py-4 text-center text-xs text-muted-foreground">No nodes found</div>
        )}
        {filtered.map(n => (
          <SelectItem key={n.id} value={n.label}>
            <span className="flex items-center gap-2">
              <Check className={cn("h-3 w-3", value === n.label ? "opacity-100" : "opacity-0")} />
              {n.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function NodeInput({
  value,
  onChange,
  mode,
  onModeChange,
  existingNodes,
  placeholder,
  label,
}: {
  value: string;
  onChange: (val: string) => void;
  mode: NodeMode;
  onModeChange: (mode: NodeMode) => void;
  existingNodes: { id: string; label: string }[];
  placeholder: string;
  label: string;
}) {
  const hasExisting = existingNodes.length > 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{label}</Label>
        {hasExisting && (
          <ToggleGroup
            type="single"
            value={mode}
            onValueChange={(v) => {
              if (v) {
                onModeChange(v as NodeMode);
                onChange('');
              }
            }}
            className="h-7"
          >
            <ToggleGroupItem value="existing" className="h-6 px-2 text-[10px] gap-1 data-[state=on]:bg-primary/10 data-[state=on]:text-primary">
              <Users className="h-3 w-3" />
              Existing
            </ToggleGroupItem>
            <ToggleGroupItem value="new" className="h-6 px-2 text-[10px] gap-1 data-[state=on]:bg-primary/10 data-[state=on]:text-primary">
              <UserPlus className="h-3 w-3" />
              New
            </ToggleGroupItem>
          </ToggleGroup>
        )}
      </div>

      {mode === 'existing' && hasExisting ? (
        <ExistingNodeSelector
          value={value}
          onChange={onChange}
          nodes={existingNodes}
          placeholder={placeholder}
        />
      ) : (
        <Input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          onKeyDown={e => e.stopPropagation()}
          onFocus={e => e.stopPropagation()}
        />
      )}
    </div>
  );
}

export function AddElementDialog({ open, onOpenChange, onAdd, existingNodes = [] }: AddElementDialogProps) {
  const [sourceNode, setSourceNode] = useState('');
  const [sourceIcon, setSourceIcon] = useState('datacenter');
  const [sourceMode, setSourceMode] = useState<NodeMode>(existingNodes.length > 0 ? 'existing' : 'new');
  const [destNode, setDestNode] = useState('');
  const [destIcon, setDestIcon] = useState('datacenter');
  const [destMode, setDestMode] = useState<NodeMode>('new');
  const [linkLabel, setLinkLabel] = useState('');
  const [linkType, setLinkType] = useState<CustomLinkStyle>('solid');
  const [srcIp, setSrcIp] = useState('');
  const [dstIp, setDstIp] = useState('');
  const [srcPortName, setSrcPortName] = useState('');
  const [dstPortName, setDstPortName] = useState('');

  const canSubmit = sourceNode.trim() || destNode.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onAdd({
      sourceNode: sourceNode.trim(),
      sourceIcon,
      destNode: destNode.trim(),
      destIcon,
      linkLabel: linkLabel.trim(),
      linkType,
      srcIp: srcIp.trim() || undefined,
      dstIp: dstIp.trim() || undefined,
      srcPortName: srcPortName.trim() || undefined,
      dstPortName: dstPortName.trim() || undefined,
    });
    setSourceNode('');
    setSourceIcon('datacenter');
    setSourceMode(existingNodes.length > 0 ? 'existing' : 'new');
    setDestNode('');
    setDestIcon('datacenter');
    setDestMode('new');
    setLinkLabel('');
    setLinkType('solid');
    setSrcIp('');
    setDstIp('');
    setSrcPortName('');
    setDstPortName('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Connection Element</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Source */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Source</p>
              <div className="grid grid-cols-2 gap-3">
                <NodeInput
                  value={sourceNode}
                  onChange={setSourceNode}
                  mode={sourceMode}
                  onModeChange={setSourceMode}
                  existingNodes={existingNodes}
                  placeholder="e.g. DC1"
                  label="Node Name"
                />
                <div className="space-y-1.5">
                  <Label className="text-xs">Icon</Label>
                  <Select value={sourceIcon} onValueChange={setSourceIcon}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ICON_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <span className="flex items-center gap-2">
                            <img src={opt.imageUrl} alt={opt.label} className="w-4 h-4 object-contain" />
                            <span>{opt.label}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">IP Address</Label>
                  <Input value={srcIp} onChange={e => setSrcIp(e.target.value)} placeholder="e.g. 10.0.0.1" onKeyDown={e => e.stopPropagation()} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Port Name</Label>
                  <Input value={srcPortName} onChange={e => setSrcPortName(e.target.value)} placeholder="e.g. Gi0/0/1" onKeyDown={e => e.stopPropagation()} />
                </div>
              </div>
            </div>

            <Separator />

            {/* Destination */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Destination</p>
              <div className="grid grid-cols-2 gap-3">
                <NodeInput
                  value={destNode}
                  onChange={setDestNode}
                  mode={destMode}
                  onModeChange={setDestMode}
                  existingNodes={existingNodes}
                  placeholder="e.g. DC2"
                  label="Node Name"
                />
                <div className="space-y-1.5">
                  <Label className="text-xs">Icon</Label>
                  <Select value={destIcon} onValueChange={setDestIcon}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ICON_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <span className="flex items-center gap-2">
                            <img src={opt.imageUrl} alt={opt.label} className="w-4 h-4 object-contain" />
                            <span>{opt.label}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">IP Address</Label>
                  <Input value={dstIp} onChange={e => setDstIp(e.target.value)} placeholder="e.g. 10.0.0.2" onKeyDown={e => e.stopPropagation()} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Port Name</Label>
                  <Input value={dstPortName} onChange={e => setDstPortName(e.target.value)} placeholder="e.g. Gi0/0/2" onKeyDown={e => e.stopPropagation()} />
                </div>
              </div>
            </div>

            <Separator />

            {/* Link - only shown when both nodes provided */}
            {sourceNode.trim() && destNode.trim() && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Link</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Link Label</Label>
                    <Input value={linkLabel} onChange={e => setLinkLabel(e.target.value)} placeholder="e.g. 100G" onKeyDown={e => e.stopPropagation()} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Link Type</Label>
                    <Select value={linkType} onValueChange={v => setLinkType(v as CustomLinkStyle)}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LINK_TYPE_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={!canSubmit}>
              {sourceNode.trim() && destNode.trim() ? 'Add Connection' : 'Add Node'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
