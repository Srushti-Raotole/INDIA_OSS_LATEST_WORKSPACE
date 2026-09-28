import type { SpanLossRow } from '../types';
import type { SpanLossVendor } from '../services/spanLossApi';

export const CSV_HEADERS = [
  'spanId',
  'deviceNameA',
  'portA',
  'deviceNameB',
  'portB',
  'designLoss',
  'spanMargin',
  'designEol',
  'fiberDistance',
  'vendor',
  'client',
] as const;

function escapeCsv(val: unknown): string {
  if (val === null || val === undefined) return '';
  const s = String(val);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function rowsToCsv(rows: SpanLossRow[]): string {
  const lines = [CSV_HEADERS.join(',')];
  for (const r of rows) {
    lines.push(CSV_HEADERS.map((h) => escapeCsv((r as any)[h])).join(','));
  }
  return lines.join('\n');
}

export function buildSampleCsv(vendor: SpanLossVendor): string {
  const sampleRows: SpanLossRow[] = [
    {
      spanId: `${vendor}-SPAN-SAMPLE-001`,
      deviceNameA: 'BOM-OLA-01',
      portA: '1/1/1',
      deviceNameB: 'PNQ-OLA-01',
      portB: '1/2/1',
      designLoss: 12.5,
      spanMargin: 2.0,
      designEol: 18.5,
      fiberDistance: 65.4,
      vendor,
      client: 'Sample Client',
    },
    {
      spanId: `${vendor}-SPAN-SAMPLE-002`,
      deviceNameA: 'DEL-OLA-02',
      portA: '1/1/2',
      deviceNameB: 'JAI-OLA-02',
      portB: '1/2/2',
      designLoss: 9.8,
      spanMargin: 1.5,
      designEol: 14.2,
      fiberDistance: 41.7,
      vendor,
      client: 'Sample Client',
    },
  ];
  return rowsToCsv(sampleRows);
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Minimal CSV parser supporting quoted fields & escaped quotes. */
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else {
      if (ch === ',') {
        out.push(cur);
        cur = '';
      } else if (ch === '"') {
        inQuotes = true;
      } else {
        cur += ch;
      }
    }
  }
  out.push(cur);
  return out;
}

export interface CsvParseResult {
  rows: SpanLossRow[];
  errors: string[];
  skipped: number;
}

export function parseSpanLossCsv(text: string, vendor: SpanLossVendor): CsvParseResult {
  const errors: string[] = [];
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { rows: [], errors: ['CSV is empty'], skipped: 0 };

  const headerCells = parseCsvLine(lines[0]).map((h) => h.trim());
  const headerMap: Record<string, number> = {};
  headerCells.forEach((h, i) => {
    headerMap[h] = i;
  });

  // Span ID is no longer required — uniqueness is the 5-key composite.
  // We only require that a row has SOMETHING identifying it.
  const rows: SpanLossRow[] = [];
  let skipped = 0;
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    const get = (k: string) => {
      const idx = headerMap[k];
      return idx === undefined ? '' : (cells[idx] ?? '').trim();
    };
    const spanId = get('spanId');
    const deviceNameA = get('deviceNameA');
    const deviceNameB = get('deviceNameB');
    const portA = get('portA');
    const portB = get('portB');
    if (!spanId && !deviceNameA && !deviceNameB && !portA && !portB) {
      skipped++;
      errors.push(`Row ${i + 1}: no identifying fields (spanId/deviceA/deviceB/portA/portB) — skipped`);
      continue;
    }
    const num = (k: string): number | null => {
      const v = get(k);
      if (v === '') return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };
    rows.push({
      spanId,
      deviceNameA,
      portA,
      deviceNameB,
      portB,
      designLoss: num('designLoss'),
      spanMargin: num('spanMargin'),
      designEol: num('designEol'),
      fiberDistance: num('fiberDistance'),
      vendor: get('vendor') || vendor,
      client: get('client'),
    });
  }
  return { rows, errors, skipped };
}
