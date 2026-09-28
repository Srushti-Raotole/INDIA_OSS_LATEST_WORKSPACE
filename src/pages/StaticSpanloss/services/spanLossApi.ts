import axiosClient from "@/api/axiosClient";
import {
  SPAN_LOSS_RECORDS,
  SPAN_LOSS_BULK_INSERT,
  FETCH_INVENTORY_ADVA_CLIENTS,
  FETCH_INVENTORY_INFR_CLIENTS,
} from "@/api/apis";
import type { SpanLossRow } from '../types';


export const SPAN_LOSS_VENDORS = [
  'ADVA',
  'IFNR',
  'TLMR',
  'MCP',
] as const;
export type SpanLossVendor = (typeof SPAN_LOSS_VENDORS)[number];

export const VENDOR_ADAPTER: Record<SpanLossVendor, string> = {
  ADVA: 'ADVA',
  IFNR: 'IFNR',
  TLMR: 'TLMR',
  MCP: 'MCP',
};


const VENDOR_CLIENTS_PATH: Partial<Record<SpanLossVendor, string>> = {
  ADVA: FETCH_INVENTORY_ADVA_CLIENTS,
  IFNR: FETCH_INVENTORY_INFR_CLIENTS,
};

const HARDCODED_CLIENTS: Partial<Record<SpanLossVendor, string[]>> = {
  TLMR: ['Google'],
  MCP: ['MCP'],
};

// ---------- Clients ----------

export interface ClientItem {
  client: string;
}

export async function fetchClientsByVendor(vendor: SpanLossVendor): Promise<string[]> {
  if (HARDCODED_CLIENTS[vendor]) return [...HARDCODED_CLIENTS[vendor]!];
  const path = VENDOR_CLIENTS_PATH[vendor];
  if (!path) return [];
  try {
    const { data } = await axiosClient.get<ClientItem[]>(path);
    if (!Array.isArray(data)) return [];
    return data
      .map((d) => (typeof d?.client === 'string' ? d.client.trim() : ''))
      .filter((c) => c.length > 0);
  } catch (err) {
    console.warn('[spanLossApi] fetchClientsByVendor failed', vendor, err);
    return [];
  }
}

// ---------- Records ----------
export async function fetchSpanLossRecords(
  vendor: SpanLossVendor,
  client: string,
): Promise<SpanLossRow[]> {
  const adapter = VENDOR_ADAPTER[vendor];
  try {
    const { data } = await axiosClient.get<SpanLossRow[]>(SPAN_LOSS_RECORDS, {
      params: { adapter, client },
    });
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('[spanLossApi] fetchSpanLossRecords failed', { adapter, client }, err);
    return [];
  }
}

export type SpanLossSaveMode = 'OVERRIDE';

export async function bulkInsertSpanLoss(
  vendor: SpanLossVendor,
  rows: SpanLossRow[],
  opts: { client?: string } = {},
): Promise<{ saved: number; message: string }> {
  const adapter = VENDOR_ADAPTER[vendor];
  const payload = rows.map((r) => ({
    spanId: r.spanId,
    deviceNameA: r.deviceNameA,
    portA: r.portA,
    deviceNameB: r.deviceNameB,
    portB: r.portB,
    designLoss: r.designLoss,
    spanMargin: r.spanMargin,
    designEol: r.designEol,
    fiberDistance: r.fiberDistance,
    vendor: r.vendor || vendor,
    client: r.client || opts.client || '',
  }));
  const { data } = await axiosClient.post<string>(SPAN_LOSS_BULK_INSERT, payload, {
    params: { adapter, client: opts.client },
  });
  return { saved: payload.length, message: typeof data === 'string' ? data : 'Inserted' };
}

export async function fetchSpanLossByVendor(_vendor: SpanLossVendor): Promise<SpanLossRow[]> {
  return [];
}

export async function saveSpanLoss(
  vendor: SpanLossVendor,
  rows: SpanLossRow[],
): Promise<{ saved: number }> {
  const res = await bulkInsertSpanLoss(vendor, rows);
  return { saved: res.saved };
}
