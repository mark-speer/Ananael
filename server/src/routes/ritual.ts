import { Router, Request, Response } from 'express';
import RitualLayout, {
  type IRitualItem,
  type RitualToolType,
} from '../models/RitualLayout';
import User from '../models/User';
import { toPublicUser } from '../lib/userSerializers';
import { Visibility } from '../types/visibility';
import { AuthRequest, protect } from '../middleware/auth';

const router = Router();

const VALID_TYPES: RitualToolType[] = [
  'candle',
  'cup',
  'blade',
  'incense',
  'quarter',
];

function sanitizeItems(raw: unknown): IRitualItem[] | null {
  if (!Array.isArray(raw)) return null;
  if (raw.length > 200) return null;
  const out: IRitualItem[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') return null;
    const e = entry as Record<string, unknown>;
    if (typeof e.id !== 'string' || !e.id.trim() || e.id.length > 64) {
      return null;
    }
    if (typeof e.type !== 'string' || !VALID_TYPES.includes(e.type as RitualToolType)) {
      return null;
    }
    if (typeof e.x !== 'number' || typeof e.y !== 'number') return null;
    if (!Number.isInteger(e.x) || !Number.isInteger(e.y)) return null;
    if (e.x < 0 || e.x > 24 || e.y < 0 || e.y > 24) return null;

    const item: IRitualItem = {
      id: e.id.trim(),
      type: e.type as RitualToolType,
      x: e.x,
      y: e.y,
    };
    if (e.rotation !== undefined) {
      if (typeof e.rotation !== 'number' || !Number.isFinite(e.rotation)) {
        return null;
      }
      item.rotation = e.rotation % 360;
    }
    if (e.label !== undefined) {
      if (typeof e.label !== 'string' || e.label.length > 32) return null;
      item.label = e.label;
    }
    out.push(item);
  }
  return out;
}

function layoutPayload(layout: {
  _id: unknown;
  userId: unknown;
  date: Date;
  name: string;
  items: IRitualItem[];
  showCompass: boolean;
  notes?: string;
  visibility?: string;
}) {
  return {
    _id: layout._id,
    userId: layout.userId,
    date: layout.date,
    name: layout.name,
    items: layout.items,
    showCompass: layout.showCompass,
    notes: layout.notes ?? '',
    visibility: layout.visibility ?? Visibility.PRIVATE,
  };
}

/**
 * POST /api/ritual/layouts
 * Requires JWT. Creates a new ritual space layout.
 * Body: { name, items, showCompass?, notes? }
 */
router.post('/layouts', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, items: rawItems, showCompass, notes, visibility } = req.body as {
      name?: string;
      items?: unknown;
      showCompass?: boolean;
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

    const items = sanitizeItems(rawItems);
    if (items === null) {
      res.status(400).json({
        message:
          'items must be an array of up to 200 valid tools (type, id, x 0–24, y 0–24)',
      });
      return;
    }

    if (notes !== undefined && typeof notes !== 'string') {
      res.status(400).json({ message: 'notes must be a string' });
      return;
    }
    if (typeof notes === 'string' && notes.length > 5000) {
      res.status(400).json({ message: 'notes must be at most 5000 characters' });
      return;
    }

    const layout = await RitualLayout.create({
      userId: req.userId,
      date: new Date(),
      name: name.trim(),
      items,
      showCompass: showCompass !== false,
      notes: typeof notes === 'string' ? notes.trim() : '',
      visibility: typeof visibility === 'string' && [Visibility.PRIVATE, Visibility.UNLISTED, Visibility.PUBLIC].includes(visibility as any) ? visibility : Visibility.PRIVATE,
    });

    res.status(201).json({
      message: 'Layout saved',
      layout: layoutPayload(layout),
    });
  } catch (error) {
    console.error('Ritual layout save error:', error);
    res.status(500).json({ message: 'Server error while saving layout' });
  }
});

/**
 * GET /api/ritual/layouts
 * Requires JWT. Returns the authenticated user's recent layouts (newest first).
 */
router.get('/layouts', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const layouts = await RitualLayout.find({ userId: req.userId })
      .sort({ date: -1 })
      .limit(20)
      .lean();

    res.json({
      layouts: layouts.map((l) => ({
        _id: l._id,
        date: l.date,
        name: l.name,
        items: l.items,
        showCompass: l.showCompass,
        notes: l.notes ?? '',
      })),
    });
  } catch (error) {
    console.error('Ritual layouts history error:', error);
    res.status(500).json({ message: 'Server error while loading layouts' });
  }
});

/**
 * PUT /api/ritual/layouts/:id
 * Requires JWT. Updates an existing layout owned by the user.
 * Body: { name, items, showCompass?, notes? }
 */
router.put(
  '/layouts/:id',
  protect,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { name, items: rawItems, showCompass, notes, visibility } = req.body as {
        name?: string;
        items?: unknown;
        showCompass?: boolean;
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

      const items = sanitizeItems(rawItems);
      if (items === null) {
        res.status(400).json({
          message:
            'items must be an array of up to 200 valid tools (type, id, x 0–24, y 0–24)',
        });
        return;
      }

      if (notes !== undefined && typeof notes !== 'string') {
        res.status(400).json({ message: 'notes must be a string' });
        return;
      }
      if (typeof notes === 'string' && notes.length > 5000) {
        res.status(400).json({ message: 'notes must be at most 5000 characters' });
        return;
      }

      const layout = await RitualLayout.findOne({ _id: id, userId: req.userId });
      if (!layout) {
        res.status(404).json({ message: 'Layout not found' });
        return;
      }

      layout.name = name.trim();
      layout.items = items;
      layout.showCompass = showCompass !== false;
      layout.notes = typeof notes === 'string' ? notes.trim() : '';
      if (typeof visibility === 'string' && [Visibility.PRIVATE, Visibility.UNLISTED, Visibility.PUBLIC].includes(visibility as any)) {
        layout.visibility = visibility as any;
      }
      layout.date = new Date();
      await layout.save();

      res.json({
        message: 'Layout updated',
        layout: layoutPayload(layout),
      });
    } catch (error) {
      console.error('Ritual layout update error:', error);
      res.status(500).json({ message: 'Server error while updating layout' });
    }
  }
);

/**
 * Public GET handler for shareable ritual space layouts.
 * Works without authentication if visibility is not private.
 */
const handlePublicLayout = async (req: Request, res: Response): Promise<void> => {
  try {
    const layout = await RitualLayout.findById(req.params.id);
    if (!layout) {
      res.status(404).json({ message: 'Ritual layout not found' });
      return;
    }
    if (layout.visibility === Visibility.PRIVATE) {
      res.status(403).json({ message: 'This ritual layout is private' });
      return;
    }
    const creatorUser = await User.findById(layout.userId).lean();
    const creator = creatorUser ? toPublicUser(creatorUser) : null;
    res.json({
      ...layoutPayload(layout),
      creator,
    });
  } catch (error) {
    console.error('Public ritual layout fetch error:', error);
    res.status(500).json({ message: 'Server error while fetching public layout' });
  }
};

router.get('/layouts/:id/public', handlePublicLayout);
router.get('/:id/public', handlePublicLayout);

export default router;
