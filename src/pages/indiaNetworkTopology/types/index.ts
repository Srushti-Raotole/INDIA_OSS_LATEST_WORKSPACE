// export interface FilterState {
//   /** Circuit types to show: 'NLD', 'METRO', etc. (empty = all) */
//   types: string[];
//   /** Utilization levels to show: 'high', 'medium', 'low' (empty = all) */
//   utilizationLevels: ('high' | 'medium' | 'low')[];
//   /** Circle codes to show (empty = all) */
//   circles: string[];
//   /** Technology types to show: 'CIENA', etc. (empty = all) */
//   technologies: string[];
//   /** Domain types to show: 'IP', 'OPTICAL' (empty = all) */
//   domainTypes: DomainType[];
//   /** Path types to show: 'P' (Protected), 'W' (Working), 'OTHER' (empty = all) */
//   pathTypes: PathType[];
//   /** Sector names to show (empty = all) */
//   sectors: string[];
// }

// /** Default filter state - show all data */
// export const DEFAULT_FILTERS: FilterState = {
//   types: [],
//   utilizationLevels: [],
//   circles: [],
//   technologies: [],
//   domainTypes: [],
//   pathTypes: [],
//   sectors: [],
// };

// /** Available technology types for filtering */
// export const AVAILABLE_TECHNOLOGIES = ['CIENA', 'NOKIA'] as const;

// /** Available domain types for filtering */
// export const AVAILABLE_DOMAIN_TYPES: DomainType[] = ['IP', 'OPTICAL'];

// /** Available path types for filtering */
// export const AVAILABLE_PATH_TYPES: PathType[] = ['P', 'W', 'OTHER'];

// // ============================================
// // View Mode Types
// // ============================================

// /** Link coloring mode - Utilization (color by %) or Domain (IP=blue, OPTICAL=orange) */
// export type LinkColorMode = 'utilization' | 'domain';

// // ============================================
// // India Network Topology - Type Definitions
// // ============================================
// // Central type definitions for the network topology visualization
// //
// // ADDING NEW TYPES:
// // 1. Define interface/type here
// // 2. Export at bottom of file
// // 3. Import in components as needed

// // ============================================
// // Circuit Data Types
// // ============================================

// /**
//  * Circuit Data represents a single network circuit connection
//  * Contains information about source (popA) and destination (popZ) endpoints
//  * 
//  * DATA SOURCE: This structure matches the expected API response
//  * CHANGE THIS: Modify fields to match your actual data schema
//  */
// export interface CircuitData {
//   /** Unique channel identifier */
//   channelName: string;
  
//   /** Connection type - used for link styling */
//   type: string; // 'NLD' | 'METRO' etc. - Add more types as needed
  
//   /** Technology type - used for filtering */
//   technology?: string; // 'CIENA' etc.
  
//   // Source endpoint (popA)
//   popACircle: string;      // Region/circle code (e.g., 'MH', 'TN')
//   popASiteName: string;    // Human-readable site name
//   popA: string;            // Technical node identifier
//   popAPort: string;        // Port identifier
//   popALat: number;         // Latitude coordinate
//   popALon: number;         // Longitude coordinate
  
//   // Destination endpoint (popZ)
//   popZCircle: string;
//   popZSiteName: string;
//   popZ: string;
//   popZPort: string;
//   popZLat: number;
//   popZLon: number;
  
//   // Location names
//   cityA: string;
//   cityZ: string;
  
//   // Technical specifications
//   layerRate: string;           // e.g., 'ODUCn' - Channel layer rate
//   layerRateCircuit: string;    // e.g., 'DSR_ETHERNET', 'ETHERNET' - Circuit layer rate
  
//   // Capacity information
//   createdCapacity: number;     // Total capacity in Gbps
//   usedCapacity: number;        // Used capacity in Gbps
//   utilizationPercent: number;  // 0-100 percentage (API field: utilizatoinPercent)
  
//   // Metadata
//   circuitUserLabel: string;    // User-friendly circuit label
//   customerName: string;        // Customer name (may be empty)
  
//   // Domain view fields
//   qualifier?: string;          // e.g., '100G' - Capacity qualifier
//   circuitType?: DomainType;    // 'IP' | 'OPTICAL' - Used for domain-based coloring
  
//   // Path and sector fields
//   path?: PathType;             // 'P' (Protected), 'W' (Working), 'OTHER'
//   sector?: string;             // Sector identifier (e.g., 'OTHER')
// }

// /** Connection types for the network */
// export type ConnectionType = 'NLD' | 'METRO';

// /** Circuit/Domain types for link coloring */
// export type DomainType = 'IP' | 'OPTICAL';

// /** Path types for filtering */
// export type PathType = 'P' | 'W' | 'OTHER';

// // ============================================
// // Network Node Types
// // ============================================

// /**
//  * Network Node represents a point on the map (either source or destination)
//  * 
//  * CUSTOMIZATION:
//  * - Add status field for node coloring
//  * - Add icon field for custom node icons
//  * - See NodesLayer.tsx for icon customization
//  */
// export interface NetworkNode {
//   /** Unique node identifier (generated from name + coordinates) */
//   id: string;
  
//   /** Technical node name (popA or popZ value) */
//   name: string;
  
//   /** Human-readable site name for display */
//   siteName: string;
  
//   /** Region/circle code */
//   circle: string;
  
//   /** Port identifier */
//   port: string;
  
//   /** Geographic coordinates */
//   lat: number;
//   lon: number;
  
//   /** City name */
//   city: string;
  
//   /** Node type indicator */
//   type: 'source' | 'destination';
  
//   /** Technology type (e.g., 'CIENA') */
//   technology?: string;
  
//   /** Associated circuits passing through this node */
//   circuits: CircuitData[];
  
//   // FUTURE: Add these fields for enhanced visualization
//   // status?: 'active' | 'warning' | 'critical' | 'offline';
//   // iconType?: 'router' | 'switch' | 'server' | 'datacenter';
// }

// // ============================================
// // Network Link Types
// // ============================================

// /**
//  * Network Link represents a connection between two nodes
//  * 
//  * LINK STYLING (see LinksLayer.tsx):
//  * - Color: Based on utilizationPercent (see colorUtils.ts)
//  * - Width: Modify weight property in LinksLayer
//  * - Style: Solid for NLD, dashed for METRO
//  */
// export interface NetworkLink {
//   /** Unique link identifier (channel name) */
//   id: string;
  
//   /** Source node reference */
//   source: NetworkNode;
  
//   /** Target node reference */
//   target: NetworkNode;
  
//   /** Associated circuit data */
//   circuit: CircuitData;
  
//   /** Current utilization (0-100) - determines link color */
//   utilizationPercent: number;
  
//   /** Total link capacity in Gbps */
//   capacity: number;
  
//   /** Used capacity in Gbps */
//   usedCapacity: number;
  
//   // FUTURE: Add alarm fields for link coloring
//   // alarmSeverity?: 'critical' | 'major' | 'minor' | 'warning' | 'clear';
// }

// // ============================================
// // Statistics Types
// // ============================================

// /**
//  * Statistics summary for the network
//  * Displayed in MapStatisticsPanel component
//  */
// export interface NetworkStatistics {
//   totalNodes: number;
//   totalLinks: number;
//   totalCapacity: number;    // Total Gbps
//   totalUsed: number;        // Used Gbps
//   avgUtilization: number;   // Average percentage
//   highUtilLinks: number;    // Links >= 80%
//   mediumUtilLinks: number;  // Links 50-79%
//   lowUtilLinks: number;     // Links < 50%
// }

// // ============================================
// // UI State Types
// // ============================================

// /**
//  * Position for tooltips and other floating elements
//  */
// export interface TooltipPosition {
//   x: number;
//   y: number;
// }

// /**
//  * Search/filter state for nodes
//  */
// export interface SearchFilter {
//   query: string;
//   circle?: string;
//   city?: string;
//   type?: string;
// }

// export type MapViewMode = 
//   | 'streets'            // OpenStreetMap Standard (FREE, UNLIMITED)
//   | 'humanitarian'       // OSM Humanitarian HOT (FREE, UNLIMITED)
//   | 'terrain'            // OpenTopoMap (FREE, UNLIMITED)
//   | 'cycle'              // CyclOSM (FREE, UNLIMITED)
//   | 'cartoVoyager'       // CartoDB Voyager (FREE, UNLIMITED)
//   | 'cartoLight'         // CartoDB Positron light (FREE, UNLIMITED)
//   | 'cartoDark'          // CartoDB Dark Matter (FREE, UNLIMITED)
//   | 'cartoVoyagerNoLabel' // CartoDB Voyager No Labels (FREE, UNLIMITED)
//   | 'cartoLightNoLabel'  // CartoDB Positron No Labels (FREE, UNLIMITED)
//   | 'cartoDarkNoLabel'   // CartoDB Dark No Labels (FREE, UNLIMITED)
//   | 'osmFrance'          // OSM France (FREE, UNLIMITED)
//   | 'esriWorldStreet'    // Esri World Street Map (FREE)
//   | 'esriWorldImagery';  // Esri World Imagery Satellite (FREE)

// ============================================
// Filter State for circuit type, technology, and utilization filtering
// Used by FilterDialog and main component for data filtering
// ============================================
export interface FilterState {
  /** Circuit types to show: 'NLD', 'METRO', etc. (empty = all) */
  types: string[];
  /** Utilization levels to show: 'high', 'medium', 'low' (empty = all) */
  utilizationLevels: ('high' | 'medium' | 'low')[];
  /** Circle codes to show (empty = all) */
  circles: string[];
  /** Technology types to show: 'CIENA', etc. (empty = all) */
  technologies: string[];
  /** Domain types to show: 'IP', 'OPTICAL' (empty = all) */
  domainTypes: DomainType[];
  /** Path types to show: 'P' (Protected), 'W' (Working), 'OTHER' (empty = all) */
  pathTypes: PathType[];
  /** Sector names to show (empty = all) */
  sectors: string[];
}

/** Default filter state - show all data */
export const DEFAULT_FILTERS: FilterState = {
  types: [],
  utilizationLevels: [],
  circles: [],
  technologies: [],
  domainTypes: [],
  pathTypes: [],
  sectors: [],
};

/** Available technology types for filtering */
export const AVAILABLE_TECHNOLOGIES = ['CIENA', 'NOKIA'] as const;

/** Available domain types for filtering */
export const AVAILABLE_DOMAIN_TYPES: DomainType[] = ['IP', 'OPTICAL'];

/** Available path types for filtering */
export const AVAILABLE_PATH_TYPES: PathType[] = ['P', 'W', 'OTHER'];

// ============================================
// View Mode Types
// ============================================

/** Link coloring mode - Utilization (color by %) or Domain (IP=blue, OPTICAL=orange) */
export type LinkColorMode = 'utilization' | 'domain';

// ============================================
// India Network Topology - Type Definitions
// ============================================
// Central type definitions for the network topology visualization
//
// ADDING NEW TYPES:
// 1. Define interface/type here
// 2. Export at bottom of file
// 3. Import in components as needed

// ============================================
// Circuit Data Types
// ============================================

/**
 * Circuit Data represents a single network circuit connection
 * Contains information about source (popA) and destination (popZ) endpoints
 * 
 * DATA SOURCE: This structure matches the expected API response
 * CHANGE THIS: Modify fields to match your actual data schema
 */
export interface CircuitData {
  /** Unique channel identifier */
  channelName: string;
  
  /** Connection type - used for link styling */
  type: string; // 'NLD' | 'METRO' etc. - Add more types as needed
  
  /** Technology type - used for filtering */
  technology?: string; // 'CIENA' etc.
  
  // Source endpoint (popA)
  popACircle: string;      // Region/circle code (e.g., 'MH', 'TN')
  popASiteName: string;    // Human-readable site name
  popA: string;            // Technical node identifier
  popAPort: string;        // Port identifier
  popALat: number;         // Latitude coordinate
  popALon: number;         // Longitude coordinate
  
  // Destination endpoint (popZ)
  popZCircle: string;
  popZSiteName: string;
  popZ: string;
  popZPort: string;
  popZLat: number;
  popZLon: number;
  
  // Location names
  cityA: string;
  cityZ: string;
  
  // Technical specifications
  layerRate: string;           // e.g., 'ODUCn' - Channel layer rate
  layerRateCircuit: string;    // e.g., 'DSR_ETHERNET', 'ETHERNET' - Circuit layer rate
  
  // Capacity information
  createdCapacity: number;     // Total capacity in Gbps
  usedCapacity: number;        // Used capacity in Gbps
  utilizationPercent: number;  // 0-100 percentage (API field: utilizatoinPercent)
  
  // Metadata
  circuitUserLabel: string;    // User-friendly circuit label
  customerName: string;        // Customer name (may be empty)
  
  // Domain view fields
  qualifier?: string;          // e.g., '100G' - Capacity qualifier
  circuitType?: DomainType;    // 'IP' | 'OPTICAL' - Used for domain-based coloring
  
  // Path and sector fields
  path?: PathType;             // 'P' (Protected), 'W' (Working), 'OTHER'
  sector?: string;             // Sector identifier (e.g., 'OTHER')
}

/** Connection types for the network */
export type ConnectionType = 'NLD' | 'METRO';

/** Circuit/Domain types for link coloring */
export type DomainType = 'IP' | 'OPTICAL';

/** Path types for filtering */
export type PathType = 'P' | 'W' | 'OTHER';

// ============================================
// Network Node Types
// ============================================

/**
 * Network Node represents a point on the map (either source or destination)
 * 
 * CUSTOMIZATION:
 * - Add status field for node coloring
 * - Add icon field for custom node icons
 * - See NodesLayer.tsx for icon customization
 */
export interface NetworkNode {
  /** Unique node identifier (generated from name + coordinates) */
  id: string;
  
  /** Technical node name (popA or popZ value) */
  name: string;
  
  /** Human-readable site name for display */
  siteName: string;
  
  /** Region/circle code */
  circle: string;
  
  /** Port identifier */
  port: string;
  
  /** Geographic coordinates */
  lat: number;
  lon: number;
  
  /** City name */
  city: string;
  
  /** Node type indicator */
  type: 'source' | 'destination';
  
  /** Technology type (e.g., 'CIENA') */
  technology?: string;
  
  /** Associated circuits passing through this node */
  circuits: CircuitData[];
  
  // FUTURE: Add these fields for enhanced visualization
  // status?: 'active' | 'warning' | 'critical' | 'offline';
  // iconType?: 'router' | 'switch' | 'server' | 'datacenter';
}

// ============================================
// Network Link Types
// ============================================

/**
 * Network Link represents a connection between two nodes
 * 
 * LINK STYLING (see LinksLayer.tsx):
 * - Color: Based on utilizationPercent (see colorUtils.ts)
 * - Width: Modify weight property in LinksLayer
 * - Style: Solid for NLD, dashed for METRO
 */
export interface NetworkLink {
  /** Unique link identifier (channel name) */
  id: string;
  
  /** Source node reference */
  source: NetworkNode;
  
  /** Target node reference */
  target: NetworkNode;
  
  /** Associated circuit data */
  circuit: CircuitData;
  
  /** Current utilization (0-100) - determines link color */
  utilizationPercent: number;
  
  /** Total link capacity in Gbps */
  capacity: number;
  
  /** Used capacity in Gbps */
  usedCapacity: number;
  
  // FUTURE: Add alarm fields for link coloring
  // alarmSeverity?: 'critical' | 'major' | 'minor' | 'warning' | 'clear';
}

// ============================================
// Statistics Types
// ============================================

/**
 * Statistics summary for the network
 * Displayed in MapStatisticsPanel component
 */
export interface NetworkStatistics {
  totalNodes: number;
  totalLinks: number;
  totalCapacity: number;    // Total Gbps
  totalUsed: number;        // Used Gbps
  avgUtilization: number;   // Average percentage
  highUtilLinks: number;    // Links >= 80%
  mediumUtilLinks: number;  // Links 50-79%
  lowUtilLinks: number;     // Links < 50%
}

// ============================================
// UI State Types
// ============================================

/**
 * Position for tooltips and other floating elements
 */
export interface TooltipPosition {
  x: number;
  y: number;
}

/**
 * Search/filter state for nodes
 */
export interface SearchFilter {
  query: string;
  circle?: string;
  city?: string;
  type?: string;
}

// ============================================
// Map Configuration Types
// ============================================

/**
 * Map view modes available - ALL FREE & OPEN SOURCE
 * 
 * ADDING NEW VIEW:
 * 1. Add mode here
 * 2. Add tile config in constants/mapTiles.ts
 * 3. Add icon in MapViewSelector.tsx
 */
// export type MapViewMode = 
//   | 'streets'            // OpenStreetMap Standard (FREE, NO KEY)
//   | 'humanitarian'       // OSM Humanitarian HOT (FREE, NO KEY)
//   | 'terrain'            // OpenTopoMap (FREE, NO KEY)
//   | 'cycle'              // CyclOSM (FREE, NO KEY)
//   | 'cartoVoyager'       // OpenFreeMap Liberty vector (FREE, NO KEY)
//   | 'cartoLight'         // OpenFreeMap Positron vector (FREE, NO KEY)
//   | 'cartoDark'          // OpenFreeMap Dark vector (FREE, NO KEY)
//   | 'cartoVoyagerClean'  // OpenFreeMap Liberty, labels hidden (FREE, NO KEY)
//   | 'cartoLightClean'    // Esri Light Gray Base, no labels (FREE, NO KEY)
//   | 'cartoDarkClean'     // Esri Dark Gray Base, no labels (FREE, NO KEY)
//   | 'osmFrance'          // OSM France (FREE, NO KEY)
//   | 'esriWorldStreet'    // Esri World Street Map (FREE, NO KEY)
//   | 'esriWorldImagery';  // Esri World Imagery Satellite (FREE, NO KEY)

export type MapViewMode = 
  // ========== OPENMAPTILES (via MapTiler) ==========
  | 'omtStreets'         // MapTiler Streets v2
  | 'omtSatellite'       // MapTiler Satellite
  | 'omtOutdoor'         // MapTiler Outdoor v2
  | 'omtBasic'           // MapTiler Basic v2
  | 'omtLight'           // MapTiler Dataviz Light
  
  // ========== VIBRANT & HIGHLIGHT MAPS ==========
  | 'ofmBright'          // OpenFreeMap Bright vector (FREE, NO KEY)
  | 'wikimedia'          // Wikimedia Maps (FREE for dev)
  
  // ========== OPENFREEMAP GENERAL BASEMAPS ==========
  | 'cartoVoyager'       // OpenFreeMap Liberty vector (FREE, NO KEY)
  | 'cartoLight'         // OpenFreeMap Positron vector (FREE, NO KEY)
  | 'cartoDark'          // OpenFreeMap Dark vector (FREE, NO KEY)
  
  // ========== CLEAN BASEMAPS ==========
  | 'cartoVoyagerClean'  // OpenFreeMap Liberty, labels hidden (FREE, NO KEY)
  | 'omtLightClean'      // MapTiler Dataviz Light, clean
  | 'omtDarkClean';      // MapTiler Dataviz Dark, clean