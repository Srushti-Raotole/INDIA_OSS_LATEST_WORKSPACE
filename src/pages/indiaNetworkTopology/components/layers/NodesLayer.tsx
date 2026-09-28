
import { useEffect, useRef, useState, useMemo } from 'react';
import { useMap, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { NetworkNode } from '../../types';
import { 
  getNodePrimaryColor, 
  getNodeHighlightedColor,
  getClusterBgColor,
  getClusterBorderColor,
} from '../../utils/colorUtils';

const DEVICE_LABEL_ZOOM_THRESHOLD = 10;


const CIRCLE_CLUSTER_ZOOM_THRESHOLD = 7;

/**
 * Maximum clustering radius in pixels
 * CHANGE THIS: Higher value = more aggressive clustering
 */
const MAX_CLUSTER_RADIUS = 50;

/**
 * Zoom level at which all clustering is disabled
 * CHANGE THIS: Higher value = clustering active at more zoom levels
 */
const DISABLE_CLUSTERING_AT_ZOOM = 12;

// ============================================
// Props Interface
// ============================================

interface NodesLayerProps {
  /** Array of network nodes to render */
  nodes: NetworkNode[];
  /** Callback when a node is clicked */
  onNodeClick: (node: NetworkNode) => void;
  /** Callback when hovering over a node */
  onNodeHover: (node: NetworkNode, e: L.LeafletMouseEvent) => void;
  /** Callback when mouse leaves a node */
  onNodeLeave: () => void;
  /** Optional: Currently highlighted node (from search) */
  highlightedNode?: NetworkNode | null;
  /** Optional: Whether to show device labels (default: true) */
  showLabels?: boolean;
}

// ============================================
// Node Icon Creation
// ============================================

/**
 * Creates a custom circle marker icon for nodes
 * Uses CSS variables for theming support
 * No borders, clean design
 * 
 * @param isHighlighted - Whether this node is highlighted (from search)
 */
function createNodeIcon(isHighlighted: boolean = false): L.DivIcon {
  const primaryColor = getNodePrimaryColor();
  const highlightedColor = getNodeHighlightedColor();
  
  // Consistent size for all nodes (no border, clean look)
  const size = isHighlighted ? 16 : 12;
  const bgColor = isHighlighted ? highlightedColor : primaryColor;
  
  const baseStyles = `
    background: ${bgColor};
    box-shadow: 0 0 ${isHighlighted ? '8px' : '4px'} ${bgColor};
    width: ${size}px;
    height: ${size}px;
  `;

  return L.divIcon({
    className: 'custom-node-marker',
    html: `
      <div class="node-marker-inner" style="
        ${baseStyles}
        border-radius: 50%;
        cursor: pointer;
      "></div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/**
 * Creates a device name label icon for high zoom levels
 * Label appears above the node with full background coverage
 * 
 * @param deviceName - Device name to display
 */
function createDeviceLabelIcon(deviceName: string): L.DivIcon {
  return L.divIcon({
    className: 'device-label-marker',
    html: `
      <div style="
        display: inline-block;
        background: rgba(59, 130, 246, 0.95);
        color: white;
        border: none;
        white-space: nowrap;
        padding: 4px 10px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
        pointer-events: none;
        position: relative;
        left: 50%;
        transform: translateX(-50%);
        line-height: 1.2;
      ">
        ${deviceName}
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, -15],
  });
}

// ============================================
// Circle Cluster Icon Creation
// ============================================

/**
 * Creates a circle-based cluster icon showing circle code and count
 * Example: "MH(4)" for Maharashtra with 4 nodes
 * Fixed medium size for consistent appearance
 * 
 * @param circleName - Circle code (e.g., "MH", "TN")
 * @param count - Number of nodes in this circle
 */
function createCircleClusterIcon(circleName: string, count: number): L.DivIcon {
  const bgColor = getClusterBgColor();
  
  // Smaller fixed size for all clusters - no border
  const diameter = 32;

  return L.divIcon({
    html: `
      <div class="circle-cluster" style="
        width: ${diameter}px;
        height: ${diameter}px;
        border-radius: 50%;
        background: ${bgColor};
        box-shadow: 0 2px 6px ${bgColor};
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        cursor: pointer;
      ">
        <span style="font-size: 10px; line-height: 1;">
          ${circleName}
        </span>
        <span style="font-size: 9px; opacity: 0.9;">
          (${count})
        </span>
      </div>
    `,
    className: 'custom-circle-cluster-icon',
    iconSize: [diameter, diameter],
    iconAnchor: [diameter / 2, diameter / 2],
  });
}

/**
 * Standard cluster icon (count only) for intermediate zoom levels
 * Fixed medium size for consistent appearance
 * 
 * @param cluster - Leaflet cluster object
 */
function createClusterIcon(cluster: L.MarkerCluster): L.DivIcon {
  const count = cluster.getChildCount();
  const bgColor = getClusterBgColor();
  
  // Smaller fixed size for all clusters - no border
  const diameter = 28;

  return L.divIcon({
    html: `
      <div class="cluster-marker cluster-medium" style="
        width: ${diameter}px;
        height: ${diameter}px;
        border-radius: 50%;
        background: ${bgColor};
        box-shadow: 0 2px 6px ${bgColor};
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 11px;
      ">${count}</div>
    `,
    className: 'custom-cluster-icon',
    iconSize: [diameter, diameter],
    iconAnchor: [diameter / 2, diameter / 2],
  });
}

// ============================================
// Main Component
// ============================================

/**
 * Renders all network nodes using MarkerClusterGroup
 * 
 * Features:
 * - Circle-based clustering when fully zoomed out (e.g., MH(4), TN(2))
 * - Standard count clusters at intermediate zoom
 * - Individual nodes at high zoom with device labels
 */
export function NodesLayer({ 
  nodes, 
  onNodeClick, 
  onNodeHover,
  onNodeLeave,
  highlightedNode,
  showLabels = true,
}: NodesLayerProps) {
  const map = useMap();
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const labelLayerRef = useRef<L.LayerGroup | null>(null);
  const circleClusterLayerRef = useRef<L.LayerGroup | null>(null);
  const nodeMapRef = useRef<Map<L.Marker, NetworkNode>>(new Map());
  const [currentZoom, setCurrentZoom] = useState(map.getZoom());

  // ========== Calculate circle clusters ==========
  const circleClusters = useMemo(() => {
    const clusters = new Map<string, { nodes: NetworkNode[]; centerLat: number; centerLon: number }>();
    
    nodes.forEach(node => {
      const circle = node.circle;
      if (!clusters.has(circle)) {
        clusters.set(circle, { nodes: [], centerLat: 0, centerLon: 0 });
      }
      clusters.get(circle)!.nodes.push(node);
    });

    // Calculate center for each circle cluster
    clusters.forEach((cluster) => {
      const totalLat = cluster.nodes.reduce((sum, n) => sum + n.lat, 0);
      const totalLon = cluster.nodes.reduce((sum, n) => sum + n.lon, 0);
      cluster.centerLat = totalLat / cluster.nodes.length;
      cluster.centerLon = totalLon / cluster.nodes.length;
    });

    return clusters;
  }, [nodes]);

  // ========== Track zoom level changes ==========
  useEffect(() => {
    const handleZoomEnd = () => {
      setCurrentZoom(map.getZoom());
    };
    map.on('zoomend', handleZoomEnd);
    return () => {
      map.off('zoomend', handleZoomEnd);
    };
  }, [map]);

  // ========== Show circle clusters when zoomed out ==========
  const showCircleClusters = currentZoom <= CIRCLE_CLUSTER_ZOOM_THRESHOLD;

  // ========== Create and manage circle cluster layer ==========
  useEffect(() => {
    // Remove existing circle cluster layer
    if (circleClusterLayerRef.current) {
      map.removeLayer(circleClusterLayerRef.current);
      circleClusterLayerRef.current = null;
    }

    if (showCircleClusters) {
      const circleLayer = L.layerGroup();
      
      circleClusters.forEach((cluster, circleName) => {
        const marker = L.marker([cluster.centerLat, cluster.centerLon], {
          icon: createCircleClusterIcon(circleName, cluster.nodes.length),
        });
        
        // On click, zoom to show individual nodes
        marker.on('click', () => {
          // Find bounds of all nodes in this circle
          const bounds = L.latLngBounds(
            cluster.nodes.map(n => [n.lat, n.lon] as [number, number])
          );
          map.fitBounds(bounds, { padding: [50, 50] });
        });
        
        // Tooltip showing circle details
        marker.bindTooltip(`${circleName}: ${cluster.nodes.length} nodes<br/>Click to zoom`, {
          direction: 'top',
        });
        
        circleLayer.addLayer(marker);
      });
      
      circleClusterLayerRef.current = circleLayer;
      map.addLayer(circleLayer);
    }

    return () => {
      if (circleClusterLayerRef.current) {
        map.removeLayer(circleClusterLayerRef.current);
      }
    };
  }, [showCircleClusters, circleClusters, map]);

  // ========== Create and manage marker cluster group ==========
  useEffect(() => {
    // Don't show individual markers if circle clusters are visible
    if (showCircleClusters) {
      if (clusterGroupRef.current) {
        map.removeLayer(clusterGroupRef.current);
        clusterGroupRef.current = null;
      }
      if (labelLayerRef.current) {
        map.removeLayer(labelLayerRef.current);
        labelLayerRef.current = null;
      }
      return;
    }

    // Create cluster group with custom options
    const clusterGroup = L.markerClusterGroup({
      chunkedLoading: true,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      maxClusterRadius: MAX_CLUSTER_RADIUS,
      disableClusteringAtZoom: DISABLE_CLUSTERING_AT_ZOOM,
      iconCreateFunction: createClusterIcon,
    });

    // Create layer group for device labels
    const labelLayer = L.layerGroup();

    clusterGroupRef.current = clusterGroup;
    labelLayerRef.current = labelLayer;
    nodeMapRef.current.clear();

    // Add markers to cluster group
    nodes.forEach((node) => {
      const isHighlighted = highlightedNode?.id === node.id;
      
      const marker = L.marker([node.lat, node.lon], {
        icon: createNodeIcon(isHighlighted),
      });

      // Store node reference for event handlers
      nodeMapRef.current.set(marker, node);

      // Bind tooltip with site name
      marker.bindTooltip(node.siteName, {
        direction: 'top',
        offset: [0, -10],
      });

      // Event handlers
      marker.on('click', () => onNodeClick(node));
      marker.on('mouseover', (e) => onNodeHover(node, e as L.LeafletMouseEvent));
      marker.on('mouseout', () => onNodeLeave());

      clusterGroup.addLayer(marker);
    });

    map.addLayer(clusterGroup);
    map.addLayer(labelLayer);

    return () => {
      map.removeLayer(clusterGroup);
      map.removeLayer(labelLayer);
      nodeMapRef.current.clear();
    };
  }, [nodes, map, onNodeClick, onNodeHover, onNodeLeave, highlightedNode, showCircleClusters]);

  // ========== Update device labels based on zoom level ==========
  useEffect(() => {
    const labelLayer = labelLayerRef.current;
    if (!labelLayer || showCircleClusters) return;

    // Clear existing labels
    labelLayer.clearLayers();

    // Only show labels when zoomed in enough AND showLabels is true
    const showDeviceLabels = showLabels && currentZoom >= DEVICE_LABEL_ZOOM_THRESHOLD;
    
    if (showDeviceLabels) {
      nodes.forEach((node) => {
        const deviceName = node.name || node.siteName;
        
        const labelMarker = L.marker([node.lat, node.lon], {
          icon: createDeviceLabelIcon(deviceName),
          interactive: false,
        });
        
        labelLayer.addLayer(labelMarker);
      });
    }
  }, [nodes, currentZoom, showCircleClusters, showLabels]);

  return null;
}
