

import { GET_OTS_DETAILS } from "@/api/apis";
import axiosClient from "@/api/axiosClient";


export interface OtsDetail {
  ots_id: string;
  display_name: string;
  nodeA: string;
  nodeB: string;
  portA: string;
  portB: string;
  channelFinalName: string;
  circuitUserLabel: string;
  customerName: string | null;
  channel_opr_state: string;
  circuit_opr_state: string;
  CircuitOperationalStateTime: string | null;
  ChannelOperationalStateTime: string | null;
  createdCapacity: number | null;
  usedCapacity_c: number | null;
  utilizationPercent_c: number | null;
  createdCapacity_ch: number | null;
  usedCapacity_ch: number | null;
  utilizationPercent_ch: number | null;
  qualifier_ckt: string | null;
  technology: string | null;
}

/**
 * Fetch OTS details for a span.
 * @param spanId - The span ID to query
 * @param adapter - 'MCP' for Ciena, 'NFMT' for Nokia
 */
export async function fetchOtsDetails(
  spanId: string,
  adapter: 'MCP' | 'NFMT'
): Promise<OtsDetail[]> {
  const response = await axiosClient.get<OtsDetail[]>(GET_OTS_DETAILS, {
    params: { spanids: spanId, adapter },
  });
  return Array.isArray(response.data) ? response.data : [];
}
