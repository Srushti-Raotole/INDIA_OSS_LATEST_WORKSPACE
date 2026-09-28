import type { SpanLossVendor } from '../services/spanLossApi';


export const VENDOR_COLORS: Record<string, string> = {
  MCP: '#009688',
  NFMT: '#8283eb',
  EPNM: '#4CAF50',
  CONC: '#FF9800',
  ADVA: '#9C27B0',
  IFNR: '#3F51B5',
  TLMR: '#E91E63',
};

const FALLBACK_PALETTE = [
  '#0EA5E9', '#22C55E', '#A855F7', '#F43F5E', '#EAB308',
  '#14B8A6', '#F97316', '#6366F1', '#84CC16', '#EC4899',
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export const DEFAULT_VENDOR_COLOR = '#607D8B';

export function getVendorColor(vendor: SpanLossVendor | string): string {
  if (VENDOR_COLORS[vendor]) return VENDOR_COLORS[vendor];
  if (!vendor) return DEFAULT_VENDOR_COLOR;
  return FALLBACK_PALETTE[hashString(String(vendor)) % FALLBACK_PALETTE.length];
}
