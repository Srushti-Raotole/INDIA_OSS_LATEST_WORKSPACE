
// import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
// import { MapContainer, useMap } from 'react-leaflet';
// import { Map } from 'leaflet';
// import 'leaflet/dist/leaflet.css';

// // Types
// import { MapViewMode, NetworkNode, NetworkLink, FilterState, DEFAULT_FILTERS, LinkColorMode } from './types';
// import type { FiberRoute, FiberSite } from './types/fiberTypes';
// import type { PageMode, FiberAlarm, PlotAlarmLink, SitePairGroup } from './types/alarmTypes';

// // Constants
// import { INDIA_CENTER, DEFAULT_ZOOM } from './constants';

// // Services - Axios-like API pattern for data fetching
// import { 
//   fetchCircuits, 
//   processCircuitsToNodes, 
//   processCircuitsToLinks, 
//   calculateStatistics 
// } from './services/networkApi';

// // Hooks
// import { useMapInteractions, useFiberData, useAlarmData } from './hooks';

// // Components
// import {
//   TileLayerController,
//   NodesLayer,
//   LinksLayer,
//   FiberRoutesLayer,
//   FiberSitesLayer,
//   PlotAlarmLinksLayer,
//   MapViewSelector,
//   MapLegend,
//   NodeTooltip,
//   LinkTooltip,
//   NodeDetailsSidebar,
//   LinkDetailsSidebar,
//   FiberRouteDetailsSidebar,
//   FiberSiteDetailsSidebar,
//   SectorSummaryPanel,
//   AlarmDetailsSidebar,
//   AlarmRouteDetailsSidebar,
//   AlarmHistoryPanel,
//   OtsInsightsDialog,
//   FullscreenControl,
//   SearchFilter,
//   ViewToggle,
  
//   ConnectivityTable,
//   DashboardView,
//   FiberDashboardView,
//   ResetViewControl,
//   DomainSelector,
//   TableDomainToggle,
//   LabelToggle,
//   PageModeToggle,
//   SectorDropdown,
//   AlarmLegend,
//   MapZoomControl,
//   MapFiltersBar,
// } from './components';
// import { Switch } from '../../components/ui/switch';
// import { Button } from '../../components/ui/button';
// import { Crosshair, Flame, Globe2, Waves } from 'lucide-react';
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';
// import { LastCaptureTime } from './components/dashboard/LastCaptureTime';
// import type { ViewMode } from './components/controls/ViewToggle';
// import type { DomainView } from './components/controls/DomainSelector';
// import type { FiberColorMode } from './components/controls/FiberColorModeToggle';
// import type { TableDomainView } from './components/table/TableDomainToggle';

// // Overseas submarine cables module (fully isolated)
// import { useOverseasData, OverseasLayer, OverseasSidebar, OverseasGlobe } from './overseas';

// // Fiber 3D globe module (fully isolated)
// import { FiberGlobe } from './fiberGlobe';

// // Local styles
// import './index.css';

// /**
//  * Map center controller - centers and highlights selected node
//  * 
//  * LIBRARY: react-leaflet useMap hook
//  * Reference: https://react-leaflet.js.org/docs/api-map/#usemap
//  * 
//  * @param node - Node to center on (from search selection)
//  */
// function MapCenterController({ node }: { node: NetworkNode | null }) {
//   const map = useMap();
  
//   useEffect(() => {
//     if (node) {
//       // Fly to node location with animation
//       // CHANGE THIS: Modify zoom level (12) for different focus level
//       // CHANGE THIS: Modify duration (1) for faster/slower animation
//       map.flyTo([node.lat, node.lon], 12, { duration: 1 });
//     }
//   }, [node, map]);
  
//   return null;
// }

// /**
//  * Get utilization level from percentage
//  */
// function getUtilizationLevel(util: number): 'high' | 'medium' | 'low' {
//   if (util >= 80) return 'high';
//   if (util >= 50) return 'medium';
//   return 'low';
// }

// /**
//  * Apply filters to links based on filter state
//  */
// function applyFiltersToLinks(links: NetworkLink[], filters: FilterState): NetworkLink[] {
//   return links.filter(link => {
//     // Circuit type filter (NLD/METRO)
//     if (filters.types.length > 0) {
//       const circuitType = link.circuit?.type?.toUpperCase();
//       if (!filters.types.includes(circuitType)) {
//         return false;
//       }
//     }
    
//     // Technology filter (CIENA/NOKIA)
//     if (filters.technologies.length > 0) {
//       const technology = link.circuit?.technology?.toUpperCase();
//       if (!technology || !filters.technologies.includes(technology)) {
//         return false;
//       }
//     }
    
//     // Utilization filter
//     if (filters.utilizationLevels.length > 0) {
//       const level = getUtilizationLevel(link.utilizationPercent || 0);
//       if (!filters.utilizationLevels.includes(level)) {
//         return false;
//       }
//     }
    
//     // Circle filter
//     if (filters.circles.length > 0) {
//       const sourceCircle = link.source?.circle;
//       const targetCircle = link.target?.circle;
//       if (!filters.circles.includes(sourceCircle) && !filters.circles.includes(targetCircle)) {
//         return false;
//       }
//     }
    
//     // Domain type filter (IP/OPTICAL)
//     if (filters.domainTypes.length > 0) {
//       const domainType = link.circuit?.circuitType;
//       if (!domainType || !filters.domainTypes.includes(domainType)) {
//         return false;
//       }
//     }
    
//     // Path type filter (P/W/OTHER)
//     if (filters.pathTypes.length > 0) {
//       const pathType = link.circuit?.path;
//       if (!pathType || !filters.pathTypes.includes(pathType)) {
//         return false;
//       }
//     }
    
//     // Sector filter
//     if (filters.sectors.length > 0) {
//       const sector = link.circuit?.sector;
//       if (!sector || !filters.sectors.includes(sector)) {
//         return false;
//       }
//     }
    
//     return true;
//   });
// }

// /**
//  * Get unique node IDs from filtered links
//  */
// function getNodeIdsFromLinks(links: NetworkLink[]): Set<string> {
//   const nodeIds = new Set<string>();
//   links.forEach(link => {
//     if (link.source?.id) nodeIds.add(link.source.id);
//     if (link.target?.id) nodeIds.add(link.target.id);
//   });
//   return nodeIds;
// }

// /**
//  * India Network Topology Page
//  * Main component that orchestrates the map and all controls
//  * 
//  * LIBRARY: react-leaflet MapContainer
//  * Reference: https://react-leaflet.js.org/docs/api-map/#mapcontainer
//  */
// export default function IndiaNetworkTopology() {
//   // ========== State Management ==========
  
//   /** Page mode: 'management' or 'alarm' */
//   const [pageMode, setPageMode] = useState<PageMode>('management');
  
//   /** Current view: 'dashboard', 'map', or 'connectivity' */
//   const [currentView, setCurrentView] = useState<ViewMode>('map');
  
//   /** Current map tile view mode - defaults to light (CartoDB Positron) */
//   const [viewMode, setViewMode] = useState<MapViewMode>('cartoVoyager');
  
//   /** Link color mode: 'utilization' or 'domain' - defaults to 'domain' */
//   const [linkColorMode, setLinkColorMode] = useState<LinkColorMode>('domain');
  
//   /** Fiber color mode: 'type' or 'methodology' - defaults to 'type' */
//   const [fiberColorMode, setFiberColorMode] = useState<FiberColorMode>('type');
  
//   /** Selected domain view: ALL, FIBER, IP_OPTICAL */
//   const [selectedDomain, setSelectedDomain] = useState<DomainView>('ALL');
  
//   /** Table domain view: FIBER or IP_OPTICAL (for connectivity table) */
//   const [tableDomain, setTableDomain] = useState<TableDomainView>('IP_OPTICAL');
  
//   /** Dashboard domain view: FIBER or IP_OPTICAL (determines which dashboard is shown) */
//   const [dashboardDomain, setDashboardDomain] = useState<'FIBER' | 'IP_OPTICAL'>('IP_OPTICAL');
  
//   /** Whether to show site labels on the map */
//   const [showSiteLabels, setShowSiteLabels] = useState(true);
  
//   /** Whether to show link name labels on routes (alarm view) */
//   const [showLinkLabels, setShowLinkLabels] = useState(true);
  
//   /** Whether to show only alarmed routes in alarm view */
//   const [showOnlyAlarmed, setShowOnlyAlarmed] = useState(false);
  
//   /** Processed network nodes */
//   const [nodes, setNodes] = useState<NetworkNode[]>([]);
  
//   /** Processed network links */
//   const [links, setLinks] = useState<NetworkLink[]>([]);
  
//   /** Calculated network statistics */
//   const [statistics, setStatistics] = useState<any>({ 
//     totalNodes: 0, 
//     totalLinks: 0, 
//     avgUtilization: 0, 
//     highUtilLinks: 0, 
//     mediumUtilLinks: 0, 
//     lowUtilLinks: 0 
//   });
  
//   /** Node selected from search (for map centering) */
//   const [searchSelectedNode, setSearchSelectedNode] = useState<NetworkNode | null>(null);
  
//   /** Filter state */
//   const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  
//   /** Selected sector for standalone dropdown */
//   const [selectedSector, setSelectedSector] = useState<string>('');
  
//   /** Available circles for filtering */
//   const [availableCircles, setAvailableCircles] = useState<string[]>([]);
  
//   /** Available sectors for filtering */
//   const [availableSectors, setAvailableSectors] = useState<string[]>([]);
//   /** Map instance ref for external controls */
//   const [mapInstance, setMapInstance] = useState<Map | null>(null);
  
//   /** Container ref for sidebars (fullscreen support) */
//   const mapContainerRef = useRef<HTMLDivElement>(null);
  
//   // ========== Data Loading ==========
  
//   /**
//    * Load network data on component mount
//    * Uses API service pattern (Axios-like) for data fetching
//    * 
//    * LIBRARY: React useEffect
//    * API SERVICE: services/networkApi.ts
//    */
//   useEffect(() => {
//     const loadData = async () => {
//       // Fetch raw circuit data (currently static, can be replaced with API call)
//       const circuits = await fetchCircuits();
      
//       // Process circuits into nodes and links
//       const processedNodes = processCircuitsToNodes(circuits);
//       const processedLinks = processCircuitsToLinks(circuits, processedNodes);
      
//       // Calculate aggregate statistics
//       const stats = calculateStatistics(processedNodes, processedLinks);
      
//       // Extract unique circles for filter dropdown
//       const circles = [...new Set(processedNodes.map(n => n.circle))].filter(Boolean).sort();
      
//       // Extract unique sectors for filter dropdown
//       const sectors = [...new Set(circuits.map(c => c.sector).filter(Boolean))].sort() as string[];
      
//       setNodes(processedNodes);
//       setLinks(processedLinks);
//       setStatistics(stats);
//       setAvailableCircles(circles);
//       setAvailableSectors(sectors);
//     };
//     loadData();
//   }, []);
  
//   // ========== Filtered Data ==========
  
//   /** Apply filters to links and nodes - including standalone sector dropdown */
//   const filteredLinks = useMemo(() => {
//     let result = applyFiltersToLinks(links, filters);
//     // Apply standalone sector dropdown filter
//     if (selectedSector) {
//       result = result.filter(link => link.circuit?.sector === selectedSector);
//     }
//     return result;
//   }, [links, filters, selectedSector]);
  
//   const filteredNodes = useMemo(() => {
//     const hasAnyFilter = filters.types.length > 0 || filters.utilizationLevels.length > 0 || filters.circles.length > 0 || filters.sectors.length > 0 || filters.domainTypes.length > 0 || filters.pathTypes.length > 0 || filters.technologies.length > 0 || selectedSector !== '';
//     if (!hasAnyFilter) {
//       return nodes;
//     }
//     const nodeIds = getNodeIdsFromLinks(filteredLinks);
//     return nodes.filter(node => nodeIds.has(node.id));
//   }, [nodes, filteredLinks, filters, selectedSector]);
  
//   /** Recalculate statistics based on filtered data */
//   const filteredStatistics = useMemo(() => {
//     return calculateStatistics(filteredNodes, filteredLinks);
//   }, [filteredNodes, filteredLinks]);
  
//   // ========== Fiber Data ==========
  
//   const {
//     fiberData,
//     filteredRoutes,
//     filteredSites,
//     isLoaded: fiberLoaded,
//     filters: fiberFilters,
//     setFilters: setFiberFilters,
//     layerState: fiberLayerState,
//     setLayerState: setFiberLayerState,
//   } = useFiberData();
  
//   // Fiber selection state
//   const [selectedFiberRoute, setSelectedFiberRoute] = useState<FiberRoute | null>(null);
//   const [selectedFiberSite, setSelectedFiberSite] = useState<FiberSite | null>(null);
//   const [fiberRouteSidebarOpen, setFiberRouteSidebarOpen] = useState(false);
//   const [fiberSiteSidebarOpen, setFiberSiteSidebarOpen] = useState(false);

//   // ========== Overseas Submarine Cables ==========
//   // Lazy-loaded ONLY when OVERSEAS domain is selected (kept isolated from ALL/FIBER/IP_OPTICAL)
//   const isOverseasVisible = selectedDomain === 'OVERSEAS';
//   // Load overseas data also when ALL view is selected (so additional cables overlay)
//   const overseas = useOverseasData(isOverseasVisible || selectedDomain === 'ALL');
//   /** Landing labels are synced with main site-name toggle */
//   const [showOverseasLandingLabels, setShowOverseasLandingLabels] = useState(false);
//   /** Toggle to hide the overseas cables overlay while in ALL view */
//   const [showOverseasInAll, setShowOverseasInAll] = useState(true);
//   /** 3D rotatable globe view (Overseas only) */
//   const [overseasGlobeOpen, setOverseasGlobeOpen] = useState(false);
//   /** 3D rotatable globe view (FIBER domain only) — always opens centered on India */
//   const [fiberGlobeOpen, setFiberGlobeOpen] = useState(false);

//   /**
//    * Fit the Leaflet viewport to the bounds of all currently visible overseas cables.
//    * Iterates every visible cable's segments + landings, expands a [lat, lon] bounds
//    * array, then calls map.fitBounds with padding so the view doesn't clip the lines.
//    */
//   const handleFitOverseas = useCallback(() => {
//     if (!mapInstance) return;
//     const points: [number, number][] = [];
//     overseas.cables.forEach((cable) => {
//       if (!overseas.visibility[cable.id]) return;
//       cable.segments.forEach((seg) => {
//         seg.coordinates.forEach(([lon, lat]) => points.push([lat, lon]));
//       });
//       cable.landings.forEach((l) => points.push([l.coordinates[1], l.coordinates[0]]));
//     });
//     if (points.length === 0) return;
//     mapInstance.fitBounds(points, { padding: [60, 60], animate: true, duration: 1 } as any);
//   }, [mapInstance, overseas.cables, overseas.visibility]);

//   /** Fit map to a single overseas cable by id */
//   const handleFitOverseasCable = useCallback(
//     (id: typeof overseas.cables[number]['id']) => {
//       if (!mapInstance) return;
//       const cable = overseas.cables.find((c) => c.id === id);
//       if (!cable) return;
//       const points: [number, number][] = [];
//       cable.segments.forEach((seg) =>
//         seg.coordinates.forEach(([lon, lat]) => points.push([lat, lon]))
//       );
//       cable.landings.forEach((l) => points.push([l.coordinates[1], l.coordinates[0]]));
//       if (points.length === 0) return;
//       mapInstance.fitBounds(points, { padding: [60, 60], animate: true, duration: 1 } as any);
//     },
//     [mapInstance, overseas.cables]
//   );
  
//   // ========== Alarm Data ==========
//   const { alarms, plotAlarmLinks, sitePairGroups, isLoading: alarmsLoading, fetchAlarms, spanHasAlarm, getAlarmsForSpan, alarmCount, isWsConnected, lastUpdated: alarmLastUpdated } = useAlarmData(pageMode === 'alarm');
  
//   // Alarm-specific state
//   const [alarmSidebarOpen, setAlarmSidebarOpen] = useState(false);
//   const [selectedSitePairGroup, setSelectedSitePairGroup] = useState<SitePairGroup | null>(null);
//   const [otsAutoOpen, setOtsAutoOpen] = useState(false);
//   const [otsAutoSpanId, setOtsAutoSpanId] = useState('');
//   const [showHeatmap, setShowHeatmap] = useState(false);

//   // Auto-fetch alarms when switching to alarm mode
//   useEffect(() => {
//     if (pageMode === 'alarm') {
//       fetchAlarms();
//     }
//   }, [pageMode, fetchAlarms]);
  

//   // ========== Map Interactions ==========
  
//   /**
//    * Hook for handling all map interactions
//    * Now includes both node and link click handlers
//    * 
//    * LIBRARY: Custom React hook (hooks/useMapInteractions.ts)
//    */
//   const {
//     selectedNode,
//     selectedLink,
//     hoveredNode,
//     hoveredLink,
//     tooltipPosition,
//     nodeSidebarOpen,
//     linkSidebarOpen,
//     handleNodeClick,
//     handleNodeHover,
//     handleNodeLeave,
//     handleLinkClick,
//     handleLinkHover,
//     handleLinkLeave,
//     closeNodeSidebar,
//     closeLinkSidebar,
//   } = useMapInteractions();

//   /**
//    * Handle search node selection
//    * Centers map on selected node and opens sidebar
//    */
//   const handleSearchSelect = useCallback((node: NetworkNode) => {
//     setSearchSelectedNode(node);
//     handleNodeClick(node); // Also open sidebar with node details
//   }, [handleNodeClick]);

//   /**
//    * Handle filter changes from FilterDialog
//    */
//   const handleFilterChange = useCallback((newFilters: FilterState) => {
//     setFilters(newFilters);
//   }, []);
  
//   /**
//    * Handle fiber route click
//    */
//   const handleFiberRouteClick = useCallback((route: FiberRoute) => {
//     setSelectedFiberRoute(route);
//     setFiberRouteSidebarOpen(true);
//   }, []);
  
//   /**
//    * Handle fiber site click
//    */
//   const handleFiberSiteClick = useCallback((site: FiberSite) => {
//     setSelectedFiberSite(site);
//     setFiberSiteSidebarOpen(true);
//   }, []);

//   /**
//    * Handle fiber route search selection
//    * Opens sidebar with route details
//    */
//   const handleSearchFiberRouteSelect = useCallback((route: FiberRoute) => {
//     setSelectedFiberRoute(route);
//     setFiberRouteSidebarOpen(true);
//     // Center map on first coordinate of route
//     if (route.coordinates.length > 0 && mapInstance) {
//       const [lon, lat] = route.coordinates[0];
//       mapInstance.flyTo([lat, lon], 10, { duration: 1 });
//     }
//   }, [mapInstance]);

//   /**
//    * Handle fiber site search selection
//    * Opens sidebar with site details and centers map
//    */
//   const handleSearchFiberSiteSelect = useCallback((site: FiberSite) => {
//     setSelectedFiberSite(site);
//     setFiberSiteSidebarOpen(true);
//     // Center map on site coordinates
//     if (site.coordinates && mapInstance) {
//       const [lon, lat] = site.coordinates;
//       mapInstance.flyTo([lat, lon], 12, { duration: 1 });
//     }
//   }, [mapInstance]);

//   /**
//    * Handle alarm route click - open alarm sidebar with alarm details
//    */
//   const handleAlarmGroupClick = useCallback((group: SitePairGroup) => {
//     setSelectedSitePairGroup(group);
//     setAlarmSidebarOpen(true);
//   }, []);

//   /**
//    * Handle zoom to alarm from alarm history
//    */
//   const handleZoomToAlarm = useCallback((alarm: FiberAlarm) => {
//     // Find matching plot alarm link by spanId
//     const matchingLink = plotAlarmLinks.find(l => l.spanId === alarm.spanId);
//     if (matchingLink && mapInstance) {
//       const bounds: [[number, number], [number, number]] = [
//         [Math.min(matchingLink.latitudeA, matchingLink.latitudeB), Math.min(matchingLink.longitudeA, matchingLink.longitudeB)],
//         [Math.max(matchingLink.latitudeA, matchingLink.latitudeB), Math.max(matchingLink.longitudeA, matchingLink.longitudeB)],
//       ];
//       mapInstance.flyToBounds(bounds, { padding: [50, 50], duration: 1 });
//     }
//   }, [mapInstance, plotAlarmLinks]);

//   // ========== Render ==========

//   return (
//     <>
//       <div className="flex flex-col h-[calc(100vh-1.7rem)] w-full overflow-hidden relative bg-background">

//         {/* ========== Page Mode Toggle + Alarm Stats (top-left) ========== */}
//         {(pageMode === 'alarm' || currentView === 'map') && (
//           <div className="absolute top-4 left-4 z-[500] flex items-center gap-2">
//             <PageModeToggle mode={pageMode} onModeChange={setPageMode} />
//             {/* AlarmStatsBar removed — count now shown inside AlarmHistoryPanel button */}
//           </div>
//         )}

//         {/* ========== ALARM VIEW ========== */}
//         {pageMode === 'alarm' ? (
//           <div ref={mapContainerRef} className="h-full w-full relative bg-background">

//             {/* Alarm view controls - top right */}
//             <div className="absolute top-4 right-4 z-[400] flex items-center gap-2 flex-wrap justify-end">
//               {/* WebSocket status */}
//               <div
//                 className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-background/95 backdrop-blur-sm shadow-lg border border-border"
//                 title={isWsConnected ? 'Live alarms connected via WebSocket' : 'WebSocket disconnected — using manual fetch'}
//               >
//                 <span className={`inline-block h-2 w-2 rounded-full ${isWsConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
//                 {isWsConnected
//                   ? `Last Updated: ${alarmLastUpdated ? alarmLastUpdated.toLocaleTimeString() : '—'}`
//                   : 'Offline'}
//               </div>
//               <ResetViewControl mapRef={mapInstance} />

//               {/* Zoom to Alarmed Routes */}
//               <TooltipProvider delayDuration={200}>
//                 <Tooltip>
//                   <TooltipTrigger asChild>
//                     <Button
//                       variant="outline"
//                       size="sm"
//                       className="h-9 px-3 gap-1.5 bg-background/95 backdrop-blur-sm shadow-lg border-border"
//                       onClick={() => {
//                         const alarmedGroups = sitePairGroups.filter(g => g.spans.some(s => spanHasAlarm(s.spanId)));
//                         if (alarmedGroups.length > 0 && mapInstance) {
//                           const lats = alarmedGroups.flatMap(g => [g.latA, g.latB]);
//                           const lons = alarmedGroups.flatMap(g => [g.lonA, g.lonB]);
//                           mapInstance.flyToBounds(
//                             [[Math.min(...lats), Math.min(...lons)], [Math.max(...lats), Math.max(...lons)]],
//                             { padding: [40, 40], duration: 1.2 }
//                           );
//                         }
//                       }}
//                     >
//                       <Crosshair className="h-4 w-4 text-destructive" />
//                       <span className="text-xs font-medium">Zoom</span>
//                     </Button>
//                   </TooltipTrigger>
//                   <TooltipContent>Fit map to show all alarmed routes</TooltipContent>
//                 </Tooltip>
//               </TooltipProvider>

//               {/* Heatmap toggle */}
//               {/* <div className="flex items-center gap-2 bg-background/95 backdrop-blur-sm rounded-lg shadow-lg border border-border px-3 py-1.5">
//                 <Flame className={`h-3.5 w-3.5 ${showHeatmap ? 'text-orange-500' : 'text-muted-foreground'}`} />
//                 <span className="text-xs font-medium">Heatmap</span>
//                 <Switch checked={showHeatmap} onCheckedChange={setShowHeatmap} />
//               </div> */}

//               {/* All/Alarm filter */}
//               <div className="flex items-center gap-2 bg-background/95 backdrop-blur-sm rounded-lg shadow-lg border border-border px-3 py-1.5">
//                 <span className={`text-xs font-medium ${!showOnlyAlarmed ? 'text-foreground' : 'text-muted-foreground'}`}>All Routes</span>
//                 <Switch checked={showOnlyAlarmed} onCheckedChange={setShowOnlyAlarmed} />
//                 <span className={`text-xs font-medium ${showOnlyAlarmed ? 'text-destructive' : 'text-muted-foreground'}`}>Alarm Only</span>
//               </div>
//               <LabelToggle showSiteLabels={showSiteLabels} onSiteLabelsToggle={setShowSiteLabels} showLinkLabels={showLinkLabels} onLinkLabelsToggle={setShowLinkLabels} mode="alarm" />
//               <AlarmHistoryPanel
//                 alarms={alarms}
//                 onZoomToAlarm={handleZoomToAlarm}
//                 onRefresh={fetchAlarms}
//                 isLoading={alarmsLoading}
//               />
//               <MapViewSelector currentView={viewMode} onViewChange={setViewMode} />
//               <FullscreenControl />
//             </div>

//             <MapContainer
//               center={INDIA_CENTER}
//               zoom={6}
//               className="h-full w-full z-0"
//               zoomControl={false}
//               scrollWheelZoom={true}
//               attributionControl={false}
//               zoomSnap={0.25}
//               zoomDelta={0.25}
//               wheelPxPerZoomLevel={120}
//               ref={(map) => setMapInstance(map || null)}
//             >
//               <TileLayerController viewMode={viewMode} />

//               {/* Fiber Routes — always-on background fiber polylines (same API as Management View) */}
//               {fiberData.routes.length > 0 && (
//                 <FiberRoutesLayer
//                   routes={fiberData.routes}
//                   colorMode="type"
//                   showSpanLabels={false}
//                 />
//               )}

//               {/* Plot Alarm Links Layer — site dots from plotAlarms API + red alarm line
//                   (drawn ONLY between sites with active alarms; follows fiber route by spanId) */}
//               {sitePairGroups.length > 0 && (
//                 <PlotAlarmLinksLayer
//                   sitePairGroups={showOnlyAlarmed 
//                     ? sitePairGroups.filter(g => g.spans.some(s => spanHasAlarm(s.spanId)))
//                     : sitePairGroups
//                   }
//                   spanHasAlarm={spanHasAlarm}
//                   getAlarmsForSpan={getAlarmsForSpan}
//                   onGroupClick={handleAlarmGroupClick}
//                   showSiteLabels={showSiteLabels}
//                   showSpanLabels={showLinkLabels}
//                   showHeatmap={showHeatmap}
//                   fiberRoutes={fiberData.routes}
//                 />
//               )}
              
//               <MapZoomControl />
//             </MapContainer>

//             {/* Alarm Legend */}
//             <div className="absolute bottom-4 left-4 z-[400]">
//               <AlarmLegend />
//             </div>

//             {/* Alarm Span Details Sidebar */}
//             <AlarmRouteDetailsSidebar
//               group={selectedSitePairGroup}
//               spanHasAlarm={spanHasAlarm}
//               getAlarmsForSpan={getAlarmsForSpan}
//               open={alarmSidebarOpen}
//               onClose={() => setAlarmSidebarOpen(false)}
//               container={mapContainerRef.current}
//             />

//             {/* Auto-open OTS Insights for alarmed spans */}
//             <OtsInsightsDialog
//               open={otsAutoOpen}
//               onClose={() => setOtsAutoOpen(false)}
//               spanId={otsAutoSpanId}
//               adapter="MCP"
//               routeName={selectedSitePairGroup ? `${selectedSitePairGroup.siteA} → ${selectedSitePairGroup.siteB}` : ''}
//             />
//           </div>
//         ) : (
//           /* ========== MANAGEMENT VIEW (existing) ========== */
//           <>
//             {/* ========== Conditional View Rendering ========== */}
//             {currentView === 'dashboard' ? (
//               <div className="h-full w-full overflow-hidden">
//                 {dashboardDomain === 'FIBER' ? (
//                   <FiberDashboardView
//                     routes={filteredRoutes}
//                     sites={filteredSites}
//                     currentView={currentView}
//                     onViewChange={setCurrentView}
//                     selectedDomain={dashboardDomain}
//                     onDomainChange={setDashboardDomain}
//                   />
//                 ) : (
//                   <DashboardView 
//                     currentView={currentView} 
//                     onViewChange={setCurrentView}
//                     selectedDomain={dashboardDomain}
//                     onDomainChange={setDashboardDomain}
//                   />
//                 )}
//               </div>
//             ) : currentView === 'map' ? (
//               <div ref={mapContainerRef} className="h-full w-full relative bg-background">
//                 {/* Top-right controls - Row 1: View & Map controls */}
//                 <div className="absolute top-4 right-4 z-[400] flex items-center gap-2">
//                   <ResetViewControl mapRef={mapInstance} />
//                   <ViewToggle currentView={currentView} onViewChange={setCurrentView} />
//                   <DomainSelector 
//                     selectedDomain={selectedDomain}
//                     onDomainChange={setSelectedDomain}
//                     hasFiberData={fiberLoaded && (fiberData.routes.length > 0 || fiberData.sites.length > 0)}
//                   />
//                   <SearchFilter
//                     nodes={nodes} 
//                     onNodeSelect={handleSearchSelect}
//                     fiberRoutes={filteredRoutes}
//                     fiberSites={filteredSites}
//                     onFiberRouteSelect={handleSearchFiberRouteSelect}
//                     onFiberSiteSelect={handleSearchFiberSiteSelect}
//                   />
//                   <MapViewSelector currentView={viewMode} onViewChange={setViewMode} />
//                   {/* {selectedDomain === 'ALL' && (
//                     <Button
//                       variant="outline"
//                       size="icon"
//                       onClick={() => setShowOverseasInAll(v => !v)}
//                       title={showOverseasInAll ? 'Hide overseas cables' : 'Show overseas cables'}
//                       className={`h-8 w-8 bg-background/95 backdrop-blur-sm shadow-lg border-border transition-all hover:bg-muted ${showOverseasInAll ? 'border-primary text-primary' : ''}`}
//                     >
//                       <Waves className="h-4 w-4" />
//                     </Button>
//                   )} */}
//                   <FullscreenControl />
//                 </div>

//                 {/* Top-right controls - Row 2: Collapsible Filters Bar */}
//                 <div className="absolute top-14 right-4 z-[400]">
//                   <MapFiltersBar
//                     availableSectors={availableSectors}
//                     selectedSector={selectedSector}
//                     onSectorChange={setSelectedSector}
//                     linkColorMode={linkColorMode}
//                     onLinkColorModeChange={setLinkColorMode}
//                     fiberColorMode={fiberColorMode}
//                     onFiberColorModeChange={setFiberColorMode}
//                     showSiteLabels={showSiteLabels}
//                     onSiteLabelsToggle={setShowSiteLabels}
//                     circuitFilters={filters}
//                     onCircuitFilterChange={handleFilterChange}
//                     availableCircles={availableCircles}
//                     fiberFilters={fiberFilters}
//                     onFiberFilterChange={setFiberFilters}
//                     fiberData={fiberData}
//                     selectedDomain={selectedDomain}
//                     hasFiberData={fiberLoaded && (fiberData.routes.length > 0 || fiberData.sites.length > 0)}
//                     fiberLoaded={fiberLoaded}
//                     fiberRoutesCount={fiberData.routes.length}
//                   />
//                 </div>

//                 <MapContainer
//                   center={INDIA_CENTER}
//                   zoom={DEFAULT_ZOOM}
//                   className="h-full w-full z-0"
//                   zoomControl={false}
//                   scrollWheelZoom={true}
//                   attributionControl={false}
//                   zoomSnap={0.25}
//                   zoomDelta={0.25}
//                   wheelPxPerZoomLevel={120}
//                   ref={(map) => setMapInstance(map || null)}
//                 >
//                   <TileLayerController viewMode={viewMode} />
                  
//                   {(selectedDomain === 'ALL' || selectedDomain === 'IP_OPTICAL') && (
//                     <LinksLayer 
//                       links={filteredLinks} 
//                       allLinks={links}
//                       onLinkHover={handleLinkHover} 
//                       onLinkLeave={handleLinkLeave}
//                       onLinkClick={handleLinkClick}
//                       selectedLink={selectedLink}
//                       colorMode={linkColorMode}
//                       onSectorClick={setSelectedSector}
//                       selectedSector={selectedSector}
//                       showLabels={showSiteLabels}
//                     />
//                   )}
                  
//                   {(selectedDomain === 'ALL' || selectedDomain === 'IP_OPTICAL') && (
//                     <NodesLayer 
//                       nodes={filteredNodes} 
//                       onNodeClick={handleNodeClick} 
//                       onNodeHover={handleNodeHover} 
//                       onNodeLeave={handleNodeLeave}
//                       highlightedNode={searchSelectedNode}
//                       showLabels={showSiteLabels}
//                     />
//                   )}
                  
//                   {(selectedDomain === 'ALL' || selectedDomain === 'FIBER' || selectedDomain === 'OVERSEAS') && filteredRoutes.length > 0 && (
//                     <FiberRoutesLayer 
//                       routes={filteredRoutes}
//                       onRouteClick={handleFiberRouteClick}
//                       selectedRoute={selectedFiberRoute}
//                       colorMode={fiberColorMode}
//                     />
//                   )}
                  
//                   {(selectedDomain === 'ALL' || selectedDomain === 'FIBER' || selectedDomain === 'OVERSEAS') && filteredSites.length > 0 && (
//                     <FiberSitesLayer 
//                       sites={filteredSites}
//                       onSiteClick={handleFiberSiteClick}
//                       selectedSite={selectedFiberSite}
//                       fiberOnlyMode={selectedDomain === 'FIBER' || selectedDomain === 'OVERSEAS'}
//                       showLabels={showSiteLabels}
//                     />
//                   )}
                  
//                   {/* Overseas submarine cables - shown on OVERSEAS domain, and as overlay on ALL (toggleable) */}
//                   {(isOverseasVisible || (selectedDomain === 'ALL' && showOverseasInAll)) && (
//                     <OverseasLayer
//                       cables={overseas.cables}
//                       visibility={overseas.visibility}
//                       selectedSegmentId={overseas.selectedSegment?.id ?? null}
//                       showLandingLabels={showOverseasLandingLabels}
//                       onSegmentClick={(seg, cable) => {
//                         overseas.setSelectedSegment(seg);
//                         overseas.setSelectedCableId(cable.id);
//                       }}
//                     />
//                   )}
                  
//                   <MapCenterController node={searchSelectedNode} />
//                   <MapZoomControl />
//                 </MapContainer>

//                 {/* Bottom-left slot: standard legend OR overseas panel (mutually exclusive) */}
//                 {isOverseasVisible ? (
//                   <div className="absolute bottom-4 left-4 z-[450]">
//                     <OverseasSidebar
//                       cables={overseas.cables}
//                       visibility={overseas.visibility}
//                       onToggleCable={overseas.toggleCable}
//                       visibleTotalLengthKm={overseas.visibleTotalLengthKm}
//                       selectedSegment={overseas.selectedSegment}
//                       onClearSelection={() => overseas.setSelectedSegment(null)}
//                       onFitToBounds={handleFitOverseas}
//                       onFitCable={handleFitOverseasCable}
//                       showLandingLabels={showOverseasLandingLabels}
//                       onToggleLandingLabels={setShowOverseasLandingLabels}
//                       onOpenGlobe={() => setOverseasGlobeOpen(true)}
//                       isLoading={overseas.isLoading}
//                       error={overseas.error}
//                     />
//                   </div>
//                 ) : (
//                   <div className="absolute bottom-4 left-4 z-[400]">
//                     <MapLegend
//                       colorMode={linkColorMode}
//                       selectedDomain={selectedDomain}
//                       fiberColorMode={fiberColorMode}
//                       onOpenGlobe={
//                         selectedDomain === 'FIBER' && fiberLoaded
//                           ? () => setFiberGlobeOpen(true)
//                           : undefined
//                       }
//                       globeDisabled={
//                         filteredRoutes.length === 0 && filteredSites.length === 0
//                       }
//                     />
//                   </div>
//                 )}

//                 {selectedSector && (
//                   <SectorSummaryPanel
//                     sector={selectedSector}
//                     onClear={() => setSelectedSector('')}
//                   />
//                 )}

//                 <NodeTooltip node={hoveredNode} position={tooltipPosition} />
//                 <LinkTooltip link={hoveredLink} position={tooltipPosition} allLinks={links} />

//                 <NodeDetailsSidebar 
//                   node={selectedNode} 
//                   open={nodeSidebarOpen} 
//                   onClose={closeNodeSidebar}
//                   container={mapContainerRef.current}
//                 />
                
//                 <LinkDetailsSidebar 
//                   link={selectedLink} 
//                   open={linkSidebarOpen} 
//                   onClose={closeLinkSidebar}
//                   container={mapContainerRef.current}
//                   sectorLinks={selectedLink?.circuit?.sector 
//                     ? links.filter(l => l.circuit?.sector === selectedLink.circuit.sector) 
//                     : []
//                   }
//                   onViewInTable={(sector) => {
//                     setSelectedSector(sector);
//                     setCurrentView('connectivity');
//                     closeLinkSidebar();
//                   }}
//                 />
                
//                 <FiberRouteDetailsSidebar 
//                   route={selectedFiberRoute}
//                   open={fiberRouteSidebarOpen}
//                   onClose={() => setFiberRouteSidebarOpen(false)}
//                   container={mapContainerRef.current}
//                 />
                
//                 <FiberSiteDetailsSidebar 
//                   site={selectedFiberSite}
//                   open={fiberSiteSidebarOpen}
//                   onClose={() => setFiberSiteSidebarOpen(false)}
//                   container={mapContainerRef.current}
//                 />

//                 {/* 3D Globe overlay (Overseas only) */}
//                 {isOverseasVisible && overseasGlobeOpen && (
//                   <OverseasGlobe
//                     cables={overseas.cables}
//                     visibility={overseas.visibility}
//                     fiberRoutes={filteredRoutes}
//                     fiberSites={filteredSites}
//                     fiberColorMode={fiberColorMode}
//                     onClose={() => setOverseasGlobeOpen(false)}
//                   />
//                 )}

//                 {/* 3D Globe overlay (FIBER domain only) — always opens on India */}
//                 {selectedDomain === 'FIBER' && fiberGlobeOpen && (
//                   <FiberGlobe
//                     routes={filteredRoutes}
//                     sites={filteredSites}
//                     colorMode={fiberColorMode}
//                     onClose={() => setFiberGlobeOpen(false)}
//                   />
//                 )}
//               </div>
//             ) : (
//               <div className="h-full w-full flex flex-col">
//                 <div className="flex-shrink-0 flex items-center justify-between p-2 border-b border-border/50 bg-muted/20">
//                   <div className="flex items-center gap-3">
//                     <TableDomainToggle
//                       selectedDomain={tableDomain}
//                       onDomainChange={setTableDomain}
//                     />
//                     {tableDomain === 'IP_OPTICAL' && availableSectors.length > 0 && (
//                       <SectorDropdown
//                         availableSectors={availableSectors}
//                         selectedSector={selectedSector}
//                         onSectorChange={setSelectedSector}
//                         compact
//                       />
//                     )}
//                   </div>
//                   <div className="flex items-center gap-3">
//                     <LastCaptureTime domain={tableDomain === 'FIBER' ? 'FIBER' : 'IP_OPTICAL'} />
//                     <ViewToggle currentView={currentView} onViewChange={setCurrentView} />
//                   </div>
//                 </div>
//                 <div className="flex-1 p-3 min-h-0">
//                   <ConnectivityTable 
//                     links={links} 
//                     nodes={nodes}
//                     filters={filters}
//                     onFilterChange={handleFilterChange}
//                     fiberRoutes={filteredRoutes}
//                     fiberSites={filteredSites}
//                     fiberFilters={fiberFilters}
//                     onFiberFilterChange={setFiberFilters}
//                     tableDomain={tableDomain}
//                     selectedSector={selectedSector}
//                     availableSectors={availableSectors}
//                     onSectorChange={setSelectedSector}
//                   />
//                 </div>
//               </div>
//             )}
//           </>
//         )}
//       </div>

//     </>
//   );
// }
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { MapContainer, useMap } from 'react-leaflet';
import { Map } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { logActivity } from '../../utils/activityLogger';

// Types
import { MapViewMode, NetworkNode, NetworkLink, FilterState, DEFAULT_FILTERS, LinkColorMode } from './types';
import type { FiberRoute, FiberSite } from './types/fiberTypes';
import type { PageMode, FiberAlarm, PlotAlarmLink, SitePairGroup } from './types/alarmTypes';

// Constants
import { INDIA_CENTER, DEFAULT_ZOOM, MAX_ZOOM } from './constants';

// Services - Axios-like API pattern for data fetching
import { 
  fetchCircuits, 
  processCircuitsToNodes, 
  processCircuitsToLinks, 
  calculateStatistics 
} from './services/networkApi';

// Hooks
import { useMapInteractions, useFiberData, useAlarmData } from './hooks';

// Components
import {
  TileLayerController,
  NodesLayer,
  LinksLayer,
  FiberRoutesLayer,
  FiberSitesLayer,
  PlotAlarmLinksLayer,
  MapViewSelector,
  MapLegend,
  NodeTooltip,
  LinkTooltip,
  NodeDetailsSidebar,
  LinkDetailsSidebar,
  FiberRouteDetailsSidebar,
  FiberSiteDetailsSidebar,
  SectorSummaryPanel,
  AlarmDetailsSidebar,
  AlarmRouteDetailsSidebar,
  AlarmHistoryPanel,
  OtsInsightsDialog,
  FullscreenControl,
  SearchFilter,
  ViewToggle,
  
  ConnectivityTable,
  DashboardView,
  FiberDashboardView,
  ResetViewControl,
  DomainSelector,
  TableDomainToggle,
  LabelToggle,
  PageModeToggle,
  SectorDropdown,
  AlarmLegend,
  MapZoomControl,
  MapFiltersBar,
} from './components';
import { Switch } from '../../components/ui/switch';
import { Button } from '../../components/ui/button';
import { Crosshair, Flame, Globe2, Waves } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';
import { LastCaptureTime } from './components/dashboard/LastCaptureTime';
import type { ViewMode } from './components/controls/ViewToggle';
import type { DomainView } from './components/controls/DomainSelector';
import type { FiberColorMode } from './components/controls/FiberColorModeToggle';
import type { TableDomainView } from './components/table/TableDomainToggle';

// Overseas submarine cables module (fully isolated)
import { useOverseasData, OverseasLayer, OverseasSidebar, OverseasGlobe } from './overseas';

// Fiber 3D globe module (fully isolated)
import { FiberGlobe } from './fiberGlobe';

// Local styles
import './index.css';

/**
 * Map center controller - centers and highlights selected node
 * 
 * LIBRARY: react-leaflet useMap hook
 * Reference: https://react-leaflet.js.org/docs/api-map/#usemap
 * 
 * @param node - Node to center on (from search selection)
 */
function MapCenterController({ node }: { node: NetworkNode | null }) {
  const map = useMap();
  
  useEffect(() => {
    if (node) {
      // Fly to node location with animation
      // CHANGE THIS: Modify zoom level (12) for different focus level
      // CHANGE THIS: Modify duration (1) for faster/slower animation
      map.flyTo([node.lat, node.lon], 12, { duration: 1 });
    }
  }, [node, map]);
  
  return null;
}

/**
 * Get utilization level from percentage
 */
function getUtilizationLevel(util: number): 'high' | 'medium' | 'low' {
  if (util >= 80) return 'high';
  if (util >= 50) return 'medium';
  return 'low';
}

/**
 * Apply filters to links based on filter state
 */
function applyFiltersToLinks(links: NetworkLink[], filters: FilterState): NetworkLink[] {
  return links.filter(link => {
    // Circuit type filter (NLD/METRO)
    if (filters.types.length > 0) {
      const circuitType = link.circuit?.type?.toUpperCase();
      if (!filters.types.includes(circuitType)) {
        return false;
      }
    }
    
    // Technology filter (CIENA/NOKIA)
    if (filters.technologies.length > 0) {
      const technology = link.circuit?.technology?.toUpperCase();
      if (!technology || !filters.technologies.includes(technology)) {
        return false;
      }
    }
    
    // Utilization filter
    if (filters.utilizationLevels.length > 0) {
      const level = getUtilizationLevel(link.utilizationPercent || 0);
      if (!filters.utilizationLevels.includes(level)) {
        return false;
      }
    }
    
    // Circle filter
    if (filters.circles.length > 0) {
      const sourceCircle = link.source?.circle;
      const targetCircle = link.target?.circle;
      if (!filters.circles.includes(sourceCircle) && !filters.circles.includes(targetCircle)) {
        return false;
      }
    }
    
    // Domain type filter (IP/OPTICAL)
    if (filters.domainTypes.length > 0) {
      const domainType = link.circuit?.circuitType;
      if (!domainType || !filters.domainTypes.includes(domainType)) {
        return false;
      }
    }
    
    // Path type filter (P/W/OTHER)
    if (filters.pathTypes.length > 0) {
      const pathType = link.circuit?.path;
      if (!pathType || !filters.pathTypes.includes(pathType)) {
        return false;
      }
    }
    
    // Sector filter
    if (filters.sectors.length > 0) {
      const sector = link.circuit?.sector;
      if (!sector || !filters.sectors.includes(sector)) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Get unique node IDs from filtered links
 */
function getNodeIdsFromLinks(links: NetworkLink[]): Set<string> {
  const nodeIds = new Set<string>();
  links.forEach(link => {
    if (link.source?.id) nodeIds.add(link.source.id);
    if (link.target?.id) nodeIds.add(link.target.id);
  });
  return nodeIds;
}

/**
 * India Network Topology Page
 * Main component that orchestrates the map and all controls
 * 
 * LIBRARY: react-leaflet MapContainer
 * Reference: https://react-leaflet.js.org/docs/api-map/#mapcontainer
 */
export default function IndiaNetworkTopology() {
  // ========== State Management ==========
  
  /** Page mode: 'management' or 'alarm' */
  const [pageMode, setPageMode] = useState<PageMode>('management');
  
  /** Current view: 'dashboard', 'map', or 'connectivity' */
  const [currentView, setCurrentView] = useState<ViewMode>('map');
  
  /** Current map tile view mode - defaults to light (CartoDB Positron) */
  const [viewMode, setViewMode] = useState<MapViewMode>('ofmBright');
  
  /** Link color mode: 'utilization' or 'domain' - defaults to 'domain' */
  const [linkColorMode, setLinkColorMode] = useState<LinkColorMode>('domain');
  
  /** Fiber color mode: 'type' or 'methodology' - defaults to 'type' */
  const [fiberColorMode, setFiberColorMode] = useState<FiberColorMode>('type');
  
  /** Selected domain view: ALL, FIBER, IP_OPTICAL */
  const [selectedDomain, setSelectedDomain] = useState<DomainView>('ALL');
  
  /** Table domain view: FIBER or IP_OPTICAL (for connectivity table) */
  const [tableDomain, setTableDomain] = useState<TableDomainView>('IP_OPTICAL');
  
  /** Dashboard domain view: FIBER or IP_OPTICAL (determines which dashboard is shown) */
  const [dashboardDomain, setDashboardDomain] = useState<'FIBER' | 'IP_OPTICAL'>('IP_OPTICAL');
  
  /** Whether to show site labels on the map */
  const [showSiteLabels, setShowSiteLabels] = useState(true);
  
  /** Whether to show link name labels on routes (alarm view) */
  const [showLinkLabels, setShowLinkLabels] = useState(true);
  
  /** Whether to show only alarmed routes in alarm view */
  const [showOnlyAlarmed, setShowOnlyAlarmed] = useState(false);
  
  /** Processed network nodes */
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  
  /** Processed network links */
  const [links, setLinks] = useState<NetworkLink[]>([]);
  
  /** Calculated network statistics */
  const [statistics, setStatistics] = useState<any>({ 
    totalNodes: 0, 
    totalLinks: 0, 
    avgUtilization: 0, 
    highUtilLinks: 0, 
    mediumUtilLinks: 0, 
    lowUtilLinks: 0 
  });
  
  /** Node selected from search (for map centering) */
  const [searchSelectedNode, setSearchSelectedNode] = useState<NetworkNode | null>(null);
  
  /** Filter state */
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  
  /** Selected sector for standalone dropdown */
  const [selectedSector, setSelectedSector] = useState<string>('');
  
  /** Available circles for filtering */
  const [availableCircles, setAvailableCircles] = useState<string[]>([]);
  
  /** Available sectors for filtering */
  const [availableSectors, setAvailableSectors] = useState<string[]>([]);
  /** Map instance ref for external controls */
  const [mapInstance, setMapInstance] = useState<Map | null>(null);
  
  /** Container ref for sidebars (fullscreen support) */
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // ========== Activity Logging ==========

  useEffect(() => {
    logActivity({ activity: "India Network Map page opened", actionName: "INDIA_NETWORK_MAP_PAGE", module: "NETWORK_MAP" });
  }, []);

  // ========== Data Loading ==========

  /**
   * Load network data on component mount
   * Uses API service pattern (Axios-like) for data fetching
   *
   * LIBRARY: React useEffect
   * API SERVICE: services/networkApi.ts
   */
  useEffect(() => {
    const loadData = async () => {
      // Fetch raw circuit data (currently static, can be replaced with API call)
      const circuits = await fetchCircuits();
      
      // Process circuits into nodes and links
      const processedNodes = processCircuitsToNodes(circuits);
      const processedLinks = processCircuitsToLinks(circuits, processedNodes);
      
      // Calculate aggregate statistics
      const stats = calculateStatistics(processedNodes, processedLinks);
      
      // Extract unique circles for filter dropdown
      const circles = [...new Set(processedNodes.map(n => n.circle))].filter(Boolean).sort();
      
      // Extract unique sectors for filter dropdown
      const sectors = [...new Set(circuits.map(c => c.sector).filter(Boolean))].sort() as string[];
      
      setNodes(processedNodes);
      setLinks(processedLinks);
      setStatistics(stats);
      setAvailableCircles(circles);
      setAvailableSectors(sectors);
    };
    loadData();
  }, []);
  
  // ========== Filtered Data ==========
  
  /** Apply filters to links and nodes - including standalone sector dropdown */
  const filteredLinks = useMemo(() => {
    let result = applyFiltersToLinks(links, filters);
    // Apply standalone sector dropdown filter
    if (selectedSector) {
      result = result.filter(link => link.circuit?.sector === selectedSector);
    }
    return result;
  }, [links, filters, selectedSector]);
  
  const filteredNodes = useMemo(() => {
    const hasAnyFilter = filters.types.length > 0 || filters.utilizationLevels.length > 0 || filters.circles.length > 0 || filters.sectors.length > 0 || filters.domainTypes.length > 0 || filters.pathTypes.length > 0 || filters.technologies.length > 0 || selectedSector !== '';
    if (!hasAnyFilter) {
      return nodes;
    }
    const nodeIds = getNodeIdsFromLinks(filteredLinks);
    return nodes.filter(node => nodeIds.has(node.id));
  }, [nodes, filteredLinks, filters, selectedSector]);
  
  /** Recalculate statistics based on filtered data */
  const filteredStatistics = useMemo(() => {
    return calculateStatistics(filteredNodes, filteredLinks);
  }, [filteredNodes, filteredLinks]);
  
  // ========== Fiber Data ==========
  
  const {
    fiberData,
    filteredRoutes,
    filteredSites,
    isLoaded: fiberLoaded,
    filters: fiberFilters,
    setFilters: setFiberFilters,
    layerState: fiberLayerState,
    setLayerState: setFiberLayerState,
  } = useFiberData();
  
  // Fiber selection state
  const [selectedFiberRoute, setSelectedFiberRoute] = useState<FiberRoute | null>(null);
  const [selectedFiberSite, setSelectedFiberSite] = useState<FiberSite | null>(null);
  const [fiberRouteSidebarOpen, setFiberRouteSidebarOpen] = useState(false);
  const [fiberSiteSidebarOpen, setFiberSiteSidebarOpen] = useState(false);

  // ========== Overseas Submarine Cables ==========
  // Lazy-loaded ONLY when OVERSEAS domain is selected (kept isolated from ALL/FIBER/IP_OPTICAL)
  const isOverseasVisible = selectedDomain === 'OVERSEAS';
  // Load overseas data also when ALL view is selected (so additional cables overlay)
  const overseas = useOverseasData(isOverseasVisible || selectedDomain === 'ALL');
  /** Landing labels are synced with main site-name toggle */
  const [showOverseasLandingLabels, setShowOverseasLandingLabels] = useState(false);
  /** Toggle to hide the overseas cables overlay while in ALL view */
  const [showOverseasInAll, setShowOverseasInAll] = useState(true);
  /** 3D rotatable globe view (Overseas only) */
  const [overseasGlobeOpen, setOverseasGlobeOpen] = useState(false);
  /** 3D rotatable globe view (FIBER domain only) — always opens centered on India */
  const [fiberGlobeOpen, setFiberGlobeOpen] = useState(false);

  /**
   * Fit the Leaflet viewport to the bounds of all currently visible overseas cables.
   * Iterates every visible cable's segments + landings, expands a [lat, lon] bounds
   * array, then calls map.fitBounds with padding so the view doesn't clip the lines.
   */
  const handleFitOverseas = useCallback(() => {
    if (!mapInstance) return;
    const points: [number, number][] = [];
    overseas.cables.forEach((cable) => {
      if (!overseas.visibility[cable.id]) return;
      cable.segments.forEach((seg) => {
        seg.coordinates.forEach(([lon, lat]) => points.push([lat, lon]));
      });
      cable.landings.forEach((l) => points.push([l.coordinates[1], l.coordinates[0]]));
    });
    if (points.length === 0) return;
    mapInstance.fitBounds(points, { padding: [60, 60], animate: true, duration: 1 } as any);
  }, [mapInstance, overseas.cables, overseas.visibility]);

  /** Fit map to a single overseas cable by id */
  const handleFitOverseasCable = useCallback(
    (id: typeof overseas.cables[number]['id']) => {
      if (!mapInstance) return;
      const cable = overseas.cables.find((c) => c.id === id);
      if (!cable) return;
      const points: [number, number][] = [];
      cable.segments.forEach((seg) =>
        seg.coordinates.forEach(([lon, lat]) => points.push([lat, lon]))
      );
      cable.landings.forEach((l) => points.push([l.coordinates[1], l.coordinates[0]]));
      if (points.length === 0) return;
      mapInstance.fitBounds(points, { padding: [60, 60], animate: true, duration: 1 } as any);
    },
    [mapInstance, overseas.cables]
  );
  
  // ========== Alarm Data ==========
  const { alarms, plotAlarmLinks, sitePairGroups, isLoading: alarmsLoading, fetchAlarms, spanHasAlarm, getAlarmsForSpan, alarmCount, isWsConnected, lastUpdated: alarmLastUpdated } = useAlarmData(pageMode === 'alarm');
  
  // Alarm-specific state
  const [alarmSidebarOpen, setAlarmSidebarOpen] = useState(false);
  const [selectedSitePairGroup, setSelectedSitePairGroup] = useState<SitePairGroup | null>(null);
  const [otsAutoOpen, setOtsAutoOpen] = useState(false);
  const [otsAutoSpanId, setOtsAutoSpanId] = useState('');
  const [showHeatmap, setShowHeatmap] = useState(false);

  // Auto-fetch alarms when switching to alarm mode
  useEffect(() => {
    if (pageMode === 'alarm') {
      fetchAlarms();
    }
  }, [pageMode, fetchAlarms]);
  

  // ========== Map Interactions ==========
  
  /**
   * Hook for handling all map interactions
   * Now includes both node and link click handlers
   * 
   * LIBRARY: Custom React hook (hooks/useMapInteractions.ts)
   */
  const {
    selectedNode,
    selectedLink,
    hoveredNode,
    hoveredLink,
    tooltipPosition,
    nodeSidebarOpen,
    linkSidebarOpen,
    handleNodeClick,
    handleNodeHover,
    handleNodeLeave,
    handleLinkClick,
    handleLinkHover,
    handleLinkLeave,
    closeNodeSidebar,
    closeLinkSidebar,
  } = useMapInteractions();

  /**
   * Handle search node selection
   * Centers map on selected node and opens sidebar
   */
  const handleSearchSelect = useCallback((node: NetworkNode) => {
    setSearchSelectedNode(node);
    handleNodeClick(node); // Also open sidebar with node details
  }, [handleNodeClick]);

  /**
   * Handle filter changes from FilterDialog
   */
  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
  }, []);
  
  /**
   * Handle fiber route click
   */
  const handleFiberRouteClick = useCallback((route: FiberRoute) => {
    setSelectedFiberRoute(route);
    setFiberRouteSidebarOpen(true);
  }, []);
  
  /**
   * Handle fiber site click
   */
  const handleFiberSiteClick = useCallback((site: FiberSite) => {
    setSelectedFiberSite(site);
    setFiberSiteSidebarOpen(true);
  }, []);

  /**
   * Handle fiber route search selection
   * Opens sidebar with route details
   */
  const handleSearchFiberRouteSelect = useCallback((route: FiberRoute) => {
    setSelectedFiberRoute(route);
    setFiberRouteSidebarOpen(true);
    // Center map on first coordinate of route
    if (route.coordinates.length > 0 && mapInstance) {
      const [lon, lat] = route.coordinates[0];
      mapInstance.flyTo([lat, lon], 10, { duration: 1 });
    }
  }, [mapInstance]);

  /**
   * Handle fiber site search selection
   * Opens sidebar with site details and centers map
   */
  const handleSearchFiberSiteSelect = useCallback((site: FiberSite) => {
    setSelectedFiberSite(site);
    setFiberSiteSidebarOpen(true);
    // Center map on site coordinates
    if (site.coordinates && mapInstance) {
      const [lon, lat] = site.coordinates;
      mapInstance.flyTo([lat, lon], 12, { duration: 1 });
    }
  }, [mapInstance]);

  /**
   * Handle alarm route click - open alarm sidebar with alarm details
   */
  const handleAlarmGroupClick = useCallback((group: SitePairGroup) => {
    setSelectedSitePairGroup(group);
    setAlarmSidebarOpen(true);
  }, []);

  /**
   * Handle zoom to alarm from alarm history
   */
  const handleZoomToAlarm = useCallback((alarm: FiberAlarm) => {
    // Find matching plot alarm link by spanId
    const matchingLink = plotAlarmLinks.find(l => l.spanId === alarm.spanId);
    if (matchingLink && mapInstance) {
      const bounds: [[number, number], [number, number]] = [
        [Math.min(matchingLink.latitudeA, matchingLink.latitudeB), Math.min(matchingLink.longitudeA, matchingLink.longitudeB)],
        [Math.max(matchingLink.latitudeA, matchingLink.latitudeB), Math.max(matchingLink.longitudeA, matchingLink.longitudeB)],
      ];
      mapInstance.flyToBounds(bounds, { padding: [50, 50], duration: 1 });
    }
  }, [mapInstance, plotAlarmLinks]);

  // ========== Render ==========

  return (
    <>
      <div className="flex flex-col h-[calc(100vh-1.7rem)] w-full overflow-hidden relative bg-background">

        {/* ========== Page Mode Toggle + Alarm Stats (top-left) ========== */}
        {(pageMode === 'alarm' || currentView === 'map') && (
          <div className="absolute top-4 left-4 z-[500] flex items-center gap-2">
            <PageModeToggle mode={pageMode} onModeChange={setPageMode} />
            {/* AlarmStatsBar removed — count now shown inside AlarmHistoryPanel button */}
          </div>
        )}

        {/* ========== ALARM VIEW ========== */}
        {pageMode === 'alarm' ? (
          <div ref={mapContainerRef} className="h-full w-full relative bg-background">

            {/* Alarm view controls - top right */}
            <div className="absolute top-4 right-4 z-[400] flex items-center gap-2 flex-wrap justify-end">
              {/* WebSocket status */}
              <div
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-background/95 backdrop-blur-sm shadow-lg border border-border"
                title={isWsConnected ? 'Live alarms connected via WebSocket' : 'WebSocket disconnected — using manual fetch'}
              >
                <span className={`inline-block h-2 w-2 rounded-full ${isWsConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                {isWsConnected
                  ? `Last Updated: ${alarmLastUpdated ? alarmLastUpdated.toLocaleTimeString() : '—'}`
                  : 'Offline'}
              </div>
              <ResetViewControl mapRef={mapInstance} />

              {/* Zoom to Alarmed Routes */}
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 px-3 gap-1.5 bg-background/95 backdrop-blur-sm shadow-lg border-border"
                      onClick={() => {
                        const alarmedGroups = sitePairGroups.filter(g => g.spans.some(s => spanHasAlarm(s.spanId)));
                        if (alarmedGroups.length > 0 && mapInstance) {
                          const lats = alarmedGroups.flatMap(g => [g.latA, g.latB]);
                          const lons = alarmedGroups.flatMap(g => [g.lonA, g.lonB]);
                          mapInstance.flyToBounds(
                            [[Math.min(...lats), Math.min(...lons)], [Math.max(...lats), Math.max(...lons)]],
                            { padding: [40, 40], duration: 1.2 }
                          );
                        }
                      }}
                    >
                      <Crosshair className="h-4 w-4 text-destructive" />
                      <span className="text-xs font-medium">Zoom</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Fit map to show all alarmed routes</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Heatmap toggle */}
              {/* <div className="flex items-center gap-2 bg-background/95 backdrop-blur-sm rounded-lg shadow-lg border border-border px-3 py-1.5">
                <Flame className={`h-3.5 w-3.5 ${showHeatmap ? 'text-orange-500' : 'text-muted-foreground'}`} />
                <span className="text-xs font-medium">Heatmap</span>
                <Switch checked={showHeatmap} onCheckedChange={setShowHeatmap} />
              </div> */}

              {/* All/Alarm filter */}
              <div className="flex items-center gap-2 bg-background/95 backdrop-blur-sm rounded-lg shadow-lg border border-border px-3 py-1.5">
                <span className={`text-xs font-medium ${!showOnlyAlarmed ? 'text-foreground' : 'text-muted-foreground'}`}>All Routes</span>
                <Switch checked={showOnlyAlarmed} onCheckedChange={setShowOnlyAlarmed} />
                <span className={`text-xs font-medium ${showOnlyAlarmed ? 'text-destructive' : 'text-muted-foreground'}`}>Alarm Only</span>
              </div>
              <LabelToggle showSiteLabels={showSiteLabels} onSiteLabelsToggle={setShowSiteLabels} showLinkLabels={showLinkLabels} onLinkLabelsToggle={setShowLinkLabels} mode="alarm" />
              <AlarmHistoryPanel
                alarms={alarms}
                onZoomToAlarm={handleZoomToAlarm}
                onRefresh={fetchAlarms}
                isLoading={alarmsLoading}
              />
              <MapViewSelector currentView={viewMode} onViewChange={setViewMode} />
              <FullscreenControl />
            </div>

            <MapContainer
              center={INDIA_CENTER}
              zoom={6}
              maxZoom={MAX_ZOOM}
              className="h-full w-full z-0"
              zoomControl={false}
              scrollWheelZoom={true}
              attributionControl={false}
              zoomSnap={0.25}
              zoomDelta={0.25}
              wheelPxPerZoomLevel={120}
              ref={(map) => setMapInstance(map || null)}
            >
              <TileLayerController viewMode={viewMode} />

              {/* Fiber Routes — always-on background fiber polylines (same API as Management View) */}
              {fiberData.routes.length > 0 && (
                <FiberRoutesLayer
                  routes={fiberData.routes}
                  colorMode="type"
                  showSpanLabels={false}
                />
              )}

              {/* Plot Alarm Links Layer — site dots from plotAlarms API + red alarm line
                  (drawn ONLY between sites with active alarms; follows fiber route by spanId) */}
              {sitePairGroups.length > 0 && (
                <PlotAlarmLinksLayer
                  sitePairGroups={showOnlyAlarmed 
                    ? sitePairGroups.filter(g => g.spans.some(s => spanHasAlarm(s.spanId)))
                    : sitePairGroups
                  }
                  spanHasAlarm={spanHasAlarm}
                  getAlarmsForSpan={getAlarmsForSpan}
                  onGroupClick={handleAlarmGroupClick}
                  showSiteLabels={showSiteLabels}
                  showSpanLabels={showLinkLabels}
                  showHeatmap={showHeatmap}
                  fiberRoutes={fiberData.routes}
                />
              )}
              
              <MapZoomControl />
            </MapContainer>

            {/* Alarm Legend */}
            <div className="absolute bottom-4 left-4 z-[400]">
              <AlarmLegend />
            </div>

            {/* Alarm Span Details Sidebar */}
            <AlarmRouteDetailsSidebar
              group={selectedSitePairGroup}
              spanHasAlarm={spanHasAlarm}
              getAlarmsForSpan={getAlarmsForSpan}
              open={alarmSidebarOpen}
              onClose={() => setAlarmSidebarOpen(false)}
              container={mapContainerRef.current}
            />

            {/* Auto-open OTS Insights for alarmed spans */}
            <OtsInsightsDialog
              open={otsAutoOpen}
              onClose={() => setOtsAutoOpen(false)}
              spanId={otsAutoSpanId}
              adapter="MCP"
              routeName={selectedSitePairGroup ? `${selectedSitePairGroup.siteA} → ${selectedSitePairGroup.siteB}` : ''}
            />
          </div>
        ) : (
          /* ========== MANAGEMENT VIEW (existing) ========== */
          <>
            {/* ========== Conditional View Rendering ========== */}
            {currentView === 'dashboard' ? (
              <div className="h-full w-full overflow-hidden">
                {dashboardDomain === 'FIBER' ? (
                  <FiberDashboardView
                    routes={filteredRoutes}
                    sites={filteredSites}
                    currentView={currentView}
                    onViewChange={setCurrentView}
                    selectedDomain={dashboardDomain}
                    onDomainChange={setDashboardDomain}
                  />
                ) : (
                  <DashboardView 
                    currentView={currentView} 
                    onViewChange={setCurrentView}
                    selectedDomain={dashboardDomain}
                    onDomainChange={setDashboardDomain}
                  />
                )}
              </div>
            ) : currentView === 'map' ? (
              <div ref={mapContainerRef} className="h-full w-full relative bg-background">
                {/* Top-right controls - Row 1: View & Map controls */}
                <div className="absolute top-4 right-4 z-[400] flex items-center gap-2">
                  <ResetViewControl mapRef={mapInstance} />
                  <ViewToggle currentView={currentView} onViewChange={setCurrentView} />
                  <DomainSelector 
                    selectedDomain={selectedDomain}
                    onDomainChange={setSelectedDomain}
                    hasFiberData={fiberLoaded && (fiberData.routes.length > 0 || fiberData.sites.length > 0)}
                  />
                  <SearchFilter
                    nodes={nodes} 
                    onNodeSelect={handleSearchSelect}
                    fiberRoutes={filteredRoutes}
                    fiberSites={filteredSites}
                    onFiberRouteSelect={handleSearchFiberRouteSelect}
                    onFiberSiteSelect={handleSearchFiberSiteSelect}
                  />
                  <MapViewSelector currentView={viewMode} onViewChange={setViewMode} />
                  {/* {selectedDomain === 'ALL' && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowOverseasInAll(v => !v)}
                      title={showOverseasInAll ? 'Hide overseas cables' : 'Show overseas cables'}
                      className={`h-8 w-8 bg-background/95 backdrop-blur-sm shadow-lg border-border transition-all hover:bg-muted ${showOverseasInAll ? 'border-primary text-primary' : ''}`}
                    >
                      <Waves className="h-4 w-4" />
                    </Button>
                  )} */}
                  <FullscreenControl />
                </div>

                {/* Top-right controls - Row 2: Collapsible Filters Bar */}
                <div className="absolute top-14 right-4 z-[400]">
                  <MapFiltersBar
                    availableSectors={availableSectors}
                    selectedSector={selectedSector}
                    onSectorChange={setSelectedSector}
                    linkColorMode={linkColorMode}
                    onLinkColorModeChange={setLinkColorMode}
                    fiberColorMode={fiberColorMode}
                    onFiberColorModeChange={setFiberColorMode}
                    showSiteLabels={showSiteLabels}
                    onSiteLabelsToggle={setShowSiteLabels}
                    circuitFilters={filters}
                    onCircuitFilterChange={handleFilterChange}
                    availableCircles={availableCircles}
                    fiberFilters={fiberFilters}
                    onFiberFilterChange={setFiberFilters}
                    fiberData={fiberData}
                    selectedDomain={selectedDomain}
                    hasFiberData={fiberLoaded && (fiberData.routes.length > 0 || fiberData.sites.length > 0)}
                    fiberLoaded={fiberLoaded}
                    fiberRoutesCount={fiberData.routes.length}
                  />
                </div>

                <MapContainer
                  center={INDIA_CENTER}
                  zoom={DEFAULT_ZOOM}
                  maxZoom={MAX_ZOOM}
                  className="h-full w-full z-0"
                  zoomControl={false}
                  scrollWheelZoom={true}
                  attributionControl={false}
                  zoomSnap={0.25}
                  zoomDelta={0.25}
                  wheelPxPerZoomLevel={120}
                  ref={(map) => setMapInstance(map || null)}
                >
                  <TileLayerController viewMode={viewMode} />
                  
                  {(selectedDomain === 'ALL' || selectedDomain === 'IP_OPTICAL') && (
                    <LinksLayer 
                      links={filteredLinks} 
                      allLinks={links}
                      onLinkHover={handleLinkHover} 
                      onLinkLeave={handleLinkLeave}
                      onLinkClick={handleLinkClick}
                      selectedLink={selectedLink}
                      colorMode={linkColorMode}
                      onSectorClick={setSelectedSector}
                      selectedSector={selectedSector}
                      showLabels={showSiteLabels}
                    />
                  )}
                  
                  {(selectedDomain === 'ALL' || selectedDomain === 'IP_OPTICAL') && (
                    <NodesLayer 
                      nodes={filteredNodes} 
                      onNodeClick={handleNodeClick} 
                      onNodeHover={handleNodeHover} 
                      onNodeLeave={handleNodeLeave}
                      highlightedNode={searchSelectedNode}
                      showLabels={showSiteLabels}
                    />
                  )}
                  
                  {(selectedDomain === 'ALL' || selectedDomain === 'FIBER' || selectedDomain === 'OVERSEAS') && filteredRoutes.length > 0 && (
                    <FiberRoutesLayer 
                      routes={filteredRoutes}
                      onRouteClick={handleFiberRouteClick}
                      selectedRoute={selectedFiberRoute}
                      colorMode={fiberColorMode}
                    />
                  )}
                  
                  {(selectedDomain === 'ALL' || selectedDomain === 'FIBER' || selectedDomain === 'OVERSEAS') && filteredSites.length > 0 && (
                    <FiberSitesLayer 
                      sites={filteredSites}
                      onSiteClick={handleFiberSiteClick}
                      selectedSite={selectedFiberSite}
                      fiberOnlyMode={selectedDomain === 'FIBER' || selectedDomain === 'OVERSEAS'}
                      showLabels={showSiteLabels}
                    />
                  )}
                  
                  {/* Overseas submarine cables - shown on OVERSEAS domain, and as overlay on ALL (toggleable) */}
                  {(isOverseasVisible || (selectedDomain === 'ALL' && showOverseasInAll)) && (
                    <OverseasLayer
                      cables={overseas.cables}
                      visibility={overseas.visibility}
                      selectedSegmentId={overseas.selectedSegment?.id ?? null}
                      showLandingLabels={showOverseasLandingLabels}
                      onSegmentClick={(seg, cable) => {
                        overseas.setSelectedSegment(seg);
                        overseas.setSelectedCableId(cable.id);
                      }}
                    />
                  )}
                  
                  <MapCenterController node={searchSelectedNode} />
                  <MapZoomControl />
                </MapContainer>

                {/* Bottom-left slot: standard legend OR overseas panel (mutually exclusive) */}
                {isOverseasVisible ? (
                  <div className="absolute bottom-4 left-4 z-[450]">
                    <OverseasSidebar
                      cables={overseas.cables}
                      visibility={overseas.visibility}
                      onToggleCable={overseas.toggleCable}
                      visibleTotalLengthKm={overseas.visibleTotalLengthKm}
                      selectedSegment={overseas.selectedSegment}
                      onClearSelection={() => overseas.setSelectedSegment(null)}
                      onFitToBounds={handleFitOverseas}
                      onFitCable={handleFitOverseasCable}
                      showLandingLabels={showOverseasLandingLabels}
                      onToggleLandingLabels={setShowOverseasLandingLabels}
                      onOpenGlobe={() => setOverseasGlobeOpen(true)}
                      isLoading={overseas.isLoading}
                      error={overseas.error}
                    />
                  </div>
                ) : (
                  <div className="absolute bottom-4 left-4 z-[400]">
                    <MapLegend
                      colorMode={linkColorMode}
                      selectedDomain={selectedDomain}
                      fiberColorMode={fiberColorMode}
                      onOpenGlobe={
                        selectedDomain === 'FIBER' && fiberLoaded
                          ? () => setFiberGlobeOpen(true)
                          : undefined
                      }
                      globeDisabled={
                        filteredRoutes.length === 0 && filteredSites.length === 0
                      }
                    />
                  </div>
                )}

                {selectedSector && (
                  <SectorSummaryPanel
                    sector={selectedSector}
                    onClear={() => setSelectedSector('')}
                  />
                )}

                <NodeTooltip node={hoveredNode} position={tooltipPosition} />
                <LinkTooltip link={hoveredLink} position={tooltipPosition} allLinks={links} />

                <NodeDetailsSidebar 
                  node={selectedNode} 
                  open={nodeSidebarOpen} 
                  onClose={closeNodeSidebar}
                  container={mapContainerRef.current}
                />
                
                <LinkDetailsSidebar 
                  link={selectedLink} 
                  open={linkSidebarOpen} 
                  onClose={closeLinkSidebar}
                  container={mapContainerRef.current}
                  sectorLinks={selectedLink?.circuit?.sector 
                    ? links.filter(l => l.circuit?.sector === selectedLink.circuit.sector) 
                    : []
                  }
                  onViewInTable={(sector) => {
                    setSelectedSector(sector);
                    setCurrentView('connectivity');
                    closeLinkSidebar();
                  }}
                />
                
                <FiberRouteDetailsSidebar 
                  route={selectedFiberRoute}
                  open={fiberRouteSidebarOpen}
                  onClose={() => setFiberRouteSidebarOpen(false)}
                  container={mapContainerRef.current}
                />
                
                <FiberSiteDetailsSidebar 
                  site={selectedFiberSite}
                  open={fiberSiteSidebarOpen}
                  onClose={() => setFiberSiteSidebarOpen(false)}
                  container={mapContainerRef.current}
                />

                {/* 3D Globe overlay (Overseas only) */}
                {isOverseasVisible && overseasGlobeOpen && (
                  <OverseasGlobe
                    cables={overseas.cables}
                    visibility={overseas.visibility}
                    fiberRoutes={filteredRoutes}
                    fiberSites={filteredSites}
                    fiberColorMode={fiberColorMode}
                    onClose={() => setOverseasGlobeOpen(false)}
                  />
                )}

                {/* 3D Globe overlay (FIBER domain only) — always opens on India */}
                {selectedDomain === 'FIBER' && fiberGlobeOpen && (
                  <FiberGlobe
                    routes={filteredRoutes}
                    sites={filteredSites}
                    colorMode={fiberColorMode}
                    onClose={() => setFiberGlobeOpen(false)}
                  />
                )}
              </div>
            ) : (
              <div className="h-full w-full flex flex-col">
                <div className="flex-shrink-0 flex items-center justify-between p-2 border-b border-border/50 bg-muted/20">
                  <div className="flex items-center gap-3">
                    <TableDomainToggle
                      selectedDomain={tableDomain}
                      onDomainChange={setTableDomain}
                    />
                    {tableDomain === 'IP_OPTICAL' && availableSectors.length > 0 && (
                      <SectorDropdown
                        availableSectors={availableSectors}
                        selectedSector={selectedSector}
                        onSectorChange={setSelectedSector}
                        compact
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <LastCaptureTime domain={tableDomain === 'FIBER' ? 'FIBER' : 'IP_OPTICAL'} />
                    <ViewToggle currentView={currentView} onViewChange={setCurrentView} />
                  </div>
                </div>
                <div className="flex-1 p-3 min-h-0">
                  <ConnectivityTable 
                    links={links} 
                    nodes={nodes}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    fiberRoutes={filteredRoutes}
                    fiberSites={filteredSites}
                    fiberFilters={fiberFilters}
                    onFiberFilterChange={setFiberFilters}
                    tableDomain={tableDomain}
                    selectedSector={selectedSector}
                    availableSectors={availableSectors}
                    onSectorChange={setSelectedSector}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>

    </>
  );
}