

import { useState, useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

/**
 * Get description of what's visible at current zoom level
 */
function getZoomDescription(zoom: number): string {
  if (zoom <= 5) return 'Country';
  if (zoom <= 7) return 'Region';
  if (zoom <= 8) return 'Links';
  if (zoom <= 10) return 'Detailed';
  if (zoom <= 12) return 'Device';
  return 'Street';
}

/**
 * Custom zoom control with +/- buttons and zoom level display
 * Renders at bottom-right of the map as a Leaflet Control
 */
export function MapZoomControl() {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());
  const containerRef = useRef<HTMLDivElement | null>(null);
  const controlRef = useRef<L.Control | null>(null);

  // Track zoom changes
  useEffect(() => {
    const handleZoomEnd = () => setZoom(map.getZoom());
    map.on('zoomend', handleZoomEnd);
    return () => { map.off('zoomend', handleZoomEnd); };
  }, [map]);

  // Create Leaflet control
  useEffect(() => {
    const ZoomCtrl = L.Control.extend({
      options: { position: 'bottomright' as L.ControlPosition },
      onAdd: function () {
        const container = L.DomUtil.create('div', 'custom-zoom-control');
        containerRef.current = container;
        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.disableScrollPropagation(container);
        return container;
      },
      onRemove: function () {
        containerRef.current = null;
      },
    });

    const control = new ZoomCtrl();
    control.addTo(map);
    controlRef.current = control;

    return () => {
      if (controlRef.current) map.removeControl(controlRef.current);
    };
  }, [map]);

  // Update control content
  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = `
      <div style="display:flex;align-items:center;gap:4px;">
        <div style="display:flex;align-items:center;gap:6px;padding:4px 10px;background:rgba(255,255,255,0.95);border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.12);border:1px solid rgba(0,0,0,0.08);backdrop-filter:blur(8px);">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.5;"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M11 8v6"/><path d="M8 11h6"/></svg>
          <span style="font-weight:700;font-size:12px;min-width:14px;text-align:center;">${Math.round(zoom)}</span>
          <span style="opacity:0.5;font-size:10px;white-space:nowrap;">· ${getZoomDescription(zoom)}</span>
        </div>
        <div style="display:flex;flex-direction:column;gap:2px;">
          <button id="zoom-in-btn" style="width:30px;height:28px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.95);border:1px solid rgba(0,0,0,0.08);border-radius:6px 6px 2px 2px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.12);font-size:16px;font-weight:600;color:#333;backdrop-filter:blur(8px);transition:background 0.15s;" onmouseover="this.style.background='rgba(240,240,240,0.98)'" onmouseout="this.style.background='rgba(255,255,255,0.95)'">+</button>
          <button id="zoom-out-btn" style="width:30px;height:28px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.95);border:1px solid rgba(0,0,0,0.08);border-radius:2px 2px 6px 6px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.12);font-size:16px;font-weight:600;color:#333;backdrop-filter:blur(8px);transition:background 0.15s;" onmouseover="this.style.background='rgba(240,240,240,0.98)'" onmouseout="this.style.background='rgba(255,255,255,0.95)'">−</button>
        </div>
      </div>
    `;

    const zoomInBtn = containerRef.current.querySelector('#zoom-in-btn');
    const zoomOutBtn = containerRef.current.querySelector('#zoom-out-btn');
    
    zoomInBtn?.addEventListener('click', () => map.zoomIn());
    zoomOutBtn?.addEventListener('click', () => map.zoomOut());
  }, [zoom, map]);

  return null;
}
