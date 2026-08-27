/**
 * Solomonic Circles — tradition presets, name banks, and layout builder.
 * Phase 5: magician's protective circle (parametric).
 * Phase 6: Goetia conjuration (spirit + Triangle of Art + seal slot).
 */

import { getSpiritById } from './arsGoetia';
import { MAX_RADIUS } from '../lib/solomonicGeometry';

export type TraditionId = 'goetia' | 'heptameron' | 'generic';

export type Weekday =
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday';

export type CenterGlyph =
  | 'none'
  | 'script'
  | 'hexagram'
  | 'pentagram'
  | 'heptagram'
  | 'circle'
  | 'triangle'
  | 'square'
  | 'pentagon'
  | 'hexagon'
  | 'heptagon'
  | 'alchemy_fire'
  | 'alchemy_water'
  | 'alchemy_air'
  | 'alchemy_earth'
  | 'alchemy_sun'
  | 'alchemy_moon'
  | 'alchemy_mercury'
  | 'alchemy_venus'
  | 'alchemy_mars'
  | 'alchemy_jupiter'
  | 'alchemy_saturn'
  | 'alchemy_salt'
  | 'alchemy_sulfur';

export type CardinalDir = 'n' | 'e' | 's' | 'w';

/** Per-glyph kind, point letters, and rotation. */
export interface GlyphSpec {
  kind: CenterGlyph;
  /**
   * Characters mapped onto vertices in order; extras ignored.
   * For the 'script' kind this is the character(s) drawn as the glyph itself.
   */
  letters: string;
  /** Compass degrees (0 = tip North, CW) for geometric / alchemical glyphs. */
  rotationDeg: number;
}

export type CardinalGlyphs = Record<CardinalDir, GlyphSpec>;

export type RingScript = 'latin' | 'hebrew';

/** Ring stroke / textPath geometry: perfect circles or serpentine coils. */
export type BoundaryStyle = 'circle' | 'serpent';

export interface RingConfig {
  id: string;
  /** UI label */
  label: string;
  /** Relative radius 0–1 (mapped to MAX_RADIUS). */
  radius: number;
  /** Text placed along the ring via textPath. */
  text: string;
  script: RingScript;
  /** Clockwise textPath — keeps lettering on the outside of the ring. */
  clockwise: boolean;
  /** Stroke opacity (0–1); lettering is unaffected. */
  opacity: number;
}

export interface CircleConfig {
  tradition: TraditionId;
  weekday: Weekday;
  rings: RingConfig[];
  showCompass: boolean;
  centerGlyph: GlyphSpec;
  /** Independent glyphs at the four cardinal quarters. */
  cardinalGlyphs: CardinalGlyphs;
  showInnerSquare: boolean;
  /** Prefer Hebrew strings when applying Goetia presets. */
  useHebrew: boolean;
  /** Selected Ars Goetia spirit id, or null for circle-only. */
  spiritId: string | null;
  /** Draw Triangle of Art outside the circle. */
  showTriangle: boolean;
  /** Compass degrees from circle center to triangle (0 = North). */
  triangleBearing: number;
  /** Rotation about triangle centroid; 0 = apex toward circle. */
  triangleRotationDeg: number;
  /** Labeled seal frame inside the triangle. */
  showSeal: boolean;
  /** Concentric ring strokes: circles (default) or coiling serpent paths. */
  boundaryStyle: BoundaryStyle;
}

/** Named layout templates (Ritual Space–style picker). */
export type CircleTemplateId =
  | 'goetiaClassic'
  | 'goetiaHebrew'
  | 'heptameronDay'
  | 'blank';

export const CIRCLE_TEMPLATE_LABELS: Record<CircleTemplateId, string> = {
  goetiaClassic: 'Goetia Classic',
  goetiaHebrew: 'Goetia Hebrew',
  heptameronDay: 'Heptameron Day',
  blank: 'Blank',
};

export const CIRCLE_TEMPLATE_IDS: CircleTemplateId[] = [
  'goetiaClassic',
  'goetiaHebrew',
  'heptameronDay',
  'blank',
];

export const BOUNDARY_STYLE_LABELS: Record<BoundaryStyle, string> = {
  circle: 'Circles',
  serpent: 'Serpent',
};

export interface CircleLayoutDocument {
  name: string;
  tradition: TraditionId;
  config: CircleConfig;
  notes?: string;
}

export const TRADITION_LABELS: Record<TraditionId, string> = {
  goetia: 'Lesser Key / Goetia',
  heptameron: 'Heptameron',
  generic: 'Generic Solomonic',
};

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  sunday: 'Sunday (Sun)',
  monday: 'Monday (Moon)',
  tuesday: 'Tuesday (Mars)',
  wednesday: 'Wednesday (Mercury)',
  thursday: 'Thursday (Jupiter)',
  friday: 'Friday (Venus)',
  saturday: 'Saturday (Saturn)',
};

export const WEEKDAYS: Weekday[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

export const CENTER_GLYPH_LABELS: Record<CenterGlyph, string> = {
  none: 'None',
  script: 'Script character',
  hexagram: 'Hexagram',
  pentagram: 'Pentagram',
  heptagram: 'Heptagram',
  circle: 'Circle',
  triangle: 'Triangle',
  square: 'Square',
  pentagon: 'Pentagon',
  hexagon: 'Hexagon',
  heptagon: 'Heptagon',
  alchemy_fire: 'Fire',
  alchemy_water: 'Water',
  alchemy_air: 'Air',
  alchemy_earth: 'Earth',
  alchemy_sun: 'Sun',
  alchemy_moon: 'Moon',
  alchemy_mercury: 'Mercury',
  alchemy_venus: 'Venus',
  alchemy_mars: 'Mars',
  alchemy_jupiter: 'Jupiter',
  alchemy_saturn: 'Saturn',
  alchemy_salt: 'Salt',
  alchemy_sulfur: 'Sulfur',
};

/** Optgroup sections for the glyph kind select. */
export const CENTER_GLYPH_GROUPS: {
  label: string;
  kinds: CenterGlyph[];
}[] = [
  { label: 'None', kinds: ['none'] },
  {
    label: 'Stars & figures',
    kinds: ['hexagram', 'pentagram', 'heptagram', 'circle'],
  },
  {
    label: 'Polygons',
    kinds: ['triangle', 'square', 'pentagon', 'hexagon', 'heptagon'],
  },
  {
    label: 'Elements',
    kinds: [
      'alchemy_fire',
      'alchemy_water',
      'alchemy_air',
      'alchemy_earth',
    ],
  },
  {
    label: 'Planets',
    kinds: [
      'alchemy_sun',
      'alchemy_moon',
      'alchemy_mercury',
      'alchemy_venus',
      'alchemy_mars',
      'alchemy_jupiter',
      'alchemy_saturn',
    ],
  },
  {
    label: 'Principles',
    kinds: ['alchemy_salt', 'alchemy_sulfur', 'alchemy_mercury'],
  },
];

const GLYPH_KIND_SET = new Set<string>(
  Object.keys(CENTER_GLYPH_LABELS) as CenterGlyph[]
);

/** Vertex-letter kinds (stars + polygons). */
const VERTEX_LETTER_KINDS: ReadonlySet<CenterGlyph> = new Set([
  'hexagram',
  'pentagram',
  'heptagram',
  'triangle',
  'square',
  'pentagon',
  'hexagon',
  'heptagon',
]);

export function glyphHasVertexLetters(kind: CenterGlyph): boolean {
  return VERTEX_LETTER_KINDS.has(kind);
}

export function glyphSupportsRotation(kind: CenterGlyph): boolean {
  return kind !== 'none';
}

export function isAlchemicalGlyph(kind: CenterGlyph): boolean {
  return kind.startsWith('alchemy_');
}

export const CARDINAL_DIRS: CardinalDir[] = ['n', 'e', 's', 'w'];

export const CARDINAL_DIR_LABELS: Record<CardinalDir, string> = {
  n: 'N',
  e: 'E',
  s: 'S',
  w: 'W',
};

/** Default triangle bearing: East (classic outer placement relative to operator). */
export const DEFAULT_TRIANGLE_BEARING = 90;

/** Default in-place triangle rotation (180° from apex-toward-circle). */
export const DEFAULT_TRIANGLE_ROTATION = 180;

/** Default ring stroke opacity. */
export const DEFAULT_RING_OPACITY = 0.85;

/** Default ring boundary geometry. */
export const DEFAULT_BOUNDARY_STYLE: BoundaryStyle = 'circle';

const MAX_GLYPH_LETTERS = 16;
const MAX_RING_TEXT = 500;

/** Repeat a name cycle until the ring text fills the circumference budget. */
export function fillRingText(cycle: string, maxLen = MAX_RING_TEXT): string {
  const trimmed = cycle.trim();
  if (!trimmed) return '';
  const sep = ' · ';
  let result = trimmed;
  while (result.length + sep.length + trimmed.length <= maxLen) {
    result += sep + trimmed;
  }
  return result.slice(0, maxLen);
}

export function sanitizeBoundaryStyle(raw: unknown): BoundaryStyle {
  return raw === 'serpent' ? 'serpent' : DEFAULT_BOUNDARY_STYLE;
}

export function glyphSpec(
  kind: CenterGlyph = 'none',
  letters = '',
  rotationDeg = 0
): GlyphSpec {
  return {
    kind,
    letters: letters.slice(0, MAX_GLYPH_LETTERS),
    rotationDeg: normalizeRotation(rotationDeg),
  };
}

function normalizeRotation(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return ((value % 360) + 360) % 360;
}

function parseGlyphKind(value: unknown): CenterGlyph {
  return typeof value === 'string' && GLYPH_KIND_SET.has(value)
    ? (value as CenterGlyph)
    : 'none';
}

/** Coerce legacy string kinds or partial objects into GlyphSpec. */
export function sanitizeGlyphSpec(raw: unknown): GlyphSpec {
  if (typeof raw === 'string') {
    return glyphSpec(parseGlyphKind(raw));
  }
  if (!raw || typeof raw !== 'object') {
    return glyphSpec('none');
  }
  const g = raw as Record<string, unknown>;
  const kind = parseGlyphKind(g.kind);
  const letters =
    typeof g.letters === 'string' ? g.letters.slice(0, MAX_GLYPH_LETTERS) : '';
  const rotationDeg =
    typeof g.rotationDeg === 'number' && Number.isFinite(g.rotationDeg)
      ? normalizeRotation(g.rotationDeg)
      : 0;
  return { kind, letters, rotationDeg };
}

export function defaultCardinalGlyphs(kind: CenterGlyph = 'none'): CardinalGlyphs {
  return {
    n: glyphSpec(kind),
    e: glyphSpec(kind),
    s: glyphSpec(kind),
    w: glyphSpec(kind),
  };
}

export function sanitizeCardinalGlyphs(raw: unknown): CardinalGlyphs {
  if (!raw || typeof raw !== 'object') {
    return defaultCardinalGlyphs('none');
  }
  const g = raw as Record<string, unknown>;
  return {
    n: sanitizeGlyphSpec(g.n),
    e: sanitizeGlyphSpec(g.e),
    s: sanitizeGlyphSpec(g.s),
    w: sanitizeGlyphSpec(g.w),
  };
}

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function sanitizeRingOpacity(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.min(1, value));
  }
  return DEFAULT_RING_OPACITY;
}

function ring(
  label: string,
  radius: number,
  text: string,
  script: RingScript,
  clockwise = true,
  opacity = DEFAULT_RING_OPACITY
): RingConfig {
  return {
    id: uid('ring'),
    label,
    radius,
    text,
    script,
    clockwise,
    opacity,
  };
}

/** Classic Goetia-style divine names (Latin transliteration) — single cycle. */
const GOETIA_LATIN_CYCLE = {
  outer: 'YHVH · ADONAI · EHEIEH · AGLA',
  middle: 'EL · ELOHIM · ELOAH · TZABAOTH · ELYON · SHADDAI',
  inner: 'ALPHA · OMEGA · TETRAGRAMMATON',
};

/** Hebrew divine names for Goetia-leaning defaults (Unicode) — single cycle. */
const GOETIA_HEBREW_CYCLE = {
  outer: 'יהוה · אדני · אהיה · אגלא',
  middle: 'אל · אלהים · אלוה · צבאות · עליון · שדי',
  inner: 'אלפא · אומגה · יהוה',
};

/** Dense repeated banks for templates / tradition presets. */
const GOETIA_LATIN = {
  outer: fillRingText(GOETIA_LATIN_CYCLE.outer),
  middle: fillRingText(GOETIA_LATIN_CYCLE.middle),
  inner: fillRingText(GOETIA_LATIN_CYCLE.inner),
};

const GOETIA_HEBREW = {
  outer: fillRingText(GOETIA_HEBREW_CYCLE.outer),
  middle: fillRingText(GOETIA_HEBREW_CYCLE.middle),
  inner: fillRingText(GOETIA_HEBREW_CYCLE.inner),
};

/** Sacred names on the four cardinal hexagrams (Goetia plate style). */
function goetiaCardinalGlyphs(hebrew: boolean): CardinalGlyphs {
  if (hebrew) {
    return {
      n: glyphSpec('hexagram', 'אגלא'),
      e: glyphSpec('hexagram', 'אדני'),
      s: glyphSpec('hexagram', 'אהיה'),
      w: glyphSpec('hexagram', 'יהוה'),
    };
  }
  return {
    n: glyphSpec('hexagram', 'AGLA'),
    e: glyphSpec('hexagram', 'ADNI'),
    s: glyphSpec('hexagram', 'AHIH'),
    w: glyphSpec('hexagram', 'YHVH'),
  };
}

/**
 * Heptameron day angels / names (simplified public-domain leaning banks).
 * Outer: ruling angel + divine name cluster; middle: assistants; inner: hour spirit cue.
 */
const HEPTAMERON_CYCLE: Record<
  Weekday,
  { outer: string; middle: string; inner: string }
> = {
  sunday: {
    outer: 'MICHAEL · ADONAI · YHVH TZABAOTH · MICHAEL',
    middle: 'DAGIEL · SALAMIA · VARCAN · KING OF THE SUN',
    inner: 'SOL · DIES DOMINICA',
  },
  monday: {
    outer: 'GABRIEL · ELOHIM · SHADDAI · GABRIEL',
    middle: 'ORPHANIAL · ARACHIEL · ABAS · KING OF THE MOON',
    inner: 'LUNA · DIES LUNAE',
  },
  tuesday: {
    outer: 'SAMAEL · ELOHIM GIBOR · SAMAEL',
    middle: 'FRIAGNEL · GUABAREL · SAMAX · KING OF MARS',
    inner: 'MARS · DIES MARTIS',
  },
  wednesday: {
    outer: 'RAPHAEL · ELOHIM TZABAOTH · RAPHAEL',
    middle: 'MODIAT · SUQUINOS · MEDIAT · KING OF MERCURY',
    inner: 'MERCURIUS · DIES MERCURII',
  },
  thursday: {
    outer: 'SACHIEL · EL · SACHIEL',
    middle: 'CASTIEL · ASASIEL · SUTH · KING OF JUPITER',
    inner: 'JUPITER · DIES JOVIS',
  },
  friday: {
    outer: 'ANAEL · YHVH TZABAOTH · ANAEL',
    middle: 'RACHIEL · ABDIEL · SARABOTRES · KING OF VENUS',
    inner: 'VENUS · DIES VENERIS',
  },
  saturday: {
    outer: 'CASSIEL · YHVH ELOHIM · CASSIEL',
    middle: 'MACHATAN · URIEL · MAYMON · KING OF SATURN',
    inner: 'SATURNUS · DIES SATURNI',
  },
};

const HEPTAMERON: Record<
  Weekday,
  { outer: string; middle: string; inner: string }
> = Object.fromEntries(
  (Object.keys(HEPTAMERON_CYCLE) as Weekday[]).map((day) => {
    const c = HEPTAMERON_CYCLE[day];
    return [
      day,
      {
        outer: fillRingText(c.outer),
        middle: fillRingText(c.middle),
        inner: fillRingText(c.inner),
      },
    ];
  })
) as Record<Weekday, { outer: string; middle: string; inner: string }>;

/** Cardinal hexagram letters from each day's angel / divine-name cluster. */
const HEPTAMERON_CARDINAL_LETTERS: Record<
  Weekday,
  Record<CardinalDir, string>
> = {
  sunday: { n: 'MICHAEL', e: 'ADONAI', s: 'DAGIEL', w: 'YHVH' },
  monday: { n: 'GABRIEL', e: 'ELOHIM', s: 'ABAS', w: 'SHDAI' },
  tuesday: { n: 'SAMAEL', e: 'GIBOR', s: 'SAMAX', w: 'MARS' },
  wednesday: { n: 'RAPHAEL', e: 'TZBAOT', s: 'MEDIAT', w: 'HERME' },
  thursday: { n: 'SACHIEL', e: 'EL', s: 'SUTH', w: 'IOVIS' },
  friday: { n: 'ANAEL', e: 'TZBAOT', s: 'ABDIEL', w: 'VENUS' },
  saturday: { n: 'CASSIEL', e: 'ELOHIM', s: 'URIEL', w: 'MAYMN' },
};

function heptameronCardinalGlyphs(weekday: Weekday): CardinalGlyphs {
  const letters = HEPTAMERON_CARDINAL_LETTERS[weekday];
  return {
    n: glyphSpec('hexagram', letters.n),
    e: glyphSpec('hexagram', letters.e),
    s: glyphSpec('hexagram', letters.s),
    w: glyphSpec('hexagram', letters.w),
  };
}

export function defaultWeekday(): Weekday {
  const d = new Date().getDay();
  return WEEKDAYS[d] ?? 'sunday';
}

function conjurationDefaults(): Pick<
  CircleConfig,
  | 'spiritId'
  | 'showTriangle'
  | 'triangleBearing'
  | 'triangleRotationDeg'
  | 'showSeal'
> {
  return {
    spiritId: null,
    showTriangle: false,
    triangleBearing: DEFAULT_TRIANGLE_BEARING,
    triangleRotationDeg: DEFAULT_TRIANGLE_ROTATION,
    showSeal: false,
  };
}

export function applyTraditionPreset(
  tradition: TraditionId,
  opts?: {
    weekday?: Weekday;
    useHebrew?: boolean;
    showCompass?: boolean;
    centerGlyph?: GlyphSpec;
    cardinalGlyphs?: CardinalGlyphs;
    showInnerSquare?: boolean;
    spiritId?: string | null;
    showTriangle?: boolean;
    triangleBearing?: number;
    triangleRotationDeg?: number;
    showSeal?: boolean;
    boundaryStyle?: BoundaryStyle;
  }
): CircleConfig {
  const weekday = opts?.weekday ?? defaultWeekday();
  const useHebrew = opts?.useHebrew ?? tradition === 'goetia';
  const showCompass = opts?.showCompass ?? true;
  const centerGlyph =
    opts?.centerGlyph ??
    glyphSpec(tradition === 'goetia' ? 'hexagram' : 'none');
  const showInnerSquare = opts?.showInnerSquare ?? tradition !== 'generic';
  const boundaryStyle = sanitizeBoundaryStyle(
    opts?.boundaryStyle ?? DEFAULT_BOUNDARY_STYLE
  );
  const conj = conjurationDefaults();
  const spiritId =
    tradition === 'goetia'
      ? opts?.spiritId !== undefined
        ? opts.spiritId
        : conj.spiritId
      : null;
  const showTriangle =
    tradition === 'goetia' ? (opts?.showTriangle ?? conj.showTriangle) : false;
  const triangleBearing =
    typeof opts?.triangleBearing === 'number' &&
    Number.isFinite(opts.triangleBearing)
      ? ((opts.triangleBearing % 360) + 360) % 360
      : conj.triangleBearing;
  const triangleRotationDeg =
    typeof opts?.triangleRotationDeg === 'number' &&
    Number.isFinite(opts.triangleRotationDeg)
      ? ((opts.triangleRotationDeg % 360) + 360) % 360
      : conj.triangleRotationDeg;
  const showSeal =
    tradition === 'goetia' ? (opts?.showSeal ?? conj.showSeal) : false;

  if (tradition === 'goetia') {
    const bank = useHebrew ? GOETIA_HEBREW : GOETIA_LATIN;
    const script: RingScript = useHebrew ? 'hebrew' : 'latin';
    const cardinalGlyphs =
      opts?.cardinalGlyphs ?? goetiaCardinalGlyphs(useHebrew);
    return {
      tradition,
      weekday,
      useHebrew,
      showCompass,
      centerGlyph,
      cardinalGlyphs,
      showInnerSquare,
      spiritId,
      showTriangle,
      triangleBearing,
      triangleRotationDeg,
      showSeal,
      boundaryStyle,
      rings: [
        ring('Outer ring', 1, bank.outer, script, true),
        ring('Middle ring', 0.9, bank.middle, script, true),
        ring('Inner ring', 0.8, bank.inner, script, true),
      ],
    };
  }

  if (tradition === 'heptameron') {
    const bank = HEPTAMERON[weekday];
    return {
      tradition,
      weekday,
      useHebrew: false,
      showCompass,
      centerGlyph: opts?.centerGlyph ?? glyphSpec('pentagram'),
      cardinalGlyphs: opts?.cardinalGlyphs ?? heptameronCardinalGlyphs(weekday),
      showInnerSquare,
      spiritId: null,
      showTriangle: false,
      triangleBearing,
      triangleRotationDeg,
      showSeal: false,
      boundaryStyle,
      rings: [
        ring('Outer ring', 1, bank.outer, 'latin', true),
        ring('Middle ring', 0.9, bank.middle, 'latin', true),
        ring('Inner ring', 0.8, bank.inner, 'latin', true),
      ],
    };
  }

  // Generic — blank editable slots
  return {
    tradition: 'generic',
    weekday,
    useHebrew: false,
    showCompass,
    centerGlyph: opts?.centerGlyph ?? glyphSpec('none'),
    cardinalGlyphs: opts?.cardinalGlyphs ?? defaultCardinalGlyphs('none'),
    showInnerSquare: opts?.showInnerSquare ?? false,
    spiritId: null,
    showTriangle: false,
    triangleBearing,
    triangleRotationDeg,
    showSeal: false,
    boundaryStyle,
    rings: [
      ring('Outer ring', 1, '', 'latin', true),
      ring('Middle ring', 0.9, '', 'latin', true),
      ring('Inner ring', 0.8, '', 'latin', true),
    ],
  };
}

/**
 * Apply a named circle template (full rings + sacred names on cardinals).
 * Preserves boundary style and optional spirit conjuration fields from opts.
 */
export function applyCircleTemplate(
  id: CircleTemplateId,
  opts?: {
    weekday?: Weekday;
    spiritId?: string | null;
    showCompass?: boolean;
    boundaryStyle?: BoundaryStyle;
    showTriangle?: boolean;
    triangleBearing?: number;
    triangleRotationDeg?: number;
    showSeal?: boolean;
  }
): CircleConfig {
  const weekday = opts?.weekday ?? defaultWeekday();
  const boundaryStyle = sanitizeBoundaryStyle(opts?.boundaryStyle);
  const showCompass = opts?.showCompass ?? true;

  if (id === 'goetiaClassic' || id === 'goetiaHebrew') {
    const useHebrew = id === 'goetiaHebrew';
    return applyTraditionPreset('goetia', {
      weekday,
      useHebrew,
      showCompass,
      centerGlyph: glyphSpec('hexagram'),
      cardinalGlyphs: goetiaCardinalGlyphs(useHebrew),
      showInnerSquare: true,
      spiritId: opts?.spiritId ?? null,
      showTriangle: opts?.showTriangle ?? false,
      triangleBearing: opts?.triangleBearing,
      triangleRotationDeg: opts?.triangleRotationDeg,
      showSeal: opts?.showSeal ?? false,
      boundaryStyle,
    });
  }

  if (id === 'heptameronDay') {
    return applyTraditionPreset('heptameron', {
      weekday,
      showCompass,
      centerGlyph: glyphSpec('pentagram'),
      cardinalGlyphs: heptameronCardinalGlyphs(weekday),
      showInnerSquare: true,
      boundaryStyle,
    });
  }

  return applyTraditionPreset('generic', {
    weekday,
    showCompass,
    centerGlyph: glyphSpec('none'),
    cardinalGlyphs: defaultCardinalGlyphs('none'),
    showInnerSquare: false,
    boundaryStyle,
  });
}

/**
 * Apply a Goetia conjuration layout for a spirit: Goetia rings + triangle + seal.
 * Preserves Hebrew toggle and weekday from `base` when provided.
 */
export function applyConjurationTemplate(
  spiritId: string,
  base?: Partial<
    Pick<
      CircleConfig,
      | 'weekday'
      | 'useHebrew'
      | 'showCompass'
      | 'centerGlyph'
      | 'cardinalGlyphs'
      | 'showInnerSquare'
      | 'triangleBearing'
      | 'triangleRotationDeg'
      | 'boundaryStyle'
    >
  >
): CircleConfig | null {
  const spirit = getSpiritById(spiritId);
  if (!spirit) return null;
  return applyTraditionPreset('goetia', {
    weekday: base?.weekday,
    useHebrew: base?.useHebrew ?? true,
    showCompass: base?.showCompass,
    centerGlyph: base?.centerGlyph ?? glyphSpec('hexagram'),
    cardinalGlyphs: base?.cardinalGlyphs,
    showInnerSquare: base?.showInnerSquare ?? true,
    spiritId: spirit.id,
    showTriangle: true,
    triangleBearing: base?.triangleBearing ?? DEFAULT_TRIANGLE_BEARING,
    triangleRotationDeg:
      base?.triangleRotationDeg ?? DEFAULT_TRIANGLE_ROTATION,
    showSeal: true,
    boundaryStyle: base?.boundaryStyle,
  });
}

/** Absolute radius in SVG units for a relative ring radius. */
export function absoluteRadius(relative: number): number {
  const r = Math.max(0.08, Math.min(1, relative));
  return r * MAX_RADIUS;
}

/**
 * Build a serializable layout snapshot from config.
 */
export function buildCircleLayout(config: CircleConfig): CircleConfig {
  const bearing =
    typeof config.triangleBearing === 'number' &&
    Number.isFinite(config.triangleBearing)
      ? ((config.triangleBearing % 360) + 360) % 360
      : DEFAULT_TRIANGLE_BEARING;
  const triangleRotationDeg =
    typeof config.triangleRotationDeg === 'number' &&
    Number.isFinite(config.triangleRotationDeg)
      ? ((config.triangleRotationDeg % 360) + 360) % 360
      : DEFAULT_TRIANGLE_ROTATION;

  let spiritId: string | null = null;
  if (typeof config.spiritId === 'string' && config.spiritId.trim()) {
    const id = config.spiritId.trim().slice(0, 64);
    spiritId = getSpiritById(id) ? id : null;
  }

  return {
    ...config,
    spiritId,
    centerGlyph: sanitizeGlyphSpec(config.centerGlyph),
    cardinalGlyphs: sanitizeCardinalGlyphs(config.cardinalGlyphs),
    showTriangle: Boolean(config.showTriangle),
    triangleBearing: bearing,
    triangleRotationDeg,
    showSeal: Boolean(config.showSeal),
    boundaryStyle: sanitizeBoundaryStyle(config.boundaryStyle),
    rings: config.rings.map((r) => ({
      ...r,
      radius: Math.max(0.08, Math.min(1, r.radius)),
      text: r.text.slice(0, 500),
      label: r.label.slice(0, 64),
      clockwise: true,
      opacity: sanitizeRingOpacity(r.opacity),
    })),
  };
}

export function sanitizeCircleConfig(raw: unknown): CircleConfig | null {
  if (!raw || typeof raw !== 'object') return null;
  const c = raw as Record<string, unknown>;

  const tradition = c.tradition;
  if (
    tradition !== 'goetia' &&
    tradition !== 'heptameron' &&
    tradition !== 'generic'
  ) {
    return null;
  }

  const weekday =
    typeof c.weekday === 'string' && WEEKDAYS.includes(c.weekday as Weekday)
      ? (c.weekday as Weekday)
      : defaultWeekday();

  if (!Array.isArray(c.rings) || c.rings.length === 0 || c.rings.length > 8) {
    return null;
  }

  const rings: RingConfig[] = [];
  for (const entry of c.rings) {
    if (!entry || typeof entry !== 'object') return null;
    const e = entry as Record<string, unknown>;
    if (typeof e.radius !== 'number' || !Number.isFinite(e.radius)) return null;
    if (typeof e.text !== 'string') return null;
    const script: RingScript = e.script === 'hebrew' ? 'hebrew' : 'latin';
    rings.push({
      id:
        typeof e.id === 'string' && e.id.trim()
          ? e.id.trim().slice(0, 64)
          : uid('ring'),
      label:
        typeof e.label === 'string' && e.label.trim()
          ? e.label.trim().slice(0, 64)
          : 'Ring',
      radius: Math.max(0.08, Math.min(1, e.radius)),
      text: e.text.slice(0, 500),
      script,
      clockwise: true,
      opacity: sanitizeRingOpacity(e.opacity),
    });
  }

  const centerGlyph = sanitizeGlyphSpec(c.centerGlyph);
  const cardinalGlyphs = sanitizeCardinalGlyphs(c.cardinalGlyphs);

  let spiritId: string | null = null;
  if (
    tradition === 'goetia' &&
    typeof c.spiritId === 'string' &&
    c.spiritId.trim()
  ) {
    const id = c.spiritId.trim().slice(0, 64);
    if (getSpiritById(id)) spiritId = id;
  }

  const triangleBearing =
    typeof c.triangleBearing === 'number' && Number.isFinite(c.triangleBearing)
      ? ((c.triangleBearing % 360) + 360) % 360
      : DEFAULT_TRIANGLE_BEARING;
  const triangleRotationDeg =
    typeof c.triangleRotationDeg === 'number' &&
    Number.isFinite(c.triangleRotationDeg)
      ? ((c.triangleRotationDeg % 360) + 360) % 360
      : DEFAULT_TRIANGLE_ROTATION;

  return {
    tradition,
    weekday,
    rings,
    showCompass: c.showCompass !== false,
    centerGlyph,
    cardinalGlyphs,
    showInnerSquare: Boolean(c.showInnerSquare),
    useHebrew: Boolean(c.useHebrew),
    spiritId,
    showTriangle: Boolean(c.showTriangle),
    triangleBearing,
    triangleRotationDeg,
    showSeal: Boolean(c.showSeal),
    boundaryStyle: sanitizeBoundaryStyle(c.boundaryStyle),
  };
}
