export interface CustomNode {
  id: string;
  label: string;
  x: number;
  y: number;
  icon?: string;
  customIcon?: string;
  type?: 'router' | 'switch' | 'server' | 'firewall' | 'cloud' | 'database' | 'datacenter' | 'hub' | 'access-point' | 'load-balancer' | 'storage' | 'custom' | 'ncs';
  status?: 'active' | 'inactive' | 'warning' | 'error';
  metadata?: Record<string, string>;
  size?: number;
  nodeLabelOffsetX?: number;
  nodeLabelOffsetY?: number;
  group?: string; 
}

export interface CustomLink {
  id: string;
  source: string;
  target: string;
  label?: string;
  style: LinkStyleType;
  bandwidth?: string;
  status?: 'active' | 'inactive' | 'degraded';
  metadata?: Record<string, string>;
  color?: string;
  srcIp?: string;
  dstIp?: string;
  srcPortName?: string;
  dstPortName?: string;
  curveOffsetX?: number;
  curveOffsetY?: number;
  labelOffsetX?: number;
  labelOffsetY?: number;
  showArrows?: boolean;
  strokeWidth?: number;
  curveIntensity?: number;
  parallelOffset?: number;
}

export type LinkStyleType = 
  | 'solid'
  | 'dashed'
  | 'dotted'
  | 'curved'
  | 'step'
  | 'animated'
  | 'glow';

/** A visual group box that contains nodes sharing the same group name */
export interface GroupBox {
  id: string;
  name: string;       // Matches CustomNode.group
  label: string;      // Display label on the box
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;      // Background color (hex)
}

export interface CustomTopology {
  id: string;
  name: string;
  description?: string;
  nodes: CustomNode[];
  links: CustomLink[];
  groups?: GroupBox[];  // Group boxes
  createdAt: string;
  updatedAt: string;
  gridEnabled?: boolean;
  snapToGrid?: boolean;
  gridSize?: number;
  viewTemplate?: ViewTemplate;
  vendor?: string;
  client?: string;
  showAnimation?: boolean;
  animationSpeed?: number;
  /** Alarm trap types selected for this topology. */
  traptypes?: string[];
}

export interface CanvasConfig {
  showMinimap: boolean;
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  zoomLevel: number;
  backgroundColor?: string;
}

export type ViewTemplate = 
  | 'free-form'
  | 'star'
  | 'ring'
  | 'mesh'
  | 'tree'
  | 'hierarchical'
  | 'geographic'
  | 'datacenter-rack'
  | 'datacenter-floor';

export interface CustomIconEntry {
  id: string;
  name: string;
  type: 'url' | 'base64';
  data: string;
  createdAt: string;
}

export const GROUP_COLORS = [
  '#3b82f620', // blue
  '#f9731620', // orange
  '#a855f720', // purple
  '#06b6d420', // cyan
  '#eab30820', // yellow
  '#ec489920', // pink
  '#6366f120', // indigo
  '#8b5cf620', // violet
];

export const GROUP_BORDER_COLORS = [
  '#3b82f660',
  '#f9731660',
  '#a855f760',
  '#06b6d460',
  '#eab30860',
  '#ec489960',
  '#6366f160',
  '#8b5cf660',
];

export const GROUP_COLOR_OPTIONS: { value: string; label: string; bg: string; border: string }[] = [
  { value: 'blue', label: 'Blue', bg: '#3b82f620', border: '#3b82f660' },
  { value: 'orange', label: 'Orange', bg: '#f9731620', border: '#f9731660' },
  { value: 'purple', label: 'Purple', bg: '#a855f720', border: '#a855f760' },
  { value: 'cyan', label: 'Cyan', bg: '#06b6d420', border: '#06b6d460' },
  { value: 'yellow', label: 'Yellow', bg: '#eab30820', border: '#eab30860' },
  { value: 'pink', label: 'Pink', bg: '#ec489920', border: '#ec489960' },
  { value: 'indigo', label: 'Indigo', bg: '#6366f120', border: '#6366f160' },
  { value: 'violet', label: 'Violet', bg: '#8b5cf620', border: '#8b5cf660' },
];

export const LINK_STYLE_OPTIONS: { value: LinkStyleType; label: string; description: string }[] = [
  { value: 'solid', label: 'Solid', description: 'Standard solid line' },
  { value: 'dashed', label: 'Dashed', description: 'Dashed line pattern' },
  { value: 'dotted', label: 'Dotted', description: 'Dotted line pattern' },
  { value: 'curved', label: 'Curved', description: 'Bezier curved line' },
  { value: 'step', label: 'Step', description: 'Right-angle step line' },
  { value: 'animated', label: 'Animated', description: 'Animated flow line' },
  { value: 'glow', label: 'Glow', description: 'Glowing effect line' },
];

export const NODE_TYPE_OPTIONS: { value: string; label: string; icon: string }[] = [
  { value: 'router', label: 'Router', icon: '🔀' },
  { value: 'switch', label: 'Switch', icon: '🔌' },
  { value: 'server', label: 'Server', icon: '🖥️' },
  { value: 'firewall', label: 'Firewall', icon: '🛡️' },
  { value: 'cloud', label: 'Cloud', icon: '☁️' },
  { value: 'database', label: 'Database', icon: '💾' },
  { value: 'hub', label: 'Hub', icon: '🔗' },
  { value: 'access-point', label: 'Access Point', icon: '📡' },
  { value: 'load-balancer', label: 'Load Balancer', icon: '⚖️' },
  { value: 'storage', label: 'Storage', icon: '💿' },
  { value: 'custom', label: 'Custom', icon: '⚙️' },
];

export const VIEW_TEMPLATE_OPTIONS: { value: ViewTemplate; label: string; description: string }[] = [
  { value: 'free-form', label: 'Free Form', description: 'Manual positioning' },
  { value: 'star', label: 'Star', description: 'Central hub with spokes' },
  { value: 'ring', label: 'Ring', description: 'Circular arrangement' },
  { value: 'mesh', label: 'Mesh', description: 'Fully connected nodes' },
  { value: 'tree', label: 'Tree', description: 'Hierarchical tree structure' },
  { value: 'hierarchical', label: 'Hierarchical', description: 'Layered hierarchy' },
  { value: 'geographic', label: 'Geographic', description: 'Map-like positioning' },
  { value: 'datacenter-rack', label: 'DC Rack', description: 'Rack mount layout' },
  { value: 'datacenter-floor', label: 'DC Floor', description: 'Floor plan layout' },
];

export const DEFAULT_CANVAS_CONFIG: CanvasConfig = {
  showMinimap: true,
  showGrid: true,
  snapToGrid: true,
  gridSize: 20,
  zoomLevel: 1,
};
