import { Router, Request, Response } from 'express';
import SolomonicCircle, {
  type TraditionId,
} from '../models/SolomonicCircle';
import User from '../models/User';
import { toPublicUser } from '../lib/userSerializers';
import { Visibility } from '../types/visibility';
import { AuthRequest, protect } from '../middleware/auth';

const router = Router();

const TRADITIONS: TraditionId[] = ['goetia', 'heptameron', 'generic'];
const WEEKDAYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

interface SanitizedRing {
  id: string;
  label: string;
  radius: number;
  text: string;
  script: 'latin' | 'hebrew';
  clockwise: boolean;
  opacity: number;
}

interface SanitizedGlyphSpec {
  kind: GlyphKind;
  letters: string;
  rotationDeg: number;
}

interface SanitizedConfig {
  tradition: TraditionId;
  weekday: string;
  rings: SanitizedRing[];
  showCompass: boolean;
  centerGlyph: SanitizedGlyphSpec;
  cardinalGlyphs: {
    n: SanitizedGlyphSpec;
    e: SanitizedGlyphSpec;
    s: SanitizedGlyphSpec;
    w: SanitizedGlyphSpec;
  };
  showInnerSquare: boolean;
  useHebrew: boolean;
  spiritId: string | null;
  showTriangle: boolean;
  triangleBearing: number;
  triangleRotationDeg: number;
  showSeal: boolean;
  boundaryStyle: 'circle' | 'serpent';
}

const DEFAULT_TRIANGLE_BEARING = 90;
const DEFAULT_TRIANGLE_ROTATION = 180;
const DEFAULT_RING_OPACITY = 0.85;
const MAX_GLYPH_LETTERS = 16;
/** Accept goetia-01 … goetia-72 style ids without importing the full catalog. */
const SPIRIT_ID_RE = /^goetia-(0[1-9]|[1-6][0-9]|7[0-2])$/;

type GlyphKind =
  | 'none'
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

const GLYPH_KIND_SET = new Set<GlyphKind>([
  'none',
  'hexagram',
  'pentagram',
  'heptagram',
  'circle',
  'triangle',
  'square',
  'pentagon',
  'hexagon',
  'heptagon',
  'alchemy_fire',
  'alchemy_water',
  'alchemy_air',
  'alchemy_earth',
  'alchemy_sun',
  'alchemy_moon',
  'alchemy_mercury',
  'alchemy_venus',
  'alchemy_mars',
  'alchemy_jupiter',
  'alchemy_saturn',
  'alchemy_salt',
  'alchemy_sulfur',
]);

function parseGlyphKind(value: unknown): GlyphKind {
  return typeof value === 'string' && GLYPH_KIND_SET.has(value as GlyphKind)
    ? (value as GlyphKind)
    : 'none';
}

function normalizeRotation(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return ((value % 360) + 360) % 360;
}

function sanitizeGlyphSpec(raw: unknown): SanitizedGlyphSpec {
  if (typeof raw === 'string') {
    return { kind: parseGlyphKind(raw), letters: '', rotationDeg: 0 };
  }
  if (!raw || typeof raw !== 'object') {
    return { kind: 'none', letters: '', rotationDeg: 0 };
  }
  const g = raw as Record<string, unknown>;
  return {
    kind: parseGlyphKind(g.kind),
    letters:
      typeof g.letters === 'string' ? g.letters.slice(0, MAX_GLYPH_LETTERS) : '',
    rotationDeg:
      typeof g.rotationDeg === 'number' && Number.isFinite(g.rotationDeg)
        ? normalizeRotation(g.rotationDeg)
        : 0,
  };
}

function sanitizeCardinalGlyphs(raw: unknown): SanitizedConfig['cardinalGlyphs'] {
  if (!raw || typeof raw !== 'object') {
    return {
      n: sanitizeGlyphSpec('none'),
      e: sanitizeGlyphSpec('none'),
      s: sanitizeGlyphSpec('none'),
      w: sanitizeGlyphSpec('none'),
    };
  }
  const g = raw as Record<string, unknown>;
  return {
    n: sanitizeGlyphSpec(g.n),
    e: sanitizeGlyphSpec(g.e),
    s: sanitizeGlyphSpec(g.s),
    w: sanitizeGlyphSpec(g.w),
  };
}

function sanitizeConfig(raw: unknown): SanitizedConfig | null {
  if (!raw || typeof raw !== 'object') return null;
  const c = raw as Record<string, unknown>;

  if (
    typeof c.tradition !== 'string' ||
    !TRADITIONS.includes(c.tradition as TraditionId)
  ) {
    return null;
  }
  const tradition = c.tradition as TraditionId;

  const weekday =
    typeof c.weekday === 'string' && WEEKDAYS.includes(c.weekday)
      ? c.weekday
      : 'sunday';

  if (!Array.isArray(c.rings) || c.rings.length === 0 || c.rings.length > 8) {
    return null;
  }

  const rings: SanitizedRing[] = [];
  for (const entry of c.rings) {
    if (!entry || typeof entry !== 'object') return null;
    const e = entry as Record<string, unknown>;
    if (typeof e.radius !== 'number' || !Number.isFinite(e.radius)) return null;
    if (typeof e.text !== 'string') return null;
    const script = e.script === 'hebrew' ? 'hebrew' : 'latin';
    rings.push({
      id:
        typeof e.id === 'string' && e.id.trim()
          ? e.id.trim().slice(0, 64)
          : `ring-${rings.length}`,
      label:
        typeof e.label === 'string' && e.label.trim()
          ? e.label.trim().slice(0, 64)
          : 'Ring',
      radius: Math.max(0.08, Math.min(1, e.radius)),
      text: e.text.slice(0, 500),
      script,
      clockwise: true,
      opacity:
        typeof e.opacity === 'number' && Number.isFinite(e.opacity)
          ? Math.max(0, Math.min(1, e.opacity))
          : DEFAULT_RING_OPACITY,
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
    if (SPIRIT_ID_RE.test(id)) spiritId = id;
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
    showTriangle: tradition === 'goetia' ? Boolean(c.showTriangle) : false,
    triangleBearing,
    triangleRotationDeg,
    showSeal: tradition === 'goetia' ? Boolean(c.showSeal) : false,
    boundaryStyle: c.boundaryStyle === 'serpent' ? 'serpent' : 'circle',
  };
}

function circlePayload(circle: {
  _id: unknown;
  userId: unknown;
  date: Date;
  name: string;
  tradition: TraditionId;
  config: Record<string, unknown>;
  notes?: string;
  visibility?: string;
}) {
  return {
    _id: circle._id,
    userId: circle.userId,
    date: circle.date,
    name: circle.name,
    tradition: circle.tradition,
    config: circle.config,
    notes: circle.notes ?? '',
    visibility: circle.visibility ?? Visibility.PRIVATE,
  };
}

/**
 * POST /api/solomonic/circles
 * Requires JWT. Creates a new Solomonic circle layout.
 * Body: { name, tradition, config, notes? }
 */
router.post('/circles', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, tradition, config: rawConfig, notes, visibility } = req.body as {
      name?: string;
      tradition?: string;
      config?: unknown;
      notes?: string;
      visibility?: string;
    };

    if (typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ message: 'name is required' });
      return;
    }
    if (name.trim().length > 100) {
      res.status(400).json({ message: 'name must be at most 100 characters' });
      return;
    }

    const config = sanitizeConfig(rawConfig);
    if (!config) {
      res.status(400).json({
        message:
          'config must include tradition and 1–8 rings with radius and text',
      });
      return;
    }

    const trad =
      typeof tradition === 'string' && TRADITIONS.includes(tradition as TraditionId)
        ? (tradition as TraditionId)
        : config.tradition;

    if (notes !== undefined && typeof notes !== 'string') {
      res.status(400).json({ message: 'notes must be a string' });
      return;
    }
    if (typeof notes === 'string' && notes.length > 5000) {
      res.status(400).json({ message: 'notes must be at most 5000 characters' });
      return;
    }

    const circle = await SolomonicCircle.create({
      userId: req.userId,
      date: new Date(),
      name: name.trim(),
      tradition: trad,
      config,
      notes: typeof notes === 'string' ? notes.trim() : '',
      visibility: typeof visibility === 'string' && [Visibility.PRIVATE, Visibility.UNLISTED, Visibility.PUBLIC].includes(visibility as any) ? visibility : Visibility.PRIVATE,
    });

    res.status(201).json({
      message: 'Circle saved',
      circle: circlePayload(circle),
    });
  } catch (error) {
    console.error('Solomonic circle save error:', error);
    res.status(500).json({ message: 'Server error while saving circle' });
  }
});

/**
 * GET /api/solomonic/circles
 * Requires JWT. Returns the authenticated user's recent circles (newest first).
 */
router.get('/circles', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const circles = await SolomonicCircle.find({ userId: req.userId })
      .sort({ date: -1 })
      .limit(20)
      .lean();

    res.json({
      circles: circles.map((c) => ({
        _id: c._id,
        date: c.date,
        name: c.name,
        tradition: c.tradition,
        config: c.config,
        notes: c.notes ?? '',
      })),
    });
  } catch (error) {
    console.error('Solomonic circles history error:', error);
    res.status(500).json({ message: 'Server error while loading circles' });
  }
});

/**
 * PUT /api/solomonic/circles/:id
 * Requires JWT. Updates an existing circle owned by the user.
 * Body: { name, tradition, config, notes? }
 */
router.put(
  '/circles/:id',
  protect,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { name, tradition, config: rawConfig, notes, visibility } = req.body as {
        name?: string;
        tradition?: string;
        config?: unknown;
        notes?: string;
        visibility?: string;
      };

      if (typeof name !== 'string' || !name.trim()) {
        res.status(400).json({ message: 'name is required' });
        return;
      }
      if (name.trim().length > 100) {
        res.status(400).json({ message: 'name must be at most 100 characters' });
        return;
      }

      const config = sanitizeConfig(rawConfig);
      if (!config) {
        res.status(400).json({
          message:
            'config must include tradition and 1–8 rings with radius and text',
        });
        return;
      }

      const trad =
        typeof tradition === 'string' &&
        TRADITIONS.includes(tradition as TraditionId)
          ? (tradition as TraditionId)
          : config.tradition;

      if (notes !== undefined && typeof notes !== 'string') {
        res.status(400).json({ message: 'notes must be a string' });
        return;
      }
      if (typeof notes === 'string' && notes.length > 5000) {
        res.status(400).json({ message: 'notes must be at most 5000 characters' });
        return;
      }

      const circle = await SolomonicCircle.findOne({
        _id: id,
        userId: req.userId,
      });
      if (!circle) {
        res.status(404).json({ message: 'Circle not found' });
        return;
      }

      circle.name = name.trim();
      circle.tradition = trad;
      circle.config = config as unknown as Record<string, unknown>;
      circle.notes = typeof notes === 'string' ? notes.trim() : '';
      if (typeof visibility === 'string' && [Visibility.PRIVATE, Visibility.UNLISTED, Visibility.PUBLIC].includes(visibility as any)) {
        circle.visibility = visibility as any;
      }
      circle.date = new Date();
      await circle.save();

      res.json({
        message: 'Circle updated',
        circle: circlePayload(circle),
      });
    } catch (error) {
      console.error('Solomonic circle update error:', error);
      res.status(500).json({ message: 'Server error while updating circle' });
    }
  }
);

/**
 * Public GET handler for shareable Solomonic circles.
 * Works without authentication if visibility is not private.
 */
const handlePublicCircle = async (req: Request, res: Response): Promise<void> => {
  try {
    const circle = await SolomonicCircle.findById(req.params.id);
    if (!circle) {
      res.status(404).json({ message: 'Solomonic circle not found' });
      return;
    }
    if (circle.visibility === Visibility.PRIVATE) {
      res.status(403).json({ message: 'This circle is private' });
      return;
    }
    const creatorUser = await User.findById(circle.userId).lean();
    const creator = creatorUser ? toPublicUser(creatorUser) : null;
    res.json({
      ...circlePayload(circle),
      creator,
    });
  } catch (error) {
    console.error('Public circle fetch error:', error);
    res.status(500).json({ message: 'Server error while fetching public circle' });
  }
};

router.get('/circles/:id/public', handlePublicCircle);
router.get('/:id/public', handlePublicCircle);

export default router;
