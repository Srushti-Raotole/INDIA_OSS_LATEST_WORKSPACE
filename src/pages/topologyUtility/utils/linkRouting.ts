

import { CustomNode, CustomLink, LinkStyleType } from '../shared/types';

export function getNodeConnectionPoint(
  node: { x: number; y: number },
  target: { x: number; y: number },
  nodeWidth: number = 80,
  nodeHeight: number = 50
): { x: number; y: number } {
  const dx = target.x - node.x;
  const dy = target.y - node.y;
  if (dx === 0 && dy === 0) return { x: node.x, y: node.y };
  const halfWidth = nodeWidth / 2;
  const halfHeight = nodeHeight / 2;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  let scale: number;
  if (absDx * halfHeight > absDy * halfWidth) {
    scale = halfWidth / absDx;
  } else {
    scale = halfHeight / absDy;
  }
  return { x: node.x + dx * scale, y: node.y + dy * scale };
}

export function getParallelLinkOffset(
  link: CustomLink,
  allLinks: CustomLink[],
  baseOffset: number = 20
): number {
  const parallelLinks = allLinks.filter(l =>
    (l.source === link.source && l.target === link.target) ||
    (l.source === link.target && l.target === link.source)
  );
  if (parallelLinks.length <= 1) return 0;
  const index = parallelLinks.findIndex(l => l.id === link.id);
  const midIndex = (parallelLinks.length - 1) / 2;
  return (index - midIndex) * baseOffset;
}

export interface LinkPathOptions {
  sourceNode: CustomNode;
  targetNode: CustomNode;
  style: LinkStyleType;
  offset?: number;
  nodeWidth?: number;
  nodeHeight?: number;
  curvature?: number;
}

export function generateLinkPath(options: LinkPathOptions): string {
  const { sourceNode, targetNode, style, offset = 0, nodeWidth = 80, nodeHeight = 50, curvature = 0.3 } = options;
  const source = getNodeConnectionPoint(sourceNode, targetNode, nodeWidth, nodeHeight);
  const target = getNodeConnectionPoint(targetNode, sourceNode, nodeWidth, nodeHeight);
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return `M ${source.x} ${source.y} L ${target.x} ${target.y}`;
  const perpX = -dy / len;
  const perpY = dx / len;
  const sx = source.x + perpX * offset;
  const sy = source.y + perpY * offset;
  const tx = target.x + perpX * offset;
  const ty = target.y + perpY * offset;

  switch (style) {
    case 'curved': {
      const midX = (sx + tx) / 2;
      const midY = (sy + ty) / 2;
      const ctrlX = midX + perpX * len * curvature;
      const ctrlY = midY + perpY * len * curvature;
      return `M ${sx} ${sy} Q ${ctrlX} ${ctrlY} ${tx} ${ty}`;
    }
    case 'step': {
      const midX = (sx + tx) / 2;
      if (Math.abs(dx) > Math.abs(dy)) {
        return `M ${sx} ${sy} L ${midX} ${sy} L ${midX} ${ty} L ${tx} ${ty}`;
      } else {
        const midY = (sy + ty) / 2;
        return `M ${sx} ${sy} L ${sx} ${midY} L ${tx} ${midY} L ${tx} ${ty}`;
      }
    }
    default: {
      if (offset !== 0) {
        const midX = (sx + tx) / 2 + perpX * Math.abs(offset) * 0.5;
        const midY = (sy + ty) / 2 + perpY * Math.abs(offset) * 0.5;
        return `M ${sx} ${sy} Q ${midX} ${midY} ${tx} ${ty}`;
      }
      return `M ${sx} ${sy} L ${tx} ${ty}`;
    }
  }
}

export function getLinkDashArray(style: LinkStyleType): string {
  switch (style) {
    case 'dashed': return '10,5';
    case 'dotted': return '3,3';
    case 'animated': return '12,6';
    default: return '';
  }
}

export function isAnimatedStyle(style: LinkStyleType): boolean {
  return style === 'animated';
}

export function hasGlowEffect(style: LinkStyleType): boolean {
  return style === 'glow';
}

export function routeLinkAroundNodes(
  source: { x: number; y: number },
  target: { x: number; y: number },
  nodes: CustomNode[],
  excludeIds: string[],
  padding: number = 30
): { x: number; y: number }[] {
  const path = [source];
  const obstacles = nodes.filter(n => !excludeIds.includes(n.id));
  const crossingNode = obstacles.find(n =>
    lineIntersectsRect(source.x, source.y, target.x, target.y, n.x - 50, n.y - 30, n.x + 50, n.y + 30)
  );
  if (crossingNode) {
    const dy = target.y - source.y;
    const goTop = dy > 0;
    const waypointY = goTop ? crossingNode.y - 50 - padding : crossingNode.y + 50 + padding;
    path.push({ x: crossingNode.x, y: waypointY });
  }
  path.push(target);
  return path;
}

function lineIntersectsRect(x1: number, y1: number, x2: number, y2: number, rx1: number, ry1: number, rx2: number, ry2: number): boolean {
  const edges = [[rx1, ry1, rx2, ry1], [rx2, ry1, rx2, ry2], [rx1, ry2, rx2, ry2], [rx1, ry1, rx1, ry2]];
  for (const [ex1, ey1, ex2, ey2] of edges) {
    if (lineSegmentsIntersect(x1, y1, x2, y2, ex1, ey1, ex2, ey2)) return true;
  }
  return false;
}

function lineSegmentsIntersect(x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, x4: number, y4: number): boolean {
  const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
  if (Math.abs(denom) < 0.0001) return false;
  const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
  const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;
  return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
}

export function getArrowMarkerPath(size: number = 8): string {
  return `M 0 0 L ${size} ${size / 2} L 0 ${size} z`;
}
