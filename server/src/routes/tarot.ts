import { Router, Response } from 'express';
import TarotReading, { SpreadType } from '../models/TarotReading';
import { AuthRequest, protect } from '../middleware/auth';

const router = Router();

const VALID_SPREADS: SpreadType[] = ['single', 'three', 'celtic'];

/**
 * POST /api/tarot/save
 * Requires JWT. Saves a reading to the authenticated user's profile history.
 * Body: { spreadType, cardsDrawn, userNotes? }
 */
router.post('/save', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { spreadType, cardsDrawn, userNotes } = req.body as {
      spreadType?: SpreadType;
      cardsDrawn?: Array<{
        cardId: string;
        isReversed: boolean;
        position: string;
      }>;
      userNotes?: string;
    };

    if (!spreadType || !VALID_SPREADS.includes(spreadType)) {
      res.status(400).json({
        message: 'spreadType must be one of: single, three, celtic',
      });
      return;
    }

    if (!Array.isArray(cardsDrawn) || cardsDrawn.length === 0) {
      res.status(400).json({ message: 'cardsDrawn must be a non-empty array' });
      return;
    }

    for (const card of cardsDrawn) {
      if (
        !card.cardId ||
        typeof card.isReversed !== 'boolean' ||
        !card.position
      ) {
        res.status(400).json({
          message:
            'Each card requires cardId (string), isReversed (boolean), and position (string)',
        });
        return;
      }
    }

    const reading = await TarotReading.create({
      userId: req.userId,
      date: new Date(),
      spreadType,
      cardsDrawn,
      userNotes: userNotes ?? '',
    });

    res.status(201).json({
      message: 'Reading saved',
      reading: {
        _id: reading._id,
        userId: reading.userId,
        date: reading.date,
        spreadType: reading.spreadType,
        cardsDrawn: reading.cardsDrawn,
        userNotes: reading.userNotes,
      },
    });
  } catch (error) {
    console.error('Tarot save error:', error);
    res.status(500).json({ message: 'Server error while saving reading' });
  }
});

/**
 * GET /api/tarot/history
 * Requires JWT. Returns the authenticated user's recent readings (newest first).
 */
router.get('/history', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const readings = await TarotReading.find({ userId: req.userId })
      .sort({ date: -1 })
      .limit(20)
      .lean();

    res.json({
      readings: readings.map((r) => ({
        _id: r._id,
        date: r.date,
        spreadType: r.spreadType,
        cardsDrawn: r.cardsDrawn,
        userNotes: r.userNotes,
      })),
    });
  } catch (error) {
    console.error('Tarot history error:', error);
    res.status(500).json({ message: 'Server error while loading reading history' });
  }
});

export default router;
