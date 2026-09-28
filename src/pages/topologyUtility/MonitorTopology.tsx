import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { AlarmNotification } from './components/AlarmNotification';
import { getNodeLabelPosition, getLinkLabelPosition, getLinkLabelAngle, computeLinkPath } from './utils/renderHelpers';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import * as d3 from 'd3';
import { toast } from 'sonner';
import {
  ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2,
  AlertTriangle, Tag, Tags, Bell, ChevronDown, ChevronUp, X,
  Clock, Radio, Ruler, Activity, Network, ChevronRight, Loader2, Type,
  Gauge, Download as DownloadIcon, Info, GitBranch, Minus,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Toggle } from '../../components/ui/toggle';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../components/ui/tooltip';
import { Separator } from '../../components/ui/separator';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { DataGrid, type GridColDef, GridToolbarContainer, GridToolbarQuickFilter, GridToolbarExport } from '@mui/x-data-grid';
import { Box as MuiBox } from '@mui/material';

import type { ApiTopology, ApiAlarm, ApiNodeAlarm, ApiDisplaySettings } from './types';
import * as topologyApi from './services/topologyApi';
import type { ConnectivityRecord, SpanLossRecord } from './services/topologyApi';
import { SAMPLE_TOPOLOGY, SAMPLE_LINK_ALARMS, SAMPLE_NODE_ALARMS, CONC_DC_TOPOLOGY, CONC_LINK_ALARMS, CONC_NODE_ALARMS } from './data/sampleTopology';
import { useForceLightMode } from './hooks/useForceLightMode';
import { renderEquipmentIcon, resolveIconType } from './utils/nodeIcons';
import { renderGroupBoxes } from './utils/groupRenderer';
import { AppearancePanel } from './components/AppearancePanel';

import { TopologyConnectivityDialog } from './components/TopologyConnectivityDialog';
import { MonitoredAlarmsDialog } from './components/MonitoredAlarmsDialog';
import { AlarmDetailsDialog } from './components/AlarmDetailsDialog';
import { AllAlarmsDialog } from './components/AllAlarmsDialog';
import {
  ZOOM_EXTENT,
  FIT_PADDING,
  zoomIn as canvasZoomIn,
  zoomOut as canvasZoomOut,
  applyFitToView,
  apply1to1View,
  getNodesBoundingBox,
  computeFitTransform,
} from './utils/canvasUtils';
import { StompAlarmData, useStompAlarms } from './hooks/useStompAlarms';

type AlarmDetail = {
  alarmName: string;
  severity: string;
  receivedOn?: string;
  clearedOn?: string;
  spanLossTx?: string;
  spanLossRx?: string;
  fiberDistance?: string;
  designLoss?: string;
};

type DetailPanel = {
  type: 'node' | 'link' | 'alarms';
  title: string;
  alarms: AlarmDetail[];
  details?: Record<string, string>;
};

export default function MonitorTopology() {
  useForceLightMode();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const vendor = searchParams.get('vendor') || undefined;
  const navigate = useNavigate();
  const isDark = false;

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hasInitialFit = useRef(false);
  const transformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);

  const [topology, setTopology] = useState<ApiTopology | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [alarms, setAlarms] = useState<ApiAlarm[]>([]);
  const [nodeAlarms, setNodeAlarms] = useState<ApiNodeAlarm[]>([]);
  const [legendOpen, setLegendOpen] = useState(true);
  const [isActualSize, setIsActualSize] = useState(false);
  const [showAppearance, setShowAppearance] = useState(false);
  const [displaySettings, setDisplaySettings] = useState<{ nodeLabelSize: number; linkLabelSize: number; linkDisplayMode: 'merged' | 'multi' }>({ nodeLabelSize: 10, linkLabelSize: 9, linkDisplayMode: 'merged' });
  const [detailPanel, setDetailPanel] = useState<DetailPanel | null>(null);
  const [connectivity, setConnectivity] = useState<ConnectivityRecord[]>([]);
  const [connectivityLoading, setConnectivityLoading] = useState(false);
  const [showConnectivity, setShowConnectivity] = useState(false);
  const [showTrafficAnimation, setShowTrafficAnimation] = useState(true);
  const [showSpanLossPanel, setShowSpanLossPanel] = useState(false);
  const [wsLastUpdated, setWsLastUpdated] = useState<Date | null>(null);
  const [spanLossList, setSpanLossList] = useState<SpanLossRecord[]>([]);
  const [monitoredTraps, setMonitoredTraps] = useState<string[]>([]);
  const [showConnectivityView, setShowConnectivityView] = useState(false);
  const [showMonitoredAlarms, setShowMonitoredAlarms] = useState(false);
  const [showAllAlarmsDialog, setShowAllAlarmsDialog] = useState(false);
  const [alarmDialogData, setAlarmDialogData] = useState<ApiAlarm | null>(null);

  useEffect(() => {
    hasInitialFit.current = false;
  }, [id]);

  useEffect(() => {
    if (!id) {
      setTopology(SAMPLE_TOPOLOGY);
      setAlarms(SAMPLE_LINK_ALARMS);

      return;
    }
    topologyApi.getTopology(id, vendor).then(saved => {
      if (saved) {
        setTopology(saved);
        if (saved.displaySettings) {
          setDisplaySettings({
            nodeLabelSize: saved.displaySettings.nodeLabelSize ?? 10,
            linkLabelSize: saved.displaySettings.linkLabelSize ?? 9,
            linkDisplayMode: (saved.displaySettings as any).linkDisplayMode === 'multi' ? 'multi' : 'merged',
          });
        }
        topologyApi.fetchAlarms(id, vendor).then(setAlarms);
      } else {
        toast.error('Topology not found');
        navigate('/');
      }
    });
  }, [id, vendor]);

  // Load superimposed alarm trap-types for this topology
  useEffect(() => {
    if (!id) { setMonitoredTraps([]); return; }
    let cancelled = false;
    topologyApi.getAlarmSuperimpose(id, vendor).then((rows) => {
      if (cancelled) return;
      const traps = Array.from(new Set(rows.map(r => r.trapType).filter(Boolean)));
      setMonitoredTraps(traps);
    });
    return () => { cancelled = true; };
  }, [id, vendor]);

  // ─── STOMP WebSocket for live link alarms ───
  const handleStompAlarms = useCallback((incoming: StompAlarmData[]) => {
    // Map STOMP alarm data to ApiAlarm format
    const mapped: ApiAlarm[] = incoming.map(a => ({
      traptype: a.traptype || a.alarmName || 'Unknown',
      TrapSeverity: a.TrapSeverity || a.severity || 'WARNING',
      link_id: a.link_id || (a as any).linkId,
      source_label: a.source_label || a.sourceNode || '',
      target_label: a.target_label || a.destNode || '',
      alarmName: a.alarmName || a.traptype || 'Unknown Alarm',
      severity: (a.severity || a.TrapSeverity || 'WARNING').toUpperCase(),
      max_rcvd_time: a.max_rcvd_time || (a as any).rcvd_Time || new Date().toISOString(),
      vendor: a.vendor,
      alarmid: a.alarmid || a.alarmId,
      client: a.client,
      sourceNode: a.sourceNode,
      sourcePort: a.sourcePort,
      destNode: a.destNode,
      destPort: a.destPort,
    }));
    setAlarms(mapped);
    setWsLastUpdated(new Date());
  }, []);

  const { isConnected: wsConnected } = useStompAlarms({
    enabled: !!id && !!vendor,
    vendor,
    topologyId: id,
    onAlarms: handleStompAlarms,
  });

  useEffect(() => {
    if (!id || wsConnected) return;
    const interval = setInterval(() => {
      topologyApi.fetchAlarms(id, vendor).then(setAlarms);
    }, 15000);
    return () => clearInterval(interval);
  }, [id, vendor, wsConnected]);

  useEffect(() => {
    if (!id) {
      setSpanLossList([]);
      return;
    }
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    const load = () => {
      topologyApi.fetchSpanLoss(id, vendor).then(data => {
        if (!cancelled) setSpanLossList(data);
      });
    };

    load(); 

    const now = new Date();
    const minutes = now.getMinutes();
    const nextQuarter = Math.ceil((minutes + 1) / 15) * 15; 
    const next = new Date(now);
    next.setMinutes(nextQuarter, 0, 0);
    const msUntilNext = next.getTime() - now.getTime();

    const timeoutId = setTimeout(() => {
      if (cancelled) return;
      load();
      intervalId = setInterval(load, 15 * 60 * 1000);
    }, msUntilNext);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [id, vendor]);

  const spanLossByLink = useMemo(() => {
    const byId = new Map<string, SpanLossRecord>();
    const byLabels = new Map<string, SpanLossRecord>();
    const labelKey = (a: string, b: string) => [a, b].sort().join('||');
    spanLossList.forEach(rec => {
      if (rec.link_id) byId.set(rec.link_id, rec);
      if (rec.source_label && rec.target_label) {
        byLabels.set(labelKey(rec.source_label, rec.target_label), rec);
      }
    });
    return { byId, byLabels, labelKey };
  }, [spanLossList]);

  const getSpanLossForLink = useCallback(
    (linkId: string, srcLabel: string, tgtLabel: string): SpanLossRecord | undefined => {
      return (
        spanLossByLink.byId.get(linkId) ||
        spanLossByLink.byLabels.get(spanLossByLink.labelKey(srcLabel, tgtLabel))
      );
    },
    [spanLossByLink],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const update = () => {
      const rect = container.getBoundingClientRect();
      const w = rect.width || window.innerWidth;
      const h = rect.height || (window.innerHeight - rect.top);
      if (w > 0 && h > 0) setDimensions({ width: w, height: Math.max(h, 400) });
    };
    const timer = setTimeout(update, 100);
    const ro = new ResizeObserver(() => requestAnimationFrame(update));
    ro.observe(container);
    return () => { clearTimeout(timer); ro.disconnect(); };
  }, [isFullscreen]);

  const getLinkAlarm = useCallback((linkId: string, srcId: string, tgtId: string): ApiAlarm | undefined => {
    if (!topology) return undefined;

    const byLinkId = alarms.find(a => (a.link_id || (a as any).linkId) === linkId);
    if (byLinkId) return byLinkId;
    const srcNode = topology.nodes.find(n => n.id === srcId);
    const tgtNode = topology.nodes.find(n => n.id === tgtId);
    if (!srcNode || !tgtNode) return undefined;
    return alarms.find(a => {
      if (a.link_id || (a as any).linkId || a.sourceNode) return false;
      return (a.source_label === srcNode.label && a.target_label === tgtNode.label) ||
             (a.source_label === tgtNode.label && a.target_label === srcNode.label);
    });
  }, [alarms, topology]);

  const getNodeAlarmCount = useCallback((nodeId: string): number => {
    return nodeAlarms.filter(a => a.node === nodeId).length;
  }, [nodeAlarms]);

  const getNodeSeverity = useCallback((nodeId: string): string | null => {
    const na = nodeAlarms.filter(a => a.node === nodeId);
    if (na.length === 0) return null;
    const priority = ['CRITICAL', 'MAJOR', 'MINOR', 'WARNING', 'CLEAR'];
    for (const p of priority) { if (na.some(a => a.severity === p)) return p; }
    return na[0].severity;
  }, [nodeAlarms]);

  const activeLinkAlarms = alarms.filter(a => a.severity !== 'CLEAR').length;
  const activeNodeAlarms = nodeAlarms.filter(a => a.severity !== 'CLEAR').length;
  const totalActiveAlarms = activeLinkAlarms + activeNodeAlarms;

  const handleNodeClick = useCallback((nodeId: string) => {
    if (!topology) return;
    const node = topology.nodes.find(n => n.id === nodeId);
    const na = nodeAlarms.filter(a => a.node === nodeId);
    const alarmCount = na.length;

    setDetailPanel({
      type: 'node',
      title: node?.label || nodeId,
      alarms: na.map(a => ({ alarmName: a.alarmName, severity: a.severity })),
      details: {
        'Node ID': nodeId,
        'Label': node?.label || '-',
        'Icon': node?.icon || '-',
        'Status': alarmCount > 0 ? `${alarmCount} alarm(s)` : 'Normal',
      },
    });
    setConnectivity([]);
    setShowConnectivity(false);
  }, [topology, nodeAlarms]);

  const handleLinkClick = useCallback((linkId: string, srcId: string, tgtId: string, linkLabel?: string) => {
    if (!topology) return;
    const src = topology.nodes.find(n => n.id === srcId);
    const tgt = topology.nodes.find(n => n.id === tgtId);
    const alarm = getLinkAlarm(linkId, srcId, tgtId);
    const hasAlarm = alarm && alarm.severity !== 'CLEAR';

    setDetailPanel({
      type: 'link',
      title: linkLabel || `${src?.label || srcId} → ${tgt?.label || tgtId}`,
      alarms: hasAlarm ? [{
        alarmName: alarm.alarmName,
        severity: alarm.severity,
        receivedOn: alarm.max_rcvd_time || 'NA',
        clearedOn: 'NA',
        spanLossTx: 'NA',
        spanLossRx: 'NA',
        fiberDistance: 'NA',
        designLoss: 'NA',
      }] : [],
      details: {
        'Source': src?.label || srcId,
        'Destination': tgt?.label || tgtId,
        'Status': hasAlarm ? `ALARM — ${alarm.severity}` : 'Normal',
      },
    });
    setShowConnectivity(false);
    setConnectivityLoading(true);
    topologyApi.fetchConnectivity(id!, srcId, tgtId, vendor).then(data => {
      setConnectivity(data);
      setConnectivityLoading(false);
    }).catch(() => {
      setConnectivity([]);
      setConnectivityLoading(false);
    });
  }, [topology, getLinkAlarm, id]);

  const handleShowAllAlarms = useCallback(() => {
    setShowAllAlarmsDialog(true);
  }, []);

  const renderTopology = useCallback(() => {
    if (!svgRef.current || !topology || topology.nodes.length === 0) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    const { width, height } = dimensions;

    const defs = svg.append('defs');
    const glow = defs.append('filter').attr('id', 'glow-m').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    glow.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
    const m = glow.append('feMerge');
    m.append('feMergeNode').attr('in', 'coloredBlur');
    m.append('feMergeNode').attr('in', 'SourceGraphic');

    ['green', 'red'].forEach(color => {
      defs.append('marker')
        .attr('id', `arrow-m-${color}`).attr('viewBox', '0 -5 10 10')
        .attr('refX', 10).attr('refY', 0).attr('markerWidth', 6).attr('markerHeight', 6).attr('orient', 'auto')
        .append('path').attr('d', 'M0,-5L10,0L0,5').attr('fill', color === 'green' ? '#22c55e' : '#ef4444');
    });

    const viewStorageKey = `topology-view-${id}${isFullscreen ? '-fs' : ''}`;
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent(ZOOM_EXTENT)
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
        transformRef.current = event.transform;
        try {
          localStorage.setItem(viewStorageKey, JSON.stringify({ k: event.transform.k, x: event.transform.x, y: event.transform.y }));
        } catch {}
      });
    zoomRef.current = zoom;
    svg.call(zoom);
    const container = svg.append('g');

    const gridSize = 50;
    const gridG = container.append('g');
    const ext = Math.max(width, height) * 3;
    for (let x = -ext / 2; x < ext; x += gridSize) {
      gridG.append('line').attr('x1', x).attr('y1', -ext / 2).attr('x2', x).attr('y2', ext)
        .attr('stroke', isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)').attr('stroke-width', 0.5);
    }
    for (let y = -ext / 2; y < ext; y += gridSize) {
      gridG.append('line').attr('x1', -ext / 2).attr('y1', y).attr('x2', ext).attr('y2', y)
        .attr('stroke', isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)').attr('stroke-width', 0.5);
    }

    const nodeMap = new Map(topology.nodes.map(n => [n.id, n]));
    const tooltipDiv = d3.select(tooltipRef.current);

    const linkPairMap = new Map<string, typeof topology.links>();
    topology.links.forEach(link => {
      const key = [link.source, link.target].sort().join('|');
      if (!linkPairMap.has(key)) linkPairMap.set(key, []);
      linkPairMap.get(key)!.push(link);
    });

    renderGroupBoxes(container as any, topology.groups);

    const linkG = container.append('g');

    const getAlarmingPorts = (group: typeof topology.links): string[] => {
      const ports: string[] = [];
      group.forEach(l => {
        const al = getLinkAlarm(l.id, l.source, l.target);
        if (al && al.severity !== 'CLEAR') {
          const p = l.srcPortName || l.dstPortName || l.label;
          if (p) ports.push(p);
        }
      });
      return ports;
    };

    const isMultiMode = displaySettings.linkDisplayMode === 'multi';

    linkPairMap.forEach((group) => {
      const src = nodeMap.get(group[0].source);
      const tgt = nodeMap.get(group[0].target);
      if (!src || !tgt) return;

      const renderList = isMultiMode
        ? group.map((l, idx) => ({ l, idx, total: group.length }))
        : [{ l: group[0], idx: 0, total: 1 }];

      renderList.forEach(({ l: rep, idx, total }) => {
        const alarmingPorts = isMultiMode
          ? (() => {
              const al = getLinkAlarm(rep.id, rep.source, rep.target);
              return al && al.severity !== 'CLEAR'
                ? [rep.srcPortName || rep.dstPortName || rep.label || '—']
                : [];
            })()
          : getAlarmingPorts(group);
        const hasAlarm = alarmingPorts.length > 0;
        const linkColor = hasAlarm ? '#ef4444' : '#22c55e';
        const isDashed = rep.type === 'DASHED' || rep.type === 'DOTTED';
        const sw = rep.settings?.strokeWidth || 2.5;

        const pathResult = computeLinkPath({
          sx: src.x, sy: src.y, tx: tgt.x, ty: tgt.y,
          curveOffsetX: rep.curveOffsetX,
          curveOffsetY: rep.curveOffsetY,
          parallelCount: total,
          parallelIndex: idx,
          linkType: rep.type,
        });
        const { pathData, perpX, perpY } = pathResult;

        linkG.append('path')
          .attr('d', pathData).attr('fill', 'none')
          .attr('stroke', 'rgba(0,0,0,0.1)').attr('stroke-width', sw + 3)
          .attr('stroke-linecap', 'round');

        if (hasAlarm) {
          linkG.append('path')
            .attr('d', pathData).attr('fill', 'none')
            .attr('stroke', '#ef4444').attr('stroke-width', sw + 6).attr('opacity', 0.25)
            .attr('filter', 'url(#glow-m)').attr('class', 'alarm-pulse-line');
        }

        const mainPath = linkG.append('path')
          .attr('d', pathData).attr('fill', 'none')
          .attr('stroke', linkColor).attr('stroke-width', sw)
          .attr('stroke-linecap', 'round').attr('stroke-dasharray', isDashed ? '8,4' : 'none');

        const pathEl = mainPath.node();

        linkG.append('path')
          .attr('d', pathData).attr('fill', 'none')
          .attr('stroke', 'transparent').attr('stroke-width', 15).attr('cursor', 'pointer')
          .on('mouseenter', (event: MouseEvent) => {
            let html = `<div style="min-width:300px;">`;
            if (isMultiMode) {
              const al = getLinkAlarm(rep.id, rep.source, rep.target);
              const isAlarm = al && al.severity !== 'CLEAR';
              const statusText = isAlarm ? `ALARM (${al!.severity})` : 'Normal';
              html += `<div style="display:flex;align-items:center;gap:8px;padding-bottom:8px;border-bottom:1px solid hsl(var(--border));margin-bottom:8px;">`;
              html += `<div style="font-weight:600;font-size:14px;">${src.label} → ${tgt.label}</div>`;
              html += `<div style="margin-left:auto;font-size:10px;padding:2px 8px;border-radius:9999px;background:${isAlarm ? 'hsl(var(--destructive))' : '#22c55e'};color:white;font-weight:600;">${statusText}</div>`;
              html += `</div>`;
              html += `<div style="font-size:11px;font-family:monospace;">${rep.srcPortName || '—'} → ${rep.dstPortName || '—'}</div>`;
              if (isAlarm && al) html += `<div style="margin-top:6px;font-size:11px;color:hsl(var(--destructive));">${al.alarmName}</div>`;
            } else {
              const statusText = hasAlarm ? `ALARM (${alarmingPorts.length}/${group.length} port${group.length > 1 ? 's' : ''})` : 'Normal';
              html += `<div style="display:flex;align-items:center;gap:8px;padding-bottom:8px;border-bottom:1px solid hsl(var(--border));margin-bottom:8px;">`;
              html += `<div style="font-weight:600;font-size:14px;">${src.label} → ${tgt.label}</div>`;
              html += `<div style="margin-left:auto;font-size:10px;padding:2px 8px;border-radius:9999px;background:${hasAlarm ? 'hsl(var(--destructive))' : '#22c55e'};color:white;font-weight:600;">${statusText}</div>`;
              html += `</div>`;
              html += `<div style="font-size:11px;color:hsl(var(--muted-foreground));margin-bottom:6px;">${group.length} port-connection${group.length > 1 ? 's' : ''}</div>`;
              html += `<div style="max-height:180px;overflow:auto;">`;
              group.forEach(l => {
                const al = getLinkAlarm(l.id, l.source, l.target);
                const isAlarm = al && al.severity !== 'CLEAR';
                const dot = isAlarm ? '#ef4444' : '#22c55e';
                html += `<div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:11px;border-bottom:1px solid hsl(var(--border)/0.4);">`;
                html += `<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${dot};"></span>`;
                html += `<span style="font-family:monospace;">${l.srcPortName || '—'}</span>`;
                html += `<span style="color:hsl(var(--muted-foreground));">→</span>`;
                html += `<span style="font-family:monospace;">${l.dstPortName || '—'}</span>`;
                if (isAlarm && al) html += `<span style="margin-left:auto;font-size:9px;padding:1px 6px;border-radius:9999px;background:hsl(var(--destructive));color:white;">${al.severity}</span>`;
                html += `</div>`;
              });
              html += `</div>`;
            }
            html += `</div>`;
            tooltipDiv.html(html).style('display', 'block').style('left', `${event.clientX + 12}px`).style('top', `${event.clientY - 10}px`);
          })
          .on('mousemove', (event: MouseEvent) => tooltipDiv.style('left', `${event.clientX + 12}px`).style('top', `${event.clientY - 10}px`))
          .on('mouseleave', () => tooltipDiv.style('display', 'none'))
          .on('click', () => {
            const linksForPanel = isMultiMode ? [rep] : group;
            setDetailPanel({
              type: 'link',
              title: `${src.label} → ${tgt.label}`,
              alarms: linksForPanel
                .map(l => ({ l, a: getLinkAlarm(l.id, l.source, l.target) }))
                .filter(x => x.a && x.a.severity !== 'CLEAR')
                .map(({ l, a }) => ({
                  alarmName: `${a!.alarmName}  (${l.srcPortName || '—'} → ${l.dstPortName || '—'})`,
                  severity: a!.severity,
                  receivedOn: a!.max_rcvd_time || 'NA',
                  clearedOn: 'NA',
                  spanLossTx: 'NA', spanLossRx: 'NA', fiberDistance: 'NA', designLoss: 'NA',
                })),
              details: isMultiMode
                ? {
                    'Source': src.label, 'Destination': tgt.label,
                    'Source Port': rep.srcPortName || '—',
                    'Destination Port': rep.dstPortName || '—',
                    'Status': hasAlarm ? 'ALARM' : 'Normal',
                  }
                : {
                    'Source': src.label, 'Destination': tgt.label,
                    'Port Connections': String(group.length),
                    'Alarming Ports': hasAlarm ? alarmingPorts.join(', ') : '—',
                    'Status': hasAlarm ? `ALARM — ${alarmingPorts.length}/${group.length}` : 'Normal',
                  },
            });
            setShowConnectivity(false);
          });

        if (showLabels && pathEl) {
          const totalLen = pathEl.getTotalLength();
          const labelPt = pathEl.getPointAtLength(totalLen / 2);
          const labelPos = getLinkLabelPosition(labelPt.x, labelPt.y, perpX, perpY, rep.labelOffsetX, rep.labelOffsetY);
          const labelAngle = getLinkLabelAngle(pathEl);

          let labelText = '';
          if (isMultiMode) {
            if (rep.label) {
              labelText = rep.label;
            } else if (rep.srcPortName || rep.dstPortName) {
              labelText = `${rep.srcPortName || ''}${rep.srcPortName && rep.dstPortName ? ' → ' : ''}${rep.dstPortName || ''}`;
            }
            if (hasAlarm && !labelText) {
              labelText = rep.srcPortName || rep.dstPortName || '';
            }
          } else {
            if (rep.label) {
              labelText = group.length > 1 ? `${rep.label} · ${group.length} ports` : rep.label;
            } else if (group.length > 1) {
              labelText = `${group.length} ports`;
            } else if (rep.srcPortName || rep.dstPortName) {
              labelText = `${rep.srcPortName || ''}${rep.srcPortName && rep.dstPortName ? ' → ' : ''}${rep.dstPortName || ''}`;
            }
            if (hasAlarm) {
              const shown = alarmingPorts.length <= 3
                ? alarmingPorts.join(', ')
                : `${alarmingPorts.slice(0, 3).join(', ')} +${alarmingPorts.length - 3}`;
              const alarmSuffix = group.length > 1
                ? `${shown}  (${alarmingPorts.length}/${group.length} ports)`
                : shown;
              labelText = labelText ? `${labelText} — ${alarmSuffix}` : alarmSuffix;
            }
          }

          if (labelText) {
            linkG.append('text')
              .attr('x', labelPos.x).attr('y', labelPos.y)
              .attr('text-anchor', 'middle')
              .attr('font-size', `${displaySettings.linkLabelSize}px`).attr('font-weight', '500')
              .attr('fill', hasAlarm ? '#ef4444' : (isDark ? '#e5e7eb' : '#374151'))
              .attr('transform', `rotate(${labelAngle}, ${labelPos.x}, ${labelPos.y})`)
              .text(labelText);
          }
        }
      });
    });

    if (showTrafficAnimation) {
      const particleG = container.append('g').attr('class', 'traffic-particles');
      linkPairMap.forEach((group) => {
        const rep = group[0];
        const src = nodeMap.get(rep.source);
        const tgt = nodeMap.get(rep.target);
        if (!src || !tgt) return;

        const pathResult = computeLinkPath({
          sx: src.x, sy: src.y, tx: tgt.x, ty: tgt.y,
          curveOffsetX: rep.curveOffsetX,
          curveOffsetY: rep.curveOffsetY,
          parallelCount: 1, parallelIndex: 0,
          linkType: rep.type,
        });

        const hasAlarm = getAlarmingPorts(group).length > 0;

        if (hasAlarm) {
          const tempPath = particleG.append('path').attr('d', pathResult.pathData).attr('fill', 'none').attr('stroke', 'none');
          const pathNode = tempPath.node() as SVGPathElement;
          const totalLen = pathNode.getTotalLength();
          const centerPt = pathNode.getPointAtLength(totalLen / 2);
          tempPath.remove();
          const midX = centerPt.x, midY = centerPt.y;

          const pulse = particleG.append('circle').attr('cx', midX).attr('cy', midY).attr('r', 0).attr('fill', 'none').attr('stroke', '#ef4444').attr('stroke-width', 1.5);
          pulse.append('animate').attr('attributeName', 'r').attr('values', '3;10;3').attr('dur', '1.5s').attr('repeatCount', 'indefinite');
          pulse.append('animate').attr('attributeName', 'opacity').attr('values', '0.8;0.1;0.8').attr('dur', '1.5s').attr('repeatCount', 'indefinite');

          particleG.append('circle').attr('cx', midX).attr('cy', midY).attr('r', 5).attr('fill', '#ef4444').attr('opacity', 0.35).attr('filter', 'url(#glow-m)');

          const crossSize = 4;
          const crossG = particleG.append('g').attr('transform', `translate(${midX},${midY})`);
          crossG.append('line').attr('x1', -crossSize).attr('y1', -crossSize).attr('x2', crossSize).attr('y2', crossSize).attr('stroke', '#ef4444').attr('stroke-width', 2).attr('stroke-linecap', 'round');
          crossG.append('line').attr('x1', crossSize).attr('y1', -crossSize).attr('x2', -crossSize).attr('y2', crossSize).attr('stroke', '#ef4444').attr('stroke-width', 2).attr('stroke-linecap', 'round');
          crossG.append('animate').attr('attributeName', 'opacity').attr('values', '1;0.3;1').attr('dur', '1.5s').attr('repeatCount', 'indefinite');
        } else {
          const particleColor = '#22c55e';
          const duration = 5;
          const glow2 = particleG.append('circle').attr('r', 4).attr('fill', particleColor).attr('opacity', 0.2).attr('filter', 'url(#glow-m)');
          glow2.append('animateMotion').attr('dur', `${duration}s`).attr('repeatCount', 'indefinite').attr('path', pathResult.pathData);
          const dot = particleG.append('circle').attr('r', 2).attr('fill', particleColor).attr('opacity', 0.9);
          dot.append('animateMotion').attr('dur', `${duration}s`).attr('repeatCount', 'indefinite').attr('path', pathResult.pathData);
        }
      });
    }

    const nodeG = container.append('g');
    topology.nodes.forEach(node => {
      const alarmCount = getNodeAlarmCount(node.id);
      const iconType = resolveIconType(node.icon);

      const g = nodeG.append('g')
        .attr('transform', `translate(${node.x}, ${node.y})`)
        .attr('cursor', 'pointer')
        .on('click', (event: MouseEvent) => { event.stopPropagation(); handleNodeClick(node.id); });

      if (alarmCount > 0) {
        const pulseCircle = g.append('circle').attr('r', 35).attr('fill', '#ef4444').attr('opacity', 0.2);
        const animatePulse = () => {
          pulseCircle.attr('r', 35).attr('opacity', 0.25)
            .transition().duration(1000).ease(d3.easeSinInOut).attr('r', 45).attr('opacity', 0.05)
            .transition().duration(1000).ease(d3.easeSinInOut).attr('r', 35).attr('opacity', 0.25)
            .on('end', animatePulse);
        };
        animatePulse();
      }

      renderEquipmentIcon(g as any, iconType, { isDark, isAlarmed: alarmCount > 0 });

      if (alarmCount > 0) {
        const badgeG = g.append('g').attr('transform', 'translate(22, -22)');
        badgeG.append('circle').attr('r', 11).attr('fill', '#ef4444').attr('stroke', isDark ? '#0f172a' : '#ffffff').attr('stroke-width', 2);
        badgeG.append('text').attr('text-anchor', 'middle').attr('y', 4).attr('font-size', '10px').attr('font-weight', '700').attr('fill', '#ffffff')
          .text(alarmCount > 9 ? '9+' : String(alarmCount));
      }

      if (showLabels) {
        const labelPos = getNodeLabelPosition(node.nodeLabelOffsetX, node.nodeLabelOffsetY);
        g.append('text').attr('x', labelPos.x).attr('y', labelPos.y).attr('text-anchor', 'middle')
          .attr('font-size', `${displaySettings.nodeLabelSize}px`).attr('font-weight', '600').attr('fill', isDark ? '#f3f4f6' : '#111827').text(node.label);
      }
    });

    svg.on('click', () => {});

    svg.append('style').text(`
      @keyframes alarmPulse { 0%, 100% { opacity: 0.25; } 50% { opacity: 0.05; } }
      .alarm-pulse-line { animation: alarmPulse 2s ease-in-out infinite; }
    `);

    if (topology.nodes.length > 0) {
      if (!hasInitialFit.current) {
        hasInitialFit.current = true;
        let restored = false;

        try {
          const saved = localStorage.getItem(viewStorageKey);
          if (saved) {
            const { k, x, y } = JSON.parse(saved);
            if (typeof k === 'number' && typeof x === 'number' && typeof y === 'number' && k > 0) {
              const transform = d3.zoomIdentity.translate(x, y).scale(k);
              svg.call(zoom.transform, transform);
              transformRef.current = transform;
              restored = true;
            }
          }
        } catch {}

        if (!restored && topology.defaultViewport) {
          const { k, x, y } = topology.defaultViewport;
          if (typeof k === 'number' && k > 0) {
            const transform = d3.zoomIdentity.translate(x, y).scale(k);
            svg.call(zoom.transform, transform);
            transformRef.current = transform;
            restored = true;
          }
        }
        
        if (!restored) {
          const bbox = getNodesBoundingBox(topology.nodes);
          if (bbox) {
            const transform = computeFitTransform(bbox, width, height);
            svg.call(zoom.transform, transform);
            transformRef.current = transform;
          }
        }
      } else {
        svg.call(zoom.transform, transformRef.current);
      }
    }
  }, [topology, dimensions, isDark, alarms, nodeAlarms, showLabels, displaySettings, showTrafficAnimation, getLinkAlarm, getNodeAlarmCount, getNodeSeverity, getSpanLossForLink, handleNodeClick, handleLinkClick, id, isFullscreen]);

  useEffect(() => { renderTopology(); }, [renderTopology]);

  const handleResetView = useCallback(() => {
    if (!topology || !svgRef.current || !zoomRef.current) return;
    const viewStorageKey = `topology-view-${id}${isFullscreen ? '-fs' : ''}`;
    try { localStorage.removeItem(viewStorageKey); } catch {}
    const transform = applyFitToView(svgRef.current, zoomRef.current, topology.nodes, dimensions.width, dimensions.height);
    transformRef.current = transform;
    setIsActualSize(false);
    toast.success('View reset');
  }, [topology, dimensions, id, isFullscreen]);

  const handleFullscreen = useCallback(() => {
    const el = fullscreenRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {
        setIsFullscreen(prev => !prev);
      });
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => setIsFullscreen(false));
    }
  }, []);

  useEffect(() => {
    const handler = () => {
      const fs = !!document.fullscreenElement;
      setIsFullscreen(fs);
      hasInitialFit.current = false;
    };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const severityColor = (s: string) => {
    switch (s) {
      case 'CRITICAL': return 'bg-destructive text-destructive-foreground';
      case 'MAJOR': return 'bg-orange-500 text-white';
      case 'MINOR': return 'bg-yellow-500 text-black';
      case 'WARNING': return 'bg-yellow-400 text-black';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (!topology) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading topology...</p>
      </div>
    );
  }

  return (
    <div ref={fullscreenRef} className={`flex flex-col bg-background ${isFullscreen ? 'fixed inset-0 z-50' : 'h-[calc(100vh-1.7rem)]'}`}>
      {/* Canvas area — takes full space */}
      <div className="relative flex-1 min-h-0">
        {/* Top-left toolbar: Alarms & Monitored Alarms */}
        <div className="absolute top-2 left-2 z-10 flex items-center gap-0.5 rounded-md border border-border p-0.5 shadow-sm bg-background">
          <Tooltip><TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs relative" onClick={handleShowAllAlarms}>
              <Bell className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Alarms</span>
              {totalActiveAlarms > 0 && (
                <span className="absolute -top-1 -right-1 h-4 min-w-[16px] rounded-full bg-destructive text-[8px] text-destructive-foreground flex items-center justify-center font-bold px-1">
                  {totalActiveAlarms > 9 ? '9+' : totalActiveAlarms}
                </span>
              )}
            </Button>
          </TooltipTrigger><TooltipContent side="bottom">View Alarms</TooltipContent></Tooltip>
          <Separator orientation="vertical" className="h-4 mx-0.5" />
          <Tooltip><TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-xs relative" onClick={() => setShowMonitoredAlarms(true)}>
              <AlertTriangle className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Monitored Alarms</span>
            </Button>
          </TooltipTrigger><TooltipContent side="bottom">Monitored Alarms</TooltipContent></Tooltip>
        </div>

        {/* Top-right toolbar: Zoom, Reset, Fullscreen */}
        <div className="absolute top-2 right-2 z-10 flex items-center gap-0.5 rounded-md border border-border p-0.5 shadow-sm bg-background">
          <Tooltip><TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => {
              if (svgRef.current && zoomRef.current) { canvasZoomIn(svgRef.current, zoomRef.current); setIsActualSize(false); }
            }}><ZoomIn className="h-3.5 w-3.5" /></Button>
          </TooltipTrigger><TooltipContent side="bottom">Zoom In</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => {
              if (svgRef.current && zoomRef.current) { canvasZoomOut(svgRef.current, zoomRef.current); setIsActualSize(false); }
            }}><ZoomOut className="h-3.5 w-3.5" /></Button>
          </TooltipTrigger><TooltipContent side="bottom">Zoom Out</TooltipContent></Tooltip>
          <Separator orientation="vertical" className="h-4 mx-0.5" />
          <Tooltip><TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleResetView}>
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger><TooltipContent side="bottom">Reset View</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild>
            <Toggle pressed={isActualSize} onPressedChange={(pressed) => {
              if (!topology || !svgRef.current || !zoomRef.current) return;
              if (pressed) {
                const t = apply1to1View(svgRef.current, zoomRef.current, topology.nodes, dimensions.width, dimensions.height);
                transformRef.current = t;
                setIsActualSize(true);
              } else {
                const t = applyFitToView(svgRef.current, zoomRef.current, topology.nodes, dimensions.width, dimensions.height);
                transformRef.current = t;
                setIsActualSize(false);
              }
            }} size="sm" className="h-7 px-1.5 text-[10px] font-mono data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
              1:1
            </Toggle>
          </TooltipTrigger><TooltipContent side="bottom">{isActualSize ? 'Fit to view' : 'Actual size (1:1)'}</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={handleFullscreen}>
              {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </Button>
          </TooltipTrigger><TooltipContent side="bottom">{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</TooltipContent></Tooltip>
          <Separator orientation="vertical" className="h-4 mx-0.5" />
          <Tooltip><TooltipTrigger asChild>
            <Toggle pressed={showTrafficAnimation} onPressedChange={setShowTrafficAnimation} size="sm" className="h-7 w-7 p-0 data-[state=on]:bg-accent">
              <Activity className="h-3.5 w-3.5" />
            </Toggle>
          </TooltipTrigger><TooltipContent side="bottom">{showTrafficAnimation ? 'Hide Traffic Animation' : 'Show Traffic Animation'}</TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild>
            <Toggle pressed={showAppearance} onPressedChange={setShowAppearance} size="sm" className="h-7 w-7 p-0 data-[state=on]:bg-accent">
              <Type className="h-3.5 w-3.5" />
            </Toggle>
          </TooltipTrigger><TooltipContent side="bottom">Appearance</TooltipContent></Tooltip>
          <Separator orientation="vertical" className="h-4 mx-0.5" />
          {/* WS last update indicator */}
          <div
            className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-medium"
            title={wsConnected ? 'Live alarms via WebSocket' : 'WebSocket disconnected — polling every 15s'}
          >
            <span className={`inline-block h-2 w-2 rounded-full ${wsConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-muted-foreground">
              {wsConnected
                ? `Updated: ${wsLastUpdated ? wsLastUpdated.toLocaleTimeString() : '—'}`
                : 'Offline'}
            </span>
          </div>
          <Tooltip><TooltipTrigger asChild>
            <span><AlarmNotification alarms={alarms} /></span>
          </TooltipTrigger><TooltipContent side="bottom">Alarm Sound</TooltipContent></Tooltip>
        </div>

        {/* Appearance Panel — floating */}
        {showAppearance && (
          <div className="absolute top-12 right-2 z-20">
            <AppearancePanel
              settings={displaySettings}
              onSettingsChange={(updates) => setDisplaySettings(prev => ({ ...prev, ...updates }))}
              onClose={() => setShowAppearance(false)}
            />
          </div>
        )}

        {/* Topology name badge — top center (info icon shows stats + description) */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 max-w-[60vw]">
          <div className="bg-background border border-border rounded-md px-4 py-1.5 shadow-sm">
            <div className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span className="truncate">{topology.name}</span>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className="inline-flex items-center justify-center h-5 w-5 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    aria-label="Topology info"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent side="bottom" align="center" className="w-72 p-3 text-xs space-y-2">
                  <div className="font-semibold text-sm">{topology.name}</div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary" className="text-[10px]">{topology.nodes.length} Nodes</Badge>
                    <Badge variant="secondary" className="text-[10px]">{topology.links.length} Links</Badge>
                    {topology.client && <Badge variant="outline" className="text-[10px]">{topology.client}</Badge>}
                    {topology.vendor && <Badge variant="outline" className="text-[10px]">{topology.vendor}</Badge>}
                  </div>
                  {topology.description ? (
                    <div className="text-muted-foreground whitespace-pre-wrap leading-snug pt-1 border-t border-border">
                      {topology.description}
                    </div>
                  ) : (
                    <div className="text-muted-foreground italic pt-1 border-t border-border">No description</div>
                  )}
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>


        {/* Legend — fixed bottom-left */}
        {legendOpen ? (
          <div className="absolute bottom-3 left-2 z-10 rounded-lg p-4 border border-border shadow-sm min-w-[200px] bg-background">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Legend</p>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setLegendOpen(false)}>
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center gap-2.5"><div className="w-8 h-[3px] bg-green-500 rounded" /><span className="text-foreground">Normal</span></div>
              <div className="flex items-center gap-2.5"><div className="w-8 h-[3px] bg-destructive rounded" /><span className="text-foreground">Alarm</span></div>
              <Separator className="my-2" />
              <Tooltip><TooltipTrigger asChild>
                <Toggle
                  pressed={showLabels}
                  onPressedChange={setShowLabels}
                  size="sm"
                  className="w-full justify-start h-7 gap-2 px-2 text-xs data-[state=on]:bg-accent"
                >
                  {showLabels ? <Tag className="h-3.5 w-3.5" /> : <Tags className="h-3.5 w-3.5" />}
                  <span className="text-foreground">{showLabels ? 'Labels On' : 'Labels Off'}</span>
                </Toggle>
              </TooltipTrigger><TooltipContent side="right">{showLabels ? 'Hide Labels' : 'Show Labels'}</TooltipContent></Tooltip>
            </div>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="absolute bottom-3 left-2 z-10 h-8 gap-1.5 text-xs px-3 shadow-sm bg-background"
            onClick={() => setLegendOpen(true)}
          >
            <ChevronUp className="h-3.5 w-3.5" />
            Legend
          </Button>
        )}

        {/* Bottom-right action group: Span Loss & Connectivity */}
        <div className="absolute bottom-3 right-2 z-10 flex items-center gap-0.5 rounded-md border border-border p-0.5 shadow-sm bg-background">
          <Tooltip><TooltipTrigger asChild>
            <Toggle
              pressed={showSpanLossPanel}
              onPressedChange={setShowSpanLossPanel}
              size="sm"
              className="h-7 gap-1 px-2 text-xs relative data-[state=on]:bg-accent"
            >
              <Gauge className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Span Loss</span>
              {spanLossList.length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 min-w-[16px] rounded-full bg-primary text-[8px] text-primary-foreground flex items-center justify-center font-bold px-1">
                  {spanLossList.length > 99 ? '99+' : spanLossList.length}
                </span>
              )}
            </Toggle>
          </TooltipTrigger><TooltipContent side="top">{showSpanLossPanel ? 'Hide Span Loss' : 'Show Span Loss'}</TooltipContent></Tooltip>
          <Separator orientation="vertical" className="h-4 mx-0.5" />
          <Tooltip><TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs"
              onClick={() => setShowConnectivityView(true)}
            >
              <Network className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Connectivity</span>
            </Button>
          </TooltipTrigger><TooltipContent side="top">View Connectivity</TooltipContent></Tooltip>
        </div>

        {/* Inline Detail Panel — renders inside fullscreen container */}
        {detailPanel && (
          <div className="absolute top-0 right-0 h-full w-[380px] z-30 border-l border-border bg-background shadow-xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0 bg-muted/30">
              <div className="flex items-center gap-2 min-w-0">
                {detailPanel.type === 'node' && <div className="h-3 w-3 rounded-full bg-primary shrink-0" />}
                {detailPanel.type === 'link' && <Activity className="h-4 w-4 text-primary shrink-0" />}
                {detailPanel.type === 'alarms' && <Bell className="h-4 w-4 text-destructive shrink-0" />}
                <span className="font-semibold text-sm truncate">{detailPanel.title}</span>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setDetailPanel(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">

                {/* Link / Node Info Card */}
                {detailPanel.details && (
                  <div className="rounded-lg border border-border overflow-hidden">
                    <div className="px-3 py-2 bg-muted/40 border-b border-border">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {detailPanel.type === 'link' ? 'Link Information' : detailPanel.type === 'node' ? 'Node Information' : 'Details'}
                      </p>
                    </div>
                    <div className="divide-y divide-border">
                      {Object.entries(detailPanel.details).map(([key, val]) => (
                        <div key={key} className="flex justify-between items-center px-3 py-2">
                          <span className="text-xs text-muted-foreground">{key}</span>
                          <span className={`text-xs font-semibold ${val.includes('ALARM') ? 'text-destructive' : val === 'Normal' ? 'text-green-600 dark:text-green-400' : 'text-foreground'}`}>{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Alarm Cards for node/link detail */}
                {detailPanel.type !== 'alarms' && detailPanel.alarms.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
                      Alarms ({detailPanel.alarms.length})
                    </p>
                    {detailPanel.alarms.map((a, i) => (
                      <div key={i} className="rounded-lg border border-border overflow-hidden">
                        {/* Alarm header with severity */}
                        <div className="flex items-center justify-between px-3 py-2.5 bg-muted/30">
                          <div className="flex items-center gap-2 min-w-0">
                            <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                            <span className="text-sm font-semibold text-foreground truncate">{a.alarmName}</span>
                          </div>
                          <Badge className={`text-[10px] shrink-0 ${severityColor(a.severity)}`}>{a.severity}</Badge>
                        </div>

                        <div className="divide-y divide-border">
                          {/* Time info */}
                          <div className="px-3 py-2.5 space-y-1.5">
                            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>Time</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <p className="text-muted-foreground text-[10px]">Received</p>
                                <p className="font-medium text-foreground">{a.receivedOn || 'NA'}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-[10px]">Cleared</p>
                                <p className={`font-medium ${a.clearedOn === 'NA' || !a.clearedOn ? 'text-destructive' : 'text-foreground'}`}>{a.clearedOn || 'NA'}</p>
                              </div>
                            </div>
                          </div>

                          {/* Span Loss */}
                          <div className="px-3 py-2.5 space-y-1.5">
                            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                              <Radio className="h-3 w-3" />
                              <span>Span Loss (dB)</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="flex items-center justify-between bg-muted/40 rounded px-2.5 py-1.5">
                                <span className="text-muted-foreground">Tx</span>
                                <span className="font-semibold text-foreground">{a.spanLossTx || 'NA'}</span>
                              </div>
                              <div className="flex items-center justify-between bg-muted/40 rounded px-2.5 py-1.5">
                                <span className="text-muted-foreground">Rx</span>
                                <span className="font-semibold text-foreground">{a.spanLossRx || 'NA'}</span>
                              </div>
                            </div>
                          </div>

                          {/* Fiber Distance & Design Loss */}
                          <div className="px-3 py-2.5">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                  <Ruler className="h-3 w-3" />
                                  <span>Fiber Distance (Km)</span>
                                </div>
                                <p className="font-semibold text-foreground pl-4">{a.fiberDistance || 'NA'}</p>
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                  <Activity className="h-3 w-3" />
                                  <span>Design Loss (dB)</span>
                                </div>
                                <p className="font-semibold text-foreground pl-4">{a.designLoss || 'NA'}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* No alarms state for node/link */}
                {detailPanel.type !== 'alarms' && detailPanel.alarms.length === 0 && (
                  <div className="rounded-lg border border-dashed border-border p-4 text-center">
                    <div className="inline-flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 font-medium">
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      No active alarms
                    </div>
                  </div>
                )}

                {/* All Alarms view */}
                {detailPanel.type === 'alarms' && (
                  <div className="space-y-3">
                    {activeLinkAlarms > 0 && (
                      <div className="space-y-2">
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">Link Alarms ({activeLinkAlarms})</p>
                        {alarms.filter(a => a.severity !== 'CLEAR').map((a, i) => {
                          return (
                            <div key={i} className="p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors space-y-1.5"
                              onClick={() => setAlarmDialogData(a)}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                                  <span className="text-sm font-semibold">{a.alarmName}</span>
                                </div>
                                <Badge className={`text-[10px] ${severityColor(a.severity)}`}>{a.severity}</Badge>
                              </div>
                              <p className="text-[11px] text-muted-foreground pl-5">
                                {(a.sourceNode || a.source_label)}
                                {a.sourcePort ? ` · ${a.sourcePort}` : ''}
                                {' → '}
                                {(a.destNode || a.target_label)}
                                {a.destPort ? ` · ${a.destPort}` : ''}
                              </p>
                              {a.max_rcvd_time && <p className="text-[10px] text-muted-foreground/70 pl-5">{a.max_rcvd_time}</p>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {activeNodeAlarms > 0 && (
                      <div className="space-y-2">
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">Node Alarms ({activeNodeAlarms})</p>
                        {nodeAlarms.filter(a => a.severity !== 'CLEAR').map((a, i) => {
                          const node = topology.nodes.find(n => n.id === a.node);
                          return (
                            <div key={i} className="p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors space-y-1.5"
                              onClick={() => handleNodeClick(a.node)}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                                  <span className="text-sm font-semibold">{a.alarmName}</span>
                                </div>
                                <Badge className={`text-[10px] ${severityColor(a.severity)}`}>{a.severity}</Badge>
                              </div>
                              <p className="text-[11px] text-muted-foreground pl-5">{node?.label || a.node}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {totalActiveAlarms === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No active alarms</p>
                      </div>
                    )}
                  </div>
                )}

                {/* View All Alarms button */}
                {detailPanel.type !== 'alarms' && (
                  <Button variant="outline" size="sm" className="w-full text-xs" onClick={handleShowAllAlarms}>
                    <Bell className="h-3.5 w-3.5 mr-1.5" />
                    View All Alarms
                  </Button>
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Span Loss telemetry panel — bottom floating, MUI DataGrid */}
        {showSpanLossPanel && (
          <SpanLossPanel
            data={spanLossList}
            onClose={() => setShowSpanLossPanel(false)}
          />
        )}

        <div ref={containerRef} className="w-full h-full">
          <svg ref={svgRef} width={dimensions.width} height={dimensions.height} className="w-full h-full" />
        </div>

        <div ref={tooltipRef} className="fixed z-50 bg-popover border rounded-lg shadow-lg p-2 pointer-events-none" style={{ display: 'none' }} />
      </div>

      {topology && (
        <TopologyConnectivityDialog
          open={showConnectivityView}
          onOpenChange={setShowConnectivityView}
          nodes={topology.nodes as any}
          links={topology.links as any}
          topologyName={topology.name}
        />
      )}
      {topology && (
        <MonitoredAlarmsDialog
          open={showMonitoredAlarms}
          onOpenChange={setShowMonitoredAlarms}
          nodes={topology.nodes as any}
          links={topology.links as any}
          topologyId={id || topology.name}
          vendor={vendor || topology.vendor || ''}
          topologyName={topology.name}
        />
      )}

      <AlarmDetailsDialog
        alarm={alarmDialogData}
        open={!!alarmDialogData}
        onOpenChange={(o) => { if (!o) setAlarmDialogData(null); }}
      />

      <AllAlarmsDialog
        open={showAllAlarmsDialog}
        onOpenChange={setShowAllAlarmsDialog}
        alarms={alarms}
        topologyName={topology?.name}
      />
    </div>
  );
}

const SPAN_LOSS_EXPORT_COLUMNS: Array<{ key: keyof SpanLossRecord | 'span'; header: string }> = [
  { key: 'span', header: 'Span' },
  { key: 'source_label', header: 'Source' },
  { key: 'target_label', header: 'Target' },
  { key: 'span_Loss_Tx', header: 'Tx Loss (dB)' },
  { key: 'span_Loss_Rx', header: 'Rx Loss (dB)' },
  { key: 'Fiber_distance', header: 'Fiber Distance (km)' },
  { key: 'Span_Margin', header: 'Span Margin (dB)' },
  { key: 'Design_Loss', header: 'Design Loss (dB)' },
];

function escapeCsvCell(val: unknown): string {
  if (val === null || val === undefined) return '';
  const s = String(val);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function spanLossToCsv(rows: SpanLossRecord[]): string {
  const lines = [SPAN_LOSS_EXPORT_COLUMNS.map((c) => c.header).join(',')];
  for (const r of rows) {
    lines.push(
      SPAN_LOSS_EXPORT_COLUMNS
        .map((c) => escapeCsvCell((r as any)[c.key]))
        .join(','),
    );
  }
  return lines.join('\n');
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function downloadSpanLossExcel(rows: SpanLossRecord[], filename: string) {
  const XLSX = await import('xlsx');
  const aoa = [
    SPAN_LOSS_EXPORT_COLUMNS.map((c) => c.header),
    ...rows.map((r) =>
      SPAN_LOSS_EXPORT_COLUMNS.map((c) => {
        const v = (r as any)[c.key];
        return v === undefined || v === null ? '' : v;
      }),
    ),
  ];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  ws['!cols'] = SPAN_LOSS_EXPORT_COLUMNS.map((c) => ({ wch: Math.max(c.header.length + 2, 16) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Span Loss');
  XLSX.writeFile(wb, filename);
}

interface SpanLossPanelProps {
  data: SpanLossRecord[];
  onClose: () => void;
}

function SpanLossPanel({ data, onClose }: SpanLossPanelProps) {
  const columns: GridColDef[] = [
    { field: 'span', headerName: 'Span', width: 120, renderCell: (p) => (
      <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{p.value ?? '—'}</span>
    ) },
    { field: 'source_label', headerName: 'Source', flex: 1.2, minWidth: 160 },
    { field: 'target_label', headerName: 'Target', flex: 1.2, minWidth: 160 },
    { field: 'span_Loss_Tx', headerName: 'Tx Loss (dB)', flex: 0.7, minWidth: 110, type: 'number' },
    { field: 'span_Loss_Rx', headerName: 'Rx Loss (dB)', flex: 0.7, minWidth: 110, type: 'number' },
    { field: 'Fiber_distance', headerName: 'Fiber Dist (km)', flex: 0.7, minWidth: 120, type: 'number' },
    { field: 'Span_Margin', headerName: 'Span Margin (dB)', flex: 0.8, minWidth: 130, type: 'number' },
    { field: 'Design_Loss', headerName: 'Design Loss (dB)', flex: 0.8, minWidth: 130, type: 'number' },
  ];

  const rows = data.map((r, i) => ({
    id: `${r.span ?? ''}|${r.source_label ?? ''}|${r.target_label ?? ''}|${i}`,
    ...r,
  }));

  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  const baseName = `span-loss-telemetry-${stamp}`;

  const handleExportCsv = () => {
    if (data.length === 0) return;
    const blob = new Blob([spanLossToCsv(data)], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `${baseName}.csv`);
  };
  const handleExportXlsx = () => {
    if (data.length === 0) return;
    void downloadSpanLossExcel(data, `${baseName}.xlsx`);
  };

  function PanelToolbar() {
    return (
      <GridToolbarContainer sx={{ p: 0.75, gap: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
        <GridToolbarQuickFilter debounceMs={300} />
        <MuiBox sx={{ flex: 1 }} />
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-2 text-xs gap-1"
          onClick={handleExportCsv}
          disabled={data.length === 0}
          title="Download as CSV"
        >
          <DownloadIcon className="h-3.5 w-3.5" />
          CSV
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-2 text-xs gap-1"
          onClick={handleExportXlsx}
          disabled={data.length === 0}
          title="Download as Excel"
        >
          <DownloadIcon className="h-3.5 w-3.5" />
          Excel
        </Button>
      </GridToolbarContainer>
    );
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="!max-w-[80vw] w-[80vw] h-[85vh] max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden [&>button]:z-50">
        <DialogTitle className="sr-only">Span Loss Telemetry</DialogTitle>
        <DialogDescription className="sr-only">Per-span Tx/Rx loss, fiber distance, span margin, and design loss.</DialogDescription>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Span Loss Telemetry</span>
            <span className="text-[11px] text-muted-foreground">({data.length} span{data.length === 1 ? '' : 's'})</span>
          </div>
        </div>
        <MuiBox sx={{ flex: 1, minHeight: 0 }}>
          <DataGrid
            rows={rows}
            columns={columns}
            density="compact"
            disableRowSelectionOnClick
            slots={{ toolbar: PanelToolbar }}
            slotProps={{ toolbar: { showQuickFilter: true } }}
            initialState={{ pagination: { paginationModel: { pageSize: 25, page: 0 } } }}
            pageSizeOptions={[10, 25, 50, 100]}
            sx={{
              height: '100%',
              border: 'none',
              '& .MuiDataGrid-columnHeaders': {
                background: 'linear-gradient(180deg, hsl(var(--primary) / 0.12) 0%, hsl(var(--primary) / 0.04) 100%)',
                borderBottom: '2px solid hsl(var(--primary))',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                fontSize: 11,
              },
            }}
          />
        </MuiBox>
      </DialogContent>
    </Dialog>
  );
}
