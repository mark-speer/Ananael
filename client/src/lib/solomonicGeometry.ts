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

/** Extra margin when Triangle of Art is shown outside the circle. */
export const TRIANGLE_MARGIN = 120;

/** Classic divine names on the three sides of the Triangle of Art (Goetia). */
export const TRIANGLE_SIDE_NAMES = [
  'ANAPHAXETON',
  'PRIMEUMATON',
  'TETRAGRAMMATON',
] as const;

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

export interface TriangleOfArtResult {
  /** Three vertices as SVG polygon points string. */
  points: string;
  /** Vertices as coordinates (apex toward circle, then L/R outer). */
  vertices: { x: number; y: number }[];
  /** Centroid — seal placement. */
  center: { x: number; y: number };
  /** Midpoints of each side for divine-name labels. */
  sideMids: { x: number; y: number; angle: number }[];
}

/**
 * Equilateral Triangle of Art placed outside the magician's circle.
 * One vertex points toward the circle center; the opposite side faces outward.
 */
export function triangleOfArt(
  cx: number,
  cy: number,
  circleRadius: number,
  bearingDeg: number,
  sideLength: number
): TriangleOfArtResult {
  const gap = 18;
  // Circumradius of an equilateral triangle with the given side length.
  const R = sideLength / Math.sqrt(3);
  // Centroid sits just outside the circle along the bearing.
  const centroidDist = circleRadius + gap + R * 0.5;
  const center = polarToCartesian(cx, cy, centroidDist, bearingDeg);

  // Vertex 0 toward the circle; 1 and 2 form the outer base.
  const vertices = [
    polarToCartesian(center.x, center.y, R, (bearingDeg + 180) % 360),
    polarToCartesian(center.x, center.y, R, (bearingDeg + 60) % 360),
    polarToCartesian(center.x, center.y, R, (bearingDeg - 60 + 360) % 360),
  ];

  const mid = (
    a: { x: number; y: number },
    b: { x: number; y: number }
  ) => ({
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    angle: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI,
  });

  const sideMids = [
    mid(vertices[0], vertices[1]),
    mid(vertices[1], vertices[2]),
    mid(vertices[2], vertices[0]),
  ];

  return {
    points: vertices.map((p) => `${p.x},${p.y}`).join(' '),
    vertices,
    center,
    sideMids,
  };
}

/**
 * ViewBox string expanded toward the triangle bearing so the Triangle of Art fits.
 * Circle stays at (cx, cy) in the original coordinate system.
 */
export function conjurationViewBox(
  bearingDeg: number,
  expand = TRIANGLE_MARGIN
): string {
  const rad = ((bearingDeg - 90) * Math.PI) / 180;
  const dx = Math.cos(rad);
  const dy = Math.sin(rad);
  // Expand the side of the viewBox the triangle sits on.
  const left = dx < -0.2 ? expand : 0;
  const right = dx > 0.2 ? expand : 0;
  const top = dy < -0.2 ? expand : 0;
  const bottom = dy > 0.2 ? expand : 0;
  // Also expand a little on near-cardinal diagonals for safety.
  const padL = left || (Math.abs(dx) < 0.2 ? expand * 0.15 : 0);
  const padR = right || (Math.abs(dx) < 0.2 ? expand * 0.15 : 0);
  const padT = top || (Math.abs(dy) < 0.2 ? expand * 0.15 : 0);
  const padB = bottom || (Math.abs(dy) < 0.2 ? expand * 0.15 : 0);

  const x = -padL;
  const y = -padT;
  const w = SVG_SIZE + padL + padR;
  const h = SVG_SIZE + padT + padB;
  return `${x} ${y} ${w} ${h}`;
}
