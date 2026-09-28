
import { MapPin, Radio, Link2, Server, Globe } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '../../../../components/ui/sheet';
import { Separator } from '../../../../components/ui/separator';
import { Badge } from '../../../../components/ui/badge';
import type { FiberSite } from '../../types/fiberTypes';

interface FiberSiteDetailsSidebarProps {
  site: FiberSite | null;
  open: boolean;
  onClose: () => void;
  container?: HTMLElement | null;
}

export function FiberSiteDetailsSidebar({
  site,
  open,
  onClose,
  container,
}: FiberSiteDetailsSidebarProps) {
  if (!site) return null;

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent className="w-[400px] sm:w-[450px] overflow-y-auto z-[2147483647]" container={container}>
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <Radio className="h-5 w-5 text-blue-500" />
            Fiber Site Details
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          {/* Site Name */}
          <div className="space-y-2">
            <h3 className="text-xl font-bold break-words">{site.name}</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="default" className={
                site.technology?.toUpperCase() === 'CIENA' 
                  ? 'bg-blue-500 hover:bg-blue-600' 
                  : 'bg-red-500 hover:bg-red-600'
              }>
                {site.technology}
              </Badge>
              <Badge variant="outline">{site.connType}</Badge>
            </div>
          </div>

          <Separator />

          {/* Site Info */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              Site Information
            </h4>

            <div className="grid gap-3">
              <div className="flex items-start gap-3">
                <Server className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Node Name</p>
                  <p className="text-sm text-muted-foreground font-mono">{site.nodeName}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Globe className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Node IP</p>
                  <p className="text-sm text-muted-foreground font-mono">{site.nodeIP}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Link2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Connection Type</p>
                  <p className="text-sm text-muted-foreground">{site.connType}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-sm text-muted-foreground">
                    Lat: {site.latitude?.toFixed(6) ?? site.coordinates[1].toFixed(6)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Lon: {site.longitude?.toFixed(6) ?? site.coordinates[0].toFixed(6)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
              Metadata
            </h4>
            <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Site ID</span>
                <span className="font-mono text-xs">{site.id}</span>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
