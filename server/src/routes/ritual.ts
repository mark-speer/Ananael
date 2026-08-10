import { Router, Response } from 'express';
import RitualLayout, {
  type IRitualItem,
  type RitualToolType,
} from '../models/RitualLayout';
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
}) {
  return {
    _id: layout._id,
    userId: layout.userId,
    date: layout.date,
    name: layout.name,
    items: layout.items,
    showCompass: layout.showCompass,
    notes: layout.notes ?? '',
  };
}

/**
 * POST /api/ritual/layouts
 * Requires JWT. Creates a new ritual space layout.
 * Body: { name, items, showCompass?, notes? }
 */
router.post('/layouts', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, items: rawItems, showCompass, notes } = req.body as {
      name?: string;
      items?: unknown;
      showCompass?: boolean;
      notes?: string;
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
      const { name, items: rawItems, showCompass, notes } = req.body as {
        name?: string;
        items?: unknown;
        showCompass?: boolean;
        notes?: string;
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

export default router;
