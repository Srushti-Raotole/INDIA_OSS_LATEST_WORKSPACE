

import { useState, useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { createRoot } from 'react-dom/client';
import { ZoomIn } from 'lucide-react';


function getZoomDescription(zoom: number): string {
  if (zoom <= 5) return 'Country view';
  if (zoom <= 7) return 'Region view';
  if (zoom <= 8) return 'Link labels';
  if (zoom <= 10) return 'Detailed links';
  if (zoom <= 12) return 'Device labels';
  return 'Street level';
}

// ============================================
// Component
// ============================================

/**
 * Displays current zoom level with description
 * Must be used INSIDE MapContainer
 * Uses Leaflet Control for proper map positioning
 * 
 * LIBRARY: react-leaflet useMap for zoom tracking
 * Reference: https://react-leaflet.js.org/docs/api-map/#usemap
 */
export function ZoomLevelDisplay() {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  const containerRef = useRef<HTMLDivElement | null>(null);
  const controlRef = useRef<L.Control | null>(null);

  // Track zoom changes
  useEffect(() => {
    const handleZoomEnd = () => {
      setZoom(map.getZoom());
    };

    map.on('zoomend', handleZoomEnd);
    return () => {
      map.off('zoomend', handleZoomEnd);
    };
  }, [map]);

  // Create Leaflet control
  useEffect(() => {
    // Create custom control
    const ZoomControl = L.Control.extend({
      options: {
        position: 'bottomright' as L.ControlPosition,
      },
      onAdd: function() {
        const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        containerRef.current = container;
        
        // Prevent map interactions on the control
        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.disableScrollPropagation(container);
        
        return container;
      },
      onRemove: function() {
        containerRef.current = null;
      },
    });

    const control = new ZoomControl();
    control.addTo(map);
    controlRef.current = control;

    return () => {
      if (controlRef.current) {
        map.removeControl(controlRef.current);
      }
    };
  }, [map]);

  // Update control content when zoom changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.innerHTML = `
        <div class="bg-background/95 backdrop-blur-sm rounded-lg shadow-lg border border-border px-2 py-1.5 flex items-center gap-2 text-xs" style="display: flex; align-items: center; gap: 8px; padding: 6px 8px; background: rgba(255,255,255,0.95); border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); border: 1px solid rgba(0,0,0,0.1);">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.6;"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M11 8v6"/><path d="M8 11h6"/></svg>
          <span style="font-weight: 600; font-size: 12px;">${Math.round(zoom)}</span>
          <span style="opacity: 0.6; font-size: 11px;">· ${getZoomDescription(zoom)}</span>
        </div>
      `;
    }
  }, [zoom]);

  return null;
}

// Also export ZoomLevelIndicator for backward compatibility
export const ZoomLevelIndicator = ZoomLevelDisplay;
