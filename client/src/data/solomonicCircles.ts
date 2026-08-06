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

export type CenterGlyph = 'none' | 'hexagram' | 'pentagram';

export type CardinalDir = 'n' | 'e' | 's' | 'w';

export type CardinalGlyphs = Record<CardinalDir, CenterGlyph>;

export type RingScript = 'latin' | 'hebrew';

export interface RingConfig {
  id: string;
  /** UI label */
  label: string;
  /** Relative radius 0–1 (mapped to MAX_RADIUS). */
  radius: number;
  /** Text placed along the ring via textPath. */
  text: string;
  script: RingScript;
  /** Clockwise textPath (outer rings usually true). */
  clockwise: boolean;
}

export interface CircleConfig {
  tradition: TraditionId;
  weekday: Weekday;
  rings: RingConfig[];
  showCompass: boolean;
  centerGlyph: CenterGlyph;
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
  /** Labeled seal frame inside the triangle. */
  showSeal: boolean;
}

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
  hexagram: 'Hexagram',
  pentagram: 'Pentagram',
};

export const CARDINAL_DIRS: CardinalDir[] = ['n', 'e', 's', 'w'];

export const CARDINAL_DIR_LABELS: Record<CardinalDir, string> = {
  n: 'N',
  e: 'E',
  s: 'S',
  w: 'W',
};

/** Default triangle bearing: East (classic outer placement relative to operator). */
export const DEFAULT_TRIANGLE_BEARING = 90;

export function defaultCardinalGlyphs(
  glyph: CenterGlyph = 'none'
): CardinalGlyphs {
  return { n: glyph, e: glyph, s: glyph, w: glyph };
}

function parseGlyph(value: unknown): CenterGlyph {
  return value === 'hexagram' || value === 'pentagram' ? value : 'none';
}

export function sanitizeCardinalGlyphs(raw: unknown): CardinalGlyphs {
  if (!raw || typeof raw !== 'object') {
    return defaultCardinalGlyphs('none');
  }
  const g = raw as Record<string, unknown>;
  return {
    n: parseGlyph(g.n),
    e: parseGlyph(g.e),
    s: parseGlyph(g.s),
    w: parseGlyph(g.w),
  };
}

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function ring(
  label: string,
  radius: number,
  text: string,
  script: RingScript,
  clockwise = true
): RingConfig {
  return {
    id: uid('ring'),
    label,
    radius,
    text,
    script,
    clockwise,
  };
}

/** Classic Goetia-style divine names (Latin transliteration). */
const GOETIA_LATIN = {
  outer:
    'YHVH · ADONAI · EHEIEH · AGLA · YHVH · ADONAI · EHEIEH · AGLA',
  middle: 'EL · ELOHIM · ELOAH · TZABAOTH · ELYON · SHADDAI',
  inner: 'ALPHA · OMEGA · TETRAGRAMMATON',
};

/** Hebrew divine names for Goetia-leaning defaults (Unicode). */
const GOETIA_HEBREW = {
  outer: 'יהוה · אדני · אהיה · אגלא · יהוה · אדני · אהיה · אגלא',
  middle: 'אל · אלהים · אלוה · צבאות · עליון · שדי',
  inner: 'אלפא · אומגה · יהוה',
};

/**
 * Heptameron day angels / names (simplified public-domain leaning banks).
 * Outer: ruling angel + divine name cluster; middle: assistants; inner: hour spirit cue.
 */
const HEPTAMERON: Record<
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

export function defaultWeekday(): Weekday {
  const d = new Date().getDay();
  return WEEKDAYS[d] ?? 'sunday';
}

function conjurationDefaults(): Pick<
  CircleConfig,
  'spiritId' | 'showTriangle' | 'triangleBearing' | 'showSeal'
> {
  return {
    spiritId: null,
    showTriangle: false,
    triangleBearing: DEFAULT_TRIANGLE_BEARING,
    showSeal: false,
  };
}

export function applyTraditionPreset(
  tradition: TraditionId,
  opts?: {
    weekday?: Weekday;
    useHebrew?: boolean;
    showCompass?: boolean;
    centerGlyph?: CenterGlyph;
    cardinalGlyphs?: CardinalGlyphs;
    showInnerSquare?: boolean;
    spiritId?: string | null;
    showTriangle?: boolean;
    triangleBearing?: number;
    showSeal?: boolean;
  }
): CircleConfig {
  const weekday = opts?.weekday ?? defaultWeekday();
  const useHebrew = opts?.useHebrew ?? tradition === 'goetia';
  const showCompass = opts?.showCompass ?? true;
  const centerGlyph =
    opts?.centerGlyph ?? (tradition === 'goetia' ? 'hexagram' : 'none');
  const showInnerSquare = opts?.showInnerSquare ?? tradition !== 'generic';
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
  const showSeal =
    tradition === 'goetia' ? (opts?.showSeal ?? conj.showSeal) : false;

  if (tradition === 'goetia') {
    const bank = useHebrew ? GOETIA_HEBREW : GOETIA_LATIN;
    const script: RingScript = useHebrew ? 'hebrew' : 'latin';
    const cardinalGlyphs =
      opts?.cardinalGlyphs ?? defaultCardinalGlyphs('pentagram');
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
      showSeal,
      rings: [
        ring('Outer ring', 1, bank.outer, script, true),
        ring('Middle ring', 0.78, bank.middle, script, true),
        ring('Inner ring', 0.56, bank.inner, script, false),
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
      centerGlyph: opts?.centerGlyph ?? 'pentagram',
      cardinalGlyphs: opts?.cardinalGlyphs ?? defaultCardinalGlyphs('none'),
      showInnerSquare,
      spiritId: null,
      showTriangle: false,
      triangleBearing,
      showSeal: false,
      rings: [
        ring('Outer ring', 1, bank.outer, 'latin', true),
        ring('Middle ring', 0.76, bank.middle, 'latin', true),
        ring('Inner ring', 0.52, bank.inner, 'latin', false),
      ],
    };
  }

  // Generic — blank editable slots
  return {
    tradition: 'generic',
    weekday,
    useHebrew: false,
    showCompass,
    centerGlyph: opts?.centerGlyph ?? 'none',
    cardinalGlyphs: opts?.cardinalGlyphs ?? defaultCardinalGlyphs('none'),
    showInnerSquare: opts?.showInnerSquare ?? false,
    spiritId: null,
    showTriangle: false,
    triangleBearing,
    showSeal: false,
    rings: [
      ring('Outer ring', 1, '', 'latin', true),
      ring('Middle ring', 0.75, '', 'latin', true),
      ring('Inner ring', 0.5, '', 'latin', false),
    ],
  };
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
    >
  >
): CircleConfig | null {
  const spirit = getSpiritById(spiritId);
  if (!spirit) return null;
  return applyTraditionPreset('goetia', {
    weekday: base?.weekday,
    useHebrew: base?.useHebrew ?? true,
    showCompass: base?.showCompass,
    centerGlyph: base?.centerGlyph ?? 'hexagram',
    cardinalGlyphs: base?.cardinalGlyphs,
    showInnerSquare: base?.showInnerSquare ?? true,
    spiritId: spirit.id,
    showTriangle: true,
    triangleBearing: base?.triangleBearing ?? DEFAULT_TRIANGLE_BEARING,
    showSeal: true,
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

  let spiritId: string | null = null;
  if (typeof config.spiritId === 'string' && config.spiritId.trim()) {
    const id = config.spiritId.trim().slice(0, 64);
    spiritId = getSpiritById(id) ? id : null;
  }

  return {
    ...config,
    spiritId,
    cardinalGlyphs: sanitizeCardinalGlyphs(config.cardinalGlyphs),
    showTriangle: Boolean(config.showTriangle),
    triangleBearing: bearing,
    showSeal: Boolean(config.showSeal),
    rings: config.rings.map((r) => ({
      ...r,
      radius: Math.max(0.08, Math.min(1, r.radius)),
      text: r.text.slice(0, 500),
      label: r.label.slice(0, 64),
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
      clockwise: e.clockwise !== false,
    });
  }

  const centerGlyph = parseGlyph(c.centerGlyph);
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
    showSeal: Boolean(c.showSeal),
  };
}
