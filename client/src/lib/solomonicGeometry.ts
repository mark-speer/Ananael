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
 * clockwise=true draws so text reads clockwise with lettering outside the ring.
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

export interface SerpentRingOpts {
  /** Number of sinusoidal coils around the ring (default 10). */
  turns?: number;
  /** Radial amplitude as a fraction of radius (default 0.045). */
  amplitudeRatio?: number;
  /** Sample points around the ring (default 180). */
  segments?: number;
  /** Phase offset in degrees (default 0). */
  phaseDeg?: number;
  /**
   * Path direction for textPath: true = compass-clockwise (lettering outside).
   * Default true to match circleArcPath.
   */
  clockwise?: boolean;
}

/**
 * Closed serpentine ring: base circle with sinusoidal radial modulation.
 * Same path is used for stroke and textPath when boundaryStyle is 'serpent'.
 */
export function serpentRingPath(
  cx: number,
  cy: number,
  radius: number,
  opts?: SerpentRingOpts
): string {
  const turns = opts?.turns ?? 10;
  const ampRatio = opts?.amplitudeRatio ?? 0.045;
  const segments = Math.max(48, opts?.segments ?? 180);
  const phaseDeg = opts?.phaseDeg ?? 0;
  const clockwise = opts?.clockwise !== false;
  const amplitude = radius * ampRatio;

  const points: { x: number; y: number }[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = clockwise ? t * 360 : (1 - t) * 360;
    const wave = Math.sin(((angle + phaseDeg) * turns * Math.PI) / 180);
    const r = radius + amplitude * wave;
    points.push(polarToCartesian(cx, cy, r, angle % 360));
  }

  // Close cleanly on the first point.
  const first = points[0];
  let d = `M ${first.x.toFixed(2)} ${first.y.toFixed(2)}`;
  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    d += ` L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
  }
  d += ' Z';
  return d;
}

/**
 * Small decorative head mark at the serpent path join (North / 0°).
 * Returns a short wedge path pointing along the coil tangent.
 */
export function serpentHeadMark(
  cx: number,
  cy: number,
  radius: number,
  opts?: Pick<SerpentRingOpts, 'turns' | 'amplitudeRatio' | 'phaseDeg'>
): string {
  const turns = opts?.turns ?? 10;
  const ampRatio = opts?.amplitudeRatio ?? 0.045;
  const phaseDeg = opts?.phaseDeg ?? 0;
  const amplitude = radius * ampRatio;
  const wave = Math.sin((phaseDeg * turns * Math.PI) / 180);
  const r = radius + amplitude * wave;
  const tip = polarToCartesian(cx, cy, r + Math.max(4, radius * 0.035), 0);
  const left = polarToCartesian(cx, cy, r - 2, 8);
  const right = polarToCartesian(cx, cy, r - 2, 352);
  return [
    `M ${tip.x.toFixed(2)} ${tip.y.toFixed(2)}`,
    `L ${left.x.toFixed(2)} ${left.y.toFixed(2)}`,
    `L ${right.x.toFixed(2)} ${right.y.toFixed(2)}`,
    'Z',
  ].join(' ');
}

/** Pick ring path for the active boundary style. */
export function ringBoundaryPath(
  style: 'circle' | 'serpent',
  cx: number,
  cy: number,
  radius: number,
  clockwise = true
): string {
  if (style === 'serpent') {
    return serpentRingPath(cx, cy, radius, { clockwise });
  }
  return circleArcPath(cx, cy, radius, clockwise);
}

/** Regular polygon vertices. startAngleDeg: first vertex in compass degrees. */
export function regularPolygonVertices(
  cx: number,
  cy: number,
  radius: number,
  sides: number,
  startAngleDeg = 0
): { x: number; y: number }[] {
  const verts: { x: number; y: number }[] = [];
  for (let i = 0; i < sides; i++) {
    const a = startAngleDeg + (i * 360) / sides;
    verts.push(polarToCartesian(cx, cy, radius, a));
  }
  return verts;
}

/** Regular polygon points. startAngleDeg: first vertex in compass degrees. */
export function regularPolygonPoints(
  cx: number,
  cy: number,
  radius: number,
  sides: number,
  startAngleDeg = 0
): string {
  return regularPolygonVertices(cx, cy, radius, sides, startAngleDeg)
    .map((p) => `${p.x},${p.y}`)
    .join(' ');
}

/** Five-pointed star vertices (tip first at rotationDeg). */
export function pentagramVertices(
  cx: number,
  cy: number,
  radius: number,
  rotationDeg = 0
): { x: number; y: number }[] {
  return regularPolygonVertices(cx, cy, radius, 5, rotationDeg);
}

/** Five-pointed star (pentagram) as a closed polyline. */
export function pentagramPoints(
  cx: number,
  cy: number,
  radius: number,
  rotationDeg = 0
): string {
  const verts = pentagramVertices(cx, cy, radius, rotationDeg);
  const order = [0, 2, 4, 1, 3, 0];
  return order.map((i) => `${verts[i].x},${verts[i].y}`).join(' ');
}

/** Seven-pointed star vertices (tip first at rotationDeg). */
export function heptagramVertices(
  cx: number,
  cy: number,
  radius: number,
  rotationDeg = 0
): { x: number; y: number }[] {
  return regularPolygonVertices(cx, cy, radius, 7, rotationDeg);
}

/** Seven-pointed star (heptagram {7/2}) as a closed polyline. */
export function heptagramPoints(
  cx: number,
  cy: number,
  radius: number,
  rotationDeg = 0
): string {
  const verts = heptagramVertices(cx, cy, radius, rotationDeg);
  // Skip-2 star polygon {7/2}.
  const order: number[] = [];
  for (let i = 0; i < 7; i++) {
    order.push((i * 2) % 7);
  }
  order.push(0);
  return order.map((i) => `${verts[i].x},${verts[i].y}`).join(' ');
}

/** Hexagram = upright + inverted equilateral triangles. */
export function hexagramTriangles(
  cx: number,
  cy: number,
  radius: number,
  rotationDeg = 0
): { up: string; down: string } {
  return {
    up: regularPolygonPoints(cx, cy, radius, 3, rotationDeg),
    down: regularPolygonPoints(cx, cy, radius, 3, rotationDeg + 180),
  };
}

/** Six star-of-David points at rotation + 0°, 60°, … (compass). */
export function hexagramVertices(
  cx: number,
  cy: number,
  radius: number,
  rotationDeg = 0
): { x: number; y: number }[] {
  return regularPolygonVertices(cx, cy, radius, 6, rotationDeg);
}

/**
 * Label positions slightly outside each vertex along the ray from glyph center.
 * Maps characters from `letters` onto vertices in order; empty chars skipped.
 */
export function glyphPointLabels(
  cx: number,
  cy: number,
  vertices: { x: number; y: number }[],
  letters: string,
  outwardPx = 10
): { char: string; x: number; y: number }[] {
  const labels: { char: string; x: number; y: number }[] = [];
  const chars = Array.from(letters);
  for (let i = 0; i < vertices.length && i < chars.length; i++) {
    const char = chars[i];
    if (!char || char === ' ') continue;
    const v = vertices[i];
    const dx = v.x - cx;
    const dy = v.y - cy;
    const len = Math.hypot(dx, dy) || 1;
    labels.push({
      char,
      x: v.x + (dx / len) * outwardPx,
      y: v.y + (dy / len) * outwardPx,
    });
  }
  return labels;
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

export type CardinalGlyphDir = 'n' | 'e' | 's' | 'w';

export interface CardinalGlyphPlacement {
  dir: CardinalGlyphDir;
  x: number;
  y: number;
  radius: number;
}

/**
 * Layout for quarter glyphs inside the innermost circle (Lesser Key style).
 * Centers sit between the center glyph clearance and the inner ring.
 */
export function cardinalGlyphLayout(
  cx: number,
  cy: number,
  innerR: number,
  centerClearance = innerR * 0.38
): CardinalGlyphPlacement[] {
  const safeInner = Math.max(innerR, 1);
  const clearance = Math.max(
    0,
    Math.min(centerClearance, safeInner * 0.75)
  );
  const band = Math.max(safeInner - clearance, safeInner * 0.2);
  // Sit in the outer half of the inner disk so glyphs read as quarter markers.
  const midR = clearance + band * 0.62;
  const glyphR = Math.min(band * 0.28, safeInner * 0.16, midR * 0.45);

  const dirs: { dir: CardinalGlyphDir; angle: number }[] = [
    { dir: 'n', angle: 0 },
    { dir: 'e', angle: 90 },
    { dir: 's', angle: 180 },
    { dir: 'w', angle: 270 },
  ];

  return dirs.map(({ dir, angle }) => ({
    dir,
    ...polarToCartesian(cx, cy, midR, angle),
    radius: glyphR,
  }));
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
 * `rotationDeg` twists the triangle about its centroid (0 = apex toward circle).
 */
export function triangleOfArt(
  cx: number,
  cy: number,
  circleRadius: number,
  bearingDeg: number,
  sideLength: number,
  rotationDeg = 0
): TriangleOfArtResult {
  const gap = 18;
  // Circumradius of an equilateral triangle with the given side length.
  const R = sideLength / Math.sqrt(3);
  // Centroid sits just outside the circle along the bearing.
  const centroidDist = circleRadius + gap + R * 0.5;
  const center = polarToCartesian(cx, cy, centroidDist, bearingDeg);
  const rot = ((rotationDeg % 360) + 360) % 360;

  // Vertex 0 toward the circle; 1 and 2 form the outer base.
  const vertices = [
    polarToCartesian(center.x, center.y, R, (bearingDeg + 180 + rot) % 360),
    polarToCartesian(center.x, center.y, R, (bearingDeg + 60 + rot) % 360),
    polarToCartesian(
      center.x,
      center.y,
      R,
      (bearingDeg - 60 + rot + 360) % 360
    ),
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
