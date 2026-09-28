import type { ApiTopology, ApiAlarm, ApiNodeAlarm } from '../types';

export const SAMPLE_TOPOLOGY: ApiTopology = {
  id: 'sample-1',
  name: 'Telemetry Topology',
  client: 'Google',
  vendor: 'TLMR',
  monitorEnabled: true,
  nodes: [
    { id: 'klw-ncs1014', label: 'MHNVMKLWNTTMCNCS1014', icon: 'NCS', x: 100, y: 160, group: 'NTT Kalwa (BOM35)' },
    { id: 'klw-ncs1004', label: 'MHNVMKLWNTTMCNCS1004', icon: 'NCS', x: 100, y: 340, group: 'NTT Kalwa (BOM35)' },
    { id: 'klw-md32', label: 'KLW-MD32', icon: 'MD32', x: 280, y: 250, group: 'NTT Kalwa (BOM35)' },
    { id: 'klw-psm', label: 'KLW-PSM', icon: 'PSM', x: 420, y: 250, group: 'NTT Kalwa (BOM35)' },
    { id: 'klw-edfa-working', label: 'KLW-EDFA-Working', icon: 'EDFA', x: 560, y: 140 },
    { id: 'klw-edfa-protection', label: 'KLW-EDFA-Protection', icon: 'EDFA', x: 560, y: 360 },

    // Right side — GPX-1 (BOM05-02) equipment
    { id: 'gpx-edfa-working', label: 'GPX-1-EDFA-Working', icon: 'EDFA', x: 740, y: 140 },
    { id: 'gpx-edfa-protection', label: 'GPX-1-EDFA-Protection', icon: 'EDFA', x: 740, y: 360 },
    { id: 'gpx-psm', label: 'GPX-1-PSM', icon: 'PSM', x: 880, y: 250, group: 'GPX-1 (BOM05-02)' },
    { id: 'gpx-md32', label: 'GPX-1-MD32', icon: 'MD32', x: 1020, y: 250, group: 'GPX-1 (BOM05-02)' },
    { id: 'gpx-ncs1014', label: 'MHMUMCHNGP1MCNCS1014', icon: 'NCS', x: 1200, y: 160, group: 'GPX-1 (BOM05-02)' },
    { id: 'gpx-ncs1004', label: 'MHMUMCHNGP1MCNCS1004', icon: 'NCS', x: 1200, y: 340, group: 'GPX-1 (BOM05-02)' },
  ],
  groups: [
    { id: 'g1', name: 'NTT Kalwa (BOM35)', label: 'NTT Kalwa (BOM35)', x: 40, y: 100, width: 460, height: 320, color: '#3b82f620' },
    { id: 'g2', name: 'GPX-1 (BOM05-02)', label: 'GPX-1 (BOM05-02)', x: 820, y: 100, width: 460, height: 320, color: '#22c55e20' },
  ],
  links: [
    // Working path (top)
    { id: 'l1', source: 'klw-ncs1014', target: 'klw-md32', label: 'NCS1014', type: 'STRAIGHT', settings: { showArrows: false, smartRouting: true, avoidCrossingNodes: true, strokeWidth: 2.5, curveIntensity: 0.1, parallelOffset: 0 } },
    { id: 'l2', source: 'klw-ncs1004', target: 'klw-md32', label: 'NCS1004', type: 'DASHED', settings: { showArrows: false, smartRouting: true, avoidCrossingNodes: true, strokeWidth: 2.5, curveIntensity: 0.1, parallelOffset: 0 } },
    { id: 'l3', source: 'klw-md32', target: 'klw-psm', label: 'MD32E-C', type: 'STRAIGHT', settings: { showArrows: false, smartRouting: true, avoidCrossingNodes: true, strokeWidth: 2.5, curveIntensity: 0.1, parallelOffset: 0 } },
    { id: 'l4', source: 'klw-psm', target: 'klw-edfa-working', label: 'PSM', type: 'STRAIGHT', settings: { showArrows: false, smartRouting: true, avoidCrossingNodes: true, strokeWidth: 2.5, curveIntensity: 0.1, parallelOffset: 0 } },
    { id: 'l5', source: 'klw-edfa-working', target: 'gpx-edfa-working', label: 'C003 Via Airoli', type: 'STRAIGHT', settings: { showArrows: false, smartRouting: true, avoidCrossingNodes: true, strokeWidth: 2.5, curveIntensity: 0.1, parallelOffset: 0 } },
    { id: 'l6', source: 'gpx-edfa-working', target: 'gpx-psm', label: 'EDFA', type: 'STRAIGHT', settings: { showArrows: false, smartRouting: true, avoidCrossingNodes: true, strokeWidth: 2.5, curveIntensity: 0.1, parallelOffset: 0 } },
    { id: 'l7', source: 'gpx-psm', target: 'gpx-md32', label: 'PSM', type: 'STRAIGHT', settings: { showArrows: false, smartRouting: true, avoidCrossingNodes: true, strokeWidth: 2.5, curveIntensity: 0.1, parallelOffset: 0 } },
    { id: 'l8', source: 'gpx-md32', target: 'gpx-ncs1014', label: 'NCS1014', type: 'STRAIGHT', settings: { showArrows: false, smartRouting: true, avoidCrossingNodes: true, strokeWidth: 2.5, curveIntensity: 0.1, parallelOffset: 0 } },
    { id: 'l9', source: 'gpx-md32', target: 'gpx-ncs1004', label: 'NCS1004', type: 'DASHED', settings: { showArrows: false, smartRouting: true, avoidCrossingNodes: true, strokeWidth: 2.5, curveIntensity: 0.1, parallelOffset: 0 } },
    // Protection path (bottom)
    { id: 'l10', source: 'klw-psm', target: 'klw-edfa-protection', label: 'PSM', type: 'DASHED', settings: { showArrows: false, smartRouting: true, avoidCrossingNodes: true, strokeWidth: 2.5, curveIntensity: 0.1, parallelOffset: 0 } },
    { id: 'l11', source: 'klw-edfa-protection', target: 'gpx-edfa-protection', label: 'C004 Via Saket', type: 'DASHED', settings: { showArrows: false, smartRouting: true, avoidCrossingNodes: true, strokeWidth: 2.5, curveIntensity: 0.1, parallelOffset: 0 } },
    { id: 'l12', source: 'gpx-edfa-protection', target: 'gpx-psm', label: 'EDFA', type: 'DASHED', settings: { showArrows: false, smartRouting: true, avoidCrossingNodes: true, strokeWidth: 2.5, curveIntensity: 0.1, parallelOffset: 0 } },
  ],
};

// ============================================
// CONC DC Topology (Microsoft) — MAA CONC Network
// ============================================

const concLinkSettings = { showArrows: false, smartRouting: true, avoidCrossingNodes: true, strokeWidth: 2.5, curveIntensity: 0.1, parallelOffset: 0 };

export const CONC_DC_TOPOLOGY: ApiTopology = {
  id: 'sample-conc-microsoft',
  name: 'CONC DC Topology (Microsoft)',
  client: 'Microsoft',
  vendor: 'TLMR',
  monitorEnabled: true,
  
  nodes: [
    { id: 'maa21-dcl', label: 'MAA21 DC(L)', icon: 'DATACENTER', x: -420, y: -20, nodeLabelOffsetX: -0.5, nodeLabelOffsetY: -75.1 },
    { id: 'maa37-rng3', label: 'MAA37 RNG3', icon: 'DATACENTER', x: -240, y: 460 },
    { id: 'maa21-rng4', label: 'MAA21 RNG4', icon: 'DATACENTER', x: -140, y: -20, nodeLabelOffsetX: -0.4, nodeLabelOffsetY: -71.9 },
    { id: 'maa01-dcs', label: 'MAA01 DC(S)', icon: 'DATACENTER', x: 680, y: 200 },
    { id: 'maa20-dcm', label: 'MAA20 DC(M)', icon: 'DATACENTER', x: 520, y: 200 },
  ],
  links: [
    // MAA21 DC(L) → MAA37 RNG3 (8 links)
    { id: 'c-l1', source: 'maa21-dcl', target: 'maa37-rng3', label: 'MAA003', type: 'STRAIGHT', curveOffsetX: -157.5, curveOffsetY: 65.3, settings: concLinkSettings },
    { id: 'c-l2', source: 'maa21-dcl', target: 'maa37-rng3', label: 'MAA004', type: 'STRAIGHT', curveOffsetX: 4.4, curveOffsetY: 31.8, settings: concLinkSettings },
    { id: 'c-l3', source: 'maa21-dcl', target: 'maa37-rng3', label: 'MAA005', type: 'STRAIGHT', curveOffsetX: -39.1, curveOffsetY: 43.0, settings: concLinkSettings },
    { id: 'c-l4', source: 'maa21-dcl', target: 'maa37-rng3', label: 'MAA006', type: 'STRAIGHT', curveOffsetX: -100.5, curveOffsetY: 56.4, settings: concLinkSettings },
    { id: 'c-l5', source: 'maa21-dcl', target: 'maa37-rng3', label: 'MAA007', type: 'STRAIGHT', curveOffsetX: -215.5, curveOffsetY: 83.1, settings: concLinkSettings },
    { id: 'c-l6', source: 'maa21-dcl', target: 'maa37-rng3', label: 'MAA008', type: 'STRAIGHT', curveOffsetX: -341.8, curveOffsetY: 113.6, settings: concLinkSettings },
    { id: 'c-l7', source: 'maa21-dcl', target: 'maa37-rng3', label: 'MAA025', type: 'STRAIGHT', curveOffsetX: -406.4, curveOffsetY: 123.2, settings: concLinkSettings },
    { id: 'c-l8', source: 'maa21-dcl', target: 'maa37-rng3', label: 'MAA026', type: 'STRAIGHT', curveOffsetX: -270.3, curveOffsetY: 101.2, settings: concLinkSettings },
    // MAA37 RNG3 → MAA21 RNG4 (2 links)
    { id: 'c-l9', source: 'maa37-rng3', target: 'maa21-rng4', label: 'MAA001', type: 'STRAIGHT', curveOffsetX: -63.0, curveOffsetY: 58.4, settings: concLinkSettings },
    { id: 'c-l10', source: 'maa37-rng3', target: 'maa21-rng4', label: 'MAA002', type: 'STRAIGHT', curveOffsetX: 2.9, curveOffsetY: 10.3, settings: concLinkSettings },
    // MAA21 RNG4 → MAA01 DC(S) (4 links)
    { id: 'c-l11', source: 'maa21-rng4', target: 'maa01-dcs', label: 'MAA017', type: 'STRAIGHT', curveOffsetX: 0, curveOffsetY: 0, labelOffsetX: -1.8, labelOffsetY: -8.1, settings: concLinkSettings },
    { id: 'c-l12', source: 'maa21-rng4', target: 'maa01-dcs', label: 'MAA018', type: 'STRAIGHT', curveOffsetX: 175.6, curveOffsetY: -312.5, settings: concLinkSettings },
    { id: 'c-l13', source: 'maa21-rng4', target: 'maa01-dcs', label: 'MAA019', type: 'STRAIGHT', curveOffsetX: 195.1, curveOffsetY: -218.3, settings: concLinkSettings },
    { id: 'c-l14', source: 'maa21-rng4', target: 'maa01-dcs', label: 'MAA020', type: 'STRAIGHT', curveOffsetX: 221.2, curveOffsetY: -93.2, settings: concLinkSettings },
    // MAA21 RNG4 → MAA20 DC(M) (4 links)
    { id: 'c-l15', source: 'maa21-rng4', target: 'maa20-dcm', label: 'MAA021', type: 'STRAIGHT', curveOffsetX: 78.6, curveOffsetY: 29.9, settings: concLinkSettings },
    { id: 'c-l16', source: 'maa21-rng4', target: 'maa20-dcm', label: 'MAA022', type: 'STRAIGHT', curveOffsetX: 105.8, curveOffsetY: -0.9, settings: concLinkSettings },
    { id: 'c-l17', source: 'maa21-rng4', target: 'maa20-dcm', label: 'MAA023', type: 'STRAIGHT', curveOffsetX: 48.6, curveOffsetY: 66.2, settings: concLinkSettings },
    { id: 'c-l18', source: 'maa21-rng4', target: 'maa20-dcm', label: 'MAA024', type: 'STRAIGHT', curveOffsetX: 33.2, curveOffsetY: 113.4, settings: concLinkSettings },
    // MAA20 DC(M) → MAA37 RNG3 (4 links)
    { id: 'c-l19', source: 'maa20-dcm', target: 'maa37-rng3', label: 'MAA013', type: 'STRAIGHT', curveOffsetX: 54.8, curveOffsetY: 19.0, labelOffsetX: 31.8, labelOffsetY: -15.7, settings: concLinkSettings },
    { id: 'c-l20', source: 'maa20-dcm', target: 'maa37-rng3', label: 'MAA014', type: 'STRAIGHT', curveOffsetX: 25.2, curveOffsetY: -14.0, labelOffsetX: 28.0, labelOffsetY: -14.9, settings: concLinkSettings },
    { id: 'c-l21', source: 'maa20-dcm', target: 'maa37-rng3', label: 'MAA015', type: 'STRAIGHT', curveOffsetX: 18.4, curveOffsetY: -118.5, labelOffsetX: 12.1, labelOffsetY: -11.0, settings: concLinkSettings },
    { id: 'c-l22', source: 'maa20-dcm', target: 'maa37-rng3', label: 'MAA016', type: 'STRAIGHT', curveOffsetX: 47.0, curveOffsetY: -73.8, labelOffsetX: 19.5, labelOffsetY: -12.6, settings: concLinkSettings },
    // MAA37 RNG3 → MAA01 DC(S) (4 links)
    { id: 'c-l23', source: 'maa37-rng3', target: 'maa01-dcs', label: 'MAA009', type: 'STRAIGHT', curveOffsetX: 74.0, curveOffsetY: 125.6, settings: concLinkSettings },
    { id: 'c-l24', source: 'maa37-rng3', target: 'maa01-dcs', label: 'MAA010', type: 'STRAIGHT', curveOffsetX: 96.0, curveOffsetY: 235.6, settings: concLinkSettings },
    { id: 'c-l25', source: 'maa37-rng3', target: 'maa01-dcs', label: 'MAA011', type: 'STRAIGHT', curveOffsetX: 181.7, curveOffsetY: 273.4, settings: concLinkSettings },
    { id: 'c-l26', source: 'maa37-rng3', target: 'maa01-dcs', label: 'MAA012', type: 'STRAIGHT', curveOffsetX: 94.6, curveOffsetY: 170.7, settings: concLinkSettings },
  ],
};

/** Sample link alarms for the CONC topology */
export const CONC_LINK_ALARMS: ApiAlarm[] = [
  { traptype: 'Span Loss High', TrapSeverity: 'Critical', source_label: 'MAA21 DC(L)', target_label: 'MAA37 RNG3', alarmName: 'Span Loss High', severity: 'CRITICAL', max_rcvd_time: '2025-03-30 23:15:01' },
  { traptype: 'Signal Degraded', TrapSeverity: 'Major', source_label: 'MAA20 DC(M)', target_label: 'MAA37 RNG3', alarmName: 'Signal Degraded', severity: 'MAJOR', max_rcvd_time: '2025-03-30 22:10:00' },
];

export const CONC_NODE_ALARMS: ApiNodeAlarm[] = [
  { node: 'maa37-rng3', alarmName: 'Power Supply Warning', severity: 'WARNING' },
];

/** Sample link alarms for testing alarm visualization */
export const SAMPLE_LINK_ALARMS: ApiAlarm[] = [
  { traptype: 'Span Loss High', TrapSeverity: 'Critical', source_label: 'KLW-EDFA-Working', target_label: 'GPX-1-EDFA-Working', alarmName: 'Span Loss High', severity: 'CRITICAL', max_rcvd_time: '2025-03-30 23:15:01' },
  { traptype: 'Signal Degraded', TrapSeverity: 'Major', source_label: 'KLW-PSM', target_label: 'KLW-EDFA-Protection', alarmName: 'Signal Degraded', severity: 'MAJOR', max_rcvd_time: '2025-03-30 22:10:00' },
];

/** Sample node alarms for testing node alarm badges */
export const SAMPLE_NODE_ALARMS: ApiNodeAlarm[] = [
  { node: 'klw-ncs1014', alarmName: 'Power Supply Fault', severity: 'CRITICAL' },
  { node: 'klw-ncs1014', alarmName: 'Temperature High', severity: 'WARNING' },
  { node: 'klw-ncs1014', alarmName: 'Fan Tray Missing', severity: 'MINOR' },
  { node: 'gpx-ncs1004', alarmName: 'Port Error', severity: 'MAJOR' },
];
