
import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl, { Map as MLMap } from 'maplibre-gl';
import { GLOBE_BASEMAPS, type BasemapKey } from './globeBasemaps';

function resolveStyle(style: string | object) {
  return typeof style === 'string' ? style : JSON.parse(JSON.stringify(style));
}

interface UseGlobeMapOptions {
  containerRef: React.RefObject<HTMLDivElement>;
  /** [lng, lat] */
  initialCenter: [number, number];
  initialZoom: number;
  initialBasemap?: BasemapKey;
  /** Called once after the FIRST style finishes loading */
  onReady?: (map: MLMap) => void;
  /** Called every time the style is (re)loaded - re-add your sources/layers */
  onStyleLoad?: (map: MLMap) => void;
}

export type GlobeBackground = 'auto' | 'light' | 'dark' | 'space';

const BG_COLORS: Record<GlobeBackground, string> = {
  auto: 'transparent',
  light: '#e8eef5',
  dark: '#0b1220',
  space: '#000010',
};

export function useGlobeMap({
  containerRef,
  initialCenter,
  initialZoom,
  initialBasemap = 'voyager',
  onReady,
  onStyleLoad,
}: UseGlobeMapOptions) {
  const mapRef = useRef<MLMap | null>(null);
  const rotateAnimRef = useRef<number | null>(null);
  const hasMountedBasemapEffectRef = useRef(false);
  const requestedBasemapRef = useRef<BasemapKey>(initialBasemap);

  const [styleReady, setStyleReady] = useState(false);
  const [styleRevision, setStyleRevision] = useState(0);
  const [basemap, setBasemap] = useState<BasemapKey>(initialBasemap);
  const [projection, setProjection] = useState<'globe' | 'mercator'>('globe');
  const [autoRotate, setAutoRotate] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [background, setBackground] = useState<GlobeBackground>('space');


  const projectionRef = useRef(projection);
  useEffect(() => { projectionRef.current = projection; }, [projection]);

  // ---- Init map (once) ----
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const def = GLOBE_BASEMAPS[initialBasemap];
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: resolveStyle(def.style as any),
      center: initialCenter,
      zoom: initialZoom,
      attributionControl: { compact: true },
      maxPitch: 85,
    });
    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');

    let firedReady = false;
    const handleStyleLoad = () => {
      // Re-apply current projection (state captured by closure via ref below)
      try { map.setProjection({ type: projectionRef.current }); } catch { /* mercator fallback */ }
      // Subtle atmospheric fog
      try {
        (map as any).setFog?.({
          range: [0.5, 10],
          color: '#a4cbe8',
          'high-color': '#23415c',
          'space-color': '#000010',
          'horizon-blend': 0.05,
          'star-intensity': 0.5,
        });
      } catch { /* not available on all styles */ }
      setStyleReady(true);
      setStyleRevision((v) => v + 1);
      onStyleLoad?.(map);
      if (!firedReady) {
        firedReady = true;
        onReady?.(map);
      }
    };
    map.on('style.load', handleStyleLoad);

    return () => {
      if (rotateAnimRef.current) cancelAnimationFrame(rotateAnimRef.current);
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Switch basemap ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    requestedBasemapRef.current = basemap;


    if (!hasMountedBasemapEffectRef.current) {
      hasMountedBasemapEffectRef.current = true;
      return;
    }

    const applyBasemap = () => {
      const next = requestedBasemapRef.current;
      const def = GLOBE_BASEMAPS[next];
      setStyleReady(false);
      map.setStyle(resolveStyle(def.style as any));
    };

    if (map.isStyleLoaded()) {
      applyBasemap();
      return;
    }

    map.once('style.load', () => {
      if (requestedBasemapRef.current !== basemap) return;
      applyBasemap();
    });
    // 'style.load' handler from init effect will re-fire and call onStyleLoad
  }, [basemap]);

  // ---- Switch projection ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady) return;
    try {
      map.setProjection({ type: projection });
    } catch { /* noop */ }
  }, [projection, styleReady]);

  // ---- Auto-rotate (continuous spin around globe) ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady) return;

    if (!autoRotate) {
      if (rotateAnimRef.current) {
        cancelAnimationFrame(rotateAnimRef.current);
        rotateAnimRef.current = null;
      }
      return;
    }

    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      // 4 deg/sec for a comfortable spin
      const center = map.getCenter();
      let lng = center.lng + 4 * dt;
      if (lng > 180) lng -= 360;
      map.jumpTo({ center: [lng, center.lat] });
      rotateAnimRef.current = requestAnimationFrame(tick);
    };
    rotateAnimRef.current = requestAnimationFrame(tick);

    // Stop rotation when user grabs the map
    const stop = () => setAutoRotate(false);
    map.on('mousedown', stop);
    map.on('touchstart', stop);
    map.on('wheel', stop);

    return () => {
      if (rotateAnimRef.current) cancelAnimationFrame(rotateAnimRef.current);
      rotateAnimRef.current = null;
      map.off('mousedown', stop);
      map.off('touchstart', stop);
      map.off('wheel', stop);
    };
  }, [autoRotate, styleReady]);

  // ---- Screenshot ----
  const screenshot = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    map.once('render', () => {
      const canvas = map.getCanvas();
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `globe-${Date.now()}.png`;
      a.click();
    });
    map.triggerRepaint();
  }, []);

  // ---- Fullscreen ----
  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current?.parentElement;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, [containerRef]);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // ---- Background color ----
  // Applied to the container so it shows through any transparent areas of the
  // basemap (e.g. when zoomed out beyond the globe edge or with vector themes).
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.style.background = BG_COLORS[background];
  }, [background, containerRef]);

  return {
    map: mapRef.current,
    mapRef,
    styleReady,
    styleRevision,
    basemap,
    setBasemap,
    projection,
    setProjection,
    autoRotate,
    setAutoRotate,
    isFullscreen,
    toggleFullscreen,
    screenshot,
    background,
    setBackground,
    /** True if the active basemap wants the star-field background */
    starfield:
      background === 'space' ||
      ((GLOBE_BASEMAPS[basemap] as { starfield?: boolean }).starfield ?? false),
  };
}
