// // ============================================
// // KML Parser Utility
// // ============================================
// // Parses KML string content into FiberData structures
// // Handles both fiber routes (LineStrings) and sites (Points)
// //
// // LIBRARY: Native DOMParser (no external dependencies)

// import type { FiberSite, FiberRoute, FiberData } from '../types/fiberTypes';

// /**
//  * Convert KML AABBGGRR color format to hex RGB
//  * @param kmlColor - KML color string (8 chars: AABBGGRR)
//  * @returns Hex color string (#RRGGBB)
//  */
// function parseKMLColor(kmlColor: string): string {
//   if (!kmlColor || kmlColor.length !== 8) return '#ff0000';
//   // KML format: AABBGGRR -> #RRGGBB
//   const r = kmlColor.substring(6, 8);
//   const g = kmlColor.substring(4, 6);
//   const b = kmlColor.substring(2, 4);
//   return `#${r}${g}${b}`;
// }

// /**
//  * Parse coordinates from KML coordinate string
//  * @param coordString - Space-separated coordinate string (lon,lat,alt)
//  * @returns Array of [lon, lat] tuples
//  */
// function parseCoordinates(coordString: string): [number, number][] {
//   return coordString
//     .trim()
//     .split(/\s+/)
//     .filter(coord => coord.length > 0)
//     .map(coord => {
//       const [lon, lat] = coord.split(',').map(Number);
//       return [lon, lat] as [number, number];
//     })
//     .filter(([lon, lat]) => !isNaN(lon) && !isNaN(lat));
// }

// /**
//  * Get extended data value from a Placemark
//  * @param placemark - DOM Element for placemark
//  * @param fieldName - SimpleData field name to extract
//  * @returns Field value or empty string
//  */
// function getExtendedData(placemark: Element, fieldName: string): string {
//   const simpleData = placemark.querySelectorAll('SimpleData');
//   for (const data of Array.from(simpleData)) {
//     if (data.getAttribute('name') === fieldName) {
//       return data.textContent || '';
//     }
//   }
//   return '';
// }

// /**
//  * Parse sites from KML document
//  * Sites are Placemarks with Point geometry
//  * 
//  * @param doc - Parsed KML document
//  * @returns Array of FiberSite objects
//  */
// export function parseSitesFromKML(doc: Document): FiberSite[] {
//   const sites: FiberSite[] = [];
//   const placemarks = doc.querySelectorAll('Placemark');
  
//   let siteIndex = 0;
//   for (const placemark of Array.from(placemarks)) {
//     const pointElement = placemark.querySelector('Point coordinates');
//     if (!pointElement) continue;
    
//     const name = placemark.querySelector('name')?.textContent || `Site ${siteIndex + 1}`;
//     const coordString = pointElement.textContent || '';
//     const coords = parseCoordinates(coordString);
    
//     if (coords.length === 0) continue;
    
//     const seqStr = getExtendedData(placemark, 'Seq');
//     const technology = getExtendedData(placemark, 'Type');
    
//     sites.push({
//       id: `fiber-site-${siteIndex++}`,
//       nodeName: name,
//       nodeIP: '',
//       name,
//       latitude: coords[0][1],
//       longitude: coords[0][0],
//       coordinates: coords[0],
//       seq: seqStr ? parseInt(seqStr, 10) : undefined,
//       linkName: getExtendedData(placemark, 'Link Name'),
//       technology: technology.toUpperCase() || 'UNKNOWN',
//       connType: getExtendedData(placemark, 'Conn Type'),
//       layer: getExtendedData(placemark, 'layer'),
//     });
//   }
  
//   return sites;
// }

// /**
//  * Parse fiber routes from KML document
//  * Routes are Placemarks with LineString geometry (may be in MultiGeometry)
//  * 
//  * @param doc - Parsed KML document
//  * @returns Array of FiberRoute objects
//  */
// export function parseFiberRoutesFromKML(doc: Document): FiberRoute[] {
//   const routes: FiberRoute[] = [];
//   const placemarks = doc.querySelectorAll('Placemark');
  
//   let routeIndex = 0;
//   for (const placemark of Array.from(placemarks)) {
//     // Check for LineString (direct or in MultiGeometry)
//     const lineStrings = placemark.querySelectorAll('LineString coordinates');
//     if (lineStrings.length === 0) continue;
    
//     // Get style color
//     const colorElement = placemark.querySelector('Style LineStyle color');
//     const color = colorElement ? parseKMLColor(colorElement.textContent || '') : '#ff0000';
    
//     // Get extended data
//     const routeName = getExtendedData(placemark, 'Route Name');
//     const lengthKmsStr = getExtendedData(placemark, 'Length Kms');
//     const type = getExtendedData(placemark, 'Type');
    
//     // Combine all LineString coordinates for MultiGeometry
//     const allCoordinates: [number, number][] = [];
//     for (const lineString of Array.from(lineStrings)) {
//       const coordString = lineString.textContent || '';
//       const coords = parseCoordinates(coordString);
//       allCoordinates.push(...coords);
//     }
    
//     if (allCoordinates.length < 2) continue;
    
//     routes.push({
//       id: `fiber-route-${routeIndex++}`,
//       routeName: routeName || `Fiber Route ${routeIndex}`,
//       linkName: getExtendedData(placemark, 'Link Name'),
//       construction: getExtendedData(placemark, 'Constructi'),
//       lengthKms: lengthKmsStr ? parseFloat(lengthKmsStr) : 0,
//       type: type.toUpperCase() || 'NLD',
//       methodology: getExtendedData(placemark, 'Methodolog').toUpperCase() || 'UNKNOWN',
//       color,
//       coordinates: allCoordinates,
//       layer: getExtendedData(placemark, 'layer'),
//       spanid: '',
//     });
//   }
  
//   return routes;
// }

// /**
//  * Parse KML string and return structured fiber data
//  * 
//  * @param kmlContent - Raw KML string content
//  * @returns FiberData with sites and routes
//  */
// export function parseKMLString(kmlContent: string): FiberData {
//   const parser = new DOMParser();
//   const doc = parser.parseFromString(kmlContent, 'text/xml');
  
//   // Check for parsing errors
//   const parseError = doc.querySelector('parsererror');
//   if (parseError) {
//     console.error('KML parsing error:', parseError.textContent);
//     return { sites: [], routes: [] };
//   }
  
//   const sites = parseSitesFromKML(doc);
//   const routes = parseFiberRoutesFromKML(doc);
  
//   return { sites, routes };
// }
