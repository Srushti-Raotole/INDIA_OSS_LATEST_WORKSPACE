
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Slider } from '../../../components/ui/slider';
import { Label } from '../../../components/ui/label';
import { Progress } from '../../../components/ui/progress';
import { Badge } from '../../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Play, Square, RotateCcw, Circle, GitBranch, Target, TreePine, Grid3X3, Atom, Workflow } from 'lucide-react';
import { LayoutType, ForceLayoutConfig, DEFAULT_FORCE_CONFIG } from '../utils/layoutAlgorithms';

interface LayoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyLayout: (type: LayoutType, forceConfig?: Partial<ForceLayoutConfig>) => void;
  isRunning?: boolean;
  progress?: number;
  nodeCount: number;
}

const LAYOUT_OPTIONS: { type: LayoutType; label: string; icon: React.ReactNode; description: string }[] = [
  { type: 'force', label: 'Force', icon: <Atom className="w-5 h-5" />, description: 'Physics simulation with collision detection' },
  { type: 'circular', label: 'Circular', icon: <Circle className="w-5 h-5" />, description: 'Nodes arranged in a circle' },
  { type: 'grid', label: 'Grid', icon: <Grid3X3 className="w-5 h-5" />, description: 'Evenly spaced grid layout' },
  { type: 'hierarchical', label: 'Hierarchical', icon: <GitBranch className="w-5 h-5" />, description: 'Top-down layered structure' },
  { type: 'radial', label: 'Radial', icon: <Target className="w-5 h-5" />, description: 'Expanding from center outward' },
  { type: 'tree', label: 'Tree', icon: <TreePine className="w-5 h-5" />, description: 'D3 tree hierarchy layout' },
  { type: 'cluster', label: 'Cluster', icon: <Workflow className="w-5 h-5" />, description: 'Leaves aligned at same level' },
];

export function LayoutDialog({ open, onOpenChange, onApplyLayout, isRunning = false, progress = 0, nodeCount }: LayoutDialogProps) {
  const [selectedLayout, setSelectedLayout] = useState<LayoutType>('force');
  const [forceConfig, setForceConfig] = useState<ForceLayoutConfig>(DEFAULT_FORCE_CONFIG);
  const handleConfigChange = (key: keyof ForceLayoutConfig, value: number) => setForceConfig(prev => ({ ...prev, [key]: value }));
  const handleApply = () => onApplyLayout(selectedLayout, selectedLayout === 'force' ? forceConfig : undefined);
  const handleReset = () => setForceConfig(DEFAULT_FORCE_CONFIG);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">Auto Layout<Badge variant="secondary">{nodeCount} nodes</Badge></DialogTitle>
          <DialogDescription>Choose a layout algorithm to automatically arrange nodes</DialogDescription>
        </DialogHeader>
        <Tabs value={selectedLayout} onValueChange={(v) => setSelectedLayout(v as LayoutType)}>
          <TabsList className="grid grid-cols-4 gap-1 h-auto p-1">
            {LAYOUT_OPTIONS.slice(0, 4).map(opt => (
              <TabsTrigger key={opt.type} value={opt.type} className="flex flex-col gap-1 py-2 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                {opt.icon}<span className="text-xs">{opt.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          <TabsList className="grid grid-cols-3 gap-1 h-auto p-1 mt-1">
            {LAYOUT_OPTIONS.slice(4).map(opt => (
              <TabsTrigger key={opt.type} value={opt.type} className="flex flex-col gap-1 py-2 px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                {opt.icon}<span className="text-xs">{opt.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">{LAYOUT_OPTIONS.find(o => o.type === selectedLayout)?.description}</p>
          </div>
          <TabsContent value="force" className="mt-4 space-y-4">
            <div className="space-y-4">
              <div className="space-y-2"><div className="flex justify-between"><Label className="text-sm">Repulsion Strength</Label><span className="text-xs text-muted-foreground">{Math.abs(forceConfig.chargeStrength)}</span></div><Slider value={[Math.abs(forceConfig.chargeStrength)]} onValueChange={([v]) => handleConfigChange('chargeStrength', -v)} min={100} max={1000} step={50} disabled={isRunning} /></div>
              <div className="space-y-2"><div className="flex justify-between"><Label className="text-sm">Link Distance</Label><span className="text-xs text-muted-foreground">{forceConfig.linkDistance}px</span></div><Slider value={[forceConfig.linkDistance]} onValueChange={([v]) => handleConfigChange('linkDistance', v)} min={50} max={300} step={10} disabled={isRunning} /></div>
              <div className="space-y-2"><div className="flex justify-between"><Label className="text-sm">Collision Radius</Label><span className="text-xs text-muted-foreground">{forceConfig.collisionRadius}px</span></div><Slider value={[forceConfig.collisionRadius]} onValueChange={([v]) => handleConfigChange('collisionRadius', v)} min={30} max={150} step={10} disabled={isRunning} /></div>
              <div className="space-y-2"><div className="flex justify-between"><Label className="text-sm">Iterations</Label><span className="text-xs text-muted-foreground">{forceConfig.iterations}</span></div><Slider value={[forceConfig.iterations]} onValueChange={([v]) => handleConfigChange('iterations', v)} min={100} max={500} step={50} disabled={isRunning} /></div>
            </div>
          </TabsContent>
        </Tabs>
        {isRunning && (<div className="space-y-2"><div className="flex justify-between text-sm"><span className="text-muted-foreground">Calculating layout...</span><span className="font-medium">{progress}%</span></div><Progress value={progress} className="h-2" /></div>)}
        <div className="flex gap-2 pt-2">
          {selectedLayout === 'force' && (<Button variant="outline" onClick={handleReset} disabled={isRunning} size="sm"><RotateCcw className="w-4 h-4 mr-1" />Reset</Button>)}
          <div className="flex-1" />
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isRunning}>Cancel</Button>
          <Button onClick={handleApply} disabled={isRunning || nodeCount === 0}>{isRunning ? (<><Square className="w-4 h-4 mr-2" />Stop</>) : (<><Play className="w-4 h-4 mr-2" />Apply Layout</>)}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
