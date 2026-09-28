
export const TECHNOLOGY_COLORS_HEX: Record<string, string> = {
  CIENA: '#3b82f6',   // Blue
  NOKIA: '#06b6d4',   // Cyan
  UNKNOWN: '#6b7280', // Gray
};

/** HSL colors for charts, dashboards, and UI components */
export const TECHNOLOGY_COLORS_HSL: Record<string, string> = {
  CIENA: 'hsl(217, 91%, 60%)',  // Blue
  NOKIA: 'hsl(187, 78%, 42%)',  // Cyan
};

/** Tailwind class fragments for badges/tags */
export const TECHNOLOGY_BADGE_CLASSES: Record<string, string> = {
  CIENA: 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/30',
  NOKIA: 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30',
};

/** Tailwind toggle-on classes for filter buttons */
export const TECHNOLOGY_TOGGLE_CLASSES: Record<string, string> = {
  CIENA: 'data-[state=on]:bg-blue-500 data-[state=on]:text-white dark:data-[state=on]:bg-blue-600',
  NOKIA: 'data-[state=on]:bg-cyan-600 data-[state=on]:text-white dark:data-[state=on]:bg-cyan-700',
};

/** Get hex color for a technology string (case-insensitive) */
export function getTechnologyColor(technology: string): string {
  return TECHNOLOGY_COLORS_HEX[technology?.toUpperCase()] || TECHNOLOGY_COLORS_HEX.UNKNOWN;
}

// ============================================
// Construction / Status Colors
// ============================================

/** Known status → hex color mapping */
export const STATUS_COLORS_HEX: Record<string, string> = {
  COMPLETED: '#22c55e',          // Green
  'WORK IN PROGRESS': '#f59e0b', // Amber
  WIP: '#f59e0b',                // Amber (alias)
  PROPOSED: '#8b5cf6',           // Violet
  PLANNED: '#3b82f6',            // Blue
  UNDER_REVIEW: '#f97316',       // Orange
  CANCELLED: '#ef4444',          // Red
  ON_HOLD: '#ec4899',            // Pink
};

/** Extra colors for any status not in the map above */
const EXTRA_STATUS_COLORS = [
  '#14b8a6', // Teal
  '#a855f7', // Purple
  '#f43f5e', // Rose
  '#84cc16', // Lime
];

/** Runtime cache for dynamically assigned colors */
const _dynamicStatusColorCache: Record<string, string> = {};
let _nextExtraIdx = 0;

/** Get hex color for a construction/status string (case-insensitive, dynamic) */
export function getStatusColor(status: string): string {
  if (!status) return '#6b7280';
  const key = status.toUpperCase().trim();
  if (STATUS_COLORS_HEX[key]) return STATUS_COLORS_HEX[key];
  if (_dynamicStatusColorCache[key]) return _dynamicStatusColorCache[key];
  const color = EXTRA_STATUS_COLORS[_nextExtraIdx % EXTRA_STATUS_COLORS.length];
  _dynamicStatusColorCache[key] = color;
  _nextExtraIdx++;
  return color;
}

/** Get all unique statuses with their colors from a dataset */
export function getStatusColorMap(statuses: string[]): { status: string; color: string }[] {
  const unique = [...new Set(statuses.map(s => s?.trim()).filter(Boolean))];
  return unique.map(status => ({ status, color: getStatusColor(status) }));
}

// ============================================
// Alarm Color (single — all alarms are red)
// ============================================

export const ALARM_SEVERITY_COLORS: Record<string, string> = {
  ALARM: '#ef4444',
  NORMAL: '#22c55e',
};
