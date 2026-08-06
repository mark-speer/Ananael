/**
 * Solomonic Circles — tradition presets, name banks, and layout builder.
 * Phase 5: magician's protective circle (parametric). Phase 6 will add spirits.
 */

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
  showInnerSquare: boolean;
  /** Prefer Hebrew strings when applying Goetia presets. */
  useHebrew: boolean;
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

export function applyTraditionPreset(
  tradition: TraditionId,
  opts?: {
    weekday?: Weekday;
    useHebrew?: boolean;
    showCompass?: boolean;
    centerGlyph?: CenterGlyph;
    showInnerSquare?: boolean;
  }
): CircleConfig {
  const weekday = opts?.weekday ?? defaultWeekday();
  const useHebrew = opts?.useHebrew ?? tradition === 'goetia';
  const showCompass = opts?.showCompass ?? true;
  const centerGlyph = opts?.centerGlyph ?? (tradition === 'goetia' ? 'hexagram' : 'none');
  const showInnerSquare = opts?.showInnerSquare ?? tradition !== 'generic';

  if (tradition === 'goetia') {
    const bank = useHebrew ? GOETIA_HEBREW : GOETIA_LATIN;
    const script: RingScript = useHebrew ? 'hebrew' : 'latin';
    return {
      tradition,
      weekday,
      useHebrew,
      showCompass,
      centerGlyph,
      showInnerSquare,
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
      showInnerSquare,
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
    showInnerSquare: opts?.showInnerSquare ?? false,
    rings: [
      ring('Outer ring', 1, '', 'latin', true),
      ring('Middle ring', 0.75, '', 'latin', true),
      ring('Inner ring', 0.5, '', 'latin', false),
    ],
  };
}

/** Absolute radius in SVG units for a relative ring radius. */
export function absoluteRadius(relative: number): number {
  const r = Math.max(0.08, Math.min(1, relative));
  return r * MAX_RADIUS;
}

/**
 * Build a serializable layout snapshot from config.
 * (Identity for Phase 5 — kept for a stable API / future Phase 6 enrichment.)
 */
export function buildCircleLayout(config: CircleConfig): CircleConfig {
  return {
    ...config,
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

  const centerGlyph: CenterGlyph =
    c.centerGlyph === 'hexagram' || c.centerGlyph === 'pentagram'
      ? c.centerGlyph
      : 'none';

  return {
    tradition,
    weekday,
    rings,
    showCompass: c.showCompass !== false,
    centerGlyph,
    showInnerSquare: Boolean(c.showInnerSquare),
    useHebrew: Boolean(c.useHebrew),
  };
}
