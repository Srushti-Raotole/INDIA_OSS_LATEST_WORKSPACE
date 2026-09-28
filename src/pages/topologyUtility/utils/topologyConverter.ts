
import { SavedTopology, TopologyNodeData, TopologyLinkData, LinkStyleType as TopoLinkStyle } from '../types';
import { CustomTopology, CustomNode, CustomLink, LinkStyleType as CustomLinkStyle } from '../shared/types';

export function customToSavedTopology(custom: CustomTopology): SavedTopology {
  const nodes: TopologyNodeData[] = custom.nodes.map(node => ({
    id: node.id,
    name: node.label,
    type: node.type || 'server',
    status: mapCustomStatusToSaved(node.status),
    x: node.x,
    y: node.y,
    icon: node.icon || node.type,
    metadata: node.metadata as Record<string, any>,
  }));

  const links: TopologyLinkData[] = custom.links.map(link => ({
    id: link.id,
    source: link.source,
    target: link.target,
    type: 'fiber',
    status: mapCustomLinkStatusToSaved(link.status),
    style: mapCustomStyleToSaved(link.style),
    label: link.label,
    bandwidth: link.bandwidth,
    metadata: link.metadata as Record<string, any>,
  }));

  return {
    id: custom.id,
    name: custom.name,
    description: custom.description || '',
    topologyType: 'node-to-node',
    layoutType: 'force',
    nodes,
    links,
    status: 'active',
    createdAt: custom.createdAt,
    updatedAt: custom.updatedAt,
  };
}

// Convert SavedTopology (Management) → CustomTopology (D3 Builder)
export function savedToCustomTopology(saved: SavedTopology): CustomTopology {
  const nodes: CustomNode[] = saved.nodes.map(node => ({
    id: node.id,
    label: node.name,
    x: node.x ?? Math.random() * 600 + 100,
    y: node.y ?? Math.random() * 400 + 100,
    type: mapSavedTypeToCustom(node.type),
    status: mapSavedStatusToCustom(node.status),
    icon: node.icon,
    metadata: node.metadata as Record<string, string>,
  }));

  const links: CustomLink[] = saved.links.map(link => ({
    id: link.id,
    source: link.source,
    target: link.target,
    label: link.label,
    style: mapSavedStyleToCustom(link.style),
    bandwidth: link.bandwidth,
    status: mapSavedLinkStatusToCustom(link.status),
    metadata: link.metadata as Record<string, string>,
  }));

  return {
    id: saved.id,
    name: saved.name,
    description: saved.description,
    nodes,
    links,
    createdAt: saved.createdAt,
    updatedAt: saved.updatedAt,
  };
}

// Status mapping helpers
function mapCustomStatusToSaved(status?: string): 'active' | 'warning' | 'critical' | 'inactive' {
  switch (status) {
    case 'active': return 'active';
    case 'warning': return 'warning';
    case 'error': return 'critical';
    case 'inactive': return 'inactive';
    default: return 'active';
  }
}

function mapSavedStatusToCustom(status: string): 'active' | 'inactive' | 'warning' | 'error' {
  switch (status) {
    case 'active': return 'active';
    case 'warning': return 'warning';
    case 'critical': return 'error';
    case 'inactive': return 'inactive';
    default: return 'active';
  }
}

function mapCustomLinkStatusToSaved(status?: string): 'active' | 'degraded' | 'down' {
  switch (status) {
    case 'active': return 'active';
    case 'degraded': return 'degraded';
    case 'inactive': return 'down';
    default: return 'active';
  }
}

function mapSavedLinkStatusToCustom(status: string): 'active' | 'inactive' | 'degraded' {
  switch (status) {
    case 'active': return 'active';
    case 'degraded': return 'degraded';
    case 'down': return 'inactive';
    default: return 'active';
  }
}

// Style mapping helpers
function mapCustomStyleToSaved(style: CustomLinkStyle): TopoLinkStyle {
  switch (style) {
    case 'solid': return 'solid-green';
    case 'dashed': return 'dashed-black';
    case 'glow': return 'glow-green';
    case 'animated': return 'animated-blue';
    default: return 'solid-green';
  }
}

function mapSavedStyleToCustom(style?: TopoLinkStyle): CustomLinkStyle {
  if (!style) return 'solid';
  if (style.includes('dashed')) return 'dashed';
  if (style.includes('glow')) return 'glow';
  if (style.includes('animated')) return 'animated';
  return 'solid';
}

// Type mapping helpers
function mapSavedTypeToCustom(type: string): CustomNode['type'] {
  const validTypes = ['router', 'switch', 'server', 'firewall', 'cloud', 'database', 'datacenter', 'ncs', 'hub', 'access-point', 'load-balancer', 'storage', 'custom'];
  if (validTypes.includes(type)) {
    return type as CustomNode['type'];
  }
  return 'datacenter';
}
