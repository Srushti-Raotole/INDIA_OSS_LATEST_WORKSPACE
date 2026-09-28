
export interface ApiNode {
  id: string;
  label: string;
  icon: string; 
  x: number;
  y: number;
  nodeLabelOffsetX?: number;
  nodeLabelOffsetY?: number;
  group?: string; 
}

export interface ApiGroupBox {
  id: string;
  name: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export interface ApiLinkSettings {
  showArrows: boolean;
  smartRouting: boolean;
  avoidCrossingNodes: boolean;
  strokeWidth: number;
  curveIntensity: number;
  parallelOffset: number;
}

export interface ApiLink {
  id: string;
  source: string;
  target: string;
  label: string;
  type: string; 
  srcIp?: string;
  dstIp?: string;
  srcPortName?: string;
  dstPortName?: string;
  curveOffsetX?: number;
  curveOffsetY?: number;
  labelOffsetX?: number;
  labelOffsetY?: number;
  settings: ApiLinkSettings;
}

export interface ApiDisplaySettings {
  nodeLabelSize?: number; 
  linkLabelSize?: number; 
  linkDisplayMode?: 'merged' | 'multi';
}

export interface ApiDefaultViewport {
  k: number;  
  x: number;  
  y: number; 
}

export interface ApiTopology {
  id?: number | string;
  name: string;
  client: string;
  vendor: string;
  description?: string;
  monitorEnabled?: boolean;
  nodes: ApiNode[];
  links: ApiLink[];
  groups?: ApiGroupBox[];
  displaySettings?: ApiDisplaySettings;
  defaultViewport?: ApiDefaultViewport;
  traptypes?: string[];
}

export interface ApiAlarm {
  traptype: string;
  TrapSeverity: string;
  vendor?: string;
  parameter1?: string;
  max_rcvd_time?: string;
  topologyId?: string;
  link_id?: string;
  source_label: string;
  target_label: string;
  alarmid?: string;
  client?: string;
  sourceNode?: string;
  sourcePort?: string;
  destNode?: string;
  destPort?: string;
  alarmName: string;
  severity: string; 
}

export interface ApiNodeAlarm {
  node: string;
  alarmName: string;
  severity: string;
}

export interface SavedTopology {
  id: string;
  name: string;
  description: string;
  client?: string;
  vendor?: string;
  topologyType: 'dc-to-dc' | 'node-to-node';
  layoutType: 'force' | 'geo';
  nodes: TopologyNodeData[];
  links: TopologyLinkData[];
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface TopologyNodeData {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'warning' | 'critical' | 'inactive';
  x?: number;
  y?: number;
  icon?: string;
  metadata?: Record<string, any>;
}

export type LinkStyleType = 'solid-green' | 'solid-red' | 'dashed-black' | 'glow-green' | 'glow-red' | 'animated-blue';

export interface TopologyLinkData {
  id: string;
  source: string;
  target: string;
  type: string;
  status: 'active' | 'degraded' | 'down';
  style?: LinkStyleType;
  label?: string;
  bandwidth?: string;
  latency?: string;
  metadata?: Record<string, any>;
}

export const LINK_TYPE_OPTIONS = [
  { value: 'STRAIGHT', label: 'Straight' },
  { value: 'DASHED', label: 'Dashed' },
  { value: 'CURVED', label: 'Curved' },
  { value: 'DOTTED', label: 'Dotted' },
] as const;

export interface AdapterConfig {
  client: string;
  vendor: string;
  topologyType: 'dc-to-dc' | 'node-to-node';
}

export const NODE_TYPE_OPTIONS = [
  { value: 'server', label: 'Server' },
  { value: 'router', label: 'Router' },
  { value: 'switch', label: 'Switch' },
  { value: 'gateway', label: 'Gateway' },
  { value: 'firewall', label: 'Firewall' },
  { value: 'hub', label: 'Hub' },
  { value: 'dc', label: 'Data Center' },
] as const;

export const NODE_STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: 'bg-success' },
  { value: 'warning', label: 'Warning', color: 'bg-warning' },
  { value: 'critical', label: 'Critical', color: 'bg-destructive' },
  { value: 'inactive', label: 'Inactive', color: 'bg-muted' },
] as const;

export const LINK_STATUS_OPTIONS = [
  { value: 'active', label: 'Active', color: 'bg-success' },
  { value: 'degraded', label: 'Degraded', color: 'bg-warning' },
  { value: 'down', label: 'Down', color: 'bg-destructive' },
] as const;

export const LINK_STYLE_OPTIONS = [
  { value: 'solid-green', label: 'Solid Green (Up)', color: '#22c55e' },
  { value: 'solid-red', label: 'Solid Red (Down)', color: '#ef4444' },
  { value: 'dashed-black', label: 'Dashed (Protection)', color: '#6b7280', dashed: true },
  { value: 'glow-green', label: 'Glow Green', color: '#22c55e', glow: true },
  { value: 'glow-red', label: 'Glow Red', color: '#ef4444', glow: true },
  { value: 'animated-blue', label: 'Animated Blue', color: '#3b82f6', animated: true },
] as const;

export interface CSVParseResult {
  nodes: TopologyNodeData[];
  links: TopologyLinkData[];
  errors: string[];
}

export const CLIENT_OPTIONS = [
  { value: 'Google', label: 'Google' },
  { value: 'Microsoft', label: 'Microsoft' },
  { value: 'AWS', label: 'AWS' },
  { value: 'Google -B-5-21', label: 'Google -B-5-21' },
  { value: 'Oracle', label: 'Oracle' },

] as const;

export const VENDOR_OPTIONS = [
  { value: 'TLMR', label: 'TLMR' },
  { value: 'IFNR', label: 'IFNR' },
  { value: 'CONC', label: 'CONC' },
  { value: 'ADVA', label: 'ADVA' },

] as const;
