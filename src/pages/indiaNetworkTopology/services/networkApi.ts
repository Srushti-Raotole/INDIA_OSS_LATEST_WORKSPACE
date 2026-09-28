

import { GET_CKT_CHANNEL_DETAILS } from "@/api/apis";
import axiosClient from "@/api/axiosClient";
import { CircuitData, NetworkNode, NetworkLink, NetworkStatistics } from '../types';

const apiClient = axiosClient;

// ============================================
// API Response Types
// ============================================

/**
 * Standard API response wrapper
 * All API responses follow this structure
 */
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message: string;
  timestamp: string;
}

// ============================================
// Circuit Data API
// ============================================

/**
 * Fetch all circuit data from getCktChannelDetails API
 */
export async function fetchCircuits(): Promise<CircuitData[]> {
  try {
    const response = await apiClient.get<CircuitData[]>(GET_CKT_CHANNEL_DETAILS, {
      params: { type: 'ALL' },
    });
    return response.data;
  } catch (error) {
    console.error('[networkApi] fetchCircuits failed:', error);
    return [];
  }
}

/**
 * Fetch circuits by circle/region
 * 
 * @param circle - Circle code (e.g., 'MH', 'TN')
 * @returns Promise<CircuitData[]> - Filtered circuit data
 * 
 * FUTURE: GET /api/v1/circuits?circle={circle}
 */
export async function fetchCircuitsByCircle(circle: string): Promise<CircuitData[]> {
  const allCircuits = await fetchCircuits();
  return allCircuits.filter(
    c => c.popACircle === circle || c.popZCircle === circle
  );
}

/**
 * Fetch circuits by type (NLD, METRO, etc.)
 * 
 * @param type - Circuit type
 * @returns Promise<CircuitData[]> - Filtered circuit data
 * 
 * FUTURE: GET /api/v1/circuits?type={type}
 */
export async function fetchCircuitsByType(type: string): Promise<CircuitData[]> {
  const allCircuits = await fetchCircuits();
  return allCircuits.filter(c => c.type === type);
}

/**
 * Fetch high utilization circuits (alarm candidates)
 * 
 * @param threshold - Utilization percentage threshold (default: 80)
 * @returns Promise<CircuitData[]> - Circuits above threshold
 * 
 * FUTURE: GET /api/v1/circuits/high-utilization?threshold={threshold}
 */
export async function fetchHighUtilizationCircuits(threshold = 80): Promise<CircuitData[]> {
  const allCircuits = await fetchCircuits();
  return allCircuits.filter(c => c.utilizationPercent >= threshold);
}

// ============================================
// Node Data API
// ============================================

/**
 * Process circuits into network nodes
 * 
 * @param circuits - Array of circuit data
 * @returns NetworkNode[] - Processed nodes with circuit associations
 * 
 * NODE STRUCTURE:
 * - Each unique popA/popZ becomes a node
 * - Circuits are attached to their respective nodes
 * - Node size can be customized based on circuit count (see NodesLayer.tsx)
 */
export function processCircuitsToNodes(circuits: CircuitData[]): NetworkNode[] {
  const nodesMap = new Map<string, NetworkNode>();

  /**
   * Generate unique key for node identification
   * Uses name + lat + lon for uniqueness
   */
  const generateNodeKey = (name: string, lat: number, lon: number): string => 
    `${name}-${lat}-${lon}`;

  circuits.forEach((circuit) => {
    // Process source node (popA)
    const sourceKey = generateNodeKey(circuit.popA, circuit.popALat, circuit.popALon);
    if (!nodesMap.has(sourceKey)) {
      nodesMap.set(sourceKey, {
        id: sourceKey,
        name: circuit.popA,
        siteName: circuit.popASiteName,
        circle: circuit.popACircle,
        port: circuit.popAPort,
        lat: circuit.popALat,
        lon: circuit.popALon,
        city: circuit.cityA,
        type: 'source',
        circuits: [],
      });
    }
    nodesMap.get(sourceKey)!.circuits.push(circuit);

    // Process destination node (popZ)
    const destKey = generateNodeKey(circuit.popZ, circuit.popZLat, circuit.popZLon);
    if (!nodesMap.has(destKey)) {
      nodesMap.set(destKey, {
        id: destKey,
        name: circuit.popZ,
        siteName: circuit.popZSiteName,
        circle: circuit.popZCircle,
        port: circuit.popZPort,
        lat: circuit.popZLat,
        lon: circuit.popZLon,
        city: circuit.cityZ,
        type: 'destination',
        circuits: [],
      });
    }
    nodesMap.get(destKey)!.circuits.push(circuit);
  });

  return Array.from(nodesMap.values());
}

// ============================================
// Link Data API
// ============================================

/**
 * Process circuits into network links
 * 
 * @param circuits - Array of circuit data
 * @param nodes - Array of processed nodes
 * @returns NetworkLink[] - Links between nodes
 * 
 * LINK CUSTOMIZATION (see LinksLayer.tsx):
 * - Weight (thickness): Modify 'weight' property (default: 2)
 * - Color: Based on utilization (see colorUtils.ts)
 * - Style: Solid for NLD, dashed for METRO
 */
export function processCircuitsToLinks(
  circuits: CircuitData[], 
  nodes: NetworkNode[]
): NetworkLink[] {
  const generateNodeKey = (name: string, lat: number, lon: number): string => 
    `${name}-${lat}-${lon}`;

  const nodesMap = new Map(nodes.map(n => [n.id, n]));

  return circuits.map((circuit) => {
    const sourceKey = generateNodeKey(circuit.popA, circuit.popALat, circuit.popALon);
    const targetKey = generateNodeKey(circuit.popZ, circuit.popZLat, circuit.popZLon);

    return {
      id: circuit.channelName,
      source: nodesMap.get(sourceKey)!,
      target: nodesMap.get(targetKey)!,
      circuit,
      utilizationPercent: circuit.utilizationPercent,
      capacity: circuit.createdCapacity,
      usedCapacity: circuit.usedCapacity,
    };
  });
}

// ============================================
// Statistics API
// ============================================

/**
 * Calculate network statistics from processed data
 * 
 * @param nodes - Array of network nodes
 * @param links - Array of network links
 * @returns NetworkStatistics - Computed statistics
 */
export function calculateStatistics(
  nodes: NetworkNode[], 
  links: NetworkLink[]
): NetworkStatistics {
  const totalCapacity = links.reduce((sum, l) => sum + l.capacity, 0);
  const totalUsed = links.reduce((sum, l) => sum + l.usedCapacity, 0);
  const avgUtilization = links.length > 0
    ? Math.round(links.reduce((sum, l) => sum + l.utilizationPercent, 0) / links.length)
    : 0;

  return {
    totalNodes: nodes.length,
    totalLinks: links.length,
    totalCapacity,
    totalUsed,
    avgUtilization,
    highUtilLinks: links.filter(l => l.utilizationPercent >= 80).length,
    mediumUtilLinks: links.filter(l => l.utilizationPercent >= 50 && l.utilizationPercent < 80).length,
    lowUtilLinks: links.filter(l => l.utilizationPercent < 50).length,
  };
}

// ============================================
// Search API
// ============================================

/**
 * Search nodes by query string
 * Matches against siteName, city, circle, and node ID
 * 
 * @param nodes - Array of nodes to search
 * @param query - Search query string
 * @returns NetworkNode[] - Matching nodes
 */
export function searchNodes(nodes: NetworkNode[], query: string): NetworkNode[] {
  if (!query.trim()) return nodes;
  
  const lowerQuery = query.toLowerCase();
  return nodes.filter(node => 
    node.siteName.toLowerCase().includes(lowerQuery) ||
    node.city.toLowerCase().includes(lowerQuery) ||
    node.circle.toLowerCase().includes(lowerQuery) ||
    node.name.toLowerCase().includes(lowerQuery)
  );
}

// ============================================
// Export API Client for advanced usage
// ============================================
export { apiClient };
