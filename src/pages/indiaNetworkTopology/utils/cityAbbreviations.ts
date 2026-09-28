
const CITY_ABBREVIATIONS: Record<string, string> = {
  'Mumbai': 'MUM',
  'Navi Mumbai': 'NAVI',
  'Chennai': 'CHE',
  'Bangalore': 'BLR',
  'South Delhi': 'SDEL',
  'Central Delhi': 'CDEL',
  'North Delhi': 'NDEL',
  'HYDERABAD': 'HYD',
  'Hyderabad': 'HYD',
  'Noida': 'NOI',
  'PUNE': 'PUN',
  'Pune': 'PUN',
  'Kolkata': 'KOL',
  'Ghaziabad': 'GZB',
  'Panvel': 'PNV',
  'Raigad': 'RAI',
  'Gandhinagar': 'GND',
  'Krishna': 'KRI',
  'Nagpur': 'NAG',
  'BANASANKTHA': 'BNS',
  'DBNF': 'DBNF',
};

/**
 * Get abbreviated city name
 * @param cityName - Full city name
 * @returns Abbreviated city name (e.g., "MUM" for "Mumbai")
 */
export function getAbbreviatedCity(cityName: string): string {
  if (!cityName) return '';
  
  // Check if already an abbreviation or short
  if (cityName.length <= 4) return cityName.toUpperCase();
  
  // Look up in mapping
  const normalized = cityName.trim();
  if (CITY_ABBREVIATIONS[normalized]) {
    return CITY_ABBREVIATIONS[normalized];
  }
  
  // Fallback: first 3 characters uppercase
  return normalized.substring(0, 3).toUpperCase();
}

/**
 * Get abbreviated city pair (e.g., "Mumbai - Chennai" → "MUM - CHE")
 * @param cityPair - City pair string like "Mumbai - Chennai" or "- Chennai"
 * @returns Abbreviated pair like "MUM - CHE" or "CHE"
 */
export function getAbbreviatedCityPair(cityPair: string): string {
  if (!cityPair) return '';
  
  const parts = cityPair.split(' - ').map(p => p.trim());
  
  if (parts.length === 2) {
    const [cityA, cityB] = parts;
    
    // Handle empty first city (e.g., " - Chennai")
    if (!cityA && cityB) {
      return getAbbreviatedCity(cityB);
    }
    
    // Handle empty second city (e.g., "Chennai - ")
    if (cityA && !cityB) {
      return getAbbreviatedCity(cityA);
    }
    
    // Both cities present
    return `${getAbbreviatedCity(cityA)} - ${getAbbreviatedCity(cityB)}`;
  }
  
  // Single city or no separator
  return getAbbreviatedCity(cityPair);
}

/**
 * Format capacity value to TB
 * @param gbValue - Value in GB
 * @returns Formatted string in TB (e.g., "294.3 TB")
 */
export function formatCapacityToTB(gbValue: number): string {
  const tbValue = gbValue / 1000;
  if (tbValue >= 1000) {
    return `${(tbValue / 1000).toFixed(2)} PB`;
  }
  if (tbValue >= 1) {
    return `${tbValue.toFixed(2)} TB`;
  }
  return `${gbValue.toFixed(0)} GB`;
}

/**
 * Format capacity value for chart axis (compact)
 * @param gbValue - Value in GB
 * @returns Compact formatted string (e.g., "294T", "50G")
 */
export function formatCapacityCompact(gbValue: number): string {
  const tbValue = gbValue / 1000;
  if (tbValue >= 1000) {
    return `${(tbValue / 1000).toFixed(1)}P`;
  }
  if (tbValue >= 1) {
    return `${tbValue.toFixed(1)}T`;
  }
  return `${gbValue.toFixed(0)}G`;
}
