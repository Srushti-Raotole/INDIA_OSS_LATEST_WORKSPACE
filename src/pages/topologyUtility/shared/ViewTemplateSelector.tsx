import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { ViewTemplate, VIEW_TEMPLATE_OPTIONS, CustomNode } from './types';
import { LayoutGrid, Network, Circle, Share2, GitBranch, Layers, Map, Server, Building } from 'lucide-react';

interface ViewTemplateSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTemplate: (template: ViewTemplate) => void;
  nodeCount: number;
}

const getTemplateIcon = (template: ViewTemplate) => {
  switch (template) {
    case 'free-form': return LayoutGrid;
    case 'star': return Network;
    case 'ring': return Circle;
    case 'mesh': return Share2;
    case 'tree': return GitBranch;
    case 'hierarchical': return Layers;
    case 'geographic': return Map;
    case 'datacenter-rack': return Server;
    case 'datacenter-floor': return Building;
    default: return LayoutGrid;
  }
};

export function calculateLayoutPositions(
  nodes: CustomNode[],
  template: ViewTemplate,
  canvasWidth: number = 800,
  canvasHeight: number = 600
): CustomNode[] {
  if (nodes.length === 0) return nodes;

  const centerX = canvasWidth / 2;
  const centerY = canvasHeight / 2;
  const padding = 80;

  switch (template) {
    case 'star': {
      const radius = Math.min(canvasWidth, canvasHeight) / 2 - padding;
      return nodes.map((node, i) => {
        if (i === 0) return { ...node, x: centerX, y: centerY };
        const angle = ((i - 1) / (nodes.length - 1)) * 2 * Math.PI - Math.PI / 2;
        return { ...node, x: centerX + radius * 0.8 * Math.cos(angle), y: centerY + radius * 0.8 * Math.sin(angle) };
      });
    }
    case 'ring': {
      const radius = Math.min(canvasWidth, canvasHeight) / 2 - padding;
      return nodes.map((node, i) => {
        const angle = (i / nodes.length) * 2 * Math.PI - Math.PI / 2;
        return { ...node, x: centerX + radius * 0.8 * Math.cos(angle), y: centerY + radius * 0.8 * Math.sin(angle) };
      });
    }
    case 'mesh': {
      const cols = Math.ceil(Math.sqrt(nodes.length));
      const rows = Math.ceil(nodes.length / cols);
      const cellWidth = (canvasWidth - 2 * padding) / cols;
      const cellHeight = (canvasHeight - 2 * padding) / rows;
      return nodes.map((node, i) => ({
        ...node,
        x: padding + cellWidth / 2 + (i % cols) * cellWidth,
        y: padding + cellHeight / 2 + Math.floor(i / cols) * cellHeight,
      }));
    }
    case 'tree': {
      const levelHeight = (canvasHeight - 2 * padding) / Math.ceil(Math.log2(nodes.length + 1));
      return nodes.map((node, i) => {
        let level = 0, sumBefore = 0;
        while (sumBefore + Math.pow(2, level) <= i) { sumBefore += Math.pow(2, level); level++; }
        const posInLevel = i - sumBefore;
        const nodesInLevel = Math.pow(2, level);
        const spacing = (canvasWidth - 2 * padding) / (nodesInLevel + 1);
        return { ...node, x: padding + spacing * (posInLevel + 1), y: padding + level * levelHeight + levelHeight / 2 };
      });
    }
    case 'hierarchical': {
      const nodesPerLayer = Math.ceil(nodes.length / 4);
      return nodes.map((node, i) => {
        const layer = Math.floor(i / nodesPerLayer);
        const posInLayer = i % nodesPerLayer;
        const layerHeight = (canvasHeight - 2 * padding) / 4;
        const actualNodesInLayer = Math.min(nodesPerLayer, nodes.length - layer * nodesPerLayer);
        const spacing = (canvasWidth - 2 * padding) / (actualNodesInLayer + 1);
        return { ...node, x: padding + spacing * (posInLayer + 1), y: padding + layer * layerHeight + layerHeight / 2 };
      });
    }
    case 'geographic': {
      const cols = Math.ceil(Math.sqrt(nodes.length * 1.5));
      const rows = Math.ceil(nodes.length / cols);
      const cellWidth = (canvasWidth - 2 * padding) / cols;
      const cellHeight = (canvasHeight - 2 * padding) / rows;
      return nodes.map((node, i) => ({
        ...node,
        x: padding + cellWidth / 2 + (i % cols) * cellWidth + (Math.random() - 0.5) * cellWidth * 0.3,
        y: padding + cellHeight / 2 + Math.floor(i / cols) * cellHeight + (Math.random() - 0.5) * cellHeight * 0.3,
      }));
    }
    case 'datacenter-rack': {
      const rackWidth = 120, rackHeight = 40;
      const racksPerRow = Math.floor((canvasWidth - 2 * padding) / (rackWidth + 20));
      return nodes.map((node, i) => ({
        ...node,
        x: padding + (i % racksPerRow) * (rackWidth + 20) + rackWidth / 2,
        y: padding + Math.floor(i / racksPerRow) * (rackHeight + 10) + rackHeight / 2,
      }));
    }
    case 'datacenter-floor': {
      const pods = 4, nodesPerPod = Math.ceil(nodes.length / pods);
      const podWidth = (canvasWidth - 3 * padding) / 2;
      const podHeight = (canvasHeight - 3 * padding) / 2;
      return nodes.map((node, i) => {
        const pod = Math.floor(i / nodesPerPod), posInPod = i % nodesPerPod;
        const nodesInThisPod = Math.min(nodesPerPod, nodes.length - pod * nodesPerPod);
        const cols = Math.ceil(Math.sqrt(nodesInThisPod));
        const rows = Math.ceil(nodesInThisPod / cols);
        const cellWidth = podWidth / (cols + 1), cellHeight = podHeight / (rows + 1);
        return {
          ...node,
          x: padding + (pod % 2) * (podWidth + padding) + cellWidth * ((posInPod % cols) + 1),
          y: padding + Math.floor(pod / 2) * (podHeight + padding) + cellHeight * (Math.floor(posInPod / cols) + 1),
        };
      });
    }
    case 'free-form':
    default:
      return nodes;
  }
}

export function ViewTemplateSelector({ open, onOpenChange, onSelectTemplate, nodeCount }: ViewTemplateSelectorProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Select Layout Template</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-4 py-4">
          {VIEW_TEMPLATE_OPTIONS.map((template) => {
            const Icon = getTemplateIcon(template.value);
            return (
              <Card key={template.value} className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => { onSelectTemplate(template.value); onOpenChange(false); }}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><Icon className="h-4 w-4" />{template.label}</CardTitle>
                </CardHeader>
                <CardContent><CardDescription className="text-xs">{template.description}</CardDescription></CardContent>
              </Card>
            );
          })}
        </div>
        <p className="text-sm text-muted-foreground text-center">
          {nodeCount} nodes will be arranged according to the selected template
        </p>
      </DialogContent>
    </Dialog>
  );
}
