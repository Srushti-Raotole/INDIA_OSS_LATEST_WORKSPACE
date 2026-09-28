


const EARTH_RADIUS_KM = 6371;


function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = degreesToRadians(lat2 - lat1);
  const dLon = degreesToRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(degreesToRadians(lat1)) * 
    Math.cos(degreesToRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return EARTH_RADIUS_KM * c;
}


export function formatDistance(distanceKm: number): string {
  if (distanceKm >= 1) {
    return `${distanceKm.toFixed(2)} km`;
  }
  return `${(distanceKm * 1000).toFixed(0)} m`;
}

/**
 * Calculate distance between two nodes
 * Convenience function that takes node coordinates
 * 
 * @param node1Lat - Latitude of first node
 * @param node1Lon - Longitude of first node
 * @param node2Lat - Latitude of second node
 * @param node2Lon - Longitude of second node
 * @returns Distance in kilometers
 */
export function calculateNodeDistance(
  node1Lat: number,
  node1Lon: number,
  node2Lat: number,
  node2Lon: number
): number {
  return calculateDistanceKm(node1Lat, node1Lon, node2Lat, node2Lon);
}
