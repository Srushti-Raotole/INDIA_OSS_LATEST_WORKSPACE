
import * as d3 from 'd3';

import routerIcon from '../../topologyUtility/assets/icons/router.png';
import datacenterIcon from '../../topologyUtility/assets/icons/Data Center.png';
import g30 from '../../topologyUtility/assets/icons/G30.png';
import g42 from '../../topologyUtility/assets/icons/G42.png';
import md32 from '../../topologyUtility/assets/icons/MD32.png';
import ncs1014 from '../../topologyUtility/assets/icons/NCS1014.png';


export const ICON_REGISTRY: {
  value: string;
  label: string;
  url: string;
  size: number;
}[] = [
  { value: 'router',     label: 'Router',         url: routerIcon,     size: 60 },
  { value: 'datacenter', label: 'Data Center',     url: datacenterIcon, size: 60 },
  { value: 'md32',        label: 'MD 32',   url: md32,        size: 75 },
  { value: 'ncs1014',     label: 'NCS 1014',          url: ncs1014,     size: 75 },
  { value: 'g30',     label: 'G 30',          url: g30,     size: 60 },
  { value: 'g42',     label: 'G 42',          url: g42,     size: 60 },
];

export type EquipmentIconType = string;

export function getIconImageUrl(iconType: string): string {
  const entry = ICON_REGISTRY.find(i => i.value === iconType);
  return entry?.url || datacenterIcon;
}

export function resolveIconType(icon?: string): string {
  if (!icon) return 'datacenter';
  const lower = icon.toLowerCase().replace(/[-_\s]/g, '');
  const entry = ICON_REGISTRY.find(i => i.value === lower);
  return entry?.value || 'datacenter';
}

export function getIconSize(iconType: string): number {
  const entry = ICON_REGISTRY.find(i => i.value === iconType);
  return entry?.size || 48;
}

/** Dropdown options — derived from registry */
export const EQUIPMENT_ICON_OPTIONS = ICON_REGISTRY.map(entry => ({
  value: entry.value,
  label: entry.label,
  color: '#3b82f6', // kept for backwards compat
  imageUrl: entry.url,
  size: entry.size,
}));

/**
 * Render an image-based equipment icon into a D3 <g> selection.
 * The icon is centered at (0, 0).
 */
export function renderEquipmentIcon(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  iconType: string,
  options?: {
    isDark?: boolean;
    isAlarmed?: boolean;
    isSelected?: boolean;
    size?: number;
  }
) {
  const { isAlarmed = false, size = 1 } = options || {};
  const baseSize = getIconSize(iconType);
  const imgSize = baseSize * size;
  const url = getIconImageUrl(iconType);

  g.append('image')
    .attr('href', url)
    .attr('x', -imgSize / 2)
    .attr('y', -imgSize / 2)
    .attr('width', imgSize)
    .attr('height', imgSize)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  // Alarm indicator ring
  if (isAlarmed) {
    g.append('circle')
      .attr('cx', 0).attr('cy', 0).attr('r', imgSize / 2 + 4)
      .attr('fill', 'none').attr('stroke', '#ef4444').attr('stroke-width', 2.5)
      .attr('stroke-dasharray', '4,3');
  }
}

/** Get approximate bounding size for icon */
export function getIconBounds(iconType: string): { width: number; height: number } {
  const s = getIconSize(iconType);
  return { width: s, height: s };
}
