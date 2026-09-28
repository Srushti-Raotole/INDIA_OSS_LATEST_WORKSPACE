
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Polyline, Tooltip, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { NetworkLink, LinkColorMode } from '../../types';
import { getUtilizationColor } from '../../utils/colorUtils';
import { getDomainColor } from '../../utils/domainColorUtils';
import { LINK_LABEL_ZOOM_THRESHOLD } from '../../constants';

// Constants - CHANGE THESE FOR CUSTOMIZATION


const FULL_LABEL_ZOOM_THRESHOLD = 10;

const DEFAULT_LINK_WEIGHT = 3;

const DEFAULT_LINK_OPACITY = 0.8;

/**
 * Smooth factor for polylines (higher = smoother, less accurate)
 * CHANGE THIS: 0 = no simplification, higher = smoother
 */
const LINE_SMOOTH_FACTOR = 1.5;

/**
 * Maximum characters for truncated labels
 * CHANGE THIS: Adjust for different label lengths
 */
const TRUNCATED_LABEL_MAX_LENGTH = 20;

/**
 * Enable/disable traffic animation
 * CHANGE THIS: Set to false to disable animated dots
 */
const TRAFFIC_ANIMATION_ENABLED = false;

/**
 * Offset in pixels to position label above the link
 * CHANGE THIS: Increase for more space above link
 */
const LABEL_OFFSET_Y = -20;

// ============================================
// Props Interface
// ============================================

interface LinksLayerProps {
  /** Array of network links to render (filtered) */
  links: NetworkLink[];
  /** All links (unfiltered) - used for sector label positioning */
  allLinks?: NetworkLink[];
  /** Callback when hovering over a link */
  onLinkHover: (link: NetworkLink, e: L.LeafletMouseEvent) => void;
  /** Callback when mouse leaves a link */
  onLinkLeave: () => void;
  /** Callback when clicking a link (to pin tooltip) */
  onLinkClick?: (link: NetworkLink) => void;
  /** Currently selected/pinned link */
  selectedLink?: NetworkLink | null;
  /** Color mode: 'utilization' or 'domain' */
  colorMode?: LinkColorMode;
  /** Callback when clicking a sector label on the map */
  onSectorClick?: (sector: string) => void;
  /** Currently selected sector (for highlighting) */
  selectedSector?: string;
  /**
   * When false, ALL labels are hidden (sector labels, link labels).
   * Only the polylines remain visible.
   * Controlled by LabelToggle in the toolbar.
   */
  showLabels?: boolean;
}

// ============================================
// Traffic Animation Types
// ============================================

interface TrafficParticle {
  linkId: string;
  progress: number; // 0 to 1 along the link
  speed: number;
  size: number;
}


function createLabelIcon(text: string, isSelected: boolean = false): L.DivIcon {
  // Yellow background with dark text for visibility
  const bgColor = isSelected ? '#3b82f6' : '#facc15';
  const textColor = isSelected ? '#ffffff' : '#1a1a1a';
  const borderColor = isSelected ? '#2563eb' : '#eab308';
  
  return L.divIcon({
    className: 'leaflet-link-label-above',
    html: `
      <div style="
        background: ${bgColor};
        color: ${textColor};
        border: 1px solid ${borderColor};
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 10px;
        font-weight: 600;
        font-family: system-ui, -apple-system, sans-serif;
        white-space: nowrap;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        display: inline-block;
        transform: translateX(-50%);
      ">
        ${text}
      </div>
    `,
    iconSize: [0, 0],
    // Position label above the midpoint of the link
    iconAnchor: [0, -LABEL_OFFSET_Y],
  });
}

/**
 * Create a traffic dot icon for animation
 * @param color - Color of the dot based on utilization
 * @param size - Size of the dot in pixels
 */
function createTrafficDotIcon(color: string, size: number = 6): L.DivIcon {
  return L.divIcon({
    className: 'traffic-dot',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: 50%;
        box-shadow: 0 0 ${size}px ${color}, 0 0 ${size * 2}px ${color};
        animation: pulse 1s ease-in-out infinite;
      "></div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/**
 * Get truncated label for display
 * @param channelName - Full channel name
 * @param maxLength - Maximum characters to show
 * @returns Truncated string with ellipsis if needed
 */
function getTruncatedLabel(channelName: string, maxLength: number = TRUNCATED_LABEL_MAX_LENGTH): string {
  if (channelName.length <= maxLength) return channelName;
  return channelName.substring(0, maxLength) + '...';
}

/**
 * Calculate position along a line given progress (0-1)
 * @param startLat - Start latitude
 * @param startLon - Start longitude
 * @param endLat - End latitude
 * @param endLon - End longitude
 * @param progress - Progress along line (0 = start, 1 = end)
 * @returns [lat, lon] position
 */
function interpolatePosition(
  startLat: number,
  startLon: number,
  endLat: number,
  endLon: number,
  progress: number
): [number, number] {
  return [
    startLat + (endLat - startLat) * progress,
    startLon + (endLon - startLon) * progress,
  ];
}

// ============================================
// Main Component
// ============================================

/**
 * Renders all network links as polylines with labels above them
 * 
 * Features:
 * - Link colors indicate utilization levels (green/yellow/red)
 * - Labels positioned ABOVE links to prevent overlap
 * - Animated traffic dots show data flow direction
 * - Solid lines for NLD, dashed for METRO
 */
export function LinksLayer({ 
  links,
  allLinks,
  onLinkHover,
  onLinkLeave,
  onLinkClick,
  selectedLink,
  colorMode = 'utilization',
  onSectorClick,
  selectedSector,
  showLabels = true,
}: LinksLayerProps) {
  const map = useMap();
  const [currentZoom, setCurrentZoom] = useState(map.getZoom());
  const [trafficParticles, setTrafficParticles] = useState<TrafficParticle[]>([]);
  const animationFrameRef = useRef<number>(1);

  // ========== Zoom Level Tracking ==========
  useEffect(() => {
    const handleZoomEnd = () => {
      setCurrentZoom(map.getZoom());
    };
    map.on('zoomend', handleZoomEnd);
    return () => {
      map.off('zoomend', handleZoomEnd);
    };
  }, [map]);

  // ========== Traffic Animation ==========
  useEffect(() => {
    if (!TRAFFIC_ANIMATION_ENABLED || links.length === 0) return;

    // Initialize particles - one per link
    const initialParticles: TrafficParticle[] = links.map((link) => ({
      linkId: link.id,
      progress: Math.random(), // Random start position
      speed: 0.002 + (link.utilizationPercent / 100) * 0.003, // Speed based on utilization
      size: 4 + (link.utilizationPercent / 100) * 4, // Size based on utilization
    }));
    setTrafficParticles(initialParticles);

    // Animation loop
    const animate = () => {
      setTrafficParticles(prev => 
        prev.map(particle => ({
          ...particle,
          progress: (particle.progress + particle.speed) % 1,
        }))
      );
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [links]);

  const showShortLabels = currentZoom >= LINK_LABEL_ZOOM_THRESHOLD;
  const showFullLabels = currentZoom >= FULL_LABEL_ZOOM_THRESHOLD;

  const handleLinkClick = useCallback((link: NetworkLink) => {
    if (onLinkClick) {
      onLinkClick(link);
    }
  }, [onLinkClick]);

  // ========== Render Links ==========
  const renderedLinks = useMemo(() => {
    return links.map((link, index) => {
      // Get color based on color mode
      const color = colorMode === 'domain' 
        ? getDomainColor(link.circuit?.circuitType)
        : getUtilizationColor(link.utilizationPercent);
      
      const isSelected = selectedLink?.id === link.id;

      const pathOptions: L.PathOptions = {
        color: isSelected ? 'hsl(217, 91%, 60%)' : color,
        weight: isSelected ? DEFAULT_LINK_WEIGHT + 1 : DEFAULT_LINK_WEIGHT,
        opacity: DEFAULT_LINK_OPACITY,
        dashArray: link.circuit.type === 'METRO' ? '5, 5' : undefined,
        // @ts-ignore - smoothFactor is a valid Leaflet Polyline option
        smoothFactor: LINE_SMOOTH_FACTOR,
      };

      return (
        <Polyline
          key={`${link.id}-${index}`}
          positions={[
            [link.source.lat, link.source.lon],
            [link.target.lat, link.target.lon],
          ]}
          pathOptions={pathOptions}
          eventHandlers={{
            mouseover: (e) => onLinkHover(link, e),
            mouseout: () => {
              if (!isSelected) {
                onLinkLeave();
              }
            },
            click: () => handleLinkClick(link),
          }}
        >
          <Tooltip 
            sticky={!isSelected}
            permanent={isSelected}
            className="!bg-background !border-border !text-foreground !shadow-lg !rounded-md !px-2 !py-1"
          >
            <div className="text-xs">
              <p className="font-medium">
                {link.source.siteName} → {link.target.siteName}
              </p>
              <p className="text-muted-foreground">
                {link.circuit.type} • {link.utilizationPercent}% utilization
              </p>
              {link.circuit.circuitType && (
                <p className="text-muted-foreground">
                  <span className={link.circuit.circuitType === 'IP' ? 'text-blue-500 font-semibold' : 'text-teal-500 font-semibold'}>
                    {link.circuit.circuitType}
                  </span>
                  {link.circuit.path && (
                    <span> • {link.circuit.path === 'P' ? '🛡️ Protected' : link.circuit.path === 'W' ? '⚡ Working' : 'Other'}</span>
                  )}
                  {link.circuit.qualifier && ` • ${link.circuit.qualifier}`}
                </p>
              )}
              {link.circuit.sector && (
                <p className="text-muted-foreground">
                  Sector: <span className="text-foreground font-medium">{link.circuit.sector}</span>
                </p>
              )}
              <p className="text-muted-foreground truncate max-w-[250px]">
                {link.circuit.channelName}
              </p>
              <div className="mt-1 pt-1 border-t border-border">
                <p className="text-muted-foreground text-[10px]">
                  {link.capacity}G capacity • {link.usedCapacity}G used
                </p>
              </div>
              {isSelected && (
                <p className="text-[10px] text-primary mt-1 italic">
                  Click elsewhere to unpin
                </p>
              )}
            </div>
          </Tooltip>
        </Polyline>
      );
    });
  }, [links, onLinkHover, onLinkLeave, handleLinkClick, selectedLink, colorMode]);

  // ========== Link Labels - COMMENTED OUT ==========
  // Yellow background labels above links are disabled
  // Sector labels provide clearer grouping instead
  const linkLabels = null;
  /*
  const linkLabels = useMemo(() => {
    if (!showShortLabels) return null;
    return links.map((link) => {
      const midLat = (link.source.lat + link.target.lat) / 2;
      const midLon = (link.source.lon + link.target.lon) / 2;
      const fullLabel = link.circuit.circuitUserLabel || link.circuit.channelName;
      const labelText = showFullLabels ? fullLabel : getTruncatedLabel(fullLabel);
      const isSelected = selectedLink?.id === link.id;
      return (
        <Marker
          key={`label-${link.id}`}
          position={[midLat, midLon]}
          icon={createLabelIcon(labelText, isSelected)}
          interactive={false}
        />
      );
    });
  }, [links, showShortLabels, showFullLabels, selectedLink]);
  */

  // ========== Render Sector Labels (Clickable) ==========
  // Sector labels are hidden when showLabels=false (same Label Toggle as nodes/fiber)
  // Uses allLinks (unfiltered) so labels remain visible even when a sector is selected
  const sectorLabels = useMemo(() => {
    // Hide when labels toggled off OR zoom too low
    if (!showLabels || currentZoom < 6) return null;

    // Use allLinks for label positioning so all sector labels are always visible
    const linksForLabels = allLinks || links;
    const sectorMap = new Map<string, { lats: number[]; lons: number[] }>();
    linksForLabels.forEach((link) => {
      const sector = link.circuit?.sector;
      if (!sector) return;
      if (!sectorMap.has(sector)) {
        sectorMap.set(sector, { lats: [], lons: [] });
      }
      const group = sectorMap.get(sector)!;
      group.lats.push(link.source.lat, link.target.lat);
      group.lons.push(link.source.lon, link.target.lon);
    });

    return Array.from(sectorMap.entries()).map(([sector, { lats, lons }]) => {
      const midLat = lats.reduce((a, b) => a + b, 0) / lats.length;
      const midLon = lons.reduce((a, b) => a + b, 0) / lons.length;

      const isActive = selectedSector === sector;

      // Sector label: smaller size (font-size 9px vs previous 11px)
      const icon = L.divIcon({
        className: 'sector-label-clickable',
        html: `
          <div style="
            background: ${isActive ? 'hsl(var(--primary))' : 'transparent'};
            color: ${isActive ? 'hsl(var(--primary-foreground))' : '#1a1a1a'};
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 9px;
            font-weight: 700;
            font-family: system-ui, -apple-system, sans-serif;
            white-space: nowrap;
            box-shadow: none;
            transform: translateX(-50%);
            letter-spacing: 0.3px;
            text-transform: uppercase;
            cursor: pointer;
            border: none;
            user-select: none;
            display: inline-flex;
            align-items: center;
            gap: 3px;
          "
          onmouseenter="this.style.transform='translateX(-50%) scale(1.08)'"
          onmouseleave="this.style.transform='translateX(-50%) scale(1)'"
          >
            📍 ${sector}
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 24],
      });

      return (
        <Marker
          key={`sector-${sector}`}
          position={[midLat, midLon]}
          icon={icon}
          interactive={true}
          eventHandlers={{
            click: () => {
              if (onSectorClick) {
                // Toggle: clicking same sector clears it
                onSectorClick(selectedSector === sector ? '' : sector);
              }
            },
          }}
        />
      );
    });
  }, [links, allLinks, currentZoom, selectedSector, onSectorClick, showLabels]);

  // ========== Render Traffic Animation Dots ==========
  const trafficDots = useMemo(() => {
    if (!TRAFFIC_ANIMATION_ENABLED || currentZoom < 8) return null;

    return trafficParticles.map((particle) => {
      const link = links.find(l => l.id === particle.linkId);
      if (!link) return null;

      const [lat, lon] = interpolatePosition(
        link.source.lat,
        link.source.lon,
        link.target.lat,
        link.target.lon,
        particle.progress
      );

      const color = getUtilizationColor(link.utilizationPercent);

      return (
        <Marker
          key={`traffic-${particle.linkId}`}
          position={[lat, lon]}
          icon={createTrafficDotIcon(color, particle.size)}
          interactive={false}
        />
      );
    });
  }, [trafficParticles, links, currentZoom]);

  return (
    <>
      {renderedLinks}
      {linkLabels}
      {sectorLabels}
      {trafficDots}
      
      {/* CSS for traffic dot pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.2); }
        }
        .traffic-dot > div {
          animation: pulse 1s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}
