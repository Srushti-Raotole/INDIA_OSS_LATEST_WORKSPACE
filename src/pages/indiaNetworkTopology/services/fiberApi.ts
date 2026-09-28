

import { GET_FIBER_ROUTES, GET_FIBER_SITES } from "@/api/apis";
import axiosClient from "@/api/axiosClient";
import type { FiberRoute, FiberSite, FiberData } from '../types/fiberTypes';


interface ApiRoute {
  id: number;
  routeName: string;
  linkName: string;
  construction: string;
  lengthKms: number;
  type: string;
  methodology: string;
  color: string;
  coordinates: string;
  layer: string;
  path: string;
  createdAt: string;
  updatedAt: string;
  spanid: string;
}

interface ApiSite {
  NodeName: string;
  NodeIP: string;
  ErpSiteName: string;
  Latitude: number;
  Longitude: number;
  Technology: string;
  connType: string;
}

interface ApiRoutesResponse {
  routes: ApiRoute[];
}

interface ApiSitesResponse {
  sites: ApiSite[];
}

// ============================================
// Transformers
// ============================================

function kmlColorToHex(kmlColor: string): string {
  if (!kmlColor || kmlColor.length < 8) return '#ff0000';
  const rr = kmlColor.substring(6, 8);
  const gg = kmlColor.substring(4, 6);
  const bb = kmlColor.substring(2, 4);
  return `#${rr}${gg}${bb}`;
}

function parseCoordinates<T>(coordString: string): T | null {
  try {
    return JSON.parse(coordString);
  } catch {
    console.warn('Failed to parse coordinates:', coordString?.substring(0, 50));
    return null;
  }
}

function transformRoute(apiRoute: ApiRoute): FiberRoute | null {
  const coordinates = parseCoordinates<[number, number][]>(apiRoute.coordinates);
  if (!coordinates || coordinates.length === 0) return null;

  // Filter out any invalid coordinate pairs
  const validCoords = coordinates.filter(
    (c) => Array.isArray(c) && c.length >= 2 && typeof c[0] === 'number' && !isNaN(c[0]) && typeof c[1] === 'number' && !isNaN(c[1])
  );
  if (validCoords.length === 0) return null;

  return {
    id: `fiber-route-${apiRoute.id}`,
    routeName: apiRoute.routeName,
    linkName: apiRoute.linkName,
    construction: apiRoute.construction,
    lengthKms: apiRoute.lengthKms,
    type: (apiRoute.type || '').toUpperCase(),
    methodology: (apiRoute.methodology || '').toUpperCase(),
    color: kmlColorToHex(apiRoute.color),
    coordinates: validCoords,
    layer: apiRoute.layer,
    spanid: apiRoute.spanid || '',
  };
}

function transformSite(apiSite: ApiSite, index: number): FiberSite | null {
  const lat = apiSite.Latitude;
  const lon = apiSite.Longitude;
  if (typeof lat !== 'number' || isNaN(lat) || typeof lon !== 'number' || isNaN(lon)) return null;

  return {
    id: `fiber-site-${index}-${apiSite.NodeName}`,
    nodeName: apiSite.NodeName,
    nodeIP: apiSite.NodeIP,
    name: apiSite.ErpSiteName,
    latitude: lat,
    longitude: lon,
    coordinates: [lon, lat],
    technology: apiSite.Technology,
    connType: apiSite.connType,
    linkName: apiSite.connType,
    layer: '',
  };
}

// ============================================
// API Functions
// ============================================

export async function fetchFiberRoutes(): Promise<FiberRoute[]> {
  const response = await axiosClient.get<ApiRoutesResponse>(GET_FIBER_ROUTES);
  const routes = response.data?.routes || [];
  return routes.map(transformRoute).filter((r): r is FiberRoute => r !== null);
}

export async function fetchFiberSites(): Promise<FiberSite[]> {
  const response = await axiosClient.get<ApiSitesResponse>(GET_FIBER_SITES);
  const sites = response.data?.sites || [];
  return sites.map((s, i) => transformSite(s, i)).filter((s): s is FiberSite => s !== null);
}

export async function fetchAllFiberData(): Promise<FiberData> {
  const [routes, sites] = await Promise.all([
    fetchFiberRoutes(),
    fetchFiberSites(),
  ]);
  return { routes, sites };
}
