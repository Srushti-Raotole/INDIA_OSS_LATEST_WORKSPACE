import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import maplibregl, { MapMouseEvent, GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Button } from '../../../components/ui/button';
import { Switch } from '../../../components/ui/switch';
import { Label } from '../../../components/ui/label';
import { X, Maximize2, Globe2, MapPin, Cable } from 'lucide-react';
import type { OverseasCable, OverseasVisibility } from './types';
import type { FiberRoute, FiberSite } from '../types/fiberTypes';
import { getTechnologyColor } from '../utils/technologyColors';
import { useGlobeMap } from '../fiberGlobe/useGlobeMap';
import { GlobeControls } from '../fiberGlobe/GlobeControls';
import { StarField } from '../fiberGlobe/StarField';
import { CoordinateSearchPanel } from '../fiberGlobe/CoordinateSearchPanel';

// World-ish default camera (pulled out so we see oceans + Asia)
const WORLD_CENTER: [number, number] = [100, 15];
const WORLD_ZOOM = 1.6;

// Fiber color palettes (in sync with FiberRoutesLayer / FiberGlobe)
const FIBER_TYPE_COLORS: Record<string, string> = {
  NLD: '#10b981',
  METRO: '#8b5cf6',
  DEFAULT: '#ef4444',
};
const METHODOLOGY_COLORS: Record<string, string> = {
  OPGW: '#10b981',
  UG: '#f97316',
  AERIAL: '#51aee4',
  UTILITY: '#ad4ade',
  DEFAULT: '#6b7280',
};

interface OverseasGlobeProps {
  cables: OverseasCable[];
  visibility: OverseasVisibility;
  fiberRoutes?: FiberRoute[];
  fiberSites?: FiberSite[];
  fiberColorMode?: 'type' | 'methodology';
  onClose: () => void;
}

export function OverseasGlobe({
  cables,
  visibility,
  fiberRoutes = [],
  fiberSites = [],
  fiberColorMode = 'type',
  onClose,
}: OverseasGlobeProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showLandings, setShowLandings] = useState(true);
  const [showFiber, setShowFiber] = useState(true);
  const [highlightedSegment, setHighlightedSegment] = useState<string | null>(null);

  const {
    mapRef, styleReady, styleRevision,
    basemap, setBasemap,
    projection, setProjection,
    autoRotate, setAutoRotate,
    isFullscreen, toggleFullscreen,
    screenshot, starfield,
    background, setBackground,
  } = useGlobeMap({
    containerRef,
    initialCenter: WORLD_CENTER,
    initialZoom: WORLD_ZOOM,
    initialBasemap: 'satellite', // Submarine cables look great on satellite
  });

  // Filter to only the cables the user has enabled
  const visibleCables = useMemo(
    () => cables.filter((c) => visibility[c.id]),
    [cables, visibility]
  );

  // ----- Build GeoJSON from cable segments -----
  const cablesGeoJSON = useMemo<GeoJSON.FeatureCollection>(() => {
    const features: GeoJSON.Feature[] = [];
    visibleCables.forEach((cable) => {
      cable.segments.forEach((seg) => {
        if (seg.coordinates.length < 2) return;
        features.push({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: seg.coordinates },
          properties: {
            cableId: cable.id,
            cableName: cable.displayName,
            segmentId: seg.id,
            segmentName: seg.name,
            color: cable.color,
            lengthKm: seg.lengthKm,
          },
        });
      });
    });
    return { type: 'FeatureCollection', features };
  }, [visibleCables]);

  const landingsGeoJSON = useMemo<GeoJSON.FeatureCollection>(() => {
    const features: GeoJSON.Feature[] = [];
    visibleCables.forEach((cable) => {
      cable.landings.forEach((land) => {
        features.push({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: land.coordinates },
          properties: {
            cableId: cable.id,
            color: cable.color,
            name: land.name,
          },
        });
      });
    });
    return { type: 'FeatureCollection', features };
  }, [visibleCables]);

  // ----- Fiber GeoJSON -----
  const getRouteColor = useCallback((route: FiberRoute): string => {
    if (fiberColorMode === 'methodology') {
      return METHODOLOGY_COLORS[route.methodology] || METHODOLOGY_COLORS.DEFAULT;
    }
    return FIBER_TYPE_COLORS[route.type] || FIBER_TYPE_COLORS.DEFAULT;
  }, [fiberColorMode]);

  const fiberRoutesGeoJSON = useMemo<GeoJSON.FeatureCollection>(() => {
    const features: GeoJSON.Feature[] = [];
    fiberRoutes.forEach((route) => {
      const cleaned: [number, number][] = [];
      for (const [lon, lat] of route.coordinates) {
        if (!isFinite(lon) || !isFinite(lat)) continue;
        cleaned.push([lon, lat]);
      }
      if (cleaned.length < 2) return;
      features.push({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: cleaned },
        properties: {
          routeId: route.id,
          routeName: route.routeName,
          color: getRouteColor(route),
        },
      });
    });
    return { type: 'FeatureCollection', features };
  }, [fiberRoutes, getRouteColor]);

  const fiberSitesGeoJSON = useMemo<GeoJSON.FeatureCollection>(() => {
    const features: GeoJSON.Feature[] = fiberSites
      .filter((s) => isFinite(s.latitude) && isFinite(s.longitude))
      .map((s) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [s.longitude, s.latitude] },
        properties: {
          id: s.id,
          name: s.name || s.nodeName,
          color: getTechnologyColor(s.technology),
        },
      }));
    return { type: 'FeatureCollection', features };
  }, [fiberSites]);

  // ----- Add / update sources & layers -----
  // setStyle() (basemap switch) wipes all sources, layers and listeners — so
  // we must check existence per-layer and re-add when missing.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady) return;

    const CABLE_SRC = 'overseas-cables';
    const LAND_SRC = 'overseas-landings';

    // CABLES ---------------------------------------------------------------
    if (!map.getSource(CABLE_SRC)) {
      map.addSource(CABLE_SRC, { type: 'geojson', data: cablesGeoJSON });
    } else {
      (map.getSource(CABLE_SRC) as GeoJSONSource).setData(cablesGeoJSON);
    }
    if (!map.getLayer('overseas-cables-glow')) {
      map.addLayer({
        id: 'overseas-cables-glow',
        type: 'line',
        source: CABLE_SRC,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': [
            'case',
            ['==', ['get', 'segmentId'], ['literal', highlightedSegment ?? '']],
            8, 4,
          ],
          'line-opacity': 0.25,
          'line-blur': 2,
        },
      });
    }
    if (!map.getLayer('overseas-cables-line')) {
      map.addLayer({
        id: 'overseas-cables-line',
        type: 'line',
        source: CABLE_SRC,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': [
            'case',
            ['==', ['get', 'segmentId'], ['literal', highlightedSegment ?? '']],
            '#ffffff',
            ['get', 'color'],
          ],
          'line-width': [
            'case',
            ['==', ['get', 'segmentId'], ['literal', highlightedSegment ?? '']],
            3, 1.8,
          ],
          'line-opacity': 0.95,
        },
      });
      map.on('mouseenter', 'overseas-cables-line', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'overseas-cables-line', () => {
        map.getCanvas().style.cursor = '';
      });
      map.on('click', 'overseas-cables-line', (e: MapMouseEvent & any) => {
        const f = e.features?.[0];
        if (!f) return;
        const segId = f.properties?.segmentId as string;
        setHighlightedSegment((cur) => (cur === segId ? null : segId));
        new maplibregl.Popup({ closeButton: false, offset: 8 })
          .setLngLat(e.lngLat)
          .setHTML(
            `<div style="font:11px sans-serif;color:#111;">
              <div style="font-weight:600">${f.properties?.segmentName ?? ''}</div>
              <div style="opacity:0.7">${f.properties?.cableName ?? ''}</div>
              <div style="opacity:0.7">${(f.properties?.lengthKm ?? 0).toFixed(0)} km</div>
            </div>`
          )
          .addTo(map);
      });
    }

    // LANDINGS -------------------------------------------------------------
    if (!map.getSource(LAND_SRC)) {
      map.addSource(LAND_SRC, { type: 'geojson', data: landingsGeoJSON });
    } else {
      (map.getSource(LAND_SRC) as GeoJSONSource).setData(landingsGeoJSON);
    }
    if (!map.getLayer('overseas-landings-circle')) {
      map.addLayer({
        id: 'overseas-landings-circle',
        type: 'circle',
        source: LAND_SRC,
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['zoom'],
            1, 1.2, 4, 2, 8, 3.2,
          ],
          'circle-color': ['get', 'color'],
          'circle-stroke-width': 0,
          'circle-opacity': 1,
        },
      });
      map.on('mouseenter', 'overseas-landings-circle', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'overseas-landings-circle', () => {
        map.getCanvas().style.cursor = '';
      });
      map.on('click', 'overseas-landings-circle', (e: MapMouseEvent & any) => {
        const f = e.features?.[0];
        if (!f) return;
        new maplibregl.Popup({ closeButton: false, offset: 6 })
          .setLngLat(e.lngLat)
          .setHTML(
            `<div style="font:11px sans-serif;color:#111;">
              <div style="font-weight:600">${f.properties?.name ?? ''}</div>
              <div style="opacity:0.7">${f.properties?.cableId ?? ''} landing</div>
            </div>`
          )
          .addTo(map);
      });
    }

    // FIBER ROUTES ---------------------------------------------------------
    const FIBER_ROUTE_SRC = 'overseas-fiber-routes';
    const FIBER_SITE_SRC = 'overseas-fiber-sites';
    if (!map.getSource(FIBER_ROUTE_SRC)) {
      map.addSource(FIBER_ROUTE_SRC, { type: 'geojson', data: fiberRoutesGeoJSON });
    } else {
      (map.getSource(FIBER_ROUTE_SRC) as GeoJSONSource).setData(fiberRoutesGeoJSON);
    }
    if (!map.getLayer('overseas-fiber-routes-casing')) {
      map.addLayer({
        id: 'overseas-fiber-routes-casing',
        type: 'line',
        source: FIBER_ROUTE_SRC,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#000000', 'line-width': 3.5, 'line-opacity': 0.4, 'line-blur': 0.5 },
      });
    }
    if (!map.getLayer('overseas-fiber-routes-line')) {
      map.addLayer({
        id: 'overseas-fiber-routes-line',
        type: 'line',
        source: FIBER_ROUTE_SRC,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': ['get', 'color'], 'line-width': 2, 'line-opacity': 1 },
      });
    }

    // FIBER SITES ----------------------------------------------------------
    if (!map.getSource(FIBER_SITE_SRC)) {
      map.addSource(FIBER_SITE_SRC, { type: 'geojson', data: fiberSitesGeoJSON });
    } else {
      (map.getSource(FIBER_SITE_SRC) as GeoJSONSource).setData(fiberSitesGeoJSON);
    }
    if (!map.getLayer('overseas-fiber-sites-circle')) {
      map.addLayer({
        id: 'overseas-fiber-sites-circle',
        type: 'circle',
        source: FIBER_SITE_SRC,
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 1.2, 5, 1.8, 10, 2.8, 14, 4],
          'circle-color': ['get', 'color'],
          'circle-stroke-width': 0,
          'circle-opacity': 1,
        },
      });
    }

    // Keep overlays above the basemap raster after style switches.
    try {
      if (map.getLayer('overseas-fiber-routes-casing')) map.moveLayer('overseas-fiber-routes-casing');
      if (map.getLayer('overseas-fiber-routes-line')) map.moveLayer('overseas-fiber-routes-line');
      if (map.getLayer('overseas-fiber-sites-circle')) map.moveLayer('overseas-fiber-sites-circle');
      if (map.getLayer('overseas-cables-glow')) map.moveLayer('overseas-cables-glow');
      if (map.getLayer('overseas-cables-line')) map.moveLayer('overseas-cables-line');
      if (map.getLayer('overseas-landings-circle')) map.moveLayer('overseas-landings-circle');
    } catch { /* noop */ }
  }, [styleReady, styleRevision, cablesGeoJSON, landingsGeoJSON, fiberRoutesGeoJSON, fiberSitesGeoJSON, mapRef, highlightedSegment]);

  // ----- Update highlight without re-adding layer -----
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady) return;
    if (map.getLayer('overseas-cables-line')) {
      map.setPaintProperty('overseas-cables-line', 'line-color', [
        'case',
        ['==', ['get', 'segmentId'], ['literal', highlightedSegment ?? '']],
        '#ffffff',
        ['get', 'color'],
      ]);
      map.setPaintProperty('overseas-cables-line', 'line-width', [
        'case',
        ['==', ['get', 'segmentId'], ['literal', highlightedSegment ?? '']],
        3, 1.8,
      ]);
    }
    if (map.getLayer('overseas-cables-glow')) {
      map.setPaintProperty('overseas-cables-glow', 'line-width', [
        'case',
        ['==', ['get', 'segmentId'], ['literal', highlightedSegment ?? '']],
        8, 4,
      ]);
    }
  }, [highlightedSegment, styleReady, mapRef]);

  // ----- Toggle landing visibility -----
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady || !map.getLayer('overseas-landings-circle')) return;
    map.setLayoutProperty(
      'overseas-landings-circle', 'visibility',
      showLandings ? 'visible' : 'none'
    );
  }, [showLandings, styleReady, mapRef]);

  // ----- Toggle fiber visibility -----
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady) return;
    const vis = showFiber ? 'visible' : 'none';
    ['overseas-fiber-routes-casing', 'overseas-fiber-routes-line', 'overseas-fiber-sites-circle'].forEach((id) => {
      if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', vis);
    });
  }, [showFiber, styleReady, mapRef]);

  // ----- Camera actions -----
  const fitToCables = useCallback(() => {
    const map = mapRef.current;
    if (!map || visibleCables.length === 0) return;
    let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
    visibleCables.forEach((cable) => {
      cable.segments.forEach((seg) => {
        seg.coordinates.forEach(([lon, lat]) => {
          if (!isFinite(lon) || !isFinite(lat)) return;
          if (lon < minLon) minLon = lon;
          if (lon > maxLon) maxLon = lon;
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
        });
      });
    });
    if (!isFinite(minLon)) return;
    map.fitBounds([[minLon, minLat], [maxLon, maxLat]], { padding: 80, duration: 1400 });
  }, [visibleCables, mapRef]);

  const resetView = useCallback(() => {
    mapRef.current?.flyTo({ center: WORLD_CENTER, zoom: WORLD_ZOOM, duration: 1200 });
  }, [mapRef]);

  // Auto-fit once cables are first loaded
  useEffect(() => {
    if (!styleReady) return;
    const t = setTimeout(() => fitToCables(), 350);
    return () => clearTimeout(t);
  }, [styleReady, fitToCables]);

  return (
    <div ref={wrapperRef} className="absolute inset-0 z-[600] bg-background">
      {starfield && <StarField />}

      <div ref={containerRef} className="absolute inset-0" />

      {/* Top toolbar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-start justify-between gap-3 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/90 backdrop-blur-sm shadow-lg border border-border">
          <Globe2 className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">3D Globe — Submarine Cables</span>
          <span className="text-[11px] text-muted-foreground tabular-nums">
            · {visibleCables.length} cables · {cablesGeoJSON.features.length} segments
          </span>
        </div>

        <div className="pointer-events-auto flex items-center gap-2 flex-wrap justify-end">
          <GlobeControls
            basemap={basemap}
            onBasemapChange={setBasemap}
            autoRotate={autoRotate}
            onAutoRotateChange={setAutoRotate}
            projection={projection}
            onProjectionChange={setProjection}
            onScreenshot={screenshot}
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
            background={background}
            onBackgroundChange={setBackground}
          />

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/90 backdrop-blur-sm shadow-lg border border-border">
            <MapPin
              className={`h-3.5 w-3.5 ${showLandings ? 'text-amber-500' : 'text-muted-foreground'}`}
            />
            <Label htmlFor="ovs-landings" className="text-xs cursor-pointer">Landings</Label>
            <Switch id="ovs-landings" checked={showLandings} onCheckedChange={setShowLandings} />
          </div>

          {(fiberRoutes.length > 0 || fiberSites.length > 0) && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/90 backdrop-blur-sm shadow-lg border border-border">
              <Cable
                className={`h-3.5 w-3.5 ${showFiber ? 'text-emerald-500' : 'text-muted-foreground'}`}
              />
              <Label htmlFor="ovs-fiber" className="text-xs cursor-pointer">Fiber</Label>
              <Switch id="ovs-fiber" checked={showFiber} onCheckedChange={setShowFiber} />
            </div>
          )}

          <Button
            size="sm"
            variant="outline"
            className="h-9 gap-1.5 bg-background/90 backdrop-blur-sm shadow-lg"
            onClick={resetView}
          >
            <Globe2 className="h-3.5 w-3.5" />
            <span className="text-xs">Reset</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="h-9 gap-1.5 bg-background/90 backdrop-blur-sm shadow-lg"
            onClick={fitToCables}
            disabled={visibleCables.length === 0}
          >
            <Maximize2 className="h-3.5 w-3.5" />
            <span className="text-xs">Fit cables</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="h-9 gap-1.5 bg-background/90 backdrop-blur-sm shadow-lg"
            onClick={onClose}
          >
            <X className="h-3.5 w-3.5" />
            <span className="text-xs">Exit globe</span>
          </Button>
        </div>
      </div>

      {/* Coordinate search — top-left, under title */}
      <div className="absolute top-16 left-3 z-10 pointer-events-auto">
        <CoordinateSearchPanel mapRef={mapRef} styleReady={styleReady} styleRevision={styleRevision} />
      </div>

      {/* Cable legend bottom-left */}
      <div className="absolute bottom-8 left-3 z-10 flex flex-col gap-1 px-3 py-2 rounded-lg bg-background/90 backdrop-blur-sm shadow-lg border border-border min-w-[180px]">
        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">
          Cables
        </div>
        {visibleCables.map((c) => (
          <div key={c.id} className="flex items-center gap-2 text-[11px]">
            <span
              className="inline-block h-2.5 w-4 rounded-sm"
              style={{ background: c.color }}
            />
            <span className="font-medium">{c.id}</span>
            <span className="text-muted-foreground tabular-nums ml-auto">
              {c.totalLengthKm.toLocaleString(undefined, { maximumFractionDigits: 0 })} km
            </span>
          </div>
        ))}
        {highlightedSegment && (
          <div className="text-[10px] text-muted-foreground mt-1 pt-1 border-t border-border">
            Click highlighted segment again to deselect
          </div>
        )}
      </div>
    </div>
  );
}
