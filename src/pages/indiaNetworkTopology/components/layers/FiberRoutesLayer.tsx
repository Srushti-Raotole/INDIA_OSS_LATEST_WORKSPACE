

import { useMemo, useCallback, Fragment } from 'react';
import { Polyline, Tooltip, Marker } from 'react-leaflet';
import L from 'leaflet';
import type { FiberRoute } from '../../types/fiberTypes';


function createSpanLabelIcon(spanid: string): L.DivIcon {
  return L.divIcon({
    className: 'span-id-label',
    html: `<div style="font-size:11px;font-weight:700;color:#fff;background:rgba(30,30,30,0.85);padding:2px 8px;border-radius:4px;white-space:nowrap;pointer-events:none;box-shadow:0 2px 6px rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.2);letter-spacing:0.5px;">${spanid}</div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 8],
  });
}

// ============================================
// Constants
// ============================================

/** Line weight for fiber routes */
const FIBER_ROUTE_WEIGHT = 4;

/** Line opacity */
const FIBER_ROUTE_OPACITY = 0.85;

/** Smooth factor for polylines */
const LINE_SMOOTH_FACTOR = 1.5;

/** Color mapping for fiber types */
const FIBER_TYPE_COLORS: Record<string, string> = {
  NLD: '#10b981',    // Green for long distance
  METRO: '#8b5cf6',  // Purple for metro
  DEFAULT: '#ef4444', // Red fallback
};

/** Color mapping for methodology */
const METHODOLOGY_COLORS: Record<string, string> = {
  OPGW: '#10b981',   // Emerald for OPGW
  UG: '#f97316',     // Orange for Underground
  AERIAL: '#51aee4', // Light blue for Aerial
  UTILITY: '#ad4ade', // Purple for Utility
  DEFAULT: '#6b7280', // Gray fallback
};

// ============================================
// Props Interface
// ============================================

interface FiberRoutesLayerProps {
  /** Array of fiber routes to render */
  routes: FiberRoute[];
  /** Callback when hovering over a route */
  onRouteHover?: (route: FiberRoute, e: L.LeafletMouseEvent) => void;
  /** Callback when mouse leaves a route */
  onRouteLeave?: () => void;
  /** Callback when clicking a route */
  onRouteClick?: (route: FiberRoute) => void;
  /** Currently selected route */
  selectedRoute?: FiberRoute | null;
  /** Color mode: 'type' (NLD/METRO) or 'methodology' (OPGW/UG) */
  colorMode?: 'type' | 'methodology';
  /** Whether to show span ID labels on routes */
  showSpanLabels?: boolean;
}

// ============================================
// Component
// ============================================


export function FiberRoutesLayer({
  routes,
  onRouteHover,
  onRouteLeave,
  onRouteClick,
  selectedRoute,
  colorMode = 'type',
  showSpanLabels = false,
}: FiberRoutesLayerProps) {
  
  /**
   * Get color based on color mode
   */
  const getRouteColor = useCallback((route: FiberRoute): string => {
    if (colorMode === 'methodology') {
      return METHODOLOGY_COLORS[route.methodology] || METHODOLOGY_COLORS.DEFAULT;
    }
    return FIBER_TYPE_COLORS[route.type] || FIBER_TYPE_COLORS.DEFAULT;
  }, [colorMode]);

  /**
   * Convert [lon, lat] to [lat, lon] for Leaflet
   */
  const toLatLng = useCallback((coords: [number, number][]): [number, number][] => {
    return coords.map(([lon, lat]) => [lat, lon]);
  }, []);

  const renderedRoutes = useMemo(() => {
    return routes.map((route) => {
      const isSelected = selectedRoute?.id === route.id;
      const color = getRouteColor(route);
      
      const pathOptions: L.PathOptions = {
        color: isSelected ? '#facc15' : color,
        weight: isSelected ? FIBER_ROUTE_WEIGHT + 2 : FIBER_ROUTE_WEIGHT,
        opacity: FIBER_ROUTE_OPACITY,
        // @ts-ignore - smoothFactor is valid
        smoothFactor: LINE_SMOOTH_FACTOR,
      };

      // Calculate midpoint for span label
      const midIdx = Math.floor(route.coordinates.length / 2);
      const midCoord = route.coordinates[midIdx];

      return (
        <Fragment key={route.id}>
          <Polyline
            positions={toLatLng(route.coordinates)}
            pathOptions={pathOptions}
            eventHandlers={{
              mouseover: (e) => onRouteHover?.(route, e),
              mouseout: () => {
                if (!isSelected) {
                  onRouteLeave?.();
                }
              },
              click: () => onRouteClick?.(route),
            }}
          >
            <Tooltip 
              sticky 
              className="!bg-background !border-border !text-foreground !shadow-lg !rounded-md !px-3 !py-2"
            >
              <div className="text-xs space-y-1">
                <p className="font-semibold text-sm">{route.routeName}</p>
                <p className="text-muted-foreground">
                  <span className="font-medium">Link:</span> {route.linkName}
                </p>
                {route.spanid && (
                  <p className="text-muted-foreground">
                    <span className="font-medium">Span ID:</span>{' '}
                    <span className="font-mono">{route.spanid}</span>
                  </p>
                )}
                <p className="text-muted-foreground">
                  <span className="font-medium">Type:</span>{' '}
                  <span className={route.type === 'NLD' ? 'text-green-600' : 'text-purple-600'}>
                    {route.type}
                  </span>
                  {' • '}
                  <span className="font-medium">Method:</span> {route.methodology}
                </p>
                <p className="text-muted-foreground">
                  <span className="font-medium">Length:</span> {route.lengthKms.toFixed(2)} km
                </p>
                <p className="text-muted-foreground">
                  <span className="font-medium">Status:</span> {route.construction}
                </p>
              </div>
            </Tooltip>
          </Polyline>

          {/* Span ID label at midpoint */}
          {showSpanLabels && route.spanid && midCoord && (
            <Marker
              position={[midCoord[1], midCoord[0]]}
              icon={createSpanLabelIcon(route.spanid)}
              interactive={false}
            />
          )}
        </Fragment>
      );
    });
  }, [routes, selectedRoute, getRouteColor, toLatLng, onRouteHover, onRouteLeave, onRouteClick, showSpanLabels]);

  return <>{renderedRoutes}</>;
}
