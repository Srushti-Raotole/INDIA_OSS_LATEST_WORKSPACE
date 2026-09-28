

import { useMemo, Fragment, useState, useEffect } from 'react';
import { Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { FiberSite } from '../../types/fiberTypes';
import { TECHNOLOGY_COLORS_HEX, getTechnologyColor } from '../../utils/technologyColors';

// ============================================
// Constants
// ============================================

/** Minimum zoom to show site markers (default) */
const SITE_MARKER_MIN_ZOOM = 7;

/** Minimum zoom to show site markers when in FIBER-only mode */
const SITE_MARKER_MIN_ZOOM_FIBER_MODE = 5;

/** Minimum zoom to show site labels */
const SITE_LABEL_MIN_ZOOM = 6;

// ============================================
// Props Interface
// ============================================

interface FiberSitesLayerProps {
  /** Array of fiber sites to render */
  sites: FiberSite[];
  /** Callback when clicking a site */
  onSiteClick?: (site: FiberSite) => void;
  /** Callback when hovering a site */
  onSiteHover?: (site: FiberSite, e: L.LeafletMouseEvent) => void;
  /** Callback when mouse leaves a site */
  onSiteLeave?: () => void;
  /** Currently selected site */
  selectedSite?: FiberSite | null;
  /** Whether in fiber-only mode (shows sites at lower zoom) */
  fiberOnlyMode?: boolean;
  /** Whether to show site labels (default: true) */
  showLabels?: boolean;
}

// ============================================
// Utility Functions
// ============================================

/**
 * Create a diamond-shaped marker icon for fiber sites
 */
function createSiteIcon(technology: string, isSelected: boolean = false, zoom: number = 10): L.DivIcon {
  const color = getTechnologyColor(technology);
  const size = zoom <= 6 ? 4 : (isSelected ? 8 : 6);

  return L.divIcon({
    className: 'fiber-site-marker',
    html: `<div style="width:${size}px;height:${size}px;background:${color};border-radius:50%;"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/**
 * Create a label marker for site names
 */
function createLabelIcon(name: string, technology: string): L.DivIcon {
  const color = getTechnologyColor(technology);
  
  return L.divIcon({
    className: 'fiber-site-label',
    html: `<div style="display:inline-block;background:${color};color:white;padding:2px 6px;border-radius:3px;font-size:9px;font-weight:600;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.2);line-height:1.2;">${name}</div>`,
    iconSize: [0, 0],
    iconAnchor: [-8, 5],
  });
}

// ============================================
// Component
// ============================================

/**
 * Renders fiber sites as diamond markers
 * Features:
 * - Diamond shape to distinguish from circuit nodes
 * - Color by technology (CIENA=blue, NOKIA=red)
 * - Hover tooltip with site details
 * - Labels visible at higher zoom levels
 */
export function FiberSitesLayer({
  sites,
  onSiteClick,
  onSiteHover,
  onSiteLeave,
  selectedSite,
  fiberOnlyMode = false,
  showLabels = true,
}: FiberSitesLayerProps) {
  const map = useMap();
  const [currentZoom, setCurrentZoom] = useState(map.getZoom());

  // Track zoom changes
  useEffect(() => {
    const handleZoomEnd = () => setCurrentZoom(map.getZoom());
    map.on('zoomend', handleZoomEnd);
    return () => { map.off('zoomend', handleZoomEnd); };
  }, [map]);

  // Use lower zoom threshold when in fiber-only mode
  const minZoom = fiberOnlyMode ? SITE_MARKER_MIN_ZOOM_FIBER_MODE : SITE_MARKER_MIN_ZOOM;
  const showMarkers = currentZoom >= minZoom;
  const showSiteLabels = showLabels && currentZoom >= SITE_LABEL_MIN_ZOOM;

  const renderedSites = useMemo(() => {
    if (!showMarkers) return null;

    return sites
      .filter(s => s.coordinates && typeof s.coordinates[0] === 'number' && !isNaN(s.coordinates[0]) && typeof s.coordinates[1] === 'number' && !isNaN(s.coordinates[1]))
      .map((site, index) => {
      const isSelected = selectedSite?.id === site.id;
      const position: [number, number] = [site.coordinates[1], site.coordinates[0]];
      const markerKey = `fiber-site-marker-${site.id}-${site.name}-${index}`;
      const labelKey = `fiber-site-label-${site.id}-${site.name}-${index}`;
      
      return (
        <Fragment key={markerKey}>
          <Marker
            position={position}
            icon={createSiteIcon(site.technology, isSelected, currentZoom)}
            eventHandlers={{
              click: () => onSiteClick?.(site),
              mouseover: (e) => onSiteHover?.(site, e),
              mouseout: () => {
                if (!isSelected) {
                  onSiteLeave?.();
                }
              },
            }}
          >
            <Tooltip 
              className="!bg-background !border-border !text-foreground !shadow-lg !rounded-md !px-3 !py-2"
            >
              <div className="text-xs space-y-1">
                <p className="font-semibold text-sm">{site.name}</p>
                <p className="text-muted-foreground">
                  <span className="font-medium">Node:</span> {site.nodeName}
                </p>
                <p className="text-muted-foreground">
                  <span className="font-medium">IP:</span> {site.nodeIP}
                </p>
                <p className="text-muted-foreground">
                  <span className="font-medium">Technology:</span>{' '}
                  <span className={site.technology?.toUpperCase() === 'CIENA' ? 'text-blue-600' : 'text-fuchsia-400'}>
                    {site.technology}
                  </span>
                </p>
                <p className="text-muted-foreground">
                  <span className="font-medium">Conn Type:</span> {site.connType}
                </p>
              </div>
            </Tooltip>
          </Marker>

          {showSiteLabels && (
            <Marker
              key={labelKey}
              position={position}
              icon={createLabelIcon(site.name, site.technology)}
              interactive={false}
            />
          )}
        </Fragment>
      );
    });
  }, [sites, showMarkers, showSiteLabels, currentZoom, selectedSite, onSiteClick, onSiteHover, onSiteLeave]);

  // Render labels separately (above markers)
  const siteLabelsElements = useMemo(() => {
    if (!showSiteLabels) return null;

    return null;
  }, [sites, showSiteLabels]);

  return (
    <>
      {renderedSites}
      {siteLabelsElements}
    </>
  );
}
