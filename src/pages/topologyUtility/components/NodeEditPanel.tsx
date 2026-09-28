import { useState, useEffect, useMemo } from 'react';
import { X, Trash2, Save, Palette } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover';
import { CustomNode, GroupBox, GROUP_COLOR_OPTIONS } from '../shared/types';
import { EQUIPMENT_ICON_OPTIONS } from '../utils/nodeIcons';
import { parseGroupName, encodeGroupName, getDisplayName, GROUP_LABEL_POSITIONS, type GroupLabelPosition } from '../utils/groupLabelPosition';

interface NodeEditPanelProps {
  node: CustomNode | null;
  allNodes?: CustomNode[];
  groups?: GroupBox[];
  onUpdate: (nodeId: string, updates: Partial<CustomNode>) => void;
  onDelete: (nodeId: string) => void;
  onClose: () => void;
  onGroupChange?: (nodeId: string, groupName: string | undefined, groupColor?: string) => void;
}

const NO_GROUP = '__none__';

export function NodeEditPanel({ node, allNodes = [], groups = [], onUpdate, onDelete, onClose, onGroupChange }: NodeEditPanelProps) {
  const [formData, setFormData] = useState<Partial<CustomNode>>({});
  const [selectedGroupColor, setSelectedGroupColor] = useState<string>('');
  const [labelPosition, setLabelPosition] = useState<GroupLabelPosition>('LT');

  // Derive existing group names from nodes + groups (display names without prefix)
  const existingGroups = useMemo(() => {
    const names = new Set<string>();
    allNodes.forEach(n => { if (n.group) names.add(n.group); });
    groups.forEach(g => names.add(g.name));
    return Array.from(names).sort();
  }, [allNodes, groups]);

  const [newGroupName, setNewGroupName] = useState('');
  const [showNewGroup, setShowNewGroup] = useState(false);

  useEffect(() => {
    if (node) {
      setFormData({ label: node.label, type: node.type, group: node.group });
      const g = groups.find(g => g.name === node.group);
      setSelectedGroupColor(g?.color || '');
      // Parse position from the group name stored in the group box
      if (node.group) {
        const matchingGroup = groups.find(gr => gr.name === node.group);
        const rawName = matchingGroup?.name || node.group;
        const { position } = parseGroupName(rawName);
        setLabelPosition(position);
      } else {
        setLabelPosition('LT');
      }
    }
  }, [node, groups]);

  if (!node) return null;

  const handleSave = () => {
    const groupChanged = formData.group !== node.group;
    // Sync both type AND icon so the API save picks up the change
    onUpdate(node.id, { label: formData.label, type: formData.type, icon: formData.type });
    if (onGroupChange) {
      if (groupChanged || formData.group) {
        // Encode the position prefix into the group name
        const finalGroupName = formData.group ? encodeGroupName(formData.group, labelPosition) : undefined;
        onGroupChange(node.id, finalGroupName, selectedGroupColor || undefined);
      }
    }
  };

  const handleDelete = () => {
    if (confirm('Delete this node? All connected links will also be removed.')) {
      onDelete(node.id);
      onClose();
    }
  };

  const handleGroupSelect = (value: string) => {
    if (value === NO_GROUP) {
      setFormData({ ...formData, group: undefined });
      setSelectedGroupColor('');
    } else {
      setFormData({ ...formData, group: value });
      const g = groups.find(g => g.name === value);
      setSelectedGroupColor(g?.color || '');
      // Parse existing position from that group
      const { position } = parseGroupName(value);
      setLabelPosition(position);
    }
  };

  const handleCreateNewGroup = () => {
    if (!newGroupName.trim()) return;
    const color = selectedGroupColor || GROUP_COLOR_OPTIONS[existingGroups.length % GROUP_COLOR_OPTIONS.length].bg;
    const encodedName = encodeGroupName(newGroupName.trim(), labelPosition);
    setFormData({ ...formData, group: encodedName });
    setSelectedGroupColor(color);
    setShowNewGroup(false);
    setNewGroupName('');
  };

  const handlePositionChange = (pos: GroupLabelPosition) => {
    setLabelPosition(pos);
    // If there's a current group, re-encode its name with new position
    if (formData.group) {
      const cleanName = getDisplayName(formData.group);
      const newEncodedName = encodeGroupName(cleanName, pos);
      setFormData({ ...formData, group: newEncodedName });
    }
  };

  // Display name for current group (strip prefix)
  const currentGroupDisplay = formData.group ? getDisplayName(formData.group) : '';

  return (
    <div className="w-72 border-l border-border bg-card h-full overflow-y-auto">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold text-sm">Edit Node</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
      </div>
      <div className="p-4 space-y-4">
        {/* Name */}
        <div className="space-y-1.5">
          <Label htmlFor="node-label" className="text-xs">Name</Label>
          <Input id="node-label" className="h-8 text-sm" value={formData.label || ''} onChange={(e) => setFormData({ ...formData, label: e.target.value })} onKeyDown={(e) => e.stopPropagation()} onFocus={(e) => e.stopPropagation()} placeholder="Node name" />
        </div>

        {/* Icon Type */}
        <div className="space-y-1.5">
          <Label className="text-xs">Icon Type</Label>
          <Select value={formData.type || 'datacenter'} onValueChange={(value) => setFormData({ ...formData, type: value as CustomNode['type'] })}>
            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {EQUIPMENT_ICON_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  <span className="flex items-center gap-2">
                    <img src={opt.imageUrl} alt={opt.label} className="w-5 h-5 object-contain" />
                    <span>{opt.label}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Group */}
        <div className="space-y-1.5">
          <Label className="text-xs">Group</Label>
          <Select value={formData.group || NO_GROUP} onValueChange={handleGroupSelect}>
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="No group">
                {formData.group ? currentGroupDisplay : 'No Group'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_GROUP}>
                <span className="text-muted-foreground">No Group</span>
              </SelectItem>
              {existingGroups.map(name => {
                const g = groups.find(g => g.name === name);
                return (
                  <SelectItem key={name} value={name}>
                    <span className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded border border-border" style={{ background: g?.color || '#3b82f620' }} />
                      <span>{getDisplayName(name)}</span>
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          {/* Create new group inline */}
          {!showNewGroup ? (
            <Button variant="ghost" size="sm" className="w-full h-7 text-xs text-muted-foreground" onClick={() => setShowNewGroup(true)}>
              + Create New Group
            </Button>
          ) : (
            <div className="flex gap-1.5">
              <Input className="h-7 text-xs flex-1" placeholder="Group name" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter') handleCreateNewGroup(); }} />
              <Button size="sm" className="h-7 text-xs px-2" onClick={handleCreateNewGroup}>Add</Button>
              <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={() => { setShowNewGroup(false); setNewGroupName(''); }}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Group Label Position — only when a group is selected */}
        {formData.group && (
          <div className="space-y-1.5">
            <Label className="text-xs">Label Position</Label>
            <div className="grid grid-cols-2 gap-1.5">
              {GROUP_LABEL_POSITIONS.map(pos => (
                <Button
                  key={pos.value}
                  variant={labelPosition === pos.value ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => handlePositionChange(pos.value)}
                >
                  {pos.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Group Color Picker — only when a group is selected */}
        {formData.group && (
          <div className="space-y-1.5">
            <Label className="text-xs">Group Color</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="w-full h-8 justify-start gap-2 text-xs">
                  <span className="w-4 h-4 rounded border border-border" style={{ background: selectedGroupColor || '#3b82f620' }} />
                  <span>Change Color</span>
                  <Palette className="h-3 w-3 ml-auto text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2" align="start">
                <div className="grid grid-cols-4 gap-1.5">
                  {GROUP_COLOR_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      className={`w-8 h-8 rounded-md border-2 transition-all ${selectedGroupColor === opt.bg ? 'border-primary scale-110' : 'border-transparent hover:border-muted-foreground/40'}`}
                      style={{ background: opt.bg, boxShadow: `inset 0 0 0 1px ${opt.border}` }}
                      title={opt.label}
                      onClick={() => setSelectedGroupColor(opt.bg)}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}

        {/* Position (read-only) */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Position</Label>
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-[10px] text-muted-foreground">X</Label><Input value={Math.round(node.x)} disabled className="bg-muted h-7 text-xs" /></div>
            <div><Label className="text-[10px] text-muted-foreground">Y</Label><Input value={Math.round(node.y)} disabled className="bg-muted h-7 text-xs" /></div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button onClick={handleSave} size="sm" className="flex-1 h-8"><Save className="h-3.5 w-3.5 mr-1" />Save</Button>
          <Button variant="destructive" size="sm" className="h-8" onClick={handleDelete}><Trash2 className="h-3.5 w-3.5" /></Button>
        </div>
      </div>
    </div>
  );
}
