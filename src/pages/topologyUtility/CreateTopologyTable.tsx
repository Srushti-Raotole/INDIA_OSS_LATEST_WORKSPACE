import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { logActivity } from '../../utils/activityLogger';
import * as d3 from 'd3';
import { toast } from 'sonner';
import { getNodeLabelPosition, getNodeLabelBaseY, getLinkLabelPosition, getLinkLabelAngle, computeLinkPath } from './utils/renderHelpers';
import {
  Plus, Trash2, Save, ArrowLeft, Eye, Download, Upload,
  ZoomIn, ZoomOut, RotateCcw, Maximize2, Minimize2, Info,
  Table2, Layers, Link2, Grid3X3, Magnet, FileUp, FileDown, MonitorCheck, X, Database, Type, Group, Bell,
  GitBranch, Minus,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { Toggle } from '../../components/ui/toggle';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../components/ui/tooltip';

import { SavedTopology, TopologyNodeData, TopologyLinkData, ApiTopology, ApiNode, ApiLink } from './types';
import {
  generateLinkPath,
  getLinkDashArray,
  isAnimatedStyle,
  hasGlowEffect,
  getParallelLinkOffset,
} from './utils/linkRouting';
import {
  LayoutType,
  ForceLayoutConfig,
  applyLayout,
} from './utils/layoutAlgorithms';
import { LinkStyleType as CustomLinkStyle, CustomNode, CustomLink, CanvasConfig, DEFAULT_CANVAS_CONFIG, CustomTopology, GroupBox, GROUP_COLORS, GROUP_BORDER_COLORS } from './shared/types';
import { useCustomTopologyStorage } from './hooks/useCustomTopologyStorage';
import { parseGroupName as _parseGroupName, getDisplayName as _getDisplayName, getGroupLabelCoords as _getGroupLabelCoords } from './utils/groupLabelPosition';
// Helper: convert ApiTopology → CustomTopology for canvas
function apiToCustomTopology(api: ApiTopology): CustomTopology {
  return {
    id: String(api.id || `topo-${Date.now()}`),
    name: api.name,
    description: api.description || '',
    client: api.client,
    vendor: api.vendor,
    traptypes: api.traptypes || [],
    nodes: api.nodes.map(n => ({
      id: n.id,
      label: n.label,
      x: n.x,
      y: n.y,
      icon: n.icon,
      type: n.icon?.toLowerCase() as CustomNode['type'] || 'datacenter',
      nodeLabelOffsetX: n.nodeLabelOffsetX,
      nodeLabelOffsetY: n.nodeLabelOffsetY,
      group: n.group,
    })),
    links: api.links.map(l => ({
      id: l.id,
      source: l.source,
      target: l.target,
      label: l.label,
      style: (l.type === 'DASHED' ? 'dashed' : l.type === 'DOTTED' ? 'dotted' : l.type === 'CURVED' ? 'curved' : 'solid') as CustomLinkStyle,
      srcIp: l.srcIp,
      dstIp: l.dstIp,
      srcPortName: l.srcPortName,
      dstPortName: l.dstPortName,
      curveOffsetX: l.curveOffsetX,
      curveOffsetY: l.curveOffsetY,
      labelOffsetX: l.labelOffsetX,
      labelOffsetY: l.labelOffsetY,
      showArrows: l.settings?.showArrows,
      strokeWidth: l.settings?.strokeWidth,
      curveIntensity: l.settings?.curveIntensity,
      parallelOffset: l.settings?.parallelOffset,
    })),
    groups: api.groups || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// Helper: convert CustomTopology → ApiTopology for API
function customToApiTopology(custom: CustomTopology, client?: string, vendor?: string, dispSettings?: DisplaySettings, defViewport?: { k: number; x: number; y: number }, linkCfg?: LinkConfig, monitorEnabled = false, traptypes?: string[]): Omit<ApiTopology, 'id'> {
  return {
    name: custom.name,
    client: client || '',
    vendor: vendor || '',
    description: custom.description || '',
    monitorEnabled,
    traptypes: traptypes ?? custom.traptypes ?? [],
    nodes: custom.nodes.map(n => ({
      id: n.id,
      label: n.label,
      icon: (n.type || n.icon || 'DATACENTER').toUpperCase(),
      x: n.x,
      y: n.y,
      nodeLabelOffsetX: n.nodeLabelOffsetX ?? 0,
      nodeLabelOffsetY: n.nodeLabelOffsetY ?? 0,
      group: n.group || '',
    })),
    links: custom.links.map(l => ({
      id: l.id,
      source: l.source,
      target: l.target,
      label: l.label || '',
      type: l.style === 'dashed' ? 'DASHED' : l.style === 'dotted' ? 'DOTTED' : l.style === 'curved' ? 'CURVED' : 'STRAIGHT',
      srcIp: l.srcIp || '',
      dstIp: l.dstIp || '',
      srcPortName: l.srcPortName || '',
      dstPortName: l.dstPortName || '',
      curveOffsetX: l.curveOffsetX ?? 0,
      curveOffsetY: l.curveOffsetY ?? 0,
      labelOffsetX: l.labelOffsetX ?? 0,
      labelOffsetY: l.labelOffsetY ?? 0,
      settings: {
        showArrows: l.showArrows ?? linkCfg?.showArrows ?? false,
        smartRouting: true,
        avoidCrossingNodes: true,
        strokeWidth: l.strokeWidth ?? linkCfg?.strokeWidth ?? 2.5,
        curveIntensity: l.curveIntensity ?? linkCfg?.curveIntensity ?? 0.1,
        parallelOffset: l.parallelOffset ?? linkCfg?.parallelOffset ?? 0,
      },
    })),
    groups: (custom.groups || []).map(g => ({
      id: g.id,
      name: g.name,
      label: g.label,
      x: g.x,
      y: g.y,
      width: g.width,
      height: g.height,
      color: g.color,
    })),
    displaySettings: dispSettings ? { nodeLabelSize: dispSettings.nodeLabelSize, linkLabelSize: dispSettings.linkLabelSize, linkDisplayMode: dispSettings.linkDisplayMode } : { nodeLabelSize: 10, linkLabelSize: 9, linkDisplayMode: 'merged' },
    defaultViewport: defViewport || { k: 1, x: 0, y: 0 },
  };
}

import { customToSavedTopology, savedToCustomTopology } from './utils/topologyConverter';
import { useForceLightMode } from './hooks/useForceLightMode';
import {
  NodeEditPanel,
  LinkEditPanel,
  CSVUploadDialog,
  LayoutDialog,
  LinkConfigPanel,
  DEFAULT_LINK_CONFIG,
  AppearancePanel,
  DEFAULT_DISPLAY_SETTINGS,
} from './components';
import type { LinkConfig } from './components/LinkConfigPanel';
import type { DisplaySettings } from './components/AppearancePanel';
import { SaveToManagerDialog } from './components/SaveToManagerDialog';
import { calculateLayoutPositions } from './shared';
import { AddElementDialog } from './components/AddElementDialog';
import { ConnectionTableDialog } from './components/ConnectionTableDialog';
import { AlarmConfigDialog } from './components/AlarmConfigDialog';
import { AddFromInventoryDialog, type InventoryRow } from './components/AddFromInventoryDialog';
import * as topologyApi from './services/topologyApi';
import {
  ZOOM_EXTENT,
  zoomIn as canvasZoomIn,
  zoomOut as canvasZoomOut,
  applyFitToView,
  apply1to1View,
  getNodesBoundingBox,
  computeFitTransform,
} from './utils/canvasUtils';
export interface ConnectionRow {
  linkId: string; // maps to CustomLink.id
  sourceNode: string;
  sourceIcon: string;
  destNode: string;
  destIcon: string;
  linkLabel: string;
  linkType: CustomLinkStyle;
}

import { EQUIPMENT_ICON_OPTIONS, resolveIconType, renderEquipmentIcon } from './utils/nodeIcons';

const ICON_OPTIONS = EQUIPMENT_ICON_OPTIONS.map(opt => ({
  value: opt.value,
  label: opt.label,
}));

const LINK_STYLE_OPTIONS: { value: CustomLinkStyle; label: string }[] = [
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' },
  { value: 'curved', label: 'Curved' },
  { value: 'step', label: 'Step' },
  { value: 'animated', label: 'Animated' },
  { value: 'glow', label: 'Glow' },
];

function getStatusColor(status?: string): string {
  switch (status) {
    case 'active': return 'hsl(142, 76%, 36%)';
    case 'warning': return 'hsl(48, 96%, 53%)';
    case 'error': return 'hsl(0, 84%, 60%)';
    default: return 'hsl(215, 16%, 47%)';
  }
}

interface CreateTopologyTableProps {
  editId?: string;
}

export default function CreateTopologyTable({ editId }: CreateTopologyTableProps) {
  useForceLightMode();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editVendor = searchParams.get('vendor') || undefined;
  const isDark = false;
  // API-based topology storage (mock localStorage, swap to live API later)

  // Use the CustomTopology storage as primary data source
  const {
    currentTopology,
    createEmptyTopology,
    saveTopologyWithName,
    addNode,
    updateNodePosition,
    updateNode,
    deleteNode,
    addLink,
    updateLink,
    deleteLink,
    updateCurrentTopology,
    exportTopology,
    importTopology,
    canvasConfig,
    saveCanvasConfig,
    setCurrentTopology,
  } = useCustomTopologyStorage();

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const transformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);

  const [activeTab, setActiveTab] = useState<string>('canvas');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showAddNode, setShowAddNode] = useState(false);
  const [showAddLink, setShowAddLink] = useState(false);
  const [showLayoutDialog, setShowLayoutDialog] = useState(false);
  const [showCSVUpload, setShowCSVUpload] = useState(false);
  const [showLinkConfig, setShowLinkConfig] = useState(false);
  const [showDataTable, setShowDataTable] = useState(false);
  const [showAlarmConfig, setShowAlarmConfig] = useState(false);
  const [selectedNode, setSelectedNode] = useState<CustomNode | null>(null);
  const [selectedLink, setSelectedLink] = useState<CustomLink | null>(null);
  const [localConfig, setLocalConfig] = useState<CanvasConfig>(canvasConfig);
  const [linkConfig, setLinkConfig] = useState<LinkConfig>(DEFAULT_LINK_CONFIG);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [isEditMode, setIsEditMode] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [previewMode, setPreviewMode] = useState(false);
  const [showInventoryDialog, setShowInventoryDialog] = useState(false);
  const [isActualSize, setIsActualSize] = useState(false);
  const [showAppearance, setShowAppearance] = useState(false);
  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>(DEFAULT_DISPLAY_SETTINGS);
  const [monitorEnabled, setMonitorEnabled] = useState(false);
  const hasInitialFit = useRef(false);
  const previewSvgRef = useRef<SVGSVGElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Multi-select state
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const selectionStartRef = useRef<{ x: number; y: number } | null>(null);


  const [copiedNode, setCopiedNode] = useState<CustomNode | null>(null);
  const [linkFromNode, setLinkFromNode] = useState<string | null>(null);

  useEffect(() => {
    if (editId) {
      logActivity({ activity: `Edit Topology page opened: ${editId}`, actionName: "EDIT_TOPOLOGY_PAGE", module: "TOPOLOGY_UTILITY" });
    } else {
      logActivity({ activity: "Create Topology page opened", actionName: "CREATE_TOPOLOGY_PAGE", module: "TOPOLOGY_UTILITY" });
    }
  }, [editId]);

  // Load existing topology for edit mode (via API)
  useEffect(() => {
    if (editId) {
      topologyApi.getTopology(editId, editVendor).then(saved => {
        if (saved) {
          setIsEditMode(true);
          setMonitorEnabled(!!saved.monitorEnabled);
          if (saved.displaySettings) {
            setDisplaySettings({
              nodeLabelSize: saved.displaySettings.nodeLabelSize ?? DEFAULT_DISPLAY_SETTINGS.nodeLabelSize,
              linkLabelSize: saved.displaySettings.linkLabelSize ?? DEFAULT_DISPLAY_SETTINGS.linkLabelSize,
              linkDisplayMode: (saved.displaySettings as any).linkDisplayMode === 'multi' ? 'multi' : 'merged',
            });
          }
          const firstLinkSettings = saved.links[0]?.settings;
          if (firstLinkSettings) {
            setLinkConfig(prev => ({
              ...prev,
              showArrows: firstLinkSettings.showArrows ?? prev.showArrows,
              strokeWidth: firstLinkSettings.strokeWidth ?? prev.strokeWidth,
              curveIntensity: firstLinkSettings.curveIntensity ?? prev.curveIntensity,
              parallelOffset: firstLinkSettings.parallelOffset ?? prev.parallelOffset,
            }));
          }
          if (saved.defaultViewport) {
            transformRef.current = d3.zoomIdentity.translate(saved.defaultViewport.x, saved.defaultViewport.y).scale(saved.defaultViewport.k);
            hasInitialFit.current = true;
          }
          const customTopo = apiToCustomTopology(saved);
          setCurrentTopology(customTopo);
        } else {
          toast.error('Topology not found');
          navigate('/manage-topology');
        }
      });
    } else if (!currentTopology) {
      createEmptyTopology();
    }
  }, [editId]);

  // Derive connection rows from currentTopology for table view
  const connectionRows = useMemo<ConnectionRow[]>(() => {
    if (!currentTopology) return [];
    return currentTopology.links.map(link => {
      const srcNode = currentTopology.nodes.find(n => n.id === link.source);
      const destNode = currentTopology.nodes.find(n => n.id === link.target);
      return {
        linkId: link.id,
        sourceNode: srcNode?.label || link.source,
        sourceIcon: srcNode?.type || 'datacenter',
        destNode: destNode?.label || link.target,
        destIcon: destNode?.type || 'datacenter',
        linkLabel: link.label || '',
        linkType: link.style,
      };
    });
  }, [currentTopology]);

  // Table row operations - update canonical data
  const addTableRow = useCallback(() => {
    if (!currentTopology) return;
    // Add placeholder nodes and a link
    const srcName = `Node-${currentTopology.nodes.length + 1}`;
    const destName = `Node-${currentTopology.nodes.length + 2}`;
    const srcId = `node-${Date.now()}-src`;
    const destId = `node-${Date.now()}-dest`;

    // Auto-position
    const existingXs = currentTopology.nodes.map(n => n.x);
    const existingYs = currentTopology.nodes.map(n => n.y);
    const baseX = existingXs.length > 0 ? Math.max(...existingXs) + 150 : 200;
    const baseY = existingYs.length > 0 ? (existingYs.reduce((a, b) => a + b, 0) / existingYs.length) : 300;

    const newNodes: CustomNode[] = [
      { id: srcId, label: srcName, x: baseX, y: baseY - 60, type: 'datacenter' },
      { id: destId, label: destName, x: baseX, y: baseY + 60, type: 'datacenter' },
    ];
    const newLink: CustomLink = {
      id: `link-${Date.now()}`,
      source: srcId,
      target: destId,
      style: 'curved',
    };

    updateCurrentTopology({
      nodes: [...currentTopology.nodes, ...newNodes],
      links: [...currentTopology.links, newLink],
    });
  }, [currentTopology, updateCurrentTopology]);

  const updateTableRow = useCallback((linkId: string, field: string, value: string) => {
    if (!currentTopology) return;

    const link = currentTopology.links.find(l => l.id === linkId);
    if (!link) return;

    if (field === 'linkLabel') {
      updateLink(linkId, { label: value || undefined });
    } else if (field === 'linkType') {
      updateLink(linkId, { style: value as CustomLinkStyle });
    } else if (field === 'sourceNode') {
      const srcNode = currentTopology.nodes.find(n => n.id === link.source);
      if (srcNode) updateNode(srcNode.id, { label: value });
    } else if (field === 'destNode') {
      const destNode = currentTopology.nodes.find(n => n.id === link.target);
      if (destNode) updateNode(destNode.id, { label: value });
    } else if (field === 'sourceIcon') {
      const srcNode = currentTopology.nodes.find(n => n.id === link.source);
      if (srcNode) updateNode(srcNode.id, { type: value as CustomNode['type'] });
    } else if (field === 'destIcon') {
      const destNode = currentTopology.nodes.find(n => n.id === link.target);
      if (destNode) updateNode(destNode.id, { type: value as CustomNode['type'] });
    } else if (field === 'sourceGroup') {
      const srcNode = currentTopology.nodes.find(n => n.id === link.source);
      if (srcNode) {
        updateNode(srcNode.id, { group: value || undefined });
        // Auto-create group box if it doesn't exist
        if (value && !(currentTopology.groups || []).find(g => g.name === value)) {
          autoCreateGroupBox(value, srcNode);
        }
      }
    } else if (field === 'destGroup') {
      const destNode = currentTopology.nodes.find(n => n.id === link.target);
      if (destNode) {
        updateNode(destNode.id, { group: value || undefined });
        if (value && !(currentTopology.groups || []).find(g => g.name === value)) {
          autoCreateGroupBox(value, destNode);
        }
      }
    }
  }, [currentTopology, updateLink, updateNode]);

  // Batch update: apply all field changes in a single updateCurrentTopology call
  const batchUpdateTableRow = useCallback((linkId: string, updates: Record<string, string>) => {
    if (!currentTopology) return;

    const link = currentTopology.links.find(l => l.id === linkId);
    if (!link) return;

    let updatedNodes = [...currentTopology.nodes];
    let updatedLinks = [...currentTopology.links];
    let updatedGroups = [...(currentTopology.groups || [])];

    const srcNode = updatedNodes.find(n => n.id === link.source);
    const destNode = updatedNodes.find(n => n.id === link.target);

    // Apply node-level updates
    if (updates.sourceNode && srcNode) {
      updatedNodes = updatedNodes.map(n => n.id === srcNode.id ? { ...n, label: updates.sourceNode } : n);
    }
    if (updates.destNode && destNode) {
      updatedNodes = updatedNodes.map(n => n.id === destNode.id ? { ...n, label: updates.destNode } : n);
    }
    if (updates.sourceIcon && srcNode) {
      updatedNodes = updatedNodes.map(n => n.id === srcNode.id ? { ...n, type: updates.sourceIcon as CustomNode['type'] } : n);
    }
    if (updates.destIcon && destNode) {
      updatedNodes = updatedNodes.map(n => n.id === destNode.id ? { ...n, type: updates.destIcon as CustomNode['type'] } : n);
    }
    if (updates.sourceGroup !== undefined && srcNode) {
      updatedNodes = updatedNodes.map(n => n.id === srcNode.id ? { ...n, group: updates.sourceGroup || undefined } : n);
      if (updates.sourceGroup && !updatedGroups.find(g => g.name === updates.sourceGroup)) {
        const gIdx = updatedGroups.length;
        updatedGroups.push({
          id: `group-${Date.now()}-src`,
          name: updates.sourceGroup,
          label: updates.sourceGroup,
          x: srcNode.x - 80,
          y: srcNode.y - 80,
          width: 200,
          height: 200,
          color: GROUP_COLORS[gIdx % GROUP_COLORS.length],
        });
      }
    }
    if (updates.destGroup !== undefined && destNode) {
      updatedNodes = updatedNodes.map(n => n.id === destNode.id ? { ...n, group: updates.destGroup || undefined } : n);
      if (updates.destGroup && !updatedGroups.find(g => g.name === updates.destGroup)) {
        // Check if src group exists to offer its color
        const srcGroup = updates.sourceGroup ? updatedGroups.find(g => g.name === updates.sourceGroup) : null;
        const gIdx = updatedGroups.length;
        updatedGroups.push({
          id: `group-${Date.now()}-dst`,
          name: updates.destGroup,
          label: updates.destGroup,
          x: destNode.x - 80,
          y: destNode.y - 80,
          width: 200,
          height: 200,
          color: srcGroup?.color || GROUP_COLORS[gIdx % GROUP_COLORS.length],
        });
      }
    }

    // Apply link-level updates
    const linkUpdates: Partial<CustomLink> = {};
    if (updates.linkLabel !== undefined) linkUpdates.label = updates.linkLabel || undefined;
    if (updates.linkType) linkUpdates.style = updates.linkType as CustomLinkStyle;
    if (updates.srcIp !== undefined) linkUpdates.srcIp = updates.srcIp;
    if (updates.dstIp !== undefined) linkUpdates.dstIp = updates.dstIp;
    if (updates.srcPortName !== undefined) linkUpdates.srcPortName = updates.srcPortName;
    if (updates.dstPortName !== undefined) linkUpdates.dstPortName = updates.dstPortName;

    if (Object.keys(linkUpdates).length > 0) {
      updatedLinks = updatedLinks.map(l => l.id === linkId ? { ...l, ...linkUpdates } : l);
    }

    updateCurrentTopology({
      nodes: updatedNodes,
      links: updatedLinks,
      groups: updatedGroups,
    });
  }, [currentTopology, updateCurrentTopology]);

  // Auto-create a GroupBox when a group name is set from the table
  const autoCreateGroupBox = useCallback((groupName: string, refNode: CustomNode) => {
    if (!currentTopology) return;
    const gIdx = (currentTopology.groups || []).length;
    const newGroup: GroupBox = {
      id: `group-${Date.now()}`,
      name: groupName,
      label: groupName,
      x: refNode.x - 80,
      y: refNode.y - 80,
      width: 200,
      height: 200,
      color: GROUP_COLORS[gIdx % GROUP_COLORS.length],
    };
    updateCurrentTopology({ groups: [...(currentTopology.groups || []), newGroup] });
  }, [currentTopology, updateCurrentTopology]);

  // Update group label/color/name from table
  const handleUpdateGroup = useCallback((groupName: string, updates: { name?: string; label?: string; color?: string }) => {
    if (!currentTopology) return;
    const updatedGroups = (currentTopology.groups || []).map(g =>
      g.name === groupName ? { ...g, ...updates } : g
    );
    // If name changed, also update all node group references
    let updatedNodes = currentTopology.nodes;
    if (updates.name && updates.name !== groupName) {
      updatedNodes = currentTopology.nodes.map(n =>
        n.group === groupName ? { ...n, group: updates.name! } : n
      );
    }
    updateCurrentTopology({ nodes: updatedNodes, groups: updatedGroups });
  }, [currentTopology, updateCurrentTopology]);

  const deleteTableRow = useCallback((linkId: string) => {
    deleteLink(linkId);
  }, [deleteLink]);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const update = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setDimensions({ width: Math.max(rect.width, 800), height: Math.max(rect.height, 600) });
      }
    };
    update();
    const ro = new ResizeObserver(() => requestAnimationFrame(update));
    ro.observe(container);
    return () => ro.disconnect();
  }, [activeTab]);

  // =============== D3 CANVAS RENDERING ===============
  const renderVisualization = useCallback(() => {
    if (!svgRef.current || !currentTopology) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    const { width, height } = dimensions;

    // Defs
    const defs = svg.append('defs');

    const glowFilter = defs.append('filter')
      .attr('id', 'glow').attr('x', '-50%').attr('y', '-50%')
      .attr('width', '200%').attr('height', '200%');
    glowFilter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
    const glowMerge = glowFilter.append('feMerge');
    glowMerge.append('feMergeNode').attr('in', 'coloredBlur');
    glowMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const shadowFilter = defs.append('filter')
      .attr('id', 'shadow').attr('x', '-20%').attr('y', '-20%')
      .attr('width', '140%').attr('height', '140%');
    shadowFilter.append('feDropShadow')
      .attr('dx', '0').attr('dy', '4').attr('stdDeviation', '6')
      .attr('flood-color', 'rgba(0,0,0,0.3)');

    // Arrow markers removed — arrows are drawn manually at link midpoints

    // Zoom
    const g = svg.append('g').attr('transform', transformRef.current.toString());
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent(ZOOM_EXTENT)
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        transformRef.current = event.transform;
        setZoomLevel(event.transform.k);
      });
    zoomRef.current = zoom;
    svg.call(zoom);

    // Auto-fit on initial load, otherwise restore saved transform
    if (!hasInitialFit.current && currentTopology.nodes.length > 0) {
      hasInitialFit.current = true;
      const bbox = getNodesBoundingBox(currentTopology.nodes);
      if (bbox) {
        const fitT = computeFitTransform(bbox, width, height);
        svg.call(zoom.transform, fitT);
        transformRef.current = fitT;
      }
    } else {
      svg.call(zoom.transform, transformRef.current);
    }

    // Disable right-click context menu on canvas
    svg.on('contextmenu', (event: MouseEvent) => {
      event.preventDefault();
    });

    // Selection box
    svg.on('mousedown', (event: MouseEvent) => {
      if (event.shiftKey && event.button === 0) {
        event.preventDefault();
        const [x, y] = d3.pointer(event);
        const transform = transformRef.current;
        selectionStartRef.current = { x: (x - transform.x) / transform.k, y: (y - transform.y) / transform.k };
        setIsSelecting(true);
      }
    });
    svg.on('mousemove', (event: MouseEvent) => {
      if (isSelecting && selectionStartRef.current) {
        const [x, y] = d3.pointer(event);
        const transform = transformRef.current;
        const cx = (x - transform.x) / transform.k;
        const cy = (y - transform.y) / transform.k;
        setSelectionBox({
          x: Math.min(selectionStartRef.current.x, cx),
          y: Math.min(selectionStartRef.current.y, cy),
          width: Math.abs(cx - selectionStartRef.current.x),
          height: Math.abs(cy - selectionStartRef.current.y),
        });
      }
    });
    svg.on('mouseup', () => {
      if (isSelecting && selectionBox && currentTopology) {
        const selected = new Set<string>();
        currentTopology.nodes.forEach(node => {
          if (node.x >= selectionBox.x && node.x <= selectionBox.x + selectionBox.width &&
              node.y >= selectionBox.y && node.y <= selectionBox.y + selectionBox.height) {
            selected.add(node.id);
          }
        });
        setSelectedNodes(selected);
        if (selected.size > 0) toast.success(`Selected ${selected.size} nodes`);
      }
      setIsSelecting(false);
      setSelectionBox(null);
      selectionStartRef.current = null;
    });

    // Grid
    if (localConfig.showGrid) {
      const gridSize = localConfig.gridSize;
      const gridGroup = g.append('g');
      const gridExtent = Math.max(width, height) * 2;
      const startX = -gridExtent / 2;
      for (let x = startX; x < gridExtent; x += gridSize) {
        gridGroup.append('line')
          .attr('x1', x).attr('y1', startX).attr('x2', x).attr('y2', gridExtent)
          .attr('stroke', 'hsl(var(--muted-foreground))').attr('stroke-opacity', 0.1).attr('stroke-width', 0.5);
      }
      for (let y = startX; y < gridExtent; y += gridSize) {
        gridGroup.append('line')
          .attr('x1', startX).attr('y1', y).attr('x2', gridExtent).attr('y2', y)
          .attr('stroke', 'hsl(var(--muted-foreground))').attr('stroke-opacity', 0.1).attr('stroke-width', 0.5);
      }
      for (let x = startX; x < gridExtent; x += gridSize * 5) {
        gridGroup.append('line')
          .attr('x1', x).attr('y1', startX).attr('x2', x).attr('y2', gridExtent)
          .attr('stroke', 'hsl(var(--muted-foreground))').attr('stroke-opacity', 0.2).attr('stroke-width', 1);
      }
      for (let y = startX; y < gridExtent; y += gridSize * 5) {
        gridGroup.append('line')
          .attr('x1', startX).attr('y1', y).attr('x2', gridExtent).attr('y2', y)
          .attr('stroke', 'hsl(var(--muted-foreground))').attr('stroke-opacity', 0.2).attr('stroke-width', 1);
      }
    }

    // ─── Draw Group Boxes (behind links and nodes) ───
    const groupLayer = g.append('g').attr('class', 'group-boxes');
    if (currentTopology.groups && currentTopology.groups.length > 0) {
      currentTopology.groups.forEach((group, gIdx) => {
        const gGroup = groupLayer.append('g')
          .attr('class', 'topology-group-box')
          .attr('data-group', group.name);

        // Background rect
        gGroup.append('rect')
          .attr('x', group.x).attr('y', group.y)
          .attr('width', group.width).attr('height', group.height)
          .attr('rx', 12).attr('ry', 12)
          .attr('fill', group.color || GROUP_COLORS[gIdx % GROUP_COLORS.length])
          .attr('stroke', GROUP_BORDER_COLORS[gIdx % GROUP_BORDER_COLORS.length])
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '6,3');

        // Label — position based on prefix
        const { position: labelPos } = _parseGroupName(group.name);
        const displayText = group.label ? _getDisplayName(group.label) : _getDisplayName(group.name);
        const labelCoords = _getGroupLabelCoords(group.x, group.y, group.width, group.height, labelPos);
        gGroup.append('text')
          .attr('x', labelCoords.x).attr('y', labelCoords.y)
          .attr('text-anchor', labelCoords.anchor)
          .attr('font-size', '12px').attr('font-weight', '600')
          .attr('fill', 'hsl(var(--foreground))')
          .attr('opacity', 0.8)
          .text(displayText);

        // Drag the entire group (moves all contained nodes)
        const groupName = group.name;
        const groupId = group.id;
        gGroup.attr('cursor', 'move');
        gGroup.call(d3.drag<SVGGElement, unknown>()
          .on('start', function() { (this as any).__startX = group.x; (this as any).__startY = group.y; })
          .on('drag', function(event) {
            const dx = event.x - ((this as any).__startX + group.width / 2);
            const dy = event.y - ((this as any).__startY + group.height / 2);
            const newX = (this as any).__startX + dx;
            const newY = (this as any).__startY + dy;
            d3.select(this).select('rect').attr('x', newX).attr('y', newY);
            const dragLabelCoords = _getGroupLabelCoords(newX, newY, group.width, group.height, labelPos);
            d3.select(this).select('text').attr('x', dragLabelCoords.x).attr('y', dragLabelCoords.y);
            // Also move resize handle
            d3.select(this).select('.group-resize-handle')
              .attr('x', newX + group.width - 14).attr('y', newY + group.height - 14);
          })
          .on('end', function(event) {
            const dx = event.x - ((this as any).__startX + group.width / 2);
            const dy = event.y - ((this as any).__startY + group.height / 2);
            const newX = (this as any).__startX + dx;
            const newY = (this as any).__startY + dy;
            // Move all nodes in this group
            const groupNodes = currentTopology.nodes.filter(n => n.group === groupName);
            const offsetX = newX - group.x;
            const offsetY = newY - group.y;
            groupNodes.forEach(n => {
              updateNodePosition(n.id, n.x + offsetX, n.y + offsetY);
            });
            // Update group box position
            const updatedGroups = (currentTopology.groups || []).map(g =>
              g.id === groupId ? { ...g, x: newX, y: newY } : g
            );
            updateCurrentTopology({ groups: updatedGroups });
          }) as any
        );

        // Resize handle (bottom-right corner)
        gGroup.append('rect')
          .attr('class', 'group-resize-handle')
          .attr('x', group.x + group.width - 14).attr('y', group.y + group.height - 14)
          .attr('width', 10).attr('height', 10)
          .attr('rx', 2).attr('ry', 2)
          .attr('fill', GROUP_BORDER_COLORS[gIdx % GROUP_BORDER_COLORS.length])
          .attr('cursor', 'nwse-resize')
          .call(d3.drag<SVGRectElement, unknown>()
            .on('drag', function(event) {
              const newWidth = Math.max(100, event.x - group.x);
              const newHeight = Math.max(60, event.y - group.y);
              gGroup.select('rect:first-child').attr('width', newWidth).attr('height', newHeight);
              d3.select(this).attr('x', group.x + newWidth - 14).attr('y', group.y + newHeight - 14);
            })
            .on('end', function(event) {
              const newWidth = Math.max(100, event.x - group.x);
              const newHeight = Math.max(60, event.y - group.y);
              const updatedGroups = (currentTopology.groups || []).map(g =>
                g.id === groupId ? { ...g, width: newWidth, height: newHeight } : g
              );
              updateCurrentTopology({ groups: updatedGroups });
            }) as any
          );
      });
    }

    // Draw links — fan-out curves connecting to node center
    const linkGroup = g.append('g');
    const handleGroup = g.append('g'); // Draggable curve handles on top of links

    const isMergedMode = displaySettings.linkDisplayMode !== 'multi';
    // Group parallel links by unordered (source,target) pair
    const linkPairMap = new Map<string, typeof currentTopology.links>();
    currentTopology.links.forEach(l => {
      const key = [l.source, l.target].sort().join('|');
      if (!linkPairMap.has(key)) linkPairMap.set(key, []);
      linkPairMap.get(key)!.push(l);
    });

    currentTopology.links.forEach(link => {
      const sourceNode = currentTopology.nodes.find(n => n.id === link.source);
      const targetNode = currentTopology.nodes.find(n => n.id === link.target);
      if (!sourceNode || !targetNode) return;

      const pairKey = [link.source, link.target].sort().join('|');
      const parallelLinks = linkPairMap.get(pairKey) || [link];
      // In merged (Single Line) mode render only the first link of a parallel bundle
      if (isMergedMode && parallelLinks[0].id !== link.id) return;
      const parallelCount = isMergedMode ? 1 : parallelLinks.length;
      const parallelIndex = isMergedMode ? 0 : parallelLinks.findIndex(l => l.id === link.id);

      const sx = sourceNode.x, sy = sourceNode.y;
      const tx = targetNode.x, ty = targetNode.y;
      const pathResult = computeLinkPath({ sx, sy, tx, ty, curveOffsetX: link.curveOffsetX, curveOffsetY: link.curveOffsetY, parallelCount, parallelIndex, linkType: link.style });
      const { pathData, ctrlX, ctrlY, midX, midY, perpX, perpY } = pathResult;

      const dashArray = getLinkDashArray(link.style);
      const isAnimated = isAnimatedStyle(link.style);
      const hasGlow = hasGlowEffect(link.style);
      const linkColor = '#22c55e';
      const strokeWidth = link.strokeWidth ?? linkConfig.strokeWidth;
      const showArrows = link.showArrows ?? linkConfig.showArrows;

      // Shadow
      linkGroup.append('path')
        .attr('d', pathData).attr('fill', 'none')
        .attr('stroke', 'rgba(0,0,0,0.1)').attr('stroke-width', strokeWidth + 2)
        .attr('stroke-linecap', 'round');

      // Main link path
      const linkPath = linkGroup.append('path')
        .attr('d', pathData).attr('fill', 'none')
        .attr('stroke', linkColor).attr('stroke-width', strokeWidth)
        .attr('stroke-linecap', 'round').attr('stroke-linejoin', 'round')
        .attr('stroke-dasharray', dashArray)
        .attr('class', 'cursor-pointer').attr('data-id', link.id);

      // Hover tooltip listing per-port pairs when in merged mode
      if (isMergedMode && parallelLinks.length > 1) {
        const portsSummary = parallelLinks
          .map(pl => `${pl.srcPortName || '-'}  →  ${pl.dstPortName || '-'}${pl.label ? ' (' + pl.label + ')' : ''}`)
          .join('\n');
        linkPath.append('title').text(`${sourceNode.label} → ${targetNode.label}\n${parallelLinks.length} ports:\n${portsSummary}`);
      }

      if (hasGlow) linkPath.attr('filter', 'url(#glow)');
      // Animation removed — static rendering only

      // Arrow at midpoint
      if (showArrows) {
        const pathEl = linkPath.node();
        if (pathEl) {
          const totalLen = pathEl.getTotalLength();
          const midPt = pathEl.getPointAtLength(totalLen / 2);
          const nearPt = pathEl.getPointAtLength(totalLen / 2 + 1);
          const angle = Math.atan2(nearPt.y - midPt.y, nearPt.x - midPt.x) * 180 / Math.PI;
          const arrowSize = linkConfig.arrowSize || 6;
          linkGroup.append('polygon')
            .attr('points', `0,${-arrowSize} ${arrowSize * 2},0 0,${arrowSize}`)
            .attr('transform', `translate(${midPt.x}, ${midPt.y}) rotate(${angle})`)
            .attr('fill', linkColor);
        }
      }

      // Click to select
      linkPath
        .on('click', () => { setSelectedLink(link); setSelectedNode(null); setSelectedNodes(new Set()); })
        .on('contextmenu', (event: MouseEvent) => {
          event.preventDefault(); event.stopPropagation();
        })
        .on('mouseenter', function() { d3.select(this).attr('stroke-width', strokeWidth + 2); })
        .on('mouseleave', function() { d3.select(this).attr('stroke-width', strokeWidth); });

      // Direct link dragging — drag anywhere on the link path to adjust curve
      const hitArea = linkGroup.append('path')
        .attr('d', pathData).attr('fill', 'none')
        .attr('stroke', 'transparent').attr('stroke-width', 12)
        .attr('cursor', 'grab').attr('data-hit', link.id);

      const linkId = link.id;
      hitArea.call(d3.drag<SVGPathElement, unknown>()
        .on('start', function() { d3.select(this).attr('cursor', 'grabbing'); })
        .on('drag', function(event) {
          const newCtrlX = event.x;
          const newCtrlY = event.y;
          const newPath = `M ${sx} ${sy} Q ${newCtrlX} ${newCtrlY} ${tx} ${ty}`;
          linkGroup.selectAll(`path[data-id="${linkId}"]`).attr('d', newPath);
          d3.select(this).attr('d', newPath);
          // Update handle position too
          handleGroup.selectAll(`circle[data-link="${linkId}"]`).attr('cx', newCtrlX).attr('cy', newCtrlY);
        })
        .on('end', function(event) {
          d3.select(this).attr('cursor', 'grab');
          const offsetX = event.x - midX;
          const offsetY = event.y - midY;
          updateLink(linkId, { curveOffsetX: offsetX, curveOffsetY: offsetY });
        }) as any
      );

      // Link label priority: port names → port count (merged parallel) → link.label
      const portPair = (link.srcPortName || link.dstPortName)
        ? `${link.srcPortName || ''}${link.srcPortName && link.dstPortName ? ' → ' : ''}${link.dstPortName || ''}`
        : '';
      const mergedLabel = isMergedMode && parallelLinks.length > 1
        ? `${parallelLinks.length} ports`
        : (portPair || link.label || '');
      if (mergedLabel) {
        const pathEl = linkPath.node();
        if (pathEl) {
          const totalLen = pathEl.getTotalLength();
          const labelPt = pathEl.getPointAtLength(totalLen / 2);
          const labelPos = getLinkLabelPosition(labelPt.x, labelPt.y, perpX, perpY, link.labelOffsetX, link.labelOffsetY);
          const angle = getLinkLabelAngle(pathEl);

          const labelEl = linkGroup.append('text')
            .attr('x', labelPos.x).attr('y', labelPos.y)
            .attr('text-anchor', 'middle')
            .attr('fill', 'hsl(var(--foreground))').attr('font-size', `${displaySettings.linkLabelSize}px`).attr('font-weight', '500')
            .attr('cursor', 'move')
            .attr('transform', `rotate(${angle}, ${labelPos.x}, ${labelPos.y})`)
            .text(mergedLabel);

          // Make label draggable
          labelEl.call(d3.drag<SVGTextElement, unknown>()
            .on('drag', function(event) {
              d3.select(this)
                .attr('x', event.x).attr('y', event.y)
                .attr('transform', `rotate(${angle}, ${event.x}, ${event.y})`);
            })
            .on('end', function(event) {
              const newOffX = event.x - labelPt.x;
              const newOffY = event.y - labelPt.y;
              updateLink(linkId, { labelOffsetX: newOffX, labelOffsetY: newOffY });
            }) as any
          );
        }
      }

      // Draggable curve handle at control point
      const handleRadius = 5;
      const handle = handleGroup.append('circle')
        .attr('cx', ctrlX).attr('cy', ctrlY)
        .attr('r', handleRadius)
        .attr('fill', 'hsl(var(--primary))').attr('fill-opacity', 0.7)
        .attr('stroke', 'hsl(var(--primary-foreground))').attr('stroke-width', 1.5)
        .attr('cursor', 'grab')
        .attr('class', 'curve-handle')
        .attr('data-link', linkId);

      // Show handle on hover, otherwise semi-transparent
      handle.attr('opacity', 0.3)
        .on('mouseenter', function() { d3.select(this).attr('opacity', 1).attr('r', handleRadius + 2); })
        .on('mouseleave', function() { d3.select(this).attr('opacity', 0.3).attr('r', handleRadius); });

      handle.call(d3.drag<SVGCircleElement, unknown>()
        .on('start', function() { d3.select(this).attr('cursor', 'grabbing').attr('opacity', 1); })
        .on('drag', function(event) {
          const newCtrlX = event.x;
          const newCtrlY = event.y;
          d3.select(this).attr('cx', newCtrlX).attr('cy', newCtrlY);
          const newPath = `M ${sx} ${sy} Q ${newCtrlX} ${newCtrlY} ${tx} ${ty}`;
          linkGroup.selectAll(`path[data-id="${linkId}"]`).attr('d', newPath);
          linkGroup.selectAll(`path[data-hit="${linkId}"]`).attr('d', newPath);
        })
        .on('end', function(event) {
          d3.select(this).attr('cursor', 'grab');
          const offsetX = event.x - midX;
          const offsetY = event.y - midY;
          updateLink(linkId, { curveOffsetX: offsetX, curveOffsetY: offsetY });
        }) as any
      );
    });

    // Draw nodes
    const nodeGroup = g.append('g');
    currentTopology.nodes.forEach(node => {
      const nodeSize = node.size || 35;
      const isSelected = selectedNodes.has(node.id);

      const nodeG = nodeGroup.append('g')
        .attr('class', 'node cursor-pointer')
        .attr('transform', `translate(${node.x}, ${node.y})`)
        .attr('data-id', node.id)
        .call(d3.drag<SVGGElement, unknown>()
          .filter((event) => {
            // Don't start node drag when clicking on the label text (let label drag handle it)
            return !(event.target instanceof SVGTextElement);
          })
          .on('start', function() {
            d3.select(this).raise();
            (this as any).__dragged = false;
          })
          .on('drag', function(event) {
            (this as any).__dragged = true;
            let newX = event.x, newY = event.y;
            if (localConfig.snapToGrid) {
              newX = Math.round(newX / localConfig.gridSize) * localConfig.gridSize;
              newY = Math.round(newY / localConfig.gridSize) * localConfig.gridSize;
            }
            d3.select(this).attr('transform', `translate(${newX}, ${newY})`);
            if (selectedNodes.size > 1 && selectedNodes.has(node.id)) {
              const dx = newX - node.x, dy = newY - node.y;
              nodeGroup.selectAll('.node').each(function() {
                const el = d3.select(this);
                const id = el.attr('data-id');
                if (id && selectedNodes.has(id) && id !== node.id) {
                  const n = currentTopology.nodes.find(n => n.id === id);
                  if (n) {
                    let nx = n.x + dx, ny = n.y + dy;
                    if (localConfig.snapToGrid) {
                      nx = Math.round(nx / localConfig.gridSize) * localConfig.gridSize;
                      ny = Math.round(ny / localConfig.gridSize) * localConfig.gridSize;
                    }
                    el.attr('transform', `translate(${nx}, ${ny})`);
                  }
                }
              });
            }
          })
          .on('end', function(event) {
            const wasDragged = (this as any).__dragged;
            let newX = event.x, newY = event.y;
            if (localConfig.snapToGrid) {
              newX = Math.round(newX / localConfig.gridSize) * localConfig.gridSize;
              newY = Math.round(newY / localConfig.gridSize) * localConfig.gridSize;
            }
            if (selectedNodes.size > 1 && selectedNodes.has(node.id)) {
              const dx = newX - node.x, dy = newY - node.y;
              selectedNodes.forEach(id => {
                const n = currentTopology.nodes.find(n => n.id === id);
                if (n) {
                  let nx = n.x + dx, ny = n.y + dy;
                  if (localConfig.snapToGrid) {
                    nx = Math.round(nx / localConfig.gridSize) * localConfig.gridSize;
                    ny = Math.round(ny / localConfig.gridSize) * localConfig.gridSize;
                  }
                  updateNodePosition(id, nx, ny);
                }
              });
            } else {
              updateNodePosition(node.id, newX, newY);
            }
            // If no drag movement, treat as a click to open edit panel
            if (!wasDragged) {
              const sourceEvent = event.sourceEvent as MouseEvent | undefined;
              if (sourceEvent?.shiftKey) {
                const newSelected = new Set(selectedNodes);
                newSelected.has(node.id) ? newSelected.delete(node.id) : newSelected.add(node.id);
                setSelectedNodes(newSelected);
                return;
              }
              if (linkFromNode && linkFromNode !== node.id) {
                addLink({ source: linkFromNode, target: node.id, style: linkConfig.defaultStyle });
                setLinkFromNode(null);
                toast.success('Link created');
                return;
              }
              setSelectedNode(node); setSelectedLink(null); setSelectedNodes(new Set());
            }
          }) as any
        )
        .on('contextmenu', (event: MouseEvent) => {
          event.preventDefault(); event.stopPropagation();
        });

      // Node icon — SVG equipment icon matching Span/CONC topology style
      const iconType = resolveIconType(node.type);
      renderEquipmentIcon(nodeG as any, iconType, { isDark });

      const baseY = getNodeLabelBaseY(nodeSize);
      const labelPos = getNodeLabelPosition(node.nodeLabelOffsetX, node.nodeLabelOffsetY, nodeSize);
      const nodeLabelEl = nodeG.append('text')
        .attr('class', 'node-label')
        .attr('text-anchor', 'middle').attr('x', labelPos.x).attr('y', labelPos.y)
        .attr('fill', 'hsl(var(--foreground))').attr('font-size', `${displaySettings.nodeLabelSize}px`).attr('font-weight', '500')
        .text(node.label);

      // Make node label draggable
      const defaultLabelX = 0;
      const defaultLabelY = baseY;
      nodeLabelEl.attr('pointer-events', 'all').attr('cursor', 'move');
      const nodeId = node.id;
      nodeLabelEl.call(d3.drag<SVGTextElement, unknown>()
        .on('start', function(event) {
          event.sourceEvent.stopPropagation();
        })
        .on('drag', function(event) {
          d3.select(this).attr('x', event.x).attr('y', event.y);
        })
        .on('end', function(event) {
          updateNode(nodeId, {
            nodeLabelOffsetX: event.x - defaultLabelX,
            nodeLabelOffsetY: event.y - defaultLabelY,
          });
        }) as any
      );
    });

    // Selection box
    if (selectionBox) {
      g.append('rect')
        .attr('x', selectionBox.x).attr('y', selectionBox.y)
        .attr('width', selectionBox.width).attr('height', selectionBox.height)
        .attr('fill', 'hsl(var(--primary) / 0.1)')
        .attr('stroke', 'hsl(var(--primary))').attr('stroke-width', 1).attr('stroke-dasharray', '4,4');
    }
  }, [currentTopology, dimensions, localConfig, linkConfig, displaySettings, updateNodePosition, updateLink, addLink, linkFromNode, selectedNodes, selectionBox, isSelecting]);

  useEffect(() => {
    if (activeTab === 'canvas') renderVisualization();
  }, [renderVisualization, activeTab]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodes.size > 0) {
          selectedNodes.forEach(id => deleteNode(id));
          setSelectedNodes(new Set());
          toast.success(`Deleted ${selectedNodes.size} nodes`);
        } else if (selectedNode) {
          deleteNode(selectedNode.id); setSelectedNode(null);
        } else if (selectedLink) {
          deleteLink(selectedLink.id); setSelectedLink(null);
        }
      }
      if (e.key === 'Escape') {
        setSelectedNode(null); setSelectedLink(null); setSelectedNodes(new Set());
        setLinkFromNode(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode, selectedLink, selectedNodes, deleteNode, deleteLink]);

  // =============== HANDLERS ===============
  const handleAddNode = (node: Omit<CustomNode, 'id'>) => { addNode(node); toast.success('Node added'); };
  const handleAddNodeAtPosition = (x: number, y: number) => {
    addNode({ label: `Node ${(currentTopology?.nodes.length || 0) + 1}`, x, y, type: 'datacenter', status: 'active' });
    toast.success('Node added');
  };
  const handleAddLink = (link: Omit<CustomLink, 'id'>) => { addLink(link); toast.success('Link added'); };
  const handleUpdateNode = (nodeId: string, updates: Partial<CustomNode>) => { updateNode(nodeId, updates); };

  // Handle group assignment from NodeEditPanel — auto-create/recalculate group box instantly
  const handleNodeGroupChange = useCallback((nodeId: string, groupName: string | undefined, groupColor?: string) => {
    if (!currentTopology) return;

    let updatedNodes = currentTopology.nodes.map(n => n.id === nodeId ? { ...n, group: groupName } : n);
    let updatedGroups = [...(currentTopology.groups || [])];

    if (groupName) {
      // Get all nodes in this group (including the one being updated)
      const groupNodes = updatedNodes.filter(n => n.group === groupName);

      const existingGroup = updatedGroups.find(g => g.name === groupName);
      if (existingGroup) {
        // Recalculate bounding box
        if (groupNodes.length > 0) {
          const padding = 60;
          const xs = groupNodes.map(n => n.x);
          const ys = groupNodes.map(n => n.y);
          updatedGroups = updatedGroups.map(g => g.name === groupName ? {
            ...g,
            x: Math.min(...xs) - padding,
            y: Math.min(...ys) - padding,
            width: Math.max(...xs) - Math.min(...xs) + padding * 2,
            height: Math.max(...ys) - Math.min(...ys) + padding * 2,
            color: groupColor || g.color,
          } : g);
        }
        // Update color if changed
        if (groupColor) {
          updatedGroups = updatedGroups.map(g => g.name === groupName ? { ...g, color: groupColor } : g);
        }
      } else {
        // Create new group box
        const padding = 60;
        const xs = groupNodes.map(n => n.x);
        const ys = groupNodes.map(n => n.y);
        const gIdx = updatedGroups.length;
        updatedGroups.push({
          id: `group-${Date.now()}`,
          name: groupName,
          label: groupName,
          x: Math.min(...xs) - padding,
          y: Math.min(...ys) - padding,
          width: Math.max(...xs) - Math.min(...xs) + padding * 2,
          height: Math.max(...ys) - Math.min(...ys) + padding * 2,
          color: groupColor || GROUP_COLORS[gIdx % GROUP_COLORS.length],
        });
      }
    }

    // Remove empty groups (no nodes left)
    const activeGroupNames = new Set(updatedNodes.filter(n => n.group).map(n => n.group!));
    updatedGroups = updatedGroups.filter(g => activeGroupNames.has(g.name));

    updateCurrentTopology({ nodes: updatedNodes, groups: updatedGroups });
    // Update selected node reference
    const updatedNode = updatedNodes.find(n => n.id === nodeId);
    if (updatedNode) setSelectedNode(updatedNode);
  }, [currentTopology, updateCurrentTopology]);
  const handleDeleteNode = (nodeId: string) => {
    deleteNode(nodeId);
    setSelectedNodes(prev => { const next = new Set(prev); next.delete(nodeId); return next; });
  };
  const handleDuplicateNode = (nodeId: string) => {
    const node = currentTopology?.nodes.find(n => n.id === nodeId);
    if (node) { addNode({ ...node, label: `${node.label} (copy)`, x: node.x + 50, y: node.y + 50 }); }
  };
  const handleCenterOnNode = (nodeId: string) => {
    const node = currentTopology?.nodes.find(n => n.id === nodeId);
    if (node && svgRef.current && zoomRef.current) {
      d3.select(svgRef.current).transition().duration(500).call(
        zoomRef.current.transform,
        d3.zoomIdentity.translate(dimensions.width / 2, dimensions.height / 2).scale(1.5).translate(-node.x, -node.y)
      );
    }
  };
  const handleUpdateLink = (linkId: string, updates: Partial<CustomLink>) => { updateLink(linkId, updates); };
  const handleDeleteLink = (linkId: string) => { deleteLink(linkId); };
  const handleReverseLink = (linkId: string) => {
    const link = currentTopology?.links.find(l => l.id === linkId);
    if (link) { updateLink(linkId, { source: link.target, target: link.source }); toast.success('Link reversed'); }
  };
  const handleDeleteSelected = () => {
    if (selectedNodes.size === 0) return;
    selectedNodes.forEach(id => deleteNode(id));
    setSelectedNodes(new Set());
    toast.success(`Deleted ${selectedNodes.size} nodes`);
  };

  // Create a group from selected nodes
  const handleCreateGroup = useCallback(() => {
    if (!currentTopology) return;
    if (selectedNodes.size < 2) {
      toast.error('Select at least 2 nodes to create a group');
      return;
    }
    const groupName = prompt('Enter group name:');
    if (!groupName) return;

    // Update nodes with group name
    const nodesInGroup = currentTopology.nodes.filter(n => selectedNodes.has(n.id));
    nodesInGroup.forEach(n => updateNode(n.id, { group: groupName }));

    // Calculate bounding box for the group
    const xs = nodesInGroup.map(n => n.x);
    const ys = nodesInGroup.map(n => n.y);
    const padding = 60;
    const gIdx = (currentTopology.groups || []).length;
    const newGroup: GroupBox = {
      id: `group-${Date.now()}`,
      name: groupName,
      label: groupName,
      x: Math.min(...xs) - padding,
      y: Math.min(...ys) - padding,
      width: Math.max(...xs) - Math.min(...xs) + padding * 2,
      height: Math.max(...ys) - Math.min(...ys) + padding * 2,
      color: GROUP_COLORS[gIdx % GROUP_COLORS.length],
    };

    updateCurrentTopology({ groups: [...(currentTopology.groups || []), newGroup] });
    setSelectedNodes(new Set());
    toast.success(`Group "${groupName}" created with ${nodesInGroup.length} nodes`);
  }, [currentTopology, selectedNodes, updateNode, updateCurrentTopology]);

  const handleConfigChange = (updates: Partial<CanvasConfig>) => {
    const newConfig = { ...localConfig, ...updates };
    setLocalConfig(newConfig); saveCanvasConfig(newConfig);
  };

  const handleZoomIn = () => { if (svgRef.current && zoomRef.current) { canvasZoomIn(svgRef.current, zoomRef.current); setIsActualSize(false); } };
  const handleZoomOut = () => { if (svgRef.current && zoomRef.current) { canvasZoomOut(svgRef.current, zoomRef.current); setIsActualSize(false); } };
  const handleFitView = () => {
    if (!svgRef.current || !zoomRef.current || !currentTopology) return;
    const t = applyFitToView(svgRef.current, zoomRef.current, currentTopology.nodes, dimensions.width, dimensions.height);
    transformRef.current = t;
    setIsActualSize(false);
  };
  const handleActualSize = () => {
    if (!svgRef.current || !zoomRef.current || !currentTopology) return;
    const t = apply1to1View(svgRef.current, zoomRef.current, currentTopology.nodes, dimensions.width, dimensions.height);
    transformRef.current = t;
    setIsActualSize(true);
  };

  const handleSaveDefaultView = useCallback(() => {
    if (!currentTopology || !editId) {
      toast.info('Save the topology first, then you can set a default view');
      return;
    }
    const viewport = { k: transformRef.current.k, x: transformRef.current.x, y: transformRef.current.y };
    topologyApi.updateTopology(editId, { displaySettings: { nodeLabelSize: displaySettings.nodeLabelSize, linkLabelSize: displaySettings.linkLabelSize, linkDisplayMode: displaySettings.linkDisplayMode }, defaultViewport: viewport }, editVendor).then(() => {
      toast.success('Default view saved — all users will see this view');
    });
  }, [currentTopology, editId, displaySettings]);

  const handleExport = () => { if (currentTopology) { exportTopology(currentTopology); toast.success('Exported'); } };

  const handleDownloadCSV = () => {
    if (!currentTopology || (currentTopology.nodes.length === 0 && currentTopology.links.length === 0)) {
      toast.error('Nothing to export'); return;
    }
    const apiTopology = {
      ...customToApiTopology(currentTopology, currentTopology.client, currentTopology.vendor, displaySettings, undefined, linkConfig, monitorEnabled),
      id: currentTopology.id,
    };
    topologyApi.downloadTopologyCSV(apiTopology);
    toast.success('CSV downloaded');
  };
  const handleImport = () => { fileInputRef.current?.click(); };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const imported = importTopology(ev.target?.result as string);
      if (imported) toast.success('Imported'); else toast.error('Failed');
    };
    reader.readAsText(file); e.target.value = '';
  };

  const handleClear = () => {
    if (confirm('Clear all nodes and links?')) {
      updateCurrentTopology({ nodes: [], links: [] }); toast.success('Canvas cleared');
    }
  };

  const handleApplyLayout = (type: LayoutType, forceConfig?: Partial<ForceLayoutConfig>) => {
    if (!currentTopology || currentTopology.nodes.length === 0) { toast.error('Add nodes first'); return; }
    const newNodes = applyLayout(type, currentTopology.nodes, currentTopology.links, { width: dimensions.width, height: dimensions.height }, forceConfig);
    updateCurrentTopology({ nodes: newNodes }); setShowLayoutDialog(false); toast.success(`Applied ${type} layout`);
  };

  const handleCSVImport = (newNodes: Omit<CustomNode, 'id'>[], newLinks: Omit<CustomLink, 'id'>[]) => {
    if (!currentTopology) return;
    const nameToIdMap: Record<string, string> = {};
    currentTopology.nodes.forEach(n => { nameToIdMap[n.label.toLowerCase()] = n.id; });
    const createdNodes: CustomNode[] = newNodes.map(nd => {
      const nn: CustomNode = { ...nd, id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` };
      nameToIdMap[nd.label.toLowerCase()] = nn.id;
      return nn;
    });
    const createdLinks: CustomLink[] = newLinks.map(ld => {
      const sourceId = nameToIdMap[ld.source.toLowerCase()];
      const targetId = nameToIdMap[ld.target.toLowerCase()];
      if (sourceId && targetId) return { ...ld, id: `link-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, source: sourceId, target: targetId } as CustomLink;
      return null;
    }).filter((l): l is CustomLink => l !== null);

    // Auto-create GroupBoxes from node group assignments
    const allNodes = [...currentTopology.nodes, ...createdNodes];
    const existingGroups = [...(currentTopology.groups || [])];
    const existingGroupNames = new Set(existingGroups.map(g => g.name.toLowerCase()));
    const groupNodeMap = new Map<string, CustomNode[]>();

    allNodes.forEach(n => {
      if (n.group && !existingGroupNames.has(n.group.toLowerCase())) {
        if (!groupNodeMap.has(n.group)) groupNodeMap.set(n.group, []);
        groupNodeMap.get(n.group)!.push(n);
      }
    });

    let colorIdx = existingGroups.length;
    groupNodeMap.forEach((nodes, groupName) => {
      const xs = nodes.map(n => n.x);
      const ys = nodes.map(n => n.y);
      const padding = 60;
      const newGroup: GroupBox = {
        id: `group-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        name: groupName,
        label: groupName,
        x: Math.min(...xs) - padding,
        y: Math.min(...ys) - padding,
        width: Math.max(...xs) - Math.min(...xs) + padding * 2 + 40,
        height: Math.max(...ys) - Math.min(...ys) + padding * 2 + 40,
        color: GROUP_COLORS[colorIdx % GROUP_COLORS.length],
      };
      existingGroups.push(newGroup);
      colorIdx++;
    });

    updateCurrentTopology({
      nodes: allNodes,
      links: [...currentTopology.links, ...createdLinks],
      groups: existingGroups,
    });
  };

  const handleBulkDeleteNodes = (ids: string[]) => { ids.forEach(id => deleteNode(id)); };
  const handleBulkDeleteLinks = (ids: string[]) => { ids.forEach(id => deleteLink(id)); };
  const handleBulkUpdateNodes = (ids: string[], updates: Partial<CustomNode>) => { ids.forEach(id => updateNode(id, updates)); };
  const handleBulkUpdateLinks = (ids: string[], updates: Partial<CustomLink>) => { ids.forEach(id => updateLink(id, updates)); };

  // =============== PREVIEW MODE ===============
  const renderPreview = useCallback(() => {
    if (!previewSvgRef.current || !currentTopology || !previewMode) return;
    const svg = d3.select(previewSvgRef.current);
    svg.selectAll('*').remove();
    const container = previewContainerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const width = rect.width || 800;
    const height = rect.height || 500;

    const defs = svg.append('defs');
    const glow = defs.append('filter').attr('id', 'glow-p').attr('x', '-50%').attr('y', '-50%').attr('width', '200%').attr('height', '200%');
    glow.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
    const m = glow.append('feMerge');
    m.append('feMergeNode').attr('in', 'coloredBlur');
    m.append('feMergeNode').attr('in', 'SourceGraphic');

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => { g.attr('transform', event.transform); });
    svg.call(zoom);
    const g = svg.append('g');

    // Grid
    const gridSize = 50;
    const gridG = g.append('g');
    const ext = Math.max(width, height) * 3;
    for (let x = -ext / 2; x < ext; x += gridSize) {
      gridG.append('line').attr('x1', x).attr('y1', -ext / 2).attr('x2', x).attr('y2', ext)
        .attr('stroke', 'rgba(0,0,0,0.03)').attr('stroke-width', 0.5);
    }
    for (let y = -ext / 2; y < ext; y += gridSize) {
      gridG.append('line').attr('x1', -ext / 2).attr('y1', y).attr('x2', ext).attr('y2', y)
        .attr('stroke', 'rgba(0,0,0,0.03)').attr('stroke-width', 0.5);
    }

    const nodeMap = new Map(currentTopology.nodes.map(n => [n.id, n]));
    const linkPairMap = new Map<string, typeof currentTopology.links>();
    currentTopology.links.forEach(link => {
      const key = [link.source, link.target].sort().join('|');
      if (!linkPairMap.has(key)) linkPairMap.set(key, []);
    linkPairMap.get(key)!.push(link);
    });

    // ─── Group Boxes (behind links and nodes) ───
    if (currentTopology.groups && currentTopology.groups.length > 0) {
      const groupLayer = g.append('g').attr('class', 'group-boxes');
      currentTopology.groups.forEach((group, gIdx) => {
        const gG = groupLayer.append('g');
        gG.append('rect')
          .attr('x', group.x).attr('y', group.y)
          .attr('width', group.width).attr('height', group.height)
          .attr('rx', 12).attr('ry', 12)
          .attr('fill', group.color || GROUP_COLORS[gIdx % GROUP_COLORS.length])
          .attr('stroke', GROUP_BORDER_COLORS[gIdx % GROUP_BORDER_COLORS.length])
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '6,3');
        const { position: prevLabelPos } = _parseGroupName(group.name);
        const prevDisplayText = group.label ? _getDisplayName(group.label) : _getDisplayName(group.name);
        const prevCoords = _getGroupLabelCoords(group.x, group.y, group.width, group.height, prevLabelPos);
        gG.append('text')
          .attr('x', prevCoords.x).attr('y', prevCoords.y)
          .attr('text-anchor', prevCoords.anchor)
          .attr('font-size', '12px').attr('font-weight', '600')
          .attr('fill', 'hsl(var(--foreground))')
          .attr('opacity', 0.8)
          .text(prevDisplayText);
      });
    }

    // Links — respect single (merged) vs multi (fan-out) display mode
    const linkG = g.append('g');
    const isMultiMode = displaySettings.linkDisplayMode === 'multi';
    currentTopology.links.forEach(link => {
      const src = nodeMap.get(link.source);
      const tgt = nodeMap.get(link.target);
      if (!src || !tgt) return;

      const pairKey = [link.source, link.target].sort().join('|');
      const parallelLinks = linkPairMap.get(pairKey) || [link];

      // In merged (single) mode, render only the first link of each pair as one line
      if (!isMultiMode && parallelLinks[0].id !== link.id) return;

      const linkColor = '#22c55e';
      const previewStrokeWidth = link.strokeWidth ?? linkConfig.strokeWidth;
      const previewShowArrows = link.showArrows ?? linkConfig.showArrows;
      const sx = src.x, sy = src.y, tx = tgt.x, ty = tgt.y;

      const parallelCount = isMultiMode ? parallelLinks.length : 1;
      const parallelIndex = isMultiMode ? parallelLinks.findIndex(l => l.id === link.id) : 0;

      const pathResult = computeLinkPath({
        sx, sy, tx, ty,
        curveOffsetX: link.curveOffsetX,
        curveOffsetY: link.curveOffsetY,
        parallelCount,
        parallelIndex,
        linkType: link.style,
      });
      const { pathData, perpX, perpY } = pathResult;
      const isDashed = link.style === 'dashed' || link.style === 'dotted';

      linkG.append('path').attr('d', pathData).attr('fill', 'none')
        .attr('stroke', 'rgba(0,0,0,0.1)').attr('stroke-width', previewStrokeWidth + 2).attr('stroke-linecap', 'round');
      const mainPath = linkG.append('path').attr('d', pathData).attr('fill', 'none')
        .attr('stroke', linkColor).attr('stroke-width', previewStrokeWidth)
        .attr('stroke-linecap', 'round').attr('stroke-dasharray', isDashed ? '8,4' : 'none');

      const pathEl = mainPath.node();
      if (pathEl && previewShowArrows) {
        const totalLen = pathEl.getTotalLength();
        const midPt = pathEl.getPointAtLength(totalLen / 2);
        const nearPt = pathEl.getPointAtLength(totalLen / 2 + 1);
        const angle = Math.atan2(nearPt.y - midPt.y, nearPt.x - midPt.x) * 180 / Math.PI;
        linkG.append('polygon').attr('points', '0,-5 10,0 0,5')
          .attr('transform', `translate(${midPt.x}, ${midPt.y}) rotate(${angle})`).attr('fill', linkColor);
      }

      // Label — in merged mode show port count or first label; in multi show per-link label
      const pe = mainPath.node();
      if (pe) {
        let labelText = '';
        const portPair = (link.srcPortName || link.dstPortName)
          ? `${link.srcPortName || ''}${link.srcPortName && link.dstPortName ? ' → ' : ''}${link.dstPortName || ''}`
          : '';
        if (isMultiMode) {
          labelText = portPair || link.label || '';
        } else if (parallelLinks.length > 1) {
          labelText = `${parallelLinks.length} ports`;
        } else {
          labelText = portPair || link.label || '';
        }
        if (labelText) {
          const tl = pe.getTotalLength();
          const lp = pe.getPointAtLength(tl / 2);
          const labelPos = getLinkLabelPosition(lp.x, lp.y, perpX, perpY, link.labelOffsetX, link.labelOffsetY);
          const labelAngle = getLinkLabelAngle(pe);
          linkG.append('text').attr('x', labelPos.x).attr('y', labelPos.y)
            .attr('text-anchor', 'middle').attr('fill', 'hsl(var(--foreground))')
            .attr('font-size', `${displaySettings.linkLabelSize}px`).attr('font-weight', '500')
            .attr('transform', `rotate(${labelAngle}, ${labelPos.x}, ${labelPos.y})`)
            .text(labelText);
        }
      }
    });

    // Nodes
    const nodeG = g.append('g');
    currentTopology.nodes.forEach(node => {
      const nG = nodeG.append('g').attr('transform', `translate(${node.x}, ${node.y})`);
      const iconType = resolveIconType(node.type);
      renderEquipmentIcon(nG as any, iconType, { isDark: false });

      const labelPos = getNodeLabelPosition(node.nodeLabelOffsetX, node.nodeLabelOffsetY, node.size || 35);
      nG.append('text').attr('x', labelPos.x).attr('y', labelPos.y)
        .attr('text-anchor', 'middle').attr('fill', 'hsl(var(--foreground))')
        .attr('font-size', `${displaySettings.nodeLabelSize}px`).attr('font-weight', '500').text(node.label);
    });

    // Fit to center
    if (currentTopology.nodes.length > 0) {
      const xs = currentTopology.nodes.map(n => n.x), ys = currentTopology.nodes.map(n => n.y);
      const pad = 80;
      const minX = Math.min(...xs) - pad, minY = Math.min(...ys) - pad;
      const maxX = Math.max(...xs) + pad, maxY = Math.max(...ys) + pad;
      const cw = maxX - minX, ch = maxY - minY;
      const scale = Math.min(width / cw, height / ch, 2) * 0.9;
      const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
      const transform = d3.zoomIdentity.translate(width / 2, height / 2).scale(scale).translate(-cx, -cy);
      svg.call(zoom.transform, transform);
    }
  }, [currentTopology, previewMode, displaySettings]);

  useEffect(() => { renderPreview(); }, [renderPreview]);


  const handleSaveToManagement = useCallback(() => {
    if (!currentTopology || currentTopology.nodes.length === 0) {
      toast.error('Add some nodes before saving'); return;
    }
    // Always open the dialog so user can manage alarm trap types
    setShowSaveDialog(true);
  }, [currentTopology]);

  const handleSaveConfirm = async (saveData: { name: string; description?: string; client?: string; vendor?: string }) => {
    if (!currentTopology) return;
    const updated = {
      ...currentTopology,
      name: saveData.name,
      description: saveData.description || '',
      client: saveData.client,
      vendor: saveData.vendor,
    };
    setCurrentTopology(updated);
    const apiPayload = customToApiTopology(updated, saveData.client, saveData.vendor, displaySettings, undefined, linkConfig, monitorEnabled, currentTopology.traptypes || []);

    try {
      if (isEditMode && editId) {
        await topologyApi.updateTopology(editId, apiPayload, editVendor);
        toast.success('Topology updated');
      } else {
        await topologyApi.createTopology(apiPayload);
        toast.success('Topology saved to API');
      }
      // Per-link trap-type alarm config is now managed via the Alarm Config dialog,
      // not bundled into the save flow.
      navigate('/manage-topology');
    } catch (err: any) {
      toast.error(`Save failed: ${err?.message || 'Unknown error'}`);
    }
  };


  if (!currentTopology) {
    return <div className="h-[calc(100vh-1.7rem)] flex items-center justify-center"><p className="text-muted-foreground">Loading...</p></div>;
  }

  return (
    <div className="h-[calc(100vh-1.7rem)] w-full flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-background shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">{isEditMode ? 'Edit Topology' : 'Create Topology'}</h1>
            <p className="text-xs text-muted-foreground">
              {currentTopology.nodes.length} nodes • {currentTopology.links.length} links
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/manage-topology')}>View All</Button>
          <Button size="sm" onClick={handleSaveToManagement}>
            <Save className="h-4 w-4 mr-1.5" />
            {isEditMode ? 'Update' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Toolbar: Upload CSV | Add Element | Style | Table | --- spacer --- | Zoom + Delete */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b bg-card shrink-0 flex-wrap">
        {/* 1. Upload CSV */}
        <div className="flex items-center gap-0.5 bg-muted/50 rounded-lg p-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={() => setShowCSVUpload(true)} className="h-8 px-2.5 rounded-md">
                <Upload className="h-4 w-4 mr-1" />
                <span className="text-xs">Upload CSV</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Import topology from CSV file</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* 3. Add Element */}
        <div className="flex items-center gap-0.5 bg-muted/50 rounded-lg p-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={() => setShowAddNode(true)} className="h-8 px-2.5 rounded-md">
                <Plus className="h-4 w-4 mr-1" />
                <span className="text-xs">Add Element</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Add a new node &amp; link connection</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* 3. Style */}
        <div className="flex items-center gap-0.5 bg-muted/50 rounded-lg p-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={() => setShowLinkConfig(!showLinkConfig)} className="h-8 px-2.5 rounded-md">
                <Link2 className="h-4 w-4 mr-1" />
                <span className="text-xs">Link Style</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Link styling options</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={() => setShowAppearance(!showAppearance)} className="h-8 px-2.5 rounded-md">
                <Type className="h-4 w-4 mr-1" />
                <span className="text-xs">Appearance</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Label sizes &amp; display settings</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* 4. Table + Alarm Config */}
        <div className="flex items-center gap-0.5 bg-muted/50 rounded-lg p-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle pressed={showDataTable} onPressedChange={() => setShowDataTable(!showDataTable)} size="sm" className="h-8 px-2.5 rounded-md data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                <Table2 className="h-4 w-4 mr-1" />
                <span className="text-xs">Connection Table</span>
              </Toggle>
            </TooltipTrigger>
            <TooltipContent side="bottom">Toggle connection table</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle
                pressed={showAlarmConfig}
                onPressedChange={() => {
                  const isUnsaved = !isEditMode && (!currentTopology.name || /^(untitled|new\s*topology)/i.test(currentTopology.name));
                  if (isUnsaved) {
                    toast.warning('Save the topology first, then configure per-link alarms.');
                    return;
                  }
                  setShowAlarmConfig(!showAlarmConfig);
                }}
                size="sm"
                className="h-8 px-2.5 rounded-md data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                <Bell className="h-4 w-4 mr-1" />
                <span className="text-xs">Alarm Config</span>
              </Toggle>
            </TooltipTrigger>
            <TooltipContent side="bottom">Configure trap-types per link (save topology first)</TooltipContent>
          </Tooltip>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right side: Download CSV, Zoom, Fit, Grid, Clear/Delete */}
        <div className="flex items-center gap-0.5 bg-muted/50 rounded-lg p-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={handleDownloadCSV} className="h-8 px-2.5 rounded-md">
                <FileDown className="h-4 w-4 mr-1" />
                <span className="text-xs">Download</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Download topology as CSV</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <div className="flex items-center gap-0.5 bg-muted/50 rounded-lg p-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleZoomOut} className="h-8 w-8 rounded-md">
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Zoom out</TooltipContent>
          </Tooltip>
          <Badge variant="secondary" className="h-6 px-2 text-xs font-mono min-w-[48px] justify-center">
            {Math.round(zoomLevel * 100)}%
          </Badge>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleZoomIn} className="h-8 w-8 rounded-md">
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Zoom in</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleFitView} className="h-8 w-8 rounded-md">
                <Maximize2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Fit to view</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle pressed={isActualSize} onPressedChange={(pressed) => pressed ? handleActualSize() : handleFitView()} size="sm" className="h-8 px-2 rounded-md text-xs font-mono data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                1:1
              </Toggle>
            </TooltipTrigger>
            <TooltipContent side="bottom">{isActualSize ? 'Switch to fit view' : 'Actual size (1:1)'}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle pressed={localConfig.showGrid} onPressedChange={(p) => handleConfigChange({ showGrid: p })} size="sm" className="h-8 w-8 p-0 rounded-md data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                <Grid3X3 className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent side="bottom">Toggle grid</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Toggle pressed={localConfig.snapToGrid} onPressedChange={(p) => handleConfigChange({ snapToGrid: p })} size="sm" className="h-8 w-8 p-0 rounded-md data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                <Magnet className="h-4 w-4" />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent side="bottom">{localConfig.snapToGrid ? 'Disable snap to grid' : 'Enable snap to grid'}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="inline-flex items-center h-8 rounded-md border border-input bg-background overflow-hidden text-xs">
                <button
                  type="button"
                  onClick={() => setDisplaySettings(prev => ({ ...prev, linkDisplayMode: 'merged' }))}
                  className={`h-full px-2 flex items-center gap-1 transition-colors ${displaySettings.linkDisplayMode !== 'multi' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                  aria-pressed={displaySettings.linkDisplayMode !== 'multi'}
                >
                  <Minus className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Single Line</span>
                </button>
                <div className="w-px h-full bg-border" />
                <button
                  type="button"
                  onClick={() => setDisplaySettings(prev => ({ ...prev, linkDisplayMode: 'multi' }))}
                  className={`h-full px-2 flex items-center gap-1 transition-colors ${displaySettings.linkDisplayMode === 'multi' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                  aria-pressed={displaySettings.linkDisplayMode === 'multi'}
                >
                  <GitBranch className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Multi Line</span>
                </button>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom">Link display mode — decides how parallel links between the same nodes render. Saved with the topology.</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={() => setPreviewMode(true)} className="h-8 px-2.5 rounded-md">
                <MonitorCheck className="h-4 w-4 mr-1" />
                <span className="text-xs">Preview</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Preview as Monitor view</TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-6 mx-1" />

        <div className="flex items-center gap-0.5">
          {selectedNodes.size > 1 && (
            <>
              <Badge variant="default" className="text-xs">{selectedNodes.size} selected</Badge>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" onClick={handleCreateGroup} className="h-7 px-2 text-xs">
                    <Group className="h-3.5 w-3.5 mr-1" />Group
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Create group from selected nodes</TooltipContent>
              </Tooltip>
              <Button variant="ghost" size="icon" onClick={handleDeleteSelected} className="h-7 w-7 text-destructive hover:bg-destructive/10">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
          {selectedNodes.size === 1 && (
            <>
              <Badge variant="default" className="text-xs">1 selected</Badge>
              <Button variant="ghost" size="icon" onClick={handleDeleteSelected} className="h-7 w-7 text-destructive hover:bg-destructive/10">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleClear} className="h-8 w-8 rounded-md text-destructive hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Clear canvas</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex min-h-0 w-full overflow-hidden">
        {/* Canvas View — always visible */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 flex min-h-0">
            <div className="flex-1 flex flex-col min-w-0">
              <div ref={containerRef} className="flex-1 relative bg-background/50 overflow-hidden min-h-0">
                <svg
                  ref={svgRef}
                  width="100%" height="100%"
                  viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
                  preserveAspectRatio="xMidYMid meet"
                  className="absolute inset-0 w-full h-full"
                />

                {/* Topology name card removed */}

                {showLinkConfig && (
                  <div className="absolute top-16 right-4 z-20">
                    <LinkConfigPanel
                      config={linkConfig}
                      onConfigChange={(updates) => setLinkConfig(prev => ({ ...prev, ...updates }))}
                      onClose={() => setShowLinkConfig(false)}
                    />
                  </div>
                )}

                {showAppearance && (
                  <div className="absolute top-16 right-4 z-20" style={{ top: showLinkConfig ? '320px' : '64px' }}>
                    <AppearancePanel
                      settings={displaySettings}
                      onSettingsChange={(updates) => setDisplaySettings(prev => ({ ...prev, ...updates }))}
                      onSaveView={handleSaveDefaultView}
                      onClose={() => setShowAppearance(false)}
                      showSaveView={!!editId}
                    />
                  </div>
                )}

                {linkFromNode && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
                    <Card className="bg-primary text-primary-foreground shadow-lg">
                      <CardContent className="py-2 px-4 flex items-center gap-3">
                        <span className="text-sm font-medium">Click a node to create a link</span>
                        <Button size="sm" variant="secondary" onClick={() => setLinkFromNode(null)}>Cancel</Button>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {selectedNodes.size > 1 && (
                  <div className="absolute bottom-20 right-4 z-10">
                    <Card className="bg-card/90 backdrop-blur shadow-lg">
                      <CardContent className="py-2 px-3 text-xs text-muted-foreground">
                        Drag to move • Del to delete • Esc to deselect
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Zoom controls are in the toolbar above */}
              </div>

              {/* Table is now a dialog, triggered from toolbar */}
            </div>

            {selectedNode && (
              <NodeEditPanel
                node={selectedNode}
                allNodes={currentTopology?.nodes || []}
                groups={currentTopology?.groups || []}
                onUpdate={handleUpdateNode}
                onDelete={handleDeleteNode}
                onClose={() => setSelectedNode(null)}
                onGroupChange={handleNodeGroupChange}
              />
            )}
            {selectedLink && (
              <LinkEditPanel link={selectedLink} onUpdate={handleUpdateLink} onDelete={handleDeleteLink} onClose={() => setSelectedLink(null)} />
            )}
          </div>
        </div>

        {/* Connection Table View (below canvas when data table is shown) */}
      </div>


      {/* Preview Mode Overlay */}
      {previewMode && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 border-b bg-card shrink-0">
            <div className="flex items-center gap-3">
              <MonitorCheck className="h-5 w-5 text-primary" />
              <div>
                <h2 className="text-sm font-bold">Monitor Preview</h2>
                <p className="text-xs text-muted-foreground">
                  This is how the topology will appear in Monitor view • {currentTopology.nodes.length} nodes • {currentTopology.links.length} links
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setPreviewMode(false)}>
              <X className="h-4 w-4 mr-1" />
              Close Preview
            </Button>
          </div>
          <div ref={previewContainerRef} className="flex-1 relative overflow-hidden bg-background/50">
            <svg
              ref={previewSvgRef}
              width="100%" height="100%"
              className="absolute inset-0 w-full h-full"
            />
            {/* Top-center topology name badge (like Monitor view) */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
              <Badge variant="secondary" className="text-sm font-semibold px-4 py-1.5 shadow-md">
                {currentTopology.name || 'Untitled Topology'}
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <AddElementDialog open={showAddNode} onOpenChange={setShowAddNode} existingNodes={currentTopology.nodes.map(n => ({ id: n.id, label: n.label }))} onAdd={(data) => {
        if (!currentTopology) return;
        const existingXs = currentTopology.nodes.map(n => n.x);
        const existingYs = currentTopology.nodes.map(n => n.y);
        const baseX = existingXs.length > 0 ? Math.max(...existingXs) + 150 : 200;
        const baseY = existingYs.length > 0 ? (existingYs.reduce((a, b) => a + b, 0) / existingYs.length) : 300;

        // Single node mode (only source or only dest)
        if (data.sourceNode && !data.destNode) {
          const existingSrc = currentTopology.nodes.find(n => n.label.toLowerCase() === data.sourceNode.toLowerCase());
          if (!existingSrc) {
            const srcId = `node-${Date.now()}-src`;
            updateCurrentTopology({ nodes: [...currentTopology.nodes, { id: srcId, label: data.sourceNode, x: baseX, y: baseY, type: (data.sourceIcon || 'datacenter') as CustomNode['type'] }], links: currentTopology.links });
            toast.success('Node added');
          } else {
            toast.info('Node already exists');
          }
          return;
        }
        if (!data.sourceNode && data.destNode) {
          const existingDest = currentTopology.nodes.find(n => n.label.toLowerCase() === data.destNode.toLowerCase());
          if (!existingDest) {
            const destId = `node-${Date.now()}-dest`;
            updateCurrentTopology({ nodes: [...currentTopology.nodes, { id: destId, label: data.destNode, x: baseX, y: baseY, type: (data.destIcon || 'datacenter') as CustomNode['type'] }], links: currentTopology.links });
            toast.success('Node added');
          } else {
            toast.info('Node already exists');
          }
          return;
        }

        // Both nodes — create connection
        const existingSrc = currentTopology.nodes.find(n => n.label.toLowerCase() === data.sourceNode.toLowerCase());
        const existingDest = currentTopology.nodes.find(n => n.label.toLowerCase() === data.destNode.toLowerCase());
        const srcId = existingSrc?.id || `node-${Date.now()}-src`;
        const destId = existingDest?.id || `node-${Date.now()}-dest`;
        const newNodes: CustomNode[] = [];
        if (!existingSrc) newNodes.push({ id: srcId, label: data.sourceNode, x: baseX, y: baseY - 60, type: (data.sourceIcon || 'datacenter') as CustomNode['type'] });
        if (!existingDest) newNodes.push({ id: destId, label: data.destNode, x: baseX + 150, y: baseY + 60, type: (data.destIcon || 'datacenter') as CustomNode['type'] });
        const newLink: CustomLink = { id: `link-${Date.now()}`, source: srcId, target: destId, label: data.linkLabel, style: data.linkType, srcIp: data.srcIp, dstIp: data.dstIp, srcPortName: data.srcPortName, dstPortName: data.dstPortName };
        updateCurrentTopology({ nodes: [...currentTopology.nodes, ...newNodes], links: [...currentTopology.links, newLink] });
        toast.success('Element added');
      }} />
      <ConnectionTableDialog
        open={showDataTable}
        onOpenChange={setShowDataTable}
        nodes={currentTopology.nodes}
        links={currentTopology.links}
        groups={currentTopology.groups}
        onUpdateRow={updateTableRow}
        onBatchUpdateRow={batchUpdateTableRow}
        onDeleteRow={deleteTableRow}
        onAddRow={addTableRow}
        onUpdateGroup={handleUpdateGroup}
        topologyId={(isEditMode && editId) ? editId : (currentTopology.name || undefined)}
        vendor={(isEditMode && editVendor) || currentTopology.vendor || undefined}
        client={currentTopology.client}
      />
      <AlarmConfigDialog
        open={showAlarmConfig}
        onOpenChange={setShowAlarmConfig}
        nodes={currentTopology.nodes}
        links={currentTopology.links}
        topologyId={(isEditMode && editId) ? editId : currentTopology.name}
        vendor={(isEditMode && editVendor) || currentTopology.vendor || ''}
        client={currentTopology.client}
        onContextChange={({ vendor, client }) =>
          setCurrentTopology({ ...currentTopology, vendor, client })
        }
      />
      <LayoutDialog open={showLayoutDialog} onOpenChange={setShowLayoutDialog} onApplyLayout={handleApplyLayout} nodeCount={currentTopology.nodes.length} />
      <CSVUploadDialog open={showCSVUpload} onOpenChange={setShowCSVUpload} onImport={handleCSVImport} existingNodes={currentTopology.nodes} />

      <SaveToManagerDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        onSave={(data) => handleSaveConfirm(data)}
        currentName={currentTopology.name}
        currentDescription={currentTopology.description}
        currentClient={currentTopology.client}
        currentVendor={currentTopology.vendor}
        nodeCount={currentTopology.nodes.length}
        linkCount={currentTopology.links.length}
        lockIdentity={isEditMode}
      />

      <AddFromInventoryDialog
        open={showInventoryDialog}
        onOpenChange={setShowInventoryDialog}
        onAddAll={(rows: InventoryRow[]) => {
          if (!currentTopology) return;
          const existingXs = currentTopology.nodes.map(n => n.x);
          const existingYs = currentTopology.nodes.map(n => n.y);
          let baseX = existingXs.length > 0 ? Math.max(...existingXs) + 150 : 200;
          const baseY = existingYs.length > 0 ? (existingYs.reduce((a, b) => a + b, 0) / existingYs.length) : 300;

          const newNodes: CustomNode[] = [];
          const newLinks: CustomLink[] = [];
          const nodeMap = new Map<string, string>();
          currentTopology.nodes.forEach(n => nodeMap.set(n.label.toLowerCase(), n.id));

          rows.forEach((row, i) => {
            const srcKey = row.sourceNode.toLowerCase();
            if (!nodeMap.has(srcKey)) {
              const id = `node-${Date.now()}-inv-s${i}`;
              nodeMap.set(srcKey, id);
              newNodes.push({ id, label: row.sourceNode, x: baseX, y: baseY + i * 120 - 60, type: (row.srcIcon?.toLowerCase() || 'server') as CustomNode['type'] });
            }
            if (row.destNode) {
              const dstKey = row.destNode.toLowerCase();
              if (!nodeMap.has(dstKey)) {
                const id = `node-${Date.now()}-inv-d${i}`;
                nodeMap.set(dstKey, id);
                newNodes.push({ id, label: row.destNode, x: baseX + 200, y: baseY + i * 120 - 60, type: (row.dstIcon?.toLowerCase() || 'server') as CustomNode['type'] });
              }
              const styleMap: Record<string, CustomLinkStyle> = { 'DASHED': 'dashed', 'DOTTED': 'dotted', 'CURVED': 'curved', 'STEP': 'step' };
              newLinks.push({
                id: `link-${Date.now()}-inv-${i}`,
                source: nodeMap.get(srcKey)!,
                target: nodeMap.get(dstKey)!,
                label: row.label || '',
                style: styleMap[row.style] || 'solid',
                srcIp: row.srcIp,
                dstIp: row.dstIp,
                srcPortName: row.srcPort,
                dstPortName: row.dstPort,
              });
            }
          });

          updateCurrentTopology({
            nodes: [...currentTopology.nodes, ...newNodes],
            links: [...currentTopology.links, ...newLinks],
          });
        }}
      />

      <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileChange} className="hidden" />
    </div>
  );
}
