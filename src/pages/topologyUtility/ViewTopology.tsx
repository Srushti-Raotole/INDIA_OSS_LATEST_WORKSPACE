import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { logActivity } from '../../utils/activityLogger';
import { getNodeLabelPosition, getLinkLabelPosition, getLinkLabelAngle, computeLinkPath } from './utils/renderHelpers';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import * as d3 from 'd3';
import { toast } from 'sonner';
import {
  ArrowLeft, ZoomIn, ZoomOut, RotateCcw, Download, Maximize2, Minimize2,
  Edit, AlertTriangle, Eye, EyeOff, Tag, Tags, Bell, X, Clock, Type,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Toggle } from '../../components/ui/toggle';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../components/ui/tooltip';
import { Separator } from '../../components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../components/ui/sheet';
import { ScrollArea } from '../../components/ui/scroll-area';

import type { ApiTopology, ApiAlarm, ApiNodeAlarm, ApiDisplaySettings } from './types';
import * as topologyApi from './services/topologyApi';
import { SAMPLE_TOPOLOGY, SAMPLE_LINK_ALARMS, SAMPLE_NODE_ALARMS } from './data/sampleTopology';
import { useForceLightMode } from './hooks/useForceLightMode';
import { renderEquipmentIcon, resolveIconType, type EquipmentIconType } from './utils/nodeIcons';
import { renderGroupBoxes } from './utils/groupRenderer';
import { AppearancePanel } from './components/AppearancePanel';
import { AlarmConfigDialog } from './components/AlarmConfigDialog';
import {
  ZOOM_EXTENT,
  zoomIn as canvasZoomIn,
  zoomOut as canvasZoomOut,
  applyFitToView,
  apply1to1View,
  getNodesBoundingBox,
  computeFitTransform,
} from './utils/canvasUtils';

export default function ViewTopology() {
  useForceLightMode();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const vendor = searchParams.get('vendor') || undefined;
  const navigate = useNavigate();
  const isDark = false;

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hasInitialFit = useRef(false);
  const transformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);

  const [topology, setTopology] = useState<ApiTopology | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [isActualSize, setIsActualSize] = useState(false);
  const [showAppearance, setShowAppearance] = useState(false);
  const [showAlarmConfig, setShowAlarmConfig] = useState(false);
  const [displaySettings, setDisplaySettings] = useState<{ nodeLabelSize: number; linkLabelSize: number; linkDisplayMode: 'merged' | 'multi' }>({ nodeLabelSize: 10, linkLabelSize: 9, linkDisplayMode: 'merged' });
  const [alarms, setAlarms] = useState<ApiAlarm[]>([]);
  const [nodeAlarms, setNodeAlarms] = useState<ApiNodeAlarm[]>([]);
  const [showAlarmSidebar, setShowAlarmSidebar] = useState(false);
  const [sidebarContent, setSidebarContent] = useState<{
    type: 'node' | 'link';
    title: string;
    alarms: { alarmName: string; severity: string }[];
    details?: Record<string, string>;
  } | null>(null);

  useEffect(() => {
    logActivity({
      activity: id ? `View Topology opened: ${id}` : "View Topology page opened",
      actionName: "VIEW_TOPOLOGY_PAGE",
      module: "TOPOLOGY_UTILITY",
    });
  }, [id]);

  // Reset fit state when topology ID changes
  useEffect(() => {
    hasInitialFit.current = false;
  }, [id]);

  // Load topology — use sample data when no ID is provided
  useEffect(() => {
    if (!id) {
      setTopology(SAMPLE_TOPOLOGY);
      setAlarms(SAMPLE_LINK_ALARMS);
      setNodeAlarms(SAMPLE_NODE_ALARMS);
      return;
    }
    topologyApi.getTopology(id, vendor).then(saved => {
      if (saved) {
        setTopology(saved);
        // Load display settings from API
        if (saved.displaySettings) {
          setDisplaySettings({
            nodeLabelSize: saved.displaySettings.nodeLabelSize ?? 10,
            linkLabelSize: saved.displaySettings.linkLabelSize ?? 9,
            linkDisplayMode: (saved.displaySettings as any).linkDisplayMode === 'multi' ? 'multi' : 'merged',
          });
        }
        topologyApi.fetchAlarms(id, vendor).then(setAlarms);
        topologyApi.fetchNodeAlarms(id, vendor).then(setNodeAlarms);
      } else {
        toast.error('Topology not found');
        navigate('/manage-topology');
      }
    });
  }, [id, vendor]);

  // Poll alarms every 10s
  useEffect(() => {
    if (!id) return;
    const interval = setInterval(() => {
      topologyApi.fetchAlarms(id, vendor).then(setAlarms);
      topologyApi.fetchNodeAlarms(id, vendor).then(setNodeAlarms);
    }, 10000);
    return () => clearInterval(interval);
  }, [id, vendor]);

  // Resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const update = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) setDimensions({ width: rect.width, height: Math.max(rect.height, 400) });
    };
    update();
    const ro = new ResizeObserver(() => requestAnimationFrame(update));
    ro.observe(container);
    return () => ro.disconnect();
  }, [isFullscreen]);

  // Get link alarm
  const getLinkAlarm = useCallback((linkId: string, srcId: string, tgtId: string): ApiAlarm | undefined => {
    if (!topology) return undefined;
    const byLinkId = alarms.find(a => a.link_id === linkId);
    if (byLinkId) return byLinkId;
    const srcNode = topology.nodes.find(n => n.id === srcId);
    const tgtNode = topology.nodes.find(n => n.id === tgtId);
    if (!srcNode || !tgtNode) return undefined;
    return alarms.find(a => {
      if (a.link_id) return false;
      return (a.source_label === srcNode.label && a.target_label === tgtNode.label) ||
             (a.source_label === tgtNode.label && a.target_label === srcNode.label);
    });
  }, [alarms, topology]);

  // Get node alarm count
  const getNodeAlarmCount = useCallback((nodeId: string): number => {
    return nodeAlarms.filter(a => a.node === nodeId).length;
  }, [nodeAlarms]);

  // Get worst severity for a node
  const getNodeSeverity = useCallback((nodeId: string): string | null => {
    const na = nodeAlarms.filter(a => a.node === nodeId);
    if (na.length === 0) return null;
    const priority = ['CRITICAL', 'MAJOR', 'MINOR', 'WARNING', 'CLEAR'];
    for (const p of priority) {
      if (na.some(a => a.severity === p)) return p;
    }
    return na[0].severity;
  }, [nodeAlarms]);

  // Active alarm counts
  const activeLinkAlarms = alarms.filter(a => a.severity !== 'CLEAR').length;
  const activeNodeAlarms = nodeAlarms.filter(a => a.severity !== 'CLEAR').length;
  const totalActiveAlarms = activeLinkAlarms + activeNodeAlarms;

  // Show alarm details for a node
  const showNodeAlarmDetails = useCallback((nodeId: string) => {
    if (!topology) return;
    const node = topology.nodes.find(n => n.id === nodeId);
    const na = nodeAlarms.filter(a => a.node === nodeId);
    if (na.length === 0) return;
    setSidebarContent({
      type: 'node',
      title: node?.label || nodeId,
      alarms: na.map(a => ({ alarmName: a.alarmName, severity: a.severity })),
      details: {
        'Node ID': nodeId,
        'Icon': node?.icon || '-',
        'Position': `(${node?.x}, ${node?.y})`,
      },
    });
    setShowAlarmSidebar(true);
  }, [topology, nodeAlarms]);

  // Show alarm details for a link
  const showLinkAlarmDetails = useCallback((srcId: string, tgtId: string, alarm: ApiAlarm) => {
    if (!topology) return;
    const src = topology.nodes.find(n => n.id === srcId);
    const tgt = topology.nodes.find(n => n.id === tgtId);
    setSidebarContent({
      type: 'link',
      title: `${src?.label || srcId} → ${tgt?.label || tgtId}`,
      alarms: [{ alarmName: alarm.alarmName, severity: alarm.severity }],
      details: {
        'Source': src?.label || srcId,
        'Destination': tgt?.label || tgtId,
        'Alarm Name': alarm.alarmName,
        'Severity': alarm.severity,
      },
    });
    setShowAlarmSidebar(true);
  }, [topology]);

  // ============ D3 RENDERING ============
  const renderTopology = useCallback(() => {
    if (!svgRef.current || !topology || topology.nodes.length === 0) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    const { width, height } = dimensions;

    const defs = svg.append('defs');

    // Glow filter
    const glow = defs.append('filter').attr('id', 'glow-v').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    glow.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
    const m = glow.append('feMerge');
    m.append('feMergeNode').attr('in', 'coloredBlur');
    m.append('feMergeNode').attr('in', 'SourceGraphic');

    // Pulse filter for alarmed elements
    const pulseFilter = defs.append('filter').attr('id', 'alarm-pulse').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    pulseFilter.append('feGaussianBlur').attr('stdDeviation', '6').attr('result', 'blur');
    const pm = pulseFilter.append('feMerge');
    pm.append('feMergeNode').attr('in', 'blur');
    pm.append('feMergeNode').attr('in', 'SourceGraphic');

    // Arrow markers
    ['green', 'red'].forEach(color => {
      defs.append('marker')
        .attr('id', `arrow-${color}`).attr('viewBox', '0 -5 10 10')
        .attr('refX', 10).attr('refY', 0)
        .attr('markerWidth', 6).attr('markerHeight', 6).attr('orient', 'auto')
        .append('path').attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', color === 'green' ? '#22c55e' : '#ef4444');
    });

    // Zoom
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent(ZOOM_EXTENT)
      .on('zoom', (event) => {
        container.attr('transform', event.transform);
        transformRef.current = event.transform;
      });
    zoomRef.current = zoom;
    svg.call(zoom);
    const container = svg.append('g');

    // Grid
    const gridSize = 50;
    const gridG = container.append('g');
    const ext = Math.max(width, height) * 3;
    for (let x = -ext / 2; x < ext; x += gridSize) {
      gridG.append('line')
        .attr('x1', x).attr('y1', -ext / 2).attr('x2', x).attr('y2', ext)
        .attr('stroke', isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)').attr('stroke-width', 0.5);
    }
    for (let y = -ext / 2; y < ext; y += gridSize) {
      gridG.append('line')
        .attr('x1', -ext / 2).attr('y1', y).attr('x2', ext).attr('y2', y)
        .attr('stroke', isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)').attr('stroke-width', 0.5);
    }

    const nodeMap = new Map(topology.nodes.map(n => [n.id, n]));
    const tooltipDiv = d3.select(tooltipRef.current);

    // ─── Group Boxes (behind links and nodes) ───
    renderGroupBoxes(container as any, topology.groups);

    // ---- LINKS ---- center-to-center with bezier curves
    const linkG = container.append('g');

    // Group links by node pair for fan-out
    const linkPairMap = new Map<string, typeof topology.links>();
    topology.links.forEach(link => {
      const key = [link.source, link.target].sort().join('|');
      if (!linkPairMap.has(key)) linkPairMap.set(key, []);
      linkPairMap.get(key)!.push(link);
    });

    const isMultiMode = displaySettings.linkDisplayMode === 'multi';

    topology.links.forEach(link => {
      const src = nodeMap.get(link.source);
      const tgt = nodeMap.get(link.target);
      if (!src || !tgt) return;

      const pairKey = [link.source, link.target].sort().join('|');
      const parallelLinks = linkPairMap.get(pairKey) || [link];
      // Merged mode: only draw the first link per pair
      if (!isMultiMode && parallelLinks[0].id !== link.id) return;

      const alarm = getLinkAlarm(link.id, link.source, link.target);
      const hasAlarm = alarm && alarm.severity !== 'CLEAR';
      const linkColor = hasAlarm ? '#ef4444' : '#22c55e';
      const isDashed = link.type === 'DASHED' || link.type === 'DOTTED';
      const sw = link.settings?.strokeWidth || 2.5;

      const sx = src.x, sy = src.y, tx = tgt.x, ty = tgt.y;
      const parallelCount = isMultiMode ? parallelLinks.length : 1;
      const parallelIndex = isMultiMode ? parallelLinks.findIndex(l => l.id === link.id) : 0;

      const pathResult = computeLinkPath({
        sx, sy, tx, ty,
        curveOffsetX: link.curveOffsetX,
        curveOffsetY: link.curveOffsetY,
        parallelCount,
        parallelIndex,
        linkType: link.type,
      });
      const { pathData, perpX, perpY } = pathResult;

      // Shadow
      linkG.append('path')
        .attr('d', pathData).attr('fill', 'none')
        .attr('stroke', 'rgba(0,0,0,0.1)').attr('stroke-width', sw + 3)
        .attr('stroke-linecap', 'round');

      // Alarm pulse glow
      if (hasAlarm) {
        linkG.append('path')
          .attr('d', pathData).attr('fill', 'none')
          .attr('stroke', '#ef4444').attr('stroke-width', sw + 6).attr('opacity', 0.25)
          .attr('filter', 'url(#alarm-pulse)')
          .attr('class', 'alarm-pulse-line');
      }

      // Main path
      const mainPath = linkG.append('path')
        .attr('d', pathData).attr('fill', 'none')
        .attr('stroke', linkColor).attr('stroke-width', sw)
        .attr('stroke-linecap', 'round').attr('stroke-dasharray', isDashed ? '8,4' : 'none');

      // Arrow at midpoint
      const pathEl = mainPath.node();
      if (pathEl && (link.settings?.showArrows ?? false)) {
        const totalLen = pathEl.getTotalLength();
        const midPt = pathEl.getPointAtLength(totalLen / 2);
        const nearPt = pathEl.getPointAtLength(totalLen / 2 + 1);
        const angle = Math.atan2(nearPt.y - midPt.y, nearPt.x - midPt.x) * 180 / Math.PI;
        linkG.append('polygon')
          .attr('points', '0,-5 10,0 0,5')
          .attr('transform', `translate(${midPt.x}, ${midPt.y}) rotate(${angle})`)
          .attr('fill', linkColor);
      }

      // Hover area
      linkG.append('path')
        .attr('d', pathData).attr('fill', 'none')
        .attr('stroke', 'transparent').attr('stroke-width', 15).attr('cursor', 'pointer')
        .on('mouseenter', (event: MouseEvent) => {
          let html = `<div class="space-y-1">
            <div class="font-semibold text-xs">${link.label || 'Link'}</div>
            <div class="text-[10px]"><span class="text-muted-foreground">Source:</span> ${src.label}</div>
            <div class="text-[10px]"><span class="text-muted-foreground">Dest:</span> ${tgt.label}</div>
            <div class="text-[10px]"><span class="text-muted-foreground">Type:</span> ${link.type}</div>
            <div class="text-[10px]"><span class="text-muted-foreground">Status:</span> <span class="${hasAlarm ? 'text-destructive' : 'text-green-500'}">${hasAlarm ? 'ALARM' : 'Normal'}</span></div>`;
          if (hasAlarm && alarm) html += `<div class="text-[10px] text-destructive mt-1">⚠️ ${alarm.alarmName} (${alarm.severity})</div>`;
          html += '</div>';
          tooltipDiv.html(html).style('display', 'block')
            .style('left', `${event.clientX + 12}px`).style('top', `${event.clientY - 10}px`);
        })
        .on('mousemove', (event: MouseEvent) => {
          tooltipDiv.style('left', `${event.clientX + 12}px`).style('top', `${event.clientY - 10}px`);
        })
        .on('mouseleave', () => tooltipDiv.style('display', 'none'))
        .on('click', () => {
          if (hasAlarm && alarm) showLinkAlarmDetails(link.source, link.target, alarm);
        });

      // Link label — uses shared helper for parity with Create page
      if (link.label && showLabels) {
        if (pathEl) {
          const totalLen = pathEl.getTotalLength();
          const labelPt = pathEl.getPointAtLength(totalLen / 2);
          const lbl = link.label;
          const labelPos = getLinkLabelPosition(labelPt.x, labelPt.y, perpX, perpY, link.labelOffsetX, link.labelOffsetY);
          const labelAngle = getLinkLabelAngle(pathEl);

          linkG.append('text')
            .attr('x', labelPos.x).attr('y', labelPos.y)
            .attr('text-anchor', 'middle')
            .attr('font-size', `${displaySettings.linkLabelSize}px`).attr('font-weight', '500')
            .attr('fill', isDark ? '#e5e7eb' : '#374151')
            .attr('transform', `rotate(${labelAngle}, ${labelPos.x}, ${labelPos.y})`)
            .text(lbl);
        }
      }
    });

    // ---- NODES ----
    const nodeG = container.append('g');
    topology.nodes.forEach(node => {
      const alarmCount = getNodeAlarmCount(node.id);
      const severity = getNodeSeverity(node.id);
      const isSelected = selectedNode === node.id;
      const iconType = resolveIconType(node.icon);

      const g = nodeG.append('g')
        .attr('transform', `translate(${node.x}, ${node.y})`)
        .attr('cursor', 'pointer')
        .on('click', (event: MouseEvent) => {
          event.stopPropagation();
          setSelectedNode(prev => prev === node.id ? null : node.id);
          if (alarmCount > 0) showNodeAlarmDetails(node.id);
        });

      // Alarm pulse glow behind node
      if (alarmCount > 0) {
        const pulseCircle = g.append('circle')
          .attr('r', 35).attr('fill', '#ef4444').attr('opacity', 0.2);
        // Animate pulse
        const animatePulse = () => {
          pulseCircle
            .attr('r', 35).attr('opacity', 0.25)
            .transition().duration(1000).ease(d3.easeSinInOut)
            .attr('r', 45).attr('opacity', 0.05)
            .transition().duration(1000).ease(d3.easeSinInOut)
            .attr('r', 35).attr('opacity', 0.25)
            .on('end', animatePulse);
        };
        animatePulse();
      }

      // Selection ring
      if (isSelected) {
        g.append('circle').attr('r', 34).attr('fill', 'none')
          .attr('stroke', '#3b82f6').attr('stroke-width', 2).attr('stroke-dasharray', '4,2');
      }

      // Render equipment SVG icon
      renderEquipmentIcon(g as any, iconType, { isDark, isAlarmed: alarmCount > 0 });

      // Alarm badge (top-right)
      if (alarmCount > 0) {
        const badgeG = g.append('g').attr('transform', 'translate(22, -22)');
        badgeG.append('circle').attr('r', 11).attr('fill', '#ef4444')
          .attr('stroke', isDark ? '#0f172a' : '#ffffff').attr('stroke-width', 2);
        badgeG.append('text')
          .attr('text-anchor', 'middle').attr('y', 4)
          .attr('font-size', '10px').attr('font-weight', '700').attr('fill', '#ffffff')
          .text(alarmCount > 9 ? '9+' : String(alarmCount));
      }

      // Warning indicator for severity
      if (severity === 'WARNING' && alarmCount === 0) {
        g.append('circle').attr('cx', 24).attr('cy', -24).attr('r', 6)
          .attr('fill', '#eab308').attr('stroke', isDark ? '#0f172a' : '#fff').attr('stroke-width', 1.5);
      }

      // Label — uses shared helper for parity with Create page
      if (showLabels) {
        const labelPos = getNodeLabelPosition(node.nodeLabelOffsetX, node.nodeLabelOffsetY);
        g.append('text')
          .attr('x', labelPos.x).attr('y', labelPos.y).attr('text-anchor', 'middle')
          .attr('font-size', `${displaySettings.nodeLabelSize}px`).attr('font-weight', '600')
          .attr('fill', isDark ? '#f3f4f6' : '#111827').text(node.label);
      }
    });

    // Click canvas to deselect
    svg.on('click', () => setSelectedNode(null));

    // Add CSS animation for pulse
    const style = svg.append('style');
    style.text(`
      @keyframes alarmPulse {
        0%, 100% { opacity: 0.25; }
        50% { opacity: 0.05; }
      }
      .alarm-pulse-line {
        animation: alarmPulse 2s ease-in-out infinite;
      }
    `);

    // Restore or initialize viewport
    if (topology.nodes.length > 0) {
      if (!hasInitialFit.current) {
        hasInitialFit.current = true;

        // Try loading default viewport from API first
        let restored = false;
        if (topology.defaultViewport) {
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
        // Re-render (labels toggled, etc.) — restore current transform
        svg.call(zoom.transform, transformRef.current);
      }
    }
  }, [topology, dimensions, isDark, alarms, nodeAlarms, selectedNode, showLabels, displaySettings, getLinkAlarm, getNodeAlarmCount, getNodeSeverity, showNodeAlarmDetails, showLinkAlarmDetails]);

  useEffect(() => { renderTopology(); }, [renderTopology]);

  const handleExportPNG = () => {
    if (!svgRef.current || !topology) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const canvas = document.createElement('canvas');
    canvas.width = dimensions.width * 2; canvas.height = dimensions.height * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = isDark ? '#0a0a0f' : '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const a = document.createElement('a');
      a.download = `${topology.name.replace(/\s+/g, '_')}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
      toast.success('Exported as PNG');
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  if (!topology) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-1.7rem)]">
        <p className="text-muted-foreground">Loading topology...</p>
      </div>
    );
  }

  const severityColor = (s: string) => {
    switch (s) {
      case 'CRITICAL': return 'bg-destructive text-destructive-foreground';
      case 'MAJOR': return 'bg-orange-500 text-white';
      case 'MINOR': return 'bg-yellow-500 text-black';
      case 'WARNING': return 'bg-yellow-400 text-black';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-1.7rem)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/manage-topology')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">{topology.name}</h1>
            <p className="text-xs text-muted-foreground">
              {topology.nodes.length} nodes • {topology.links.length} links
              {topology.client && ` • ${topology.client}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {totalActiveAlarms > 0 && (
            <Badge variant="destructive" className="text-xs cursor-pointer" onClick={() => setShowAlarmSidebar(true)}>
              <AlertTriangle className="h-3 w-3 mr-1" />
              {totalActiveAlarms} Active Alarm{totalActiveAlarms > 1 ? 's' : ''}
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={() => navigate(`/edit-topology/${encodeURIComponent(id || '')}?vendor=${encodeURIComponent(vendor || '')}`)}>
            <Edit className="h-4 w-4 mr-1.5" />Edit
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPNG}>
            <Download className="h-4 w-4 mr-1.5" />Export
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div className={`relative flex-1 ${isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''}`}>
        {/* Toolbar */}
        <div className="absolute top-2 left-2 z-10 flex gap-1 bg-background/80 backdrop-blur-sm rounded-lg p-1 border shadow-sm">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
            if (svgRef.current && zoomRef.current) { canvasZoomIn(svgRef.current, zoomRef.current); setIsActualSize(false); }
          }}><ZoomIn className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
            if (svgRef.current && zoomRef.current) { canvasZoomOut(svgRef.current, zoomRef.current); setIsActualSize(false); }
          }}><ZoomOut className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
            if (!topology || !svgRef.current || !zoomRef.current) return;
            const t = applyFitToView(svgRef.current, zoomRef.current, topology.nodes, dimensions.width, dimensions.height);
            transformRef.current = t;
            setIsActualSize(false);
          }}>
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
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
            </TooltipTrigger>
            <TooltipContent>{isActualSize ? 'Fit to view' : 'Actual size (1:1)'}</TooltipContent>
          </Tooltip>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsFullscreen(!isFullscreen)}>
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </Button>
          <Separator orientation="vertical" className="h-5 mx-0.5" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle pressed={showLabels} onPressedChange={setShowLabels} size="sm" className="h-7 w-7 p-0">
                {showLabels ? <Tag className="h-3.5 w-3.5" /> : <Tags className="h-3.5 w-3.5" />}
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>{showLabels ? 'Hide labels' : 'Show labels'}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle pressed={showLegend} onPressedChange={setShowLegend} size="sm" className="h-7 w-7 p-0">
                {showLegend ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>{showLegend ? 'Hide legend' : 'Show legend'}</TooltipContent>
          </Tooltip>
          <Separator orientation="vertical" className="h-5 mx-0.5" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle pressed={showAppearance} onPressedChange={setShowAppearance} size="sm" className="h-7 w-7 p-0 data-[state=on]:bg-accent">
                <Type className="h-3.5 w-3.5" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Appearance</TooltipContent>
          </Tooltip>
          <Separator orientation="vertical" className="h-5 mx-0.5" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle pressed={showAlarmConfig} onPressedChange={setShowAlarmConfig} size="sm" className="h-7 w-7 p-0 data-[state=on]:bg-accent">
                <Bell className="h-3.5 w-3.5" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>Monitored Alarms</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 relative" onClick={() => setShowAlarmSidebar(true)}>
                <Bell className="h-3.5 w-3.5" />
                {totalActiveAlarms > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-destructive text-[8px] text-destructive-foreground flex items-center justify-center">
                    {totalActiveAlarms > 9 ? '9+' : totalActiveAlarms}
                  </span>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Alarm History</TooltipContent>
          </Tooltip>
        </div>

        {/* Appearance Panel — floating */}
        {showAppearance && (
          <div className="absolute top-12 left-2 z-20">
            <AppearancePanel
              settings={displaySettings}
              onSettingsChange={(updates) => setDisplaySettings(prev => ({ ...prev, ...updates }))}
              onClose={() => setShowAppearance(false)}
            />
          </div>
        )}

        {/* Legend */}
        {showLegend && (
          <div className="absolute bottom-2 left-2 z-10 bg-background/90 backdrop-blur-sm rounded-lg p-2.5 border shadow-sm text-xs space-y-1.5">
            <p className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground">Legend</p>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-green-500 rounded" /><span>Normal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 bg-red-500 rounded" /><span>Alarm</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-0.5 border-t-2 border-dashed border-green-500" /><span>Protection</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-destructive text-[8px] text-white flex items-center justify-center font-bold">3</div>
              <span>Node alarm count</span>
            </div>
          </div>
        )}

        <div ref={containerRef} className="w-full h-full">
          <svg ref={svgRef} width={dimensions.width} height={dimensions.height} className="w-full h-full" />
        </div>

        {/* Hover tooltip */}
        <div ref={tooltipRef} className="fixed z-50 bg-popover border rounded-lg shadow-lg p-2 pointer-events-none" style={{ display: 'none' }} />
      </div>

      {/* Alarm Details Sidebar */}
      <Sheet open={showAlarmSidebar} onOpenChange={setShowAlarmSidebar}>
        <SheetContent className="w-[380px] sm:w-[420px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-destructive" />
              {sidebarContent ? sidebarContent.title : 'All Alarms'}
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-100px)] mt-4">
            {sidebarContent ? (
              <div className="space-y-4">
                {/* Details */}
                {sidebarContent.details && (
                  <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                    {Object.entries(sidebarContent.details).map(([key, val]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{key}</span>
                        <span className="font-medium">{val}</span>
                      </div>
                    ))}
                  </div>
                )}
                {/* Alarms list */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Alarms ({sidebarContent.alarms.length})</p>
                  {sidebarContent.alarms.map((a, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                        <span className="text-sm font-medium">{a.alarmName}</span>
                      </div>
                      <Badge className={`text-[10px] ${severityColor(a.severity)}`}>{a.severity}</Badge>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={() => setSidebarContent(null)}>
                  View All Alarms
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* All link alarms */}
                {alarms.filter(a => a.severity !== 'CLEAR').length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Link Alarms ({activeLinkAlarms})</p>
                    {alarms.filter(a => a.severity !== 'CLEAR').map((a, i) => {
                      const src = topology.nodes.find(n => n.label === a.source_label);
                      const tgt = topology.nodes.find(n => n.label === a.target_label);
                      return (
                        <div key={i} className="p-2.5 border rounded-lg space-y-1 cursor-pointer hover:bg-muted/50"
                          onClick={() => src && tgt && showLinkAlarmDetails(src.id, tgt.id, a)}>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{a.alarmName}</span>
                            <Badge className={`text-[10px] ${severityColor(a.severity)}`}>{a.severity}</Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground">
                            {a.source_label} → {a.target_label}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
                {/* All node alarms */}
                {activeNodeAlarms > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Node Alarms ({activeNodeAlarms})</p>
                    {nodeAlarms.filter(a => a.severity !== 'CLEAR').map((a, i) => {
                      const node = topology.nodes.find(n => n.id === a.node);
                      return (
                        <div key={i} className="p-2.5 border rounded-lg space-y-1 cursor-pointer hover:bg-muted/50"
                          onClick={() => showNodeAlarmDetails(a.node)}>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{a.alarmName}</span>
                            <Badge className={`text-[10px] ${severityColor(a.severity)}`}>{a.severity}</Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground">{node?.label || a.node}</p>
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
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {topology && (
        <AlarmConfigDialog
          open={showAlarmConfig}
          onOpenChange={setShowAlarmConfig}
          nodes={topology.nodes as any}
          links={topology.links as any}
          topologyId={id || topology.name}
          vendor={vendor || topology.vendor || ''}
          client={topology.client}
          readOnly
        />
      )}
    </div>
  );
}
