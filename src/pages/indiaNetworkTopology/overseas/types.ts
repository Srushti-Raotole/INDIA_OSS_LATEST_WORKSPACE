
export interface OverseasSegment {
  id: string;
  name: string;
  coordinates: [number, number][];
  lengthKm: number;
}

export interface OverseasLanding {
  id: string;
  name: string;
  coordinates: [number, number];
}

export interface OverseasCable {
  id: OverseasCableId;
  displayName: string;
  /** Where to load the geometry from */
  source: 'kml' | 'geojson';
  /** KML path (when source='kml') under /public */
  kmlPath?: string;
  /** Id within the bundled teleGeo.json (when source='geojson') */
  geoJsonId?: string;
  /** Visual grouping inside the sidebar */
  group: 'core' | 'additional';
  color: string;
  weight: number;
  dashArray?: string;
  segments: OverseasSegment[];
  landings: OverseasLanding[];
  totalLengthKm: number;
  /** Optional metadata from TeleGeography (rfs year, owners, etc.) */
  meta?: {
    rfs?: string | null;
    owners?: string | null;
    lengthKmReported?: number | null;
  };
}

export type OverseasCableId =
  | 'JGA-N'
  | 'JGA-S'
  | 'SEA-US-East'
  | 'SEA-US'
  | 'IGG'
  | 'MIST';

export type OverseasVisibility = Record<OverseasCableId, boolean>;
