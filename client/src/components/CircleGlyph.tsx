import {
  glyphHasVertexLetters,
  isAlchemicalGlyph,
  type GlyphSpec,
} from '../data/solomonicCircles';
import {
  ALCHEMICAL_CENTER,
  ALCHEMICAL_GLYPH_PATHS,
  ALCHEMICAL_VIEWBOX,
  isAlchemicalGlyphId,
} from '../lib/alchemicalGlyphPaths';
import {
  glyphPointLabels,
  heptagramPoints,
  heptagramVertices,
  hexagramTriangles,
  hexagramVertices,
  pentagramPoints,
  pentagramVertices,
  regularPolygonPoints,
  regularPolygonVertices,
} from '../lib/solomonicGeometry';

function GlyphPointTexts({
  labels,
  fontSize,
}: {
  labels: { char: string; x: number; y: number }[];
  fontSize: number;
}) {
  if (labels.length === 0) return null;
  return (
    <g fill="#e8d48b" fontFamily="Cinzel, Georgia, serif" fontSize={fontSize}>
      {labels.map((l, i) => (
        <text
          key={`${l.char}-${i}-${l.x.toFixed(1)}`}
          x={l.x}
          y={l.y}
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {l.char}
        </text>
      ))}
    </g>
  );
}

const DEFAULT_STROKE = '#c9a227';

function polygonSides(kind: GlyphSpec['kind']): number | null {
  switch (kind) {
    case 'triangle':
      return 3;
    case 'square':
      return 4;
    case 'pentagon':
      return 5;
    case 'hexagon':
      return 6;
    case 'heptagon':
      return 7;
    default:
      return null;
  }
}

interface CircleGlyphProps {
  spec: GlyphSpec;
  cx: number;
  cy: number;
  radius: number;
  stroke?: string;
  strokeWidth?: number;
  labelFontSize?: number;
  labelOutward?: number;
}

/**
 * Renders a center or cardinal glyph (star, polygon, circle, or alchemical mark).
 */
export default function CircleGlyph({
  spec,
  cx,
  cy,
  radius,
  stroke = DEFAULT_STROKE,
  strokeWidth = 1.25,
  labelFontSize = 13,
  labelOutward = 14,
}: CircleGlyphProps) {
  if (spec.kind === 'none') return null;

  const rot = spec.rotationDeg;
  const strokeProps = {
    fill: 'none' as const,
    stroke,
    strokeWidth,
    opacity: 0.9,
  };

  let labels: { char: string; x: number; y: number }[] = [];
  if (glyphHasVertexLetters(spec.kind) && spec.letters) {
    let verts: { x: number; y: number }[] = [];
    if (spec.kind === 'hexagram') {
      verts = hexagramVertices(cx, cy, radius, rot);
    } else if (spec.kind === 'pentagram') {
      verts = pentagramVertices(cx, cy, radius, rot);
    } else if (spec.kind === 'heptagram') {
      verts = heptagramVertices(cx, cy, radius, rot);
    } else {
      const sides = polygonSides(spec.kind);
      if (sides) verts = regularPolygonVertices(cx, cy, radius, sides, rot);
    }
    labels = glyphPointLabels(cx, cy, verts, spec.letters, labelOutward);
  }

  if (isAlchemicalGlyph(spec.kind) && isAlchemicalGlyphId(spec.kind)) {
    const paths = ALCHEMICAL_GLYPH_PATHS[spec.kind];
    const scale = (radius * 2) / ALCHEMICAL_VIEWBOX;
    return (
      <g
        transform={`translate(${cx},${cy}) rotate(${rot}) scale(${scale}) translate(${-ALCHEMICAL_CENTER},${-ALCHEMICAL_CENTER})`}
        {...strokeProps}
        strokeWidth={strokeWidth / scale}
      >
        {paths.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
    );
  }

  if (spec.kind === 'circle') {
    return (
      <circle cx={cx} cy={cy} r={radius} {...strokeProps} />
    );
  }

  if (spec.kind === 'hexagram') {
    const hex = hexagramTriangles(cx, cy, radius, rot);
    return (
      <g>
        <g {...strokeProps}>
          <polygon points={hex.up} />
          <polygon points={hex.down} />
        </g>
        <GlyphPointTexts labels={labels} fontSize={labelFontSize} />
      </g>
    );
  }

  if (spec.kind === 'pentagram') {
    return (
      <g>
        <polyline
          points={pentagramPoints(cx, cy, radius, rot)}
          {...strokeProps}
        />
        <GlyphPointTexts labels={labels} fontSize={labelFontSize} />
      </g>
    );
  }

  if (spec.kind === 'heptagram') {
    return (
      <g>
        <polyline
          points={heptagramPoints(cx, cy, radius, rot)}
          {...strokeProps}
        />
        <GlyphPointTexts labels={labels} fontSize={labelFontSize} />
      </g>
    );
  }

  const sides = polygonSides(spec.kind);
  if (sides) {
    return (
      <g>
        <polygon
          points={regularPolygonPoints(cx, cy, radius, sides, rot)}
          {...strokeProps}
        />
        <GlyphPointTexts labels={labels} fontSize={labelFontSize} />
      </g>
    );
  }

  return null;
}
