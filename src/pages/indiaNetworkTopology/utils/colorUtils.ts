

export const UTILIZATION_THRESHOLDS = {
  HIGH: 80,
  MEDIUM: 50,
};

// ============================================
// Tailwind Class Getters
// ============================================

export function getUtilizationColorClass(percent: number): string {
  if (percent >= UTILIZATION_THRESHOLDS.HIGH) return 'text-util-high';
  if (percent >= UTILIZATION_THRESHOLDS.MEDIUM) return 'text-util-medium';
  return 'text-util-low';
}


export function getUtilizationBgClass(percent: number): string {
  if (percent >= UTILIZATION_THRESHOLDS.HIGH) return 'bg-util-high';
  if (percent >= UTILIZATION_THRESHOLDS.MEDIUM) return 'bg-util-medium';
  return 'bg-util-low';
}

/**
 * Get background color with opacity for subtle backgrounds
 * 
 * @param percent - Utilization percentage (0-100)
 * @returns Tailwind background color class with opacity
 */
export function getUtilizationBgWithOpacity(percent: number): string {
  if (percent >= UTILIZATION_THRESHOLDS.HIGH) return 'bg-util-high/10';
  if (percent >= UTILIZATION_THRESHOLDS.MEDIUM) return 'bg-util-medium/10';
  return 'bg-util-low/10';
}


export function getUtilizationColor(percent: number): string {
  // Try to get computed styles from document
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    const style = getComputedStyle(root);
    
    let varName: string;
    if (percent >= UTILIZATION_THRESHOLDS.HIGH) {
      varName = '--util-high';
    } else if (percent >= UTILIZATION_THRESHOLDS.MEDIUM) {
      varName = '--util-medium';
    } else {
      varName = '--util-low';
    }
    
    const hslValue = style.getPropertyValue(varName).trim();
    if (hslValue) {
      return `hsl(${hslValue})`;
    }
  }
  
  // Fallback colors if CSS variables not available
  if (percent >= UTILIZATION_THRESHOLDS.HIGH) return 'hsl(0, 84%, 60%)';
  if (percent >= UTILIZATION_THRESHOLDS.MEDIUM) return 'hsl(45, 93%, 47%)';
  return 'hsl(142, 76%, 36%)';
}

/**
 * Get node primary color from CSS variables
 * 
 * @returns HSL color string for primary node color
 */
export function getNodePrimaryColor(): string {
  if (typeof document !== 'undefined') {
    const style = getComputedStyle(document.documentElement);
    const hslValue = style.getPropertyValue('--node-primary').trim();
    if (hslValue) {
      return `hsl(${hslValue})`;
    }
  }
  return 'hsl(217, 91%, 60%)';
}

/**
 * Get node highlighted color from CSS variables
 * 
 * @returns HSL color string for highlighted node color
 */
export function getNodeHighlightedColor(): string {
  if (typeof document !== 'undefined') {
    const style = getComputedStyle(document.documentElement);
    const hslValue = style.getPropertyValue('--node-highlighted').trim();
    if (hslValue) {
      return `hsl(${hslValue})`;
    }
  }
  return 'hsl(38, 92%, 50%)';
}

/**
 * Get cluster background color from CSS variables
 * 
 * @returns HSL color string for cluster background
 */
export function getClusterBgColor(): string {
  if (typeof document !== 'undefined') {
    const style = getComputedStyle(document.documentElement);
    const hslValue = style.getPropertyValue('--cluster-bg').trim();
    if (hslValue) {
      return `hsl(${hslValue})`;
    }
  }
  return 'hsl(217, 91%, 60%)';
}

/**
 * Get cluster border color from CSS variables
 * 
 * @returns HSL color string for cluster border
 */
export function getClusterBorderColor(): string {
  if (typeof document !== 'undefined') {
    const style = getComputedStyle(document.documentElement);
    const hslValue = style.getPropertyValue('--cluster-border').trim();
    if (hslValue) {
      return `hsl(${hslValue})`;
    }
  }
  return 'hsl(217, 91%, 40%)';
}
