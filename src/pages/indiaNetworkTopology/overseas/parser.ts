

import type { OverseasSegment, OverseasLanding } from './types';

const EARTH_RADIUS_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function haversineKm(a: [number, number], b: [number, number]): number {
  const [lon1, lat1] = a;
  const [lon2, lat2] = b;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(s));
}

/** Sum of segment lengths in km */
function polylineLengthKm(coords: [number, number][]): number {
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    total += haversineKm(coords[i - 1], coords[i]);
  }
  return total;
}

/**
 * Some KMLs (notably SEA-US East) store longitudes as 0..360 to avoid
 * crossing the antimeridian in Google Earth. Leaflet expects -180..180,
 * so wrap anything > 180 back into the negative range.
 */
function normaliseLon(lon: number): number {
  if (lon > 180) return lon - 360;
  if (lon < -180) return lon + 360;
  return lon;
}

/**
 * Unwrap longitudes so successive points stay within 180° of the previous.
 * Prevents Leaflet from drawing antimeridian-crossing polylines as a flat
 * line across the whole map.
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



/** Parse a KML <coordinates> text block into [lon, lat] tuples */
function parseCoordinates(text: string): [number, number][] {
  return text
    .trim()
    .split(/\s+/)
    .map(token => token.split(',').map(Number))
    .filter(parts => parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1]))
    .map(parts => [normaliseLon(parts[0]), parts[1]] as [number, number]);
}

/**
 * Parse a single overseas KML file.
 * Walks ALL <Placemark> elements regardless of how deeply they're nested
 * inside <Folder> or <Document>.
 */
export function parseOverseasKml(
  kmlText: string,
  cableId: string
): { segments: OverseasSegment[]; landings: OverseasLanding[] } {
  // Strip UTF-8 BOM + leading whitespace that breaks strict XML parsing
  const cleaned = kmlText.replace(/^\uFEFF/, '').trimStart();

  const parser = new DOMParser();
  // Try strict XML first; if it errors, fall back to text/xml then text/html.
  // Different browsers / KML exporters produce slightly different docs; this
  // multi-pass approach matches what Leaflet/OmniOverseas plugins do internally.
  let doc = parser.parseFromString(cleaned, 'application/xml');
  if (doc.querySelector('parsererror')) {
    doc = parser.parseFromString(cleaned, 'text/xml');
  }
  if (doc.querySelector('parsererror')) {
    doc = parser.parseFromString(cleaned, 'text/html');
  }

  const placemarks = Array.from(doc.getElementsByTagName('Placemark'));
  if (placemarks.length === 0) {
    // Only throw if we genuinely got nothing usable — a parsererror with
    // recoverable content shouldn't block rendering.
    throw new Error(`No <Placemark> elements found in KML for ${cableId}`);
  }

  const segments: OverseasSegment[] = [];
  const landings: OverseasLanding[] = [];

  let segIdx = 0;
  let landIdx = 0;

  for (const pm of placemarks) {
    const nameEl = pm.getElementsByTagName('name')[0];
    const name = (nameEl?.textContent || '').trim() || 'Unnamed';

    // LineStrings (cable segments) - may be multiple per Placemark inside MultiGeometry
    const lineStrings = Array.from(pm.getElementsByTagName('LineString'));
    for (const ls of lineStrings) {
      const coordEl = ls.getElementsByTagName('coordinates')[0];
      if (!coordEl?.textContent) continue;
      const raw = parseCoordinates(coordEl.textContent);
      if (raw.length < 2) continue;
      const coords = unwrapLongitudes(raw);
      segments.push({
        id: `${cableId}-seg-${segIdx++}`,
        name,
        coordinates: coords,
        lengthKm: polylineLengthKm(coords),
      });
    }

    // Points (landing stations)
    const points = Array.from(pm.getElementsByTagName('Point'));
    for (const pt of points) {
      const coordEl = pt.getElementsByTagName('coordinates')[0];
      if (!coordEl?.textContent) continue;
      const coords = parseCoordinates(coordEl.textContent);
      if (coords.length < 1) continue;
      landings.push({
        id: `${cableId}-land-${landIdx++}`,
        name,
        coordinates: coords[0],
      });
    }
  }

  return { segments, landings };
}
