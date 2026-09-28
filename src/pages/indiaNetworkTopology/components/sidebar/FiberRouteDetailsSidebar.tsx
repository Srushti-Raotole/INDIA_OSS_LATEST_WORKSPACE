
import { Cable, MapPin, Ruler, Wrench, CheckCircle } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '../../../../components/ui/sheet';
import { Separator } from '../../../../components/ui/separator';
import { Badge } from '../../../../components/ui/badge';
import type { FiberRoute } from '../../types/fiberTypes';

interface FiberRouteDetailsSidebarProps {
  route: FiberRoute | null;
  open: boolean;
  onClose: () => void;
  /** Container for portal (for fullscreen support) */
  container?: HTMLElement | null;
}

export function FiberRouteDetailsSidebar({
  route,
  open,
  onClose,
  container,
}: FiberRouteDetailsSidebarProps) {
  if (!route) return null;

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="w-[400px] sm:w-[450px] overflow-y-auto z-[2147483647]" container={container}>
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <Cable className="h-5 w-5 text-green-500" />
            Fiber Route Details
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          {/* Route Name */}
          <div className="space-y-2">
            <h3 className="text-xl font-bold break-words">{route.routeName}</h3>
            <div className="flex items-center gap-2">
              <Badge variant={route.type === 'NLD' ? 'default' : 'secondary'} className={
                route.type === 'NLD' 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : 'bg-purple-500 hover:bg-purple-600 text-white'
              }>
                {route.type}
              </Badge>
              <Badge variant="outline">{route.linkName}</Badge>
            </div>
          </div>

          <Separator />

          {/* Route Info */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              Route Information
            </h4>

            <div className="grid gap-3">
              {/* Span ID */}
              {route.spanid && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Span ID</p>
                    <p className="text-sm text-muted-foreground font-mono">{route.spanid}</p>
                  </div>
                </div>
              )}
              {/* Length */}
              <div className="flex items-start gap-3">
                <Ruler className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Length</p>
                  <p className="text-sm text-muted-foreground">
                    {route.lengthKms.toFixed(2)} km
                  </p>
                </div>
              </div>

              {/* Methodology */}
              <div className="flex items-start gap-3">
                <Wrench className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Methodology</p>
                  <p className="text-sm text-muted-foreground">
                    {route.methodology === 'OPGW' ? 'OPGW (Overhead Ground Wire)' : 
                     route.methodology === 'UG' ? 'Underground' : route.methodology}
                  </p>
                </div>
              </div>

              {/* Construction Status */}
              <div className="flex items-start gap-3">
                <CheckCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Construction Status</p>
                  <p className="text-sm text-muted-foreground">
                    <Badge variant={route.construction === 'Completed' ? 'default' : 'secondary'} className={
                      route.construction === 'Completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''
                    }>
                      {route.construction}
                    </Badge>
                  </p>
                </div>
              </div>

              {/* Coordinates */}
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Coordinates</p>
                  <p className="text-sm text-muted-foreground">
                    {route.coordinates.length} points
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Start: {route.coordinates[0][1].toFixed(4)}, {route.coordinates[0][0].toFixed(4)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    End: {route.coordinates[route.coordinates.length - 1][1].toFixed(4)}, {route.coordinates[route.coordinates.length - 1][0].toFixed(4)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Metadata */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              Metadata
            </h4>
            <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Layer</span>
                <span className="font-medium">{route.layer || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Route ID</span>
                <span className="font-mono text-xs">{route.id}</span>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
