import { Router, Response } from 'express';
import JournalEntry from '../models/JournalEntry';
import { AuthRequest, protect } from '../middleware/auth';
import type { IChingMethod } from '../models/IChingCast';

const router = Router();

const VALID_METHODS: IChingMethod[] = ['coins', 'yarrow'];
const VALID_LINES = new Set([6, 7, 8, 9]);

function isValidHexNumber(n: unknown): n is number {
  return typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= 64;
}

/**
 * POST /api/iching/save
 * Requires JWT. Saves a cast as a Magical Journal divination entry.
 */
router.post('/save', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      method,
      lines,
      primaryNumber,
      relatingNumber,
      changingLines,
      userNotes,
      occurredAt,
      sky,
      tags,
      entities,
    } = req.body as {
      method?: IChingMethod;
      lines?: number[];
      primaryNumber?: number;
      relatingNumber?: number | null;
      changingLines?: number[];
      userNotes?: string;
      occurredAt?: string;
      sky?: Record<string, unknown>;
      tags?: string[];
      entities?: Array<{ kind: string; id: string; label: string }>;
    };

    if (!method || !VALID_METHODS.includes(method)) {
      res.status(400).json({
        message: 'method must be one of: coins, yarrow',
      });
      return;
    }

    if (
      !Array.isArray(lines) ||
      lines.length !== 6 ||
      !lines.every((n) => VALID_LINES.has(n))
    ) {
      res.status(400).json({
        message: 'lines must be an array of six values from {6,7,8,9}',
      });
      return;
    }

    if (!isValidHexNumber(primaryNumber)) {
      res.status(400).json({
        message: 'primaryNumber must be an integer from 1 to 64',
      });
      return;
    }

    const relating =
      relatingNumber === null || relatingNumber === undefined
        ? null
        : relatingNumber;
    if (relating !== null && !isValidHexNumber(relating)) {
      res.status(400).json({
        message: 'relatingNumber must be null or an integer from 1 to 64',
      });
      return;
    }

    if (
      !Array.isArray(changingLines) ||
      !changingLines.every(
        (n) => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= 5
      )
    ) {
      res.status(400).json({
        message: 'changingLines must be an array of integers from 0 to 5',
      });
      return;
    }

    let when = new Date();
    if (occurredAt) {
      const d = new Date(occurredAt);
      if (!Number.isNaN(d.getTime())) when = d;
    }

    const hexEntities = [
      {
        kind: 'hexagram' as const,
        id: String(primaryNumber),
        label: `Hexagram ${primaryNumber}`,
      },
    ];
    if (relating != null) {
      hexEntities.push({
        kind: 'hexagram' as const,
        id: String(relating),
        label: `Hexagram ${relating}`,
      });
    }

    const entry = await JournalEntry.create({
      userId: req.userId,
      entryType: 'divination',
      occurredAt: when,
      title: `I Ching · Hexagram ${primaryNumber}`,
      body: userNotes ?? '',
      tags: [
        'iching',
        method,
        ...(Array.isArray(tags)
          ? tags.map((t) => String(t).toLowerCase())
          : []),
      ],
      entities: [
        ...hexEntities,
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
        system: 'iching',
        method,
        lines,
        primaryNumber,
        relatingNumber: relating,
        changingLines,
      },
    });

    res.status(201).json({
      message: 'Cast saved to journal',
      entry: {
        _id: entry._id,
        entryType: entry.entryType,
        occurredAt: entry.occurredAt,
        title: entry.title,
        body: entry.body,
        payload: entry.payload,
      },
      /** @deprecated legacy shape for older clients */
      cast: {
        _id: entry._id,
        userId: entry.userId,
        date: entry.occurredAt,
        method,
        lines,
        primaryNumber,
        relatingNumber: relating,
        changingLines,
        userNotes: entry.body,
      },
    });
  } catch (error) {
    console.error('I Ching save error:', error);
    res.status(500).json({ message: 'Server error while saving cast' });
  }
});

/**
 * GET /api/iching/history
 * Requires JWT. Returns recent I Ching journal entries (newest first).
 */
router.get('/history', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const entries = await JournalEntry.find({
      userId: req.userId,
      entryType: 'divination',
      'payload.system': 'iching',
    })
      .sort({ occurredAt: -1 })
      .limit(20)
      .lean();

    res.json({
      casts: entries.map((e) => {
        const payload = (e.payload ?? {}) as {
          method?: IChingMethod;
          lines?: number[];
          primaryNumber?: number;
          relatingNumber?: number | null;
          changingLines?: number[];
        };
        return {
          _id: e._id,
          date: e.occurredAt,
          method: payload.method ?? 'coins',
          lines: payload.lines ?? [],
          primaryNumber: payload.primaryNumber ?? 1,
          relatingNumber: payload.relatingNumber ?? null,
          changingLines: payload.changingLines ?? [],
          userNotes: e.body,
        };
      }),
    });
  } catch (error) {
    console.error('I Ching history error:', error);
    res.status(500).json({ message: 'Server error while loading cast history' });
  }
});

export default router;
