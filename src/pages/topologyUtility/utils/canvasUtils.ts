import * as d3 from 'd3';


export const FIT_PADDING = 80;

export const FIT_MAX_SCALE = 2;

export const FIT_SCALE_FACTOR = 0.9;

export const ZOOM_STEP = 1.1;

export const ZOOM_EXTENT: [number, number] = [0.1, 4];

export const ZOOM_DURATION = 200;

export const FIT_DURATION = 500;


export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function getNodesBoundingBox(
  nodes: { x: number; y: number }[],
  padding = FIT_PADDING
): BoundingBox | null {
  if (nodes.length === 0) return null;
  const xs = nodes.map(n => n.x);
  const ys = nodes.map(n => n.y);
  return {
    minX: Math.min(...xs) - padding,
    minY: Math.min(...ys) - padding,
    maxX: Math.max(...xs) + padding,
    maxY: Math.max(...ys) + padding,
  };
}

export function computeFitTransform(
  bbox: BoundingBox,
  width: number,
  height: number,
  maxScale = FIT_MAX_SCALE,
  scaleFactor = FIT_SCALE_FACTOR,
): d3.ZoomTransform {
  const cw = bbox.maxX - bbox.minX;
  const ch = bbox.maxY - bbox.minY;
  const scale = Math.min(width / cw, height / ch, maxScale) * scaleFactor;
  const cx = (bbox.minX + bbox.maxX) / 2;
  const cy = (bbox.minY + bbox.maxY) / 2;
  return d3.zoomIdentity
    .translate(width / 2, height / 2)
    .scale(scale)
    .translate(-cx, -cy);
}

export function compute1to1Transform(
  bbox: BoundingBox,
  width: number,
  height: number,
): d3.ZoomTransform {
  const cx = (bbox.minX + bbox.maxX) / 2;
  const cy = (bbox.minY + bbox.maxY) / 2;
  return d3.zoomIdentity
    .translate(width / 2, height / 2)
    .scale(1)
    .translate(-cx, -cy);
}

export function zoomIn(
  svgEl: SVGSVGElement,
  zoomBehavior: d3.ZoomBehavior<SVGSVGElement, unknown>,
  duration = ZOOM_DURATION,
) {
  d3.select(svgEl).transition().duration(duration).call(zoomBehavior.scaleBy, ZOOM_STEP);
}


export function zoomOut(
  svgEl: SVGSVGElement,
  zoomBehavior: d3.ZoomBehavior<SVGSVGElement, unknown>,
  duration = ZOOM_DURATION,
) {
  d3.select(svgEl).transition().duration(duration).call(zoomBehavior.scaleBy, 1 / ZOOM_STEP);
}

export function applyFitToView(
  svgEl: SVGSVGElement,
  zoomBehavior: d3.ZoomBehavior<SVGSVGElement, unknown>,
  nodes: { x: number; y: number }[],
  width: number,
  height: number,
  duration = FIT_DURATION,
): d3.ZoomTransform {
  const bbox = getNodesBoundingBox(nodes);
  if (!bbox) {
    const identity = d3.zoomIdentity;
    d3.select(svgEl).transition().duration(duration).call(zoomBehavior.transform, identity);
    return identity;
  }
  const transform = computeFitTransform(bbox, width, height);
  d3.select(svgEl).transition().duration(duration).call(zoomBehavior.transform, transform);
  return transform;
}


export function apply1to1View(
  svgEl: SVGSVGElement,
  zoomBehavior: d3.ZoomBehavior<SVGSVGElement, unknown>,
  nodes: { x: number; y: number }[],
  width: number,
  height: number,
  duration = FIT_DURATION,
): d3.ZoomTransform {
  const bbox = getNodesBoundingBox(nodes);
  if (!bbox) {
    const identity = d3.zoomIdentity;
    d3.select(svgEl).transition().duration(duration).call(zoomBehavior.transform, identity);
    return identity;
  }
  const transform = compute1to1Transform(bbox, width, height);
  d3.select(svgEl).transition().duration(duration).call(zoomBehavior.transform, transform);
  return transform;
}
