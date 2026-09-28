
import type { OverseasCable, OverseasCableId, OverseasVisibility } from './types';

export const OVERSEAS_LINE_WEIGHT = 2;
export const OVERSEAS_LINE_WEIGHT_ACTIVE = 3.5;
export const OVERSEAS_LANDING_RADIUS = 4;


export const OVERSEAS_CABLES: ReadonlyArray<
  Omit<OverseasCable, 'segments' | 'landings' | 'totalLengthKm' | 'meta'>
> = [
  // ---- Core: bundled KML ---------------------------------------------------
  {
    id: 'JGA-N',
    displayName: 'Japan-Guam-Australia North (JGA-N)',
    source: 'geojson',
    geoJsonId: 'japan-guam-australia-north-jga-n',
    group: 'additional',
    color: '#8b5cf6',
    weight: OVERSEAS_LINE_WEIGHT,
  },
  {
    id: 'JGA-S',
    displayName: 'Japan-Guam-Australia South (JGA-S)',
    source: 'geojson',
    geoJsonId: 'japan-guam-australia-south-jga-s',
    group: 'additional',
    color: '#14b8a6',
    weight: OVERSEAS_LINE_WEIGHT,
  },
  {
    id: 'SEA-US',
    displayName: 'SEA-US (Manado ↔ Davao ↔ Piti ↔ Hawaii ↔ US)',
    source: 'geojson',
    geoJsonId: 'sea-us',
    group: 'additional',
    color: '#f59e0b',
    weight: OVERSEAS_LINE_WEIGHT,
  },
  {
    id: 'IGG',
    displayName: 'IGG (Indonesia Global Gateway)',
    source: 'geojson',
    geoJsonId: 'indonesia-global-gateway-igg-system',
    group: 'additional',
    color: '#22c55e',
    weight: OVERSEAS_LINE_WEIGHT,
  },
  {
    id: 'MIST',
    displayName: 'MIST (Myanmar ↔ India ↔ Singapore Transit)',
    source: 'geojson',
    geoJsonId: 'mist',
    group: 'additional',
    color: '#0ea5e9',
    weight: OVERSEAS_LINE_WEIGHT,
  },
];





export const DEFAULT_OVERSEAS_VISIBILITY: OverseasVisibility = {
  // All additional cables visible by default
  'JGA-N': true,
  'JGA-S': true,
  'SEA-US-East': false,
  'SEA-US': true,
  'IGG': true,
  'MIST': true,
};

export const OVERSEAS_CABLE_IDS: OverseasCableId[] = OVERSEAS_CABLES.map(
  (c) => c.id as OverseasCableId,
);

/** Path to the bundled TeleGeography GeoJSON snapshot */
export const TELEGEO_JSON_PATH = '/overseas/teleGeo.json';
