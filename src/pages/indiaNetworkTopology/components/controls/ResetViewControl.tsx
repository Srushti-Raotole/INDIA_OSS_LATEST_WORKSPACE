

import { RotateCcw, Home } from 'lucide-react';
import { useMap } from 'react-leaflet';
import { Map } from 'leaflet';
import { Button } from '../../../../components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../../components/ui/tooltip';
import { INDIA_CENTER, DEFAULT_ZOOM } from '../../constants';

interface ResetViewControlProps {
  onClick?: () => void;
  mapRef?: Map | null;
}

export function ResetViewControl({ onClick, mapRef }: ResetViewControlProps) {
  const handleReset = () => {
    if (onClick) {
      onClick();
    } else if (mapRef) {
      mapRef.flyTo(INDIA_CENTER, DEFAULT_ZOOM, { duration: 0.8 });
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 bg-background/95 backdrop-blur-sm shadow-lg border-border transition-all hover:bg-muted"
            onClick={handleReset}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          Reset View
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Reset View Control for use inside MapContainer
 */
export function InMapResetViewControl() {
  const map = useMap();

  const handleReset = () => {
    map.flyTo(INDIA_CENTER, DEFAULT_ZOOM, { duration: 0.8 });
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 bg-background/95 backdrop-blur-sm shadow-lg border-border transition-all hover:bg-muted"
            onClick={handleReset}
          >
            <Home className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          Reset View
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
