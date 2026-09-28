export interface TopologyNode {
    nodeNo: number;
    nodeName: string;
    x: number;
    y: number;
    tier: string; // "T1" | "T2" | "T3" | ...
    nodeType: string; // "NE" | "VN" | "SP" | ...
    span?: string | null;
}
 
export interface TopologyLink {
    oriNodeNumber: number;
    terNodeNumber: number;
    oriNodeName: string;
    terNodeName: string;
    status: number; // 0=down, 1=pp, 2=up
    linkName: string;
    totalBw: string;
    oriIfIpAddress: string;
    terIfIpAddress: string;
    fiberDistance: string;
    designLoss: string;
    spanLossTx: string;
    spanLossRx: string;
    recTime: string;
    clearTime: string;
    severity: string;
    desc: string;
}
 
export interface TopologyApiResponse {
    nodes: TopologyNode[];
    links: TopologyLink[];
}
 
// Tooltip state for link hover
export interface LinkTooltipState {
    x: number;
    y: number;
    link: TopologyLink;
}
 
/** Connectivity table row (second API) */
export interface ConnectivityRow {
    Linkid: string;
    OriNodeName: string;
    OriIfDescr: string;
    TerNodeName: string;
    TerIfDescr: string;
    linkname: string;
}