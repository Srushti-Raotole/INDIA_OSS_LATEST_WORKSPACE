
import { NetworkNode, CircuitData } from '../types';


export function getDistinctChannels(circuits: CircuitData[]): CircuitData[] {
  const channelMap = new Map<string, CircuitData>();
  
  circuits.forEach(circuit => {
    // Only add if not already present (first occurrence wins)
    if (!channelMap.has(circuit.channelName)) {
      channelMap.set(circuit.channelName, circuit);
    }
  });
  
  return Array.from(channelMap.values());
}

/**
 * Calculate total capacity for a node from its circuits
 * Uses DISTINCT channelName - same channel counted once
 * 
 * FORMULA: Sum of createdCapacity for unique channelNames
 */
export function calculateNodeCapacity(node: NetworkNode): number {
  const distinctChannels = getDistinctChannels(node.circuits);
  return distinctChannels.reduce((sum, c) => sum + c.createdCapacity, 0);
}

/**
 * Calculate total used capacity for a node
 * Uses DISTINCT channelName - same channel counted once
 */
export function calculateNodeUsedCapacity(node: NetworkNode): number {
  const distinctChannels = getDistinctChannels(node.circuits);
  return distinctChannels.reduce((sum, c) => sum + c.usedCapacity, 0);
}

/**
 * Calculate average utilization for a node
 * Uses DISTINCT channelName for accurate calculation
 * 
 * FORMULA: (Total Used / Total Created) * 100
 * NOT simple average of utilization percentages
 */
export function calculateNodeAvgUtilization(node: NetworkNode): number {
  const distinctChannels = getDistinctChannels(node.circuits);
  if (distinctChannels.length === 0) return 0;
  
  const totalCapacity = distinctChannels.reduce((sum, c) => sum + c.createdCapacity, 0);
  const totalUsed = distinctChannels.reduce((sum, c) => sum + c.usedCapacity, 0);
  
  if (totalCapacity === 0) return 0;
  
  return Math.round((totalUsed / totalCapacity) * 100);
}

/**
 * Get count of distinct channels
 */
export function getDistinctChannelCount(node: NetworkNode): number {
  const uniqueChannels = new Set(node.circuits.map(c => c.channelName));
  return uniqueChannels.size;
}

/**
 * Generate a unique key for a node based on coordinates
 */
export function generateNodeKey(lat: number, lon: number): string {
  return `${lat}-${lon}`;
}

/**
 * Create a node from circuit source data
 */
export function createSourceNode(circuit: CircuitData): NetworkNode {
  return {
    id: generateNodeKey(circuit.popALat, circuit.popALon),
    name: circuit.popA,
    siteName: circuit.popASiteName,
    circle: circuit.popACircle,
    port: circuit.popAPort,
    lat: circuit.popALat,
    lon: circuit.popALon,
    city: circuit.cityA,
    type: 'source',
    circuits: [],
  };
}

/**
 * Create a node from circuit destination data
 */
export function createDestinationNode(circuit: CircuitData): NetworkNode {
  return {
    id: generateNodeKey(circuit.popZLat, circuit.popZLon),
    name: circuit.popZ,
    siteName: circuit.popZSiteName,
    circle: circuit.popZCircle,
    port: circuit.popZPort,
    lat: circuit.popZLat,
    lon: circuit.popZLon,
    city: circuit.cityZ,
    type: 'destination',
    circuits: [],
  };
}
