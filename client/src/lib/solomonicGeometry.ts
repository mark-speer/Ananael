/**
 * Polar / SVG path helpers for Solomonic circle rendering.
 *
 * Angle convention: 0° = North (top), increasing clockwise (ritual compass).
 */

export const SVG_SIZE = 640;
export const SVG_CENTER = SVG_SIZE / 2;
export const SVG_VIEWBOX = `0 0 ${SVG_SIZE} ${SVG_SIZE}`;
/** Max drawable radius in SVG user units (margin for labels). */
export const MAX_RADIUS = 280;

export function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleDeg: number
): { x: number; y: number } {
  // Convert compass degrees (0=N, CW) to standard math (0=E, CCW)
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  };
}

/**
 * Closed circular path suitable for SVG textPath.
 * clockwise=true draws so text reads clockwise along the ring.
 */
export function circleArcPath(
  cx: number,
  cy: number,
  radius: number,
  clockwise = true
): string {
  const sweep = clockwise ? 1 : 0;
  const start = polarToCartesian(cx, cy, radius, 0);
  const mid = polarToCartesian(cx, cy, radius, 180);
  return [
    `M ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 1 ${sweep} ${mid.x} ${mid.y}`,
    `A ${radius} ${radius} 0 1 ${sweep} ${start.x} ${start.y}`,
  ].join(' ');
}

/** Regular polygon points. startAngleDeg: first vertex in compass degrees. */
export function regularPolygonPoints(
  cx: number,
  cy: number,
  radius: number,
  sides: number,
  startAngleDeg = 0
): string {
  const pts: string[] = [];
  for (let i = 0; i < sides; i++) {
    const a = startAngleDeg + (i * 360) / sides;
    const p = polarToCartesian(cx, cy, radius, a);
    pts.push(`${p.x},${p.y}`);
  }
  return pts.join(' ');
}

/** Five-pointed star (pentagram) as a closed polyline. */
export function pentagramPoints(
  cx: number,
  cy: number,
  radius: number
): string {
  const verts: { x: number; y: number }[] = [];
  for (let i = 0; i < 5; i++) {
    verts.push(polarToCartesian(cx, cy, radius, i * 72));
  }
  const order = [0, 2, 4, 1, 3, 0];
  return order.map((i) => `${verts[i].x},${verts[i].y}`).join(' ');
}

/** Hexagram = upright + inverted equilateral triangles. */
export function hexagramTriangles(
  cx: number,
  cy: number,
  radius: number
): { up: string; down: string } {
  return {
    up: regularPolygonPoints(cx, cy, radius, 3, 0),
    down: regularPolygonPoints(cx, cy, radius, 3, 180),
  };
}

/** Axis-aligned square inscribed in a circle of given radius. */
export function inscribedSquarePoints(
  cx: number,
  cy: number,
  radius: number
): string {
  const s = radius / Math.SQRT2;
  return [
    `${cx - s},${cy - s}`,
    `${cx + s},${cy - s}`,
    `${cx + s},${cy + s}`,
    `${cx - s},${cy + s}`,
  ].join(' ');
}

/** Cardinal label positions just outside a given radius. */
export function cardinalPositions(
  cx: number,
  cy: number,
  radius: number
): { label: string; x: number; y: number }[] {
  return [
    { label: 'N', ...polarToCartesian(cx, cy, radius, 0) },
    { label: 'E', ...polarToCartesian(cx, cy, radius, 90) },
    { label: 'S', ...polarToCartesian(cx, cy, radius, 180) },
    { label: 'W', ...polarToCartesian(cx, cy, radius, 270) },
  ];
}
