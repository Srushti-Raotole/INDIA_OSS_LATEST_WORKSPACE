// // Sector Summary API Service


import { GET_SECTOR_WISE_SUMMARY_DATA } from "@/api/apis";
import axiosClient from "@/api/axiosClient";


export interface SectorSummaryRow {
  Pairs: number;
  Channels: number;
  Circuits: number;
  Customers: number;
  Working: number;
  Protected: number;
  Capacity_Total: number | null;
  Capacity_Used: number | null;
  Capacity_Available: number | null;
  Util_HIGH?: number;
  Util_MED?: number;
  Util_LOW?: number;
  UtilizationType?: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface SectorDomainRow {
  Domain: string;
  Count: number;
}

export interface SectorTypeRow {
  type: string;
  Count: number;
}

export interface SectorTechRow {
  technology: string;
  Count: number;
}

export interface SectorCustomerChannelRow {
  customerName: string;
  Channel_Count: number;
}

export interface SectorCustomerUtilRow {
  customerName: string;
  technology: string;
  Util_By_Customer: number;
}

/** Raw API response shape */
export interface SectorWiseSummaryResponse {
  INDIA_CIENA_summary: SectorSummaryRow[];
  INDIA_CIENA_domain: SectorDomainRow[];
  INDIA_CIENA_type: SectorTypeRow[];
  INDIA_CIENA_technology: SectorTechRow[];
  INDIA_CIENA_customerChannel: SectorCustomerChannelRow[];
  INDIA_CIENA_customerUtil: SectorCustomerUtilRow[];
  NFMT_summary: SectorSummaryRow[];
  NFMT_domain: SectorDomainRow[];
  NFMT_type: SectorTypeRow[];
  NFMT_technology: SectorTechRow[];
  NFMT_customerChannel: SectorCustomerChannelRow[];
  NFMT_customerUtil: SectorCustomerUtilRow[];
}

// ============================================
// Merged / Unified Types (for UI consumption)
// ============================================

export interface MergedSectorSummary {
  pairs: number;
  channels: number;
  circuits: number;
  customers: number;
  working: number;
  protected: number;
  capacityTotal: number;
  capacityUsed: number;
  capacityAvailable: number;
  avgUtilization: number;
  utilizationType: 'HIGH' | 'MEDIUM' | 'LOW';
  utilHigh: number;
  utilMed: number;
  utilLow: number;
  domainCounts: Record<string, number>;
  typeCounts: Record<string, number>;
  techCounts: Record<string, number>;
  customerNames: string[];
  customerUtils: { name: string; technology: string; utilization: number }[];
}

// ============================================
// Helpers
// ============================================

function safeNum(v: number | null | undefined): number {
  return v ?? 0;
}

function mergeCountMaps(
  a: { key: string; count: number }[],
  b: { key: string; count: number }[]
): Record<string, number> {
  const map: Record<string, number> = {};
  for (const item of a) map[item.key] = (map[item.key] || 0) + item.count;
  for (const item of b) map[item.key] = (map[item.key] || 0) + item.count;
  return map;
}

/**
 * Merge INDIA_CIENA + NFMT data into a single unified summary.
 */
function mergeResponse(data: SectorWiseSummaryResponse): MergedSectorSummary {
  const ciena = data.INDIA_CIENA_summary[0] || {} as Partial<SectorSummaryRow>;
  const nokia = data.NFMT_summary[0] || {} as Partial<SectorSummaryRow>;

  const capacityTotal = safeNum(ciena.Capacity_Total) + safeNum(nokia.Capacity_Total);
  const capacityUsed = safeNum(ciena.Capacity_Used) + safeNum(nokia.Capacity_Used);
  const capacityAvailable = safeNum(ciena.Capacity_Available) + safeNum(nokia.Capacity_Available);
  const avgUtilization = capacityTotal > 0 ? Math.round((capacityUsed / capacityTotal) * 100) : 0;

  // Utilization counts from API
  const utilHigh = safeNum(ciena.Util_HIGH) + safeNum(nokia.Util_HIGH);
  const utilMed = safeNum(ciena.Util_MED) + safeNum(nokia.Util_MED);
  const utilLow = safeNum(ciena.Util_LOW) + safeNum(nokia.Util_LOW);

  // Determine overall utilization type
  let utilizationType: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
  if (avgUtilization >= 80) utilizationType = 'HIGH';
  else if (avgUtilization >= 50) utilizationType = 'MEDIUM';

  // Merge domain / type / technology counts
  const domainCounts = mergeCountMaps(
    data.INDIA_CIENA_domain.map(d => ({ key: d.Domain, count: d.Count })),
    data.NFMT_domain.map(d => ({ key: d.Domain, count: d.Count }))
  );
  const typeCounts = mergeCountMaps(
    data.INDIA_CIENA_type.map(d => ({ key: d.type, count: d.Count })),
    data.NFMT_type.map(d => ({ key: d.type, count: d.Count }))
  );
  const techCounts = mergeCountMaps(
    data.INDIA_CIENA_technology.map(d => ({ key: d.technology, count: d.Count })),
    data.NFMT_technology.map(d => ({ key: d.technology, count: d.Count }))
  );

  // Merge distinct customer names
  const customerSet = new Set<string>();
  for (const c of data.INDIA_CIENA_customerChannel) if (c.customerName?.trim()) customerSet.add(c.customerName);
  for (const c of data.NFMT_customerChannel) if (c.customerName?.trim()) customerSet.add(c.customerName);
  const customerNames = Array.from(customerSet).sort();

  // Merge customer utilization
  const customerUtils = [
    ...data.INDIA_CIENA_customerUtil.map(c => ({ name: c.customerName, technology: c.technology, utilization: c.Util_By_Customer })),
    ...data.NFMT_customerUtil.map(c => ({ name: c.customerName, technology: c.technology, utilization: c.Util_By_Customer })),
  ];

  return {
    pairs: safeNum(ciena.Pairs) + safeNum(nokia.Pairs),
    channels: safeNum(ciena.Channels) + safeNum(nokia.Channels),
    circuits: safeNum(ciena.Circuits) + safeNum(nokia.Circuits),
    customers: safeNum(ciena.Customers) + safeNum(nokia.Customers),
    working: safeNum(ciena.Working) + safeNum(nokia.Working),
    protected: safeNum(ciena.Protected) + safeNum(nokia.Protected),
    capacityTotal,
    capacityUsed,
    capacityAvailable,
    avgUtilization,
    utilizationType,
    utilHigh,
    utilMed,
    utilLow,
    domainCounts,
    typeCounts,
    techCounts,
    customerNames,
    customerUtils,
  };
}

// ============================================
// Public API
// ============================================

/**
 * Fetch sector summary from API and return merged data.
 * @param sector - Sector name (e.g., "Delhi-Raxaul")
 */
export async function fetchSectorSummary(sector: string): Promise<MergedSectorSummary> {
  const response = await axiosClient.get<SectorWiseSummaryResponse>(
    GET_SECTOR_WISE_SUMMARY_DATA,
    { params: { sector } }
  );
  return mergeResponse(response.data);
}
