import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Save, FileJson, CheckCircle } from 'lucide-react';
import { CLIENT_OPTIONS, VENDOR_OPTIONS } from '../types';

interface SaveToManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    name: string;
    description?: string;
    client?: string;
    vendor?: string;
  }) => void;
  currentName?: string;
  currentDescription?: string;
  currentClient?: string;
  currentVendor?: string;
  nodeCount: number;
  linkCount: number;
  savedSuccessfully?: boolean;
  onGoToManager?: () => void;
  lockIdentity?: boolean;
}

export function SaveToManagerDialog({
  open,
  onOpenChange,
  onSave,
  currentName = '',
  currentDescription = '',
  currentClient = '',
  currentVendor = '',
  nodeCount,
  linkCount,
  savedSuccessfully = false,
  onGoToManager,
  lockIdentity = false,
}: SaveToManagerDialogProps) {
  const [name, setName] = useState(currentName);
  const [description, setDescription] = useState(currentDescription);
  const [client, setClient] = useState(currentClient);
  const [vendor, setVendor] = useState(currentVendor);

  // Reset form when dialog opens
  useEffect(() => {
    if (open && !savedSuccessfully) {
      setName(currentName || 'New Topology');
      setDescription(currentDescription);
      setClient(currentClient || '');
      setVendor(currentVendor || '');
    }
  }, [open, currentName, currentDescription, currentClient, currentVendor, savedSuccessfully]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      client: client || undefined,
      vendor: vendor || undefined,
    });
  };

  if (savedSuccessfully) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-success">
              <CheckCircle className="h-5 w-5" />
              Topology Saved!
            </DialogTitle>
            <DialogDescription>
              Your topology has been saved to the management list.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex gap-4 p-3 bg-success/10 border border-success/30 rounded-lg">
              <div className="flex items-center gap-2">
                <FileJson className="h-4 w-4 text-success" />
                <span className="text-sm font-medium">
                  {name} • {nodeCount} Nodes, {linkCount} Links
                </span>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Continue Editing
            </Button>
            <Button onClick={onGoToManager}>
              Go to Manage Topologies
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Save Topology
          </DialogTitle>
          <DialogDescription className="sr-only">Save topology dialog</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Summary */}
            <div className="flex gap-4 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <FileJson className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {nodeCount} Nodes, {linkCount} Links
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="topology-name">Topology Name *</Label>
              <Input
                id="topology-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter topology name"
                autoFocus
                disabled={lockIdentity}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="topology-description">Description</Label>
              <textarea
                id="topology-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description — shown on the Monitor page"
                rows={2}
                className="w-full text-sm rounded-md border border-input bg-background px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vendor *</Label>
                <Select value={vendor} onValueChange={setVendor} disabled={lockIdentity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    {VENDOR_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Client *</Label>
                <Select value={client} onValueChange={setClient} disabled={lockIdentity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLIENT_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground border-l-2 border-primary/40 pl-2">
              Trap-type monitoring is now configured per link via the <span className="font-semibold">Alarm Config</span> button on the toolbar.
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || !client || !vendor}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
