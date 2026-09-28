

import { useMemo } from 'react';
import { 
  CircuitData, 
  NetworkNode, 
  NetworkLink, 
  NetworkStatistics 
} from '../types';
import { 
  generateNodeKey, 
  createSourceNode, 
  createDestinationNode 
} from '../utils/nodeUtils';


export function useNetworkData(circuits: CircuitData[]) {
  // Process circuits into nodes and links
  const { nodes, links } = useMemo(() => {
    const nodeMap = new Map<string, NetworkNode>();
    const linkList: NetworkLink[] = [];

    circuits.forEach((circuit, index) => {
      const sourceKey = generateNodeKey(circuit.popALat, circuit.popALon);
      const targetKey = generateNodeKey(circuit.popZLat, circuit.popZLon);

      // Get or create source node
      if (!nodeMap.has(sourceKey)) {
        nodeMap.set(sourceKey, createSourceNode(circuit));
      }
      nodeMap.get(sourceKey)!.circuits.push(circuit);

      // Get or create target node
      if (!nodeMap.has(targetKey)) {
        nodeMap.set(targetKey, createDestinationNode(circuit));
      }
      nodeMap.get(targetKey)!.circuits.push(circuit);

      // Create link between nodes
      linkList.push({
        id: `link-${index}`,
        source: nodeMap.get(sourceKey)!,
        target: nodeMap.get(targetKey)!,
        circuit,
        utilizationPercent: circuit.utilizationPercent,
        capacity: circuit.createdCapacity,
        usedCapacity: circuit.usedCapacity,
      });
    });

    return {
      nodes: Array.from(nodeMap.values()),
      links: linkList,
    };
  }, [circuits]);

  // Calculate network statistics
  // Calculate statistics using distinct channels where path='W' for capacity/utilization
  const statistics: NetworkStatistics = useMemo(() => {
    // Distinct channels by channelName
    const distinctChannels = new Map<string, NetworkLink>();
    links.forEach(l => {
      const ch = l.circuit?.channelName;
      if (ch && !distinctChannels.has(ch)) distinctChannels.set(ch, l);
    });
    const distinctList = Array.from(distinctChannels.values());

    // Capacity from distinct channels where path = 'W'
    const workingChannels = new Map<string, NetworkLink>();
    links.forEach(l => {
      const ch = l.circuit?.channelName;
      if (ch && l.circuit?.path === 'W' && !workingChannels.has(ch)) {
        workingChannels.set(ch, l);
      }
    });
    const workingList = Array.from(workingChannels.values());
    const totalCapacity = workingList.reduce((sum, l) => sum + l.capacity, 0);
    const totalUsed = workingList.reduce((sum, l) => sum + l.usedCapacity, 0);
    const avgUtilization = totalCapacity > 0 ? (totalUsed / totalCapacity) * 100 : 0;

    // Utilization buckets from distinct channels (all paths)
    const highUtilLinks = distinctList.filter(l => l.utilizationPercent >= 80).length;
    const mediumUtilLinks = distinctList.filter(l => l.utilizationPercent >= 50 && l.utilizationPercent < 80).length;
    const lowUtilLinks = distinctList.filter(l => l.utilizationPercent < 50).length;

    return {
      totalNodes: nodes.length,
      totalLinks: links.length,
      totalCapacity,
      totalUsed,
      avgUtilization: Math.round(avgUtilization),
      highUtilLinks,
      mediumUtilLinks,
      lowUtilLinks,
    };
  }, [nodes, links]);

  return { nodes, links, statistics };
}
