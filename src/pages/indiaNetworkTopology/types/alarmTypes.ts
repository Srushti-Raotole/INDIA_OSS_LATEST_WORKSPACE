
export interface FiberAlarm {
  /** Unique alarm ID (generated) */
  id: string;
  /** Node name (matches FiberSite.nodeName) */
  nodeName: string;
  /** Trap type / alarm name */
  trapType: string;
  /** Port / interface description */
  ifDescr: string;
  /** Received time */
  rcvdTime: string;
  /** Clear time (null = active) */
  clearTime: string | null;
  /** Trap severity (Critical, Major, etc.) */
  trapSeverity: string;
  /** Span ID (parameter12) — matches FiberRoute.spanid */
  spanId: string;
  /** Vendor (CIENA, NOKIA, etc.) */
  vendor: string;
}

/** A plot alarm link from /v1/dashboard/plotAlarms */
export interface PlotAlarmLink {
  otsId: string;
  spanId: string;
  nodeNameA: string;
  nodeNameB: string;
  erpSiteNameA: string;
  erpSiteNameB: string;
  latitudeA: number;
  longitudeA: number;
  latitudeB: number;
  longitudeB: number;
  /** Technology vendor (CIENA, NOKIA, etc.) */
  technology: string;
}

/** Grouped site pair — multiple spans between same two sites */
export interface SitePairGroup {
  /** Unique key for this site pair (sorted site names) */
  pairKey: string;
  siteA: string;
  siteB: string;
  latA: number;
  lonA: number;
  latB: number;
  lonB: number;
  spans: PlotAlarmLink[];
}

/** Single alarm color — all alarms are red */
export const ALARM_COLOR = '#ef4444';

/** Top-level page mode */
export type PageMode = 'management' | 'alarm';
