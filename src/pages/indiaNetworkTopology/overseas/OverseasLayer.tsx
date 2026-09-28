
import { Polyline, CircleMarker, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import { useState } from 'react';
import {
  OVERSEAS_LANDING_RADIUS,
  OVERSEAS_LINE_WEIGHT_ACTIVE,
} from './constants';
import type { OverseasCable, OverseasSegment, OverseasVisibility } from './types';

const LANDING_LABEL_MIN_ZOOM = 3;

interface OverseasLayerProps {
  cables: OverseasCable[];
  visibility: OverseasVisibility;
  selectedSegmentId?: string | null;
  onSegmentClick: (segment: OverseasSegment, cable: OverseasCable) => void;
  /** When true + zoom >= 3, landing names render as always-on labels */
  showLandingLabels?: boolean;
}

/** Scale label font with zoom: 8px @ z3 → 14px @ z9+ */
function labelFontSize(zoom: number): number {
  const z = Math.max(3, Math.min(9, zoom));
  return Math.round(8 + ((z - 3) / 6) * 6);
}

export function OverseasLayer({
  cables,
  visibility,
  selectedSegmentId,
  onSegmentClick,
  showLandingLabels = false,
}: OverseasLayerProps) {
  // Track current zoom so landing labels react live to zoom changes
  const map = useMap();
  const [zoom, setZoom] = useState<number>(map.getZoom());
  useMapEvents({
    zoomend: () => setZoom(map.getZoom()),
  });
  const labelsActive = showLandingLabels && zoom >= LANDING_LABEL_MIN_ZOOM;
  const labelFont = labelFontSize(zoom);

  return (
    <>
      {cables
        .filter((cable) => visibility[cable.id])
        .map((cable) => (
          <CableGroup
            key={cable.id}
            cable={cable}
            selectedSegmentId={selectedSegmentId}
            onSegmentClick={onSegmentClick}
            landingLabelsActive={labelsActive}
            labelFont={labelFont}
          />
        ))}
    </>
  );
}

function CableGroup({
  cable,
  selectedSegmentId,
  onSegmentClick,
  landingLabelsActive,
  labelFont,
}: {
  cable: OverseasCable;
  selectedSegmentId?: string | null;
  onSegmentClick: (segment: OverseasSegment, cable: OverseasCable) => void;
  landingLabelsActive: boolean;
  labelFont: number;
}) {
  return (
    <>
      {cable.segments.map((seg) => {
        const isActive = seg.id === selectedSegmentId;
        return (
          <Polyline
            key={seg.id}
            positions={seg.coordinates.map(([lon, lat]) => [lat, lon] as [number, number])}
            pathOptions={{
              color: cable.color,
              weight: isActive ? OVERSEAS_LINE_WEIGHT_ACTIVE : cable.weight,
              opacity: 0.9,
              dashArray: cable.dashArray,
              lineCap: 'round',
              lineJoin: 'round',
            }}
            eventHandlers={{
              click: () => onSegmentClick(seg, cable),
            }}
          >
            <Tooltip sticky>
              <div className="text-xs">
                <div className="font-semibold">{seg.name}</div>
                <div className="text-muted-foreground">{cable.displayName}</div>
                <div>Length: {seg.lengthKm.toFixed(1)} km</div>
              </div>
            </Tooltip>
          </Polyline>
        );
      })}

      {cable.landings.map((land) => (
        <CircleMarker
          key={land.id}
          center={[land.coordinates[1], land.coordinates[0]]}
          radius={OVERSEAS_LANDING_RADIUS}
          pathOptions={{
            color: '#ffffff',
            weight: 2,
            fillColor: cable.color,
            fillOpacity: 1,
          }}
        >
          {/* Permanent label when toggle on AND zoom past threshold */}
          {landingLabelsActive && (
            <Tooltip
              permanent
              direction="top"
              offset={[0, -6]}
              className="!bg-background/90 !border-border !text-foreground !px-1.5 !py-0.5 !rounded !shadow"
            >
              <span style={{ fontSize: `${labelFont}px`, lineHeight: 1.1 }}>{land.name}</span>
            </Tooltip>
          )}
          {/* Hover tooltip always available */}
          {!landingLabelsActive && (
            <Tooltip>
              <div className="text-xs">
                <div className="font-semibold">{land.name}</div>
                <div className="text-muted-foreground">{cable.displayName} landing</div>
              </div>
            </Tooltip>
          )}
        </CircleMarker>
      ))}
    </>
  );
}
