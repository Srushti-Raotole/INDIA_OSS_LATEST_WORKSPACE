
import * as d3 from 'd3';
import { GROUP_COLORS, GROUP_BORDER_COLORS, type GroupBox } from '../shared/types';
import { parseGroupName, getGroupLabelCoords, getDisplayName } from './groupLabelPosition';

export function renderGroupBoxes(
  container: d3.Selection<SVGGElement, unknown, null, undefined>,
  groups: GroupBox[] | undefined,
) {
  if (!groups || groups.length === 0) return;

  const groupLayer = container.append('g').attr('class', 'group-boxes');

  groups.forEach((group, gIdx) => {
    const gGroup = groupLayer.append('g');

    // Background rect
    gGroup.append('rect')
      .attr('x', group.x).attr('y', group.y)
      .attr('width', group.width).attr('height', group.height)
      .attr('rx', 12).attr('ry', 12)
      .attr('fill', group.color || GROUP_COLORS[gIdx % GROUP_COLORS.length])
      .attr('stroke', GROUP_BORDER_COLORS[gIdx % GROUP_BORDER_COLORS.length])
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '6,3');

    // Label — position based on prefix in group.name
    const { position } = parseGroupName(group.name);
    const displayText = group.label ? getDisplayName(group.label) : getDisplayName(group.name);
    const coords = getGroupLabelCoords(group.x, group.y, group.width, group.height, position);

    gGroup.append('text')
      .attr('x', coords.x).attr('y', coords.y)
      .attr('text-anchor', coords.anchor)
      .attr('font-size', '12px').attr('font-weight', '600')
      .attr('fill', 'hsl(var(--foreground))')
      .attr('opacity', 0.8)
      .text(displayText);
  });
}
