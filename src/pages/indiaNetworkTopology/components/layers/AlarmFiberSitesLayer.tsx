
import { Fragment, useMemo, useState, useEffect } from 'react';
import { Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { FiberSite } from '../../types/fiberTypes';
import { getTechnologyColor } from '../../utils/technologyColors';

const SITE_MIN_ZOOM = 5;
const LABEL_MIN_ZOOM = 7;


function getSiteSize(zoom: number, isSelected: boolean): number {
  if (zoom <= 4) return 1;              // ultra zoomed out (almost hidden)
  if (zoom <= 6) return 2;              // very tiny
  if (zoom <= 8) return 3;              // small
  if (zoom <= 10) return isSelected ? 6 : 4;
  if (zoom <= 13) return isSelected ? 8 : 5;
  return isSelected ? 10 : 6;           // deep zoom
}


function createSiteIcon(
  technology: string,
  zoom: number,
  isSelected: boolean = false
): L.DivIcon {
  const color = getTechnologyColor(technology);
  const size = getSiteSize(zoom, isSelected);

  return L.divIcon({
    className: 'fiber-site-marker',
    html: `<div style="
      width:${size}px;
      height:${size}px;
      background:${color};
      border-radius:50%;
      opacity:${zoom <= 6 ? 0.6 : 1};
      ${zoom > 6 ? 'border:1px solid rgba(0,0,0,0.3);' : ''}
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}
/** Site label positioned to the RIGHT of dot */
function createSiteLabelIcon(name: string, technology: string): L.DivIcon {
  const color = getTechnologyColor(technology);
  return L.divIcon({
    className: 'fiber-site-label',
    html: `<div style="display:inline-block;background:${color};color:white;padding:2px 6px;border-radius:3px;font-size:9px;font-weight:600;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.2);line-height:1.2;">${name}</div>`,
    iconSize: [0, 0],
    iconAnchor: [-8, 5], // offset to right of dot
  });
}

interface AlarmFiberSitesLayerProps {
  sites: FiberSite[];
  onSiteClick?: (site: FiberSite) => void;
  showLabels?: boolean;
}

export function AlarmFiberSitesLayer({
  sites,
  onSiteClick,
  showLabels = true,
}: AlarmFiberSitesLayerProps) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  useEffect(() => {
    const handler = () => setZoom(map.getZoom());
    map.on('zoomend', handler);
    return () => { map.off('zoomend', handler); };
  }, [map]);

  const validSites = useMemo(() =>
    sites.filter(s =>
      s.coordinates &&
      typeof s.coordinates[0] === 'number' && !isNaN(s.coordinates[0]) &&
      typeof s.coordinates[1] === 'number' && !isNaN(s.coordinates[1])
    ), [sites]);

  const rendered = useMemo(() => {
    if (zoom < SITE_MIN_ZOOM) return null;
    const showLabelText = showLabels && zoom >= LABEL_MIN_ZOOM;

    return validSites.map((site, index) => {
      const markerKey = `alarm-fiber-site-marker-${site.id}-${site.name}-${index}`;
      const labelKey = `alarm-fiber-site-label-${site.id}-${site.name}-${index}`;
      const latLng: [number, number] = [site.coordinates[1], site.coordinates[0]];
      const siteIcon = createSiteIcon(site.technology, zoom);
      return (
        <Fragment key={markerKey}>
          <Marker
            position={latLng}
            icon={siteIcon}
            eventHandlers={{
              click: () => onSiteClick?.(site),
            }}
          >
            <Tooltip className="!bg-background !border-border !text-foreground !shadow-lg !rounded-md !px-3 !py-2">
              <div className="text-xs space-y-1">
                <p className="font-semibold text-sm">{site.name}</p>
                <p className="text-muted-foreground">
                  <span className="font-medium">Node:</span> {site.nodeName}
                </p>
                <p className="text-muted-foreground">
                  <span className="font-medium">IP:</span> {site.nodeIP}
                </p>
                <p className="text-muted-foreground">
                  <span className="font-medium">Technology:</span> {site.technology}
                </p>
              </div>
            </Tooltip>
          </Marker>

          {showLabelText && (
            <Marker
              key={labelKey}
              position={latLng}
              icon={createSiteLabelIcon(site.name, site.technology)}
              interactive={false}
            />
          )}
        </Fragment>
      );
    });
  }, [validSites, zoom, onSiteClick, showLabels]);

  return <>{rendered}</>;
}
