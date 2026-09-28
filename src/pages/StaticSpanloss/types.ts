export interface SpanLossRow {
  spanId: string;
  deviceNameA: string;
  portA: string;
  deviceNameB: string;
  portB: string;
  designLoss: number | null;
  spanMargin: number | null;
  designEol: number | null;
  fiberDistance: number | null;
  vendor: string;
  client: string;
}

export const EDITABLE_FIELDS = ['designLoss', 'spanMargin', 'designEol', 'fiberDistance'] as const;
export type EditableField = (typeof EDITABLE_FIELDS)[number];
