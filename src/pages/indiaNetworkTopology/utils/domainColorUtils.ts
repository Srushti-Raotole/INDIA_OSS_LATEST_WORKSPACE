

import type { DomainType } from '../types';


export const DOMAIN_COLORS = {
  IP: 'hsl(217, 91%, 60%)',      // Blue
  OPTICAL: 'hsl(290, 52%, 50%)', // Teal (#14b8a6)
  DEFAULT: 'hsl(220, 9%, 46%)',  // Gray fallback
} as const;


export function getDomainColor(domainType: DomainType | undefined): string {
  if (domainType === 'IP') return DOMAIN_COLORS.IP;
  if (domainType === 'OPTICAL') return DOMAIN_COLORS.OPTICAL;
  return DOMAIN_COLORS.DEFAULT;
}


export function getDomainBgClass(domainType: DomainType | undefined): string {
  if (domainType === 'IP') return 'bg-blue-500';
  if (domainType === 'OPTICAL') return 'bg-teal-500';
  return 'bg-muted';
}

/**
 * Get Tailwind text class for domain type
 */
export function getDomainTextClass(domainType: DomainType | undefined): string {
  if (domainType === 'IP') return 'text-blue-500';
  if (domainType === 'OPTICAL') return 'text-teal-500';
  return 'text-muted-foreground';
}
