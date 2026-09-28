
export function getNodeLabelBaseY(nodeSize = 35): number {
  return nodeSize * 0.6 + 14; // 35 default → baseY = 35
}

export function getNodeLabelPosition(
  nodeLabelOffsetX?: number,
  nodeLabelOffsetY?: number,
  nodeSize = 35,
): { x: number; y: number } {
  const baseY = getNodeLabelBaseY(nodeSize);
  return {
    x: nodeLabelOffsetX || 0,
    y: baseY + (nodeLabelOffsetY || 0),
  };
}

// ─── Link Label Position ─────────────────────────────────────────────────────

/**
 * Compute link label position from the path midpoint.
 * 
 * `labelOffsetX` / `labelOffsetY` are absolute offsets from the midpoint
 * (set by dragging in the Create canvas). When they are not set, a
 * default perpendicular offset is applied.
 */
export function getLinkLabelPosition(
  midpointX: number,
  midpointY: number,
  perpX: number,
  perpY: number,
  labelOffsetX?: number,
  labelOffsetY?: number,
): { x: number; y: number } {
  const offX = labelOffsetX ?? perpX * 14;
  const offY = labelOffsetY ?? perpY * 14 - 4;
  return {
    x: midpointX + offX,
    y: midpointY + offY,
  };
}

// ─── Link Path Calculation ───────────────────────────────────────────────────

export interface LinkPathInput {
  sx: number; sy: number;
  tx: number; ty: number;
  curveOffsetX?: number;
  curveOffsetY?: number;
  parallelCount: number;
  parallelIndex: number;
  linkType?: string;
}

export interface LinkPathResult {
  pathData: string;
  ctrlX: number;
  ctrlY: number;
  midX: number;
  midY: number;
  perpX: number;
  perpY: number;
  isCurved: boolean;
}

/**
 * Compute a link path (straight or quadratic bezier) with support for
 * saved curve offsets and parallel-link fan-out.
 */
export function computeLinkPath(input: LinkPathInput): LinkPathResult {
  const { sx, sy, tx, ty, curveOffsetX, curveOffsetY, parallelCount, parallelIndex, linkType } = input;
  const dx = tx - sx, dy = ty - sy;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const perpX = -dy / dist, perpY = dx / dist;
  const midX = (sx + tx) / 2, midY = (sy + ty) / 2;

  let ctrlX: number, ctrlY: number;
  const hasSavedOffset = curveOffsetX != null && curveOffsetY != null && (curveOffsetX !== 0 || curveOffsetY !== 0);

  if (hasSavedOffset) {
    ctrlX = midX + curveOffsetX!;
    ctrlY = midY + curveOffsetY!;
  } else if (parallelCount > 1) {
    const midIdx = (parallelCount - 1) / 2;
    const curvatureOffset = (parallelIndex - midIdx) * 0.25;
    ctrlX = midX + perpX * curvatureOffset * dist;
    ctrlY = midY + perpY * curvatureOffset * dist;
  } else {
    ctrlX = midX;
    ctrlY = midY;
  }

  const isCurved = hasSavedOffset || parallelCount > 1 || linkType === 'CURVED' || linkType === 'curved';
  const pathData = isCurved
    ? `M ${sx} ${sy} Q ${ctrlX} ${ctrlY} ${tx} ${ty}`
    : `M ${sx} ${sy} L ${tx} ${ty}`;

  return { pathData, ctrlX, ctrlY, midX, midY, perpX, perpY, isCurved };
}

/**
 * Compute the angle of the link at its midpoint (for label rotation).
 * Returns an angle in [-90, 90] degrees so text is always readable.
 */
export function getLinkLabelAngle(pathEl: SVGPathElement): number {
  const totalLen = pathEl.getTotalLength();
  const midPt = pathEl.getPointAtLength(totalLen / 2);
  const nearPt = pathEl.getPointAtLength(totalLen / 2 + 1);
  let angle = Math.atan2(nearPt.y - midPt.y, nearPt.x - midPt.x) * 180 / Math.PI;
  if (angle > 90) angle -= 180;
  if (angle < -90) angle += 180;
  return angle;
}
