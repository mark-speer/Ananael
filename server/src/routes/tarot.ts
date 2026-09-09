import { Router, Response } from 'express';
import JournalEntry from '../models/JournalEntry';
import { AuthRequest, protect } from '../middleware/auth';
import type { SpreadType } from '../models/TarotReading';

const router = Router();

const VALID_SPREADS: SpreadType[] = ['single', 'three', 'celtic', 'horseshoe', 'pyramid', 'wheel', 'diamond'];

const SPREAD_LABELS: Record<SpreadType, string> = {
  single: 'Single Card',
  three: 'Three-Card',
  celtic: 'Celtic Cross',
  horseshoe: 'Horseshoe',
  pyramid: 'Pyramid',
  wheel: 'Wheel of Year',
  diamond: 'Diamond',
};

const SUMMARY_MAX_LEN = 8000;

/**
 * POST /api/tarot/save
 * Requires JWT. Saves a reading as a Magical Journal divination entry.
 * Body: { spreadType, cardsDrawn, userNotes?, occurredAt?, sky?, tags?, entities?, summary? }
 */
router.post('/save', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      spreadType,
      cardsDrawn,
      userNotes,
      occurredAt,
      sky,
      tags,
      entities,
      summary,
    } = req.body as {
        spreadType?: SpreadType;
        cardsDrawn?: Array<{
          cardId: string;
          isReversed: boolean;
          position: string;
        }>;
        userNotes?: string;
        occurredAt?: string;
        sky?: Record<string, unknown>;
        tags?: string[];
        entities?: Array<{ kind: string; id: string; label: string }>;
        summary?: string;
      };

    if (!spreadType || !VALID_SPREADS.includes(spreadType)) {
      res.status(400).json({
        message: 'spreadType must be one of: single, three, celtic, horseshoe, pyramid, wheel, diamond',
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

    let when = new Date();
    if (occurredAt) {
      const d = new Date(occurredAt);
      if (!Number.isNaN(d.getTime())) when = d;
    }

    const cardEntities = cardsDrawn.map((c) => ({
      kind: 'tarot' as const,
      id: c.cardId,
      label: c.cardId,
    }));

    const entry = await JournalEntry.create({
      userId: req.userId,
      entryType: 'divination',
      occurredAt: when,
      title: `Tarot · ${SPREAD_LABELS[spreadType]}`,
      body: userNotes ?? '',
      tags: [
        'tarot',
        spreadType,
        ...(Array.isArray(tags)
          ? tags.map((t) => String(t).toLowerCase())
          : []),
      ],
      entities: [
        ...cardEntities,
        ...(Array.isArray(entities)
          ? entities.filter(
              (e) =>
                e &&
                typeof e.kind === 'string' &&
                typeof e.id === 'string' &&
                typeof e.label === 'string'
            )
          : []),
      ],
      sky: sky && typeof sky === 'object' ? sky : undefined,
      payload: {
        system: 'tarot',
        spreadType,
        cardsDrawn,
        ...(typeof summary === 'string' && summary.trim()
          ? { summary: summary.trim().slice(0, SUMMARY_MAX_LEN) }
          : {}),
      },
    });

    res.status(201).json({
      message: 'Reading saved to journal',
      entry: {
        _id: entry._id,
        entryType: entry.entryType,
        occurredAt: entry.occurredAt,
        title: entry.title,
        body: entry.body,
        payload: entry.payload,
      },
      /** @deprecated legacy shape for older clients */
      reading: {
        _id: entry._id,
        userId: entry.userId,
        date: entry.occurredAt,
        spreadType,
        cardsDrawn,
        userNotes: entry.body,
      },
    });
  } catch (error) {
    console.error('Tarot save error:', error);
    res.status(500).json({ message: 'Server error while saving reading' });
  }
});

/**
 * GET /api/tarot/history
 * Requires JWT. Returns recent tarot journal entries (newest first).
 */
router.get('/history', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const entries = await JournalEntry.find({
      userId: req.userId,
      entryType: 'divination',
      'payload.system': 'tarot',
    })
      .sort({ occurredAt: -1 })
      .limit(50)
      .lean();

    res.json({
      readings: entries.map((e) => {
        const payload = (e.payload ?? {}) as {
          spreadType?: SpreadType;
          cardsDrawn?: Array<{
            cardId: string;
            isReversed: boolean;
            position: string;
          }>;
        };
        return {
          _id: e._id,
          date: e.occurredAt,
          spreadType: payload.spreadType ?? 'single',
          cardsDrawn: payload.cardsDrawn ?? [],
          userNotes: e.body,
        };
      }),
    });
  } catch (error) {
    console.error('Tarot history error:', error);
    res.status(500).json({ message: 'Server error while loading reading history' });
  }
});

export default router;
