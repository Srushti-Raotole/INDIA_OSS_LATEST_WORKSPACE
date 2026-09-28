import type { ApiTopology, ApiAlarm, ApiNodeAlarm } from '../types';
import { SAMPLE_TOPOLOGY, SAMPLE_LINK_ALARMS, SAMPLE_NODE_ALARMS, CONC_DC_TOPOLOGY, CONC_LINK_ALARMS, CONC_NODE_ALARMS } from '../data/sampleTopology';
import axiosClient from "@/api/axiosClient";
import { GET_TOPOLOGY_TRAPTYPES, TOPOLOGY_BASE, TOPOLOGY_SAVE } from "@/api/apis";


function vendorQuery(vendor?: string, extra?: Record<string, string>): string {
  const params = new URLSearchParams();
  if (vendor) params.set('vendor', vendor);
  if (extra) Object.entries(extra).forEach(([k, v]) => params.set(k, v));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export async function listTopologies(vendor?: string): Promise<ApiTopology[]> {
  try {
    const { data } = await axiosClient.get<ApiTopology[]>(`${TOPOLOGY_BASE}${vendorQuery(vendor)}`);
    return data;
  } catch {
    return [SAMPLE_TOPOLOGY, CONC_DC_TOPOLOGY];
  }
}

export async function getTopology(name: string, vendor?: string): Promise<ApiTopology | null> {
  try {
    const { data } = await axiosClient.get<ApiTopology>(`${TOPOLOGY_BASE}/${encodeURIComponent(name)}${vendorQuery(vendor)}`);
    return data;
  } catch {
    if (name === 'sample-1' || name === SAMPLE_TOPOLOGY.id) return SAMPLE_TOPOLOGY;
    if (name === 'sample-conc-microsoft' || name === CONC_DC_TOPOLOGY.id) return CONC_DC_TOPOLOGY;
    return null;
  }
}

export async function createTopology(topology: Omit<ApiTopology, 'id'>): Promise<ApiTopology> {
  const { data } = await axiosClient.post<ApiTopology>(TOPOLOGY_SAVE, topology);
  return data;
}

export async function updateTopology(name: string, topology: Partial<ApiTopology>, vendor?: string): Promise<ApiTopology | null> {
  try {
    const { data } = await axiosClient.put<ApiTopology>(`${TOPOLOGY_BASE}/${encodeURIComponent(name)}${vendorQuery(vendor)}`, topology);
    return data;
  } catch {
    return null;
  }
}

export async function deleteTopology(name: string, vendor?: string): Promise<boolean> {
  try {
    await axiosClient.delete(`${TOPOLOGY_BASE}/${encodeURIComponent(name)}${vendorQuery(vendor)}`);
    return true;
  } catch {
    return false;
  }
}


const VENDOR_TRAP_MAP: Record<string, { adapter: string; family: string }> = {
  CONC: { adapter: 'CONC', family: 'CISCO' },
  IFNR: { adapter: 'IFNR', family: 'INFINERA' },
  TLMR: { adapter: 'TLMR', family: 'CISCO' },
  ADVA: { adapter: 'ADVA', family: 'ADVA' },
};


export async function fetchTrapTypes(vendor?: string): Promise<string[]> {
  if (!vendor) return [];
  const map = VENDOR_TRAP_MAP[vendor.toUpperCase()] || { adapter: vendor, family: 'CISCO' };
  try {
    const { data } = await axiosClient.get<any>(GET_TOPOLOGY_TRAPTYPES, {
      params: { adapter: map.adapter, family: map.family },
    });
    if (!Array.isArray(data)) return [];
    const out = data
      .map((d) => (typeof d === 'string' ? d : (d?.traptype || d?.trapType || d?.name || '')))
      .filter((s: string) => !!s);
    return Array.from(new Set(out));
  } catch {
    return [];
  }
}

export interface AlarmSuperimposeRequest {
  topologyId: string;
  vendor: string;
  client?: string;
  trapType: string;
  linkId?: string;
  sourceNode?: string;
  sourcePort?: string;
  destNode?: string;
  destPort?: string;
}

export async function saveAlarmSuperimpose(req: AlarmSuperimposeRequest): Promise<boolean> {
  try {
    await axiosClient.post(`${TOPOLOGY_BASE}/superimposedalarms`, req);
    return true;
  } catch {
    return false;
  }
}


export async function saveAlarmSuperimposeBatch(
  rows: AlarmSuperimposeRequest[],
): Promise<void> {
  for (const row of rows) {
    await saveAlarmSuperimpose(row);
  }
}

export async function getAlarmSuperimpose(topologyId: string, vendor?: string): Promise<AlarmSuperimposeRequest[]> {
  try {
    const { data } = await axiosClient.get<AlarmSuperimposeRequest[]>(
      `${TOPOLOGY_BASE}/superimposedalarms/${encodeURIComponent(topologyId)}${vendorQuery(vendor)}`,
    );
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function updateSuperimposeTrapType(
  topologyId: string,
  vendor: string,
  traptype: string,
): Promise<boolean> {
  try {
    const params = new URLSearchParams();
    params.set('topologyId', topologyId);
    params.set('vendor', vendor);
    params.set('traptype', traptype);
    await axiosClient.put(`${TOPOLOGY_BASE}/superimposedalarms/updatetraps?${params.toString()}`);
    return true;
  } catch {
    return false;
  }
}

export async function fetchAlarms(topologyName: string, vendor?: string): Promise<ApiAlarm[]> {
  try {
    const params = new URLSearchParams();
    params.set('topologyId', topologyName);
    if (vendor) params.set('vendor', vendor);
    const { data } = await axiosClient.get<any[]>(`${TOPOLOGY_BASE}/fetchalarms?${params.toString()}`);
    // Normalize API response to ApiAlarm shape
    return (data || []).map(item => ({
      ...item,
      traptype: item.traptype || '',
      TrapSeverity: item.TrapSeverity || item.trapSeverity || '',
      vendor: item.vendor,
      alarmid: item.alarmid || item.alarmId,
      client: item.client,
      link_id: item.link_id || item.linkId,
      sourceNode: item.sourceNode || item.source_node,
      sourcePort: item.sourcePort || item.source_port,
      destNode: item.destNode || item.dest_node,
      destPort: item.destPort || item.dest_port,
      source_label: item.source_label || item.sourceNode || '',
      target_label: item.target_label || item.destNode || '',
      max_rcvd_time: item.max_rcvd_time || item.rcvd_Time || item.rcvdTime || '',
      // Compat fields derived from API
      alarmName: item.traptype || item.alarmName || 'Unknown Alarm',
      severity: (item.TrapSeverity || item.trapSeverity || item.severity || 'CRITICAL').toUpperCase(),
    }));
  } catch {
    if (topologyName === 'sample-conc-microsoft') return CONC_LINK_ALARMS;
    return SAMPLE_LINK_ALARMS;
  }
}

export async function fetchNodeAlarms(topologyName: string, vendor?: string): Promise<ApiNodeAlarm[]> {
  try {
    const { data } = await axiosClient.get<ApiNodeAlarm[]>(`${TOPOLOGY_BASE}/${encodeURIComponent(topologyName)}/node-alarms${vendorQuery(vendor)}`);
    return data;
  } catch {
    if (topologyName === 'sample-conc-microsoft') return CONC_NODE_ALARMS;
    return SAMPLE_NODE_ALARMS;
  }
}

export async function fetchSummary(topologyName: string, vendor?: string): Promise<any> {
  try {
    const { data } = await axiosClient.get(`${TOPOLOGY_BASE}/${encodeURIComponent(topologyName)}/summary${vendorQuery(vendor)}`);
    return data;
  } catch {
    return null;
  }
}

export interface ConnectivityRecord {
  Service_ID: string;
  Frequency: string;
  Line_Rate: string;
  A_end_Node: string;
  A_end_Trunk_PORT: string;
  A_end_Client: string;
  Z_end_Node: string;
  Z_end_Trunk_PORT: string;
  Z_end_Client: string;
  A_end_slot: string;
  Z_end_slot: string;
}

export async function fetchConnectivity(topologyName: string, source?: string, target?: string, vendor?: string): Promise<ConnectivityRecord[]> {
  try {
    const extra: Record<string, string> = {};
    if (source) extra.source = source;
    if (target) extra.target = target;
    const { data } = await axiosClient.get<ConnectivityRecord[]>(`${TOPOLOGY_BASE}/${encodeURIComponent(topologyName)}/connectivity${vendorQuery(vendor, extra)}`);
    return data;
  } catch {
    return [];
  }
}

export interface SpanLossRecord {
  link_id: string;
  topologyId: string;
  span?: string;
  source_label?: string;
  target_label?: string;
  span_Loss_Tx?: number | string | null;
  span_Loss_Rx?: number | string | null;
  Fiber_distance?: number | string | null;
  Span_Margin?: number | string | null;
  Design_Loss?: number | string | null;
}

export async function fetchSpanLoss(topologyName: string, vendor?: string): Promise<SpanLossRecord[]> {
  try {
    const params = new URLSearchParams();
    params.set('topologyId', topologyName);
    if (vendor) params.set('vendor', vendor);
    const { data } = await axiosClient.get<SpanLossRecord[]>(`${TOPOLOGY_BASE}/fetchspanloss?${params.toString()}`);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function toggleMonitor(name: string, enabled: boolean, vendor?: string): Promise<boolean> {
  try {
    const params = new URLSearchParams();
    if (vendor) params.set('vendor', vendor);
    params.set('flag', String(enabled));
    await axiosClient.put(`${TOPOLOGY_BASE}/monitor/${encodeURIComponent(name)}?${params.toString()}`);
    return true;
  } catch {
    return false;
  }
}

export function topologyToCSV(topology: ApiTopology): string {
  const headers = [
    'Source Node', 'Source Icon', 'Source IP', 'Source Port', 'Source X', 'Source Y',
    'Source Node Label Offset X', 'Source Node Label Offset Y', 'Source Group',
    'Destination Node', 'Destination Icon', 'Dest IP', 'Dest Port', 'Dest X', 'Dest Y',
    'Dest Node Label Offset X', 'Dest Node Label Offset Y', 'Dest Group',
    'Link Label', 'Link Type', 'Show Arrows',
    'Curve Offset X', 'Curve Offset Y',
    'Label Offset X', 'Label Offset Y',
  ];

  const linkedNodeIds = new Set<string>();
  const rows: string[] = [];

  topology.links.forEach(link => {
    const src = topology.nodes.find(n => n.id === link.source);
    const dest = topology.nodes.find(n => n.id === link.target);
    if (src) linkedNodeIds.add(src.id);
    if (dest) linkedNodeIds.add(dest.id);
    rows.push([
      src?.label || link.source, src?.icon || 'SERVER', link.srcIp || '', link.srcPortName || '',
      String(src?.x ?? 0), String(src?.y ?? 0), String(src?.nodeLabelOffsetX ?? 0), String(src?.nodeLabelOffsetY ?? 0),
      src?.group || '',
      dest?.label || link.target, dest?.icon || 'SERVER', link.dstIp || '', link.dstPortName || '',
      String(dest?.x ?? 0), String(dest?.y ?? 0), String(dest?.nodeLabelOffsetX ?? 0), String(dest?.nodeLabelOffsetY ?? 0),
      dest?.group || '',
      link.label || '', link.type || 'STRAIGHT', String(link.settings?.showArrows ?? false),
      String(link.curveOffsetX ?? 0), String(link.curveOffsetY ?? 0),
      String(link.labelOffsetX ?? 0), String(link.labelOffsetY ?? 0),
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
  });

  // Standalone nodes (no links)
  topology.nodes.filter(n => !linkedNodeIds.has(n.id)).forEach(node => {
    rows.push([
      node.label, node.icon || 'SERVER', '', '',
      String(node.x ?? 0), String(node.y ?? 0),
      String(node.nodeLabelOffsetX ?? 0), String(node.nodeLabelOffsetY ?? 0),
      node.group || '',
      '', '', '', '', '', '', '0', '0', '',
      '', 'STRAIGHT', 'false', '0', '0', '0', '0',
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
  });

  return [headers.join(','), ...rows].join('\n');
}


export function parseTopologyCSV(csvContent: string): {
  nodes: ApiTopology['nodes'];
  links: ApiTopology['links'];
  groups?: ApiTopology['groups'];
} | null {
  try {
    const lines = csvContent.trim().split('\n').filter(l => l.trim());
    if (lines.length < 2) return null;

    const header = lines[0].toLowerCase();
    const isFull = header.includes('source x') || header.includes('source_x');

    const nodeMap = new Map<string, ApiTopology['nodes'][0]>();
    const links: ApiTopology['links'] = [];

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].match(/("([^"]|"")*"|[^,]*)/g)?.map(v =>
        v.replace(/^"|"$/g, '').replace(/""/g, '"').trim()
      ) || [];
      if (row.length < 4) continue;

      const srcLabel = row[0] || '';
      if (!srcLabel) continue;

      const srcIcon = row[1] || 'SERVER';
      const srcIp = row[2] || '';
      const srcPort = row[3] || '';

      let srcX = 0, srcY = 0, srcLabelOffX = 0, srcLabelOffY = 0, srcGroup = '';
      let destLabel = '', destIcon = 'SERVER', destIp = '', destPort = '';
      let destX = 0, destY = 0, destLabelOffX = 0, destLabelOffY = 0, destGroup = '';
      let linkLabel = '', linkType = 'STRAIGHT', showArrows = false;
      let curveOffX = 0, curveOffY = 0, labelOffX = 0, labelOffY = 0;

      if (isFull && row.length >= 19) {
        srcX = parseFloat(row[4]) || 0;
        srcY = parseFloat(row[5]) || 0;
        srcLabelOffX = parseFloat(row[6]) || 0;
        srcLabelOffY = parseFloat(row[7]) || 0;
        srcGroup = row[8] || '';
        destLabel = row[9] || '';
        destIcon = row[10] || 'SERVER';
        destIp = row[11] || '';
        destPort = row[12] || '';
        destX = parseFloat(row[13]) || 0;
        destY = parseFloat(row[14]) || 0;
        destLabelOffX = parseFloat(row[15]) || 0;
        destLabelOffY = parseFloat(row[16]) || 0;
        destGroup = row[17] || '';
        linkLabel = row[18] || '';
        linkType = row[19] || 'STRAIGHT';
        showArrows = row[20]?.toLowerCase() === 'true';
        curveOffX = parseFloat(row[21]) || 0;
        curveOffY = parseFloat(row[22]) || 0;
        labelOffX = parseFloat(row[23]) || 0;
        labelOffY = parseFloat(row[24]) || 0;
      } else {
        // Simple 6-column fallback: Src, SrcIcon, Dest, DestIcon, Label, Type
        destLabel = row[2] || '';
        destIcon = row[3] || 'SERVER';
        linkLabel = row[4] || '';
        linkType = row[5] || 'STRAIGHT';
      }

      const srcKey = srcLabel.toLowerCase();
      if (!nodeMap.has(srcKey)) {
        nodeMap.set(srcKey, {
          id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          label: srcLabel, icon: srcIcon, x: srcX, y: srcY,
          nodeLabelOffsetX: srcLabelOffX, nodeLabelOffsetY: srcLabelOffY,
          group: srcGroup || undefined,
        });
      } else {
        const existing = nodeMap.get(srcKey)!;
        if ((existing.x === 0 && existing.y === 0) && (srcX !== 0 || srcY !== 0)) {
          existing.x = srcX; existing.y = srcY;
        }
        if (!existing.nodeLabelOffsetX && srcLabelOffX) existing.nodeLabelOffsetX = srcLabelOffX;
        if (!existing.nodeLabelOffsetY && srcLabelOffY) existing.nodeLabelOffsetY = srcLabelOffY;
        if (!existing.group && srcGroup) existing.group = srcGroup;
      }

      if (destLabel) {
        const destKey = destLabel.toLowerCase();
        if (!nodeMap.has(destKey)) {
          nodeMap.set(destKey, {
            id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 6)}-d`,
            label: destLabel, icon: destIcon, x: destX, y: destY,
            nodeLabelOffsetX: destLabelOffX, nodeLabelOffsetY: destLabelOffY,
            group: destGroup || undefined,
          });
        } else {
          const existing = nodeMap.get(destKey)!;
          if ((existing.x === 0 && existing.y === 0) && (destX !== 0 || destY !== 0)) {
            existing.x = destX; existing.y = destY;
          }
          if (!existing.nodeLabelOffsetX && destLabelOffX) existing.nodeLabelOffsetX = destLabelOffX;
          if (!existing.nodeLabelOffsetY && destLabelOffY) existing.nodeLabelOffsetY = destLabelOffY;
          if (!existing.group && destGroup) existing.group = destGroup;
        }

        links.push({
          id: `link-${Date.now()}-${i}`,
          source: nodeMap.get(srcKey)!.id,
          target: nodeMap.get(destKey)!.id,
          label: linkLabel,
          type: linkType,
          srcIp: srcIp || undefined,
          dstIp: destIp || undefined,
          srcPortName: srcPort || undefined,
          dstPortName: destPort || undefined,
          curveOffsetX: curveOffX || undefined,
          curveOffsetY: curveOffY || undefined,
          labelOffsetX: labelOffX || undefined,
          labelOffsetY: labelOffY || undefined,
          settings: {
            showArrows,
            smartRouting: true,
            avoidCrossingNodes: true,
            strokeWidth: 2.5,
            curveIntensity: 0.1,
            parallelOffset: 0,
          },
        });
      }
    }

    // Rebuild group boxes from node group assignments
    const nodes = Array.from(nodeMap.values());
    const groupMap = new Map<string, { minX: number; minY: number; maxX: number; maxY: number }>();
    nodes.forEach(n => {
      if (!n.group) return;
      const existing = groupMap.get(n.group);
      if (existing) {
        existing.minX = Math.min(existing.minX, n.x);
        existing.minY = Math.min(existing.minY, n.y);
        existing.maxX = Math.max(existing.maxX, n.x);
        existing.maxY = Math.max(existing.maxY, n.y);
      } else {
        groupMap.set(n.group, { minX: n.x, minY: n.y, maxX: n.x, maxY: n.y });
      }
    });

    const groupColors = ['#3b82f6', '#22c55e', '#f97316', '#a855f7', '#ef4444', '#06b6d4'];
    const groups: ApiTopology['groups'] = Array.from(groupMap.entries()).map(([name, bbox], idx) => {
      const pad = 60;
      return {
        id: `group-${Date.now()}-${idx}`,
        name,
        label: name,
        x: bbox.minX - pad,
        y: bbox.minY - pad,
        width: (bbox.maxX - bbox.minX) + pad * 2,
        height: (bbox.maxY - bbox.minY) + pad * 2,
        color: groupColors[idx % groupColors.length],
      };
    });

    return { nodes, links, groups: groups.length > 0 ? groups : undefined };
  } catch {
    return null;
  }
}

/** Download topology as CSV file */
export function downloadTopologyCSV(topology: ApiTopology): void {
  const csv = topologyToCSV(topology);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${topology.name.replace(/\s+/g, '_')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
