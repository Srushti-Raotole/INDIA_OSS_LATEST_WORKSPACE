
// ============================================
// Alarm Fiber Routes Layer
// ============================================

import { useMemo, useCallback, useEffect, Fragment, useState } from 'react';
import { Polyline, Tooltip, Marker, useMap, useMapEvents } from 'react-leaflet';
import type { FiberRoute } from '../../types/fiberTypes';
import type { FiberAlarm } from '../../types/alarmTypes';
import { ALARM_COLOR } from '../../types/alarmTypes';
import L from 'leaflet';

const NORMAL_COLOR = '#22c55e';
const ROUTE_WEIGHT = 3;
const ROUTE_OPACITY = 0.85;
const LINE_SMOOTH_FACTOR = 1.5;
const LINK_LABEL_MIN_ZOOM = 8;

/** Link name label — positioned at midpoint */
function createLinkNameIcon(linkName: string, hasAlarm: boolean): L.DivIcon {
  const bg = hasAlarm ? 'rgba(239,68,68,0.9)' : 'rgba(245,158,11,0.9)';
  const textColor = '#ffffff';
  return L.divIcon({
    className: 'link-name-label',
    html: `<div style="display:inline-block;background:${bg};color:${textColor};padding:2px 6px;border-radius:3px;font-size:9px;font-weight:600;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.2);line-height:1.2;">${linkName}</div>`,
    iconSize: [0, 0],
    iconAnchor: [40, 5],
  });
}

const GLOW_FILTER_ID = 'alarm-glow-filter';

function AlarmGlowFilter() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    const svg = container.querySelector('.leaflet-overlay-pane svg');
    if (!svg) return;
    if (svg.querySelector(`#${GLOW_FILTER_ID}`)) return;

    let defs = svg.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      svg.insertBefore(defs, svg.firstChild);
    }

    const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    filter.setAttribute('id', GLOW_FILTER_ID);
    filter.setAttribute('x', '-50%');
    filter.setAttribute('y', '-50%');
    filter.setAttribute('width', '200%');
    filter.setAttribute('height', '200%');

    const blur = document.createElementNS('http://www.w3.org/2000/svg', 'feGaussianBlur');
    blur.setAttribute('stdDeviation', '4');
    blur.setAttribute('result', 'coloredBlur');
    filter.appendChild(blur);

    const merge = document.createElementNS('http://www.w3.org/2000/svg', 'feMerge');
    const mergeNode1 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
    mergeNode1.setAttribute('in', 'coloredBlur');
    merge.appendChild(mergeNode1);
    const mergeNode2 = document.createElementNS('http://www.w3.org/2000/svg', 'feMergeNode');
    mergeNode2.setAttribute('in', 'SourceGraphic');
    merge.appendChild(mergeNode2);
    filter.appendChild(merge);

    defs.appendChild(filter);

    return () => { filter.remove(); };
  }, [map]);

  return null;
}

/** Track current zoom level */
function useCurrentZoom(): number {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  useMapEvents({
    zoomend: () => setZoom(map.getZoom()),
  });
  return zoom;
}

interface AlarmFiberRoutesLayerProps {
  routes: FiberRoute[];
  routeHasAlarm: (route: FiberRoute) => boolean;
  getAlarmsForRoute: (route: FiberRoute) => FiberAlarm[];
  onRouteClick?: (route: FiberRoute) => void;
  selectedRoute?: FiberRoute | null;
  showLinkLabels?: boolean;
}

export function AlarmFiberRoutesLayer({
  routes,
  routeHasAlarm,
  getAlarmsForRoute,
  onRouteClick,
  selectedRoute,
  showLinkLabels = true,
}: AlarmFiberRoutesLayerProps) {
  const toLatLng = useCallback(
    (coords: [number, number][]): [number, number][] =>
      coords.map(([lon, lat]) => [lat, lon]),
    []
  );

  const currentZoom = useCurrentZoom();
  const labelsVisible = showLinkLabels && currentZoom >= LINK_LABEL_MIN_ZOOM;

  const rendered = useMemo(() => {
    return routes.map((route) => {
      const hasAlarm = routeHasAlarm(route);
      const alarms = hasAlarm ? getAlarmsForRoute(route) : [];
      const routeColor = hasAlarm ? ALARM_COLOR : NORMAL_COLOR;

      const midIdx = Math.floor(route.coordinates.length / 2);
      const midCoord = route.coordinates[midIdx];

      return (
        <Fragment key={route.id}>
          {/* Glow underlay for alarmed routes */}
          {hasAlarm && (
            <Polyline
              positions={toLatLng(route.coordinates)}
              pathOptions={{
                color: ALARM_COLOR,
                weight: ROUTE_WEIGHT + 6,
                opacity: 0.25,
                className: 'alarm-glow-line',
              }}
              smoothFactor={LINE_SMOOTH_FACTOR}
              interactive={false}
            />
          )}
          {/* Main route line */}
          <Polyline
            positions={toLatLng(route.coordinates)}
            pathOptions={{
              color: routeColor,
              weight: ROUTE_WEIGHT,
              opacity: ROUTE_OPACITY,
              className: hasAlarm ? 'alarm-blink-line' : '',
            }}
            smoothFactor={LINE_SMOOTH_FACTOR}
            eventHandlers={{
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
                <p className="text-muted-foreground">
                  <span className="font-medium">Span ID:</span> <span className="font-mono">{route.spanid}</span>
                </p>
                {hasAlarm ? (
                  <div className="flex items-center gap-1.5">
                    <span
                      className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white"
                      style={{ backgroundColor: ALARM_COLOR }}
                    >
                      !
                    </span>
                    <span className="font-semibold" style={{ color: ALARM_COLOR }}>
                      {alarms.length} alarm{alarms.length > 1 ? 's' : ''} active
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#22c55e] text-[9px] font-bold text-white">✓</span>
                    <span style={{ color: NORMAL_COLOR }} className="font-medium">Normal</span>
                  </div>
                )}
              </div>
            </Tooltip>
          </Polyline>

          {/* Link name label at zoom >= 8 */}
          {labelsVisible && route.linkName && midCoord && (
            <Marker
              position={[midCoord[1], midCoord[0]]}
              icon={createLinkNameIcon(route.linkName, hasAlarm)}
              interactive={false}
            />
          )}
        </Fragment>
      );
    });
  }, [routes, routeHasAlarm, getAlarmsForRoute, selectedRoute, toLatLng, onRouteClick, labelsVisible]);

  return (
    <>
      <AlarmGlowFilter />
      {rendered}
    </>
  );
}
