
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import maplibregl, { Map as MLMap, MapMouseEvent, GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Button } from '../../../components/ui/button';
import { Switch } from '../../../components/ui/switch';
import { Label } from '../../../components/ui/label';
import { X, Maximize2, Globe2, MapPin } from 'lucide-react';
import type { FiberRoute, FiberSite } from '../types/fiberTypes';
import { getTechnologyColor, TECHNOLOGY_COLORS_HEX } from '../utils/technologyColors';
import { useGlobeMap } from './useGlobeMap';
import { GlobeControls } from './GlobeControls';
import { StarField } from './StarField';
import { FiberRouteDetailsSidebar } from '../components/sidebar/FiberRouteDetailsSidebar';
import { FiberSiteDetailsSidebar } from '../components/sidebar/FiberSiteDetailsSidebar';
import { CoordinateSearchPanel } from './CoordinateSearchPanel';

// India default camera
const INDIA_CENTER: [number, number] = [80, 22.5]; // [lng, lat]
const INDIA_ZOOM = 3.4;

// Color palettes (kept in sync with FiberRoutesLayer)
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

interface FiberGlobeProps {
  routes: FiberRoute[];
  sites: FiberSite[];
  colorMode?: 'type' | 'methodology';
  onClose: () => void;
}

export function FiberGlobe({
  routes,
  sites,
  colorMode = 'type',
  onClose,
}: FiberGlobeProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showSites, setShowSites] = useState(true);
  const [highlightedRoute, setHighlightedRoute] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<FiberRoute | null>(null);
  const [selectedSite, setSelectedSite] = useState<FiberSite | null>(null);

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
    initialCenter: INDIA_CENTER,
    initialZoom: INDIA_ZOOM,
    initialBasemap: 'satellite',
  });

  // ----- Resolve color for a route based on the active mode -----
  const getRouteColor = useCallback(
    (route: FiberRoute): string => {
      if (colorMode === 'methodology') {
        return METHODOLOGY_COLORS[route.methodology] || METHODOLOGY_COLORS.DEFAULT;
      }
      return FIBER_TYPE_COLORS[route.type] || FIBER_TYPE_COLORS.DEFAULT;
    },
    [colorMode]
  );

  // ----- Build GeoJSON for routes & sites -----
  const routesGeoJSON = useMemo<GeoJSON.FeatureCollection>(() => {
    const features: GeoJSON.Feature[] = [];
    routes.forEach((route) => {
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
          type: route.type,
          methodology: route.methodology,
          color: getRouteColor(route),
        },
      });
    });
    return { type: 'FeatureCollection', features };
  }, [routes, getRouteColor]);

  const sitesGeoJSON = useMemo<GeoJSON.FeatureCollection>(() => {
    const features: GeoJSON.Feature[] = sites
      .filter((s) => isFinite(s.latitude) && isFinite(s.longitude))
      .map((s) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [s.longitude, s.latitude] },
        properties: {
          id: s.id,
          name: s.name || s.nodeName,
          technology: s.technology,
          color: getTechnologyColor(s.technology),
        },
      }));
    return { type: 'FeatureCollection', features };
  }, [sites]);

  // Lookup maps so click handlers can resolve the original objects (sidebars
  // need the full FiberRoute / FiberSite, not just the GeoJSON properties).
  const routeById = useMemo(() => {
    const m = new Map<string, FiberRoute>();
    routes.forEach((r) => m.set(r.id, r));
    return m;
  }, [routes]);
  const siteById = useMemo(() => {
    const m = new Map<string, FiberSite>();
    sites.forEach((s) => m.set(s.id, s));
    return m;
  }, [sites]);

  // ----- Add / update sources & layers when style is ready or data changes -----
  // IMPORTANT: when basemap changes, MapLibre's setStyle() wipes all sources,
  // layers AND event listeners. We therefore re-attach handlers every time the
  // style reloads. Use refs to hold the LATEST callbacks so handlers stay in
  // sync without needing to be re-registered on every data change.
  const routeByIdRef = useRef(routeById);
  const siteByIdRef = useRef(siteById);
  useEffect(() => { routeByIdRef.current = routeById; }, [routeById]);
  useEffect(() => { siteByIdRef.current = siteById; }, [siteById]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady) return;

    const ROUTE_SRC = 'fiber-routes';
    const SITE_SRC = 'fiber-sites';

    // ROUTES ---------------------------------------------------------------
    if (!map.getSource(ROUTE_SRC)) {
      map.addSource(ROUTE_SRC, { type: 'geojson', data: routesGeoJSON });
    } else {
      (map.getSource(ROUTE_SRC) as GeoJSONSource).setData(routesGeoJSON);
    }
    // Add a darker casing UNDER the colored line so it stays visible against
    // bright satellite imagery (and any other busy basemap).
    if (!map.getLayer('fiber-routes-casing')) {
      map.addLayer({
        id: 'fiber-routes-casing',
        type: 'line',
        source: ROUTE_SRC,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#000000',
          'line-width': [
            'case',
            ['==', ['get', 'routeId'], ['literal', highlightedRoute ?? '']],
            7,
            4,
          ],
          'line-opacity': 0.45,
          'line-blur': 0.5,
        },
      });
    }
    if (!map.getLayer('fiber-routes-line')) {
      map.addLayer({
        id: 'fiber-routes-line',
        type: 'line',
        source: ROUTE_SRC,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': [
            'case',
            ['==', ['get', 'routeId'], ['literal', highlightedRoute ?? '']],
            5,
            2.5,
          ],
          'line-opacity': 1,
        },
      });
      map.on('mouseenter', 'fiber-routes-line', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'fiber-routes-line', () => {
        map.getCanvas().style.cursor = '';
      });
      map.on('click', 'fiber-routes-line', (e: MapMouseEvent & any) => {
        const f = e.features?.[0];
        if (!f) return;
        const id = f.properties?.routeId as string;
        setHighlightedRoute(id);
        const route = routeByIdRef.current.get(id);
        if (route) {
          setSelectedRoute(route);
          setSelectedSite(null);
        }
      });
    }

    // SITES ----------------------------------------------------------------
    if (!map.getSource(SITE_SRC)) {
      map.addSource(SITE_SRC, { type: 'geojson', data: sitesGeoJSON });
    } else {
      (map.getSource(SITE_SRC) as GeoJSONSource).setData(sitesGeoJSON);
    }
    if (!map.getLayer('fiber-sites-circle')) {
      map.addLayer({
        id: 'fiber-sites-circle',
        type: 'circle',
        source: SITE_SRC,
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['zoom'],
            2, 1.2, 5, 1.8, 10, 2.8, 14, 4,
          ],
          'circle-color': ['get', 'color'],
          'circle-stroke-width': 0,
          'circle-opacity': 1,
        },
      });
      map.on('mouseenter', 'fiber-sites-circle', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'fiber-sites-circle', () => {
        map.getCanvas().style.cursor = '';
      });
      map.on('click', 'fiber-sites-circle', (e: MapMouseEvent & any) => {
        const f = e.features?.[0];
        if (!f) return;
        const id = f.properties?.id as string;
        const site = siteByIdRef.current.get(id);
        if (site) {
          setSelectedSite(site);
          setSelectedRoute(null);
        }
      });
    }
    if (!map.getLayer('fiber-sites-label')) {
      try {
        map.addLayer({
          id: 'fiber-sites-label',
          type: 'symbol',
          source: SITE_SRC,
          minzoom: 10,
          layout: {
            'text-field': ['get', 'name'],
            'text-size': 11,
            'text-offset': [0, 1.2],
            'text-anchor': 'top',
            'text-allow-overlap': false,
            'text-optional': true,
            'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
          },
          paint: {
            'text-color': '#0f172a',
            'text-halo-color': '#ffffff',
            'text-halo-width': 1.5,
            'text-opacity': [
              'interpolate', ['linear'], ['zoom'],
              10, 0, 11, 1,
            ],
          },
        });
      } catch {
        /* style has no glyphs source — labels will simply be skipped */
      }
    }

    // Ensure our overlay layers render ABOVE basemap raster tiles. After a
    // style switch (e.g. Voyager → Satellite) the layer order can change,
    // so move them to the top on every (re)attach.
    try {
      if (map.getLayer('fiber-routes-casing')) map.moveLayer('fiber-routes-casing');
      if (map.getLayer('fiber-routes-line')) map.moveLayer('fiber-routes-line');
      if (map.getLayer('fiber-sites-circle')) map.moveLayer('fiber-sites-circle');
      if (map.getLayer('fiber-sites-label')) map.moveLayer('fiber-sites-label');
    } catch { /* noop */ }
  }, [styleReady, styleRevision, routesGeoJSON, sitesGeoJSON, mapRef, highlightedRoute]);

  // ----- 3D extruded buildings (vector basemaps only) -----
  // Adds OpenMapTiles "building" layer extruded by 'render_height' when the
  // active style provides the openmaptiles vector source. Visible from zoom 14+.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady) return;
    const LAYER_ID = 'fiber-3d-buildings';
    if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID);

    // Only some styles expose 'openmaptiles' — guard so raster styles don't crash.
    const hasOpenMapTiles = !!map.getSource('openmaptiles');
    if (!hasOpenMapTiles) return;

    try {
      map.addLayer({
        id: LAYER_ID,
        type: 'fill-extrusion',
        source: 'openmaptiles',
        'source-layer': 'building',
        minzoom: 14,
        paint: {
          'fill-extrusion-color': '#aab6c5',
          'fill-extrusion-height': [
            'interpolate', ['linear'], ['zoom'],
            14, 0,
            15.5, ['coalesce', ['get', 'render_height'], 10],
          ],
          'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
          'fill-extrusion-opacity': 0.75,
        },
      });
    } catch {
      /* style does not support extrusions — silently ignore */
    }
  }, [styleReady, basemap, mapRef]);

  // ----- Update highlight without re-adding layer -----
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady) return;
    if (map.getLayer('fiber-routes-line')) {
      map.setPaintProperty('fiber-routes-line', 'line-width', [
        'case',
        ['==', ['get', 'routeId'], ['literal', highlightedRoute ?? '']],
        5,
        2.5,
      ]);
    }
    if (map.getLayer('fiber-routes-casing')) {
      map.setPaintProperty('fiber-routes-casing', 'line-width', [
        'case',
        ['==', ['get', 'routeId'], ['literal', highlightedRoute ?? '']],
        7,
        4,
      ]);
    }
  }, [highlightedRoute, styleReady, mapRef]);

  // ----- Toggle site visibility -----
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady || !map.getLayer('fiber-sites-circle')) return;
    map.setLayoutProperty(
      'fiber-sites-circle', 'visibility',
      showSites ? 'visible' : 'none'
    );
  }, [showSites, styleReady, mapRef]);

  // ----- Camera actions -----
  const centerOnIndia = useCallback(() => {
    mapRef.current?.flyTo({ center: INDIA_CENTER, zoom: INDIA_ZOOM, duration: 1200 });
  }, [mapRef]);

  const fitToRoutes = useCallback(() => {
    const map = mapRef.current;
    if (!map || routes.length === 0) return;
    let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
    routes.forEach((route) => {
      route.coordinates.forEach(([lon, lat]) => {
        if (!isFinite(lon) || !isFinite(lat)) return;
        if (lon < minLon) minLon = lon;
        if (lon > maxLon) maxLon = lon;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
      });
    });
    if (!isFinite(minLon)) return;
    map.fitBounds([[minLon, minLat], [maxLon, maxLat]], { padding: 60, duration: 1400 });
  }, [routes, mapRef]);

  // ----- Legend -----
  const legendEntries = useMemo(() => {
    if (colorMode === 'methodology') {
      return [
        { label: 'OPGW', color: METHODOLOGY_COLORS.OPGW },
        { label: 'UG', color: METHODOLOGY_COLORS.UG },
        { label: 'AERIAL', color: METHODOLOGY_COLORS.AERIAL },
        { label: 'UTILITY', color: METHODOLOGY_COLORS.UTILITY },
      ];
    }
    return [
      { label: 'NLD', color: FIBER_TYPE_COLORS.NLD },
      { label: 'METRO', color: FIBER_TYPE_COLORS.METRO },
    ];
  }, [colorMode]);

  return (
    <div ref={wrapperRef} className="absolute inset-0 z-[600] bg-background">
      {/* Star background sits BEHIND the map (visible through transparent areas in night style) */}
      {starfield && <StarField />}

      <div ref={containerRef} className="absolute inset-0" />

      {/* Top toolbar */}
      <div className="absolute top-3 left-3 right-3 z-10 flex items-start justify-between gap-3 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/90 backdrop-blur-sm shadow-lg border border-border">
          <Globe2 className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">3D Globe — Fiber Network (India)</span>
          <span className="text-[11px] text-muted-foreground tabular-nums">
            · {routes.length} routes · {sites.length} sites
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
              className={`h-3.5 w-3.5 ${showSites ? 'text-amber-500' : 'text-muted-foreground'}`}
            />
            <Label htmlFor="fiber-sites" className="text-xs cursor-pointer">Sites</Label>
            <Switch id="fiber-sites" checked={showSites} onCheckedChange={setShowSites} />
          </div>

          <Button
            size="sm"
            variant="outline"
            className="h-9 gap-1.5 bg-background/90 backdrop-blur-sm shadow-lg"
            onClick={centerOnIndia}
          >
            <Globe2 className="h-3.5 w-3.5" />
            <span className="text-xs">India</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="h-9 gap-1.5 bg-background/90 backdrop-blur-sm shadow-lg"
            onClick={fitToRoutes}
            disabled={routes.length === 0}
          >
            <Maximize2 className="h-3.5 w-3.5" />
            <span className="text-xs">Fit routes</span>
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

      {/* Coordinate search — top-left, under the title chip */}
      <div className="absolute top-16 left-3 z-10 pointer-events-auto">
        <CoordinateSearchPanel mapRef={mapRef} styleReady={styleReady} styleRevision={styleRevision} />
      </div>

      {/* Legend bottom-left */}
      <div className="absolute bottom-8 left-3 z-10 flex flex-col gap-1 px-3 py-2 rounded-lg bg-background/90 backdrop-blur-sm shadow-lg border border-border min-w-[150px]">
        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">
          {colorMode === 'methodology' ? 'Methodology' : 'Route Type'}
        </div>
        {legendEntries.map((e) => (
          <div key={e.label} className="flex items-center gap-2 text-[11px]">
            <span
              className="inline-block h-2.5 w-4 rounded-sm"
              style={{ background: e.color }}
            />
            <span className="font-medium">{e.label}</span>
          </div>
        ))}
        {showSites && (
          <div className="mt-1 pt-1 border-t border-border flex flex-col gap-1">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
              Site Technology
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: TECHNOLOGY_COLORS_HEX.CIENA }}
              />
              <span className="font-medium">CIENA</span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: TECHNOLOGY_COLORS_HEX.NOKIA }}
              />
              <span className="font-medium">NOKIA</span>
            </div>
          </div>
        )}
        {highlightedRoute && (
          <div className="text-[10px] text-muted-foreground mt-1 pt-1 border-t border-border">
            Click highlighted route again to deselect
          </div>
        )}
      </div>

      {/* Click sidebars — portaled into wrapper so they sit above the globe and
          remain visible inside fullscreen. */}
      <FiberRouteDetailsSidebar
        route={selectedRoute}
        open={!!selectedRoute}
        onClose={() => { setSelectedRoute(null); setHighlightedRoute(null); }}
        container={wrapperRef.current}
      />
      <FiberSiteDetailsSidebar
        site={selectedSite}
        open={!!selectedSite}
        onClose={() => setSelectedSite(null)}
        container={wrapperRef.current}
      />
    </div>
  );
}
