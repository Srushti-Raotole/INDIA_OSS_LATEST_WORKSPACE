

import { useState, useCallback } from 'react';
import L from 'leaflet';
import { NetworkNode, NetworkLink, TooltipPosition } from '../types';

export interface MapInteractionState {
  selectedNode: NetworkNode | null;
  selectedLink: NetworkLink | null;
  hoveredNode: NetworkNode | null;
  hoveredLink: NetworkLink | null;
  tooltipPosition: TooltipPosition;
  nodeSidebarOpen: boolean;
  linkSidebarOpen: boolean;
}

export interface MapInteractionHandlers {
  handleNodeClick: (node: NetworkNode) => void;
  handleNodeHover: (node: NetworkNode, e: L.LeafletMouseEvent) => void;
  handleNodeLeave: () => void;
  handleLinkClick: (link: NetworkLink) => void;
  handleLinkHover: (link: NetworkLink, e: L.LeafletMouseEvent) => void;
  handleLinkLeave: () => void;
  closeNodeSidebar: () => void;
  closeLinkSidebar: () => void;
  closeSidebar: () => void; // Legacy - closes node sidebar
}

/**
 * Hook to manage map interaction state
 * Handles node/link selection, hover states, and sidebar visibility
 * 
 * BEHAVIOR:
 * - Clicking a node opens node sidebar, closes link sidebar
 * - Clicking a link opens link sidebar, closes node sidebar
 * - Only one sidebar is open at a time
 */
export function useMapInteractions(): MapInteractionState & MapInteractionHandlers {
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [selectedLink, setSelectedLink] = useState<NetworkLink | null>(null);
  const [hoveredNode, setHoveredNode] = useState<NetworkNode | null>(null);
  const [hoveredLink, setHoveredLink] = useState<NetworkLink | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>({ x: 0, y: 0 });
  const [nodeSidebarOpen, setNodeSidebarOpen] = useState(false);
  const [linkSidebarOpen, setLinkSidebarOpen] = useState(false);

  // Node click - opens node sidebar, closes link sidebar
  const handleNodeClick = useCallback((node: NetworkNode) => {
    setSelectedNode(node);
    setNodeSidebarOpen(true);
    // Close link sidebar when opening node sidebar
    setLinkSidebarOpen(false);
    setSelectedLink(null);
  }, []);

  // Link click - opens link sidebar, closes node sidebar
  const handleLinkClick = useCallback((link: NetworkLink) => {
    setSelectedLink(link);
    setLinkSidebarOpen(true);
    // Close node sidebar when opening link sidebar
    setNodeSidebarOpen(false);
    setSelectedNode(null);
  }, []);

  const handleNodeHover = useCallback((node: NetworkNode, e: L.LeafletMouseEvent) => {
    setHoveredNode(node);
    setTooltipPosition({ 
      x: e.originalEvent.clientX, 
      y: e.originalEvent.clientY 
    });
  }, []);

  const handleNodeLeave = useCallback(() => {
    setHoveredNode(null);
  }, []);

  const handleLinkHover = useCallback((link: NetworkLink, e: L.LeafletMouseEvent) => {
    setHoveredLink(link);
    setTooltipPosition({ 
      x: e.originalEvent.clientX, 
      y: e.originalEvent.clientY 
    });
  }, []);

  const handleLinkLeave = useCallback(() => {
    setHoveredLink(null);
  }, []);

  const closeNodeSidebar = useCallback(() => {
    setNodeSidebarOpen(false);
    setSelectedNode(null);
  }, []);

  const closeLinkSidebar = useCallback(() => {
    setLinkSidebarOpen(false);
    setSelectedLink(null);
  }, []);

  // Legacy - closes node sidebar (for backward compatibility)
  const closeSidebar = closeNodeSidebar;

  return {
    selectedNode,
    selectedLink,
    hoveredNode,
    hoveredLink,
    tooltipPosition,
    nodeSidebarOpen,
    linkSidebarOpen,
    handleNodeClick,
    handleNodeHover,
    handleNodeLeave,
    handleLinkClick,
    handleLinkHover,
    handleLinkLeave,
    closeNodeSidebar,
    closeLinkSidebar,
    closeSidebar,
  };
}

// Backward compatibility - alias sidebarOpen to nodeSidebarOpen
// Components using the old API will still work
