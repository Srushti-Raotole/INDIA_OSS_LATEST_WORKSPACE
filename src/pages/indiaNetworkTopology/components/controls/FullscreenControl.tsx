
import { useState, useCallback, useEffect } from 'react';
import { Button } from '../../../../components/ui/button';
import { Maximize2, Minimize2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../../../components/ui/tooltip';

export function FullscreenControl() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    const mapContainer = document.querySelector('.leaflet-container')?.closest('div.relative');
    
    if (!mapContainer) {
      console.error('Map container not found');
      return;
    }

    if (!document.fullscreenElement) {
      mapContainer.requestFullscreen?.()
        .then(() => setIsFullscreen(true))
        .catch((err) => console.error('Fullscreen error:', err));
    } else {
      document.exitFullscreen?.()
        .then(() => setIsFullscreen(false))
        .catch((err) => console.error('Exit fullscreen error:', err));
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={toggleFullscreen}
            className="h-9 w-9 bg-background/95 backdrop-blur-sm shadow-lg border-border transition-all hover:bg-muted"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
