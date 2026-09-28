
import { useState } from 'react';
import { Info, ChevronDown, ChevronUp, Globe2 } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../../../../components/ui/collapsible';
import { LinkColorMode } from '../../types';
import { DOMAIN_COLORS } from '../../utils/domainColorUtils';
import { TECHNOLOGY_COLORS_HEX } from '../../utils/technologyColors';
import type { DomainView } from './DomainSelector';

// Fiber route colors (matching FiberRoutesLayer.tsx)
const FIBER_TYPE_COLORS = {
  NLD: '#10b981',    // Green for long distance
  METRO: '#8b5cf6',  // Purple for metro
};

const FIBER_METHODOLOGY_COLORS = {
  OPGW: '#10b981',   // Emerald for OPGW
  UG: '#f97316',     // Orange for Underground
  AERIAL: '#51aee4', // Light blue for Aerial
  UTILITY: '#ad4ade', // Purple for Utility
};

interface MapLegendProps {
  /** Current link color mode */
  colorMode?: LinkColorMode;
  /** Current domain view */
  selectedDomain?: DomainView;
  /** Current fiber color mode */
  fiberColorMode?: 'type' | 'methodology';
  /** Open the 3D Globe view (FIBER only). When provided, a CTA renders inside the fiber legend. */
  onOpenGlobe?: () => void;
  /** Disable the 3D Globe CTA (e.g. no data after filters) */
  globeDisabled?: boolean;
}


export function MapLegend({ 
  colorMode = 'utilization', 
  selectedDomain = 'ALL',
  fiberColorMode = 'type',
  onOpenGlobe,
  globeDisabled = false,
}: MapLegendProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Show fiber legend for ALL and FIBER views
  const showFiberLegend = selectedDomain === 'ALL' || selectedDomain === 'FIBER';
  // Show circuit legend for ALL and IP_OPTICAL views
  const showCircuitLegend = selectedDomain === 'ALL' || selectedDomain === 'IP_OPTICAL';

  return (
    <div className="bg-background/95 backdrop-blur-sm rounded-lg shadow-lg border border-border">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        {/* Header - Always Visible */}
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full flex items-center justify-between gap-2 p-2.5 h-auto hover:bg-transparent"
          >
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">Legend</span>
            </div>
            {isOpen ? (
              <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </Button>
        </CollapsibleTrigger>

        {/* Collapsible Content */}
        <CollapsibleContent>
          <div className="px-3 py-2.5 space-y-2 text-[10px] border-t border-border">
            
            {/* ========== Circuit Legend (for ALL and IP_OPTICAL views) ========== */}
            {showCircuitLegend && (
              <>
                {/* Link Types */}
                <div className="pb-2 border-b border-border">
                  <p className="text-muted-foreground mb-1.5 font-medium">Link Types</p>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-0.5 bg-primary" />
                    <span className="text-foreground">NLD (Solid)</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-6 h-0.5 border-t-2 border-dashed border-primary" />
                    <span className="text-foreground">METRO (Dashed)</span>
                  </div>
                </div>

                {/* Utilization or Domain Colors */}
                {colorMode === 'utilization' ? (
                  /* Utilization Colors */
                  <div className="pb-2 border-b border-border">
                    <p className="text-muted-foreground mb-1.5 font-medium">Utilization</p>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                      <span className="text-foreground">&lt; 50% (Low)</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                      <span className="text-foreground">50-80% (Medium)</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-destructive" />
                      <span className="text-foreground">&gt; 80% (High)</span>
                    </div>
                  </div>
                ) : (
                  /* Domain Colors - IP and OPTICAL */
                  <div className="pb-2 border-b border-border">
                    <p className="text-muted-foreground mb-1.5 font-medium">Domain Type</p>
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-2.5 h-2.5 rounded-full" 
                        style={{ backgroundColor: DOMAIN_COLORS.IP }}
                      />
                      <span className="text-foreground">IP</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span 
                        className="w-2.5 h-2.5 rounded-full" 
                        style={{ backgroundColor: DOMAIN_COLORS.OPTICAL }}
                      />
                      <span className="text-foreground">OPTICAL</span>
                    </div>
                  </div>
                )}

                {/* Node Markers */}
                <div className={showFiberLegend ? 'pb-2 border-b border-border' : ''}>
                  <p className="text-muted-foreground mb-1.5 font-medium">Nodes</p>
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-3 h-3 rounded-full" 
                      style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }} 
                    />
                    <span className="text-foreground">Network Site</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span 
                      className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] text-white font-bold" 
                      style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}
                    >
                      5
                    </span>
                    <span className="text-foreground">Clustered Nodes</span>
                  </div>
                </div>
              </>
            )}

            {/* ========== Fiber Legend (for ALL and FIBER views) ========== */}
            {showFiberLegend && (
              <>
                {/* Fiber Routes - show active color mode */}
                <div className="pb-2 border-b border-border">
                  <p className="text-muted-foreground mb-1.5 font-medium">
                    Fiber Routes ({fiberColorMode === 'type' ? 'Type' : 'Method'})
                  </p>
                  {fiberColorMode === 'type' ? (
                    <>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-6 h-1 rounded"
                          style={{ backgroundColor: FIBER_TYPE_COLORS.NLD }}
                        />
                        <span className="text-foreground">NLD (Long Distance)</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div 
                          className="w-6 h-1 rounded"
                          style={{ backgroundColor: FIBER_TYPE_COLORS.METRO }}
                        />
                        <span className="text-foreground">METRO</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-6 h-1 rounded"
                          style={{ backgroundColor: FIBER_METHODOLOGY_COLORS.OPGW }}
                        />
                        <span className="text-foreground">OPGW (Overhead)</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div 
                          className="w-6 h-1 rounded"
                          style={{ backgroundColor: FIBER_METHODOLOGY_COLORS.UG }}
                        />
                        <span className="text-foreground">UG (Underground)</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div 
                          className="w-6 h-1 rounded"
                          style={{ backgroundColor: FIBER_METHODOLOGY_COLORS.AERIAL }}
                        />
                        <span className="text-foreground">AERIAL</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div 
                          className="w-6 h-1 rounded"
                          style={{ backgroundColor: FIBER_METHODOLOGY_COLORS.UTILITY }}
                        />
                        <span className="text-foreground">UTILITY</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Fiber Sites */}
                <div>
                  <p className="text-muted-foreground mb-1.5 font-medium">Fiber Sites</p>
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: TECHNOLOGY_COLORS_HEX.CIENA }}
                    />
                    <span className="text-foreground">CIENA Site</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: TECHNOLOGY_COLORS_HEX.NOKIA }}
                    />
                    <span className="text-foreground">NOKIA Site</span>
                  </div>
                </div>

                {/* 3D Globe CTA — only when handler provided (FIBER domain) */}
                {onOpenGlobe && (
                  <div className="pt-2 border-t border-border">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={onOpenGlobe}
                      disabled={globeDisabled}
                      className="w-full h-8 gap-1.5 bg-[hsl(var(--primary))] hover:opacity-90 text-primary-foreground"
                    >
                      <Globe2 className="h-3.5 w-3.5" />
                      <span className="text-[11px] font-medium">Open 3D Globe View</span>
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}