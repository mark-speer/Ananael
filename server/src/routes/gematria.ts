import { Router, Response } from 'express';
import GematriaQuery, { GematriaSystem, VALID_SYSTEMS } from '../models/GematriaQuery';
import { AuthRequest, protect } from '../middleware/auth';

const router = Router();

/**
 * POST /api/gematria/save
 * Requires JWT. Saves a gematria query to the authenticated user's profile.
 * Body: { text, system, total, notes? }
 */
router.post('/save', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { text, system, total, notes } = req.body as {
      text?: string;
      system?: GematriaSystem;
      total?: number;
      notes?: string;
    };

    if (!text || typeof text !== 'string' || !text.trim()) {
      res.status(400).json({ message: 'text is required' });
      return;
    }

    if (!system || !VALID_SYSTEMS.includes(system)) {
      res.status(400).json({
        message: `system must be one of: ${VALID_SYSTEMS.join(', ')}`,
      });
      return;
    }

    if (typeof total !== 'number' || !Number.isFinite(total)) {
      res.status(400).json({ message: 'total must be a finite number' });
      return;
    }

    const query = await GematriaQuery.create({
      userId: req.userId,
      text: text.trim(),
      system,
      total,
      notes: notes ?? '',
    });

    res.status(201).json({
      message: 'Query saved',
      query: {
        _id: query._id,
        userId: query.userId,
        text: query.text,
        system: query.system,
        total: query.total,
        notes: query.notes,
        createdAt: query.createdAt,
      },
    });
  } catch (error) {
    console.error('Gematria save error:', error);
    res.status(500).json({ message: 'Server error while saving query' });
  }
});

export default router;
