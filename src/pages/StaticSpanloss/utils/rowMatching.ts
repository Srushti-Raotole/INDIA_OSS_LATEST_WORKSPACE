import type { SpanLossRow } from '../types';


export function rowMatchKey(r: Partial<SpanLossRow>): string {
  const norm = (v: unknown) => (v == null ? '' : String(v).trim().toLowerCase());
  return [
    norm(r.spanId),
    norm(r.deviceNameA),
    norm(r.portA),
    norm(r.deviceNameB),
    norm(r.portB),
  ].join('||');
}

const NUMERIC_FIELDS: (keyof SpanLossRow)[] = [
  'designLoss',
  'spanMargin',
  'designEol',
  'fiberDistance',
];

/** True when the editable numeric fields are all equal (null-aware). */
export function rowsHaveSameValues(a: SpanLossRow, b: SpanLossRow): boolean {
  return NUMERIC_FIELDS.every((f) => {
    const av = a[f];
    const bv = b[f];
    if (av == null && bv == null) return true;
    if (av == null || bv == null) return false;
    return Number(av) === Number(bv);
  });
}

export interface DuplicateAnalysis {
  /** Rows whose key already exists in the table AND values are identical. */
  exactDuplicates: SpanLossRow[];
  /** Rows whose key already exists but with different numeric values. */
  conflicts: SpanLossRow[];
  /** Rows whose key is new — safe to append. */
  newRows: SpanLossRow[];
}

export function analyzeIncomingRows(
  incoming: SpanLossRow[],
  existing: SpanLossRow[],
): DuplicateAnalysis {
  const existingByKey = new Map(existing.map((r) => [rowMatchKey(r), r]));
  const exactDuplicates: SpanLossRow[] = [];
  const conflicts: SpanLossRow[] = [];
  const newRows: SpanLossRow[] = [];

  for (const row of incoming) {
    const key = rowMatchKey(row);
    const match = existingByKey.get(key);
    if (!match) {
      newRows.push(row);
    } else if (rowsHaveSameValues(match, row)) {
      exactDuplicates.push(row);
    } else {
      conflicts.push(row);
    }
  }
  return { exactDuplicates, conflicts, newRows };
}
