// // // import { MapViewMode } from '../types';

// // // export interface MapTileConfig {
// // //   url: string;
// // //   attribution: string;
// // //   name: string;
// // //   maxZoom: number;
// // //   description: string;
// // //   category: 'osm' | 'carto' | 'esri';
// // //   minZoom: number;
// // // }

// // // export const MAP_TILES: Record<MapViewMode, MapTileConfig> = {
// // //   // ========== CARTODB/CARTO BASEMAPS ==========

// // //   cartoVoyager: {
// // //     url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
// // //     attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
// // //     name: 'Voyager',
// // //     maxZoom: 20,
// // //     description: 'CartoDB Voyager - colorful, detailed',
// // //     category: 'carto',
// // //     minZoom: 5,
// // //   },

// // //   cartoLight: {
// // //     url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
// // //     attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
// // //     name: 'Positron',
// // //     maxZoom: 20,
// // //     description: 'CartoDB Positron - minimal light theme',
// // //     category: 'carto',
// // //     minZoom: 5,
// // //   },

// // //   cartoDark: {
// // //     url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
// // //     attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
// // //     name: 'Dark Matter',
// // //     maxZoom: 20,
// // //     description: 'CartoDB Dark Matter - dark theme',
// // //     category: 'carto',
// // //     minZoom: 5,
// // //   },

// // //   cartoVoyagerNoLabel: {
// // //     url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png',
// // //     attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
// // //     name: 'Voyager Clean',
// // //     maxZoom: 20,
// // //     description: 'CartoDB Voyager without labels - clean overlay base',
// // //     category: 'carto',
// // //     minZoom: 5,
// // //   },

// // //   cartoLightNoLabel: {
// // //     url: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
// // //     attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
// // //     name: 'Positron Clean',
// // //     maxZoom: 20,
// // //     description: 'CartoDB Positron without labels - minimal clean',
// // //     category: 'carto',
// // //     minZoom: 5,
// // //   },

// // //   cartoDarkNoLabel: {
// // //     url: 'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
// // //     attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
// // //     name: 'Dark Clean',
// // //     maxZoom: 20,
// // //     description: 'CartoDB Dark without labels - clean dark base',
// // //     category: 'carto',
// // //     minZoom: 5,
// // //   },

// // //   // ========== OPENSTREETMAP ==========

// // //   streets: {
// // //     url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
// // //     attribution: '&copy; OpenStreetMap contributors',
// // //     name: 'Streets',
// // //     maxZoom: 19,
// // //     description: 'Standard OpenStreetMap',
// // //     category: 'osm',
// // //     minZoom: 5,
// // //   },

// // //   humanitarian: {
// // //     url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
// // //     attribution: '&copy; OpenStreetMap contributors, Tiles: HOT',
// // //     name: 'Humanitarian',
// // //     maxZoom: 19,
// // //     description: 'Humanitarian OpenStreetMap (HOT)',
// // //     category: 'osm',
// // //     minZoom: 5,
// // //   },

// // //   terrain: {
// // //     url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
// // //     attribution: '&copy; OpenTopoMap (CC-BY-SA)',
// // //     name: 'Terrain',
// // //     maxZoom: 17,
// // //     description: 'OpenTopoMap topographic view',
// // //     category: 'osm',
// // //     minZoom: 5,
// // //   },

// // //   cycle: {
// // //     url: 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
// // //     attribution: '&copy; OpenStreetMap contributors, CyclOSM',
// // //     name: 'Cycle',
// // //     maxZoom: 18,
// // //     description: 'CyclOSM cycling-focused map',
// // //     category: 'osm',
// // //     minZoom: 5,
// // //   },

// // //   osmFrance: {
// // //     url: 'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
// // //     attribution: '&copy; OpenStreetMap France &copy; OpenStreetMap contributors',
// // //     name: 'OSM France',
// // //     maxZoom: 20,
// // //     description: 'OpenStreetMap France - detailed rendering',
// // //     category: 'osm',
// // //     minZoom: 5,
// // //   },

// // //   // ========== ESRI (FREE, NO API KEY) ==========

// // //   esriWorldStreet: {
// // //     url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
// // //     attribution: 'Tiles &copy; Esri',
// // //     name: 'Esri Street',
// // //     maxZoom: 18,
// // //     description: 'Esri World Street Map - detailed global streets',
// // //     category: 'esri',
// // //     minZoom: 5,
// // //   },

// // //   esriWorldImagery: {
// // //     url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
// // //     attribution: 'Tiles &copy; Esri, Maxar, Earthstar Geographics',
// // //     name: 'Satellite',
// // //     maxZoom: 18,
// // //     description: 'Esri World Imagery - satellite view',
// // //     category: 'esri',
// // //     minZoom: 5,
// // //   },
// // // };
// // import { MapViewMode } from '../types';

// // export interface MapTileConfig {
// //   url: string;
// //   attribution: string;
// //   name: string;
// //   maxZoom: number;
// //   description: string;
// //   category: 'osm' | 'stadia' | 'esri';
// //   minZoom: number;
// // }

// // // Reusable attribution string for Stadia maps
// // const STADIA_ATTRIBUTION = '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

// // export const MAP_TILES: Record<string, MapTileConfig> = {
// //   // ========== STADIA MAPS (Replaces CARTO - Beautiful, detailed) ==========
  
// //   cartoVoyager: {
// //     url: 'https://tiles.stadiamaps.com/tiles/outdoors/{z}/{x}/{y}{r}.png',
// //     attribution: STADIA_ATTRIBUTION,
// //     name: 'Outdoors (Voyager)',
// //     maxZoom: 20,
// //     description: 'Detailed, colorful topographic map with POIs',
// //     category: 'stadia',
// //     minZoom: 3,
// //   },

// //   cartoLight: {
// //     url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png',
// //     attribution: STADIA_ATTRIBUTION,
// //     name: 'Alidade Smooth (Positron)',
// //     maxZoom: 20,
// //     description: 'Minimal light basemap perfect for data overlays',
// //     category: 'stadia',
// //     minZoom: 3,
// //   },

// //   cartoDark: {
// //     url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
// //     attribution: STADIA_ATTRIBUTION,
// //     name: 'Alidade Dark',
// //     maxZoom: 20,
// //     description: 'Minimal dark basemap for high-contrast data',
// //     category: 'stadia',
// //     minZoom: 3,
// //   },

// //   // ========== CLEAN BASEMAPS (No Labels) ==========

// //   cartoVoyagerClean: {
// //     // Stadia's Stamen Terrain Background provides a beautiful natural look with zero labels
// //     url: 'https://tiles.stadiamaps.com/tiles/stamen_terrain_background/{z}/{x}/{y}{r}.png',
// //     attribution: STADIA_ATTRIBUTION + ' &copy; Stamen Design',
// //     name: 'Terrain (No Labels)',
// //     maxZoom: 18,
// //     description: 'Clean topographic map without any text',
// //     category: 'stadia',
// //     minZoom: 3,
// //   },

// //   cartoLightClean: {
// //     // Esri Light Canvas Base is a native pure-raster with zero text
// //     url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
// //     attribution: 'Tiles &copy; Esri, HERE, Garmin',
// //     name: 'Light Canvas (Clean)',
// //     maxZoom: 16,
// //     description: 'Pure light map without place labels',
// //     category: 'esri',
// //     minZoom: 3,
// //   },

// //   cartoDarkClean: {
// //     // Esri Dark Canvas Base is a native pure-raster with zero text
// //     url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
// //     attribution: 'Tiles &copy; Esri, HERE, Garmin',
// //     name: 'Dark Canvas (Clean)',
// //     maxZoom: 16,
// //     description: 'Pure dark map without place labels',
// //     category: 'esri',
// //     minZoom: 3,
// //   },

// //   // ========== OPENSTREETMAP ==========

// //   streets: {
// //     url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
// //     attribution: '&copy; OpenStreetMap contributors',
// //     name: 'Streets',
// //     maxZoom: 19,
// //     description: 'Standard OpenStreetMap',
// //     category: 'osm',
// //     minZoom: 5,
// //   },

// //   // ========== ESRI IMAGERY ==========

// //   esriWorldImagery: {
// //     url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
// //     attribution: 'Tiles &copy; Esri, Maxar, Earthstar Geographics',
// //     name: 'Satellite',
// //     maxZoom: 18,
// //     description: 'Esri World Imagery - satellite view',
// //     category: 'esri',
// //     minZoom: 5,
// //   },
// // };
// // // ============================================
// // // Map Constants
// // // ============================================

// // export const INDIA_CENTER: [number, number] = [20.5937, 78.9629];
// // export const DEFAULT_ZOOM = 5;
// // export const MIN_ZOOM = 5;
// // export const MAX_ZOOM = 18;
// // export const LINK_LABEL_ZOOM_THRESHOLD = 8;
// // export const CLUSTER_DISABLE_ZOOM = 12;
// // ============================================
// // Map Tile Configurations - ALL FREE & KEY-FREE FOREVER
// // ============================================
// // Rule for this file: never add a provider that can start demanding an API key
// // (CARTO basemaps and Stadia Maps both do this outside localhost).
// // Allowed providers:
// //   - OpenFreeMap  (vector styles, self-funded, no key, no rate limit)
// //   - OpenStreetMap / OpenTopoMap / CyclOSM (raster, no key)
// //   - Esri ArcGIS Online public basemaps (raster, no key)

// import { MapViewMode } from '../types';

// export interface MapTileConfig {
//   url: string;
//   attribution: string;
//   name: string;
//   maxZoom: number;
//   description: string;
//   category: 'osm' | 'carto' | 'clean' | 'esri';
//   minZoom: number;
//   /** When set, the basemap renders as a MapLibre vector style instead of raster tiles */
//   vectorStyle?: string;
// }

// const OFM_ATTRIBUTION =
//   '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | <a href="https://openfreemap.org">OpenFreeMap</a>';

// export const MAP_TILES: Record<MapViewMode, MapTileConfig> = {
//   // ========== GENERAL BASEMAPS (CARTO look-alikes via OpenFreeMap vector) ==========

//   cartoVoyager: {
//     url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
//     vectorStyle: 'https://tiles.openfreemap.org/styles/liberty',
//     attribution: OFM_ATTRIBUTION,
//     name: 'Voyager',
//     maxZoom: 20,
//     description: 'Colorful, detailed street basemap (Voyager style)',
//     category: 'carto',
//     minZoom: 3,
//   },

//   cartoLight: {
//     url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
//     vectorStyle: 'https://tiles.openfreemap.org/styles/positron',
//     attribution: OFM_ATTRIBUTION,
//     name: 'Positron',
//     maxZoom: 20,
//     description: 'Minimal light basemap (Positron style)',
//     category: 'carto',
//     minZoom: 3,
//   },

//   cartoDark: {
//     url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
//     vectorStyle: 'https://tiles.openfreemap.org/styles/dark',
//     attribution: OFM_ATTRIBUTION,
//     name: 'Dark Matter',
//     maxZoom: 20,
//     description: 'Dark basemap (Dark Matter style)',
//     category: 'carto',
//     minZoom: 3,
//   },

//   // ========== CLEAN BASEMAPS (no place labels) ==========

//   cartoVoyagerClean: {
//     url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
//     vectorStyle: 'https://tiles.openfreemap.org/styles/liberty',
//     attribution: OFM_ATTRIBUTION,
//     name: 'Voyager (No Labels)',
//     maxZoom: 20,
//     description: 'Voyager style with all text labels hidden',
//     category: 'clean',
//     minZoom: 3,
//   },

//   cartoLightClean: {
//     url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
//     attribution: 'Tiles &copy; Esri, HERE, Garmin',
//     name: 'Light Canvas (Clean)',
//     maxZoom: 16,
//     description: 'Pure light map without place labels',
//     category: 'clean',
//     minZoom: 3,
//   },

//   cartoDarkClean: {
//     url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
//     attribution: 'Tiles &copy; Esri, HERE, Garmin',
//     name: 'Dark Canvas (Clean)',
//     maxZoom: 16,
//     description: 'Pure dark map without place labels',
//     category: 'clean',
//     minZoom: 3,
//   },

//   // ========== OPENSTREETMAP ==========

//   streets: {
//     url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
//     attribution: '&copy; OpenStreetMap contributors',
//     name: 'Streets',
//     maxZoom: 19,
//     description: 'Standard OpenStreetMap',
//     category: 'osm',
//     minZoom: 5,
//   },

//   humanitarian: {
//     url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
//     attribution: '&copy; OpenStreetMap contributors, Tiles: HOT',
//     name: 'Humanitarian',
//     maxZoom: 19,
//     description: 'Humanitarian OpenStreetMap (HOT)',
//     category: 'osm',
//     minZoom: 5,
//   },

//   terrain: {
//     url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
//     attribution: '&copy; OpenTopoMap (CC-BY-SA)',
//     name: 'Terrain',
//     maxZoom: 17,
//     description: 'OpenTopoMap topographic view',
//     category: 'osm',
//     minZoom: 5,
//   },

//   cycle: {
//     url: 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
//     attribution: '&copy; OpenStreetMap contributors, CyclOSM',
//     name: 'Cycle',
//     maxZoom: 18,
//     description: 'CyclOSM cycling-focused map',
//     category: 'osm',
//     minZoom: 5,
//   },

//   osmFrance: {
//     url: 'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
//     attribution: '&copy; OpenStreetMap France &copy; OpenStreetMap contributors',
//     name: 'OSM France',
//     maxZoom: 20,
//     description: 'OpenStreetMap France - detailed rendering',
//     category: 'osm',
//     minZoom: 5,
//   },

//   // ========== ESRI (FREE, NO API KEY) ==========

//   esriWorldStreet: {
//     url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
//     attribution: 'Tiles &copy; Esri',
//     name: 'Esri Street',
//     maxZoom: 18,
//     description: 'Esri World Street Map - detailed global streets',
//     category: 'esri',
//     minZoom: 5,
//   },

//   esriWorldImagery: {
//     url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
//     attribution: 'Tiles &copy; Esri, Maxar, Earthstar Geographics',
//     name: 'Satellite',
//     maxZoom: 18,
//     description: 'Esri World Imagery - satellite view',
//     category: 'esri',
//     minZoom: 5,
//   },
// };

// /** Views that should hide every text label coming from the vector basemap */
// export const LABEL_FREE_VIEWS: MapViewMode[] = ['cartoVoyagerClean'];

// // ============================================
// // Map Constants
// // ============================================

// export const INDIA_CENTER: [number, number] = [20.5937, 78.9629];
// export const DEFAULT_ZOOM = 5;
// export const MIN_ZOOM = 5;
// export const MAX_ZOOM = 18;
// export const LINK_LABEL_ZOOM_THRESHOLD = 8;
// export const CLUSTER_DISABLE_ZOOM = 12;
import { MapViewMode } from '../types';

export interface MapTileConfig {
  url: string;
  attribution: string;
  name: string;
  maxZoom: number;
  description: string;
  category: 'osm' | 'carto' | 'clean' | 'esri';
  minZoom: number;
  /** When set, the basemap renders as a MapLibre vector style instead of raster tiles */
  vectorStyle?: string;
}

// Reusable attributions for proper legal compliance
const OFM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | <a href="https://openfreemap.org">OpenFreeMap</a>';

const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const ESRI_ATTRIBUTION =
  'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';

const WIKIMEDIA_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://foundation.wikimedia.org/wiki/Maps_Terms_of_Use">Wikimedia</a>';

// Note: Ensure that 'ofmBright' and 'wikimedia' are added to your MapViewMode union type in '../types'
export const MAP_TILES: Record<string, MapTileConfig> = {
  // ========== NEW HIGHLIGHT: VIBRANT MAPS ==========

  ofmBright: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', // standard OSM fallback
    vectorStyle: 'https://tiles.openfreemap.org/styles/bright',
    attribution: OFM_ATTRIBUTION,
    name: 'OFM Bright',
    maxZoom: 20,
    description: 'Vibrant, colorful street map similar to Voyager',
    category: 'carto', 
    minZoom: 3,
  },

  wikimedia: {
    // ⚠️ WARNING: Wikimedia restricts use of their tiles in production third-party apps. Fine for localhost/dev.
    url: 'https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png',
    attribution: WIKIMEDIA_ATTRIBUTION,
    name: 'Wikimedia',
    maxZoom: 19,
    description: 'Clean, professional map by the Wikimedia Foundation',
    category: 'osm',
    minZoom: 3,
  },

  // ========== GENERAL BASEMAPS (Vector maps via OpenFreeMap) ==========
  
  cartoVoyager: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    vectorStyle: 'https://tiles.openfreemap.org/styles/liberty',
    attribution: OFM_ATTRIBUTION,
    name: 'Voyager',
    maxZoom: 20,
    description: 'Colorful, detailed street basemap (Liberty/Voyager style)',
    category: 'carto',
    minZoom: 3,
  },

  cartoLight: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    vectorStyle: 'https://tiles.openfreemap.org/styles/positron',
    attribution: OFM_ATTRIBUTION,
    name: 'Positron',
    maxZoom: 20,
    description: 'Minimal light basemap (Positron style)',
    category: 'carto',
    minZoom: 3,
  },

  cartoDark: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    vectorStyle: 'https://tiles.openfreemap.org/styles/dark',
    attribution: OFM_ATTRIBUTION,
    name: 'Dark Matter',
    maxZoom: 20,
    description: 'Dark basemap (Dark Matter style)',
    category: 'carto',
    minZoom: 3,
  },

  // ========== CLEAN BASEMAPS (no place labels) ==========

  cartoVoyagerClean: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    vectorStyle: 'https://tiles.openfreemap.org/styles/liberty',
    attribution: OFM_ATTRIBUTION,
    name: 'Voyager (No Labels)',
    maxZoom: 20,
    description: 'Voyager style with all text labels hidden',
    category: 'clean',
    minZoom: 3,
  },

  cartoLightClean: {
    // Esri's Canvas layers are public and natively have no labels.
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri, HERE, Garmin',
    name: 'Light Canvas (Clean)',
    maxZoom: 16,
    description: 'Pure light map without place labels',
    category: 'clean',
    minZoom: 3,
  },

  cartoDarkClean: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri, HERE, Garmin',
    name: 'Dark Canvas (Clean)',
    maxZoom: 16,
    description: 'Pure dark map without place labels',
    category: 'clean',
    minZoom: 3,
  },

  // ========== OPENSTREETMAP (Free public raster layers) ==========

  streets: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: OSM_ATTRIBUTION,
    name: 'Streets',
    maxZoom: 19,
    description: 'Standard OpenStreetMap',
    category: 'osm',
    minZoom: 5,
  },

  humanitarian: {
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: OSM_ATTRIBUTION + ', Tiles: HOT',
    name: 'Humanitarian',
    maxZoom: 19,
    description: 'Humanitarian OpenStreetMap (HOT)',
    category: 'osm',
    minZoom: 5,
  },

  terrain: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenTopoMap (CC-BY-SA) &copy; OpenStreetMap contributors',
    name: 'Terrain',
    maxZoom: 17,
    description: 'OpenTopoMap topographic view',
    category: 'osm',
    minZoom: 5,
  },

  cycle: {
    url: 'https://{s}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
    attribution: OSM_ATTRIBUTION + ', CyclOSM',
    name: 'Cycle',
    maxZoom: 18,
    description: 'CyclOSM cycling-focused map',
    category: 'osm',
    minZoom: 5,
  },

  osmFrance: {
    url: 'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap France ' + OSM_ATTRIBUTION,
    name: 'OSM France',
    maxZoom: 20,
    description: 'OpenStreetMap France - detailed rendering',
    category: 'osm',
    minZoom: 5,
  },

  // ========== ESRI (FREE, NO API KEY) ==========

  esriWorldStreet: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: ESRI_ATTRIBUTION,
    name: 'Esri Street',
    maxZoom: 18,
    description: 'Esri World Street Map - detailed global streets',
    category: 'esri',
    minZoom: 5,
  },

  esriWorldImagery: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri, Maxar, Earthstar Geographics',
    name: 'Satellite',
    maxZoom: 18,
    description: 'Esri World Imagery - satellite view',
    category: 'esri',
    minZoom: 5,
  },
};

/** Views that should hide every text label coming from the vector basemap */
export const LABEL_FREE_VIEWS: string[] = ['cartoVoyagerClean'];

// ============================================
// Map Constants
// ============================================

export const INDIA_CENTER: [number, number] = [20.5937, 78.9629];
export const DEFAULT_ZOOM = 5;
export const MIN_ZOOM = 5;
export const MAX_ZOOM = 18;
export const LINK_LABEL_ZOOM_THRESHOLD = 8;
export const CLUSTER_DISABLE_ZOOM = 12;