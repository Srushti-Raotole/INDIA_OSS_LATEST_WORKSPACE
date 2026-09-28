
// // ============================================
// // Tile Layer Controller Component
// // ============================================

// import { useEffect, useRef } from 'react';
// import { useMap } from 'react-leaflet';
// import L from 'leaflet';
// import { MapViewMode } from '../../types';
// import { MAP_TILES } from '../../constants';

// interface TileLayerControllerProps {
//   viewMode: MapViewMode;
// }

// /**
//  * Component that handles tile layer changes without re-mounting the map
//  * Uses Leaflet's native layer management for smooth transitions
//  */
// export function TileLayerController({ viewMode }: TileLayerControllerProps) {
//   const map = useMap();
//   const tileLayerRef = useRef<L.TileLayer | null>(null);

//   useEffect(() => {
//     const config = MAP_TILES[viewMode];
    
//     // Remove existing tile layer
//     if (tileLayerRef.current) {
//       map.removeLayer(tileLayerRef.current);
//     }
    
//     // Add new tile layer
//     tileLayerRef.current = L.tileLayer(config.url, {
//       attribution: config.attribution,
//       maxZoom: config.maxZoom,
//     }).addTo(map);

//     return () => {
//       if (tileLayerRef.current) {
//         map.removeLayer(tileLayerRef.current);
//       }
//     };
//   }, [viewMode, map]);

//   return null;
// }
// ============================================
// Tile Layer Controller Component
// ============================================
// Manages dynamic basemap switching on the Leaflet map.
// Supports both raster tile layers and MapLibre vector styles
// (OpenFreeMap - free forever, no API key).

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'maplibre-gl/dist/maplibre-gl.css';
import '@maplibre/maplibre-gl-leaflet';
import { MapViewMode } from '../../types';
import { MAP_TILES, LABEL_FREE_VIEWS } from '../../constants';

interface TileLayerControllerProps {
  viewMode: MapViewMode;
}

export function TileLayerController({ viewMode }: TileLayerControllerProps) {
  const map = useMap();
  const layerRef = useRef<L.Layer | null>(null);

  useEffect(() => {
    const config = MAP_TILES[viewMode];

    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }

    const maplibreGL = (L as unknown as { maplibreGL?: (opts: unknown) => L.Layer }).maplibreGL;

    if (config.vectorStyle && typeof maplibreGL === 'function') {
      const hideLabels = LABEL_FREE_VIEWS.includes(viewMode);
      const layer = maplibreGL({
        style: config.vectorStyle,
        attribution: config.attribution,
      }) as L.Layer & { getMaplibreMap?: () => any };

      layer.addTo(map);
      layerRef.current = layer;

      if (hideLabels) {
        const gl = layer.getMaplibreMap?.();
        const strip = () => {
          try {
            gl.getStyle()?.layers?.forEach((l: any) => {
              if (l.type === 'symbol') gl.setLayoutProperty(l.id, 'visibility', 'none');
            });
          } catch {
            /* style not ready */
          }
        };
        if (gl?.isStyleLoaded?.()) strip();
        gl?.on?.('styledata', strip);
      }
    } else {
      const layer = L.tileLayer(config.url, {
        attribution: config.attribution,
        maxZoom: config.maxZoom,
      });
      layer.addTo(map);
      layerRef.current = layer;
    }

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [viewMode, map]);

  return null;
}
