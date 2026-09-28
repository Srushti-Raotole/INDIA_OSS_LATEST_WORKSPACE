import { GET_ALARM_DETAILS, GET_PLOT_ALARMS } from "@/api/apis";
import axiosClient from "@/api/axiosClient";
import type { FiberAlarm, PlotAlarmLink } from '../types/alarmTypes';

interface ApiAlarm {
  NodeName: string;
  traptype: string;
  IfDescr: string;
  rcvd_Time: string;
  clear_Time: string | null;
  TrapSeverity: string;
  parameter12: string;
  vendor: string;
}

export async function fetchAlarmDetails(): Promise<FiberAlarm[]> {
  const response = await axiosClient.get<ApiAlarm[]>(GET_ALARM_DETAILS);
  const alarms = Array.isArray(response.data) ? response.data : [];

  // Only active alarms (clear_Time is null)
  return alarms
    .filter(a => a.clear_Time === null)
    .map((a, i) => ({
      id: `alarm-${i}-${a.NodeName}-${a.parameter12}`,
      nodeName: a.NodeName,
      trapType: a.traptype,
      ifDescr: a.IfDescr || '',
      rcvdTime: a.rcvd_Time,
      clearTime: a.clear_Time,
      trapSeverity: a.TrapSeverity || '',
      spanId: a.parameter12 || '',
      vendor: a.vendor || '',
    }));
}

interface ApiPlotAlarm {
  otsId: string;
  'Span Id': string;
  NodeNameA: string;
  NodeNameB: string;
  ErpSiteNameA: string;
  ErpSiteNameB: string;
  LatitudeA: number;
  LongitudeA: number;
  LatitudeB: number;
  LongitudeB: number;
  Technology?: string;
}

export async function fetchPlotAlarms(): Promise<PlotAlarmLink[]> {
  const response = await axiosClient.get<ApiPlotAlarm[]>(GET_PLOT_ALARMS);
  const data = Array.isArray(response.data) ? response.data : [];

  return data.map((d) => ({
    otsId: String(d.otsId || ''),
    spanId: d['Span Id'] || '',
    nodeNameA: d.NodeNameA || '',
    nodeNameB: d.NodeNameB || '',
    erpSiteNameA: d.ErpSiteNameA || '',
    erpSiteNameB: d.ErpSiteNameB || '',
    latitudeA: d.LatitudeA,
    longitudeA: d.LongitudeA,
    latitudeB: d.LatitudeB,
    longitudeB: d.LongitudeB,
    technology: (d.Technology || '').toUpperCase(),
  }));
}
