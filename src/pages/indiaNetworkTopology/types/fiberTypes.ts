
export interface FiberSite {
  /** Unique site identifier */
  id: string;
  /** Node name (technical identifier) */
  nodeName: string;
  /** Node IP address */
  nodeIP: string;
  /** ERP Site Name — primary display name */
  name: string;
  /** Latitude */
  latitude: number;
  /** Longitude */
  longitude: number;
  /** [longitude, latitude] for backward compat with map layers */
  coordinates: [number, number];
  /** Technology type (e.g., 'Ciena') */
  technology: string;
  /** Connection type (e.g., 'NLD') */
  connType: string;
  /** Associated link name — kept for filtering compat */
  linkName: string;
  /** Sequence number in link (optional) */
  seq?: number;
  /** Layer identifier (optional) */
  layer: string;
}

/**
 * Fiber Route from /v1/dashboard/fiber/routes
 */
export interface FiberRoute {
  /** Unique route identifier */
  id: string;
  /** Route name */
  routeName: string;
  /** Associated link name */
  linkName: string;
  /** Construction status */
  construction: string;
  /** Route length in kilometers */
  lengthKms: number;
  /** Route type (e.g., 'NLD', 'METRO') */
  type: string;
  /** Methodology (e.g., 'OPGW', 'UG') */
  methodology: string;
  /** Color from KML style (hex) */
  color: string;
  /** Array of [longitude, latitude] coordinates */
  coordinates: [number, number][];
  /** Layer identifier */
  layer: string;
  /** Span ID — used for alarm correlation */
  spanid: string;
}

/**
 * Combined fiber data
 */
export interface FiberData {
  sites: FiberSite[];
  routes: FiberRoute[];
}

/**
 * Fiber layer visibility state
 */
export interface FiberLayerState {
  showRoutes: boolean;
  showSites: boolean;
}

export const DEFAULT_FIBER_LAYER_STATE: FiberLayerState = {
  showRoutes: true,
  showSites: true,
};

/**
 * Fiber filter state
 */
export interface FiberFilterState {
  types: string[];
  technologies: string[];
  methodologies: string[];
  linkNames: string[];
  constructions: string[];
  routeNames: string[];
}

export const DEFAULT_FIBER_FILTERS: FiberFilterState = {
  types: [],
  technologies: [],
  methodologies: [],
  linkNames: [],
  constructions: [],
  routeNames: [],
};

export const AVAILABLE_CONSTRUCTIONS = ['Completed', 'Work In Progress'] as const;
export const AVAILABLE_METHODOLOGIES = ['OPGW', 'UG', 'AERIAL', 'UTILITY'] as const;
