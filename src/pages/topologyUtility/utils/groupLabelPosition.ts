export type GroupLabelPosition = 'LT' | 'LB' | 'RT' | 'RB';

export const GROUP_LABEL_POSITIONS: { value: GroupLabelPosition; label: string }[] = [
  { value: 'LT', label: 'Left Top' },
  { value: 'LB', label: 'Left Bottom' },
  { value: 'RT', label: 'Right Top' },
  { value: 'RB', label: 'Right Bottom' },
];

export function parseGroupName(raw: string): { position: GroupLabelPosition; name: string } {
  const match = raw.match(/^(LT|LB|RT|RB)_(.+)$/);
  if (match) {
    return { position: match[1] as GroupLabelPosition, name: match[2] };
  }
  return { position: 'LT', name: raw };
}

export function encodeGroupName(name: string, position: GroupLabelPosition): string {
  // Strip any existing prefix first
  const { name: cleanName } = parseGroupName(name);
  return `${position}_${cleanName}`;
}

export function getDisplayName(raw: string): string {
  return parseGroupName(raw).name;
}

export function getGroupLabelCoords(
  groupX: number, groupY: number, groupWidth: number, groupHeight: number,
  position: GroupLabelPosition
): { x: number; y: number; anchor: string } {
  const pad = 12;
  switch (position) {
    case 'LT':
      return { x: groupX + pad, y: groupY + 20, anchor: 'start' };
    case 'LB':
      return { x: groupX + pad, y: groupY + groupHeight - 10, anchor: 'start' };
    case 'RT':
      return { x: groupX + groupWidth - pad, y: groupY + 20, anchor: 'end' };
    case 'RB':
      return { x: groupX + groupWidth - pad, y: groupY + groupHeight - 10, anchor: 'end' };
    default:
      return { x: groupX + pad, y: groupY + 20, anchor: 'start' };
  }
}
