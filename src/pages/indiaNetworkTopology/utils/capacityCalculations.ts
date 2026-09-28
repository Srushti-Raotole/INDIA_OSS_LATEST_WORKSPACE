

import type { CircuitData, NetworkLink } from '../types';

// ============================================
// Result Types
// ============================================

export interface CapacityStats {
  totalCapacity: number;
  totalUsed: number;
  avgUtilization: number;
}

export interface CountStats {
  /** Total rows / pairs */
  totalPairs: number;
  /** Unique channelName count */
  distinctChannels: number;
  /** Unique circuitUserLabel count */
  distinctCircuits: number;
  /** Unique customerName count */
  distinctCustomers: number;
  /** Rows where path = 'W' (non-distinct) */
  workingCount: number;
  /** Rows where path = 'P' (non-distinct) */
  protectedCount: number;
}

export interface UtilizationBuckets {
  /** Distinct channels with util >= 80% */
  high: number;
  /** Distinct channels with util 50–79% */
  medium: number;
  /** Distinct channels with util < 50% */
  low: number;
}

export interface BreakdownCounts {
  techCounts: Record<string, number>;
  typeCounts: Record<string, number>;
  domainCounts: Record<string, number>;
  pathCounts: Record<string, number>;
}

export interface CustomerStat {
  name: string;
  count: number;
  capacity: number;
  used: number;
  util: number;
  technologies: string[];
}

// ============================================
// Core Calculation Functions
// ============================================

/**
 * Get distinct channels (by channelName) from circuit array.
 * First occurrence wins.
 */
export function getDistinctChannelsFromCircuits(circuits: CircuitData[]): CircuitData[] {
  const map = new Map<string, CircuitData>();
  circuits.forEach(c => {
    if (c.channelName && !map.has(c.channelName)) map.set(c.channelName, c);
  });
  return Array.from(map.values());
}

/**
 * Get distinct Working channels (path = 'W', unique by channelName).
 * This is the basis for all capacity / utilization calculations.
 */
export function getDistinctWorkingChannels(circuits: CircuitData[]): CircuitData[] {
  const map = new Map<string, CircuitData>();
  circuits.forEach(c => {
    if (c.channelName && c.path === 'W' && !map.has(c.channelName)) {
      map.set(c.channelName, c);
    }
  });
  return Array.from(map.values());
}

/**
 * Calculate capacity stats from a list of circuits.
 * Uses distinct Working channels only.
 */
export function calculateCapacityStats(circuits: CircuitData[]): CapacityStats {
  const workingChannels = getDistinctWorkingChannels(circuits);
  const totalCapacity = workingChannels.reduce((s, c) => s + c.createdCapacity, 0);
  const totalUsed = workingChannels.reduce((s, c) => s + c.usedCapacity, 0);
  const avgUtilization = totalCapacity > 0 ? Math.round((totalUsed / totalCapacity) * 100) : 0;
  return { totalCapacity, totalUsed, avgUtilization };
}

/**
 * Calculate count stats (pairs, distinct channels/circuits/customers, W/P counts).
 */
export function calculateCountStats(circuits: CircuitData[]): CountStats {
  const channels = new Set<string>();
  const circuitLabels = new Set<string>();
  const customers = new Set<string>();
  let workingCount = 0;
  let protectedCount = 0;

  circuits.forEach(c => {
    if (c.channelName) channels.add(c.channelName);
    if (c.circuitUserLabel) circuitLabels.add(c.circuitUserLabel);
    if (c.customerName) customers.add(c.customerName);
    if (c.path === 'W') workingCount++;
    if (c.path === 'P') protectedCount++;
  });

  return {
    totalPairs: circuits.length,
    distinctChannels: channels.size,
    distinctCircuits: circuitLabels.size,
    distinctCustomers: customers.size,
    workingCount,
    protectedCount,
  };
}

/**
 * Utilization buckets from distinct channels (all paths).
 */
export function calculateUtilizationBuckets(circuits: CircuitData[]): UtilizationBuckets {
  const distinctChannels = getDistinctChannelsFromCircuits(circuits);
  const buckets: UtilizationBuckets = { high: 0, medium: 0, low: 0 };
  distinctChannels.forEach(c => {
    if (c.utilizationPercent >= 80) buckets.high++;
    else if (c.utilizationPercent >= 50) buckets.medium++;
    else buckets.low++;
  });
  return buckets;
}

/**
 * Breakdown counts (tech, type, domain, path) from distinct channels.
 */
export function calculateBreakdownCounts(circuits: CircuitData[]): BreakdownCounts {
  const distinctChannels = getDistinctChannelsFromCircuits(circuits);
  const techCounts: Record<string, number> = {};
  const typeCounts: Record<string, number> = {};
  const domainCounts: Record<string, number> = {};

  distinctChannels.forEach(c => {
    const tech = c.technology || 'CIENA';
    techCounts[tech] = (techCounts[tech] || 0) + 1;
    const type = c.type || 'OTHER';
    typeCounts[type] = (typeCounts[type] || 0) + 1;
    const domain = c.circuitType || '';
    if (domain) domainCounts[domain] = (domainCounts[domain] || 0) + 1;
  });

  // Path counts are non-distinct (from all rows)
  const pathCounts: Record<string, number> = {};
  circuits.forEach(c => {
    const path = c.path || '';
    if (path) pathCounts[path] = (pathCounts[path] || 0) + 1;
  });

  return { techCounts, typeCounts, domainCounts, pathCounts };
}

/**
 * Top customers ranked by distinct-channel circuit count.
 * Capacity/used from distinct Working channels per customer.
 */
export function calculateTopCustomers(circuits: CircuitData[], limit = 10): CustomerStat[] {
  const distinctChannels = getDistinctChannelsFromCircuits(circuits);
  const customerMap: Record<string, { count: number; capacity: number; used: number; tech: Set<string> }> = {};

  // Count from distinct Working channels for capacity
  const workingChannels = getDistinctWorkingChannels(circuits);
  const workingByCustomer: Record<string, { cap: number; used: number }> = {};
  workingChannels.forEach(c => {
    const name = c.customerName || 'Unknown';
    if (!workingByCustomer[name]) workingByCustomer[name] = { cap: 0, used: 0 };
    workingByCustomer[name].cap += c.createdCapacity;
    workingByCustomer[name].used += c.usedCapacity;
  });

  distinctChannels.forEach(c => {
    const name = c.customerName || 'Unknown';
    if (!customerMap[name]) customerMap[name] = { count: 0, capacity: 0, used: 0, tech: new Set() };
    customerMap[name].count++;
    customerMap[name].tech.add(c.technology || 'CIENA');
  });

  return Object.entries(customerMap)
    .map(([name, data]) => {
      const wk = workingByCustomer[name] || { cap: 0, used: 0 };
      return {
        name,
        count: data.count,
        capacity: wk.cap,
        used: wk.used,
        util: wk.cap > 0 ? Math.round((wk.used / wk.cap) * 100) : 0,
        technologies: Array.from(data.tech),
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// ============================================
// Convenience: from NetworkLink[] (for sector dashboard / table views)
// ============================================

/**
 * Extract CircuitData[] from NetworkLink[] for use with calculation functions.
 */
export function extractCircuitsFromLinks(links: NetworkLink[]): CircuitData[] {
  return links.map(l => l.circuit).filter(Boolean);
}
