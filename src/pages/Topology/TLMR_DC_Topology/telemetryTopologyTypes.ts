export interface TopologyNode {
  nodeNo: number;
  nodeName: string;
  x: number;
  y: number;
  nodeId?: number | null;
  advaNodeName?: string | null;
  tier?: string | null;      // T1..T12, T9 etc
  nodeType?: string | null;  // "VE" OR "NE-1014" etc
  status?: number | null;
  span?: string | null;
  portName?: string | null;  // for VE labels like Ots0/1/0/1
}
export interface TopologyLink {
  oriNodeNumber: number;
  terNodeNumber: number;
  oriIfDescr?: string;       // Slot-0/P0
  terIfDescr?: string;       // Slot-0/P0
  status: number;            // 0 down, 1/2 up, 3 protection
  linkName?: string;
  totalBW?: string;
  ifDescr?: string;
  oriNodeName?: string;
  terNodeName?: string;
  inUtil?: string;
  srcTier?: string;
  destTier?: string;
  matricValue?: string;
  fiberDistance?: string;
  spanLossTx?: string;
  spanLossRx?: string;
  subnet?: string;
  designLoss?: string;
  trapType?: string;
  rcvdTime?: string;
  trapSeverity?: string;
  description?: string;
  clearTime?: string;
}
export interface TopologyApiResponse {
  nodes: TopologyNode[];
  links: TopologyLink[];
}
// MRT rows
export type ConnectivityRow = {
  serviceId: string;
  frequency: string;
  lineRate: string;
  aEndNode: string;
  aEndTrunkPort: string;
  aEndClient: string;
  zEndNode: string;
  zEndTrunkPort: string;
  zEndClient: string;
};
 
 
export type TelemetryLinkTooltipState =
  | {
      open: true;
      x: number;
      y: number;
      link: TopologyLink;
      nodesByNo: Map<number, TopologyNode>;
    }
  | { open: false };
 