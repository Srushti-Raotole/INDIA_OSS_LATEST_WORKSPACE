
// import { useState, useRef, useEffect } from 'react';
// import { Button } from '../../../../components/ui/button';
// import { 
//   Map, Mountain, Heart, Bike, Sun, Moon, Compass, ChevronDown,
//   Globe, Satellite, EyeOff, MapPinned,
// } from 'lucide-react';
// import { MapViewMode } from '../../types';
// import { MAP_TILES } from '../../constants';

// interface MapViewSelectorProps {
//   currentView: MapViewMode;
//   onViewChange: (view: MapViewMode) => void;
// }

// const viewIcons: Record<MapViewMode, React.ReactNode> = {
//   cartoVoyager: <Compass className="h-4 w-4" />,
//   cartoLight: <Sun className="h-4 w-4" />,
//   cartoDark: <Moon className="h-4 w-4" />,
//   cartoVoyagerNoLabel: <EyeOff className="h-4 w-4" />,
//   cartoLightNoLabel: <EyeOff className="h-4 w-4" />,
//   cartoDarkNoLabel: <EyeOff className="h-4 w-4" />,
//   streets: <Map className="h-4 w-4" />,
//   humanitarian: <Heart className="h-4 w-4" />,
//   terrain: <Mountain className="h-4 w-4" />,
//   cycle: <Bike className="h-4 w-4" />,
//   osmFrance: <MapPinned className="h-4 w-4" />,
//   esriWorldStreet: <Globe className="h-4 w-4" />,
//   esriWorldImagery: <Satellite className="h-4 w-4" />,
// };

// const categoryLabels: Record<string, string> = {
//   // carto: 'CartoDB (Free & Unlimited)',
//   // osm: 'OpenStreetMap (Free & Unlimited)',
//   // esri: 'Esri (Free)',
// };

// export function MapViewSelector({ currentView, onViewChange }: MapViewSelectorProps) {
//   const [isOpen, setIsOpen] = useState(false);
//   const dropdownRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
//         setIsOpen(false);
//       }
//     };
//     document.addEventListener('mousedown', handleClickOutside);
//     return () => document.removeEventListener('mousedown', handleClickOutside);
//   }, []);

//   const groupedTiles = Object.entries(MAP_TILES).reduce((acc, [key, config]) => {
//     const category = config.category;
//     if (!acc[category]) acc[category] = [];
//     acc[category].push({ key: key as MapViewMode, ...config });
//     return acc;
//   }, {} as Record<string, Array<{ key: MapViewMode } & typeof MAP_TILES[MapViewMode]>>);

//   // Order: carto first, then osm, then esri
//   const categoryOrder = ['carto', 'osm', 'esri'];

//   return (
//     <div className="relative z-[400]" ref={dropdownRef}>
//       <Button
//         variant="outline"
//         size="sm"
//         onClick={() => setIsOpen(!isOpen)}
//         className="gap-2 bg-background/95 backdrop-blur-sm shadow-lg border-border h-9"
//         title={`Map Style: ${MAP_TILES[currentView].name}`}
//       >
//         {viewIcons[currentView]}
//         <span className="text-xs hidden sm:inline">{MAP_TILES[currentView].name}</span>
//         <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
//       </Button>

//       {isOpen && (
//         <div className="absolute top-full right-0 mt-1 w-60 bg-background/95 backdrop-blur-sm rounded-lg shadow-lg border border-border overflow-hidden max-h-[70vh] overflow-y-auto">
//           {categoryOrder.filter(cat => groupedTiles[cat]).map((category) => (
//             <div key={category}>
//               {/* <div className="px-3 py-1.5 text-[10px] text-muted-foreground bg-muted/30 font-medium sticky top-0">
//                 {categoryLabels[category]}
//               </div> */}
//               <div className="p-1">
//                 {groupedTiles[category].map(({ key, name, description }) => (
//                   <Button
//                     key={key}
//                     variant={currentView === key ? 'secondary' : 'ghost'}
//                     size="sm"
//                     className="w-full justify-start gap-2 h-8"
//                     onClick={() => { onViewChange(key); setIsOpen(false); }}
//                     title={description}
//                   >
//                     {viewIcons[key]}
//                     <span className="text-xs">{name}</span>
//                   </Button>
//                 ))}
//               </div>
//             </div>
//           ))}
   
//         </div>
//       )}
//     </div>
//   );
// }
// ============================================
// Map View Selector Component
// ============================================

import { useState, useRef, useEffect } from 'react';
import { Button } from '../../../../components/ui/button';
import { 
  Map, Mountain, Heart, Bike, Sun, Moon, Compass, ChevronDown,
  Globe, Satellite, MapPinned,
  Layers,
  BookOpen,
} from 'lucide-react';
import { MapViewMode } from '../../types';
import { MAP_TILES } from '../../constants';

interface MapViewSelectorProps {
  currentView: MapViewMode;
  onViewChange: (view: MapViewMode) => void;
}

// const viewIcons: Record<MapViewMode, React.ReactNode> = {
//   cartoVoyager: <Compass className="h-4 w-4" />,
//   cartoLight: <Sun className="h-4 w-4" />,
//   cartoDark: <Moon className="h-4 w-4" />,
//   cartoVoyagerClean: <Compass className="h-4 w-4" />,
//   cartoLightClean: <Sun className="h-4 w-4" />,
//   cartoDarkClean: <Moon className="h-4 w-4" />,
//   streets: <Map className="h-4 w-4" />,
//   humanitarian: <Heart className="h-4 w-4" />,
//   terrain: <Mountain className="h-4 w-4" />,
//   cycle: <Bike className="h-4 w-4" />,
//   osmFrance: <MapPinned className="h-4 w-4" />,
//   esriWorldStreet: <Globe className="h-4 w-4" />,
//   esriWorldImagery: <Satellite className="h-4 w-4" />,
// };
const viewIcons: Record<string, React.ReactNode> = {
  // ========== OPENMAPTILES ==========
  omtStreets: <Map className="h-4 w-4" />,
  omtSatellite: <Satellite className="h-4 w-4" />,
  omtOutdoor: <Mountain className="h-4 w-4" />,
  omtBasic: <Layers className="h-4 w-4" />,
  omtLight: <Sun className="h-4 w-4" />,

  // ========== VIBRANT & HIGHLIGHT ==========
  ofmBright: <Compass className="h-4 w-4" />,
  wikimedia: <BookOpen className="h-4 w-4" />,

  // ========== GENERAL BASEMAPS ==========
  cartoVoyager: <Compass className="h-4 w-4" />,
  cartoLight: <Sun className="h-4 w-4" />,
  cartoDark: <Moon className="h-4 w-4" />,

  // ========== CLEAN BASEMAPS ==========
  cartoVoyagerClean: <Compass className="h-4 w-4" />,
  omtLightClean: <Sun className="h-4 w-4 opacity-70" />,
  omtDarkClean: <Moon className="h-4 w-4 opacity-70" />,
};
const categoryLabels: Record<string, string> = {
  carto: 'General (Free, No API Key)',
  clean: 'Clean (No Labels)',
  osm: 'OpenStreetMap (Free & Unlimited)',
  esri: 'Esri (Free)',
};


export function MapViewSelector({ currentView, onViewChange }: MapViewSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const groupedTiles = Object.entries(MAP_TILES).reduce((acc, [key, config]) => {
    const category = config.category;
    if (!acc[category]) acc[category] = [];
    acc[category].push({ key: key as MapViewMode, ...config });
    return acc;
  }, {} as Record<string, Array<{ key: MapViewMode } & typeof MAP_TILES[MapViewMode]>>);

  // Order: carto first, then osm, then esri
  const categoryOrder = ['carto', 'clean', 'osm', 'esri'];

  return (
    <div className="relative z-[400]" ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="gap-2 bg-background/95 backdrop-blur-sm shadow-lg border-border h-9"
        title={`Map Style: ${MAP_TILES[currentView].name}`}
      >
        {viewIcons[currentView]}
        <span className="text-xs hidden sm:inline">{MAP_TILES[currentView].name}</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-60 bg-background/95 backdrop-blur-sm rounded-lg shadow-lg border border-border overflow-hidden max-h-[70vh] overflow-y-auto">
          {categoryOrder.filter(cat => groupedTiles[cat]).map((category) => (
            <div key={category}>
              {/* <div className="px-3 py-1.5 text-[10px] text-muted-foreground bg-muted/30 font-medium sticky top-0">
                {categoryLabels[category]}
              </div> */}
              <div className="p-1">
                {groupedTiles[category].map(({ key, name, description }) => (
                  <Button
                    key={key}
                    variant={currentView === key ? 'secondary' : 'ghost'}
                    size="sm"
                    className="w-full justify-start gap-2 h-8"
                    onClick={() => { onViewChange(key); setIsOpen(false); }}
                    title={description}
                  >
                    {viewIcons[key]}
                    <span className="text-xs">{name}</span>
                  </Button>
                ))}
              </div>
            </div>
          ))}
   
        </div>
      )}
    </div>
  );
}
