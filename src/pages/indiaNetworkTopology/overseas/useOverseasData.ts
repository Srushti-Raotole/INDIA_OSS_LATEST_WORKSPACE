import { useEffect, useMemo, useState } from 'react';
import { OVERSEAS_CABLES, DEFAULT_OVERSEAS_VISIBILITY, TELEGEO_JSON_PATH } from './constants';
import { parseOverseasKml } from './parser';
import type {
  OverseasCable,
  OverseasCableId,
  OverseasSegment,
  OverseasLanding,
  OverseasVisibility,
} from './types';

interface UseOverseasDataResult {
  cables: OverseasCable[];
  isLoading: boolean;
  error: string | null;
  visibility: OverseasVisibility;
  setVisibility: (v: OverseasVisibility) => void;
  toggleCable: (id: OverseasCableId) => void;
  selectedSegment: OverseasSegment | null;
  setSelectedSegment: (s: OverseasSegment | null) => void;
  selectedCableId: OverseasCableId | null;
  setSelectedCableId: (id: OverseasCableId | null) => void;
  visibleTotalLengthKm: number;
}

// ----- Geometry helpers (Haversine) -----
const EARTH_RADIUS_KM = 6371;
const toRad = (d: number) => (d * Math.PI) / 180;
function haversineKm(a: [number, number], b: [number, number]): number {
  const dLat = toRad(b[1] - a[1]);
  const dLon = toRad(b[0] - a[0]);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(s));
}
function lineLengthKm(coords: [number, number][]): number {
  let t = 0;
  for (let i = 1; i < coords.length; i++) t += haversineKm(coords[i - 1], coords[i]);
  return t;
}
const normaliseLon = (lon: number) =>
  lon > 180 ? lon - 360 : lon < -180 ? lon + 360 : lon;

/**
 * Unwrap longitudes so successive points stay within 180° of the previous one.
 * This prevents Leaflet from cutting a polyline across the antimeridian and
 * drawing it as a flat line across the whole map.
 */
function unwrapLongitudes(coords: [number, number][]): [number, number][] {
  if (coords.length === 0) return coords;
  const out: [number, number][] = [coords[0]];
  for (let i = 1; i < coords.length; i++) {
    let [lon, lat] = coords[i];
    const prevLon = out[i - 1][0];
    while (lon - prevLon > 180) lon -= 360;
    while (lon - prevLon < -180) lon += 360;
    out.push([lon, lat]);
  }
  return out;
}

// ----- TeleGeography snapshot types -----
interface TeleGeoCable {
  id: string;
  name: string;
  color: string;
  geometry: { type: 'MultiLineString'; coordinates: [number, number][][] };
  landings: { id: string; name: string; coordinates: [number, number] }[];
  length_km_meta?: string | null;
  rfs?: string | null;
  owners?: string | null;
}
interface TeleGeoFile { cables: TeleGeoCable[] }

export function useOverseasData(enabled: boolean): UseOverseasDataResult {
  const [cables, setCables] = useState<OverseasCable[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<OverseasVisibility>(DEFAULT_OVERSEAS_VISIBILITY);
  const [selectedSegment, setSelectedSegment] = useState<OverseasSegment | null>(null);
  const [selectedCableId, setSelectedCableId] = useState<OverseasCableId | null>(null);

  useEffect(() => {
    if (!enabled || cables.length > 0) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const baseUrl = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
    const resolvePath = (p: string) =>
      p.startsWith('http') ? p : `${baseUrl}${p.startsWith('/') ? p : `/${p}`}`;

    // Load TeleGeography snapshot once (lazily — only if any geojson cable exists)
    const needsTeleGeo = OVERSEAS_CABLES.some((c) => c.source === 'geojson');
    const teleGeoPromise: Promise<TeleGeoFile | null> = needsTeleGeo
      ? fetch(resolvePath(TELEGEO_JSON_PATH))
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
      : Promise.resolve(null);

    Promise.all([
      teleGeoPromise,
      Promise.all(
        OVERSEAS_CABLES.map(async (cfg) => {
          if (cfg.source === 'kml' && cfg.kmlPath) {
            const url = resolvePath(cfg.kmlPath);
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Failed to load ${url} (${res.status})`);
            const text = await res.text();
            const { segments, landings } = parseOverseasKml(text, cfg.id);
            const totalLengthKm = segments.reduce((a, s) => a + s.lengthKm, 0);
            const cable: OverseasCable = { ...cfg, segments, landings, totalLengthKm };
            return cable;
          }
          // geojson cables resolved after teleGeoPromise; return placeholder
          return { ...cfg, segments: [], landings: [], totalLengthKm: 0 } as OverseasCable;
        }),
      ),
    ])
      .then(([teleGeo, partial]) => {
        const teleIndex = new Map<string, TeleGeoCable>();
        teleGeo?.cables.forEach((c) => teleIndex.set(c.id, c));

        const resolved = partial.map<OverseasCable>((cable) => {
          if (cable.source !== 'geojson' || !cable.geoJsonId) return cable;
          const tg = teleIndex.get(cable.geoJsonId);
          if (!tg) {
            console.warn('[Overseas] Missing teleGeo entry', cable.geoJsonId);
            return cable;
          }
          // 1) Internally unwrap each segment so it stays continuous on its own
          const perSegment = tg.geometry.coordinates.map((line) => {
            const raw = line
              .filter((c) => Array.isArray(c) && Number.isFinite(c[0]) && Number.isFinite(c[1]))
              .map(([lon, lat]) => [normaliseLon(lon), lat] as [number, number]);
            return unwrapLongitudes(raw);
          }).filter((coords) => coords.length >= 2);

          // 2) Align every segment to the SAME world copy as the first one,
          //    so Pacific-crossing cables (SEA-US, etc.) connect right→US
          //    instead of jumping to the left side of the map.
          const meanLon = (cs: [number, number][]) =>
            cs.reduce((a, [lon]) => a + lon, 0) / cs.length;
          const anchor = perSegment.length > 0 ? meanLon(perSegment[0]) : 0;
          const shiftToAnchor = (lon: number) => {
            let v = lon;
            while (v - anchor > 180) v -= 360;
            while (v - anchor < -180) v += 360;
            return v;
          };
          const alignSegment = (cs: [number, number][]): [number, number][] => {
            const m = meanLon(cs);
            let shift = 0;
            while (m + shift - anchor > 180) shift -= 360;
            while (m + shift - anchor < -180) shift += 360;
            return cs.map(([lon, lat]) => [lon + shift, lat] as [number, number]);
          };

          const segments: OverseasSegment[] = perSegment.map((cs, i) => {
            const coords = alignSegment(cs);
            return {
              id: `${cable.id}-seg-${i}`,
              name: `${cable.id} segment ${i + 1}`,
              coordinates: coords,
              lengthKm: lineLengthKm(coords),
            };
          });
          const landings: OverseasLanding[] = tg.landings.map((l, i) => ({
            id: `${cable.id}-land-${i}`,
            name: l.name,
            coordinates: [shiftToAnchor(normaliseLon(l.coordinates[0])), l.coordinates[1]],
          }));
          const totalLengthKm = segments.reduce((a, s) => a + s.lengthKm, 0);
          return {
            ...cable,
            segments,
            landings,
            totalLengthKm,
            meta: {
              rfs: tg.rfs ?? null,
              owners: tg.owners ?? null,
              lengthKmReported: tg.length_km_meta ? Number(tg.length_km_meta) : null,
            },
          };
        });

        if (!cancelled) {
          setCables(resolved);
          console.log('[Overseas] Loaded', resolved.length, 'cables');
        }
      })
      .catch((err) => {
        console.error('[Overseas] Load failed:', err);
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  const toggleCable = (id: OverseasCableId) => {
    setVisibility((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const visibleTotalLengthKm = useMemo(
    () => cables.filter((c) => visibility[c.id]).reduce((a, c) => a + c.totalLengthKm, 0),
    [cables, visibility],
  );

  return {
    cables,
    isLoading,
    error,
    visibility,
    setVisibility,
    toggleCable,
    selectedSegment,
    setSelectedSegment,
    selectedCableId,
    setSelectedCableId,
    visibleTotalLengthKm,
  };
}
