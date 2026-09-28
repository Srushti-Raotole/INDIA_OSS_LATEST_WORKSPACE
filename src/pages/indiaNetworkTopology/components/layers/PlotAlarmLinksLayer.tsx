

import { useMemo, Fragment, useCallback, useState } from 'react';
import { Polyline, Tooltip, CircleMarker, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { SitePairGroup, FiberAlarm } from '../../types/alarmTypes';
import { ALARM_COLOR } from '../../types/alarmTypes';
import { getTechnologyColor } from '../../utils/technologyColors';
import type { FiberRoute } from '../../types/fiberTypes';

const ROUTE_WEIGHT = 3.5;
const ROUTE_OPACITY = 0.92;
const SITE_VISIBLE_ZOOM = 8;
const SITE_LABEL_ZOOM = 10;
const SPAN_LABEL_ZOOM = 12;

interface PlotAlarmLinksLayerProps {
  sitePairGroups: SitePairGroup[];
  spanHasAlarm: (spanId: string) => boolean;
  getAlarmsForSpan: (spanId: string) => FiberAlarm[];
  onGroupClick?: (group: SitePairGroup) => void;
  showSiteLabels?: boolean;
  showSpanLabels?: boolean;
  showHeatmap?: boolean;
  /** Fiber routes — used to draw alarm line along the actual fiber path (matched by spanId) */
  fiberRoutes?: FiberRoute[];
}

/** Site name label — below/beside the dot */
function createSiteNameIcon(name: string): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<span style="
      font-size:9px;
      font-weight:600;
      color:#1e293b;
      white-space:nowrap;
      text-shadow:0 0 4px #fff,0 0 8px #fff,1px 1px 2px rgba(255,255,255,0.9);
      pointer-events:none;
    ">${name}</span>`,
    iconSize: [0, 0],
    iconAnchor: [-8, 5],
  });
}

/** Span ID label at midpoint of link */
function createSpanIdIcon(spanIds: string[]): L.DivIcon {
  const label = spanIds.join(', ');
  return L.divIcon({
    className: '',
    html: `<span style="
      font-size:9px;
      font-weight:600;
      color:#1e293b;
      white-space:nowrap;
      text-shadow:0 0 4px #fff,0 0 8px #fff,1px 1px 2px rgba(255,255,255,0.9);
      pointer-events:none;
    ">${label}</span>`,
    iconSize: [0, 0],
    iconAnchor: [0, 12],
  });
}

function ZoomTracker({ onZoomChange }: { onZoomChange: (z: number) => void }) {
  useMapEvents({
    zoomend: (e) => onZoomChange(e.target.getZoom()),
    zoom: (e) => onZoomChange(e.target.getZoom()),
  });
  return null;
}

/** Calculate alarm density for heatmap coloring */
function getHeatmapColor(alarmedRatio: number): string {
  if (alarmedRatio >= 0.75) return '#dc2626'; // red-600
  if (alarmedRatio >= 0.5) return '#ea580c';  // orange-600
  if (alarmedRatio >= 0.25) return '#d97706'; // amber-600
  if (alarmedRatio > 0) return '#ca8a04';     // yellow-600
  return '#16a34a';                            // green-600
}

export function PlotAlarmLinksLayer({
  sitePairGroups,
  spanHasAlarm,
  getAlarmsForSpan,
  onGroupClick,
  showSiteLabels = true,
  showSpanLabels = true,
  showHeatmap = false,
  fiberRoutes = [],
}: PlotAlarmLinksLayerProps) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  const groupHasAlarm = useCallback((group: SitePairGroup): boolean => {
    return group.spans.some(s => spanHasAlarm(s.spanId));
  }, [spanHasAlarm]);

  // Index fiber routes by spanid for O(1) lookup when drawing alarm polylines
  const fiberRouteBySpanId = useMemo(() => {
    const m = new Map<string, [number, number][]>();
    for (const r of fiberRoutes) {
      if (!r.spanid || !r.coordinates?.length) continue;
      // Convert [lon, lat] -> [lat, lon] for Leaflet
      m.set(r.spanid, r.coordinates.map(([lon, lat]) => [lat, lon]));
    }
    return m;
  }, [fiberRoutes]);

  // Unique sites with technology info
  const uniqueSites = useMemo(() => {
    const siteMap = new Map<string, { name: string; lat: number; lon: number; hasAlarm: boolean; technology: string }>();
    for (const group of sitePairGroups) {
      const gAlarm = groupHasAlarm(group);
      const tech = group.spans[0]?.technology || '';

      if (!siteMap.has(group.siteA)) {
        siteMap.set(group.siteA, { name: group.siteA, lat: group.latA, lon: group.lonA, hasAlarm: false, technology: tech });
      }
      if (gAlarm) siteMap.get(group.siteA)!.hasAlarm = true;
      if (tech && !siteMap.get(group.siteA)!.technology) siteMap.get(group.siteA)!.technology = tech;

      if (!siteMap.has(group.siteB)) {
        siteMap.set(group.siteB, { name: group.siteB, lat: group.latB, lon: group.lonB, hasAlarm: false, technology: tech });
      }
      if (gAlarm) siteMap.get(group.siteB)!.hasAlarm = true;
      if (tech && !siteMap.get(group.siteB)!.technology) siteMap.get(group.siteB)!.technology = tech;
    }
    return Array.from(siteMap.values());
  }, [sitePairGroups, groupHasAlarm]);

  // Links rendering — ONLY alarmed site-pairs are drawn. Non-alarmed pairs are not connected.
  // The red alarm line follows the actual fiber route (matched by spanId) when available,
  // and falls back to a straight A→B line if no fiber match is found.
  const rendered = useMemo(() => {
    const alarmedGroups = sitePairGroups.filter(g => g.spans.some(s => spanHasAlarm(s.spanId)));
    return alarmedGroups.map((group) => {
      const alarmedCount = group.spans.filter(s => spanHasAlarm(s.spanId)).length;
      const spanIds = group.spans.map(s => s.spanId);

      // Heatmap: color by alarm density ratio
      let lineColor = ALARM_COLOR;
      if (showHeatmap) {
        const ratio = alarmedCount / group.spans.length;
        lineColor = getHeatmapColor(ratio);
      }

      // Alarm duration for tooltip — oldest active alarm across all alarmed spans
      const oldestAlarmTime = group.spans
        .filter(s => spanHasAlarm(s.spanId))
        .flatMap(s => getAlarmsForSpan(s.spanId))
        .reduce((oldest, a) => {
          const t = new Date(a.rcvdTime).getTime();
          return t < oldest ? t : oldest;
        }, Date.now());
      const durationStr = formatDuration(Date.now() - oldestAlarmTime);

      // Build polyline positions — follow fiber route for alarmed spans when available
      const straight: [number, number][] = [[group.latA, group.lonA], [group.latB, group.lonB]];
      const alarmedSpanCoords: [number, number][][] = group.spans
        .filter(s => spanHasAlarm(s.spanId))
        .map(s => fiberRouteBySpanId.get(s.spanId))
        .filter((c): c is [number, number][] => !!c && c.length > 1);
      // react-leaflet Polyline supports MultiPolyline via positions={Array<LatLng[]>}
      const positions: any = alarmedSpanCoords.length > 0 ? alarmedSpanCoords : straight;

      return (
        <Fragment key={group.pairKey}>
          {/* Soft red glow underlay */}
          <Polyline
            positions={positions}
            pathOptions={{ color: ALARM_COLOR, weight: ROUTE_WEIGHT + 6, opacity: 0.15 }}
            interactive={false}
          />
          <Polyline
            positions={positions}
            pathOptions={{
              color: lineColor,
              weight: ROUTE_WEIGHT,
              opacity: ROUTE_OPACITY,
              className: !showHeatmap ? 'alarm-blink-line' : '',
            }}
            eventHandlers={{
              click: () => onGroupClick?.(group),
            }}
          >
            <Tooltip sticky direction="top" offset={[0, -10]}>
              <div style={{
                background: '#fff',
                color: '#1e293b',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                lineHeight: '1.5',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                border: '1px solid #e2e8f0',
                maxWidth: '280px',
              }}>
                <p style={{ fontWeight: 700, fontSize: '13px', margin: '0 0 4px 0' }}>
                  {group.siteA} → {group.siteB}
                </p>
                <p style={{ color: '#64748b', margin: '0 0 4px 0' }}>
                  <span style={{ fontWeight: 600 }}>{group.spans.length}</span> Span{group.spans.length > 1 ? 's' : ''}
                  {' · '}
                  <span style={{ fontFamily: 'monospace', fontSize: '10px' }}>{spanIds.join(', ')}</span>
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    width: '18px', height: '18px', borderRadius: '50%',
                    fontSize: '10px', fontWeight: 700, color: '#fff',
                    backgroundColor: ALARM_COLOR,
                  }}>!</span>
                  <span style={{ fontWeight: 600, color: ALARM_COLOR }}>
                    {alarmedCount}/{group.spans.length} alarmed
                  </span>
                  {durationStr && (
                    <span style={{ color: '#94a3b8', fontSize: '10px', marginLeft: '4px' }}>
                      ({durationStr})
                    </span>
                  )}
                </div>
              </div>
            </Tooltip>
          </Polyline>
        </Fragment>
      );
    });
  }, [sitePairGroups, spanHasAlarm, getAlarmsForSpan, onGroupClick, showHeatmap, fiberRouteBySpanId]);

  // Site dots — only visible at zoom 8+, colored by technology, red if alarmed
  const siteMarkers = useMemo(() => {
    if (zoom < SITE_VISIBLE_ZOOM) return null;
    return uniqueSites.map((site) => {
      const dotColor = site.hasAlarm ? ALARM_COLOR : getTechnologyColor(site.technology || 'UNKNOWN');
      return (
        <CircleMarker
          key={site.name}
          center={[site.lat, site.lon]}
          radius={3.5}
          pathOptions={{
            fillColor: dotColor,
            color: '#fff',
            weight: 1.5,
            fillOpacity: 0.95,
          }}
        >
          <Tooltip direction="top" offset={[0, -8]}>
            <div style={{
              background: '#fff',
              color: '#1e293b',
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              border: '1px solid #e2e8f0',
            }}>
              <p style={{ fontWeight: 600, margin: 0 }}>{site.name}</p>
              {site.technology && (
                <p style={{ color: '#64748b', fontSize: '10px', margin: '2px 0 0 0' }}>{site.technology}</p>
              )}
            </div>
          </Tooltip>
        </CircleMarker>
      );
    });
  }, [uniqueSites, zoom]);

  // Site name labels at zoom 7+
  const siteNameLabels = useMemo(() => {
    if (!showSiteLabels || zoom < SITE_LABEL_ZOOM) return null;
    return uniqueSites.map((site) => (
      <Marker
        key={`label-${site.name}`}
        position={[site.lat, site.lon]}
        icon={createSiteNameIcon(site.name)}
        interactive={false}
      />
    ));
  }, [uniqueSites, showSiteLabels, zoom]);

  // Span ID labels at zoom 10+
  const spanIdLabels = useMemo(() => {
    if (!showSpanLabels || zoom < SPAN_LABEL_ZOOM) return null;
    return sitePairGroups.map((group) => {
      const midLat = (group.latA + group.latB) / 2;
      const midLon = (group.lonA + group.lonB) / 2;
      const spanIds = group.spans.map(s => s.spanId);
      return (
        <Marker
          key={`span-${group.pairKey}`}
          position={[midLat, midLon]}
          icon={createSpanIdIcon(spanIds)}
          interactive={false}
        />
      );
    });
  }, [sitePairGroups, showSpanLabels, zoom]);

  return (
    <>
      <ZoomTracker onZoomChange={setZoom} />
      {rendered}
      {siteMarkers}
      {siteNameLabels}
      {spanIdLabels}
    </>
  );
}

/** Format milliseconds to human readable duration */
function formatDuration(ms: number): string {
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hrs < 24) return `${hrs}h ${remMins}m`;
  const days = Math.floor(hrs / 24);
  const remHrs = hrs % 24;
  return `${days}d ${remHrs}h`;
}
