export interface LocationNode {
  location: string;
  count: number;
}

export interface ChartData {
  name: string;
  value: number;
}

export interface AlarmDetail {
  "Trap Type": string;
  "Sub Trap Type": string;
  "Alarm Entity": string;
  "Trap Severity": string;
  "Node IP": string;
  "Node Name": string;
  "Interface Name": string;
  "Alarm Recieved Time": string;
  "Alarm Value": string;
  "Alarm Description": string;
  "Trap Source": string;
}

export interface LinkDetail {
  LinkType: string;
  TotalLinkCnt: number;
  DownLinkCnt: number;
}

export interface DynamicTableRow {
  [key: string]: any;

  Adapter: string;
  Severity: string;
  Alarm: string;
  Client: string;
  Technology: string;
  'Device Name': string;
  Source: string;
  'Trap Source': string;
  'Port Name': string;
  Tag: string;
  'Device Type': string;
  Description: string;
  'No. of Service Affected': string;
  'NMS Received Time': string;
  'Update Time': string;
  'OSS Insertion Time': string;
  'Clear Time': string;
  'Ack Status': string;
  'Ack Time': string;
  'Ack Msg': string;
  'Ack User': string;
  'Ticket Status'?: string;
  'Object Ref': string;
  'Alarm Id': string;
  'Internal TicketId': string;
  'External TicketId': string;
  Circle: string;
  City: string;
  'ERP Site ID': string;

  __trapid?: string;
  __adapterName?: string;
  __vendor?: string;
  __rec_time?: string;
}