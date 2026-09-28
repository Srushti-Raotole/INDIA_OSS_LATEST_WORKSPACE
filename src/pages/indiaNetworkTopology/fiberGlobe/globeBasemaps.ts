
import type { StyleSpecification } from 'maplibre-gl';


const FREE_GLYPHS = 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf';

/** Inline raster style helper - builds a single-source MapLibre style */
function rasterStyle(
  id: string,
  tiles: string[],
  attribution: string,
  opts: { maxzoom?: number; tileSize?: number } = {}
): StyleSpecification {
  return {
    version: 8,
    glyphs: FREE_GLYPHS,
    sources: {
      [id]: {
        type: 'raster',
        tiles,
        tileSize: opts.tileSize ?? 256,
        maxzoom: opts.maxzoom ?? 19,
        attribution,
      },
    },
    layers: [{ id, type: 'raster', source: id }],
  };
}

/** Vector style URL or inline raster style */
type StyleSource = string | StyleSpecification;

export interface BasemapDef {
  /** Display label */
  name: string;
  /** Short description (used in tooltip) */
  description: string;
  /** Either a hosted style URL or an inline style spec */
  style: StyleSource;
  /** Show star-field background (only useful for dark themes) */
  starfield?: boolean;
  /** Logical category for grouping in the UI */
  category: 'vector' | 'satellite' | 'classic' | 'night';
}

export const GLOBE_BASEMAPS = {
  voyager: {
    name: 'Voyager',
    description: '',
    style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json',
    category: 'vector',
  },
  positron: {
    name: 'Light',
    description: '',
    style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    category: 'vector',
  },
  darkmatter: {
    name: 'Dark',
    description: '',
    style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
    category: 'vector',
  },
  satellite: {
    name: 'Satellite',
    description: '',
    style: rasterStyle(
      'esri-imagery',
      [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      ],
      'Tiles &copy; Esri, Maxar, Earthstar Geographics',
      { maxzoom: 19 }
    ),
    category: 'satellite',
  },
  hybrid: {
    name: 'Hybrid',
    description: '',
    style: {
      version: 8,
      glyphs: FREE_GLYPHS,
      sources: {
        imagery: {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          ],
          tileSize: 256,
          maxzoom: 19,
          attribution: 'Tiles &copy; Esri',
        },
        labels: {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
          ],
          tileSize: 256,
          maxzoom: 19,
          attribution: 'Labels &copy; Esri',
        },
      },
      layers: [
        { id: 'imagery', type: 'raster', source: 'imagery' },
        { id: 'labels', type: 'raster', source: 'labels' },
      ],
    } as StyleSpecification,
    category: 'satellite',
  },
  terrain: {
    name: 'Terrain',
    description: '',
    style: rasterStyle(
      'opentopo',
      ['https://a.tile.opentopomap.org/{z}/{x}/{y}.png'],
      '&copy; OpenTopoMap (CC-BY-SA)',
      { maxzoom: 17 }
    ),
    category: 'classic',
  },
  osm: {
    name: 'Streets (OSM)',
    description: '',
    style: rasterStyle(
      'osm',
      ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
      '&copy; OpenStreetMap contributors',
      { maxzoom: 19 }
    ),
    category: 'classic',
  },
  esriStreet: {
    name: 'Esri Street',
    description: '',
    style: rasterStyle(
      'esri-street',
      [
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      ],
      'Tiles &copy; Esri',
      { maxzoom: 18 }
    ),
    category: 'classic',
  },
  night: {
    name: 'Night (Stars)',
    description: '',
    style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
    starfield: true,
    category: 'night',
  },
} as const satisfies Record<string, BasemapDef>;

export type BasemapKey = keyof typeof GLOBE_BASEMAPS;

export const BASEMAP_GROUPS: { label: string; keys: BasemapKey[] }[] = [
  { label: 'Vector', keys: ['voyager', 'darkmatter'] },
  { label: 'Satellite', keys: ['satellite', 'hybrid'] },
  { label: 'Classic', keys: [ 'osm', 'esriStreet'] },
];
