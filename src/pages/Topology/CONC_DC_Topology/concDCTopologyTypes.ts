export type ConcNode = {
  nodeNo: number;
  nodeName: string;
  x: number;
  y: number;
  nodeId?: string | null;
  advaNodeName?: string | null;
  tier?: "T1" | "T2" | string;
  nodeType?: "NE" | "VN" | "SP" | string;
  status?: number; // 1 up, 0 down
  span?: string; // "NA" etc.
};
 
export type ConcLink = {
  oriNodeNumber: number;
  terNodeNumber: number;
  oriIfIpAddress?: string;
  terIfIpAddress?: string;
  status: number; // 1 up, 0 down
  linkName?: string;
 
  totalBw?: string;
  ifDescr?: string;
 
  oriNodeName?: string;
  terNodeName?: string;
 
  inUtil?: string;
  srcTier?: string;
  destTier?: string;
  metricValue?: string;
 
  fiberDistance?: string;
  spanLossTx?: string;
  spanLossRx?: string;
  subnet?: string;
  designLoss?: string;
 
  trapType?: string;
  recTime?: string;
  severity?: string;
  desc?: string;
  clearTime?: string;
};
 
export type TopologyResponse = {
  nodes: ConcNode[];
  links: ConcLink[];
};
 
export type ResolvedLink = ConcLink & { __src: ConcNode; __dst: ConcNode };
 
export type TooltipState =
  | {
      open: true;
      x: number;
      y: number;
      link: ConcLink; // now tooltip holds full link object
    }
  | { open: false };
 