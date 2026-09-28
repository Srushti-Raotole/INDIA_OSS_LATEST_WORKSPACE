

import * as d3 from 'd3';
import { CustomNode, CustomLink } from '../shared/types';

export type LayoutType = 'force' | 'tree' | 'radial' | 'hierarchical' | 'circular' | 'grid' | 'cluster';

export interface LayoutOptions {
  width: number;
  height: number;
  padding?: number;
  nodeSpacing?: number;
  levelSpacing?: number;
}

function findRootNode(nodes: CustomNode[], links: CustomLink[]): CustomNode | null {
  if (nodes.length === 0) return null;
  const outgoingCount = new Map<string, number>();
  const incomingCount = new Map<string, number>();
  nodes.forEach(n => { outgoingCount.set(n.id, 0); incomingCount.set(n.id, 0); });
  links.forEach(l => {
    outgoingCount.set(l.source, (outgoingCount.get(l.source) || 0) + 1);
    incomingCount.set(l.target, (incomingCount.get(l.target) || 0) + 1);
  });
  let bestNode = nodes[0];
  let bestScore = -Infinity;
  nodes.forEach(n => {
    const score = (outgoingCount.get(n.id) || 0) - (incomingCount.get(n.id) || 0);
    if (score > bestScore) { bestScore = score; bestNode = n; }
  });
  return bestNode;
}

function buildAdjacency(nodes: CustomNode[], links: CustomLink[]): Map<string, string[]> {
  const adj = new Map<string, string[]>();
  nodes.forEach(n => adj.set(n.id, []));
  links.forEach(l => {
    const children = adj.get(l.source) || [];
    if (!children.includes(l.target)) { children.push(l.target); adj.set(l.source, children); }
  });
  return adj;
}

export function circularLayout(nodes: CustomNode[], options: LayoutOptions): CustomNode[] {
  const { width, height, padding = 80 } = options;
  const centerX = width / 2, centerY = height / 2;
  const radius = Math.min(width, height) / 2 - padding;
  return nodes.map((node, i) => {
    const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
    return { ...node, x: centerX + radius * Math.cos(angle), y: centerY + radius * Math.sin(angle) };
  });
}

export function gridLayout(nodes: CustomNode[], options: LayoutOptions): CustomNode[] {
  const { width, height, padding = 100, nodeSpacing = 120 } = options;
  const cols = Math.ceil(Math.sqrt(nodes.length));
  const gridWidth = (cols - 1) * nodeSpacing;
  const gridHeight = (Math.ceil(nodes.length / cols) - 1) * nodeSpacing;
  const startX = (width - gridWidth) / 2, startY = (height - gridHeight) / 2;
  return nodes.map((node, i) => ({
    ...node, x: startX + (i % cols) * nodeSpacing, y: startY + Math.floor(i / cols) * nodeSpacing,
  }));
}

export function hierarchicalLayout(nodes: CustomNode[], links: CustomLink[], options: LayoutOptions): CustomNode[] {
  const { width, height, padding = 80 } = options;
  if (nodes.length === 0) return nodes;
  const root = findRootNode(nodes, links);
  if (!root) return nodes;
  const adj = buildAdjacency(nodes, links);
  const levels = new Map<string, number>();
  const visited = new Set<string>();
  const queue: { id: string; level: number }[] = [{ id: root.id, level: 0 }];
  let maxLevel = 0;
  while (queue.length > 0) {
    const { id, level } = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id); levels.set(id, level); maxLevel = Math.max(maxLevel, level);
    (adj.get(id) || []).forEach(childId => { if (!visited.has(childId)) queue.push({ id: childId, level: level + 1 }); });
  }
  nodes.forEach(n => { if (!levels.has(n.id)) { levels.set(n.id, maxLevel + 1); maxLevel++; } });
  const levelGroups = new Map<number, CustomNode[]>();
  nodes.forEach(n => { const l = levels.get(n.id) || 0; levelGroups.set(l, [...(levelGroups.get(l) || []), n]); });
  const usableHeight = height - padding * 2;
  const ySpacing = maxLevel > 0 ? usableHeight / maxLevel : 0;
  const result: CustomNode[] = [];
  levelGroups.forEach((group, level) => {
    const y = padding + level * ySpacing;
    const xSpacing = (width - padding * 2) / (group.length + 1);
    group.forEach((node, i) => result.push({ ...node, x: padding + (i + 1) * xSpacing, y }));
  });
  return result;
}

export function radialLayout(nodes: CustomNode[], links: CustomLink[], options: LayoutOptions): CustomNode[] {
  const { width, height, padding = 80 } = options;
  if (nodes.length === 0) return nodes;
  const root = findRootNode(nodes, links);
  if (!root) return nodes;
  const centerX = width / 2, centerY = height / 2;
  const maxRadius = Math.min(width, height) / 2 - padding;
  const adj = buildAdjacency(nodes, links);
  const levels = new Map<string, number>();
  const visited = new Set<string>();
  const queue: { id: string; level: number }[] = [{ id: root.id, level: 0 }];
  let maxLevel = 0;
  while (queue.length > 0) {
    const { id, level } = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id); levels.set(id, level); maxLevel = Math.max(maxLevel, level);
    (adj.get(id) || []).forEach(childId => { if (!visited.has(childId)) queue.push({ id: childId, level: level + 1 }); });
  }
  nodes.forEach(n => { if (!levels.has(n.id)) { levels.set(n.id, maxLevel + 1); maxLevel++; } });
  const levelGroups = new Map<number, CustomNode[]>();
  nodes.forEach(n => { const l = levels.get(n.id) || 0; levelGroups.set(l, [...(levelGroups.get(l) || []), n]); });
  const result: CustomNode[] = [];
  const levelRadius = maxLevel > 0 ? maxRadius / maxLevel : 0;
  levelGroups.forEach((group, level) => {
    if (level === 0) { group.forEach(node => result.push({ ...node, x: centerX, y: centerY })); }
    else {
      const radius = level * levelRadius;
      group.forEach((node, i) => {
        const angle = (i * 2 * Math.PI) / group.length - Math.PI / 2;
        result.push({ ...node, x: centerX + radius * Math.cos(angle), y: centerY + radius * Math.sin(angle) });
      });
    }
  });
  return result;
}

export function treeLayout(nodes: CustomNode[], links: CustomLink[], options: LayoutOptions): CustomNode[] {
  const { width, height, padding = 80 } = options;
  if (nodes.length === 0) return nodes;
  const root = findRootNode(nodes, links);
  if (!root) return circularLayout(nodes, options);
  interface HierarchyNode { id: string; children?: HierarchyNode[]; }
  const adj = buildAdjacency(nodes, links);
  const visited = new Set<string>();
  function buildHierarchy(nodeId: string): HierarchyNode {
    visited.add(nodeId);
    const children = (adj.get(nodeId) || []).filter(id => !visited.has(id)).map(id => buildHierarchy(id));
    return { id: nodeId, children: children.length > 0 ? children : undefined };
  }
  const hierarchyData = buildHierarchy(root.id);
  const orphans = nodes.filter(n => !visited.has(n.id));
  if (orphans.length > 0) {
    hierarchyData.children = hierarchyData.children || [];
    orphans.forEach(n => hierarchyData.children!.push({ id: n.id }));
  }
  try {
    const hierarchyRoot = d3.hierarchy(hierarchyData);
    const tree = d3.tree<HierarchyNode>().size([width - padding * 2, height - padding * 2])(hierarchyRoot);
    const nodeMap = new Map<string, { x: number; y: number }>();
    tree.descendants().forEach(d => nodeMap.set(d.data.id, { x: d.x + padding, y: d.y + padding }));
    return nodes.map(node => { const pos = nodeMap.get(node.id); return pos ? { ...node, ...pos } : node; });
  } catch { return circularLayout(nodes, options); }
}

export function clusterLayout(nodes: CustomNode[], links: CustomLink[], options: LayoutOptions): CustomNode[] {
  const { width, height, padding = 80 } = options;
  if (nodes.length === 0) return nodes;
  const root = findRootNode(nodes, links);
  if (!root) return circularLayout(nodes, options);
  interface HierarchyNode { id: string; children?: HierarchyNode[]; }
  const adj = buildAdjacency(nodes, links);
  const visited = new Set<string>();
  function buildHierarchy(nodeId: string): HierarchyNode {
    visited.add(nodeId);
    const children = (adj.get(nodeId) || []).filter(id => !visited.has(id)).map(id => buildHierarchy(id));
    return { id: nodeId, children: children.length > 0 ? children : undefined };
  }
  const hierarchyData = buildHierarchy(root.id);
  const orphans = nodes.filter(n => !visited.has(n.id));
  if (orphans.length > 0) {
    hierarchyData.children = hierarchyData.children || [];
    orphans.forEach(n => hierarchyData.children!.push({ id: n.id }));
  }
  try {
    const hierarchyRoot = d3.hierarchy(hierarchyData);
    const cluster = d3.cluster<HierarchyNode>().size([width - padding * 2, height - padding * 2])(hierarchyRoot);
    const nodeMap = new Map<string, { x: number; y: number }>();
    cluster.descendants().forEach(d => nodeMap.set(d.data.id, { x: d.x + padding, y: d.y + padding }));
    return nodes.map(node => { const pos = nodeMap.get(node.id); return pos ? { ...node, ...pos } : node; });
  } catch { return circularLayout(nodes, options); }
}

export interface ForceLayoutConfig {
  centerStrength: number;
  chargeStrength: number;
  linkDistance: number;
  linkStrength: number;
  collisionRadius: number;
  alphaDecay: number;
  iterations: number;
}

export const DEFAULT_FORCE_CONFIG: ForceLayoutConfig = {
  centerStrength: 0.1, chargeStrength: -400, linkDistance: 120, linkStrength: 0.8,
  collisionRadius: 70, alphaDecay: 0.02, iterations: 300,
};

export function forceLayout(nodes: CustomNode[], links: CustomLink[], options: LayoutOptions, config: Partial<ForceLayoutConfig> = {}): CustomNode[] {
  const { width, height } = options;
  const fullConfig = { ...DEFAULT_FORCE_CONFIG, ...config };
  if (nodes.length === 0) return nodes;
  interface SimNode extends d3.SimulationNodeDatum { id: string; x: number; y: number; }
  const simNodes: SimNode[] = nodes.map(n => ({ id: n.id, x: n.x || width / 2 + (Math.random() - 0.5) * 200, y: n.y || height / 2 + (Math.random() - 0.5) * 200 }));
  const simLinks = links.map(l => ({ source: l.source, target: l.target }));
  const simulation = d3.forceSimulation(simNodes)
    .force('center', d3.forceCenter(width / 2, height / 2).strength(fullConfig.centerStrength))
    .force('charge', d3.forceManyBody().strength(fullConfig.chargeStrength))
    .force('link', d3.forceLink(simLinks).id((d: any) => d.id).distance(fullConfig.linkDistance).strength(fullConfig.linkStrength))
    .force('collision', d3.forceCollide().radius(fullConfig.collisionRadius).strength(1))
    .force('x', d3.forceX(width / 2).strength(0.05))
    .force('y', d3.forceY(height / 2).strength(0.05))
    .alphaDecay(fullConfig.alphaDecay).stop();
  for (let i = 0; i < fullConfig.iterations; i++) simulation.tick();
  const posMap = new Map<string, { x: number; y: number }>();
  simNodes.forEach(n => posMap.set(n.id, { x: n.x!, y: n.y! }));
  return nodes.map(node => { const pos = posMap.get(node.id); return pos ? { ...node, ...pos } : node; });
}

export function applyLayout(type: LayoutType, nodes: CustomNode[], links: CustomLink[], options: LayoutOptions, forceConfig?: Partial<ForceLayoutConfig>): CustomNode[] {
  switch (type) {
    case 'circular': return circularLayout(nodes, options);
    case 'grid': return gridLayout(nodes, options);
    case 'hierarchical': return hierarchicalLayout(nodes, links, options);
    case 'radial': return radialLayout(nodes, links, options);
    case 'tree': return treeLayout(nodes, links, options);
    case 'cluster': return clusterLayout(nodes, links, options);
    case 'force': default: return forceLayout(nodes, links, options, forceConfig);
  }
}
