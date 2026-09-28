
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Map as MLMap, GeoJSONSource } from 'maplibre-gl';
import maplibregl from 'maplibre-gl';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Search, X, MapPin, Trash2, ChevronUp, ChevronDown, Upload } from 'lucide-react';

// ----- Helpers ---------------------------------------------------------
interface ParsedPoint {
  lat: number;
  lng: number;
  label?: string;
}

interface ParseResult {
  points: ParsedPoint[];
  skipped: number;
}

function parseTuple(raw: string, assumeLngLat = false): ParsedPoint | null {
  const cleaned = raw
    .replace(/lat\s*[:=]\s*/gi, '')
    .replace(/lng\s*[:=]\s*/gi, '')
    .replace(/lon\s*[:=]\s*/gi, '')
    .replace(/[;|\t]/g, ',')
    .trim();
  if (!cleaned) return null;

  const nums = cleaned.match(/-?\d+(?:\.\d+)?/g);
  if (!nums || nums.length < 2) return null;
  const a = parseFloat(nums[0]);
  const b = parseFloat(nums[1]);
  if (!isFinite(a) || !isFinite(b)) return null;

  let lat: number, lng: number;
  if (assumeLngLat) {
    lng = a; lat = b;
  } else {
    const aIsLat = a >= -90 && a <= 90;
    const bIsLat = b >= -90 && b <= 90;
    if (aIsLat && b >= -180 && b <= 180 && !bIsLat) {
      lat = a; lng = b;
    } else if (bIsLat && a >= -180 && a <= 180 && !aIsLat) {
      lat = b; lng = a;
    } else if (aIsLat && bIsLat) {
      lat = a; lng = b;
    } else {
      return null;
    }
  }

  if (lng > 180) lng -= 360;
  if (lng < -180) lng += 360;
  if (lat < -90 || lat > 90) return null;

  return { lat, lng };
}


function extractKmlCoords(input: string): string | null {
  // Strip <coordinates> wrappers if pasted from a KML file
  const m = input.match(/<coordinates>([\s\S]*?)<\/coordinates>/i);
  const body = (m ? m[1] : input).trim();
  // Heuristic: contains many "n,n,n" tuples separated by whitespace
  const tuples = body.match(/-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?(?:,-?\d+(?:\.\d+)?)?/g);
  if (tuples && tuples.length >= 2) {
    // KML uses lng,lat,alt by spec — assume lng,lat order
    return tuples.join('\n');
  }
  return null;
}

function parseAll(input: string): ParseResult {
  const trimmed = input.trim();
  if (!trimmed) return { points: [], skipped: 0 };

  // 1) KML-style (lng,lat,alt space-separated, optionally wrapped in <coordinates>)
  const kmlBody = extractKmlCoords(trimmed);
  if (kmlBody) {
    const tuples = kmlBody.split(/\n/).map((s) => s.trim()).filter(Boolean);
    const pts: ParsedPoint[] = [];
    let skipped = 0;
    tuples.forEach((t, i) => {
      const p = parseTuple(t, /* assumeLngLat */ true);
      if (p) pts.push({ ...p, label: `P${i + 1}` });
      else skipped++;
    });
    if (pts.length) return { points: pts, skipped };
  }

  // 2) Generic — one tuple per line (or `;` separated)
  const lines = trimmed
    .split(/\r?\n/)
    .flatMap((l) => (l.includes(';') ? l.split(';') : [l]))
    .map((l) => l.trim())
    .filter(Boolean);
  const pts: ParsedPoint[] = [];
  let skipped = 0;
  lines.forEach((l, i) => {
    const p = parseTuple(l, false);
    if (p) pts.push({ ...p, label: `P${i + 1}` });
    else skipped++;
  });
  return { points: pts, skipped };
}

/**
 * Parse a KML/XML document and extract every <Placemark>'s LineString and
 * Point coordinates. All other metadata (name, style, ExtendedData, etc.)
 * is intentionally ignored — we just want geometry to plot.
 *
 * Returns:
 *  - lines: array of polylines (each is a list of [lng,lat] pairs)
 *  - points: array of pin coordinates
 */
interface KmlParseResult {
  lines: Array<Array<[number, number]>>;
  points: ParsedPoint[];
  skipped: number;
}

function parseKmlDocument(xmlText: string): KmlParseResult {
  const lines: Array<Array<[number, number]>> = [];
  const points: ParsedPoint[] = [];
  let skipped = 0;

  let doc: Document | null = null;
  try {
    doc = new DOMParser().parseFromString(xmlText, 'text/xml');
  } catch {
    return { lines, points, skipped: 1 };
  }
  if (!doc) return { lines, points, skipped: 1 };

  // Helper — turn a `<coordinates>` text blob into [lng,lat] tuples.
  const parseCoordsBlob = (blob: string): Array<[number, number]> => {
    const out: Array<[number, number]> = [];
    blob
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .forEach((tuple) => {
        const parts = tuple.split(',').map((s) => parseFloat(s));
        if (parts.length >= 2 && isFinite(parts[0]) && isFinite(parts[1])) {
          let lng = parts[0];
          const lat = parts[1];
          if (lng > 180) lng -= 360;
          if (lng < -180) lng += 360;
          if (lat >= -90 && lat <= 90) out.push([lng, lat]);
        }
      });
    return out;
  };

  // Walk every Placemark — extract LineString(s) and Point(s) inside it.
  const placemarks = Array.from(doc.getElementsByTagName('Placemark'));
  let pinIdx = 0;
  placemarks.forEach((pm) => {
    // LineStrings (incl. those inside MultiGeometry)
    const lineCoordEls = pm.querySelectorAll('LineString > coordinates');
    lineCoordEls.forEach((el) => {
      const coords = parseCoordsBlob(el.textContent || '');
      if (coords.length >= 2) lines.push(coords);
      else if (coords.length === 0) skipped++;
    });

    // Points
    const pointCoordEls = pm.querySelectorAll('Point > coordinates');
    pointCoordEls.forEach((el) => {
      const coords = parseCoordsBlob(el.textContent || '');
      coords.forEach(([lng, lat]) => {
        pinIdx++;
        points.push({ lng, lat, label: `P${pinIdx}` });
      });
    });
  });

  // Fallback — KML with no <Placemark> wrappers but raw <coordinates> tags
  if (lines.length === 0 && points.length === 0) {
    const allCoords = Array.from(doc.getElementsByTagName('coordinates'));
    allCoords.forEach((el) => {
      const coords = parseCoordsBlob(el.textContent || '');
      if (coords.length >= 2) lines.push(coords);
      else if (coords.length === 1) {
        pinIdx++;
        points.push({ lng: coords[0][0], lat: coords[0][1], label: `P${pinIdx}` });
      }
    });
  }

  return { lines, points, skipped };
}

// ----- Component -------------------------------------------------------

interface CoordinateSearchPanelProps {
  mapRef: React.RefObject<MLMap | null>;
  /** Re-runs the layer-add logic whenever the basemap reloads. */
  styleReady: boolean;
  styleRevision?: number;
}

const SRC_PINS = 'search-pins-src';
const SRC_LINE = 'search-line-src';
const LAYER_LINE = 'search-line';
const LAYER_PINS = 'search-pins';
const LAYER_LABELS = 'search-pin-labels';

export function CoordinateSearchPanel({ mapRef, styleReady, styleRevision = 0 }: CoordinateSearchPanelProps) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [input, setInput] = useState('');
  const [points, setPoints] = useState<ParsedPoint[]>([]);
  // Multiple polylines (one per <Placemark><LineString> in an uploaded KML)
  const [lines, setLines] = useState<Array<Array<[number, number]>>>([]);
  const [error, setError] = useState<string | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ----- Build GeoJSON ----------------------------------------------------
  const pinsGeoJSON = useMemo<GeoJSON.FeatureCollection>(
    () => ({
      type: 'FeatureCollection',
      features: points.map((p, i) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
        properties: { label: p.label ?? `P${i + 1}`, lat: p.lat, lng: p.lng },
      })),
    }),
    [points]
  );

  const lineGeoJSON = useMemo<GeoJSON.FeatureCollection>(() => {
    const features: GeoJSON.Feature[] = [];
    // Connect typed/pasted points with a single dashed line
    if (points.length >= 2) {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: points.map((p) => [p.lng, p.lat]),
        },
        properties: { kind: 'pins' },
      });
    }
    // Every uploaded KML LineString becomes its own feature
    lines.forEach((coords, i) => {
      if (coords.length >= 2) {
        features.push({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: coords },
          properties: { kind: 'kml', idx: i },
        });
      }
    });
    return { type: 'FeatureCollection', features };
  }, [points, lines]);

  // ----- Add / refresh sources & layers ----------------------------------
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady) return;

    // Pins source
    if (!map.getSource(SRC_PINS)) {
      map.addSource(SRC_PINS, { type: 'geojson', data: pinsGeoJSON });
    } else {
      (map.getSource(SRC_PINS) as GeoJSONSource).setData(pinsGeoJSON);
    }

    // Line source
    if (!map.getSource(SRC_LINE)) {
      map.addSource(SRC_LINE, { type: 'geojson', data: lineGeoJSON });
    } else {
      (map.getSource(SRC_LINE) as GeoJSONSource).setData(lineGeoJSON);
    }

    // Line layer (drawn under pins). Solid for KML <Placemark> lines,
    // dashed for the connector that links pasted lat/lng points.
    if (!map.getLayer(LAYER_LINE)) {
      map.addLayer({
        id: LAYER_LINE,
        type: 'line',
        source: SRC_LINE,
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': [
            'match', ['get', 'kind'],
            'kml', '#f59e0b', // KML polylines — amber solid
            '#f59e0b',        // pin connector — amber dashed
            '#f59e0b',
          ],
          'line-width': ['case', ['==', ['get', 'kind'], 'kml'], 3, 2.5],
          'line-opacity': 0.95,
        },
      });
    }

    // Pin circles
    if (!map.getLayer(LAYER_PINS)) {
      map.addLayer({
        id: LAYER_PINS,
        type: 'circle',
        source: SRC_PINS,
        paint: {
          'circle-radius': 7,
          'circle-color': '#f59e0b',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2,
        },
      });

      map.on('mouseenter', LAYER_PINS, () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', LAYER_PINS, () => {
        map.getCanvas().style.cursor = '';
        popupRef.current?.remove();
        popupRef.current = null;
      });
      map.on('click', LAYER_PINS, (e: any) => {
        const f = e.features?.[0];
        if (!f) return;
        const { label, lat, lng } = f.properties ?? {};
        popupRef.current?.remove();
        popupRef.current = new maplibregl.Popup({ closeButton: true, offset: 10 })
          .setLngLat(e.lngLat)
          .setHTML(
            `<div style="font:12px sans-serif;color:#111;min-width:140px;">
               <div style="font-weight:600;margin-bottom:2px;">${label}</div>
               <div style="opacity:0.75;">lat: ${Number(lat).toFixed(5)}</div>
               <div style="opacity:0.75;">lng: ${Number(lng).toFixed(5)}</div>
             </div>`
          )
          .addTo(map);
      });
    }

    // Optional labels (skipped silently on styles without glyphs)
    if (!map.getLayer(LAYER_LABELS)) {
      try {
        map.addLayer({
          id: LAYER_LABELS,
          type: 'symbol',
          source: SRC_PINS,
          layout: {
            'text-field': ['get', 'label'],
            'text-size': 11,
            'text-offset': [0, -1.4],
            'text-anchor': 'bottom',
            'text-allow-overlap': true,
            'text-font': ['Open Sans Regular', 'Arial Unicode MS Regular'],
          },
          paint: {
            'text-color': '#111827',
            'text-halo-color': '#ffffff',
            'text-halo-width': 2,
          },
        });
      } catch { /* glyphs not available */ }
    }

    // Always keep on top
    try {
      if (map.getLayer(LAYER_LINE)) map.moveLayer(LAYER_LINE);
      if (map.getLayer(LAYER_PINS)) map.moveLayer(LAYER_PINS);
      if (map.getLayer(LAYER_LABELS)) map.moveLayer(LAYER_LABELS);
    } catch { /* noop */ }
  }, [styleReady, styleRevision, pinsGeoJSON, lineGeoJSON, mapRef]);

  // ----- Actions ---------------------------------------------------------

  // ---- Frame helper: fits the map to a list of [lng,lat] coords ----
  const fitToCoords = useCallback((coords: Array<[number, number]>) => {
    const map = mapRef.current;
    if (!map || coords.length === 0) return;
    if (coords.length === 1) {
      map.flyTo({ center: coords[0], zoom: 8, duration: 1200 });
      return;
    }
    let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
    coords.forEach(([lng, lat]) => {
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    });
    map.fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 80, duration: 1400 });
  }, [mapRef]);

  const plot = useCallback(() => {
    // If the textarea looks like a full KML/XML document with <Placemark>
    // blocks, route it through the document parser so we honour every
    // <LineString> as its own polyline.
    if (/<Placemark[\s>]/i.test(input)) {
      const { lines: parsedLines, points: parsedPoints, skipped } = parseKmlDocument(input);
      if (parsedLines.length === 0 && parsedPoints.length === 0) {
        setError('No <Placemark> geometry found.');
        return;
      }
      setLines(parsedLines);
      setPoints(parsedPoints);
      const total = parsedLines.reduce((n, l) => n + l.length, 0) + parsedPoints.length;
      setError(
        `Plotted ${parsedLines.length} line${parsedLines.length === 1 ? '' : 's'} + ${parsedPoints.length} pin${parsedPoints.length === 1 ? '' : 's'} (${total} vertices)${skipped ? ` · skipped ${skipped}` : ''}.`
      );
      const all: Array<[number, number]> = [
        ...parsedLines.flat(),
        ...parsedPoints.map((p) => [p.lng, p.lat] as [number, number]),
      ];
      fitToCoords(all);
      return;
    }

    // Otherwise — plain coordinate list / KML <coordinates> blob
    const { points: parsed, skipped } = parseAll(input);
    if (parsed.length === 0) {
      setError('No valid coordinates found. Try "lat, lng" — one per line, or paste a KML <coordinates> blob.');
      return;
    }
    if (skipped > 0) {
      setError(`Plotted ${parsed.length} points. Skipped ${skipped} unparseable line${skipped === 1 ? '' : 's'}.`);
    } else {
      setError(null);
    }
    setLines([]);
    setPoints(parsed);
    fitToCoords(parsed.map((p) => [p.lng, p.lat] as [number, number]));
  }, [input, fitToCoords]);

  const clear = useCallback(() => {
    setPoints([]);
    setLines([]);
    setInput('');
    setError(null);
    popupRef.current?.remove();
    popupRef.current = null;
  }, []);

  // ---- Upload a KML / KMZ file: parse every <Placemark> geometry ----
  const handleKmlFile = useCallback(async (file: File) => {
    try {
      let text: string;
      if (file.name.toLowerCase().endsWith('.kmz')) {
        const JSZip = (await import('jszip')).default;
        const zip = await JSZip.loadAsync(await file.arrayBuffer());
        const kmlEntry = Object.keys(zip.files).find((n) => n.toLowerCase().endsWith('.kml'));
        if (!kmlEntry) {
          setError('KMZ archive does not contain a .kml file.');
          return;
        }
        text = await zip.files[kmlEntry].async('string');
      } else {
        text = await file.text();
      }

      const { lines: parsedLines, points: parsedPoints, skipped } = parseKmlDocument(text);
      if (parsedLines.length === 0 && parsedPoints.length === 0) {
        setError('No <coordinates> found in this KML file.');
        return;
      }
      setLines(parsedLines);
      setPoints(parsedPoints);
      setInput(''); // clear textarea — KML upload supersedes pasted input

      const totalPts = parsedLines.reduce((n, l) => n + l.length, 0) + parsedPoints.length;
      const lineMsg = parsedLines.length ? `${parsedLines.length} line${parsedLines.length === 1 ? '' : 's'}` : '';
      const pinMsg = parsedPoints.length ? `${parsedPoints.length} pin${parsedPoints.length === 1 ? '' : 's'}` : '';
      const both = [lineMsg, pinMsg].filter(Boolean).join(' + ');
      setError(
        `Loaded ${file.name}: ${both} (${totalPts} vertices)${skipped > 0 ? ` · skipped ${skipped} empty geom${skipped === 1 ? '' : 's'}` : ''}.`
      );

      // Frame everything
      const all: Array<[number, number]> = [
        ...parsedLines.flat(),
        ...parsedPoints.map((p) => [p.lng, p.lat] as [number, number]),
      ];
      fitToCoords(all);
    } catch (err) {
      console.error('KML upload failed:', err);
      setError('Failed to read KML file. Please verify the file is valid XML.');
    }
  }, [fitToCoords]);

  const loadSample = useCallback(() => {
    setInput(
      [
        '28.6139, 77.2090   // Delhi',
        '19.0760, 72.8777   // Mumbai',
        '12.9716, 77.5946   // Bangalore',
        '13.0827, 80.2707   // Chennai',
      ].join('\n')
    );
  }, []);

  /** Sample KML-style lng,lat,alt blob (Pacific Ocean cable segment) */
  const loadKmlSample = useCallback(() => {
    setInput(
      `<coordinates>
144.6935,13.4647,0 144.6936,13.4701,0 144.6793,13.4763,0 144.6637,13.4934,0
144.6515,13.4964,0 144.5837,13.4775,0 144.5446,13.4639,0 144.5379,13.4463,0
</coordinates>`
    );
  }, []);

  // ----- UI --------------------------------------------------------------
  if (!open) {
    return (
      <Button
        size="sm"
        variant="outline"
        className="h-9 gap-1.5 bg-background/90 backdrop-blur-sm shadow-lg"
        onClick={() => setOpen(true)}
        title="Search and plot coordinates"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="text-xs">Search coords</span>
      </Button>
    );
  }

  return (
    <div className="w-[320px] rounded-lg bg-background/95 backdrop-blur-md shadow-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/40">
        <div className="flex items-center gap-1.5">
          <Search className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold">Coordinate Search</span>
          {(points.length > 0 || lines.length > 0) && (
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {points.length > 0 && <>· {points.length} pin{points.length === 1 ? '' : 's'}</>}
              {lines.length > 0 && <> · {lines.length} line{lines.length === 1 ? '' : 's'}</>}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={() => { clear(); setOpen(false); }}
            title="Close"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {!collapsed && (
        <div className="p-3 space-y-2">
          {/* Quick single-pair search */}
          <div className="flex items-center gap-1.5">
            <Input
              placeholder="lat, lng (e.g. 28.6, 77.2)"
              className="h-8 text-xs"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const v = (e.target as HTMLInputElement).value.trim();
                  if (v) setInput((prev) => (prev ? `${prev}\n${v}` : v));
                  (e.target as HTMLInputElement).value = '';
                }
              }}
              onClick={(e) => e.stopPropagation()}
            />
            <MapPin className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          </div>

          {/* Multi-line textarea (use plain textarea — keeps deps light) */}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              'Paste coordinates — any of these formats works:\n\n' +
              '· lat, lng (one per line)\n' +
              '   28.6139, 77.2090\n' +
              '   19.0760, 72.8777\n\n' +
              '· KML lng,lat,alt (space-separated)\n' +
              '   77.20,28.61,0 72.87,19.07,0\n\n' +
              '· Or wrap in <coordinates>...</coordinates>'
            }
            rows={6}
            className="w-full text-[11px] font-mono rounded-md border border-input bg-background p-2 resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring placeholder:text-muted-foreground"
            onClick={(e) => e.stopPropagation()}
          />

          {error && (
            <div className="text-[11px] text-destructive">{error}</div>
          )}

          <div className="flex items-center gap-1.5">
            <Button size="sm" className="h-7 text-xs flex-1" onClick={plot}>
              <Search className="h-3 w-3 mr-1" />
              Plot
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs px-2 gap-1"
              onClick={() => fileInputRef.current?.click()}
              title="Upload a .kml or .kmz file — every <Placemark> LineString/Point will be plotted"
            >
              <Upload className="h-3 w-3" />
              KML File
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={clear}
              title="Clear all"
              disabled={points.length === 0 && lines.length === 0 && !input}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Sample loaders + hidden file picker */}
          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-[10px] px-2 flex-1"
              onClick={loadSample}
              title="Load sample (Indian metros — lat,lng)"
            >
              Cities sample
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-6 text-[10px] px-2 flex-1"
              onClick={loadKmlSample}
              title="Load KML sample (lng,lat,alt)"
            >
              KML sample
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".kml,.kmz,application/vnd.google-earth.kml+xml,application/vnd.google-earth.kmz"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleKmlFile(f);
              // Reset so re-uploading the same file fires onChange again
              e.target.value = '';
            }}
          />

          {(points.length >= 2 || lines.length > 0) && (
            <div className="text-[10px] text-muted-foreground border-t border-border pt-1.5">
              {lines.length > 0
                ? `Plotted ${lines.length} polyline${lines.length === 1 ? '' : 's'} from KML · click any pin for details`
                : 'Connected as a dashed line · click any pin for details'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
