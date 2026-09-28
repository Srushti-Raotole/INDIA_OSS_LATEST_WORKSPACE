import { useState, useEffect, useMemo } from 'react';
import { fetchAllFiberData } from '../services/fiberApi';
import type { 
  FiberData, 
  FiberRoute, 
  FiberSite, 
  FiberFilterState, 
  FiberLayerState 
} from '../types/fiberTypes';
import { DEFAULT_FIBER_FILTERS, DEFAULT_FIBER_LAYER_STATE } from '../types/fiberTypes';

/**
 * Hook return type
 */
interface UseFiberDataReturn {
  fiberData: FiberData;
  filteredRoutes: FiberRoute[];
  filteredSites: FiberSite[];
  isLoaded: boolean;
  filters: FiberFilterState;
  setFilters: (filters: FiberFilterState) => void;
  layerState: FiberLayerState;
  setLayerState: (state: FiberLayerState) => void;
}

function filterRoutes(routes: FiberRoute[], filters: FiberFilterState): FiberRoute[] {
  return routes.filter(route => {
    if (filters.types.length > 0 && !filters.types.includes(route.type)) return false;
    if (filters.methodologies.length > 0 && !filters.methodologies.includes(route.methodology)) return false;
    if (filters.linkNames.length > 0 && !filters.linkNames.includes(route.linkName)) return false;
    if (filters.constructions.length > 0 && !filters.constructions.includes(route.construction)) return false;
    return true;
  });
}

function filterSites(sites: FiberSite[], filters: FiberFilterState): FiberSite[] {
  return sites.filter(site => {
    if (filters.technologies.length > 0 && !filters.technologies.includes(site.technology)) return false;
    if (filters.linkNames.length > 0 && !filters.linkNames.includes(site.linkName)) return false;
    return true;
  });
}

export function useFiberData(): UseFiberDataReturn {
  const [fiberData, setFiberData] = useState<FiberData>({ sites: [], routes: [] });
  const [isLoaded, setIsLoaded] = useState(false);
  const [filters, setFilters] = useState<FiberFilterState>(DEFAULT_FIBER_FILTERS);
  const [layerState, setLayerState] = useState<FiberLayerState>(DEFAULT_FIBER_LAYER_STATE);

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const apiData = await fetchAllFiberData();
        if (!cancelled) {
          setFiberData(apiData);
          setIsLoaded(true);
          console.log(`[Fiber API] Loaded ${apiData.routes.length} routes and ${apiData.sites.length} sites`);
        }
      } catch (error) {
        console.error('[Fiber API] Failed to load fiber data:', error);
        if (!cancelled) {
          setIsLoaded(true);
        }
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, []);

  const filteredRoutes = useMemo(() => filterRoutes(fiberData.routes, filters), [fiberData.routes, filters]);
  const filteredSites = useMemo(() => filterSites(fiberData.sites, filters), [fiberData.sites, filters]);

  return {
    fiberData,
    filteredRoutes,
    filteredSites,
    isLoaded,
    filters,
    setFilters,
    layerState,
    setLayerState,
  };
}
