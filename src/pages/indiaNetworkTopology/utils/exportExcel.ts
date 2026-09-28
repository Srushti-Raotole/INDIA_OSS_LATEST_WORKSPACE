// ============================================
import * as XLSX from 'xlsx';

export interface ExportColumn {
  /** Key on the row object */
  key: string;
  /** Friendly column header in the exported file */
  header: string;
  /** Optional value transformer (e.g. format numbers) */
  format?: (value: any, row: any) => any;
}

export function exportToExcel<T extends Record<string, any>>(
  rows: T[],
  columns: ExportColumn[],
  filename: string,
  sheetName: string = 'Sheet1',
) {
  const data = rows.map(row => {
    const out: Record<string, any> = {};
    columns.forEach(col => {
      const v = row[col.key];
      out[col.header] = col.format ? col.format(v, row) : v ?? '';
    });
    return out;
  });

  const ws = XLSX.utils.json_to_sheet(data, { header: columns.map(c => c.header) });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31) || 'Sheet1');

  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  XLSX.writeFile(wb, `${filename}_${stamp}.xlsx`);
}
