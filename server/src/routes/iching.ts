import { Router, Response } from 'express';
import IChingCast, { IChingMethod } from '../models/IChingCast';
import { AuthRequest, protect } from '../middleware/auth';

const router = Router();

const VALID_METHODS: IChingMethod[] = ['coins', 'yarrow'];
const VALID_LINES = new Set([6, 7, 8, 9]);

function isValidHexNumber(n: unknown): n is number {
  return typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= 64;
}

/**
 * POST /api/iching/save
 * Requires JWT. Saves a cast to the authenticated user's profile history.
 * Body: { method, lines, primaryNumber, relatingNumber?, changingLines, userNotes? }
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
    } = req.body as {
      method?: IChingMethod;
      lines?: number[];
      primaryNumber?: number;
      relatingNumber?: number | null;
      changingLines?: number[];
      userNotes?: string;
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

    const cast = await IChingCast.create({
      userId: req.userId,
      date: new Date(),
      method,
      lines,
      primaryNumber,
      relatingNumber: relating,
      changingLines,
      userNotes: userNotes ?? '',
    });

    res.status(201).json({
      message: 'Cast saved',
      cast: {
        _id: cast._id,
        userId: cast.userId,
        date: cast.date,
        method: cast.method,
        lines: cast.lines,
        primaryNumber: cast.primaryNumber,
        relatingNumber: cast.relatingNumber,
        changingLines: cast.changingLines,
        userNotes: cast.userNotes,
      },
    });
  } catch (error) {
    console.error('I Ching save error:', error);
    res.status(500).json({ message: 'Server error while saving cast' });
  }
});

/**
 * GET /api/iching/history
 * Requires JWT. Returns the authenticated user's recent casts (newest first).
 */
router.get('/history', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const casts = await IChingCast.find({ userId: req.userId })
      .sort({ date: -1 })
      .limit(20)
      .lean();

    res.json({
      casts: casts.map((c) => ({
        _id: c._id,
        date: c.date,
        method: c.method,
        lines: c.lines,
        primaryNumber: c.primaryNumber,
        relatingNumber: c.relatingNumber ?? null,
        changingLines: c.changingLines,
        userNotes: c.userNotes,
      })),
    });
  } catch (error) {
    console.error('I Ching history error:', error);
    res.status(500).json({ message: 'Server error while loading cast history' });
  }
});

export default router;
