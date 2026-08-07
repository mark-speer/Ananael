import { Router, Response } from 'express';
import JournalEntry from '../models/JournalEntry';
import { AuthRequest, protect } from '../middleware/auth';

const router = Router();
const FIGURE_NAMES = {
  via: 'Via',
  populus: 'Populus',
  conjunctio: 'Conjunctio',
  carcer: 'Carcer',
  'fortuna-major': 'Fortuna Major',
  'fortuna-minor': 'Fortuna Minor',
  acquisitio: 'Acquisitio',
  amissio: 'Amissio',
  laetitia: 'Laetitia',
  tristitia: 'Tristitia',
  albus: 'Albus',
  rubeus: 'Rubeus',
  puer: 'Puer',
  puella: 'Puella',
  'caput-draconis': 'Caput Draconis',
  'cauda-draconis': 'Cauda Draconis',
} as const;
type FigureId = keyof typeof FIGURE_NAMES;
const VALID_FIGURES = new Set<string>(Object.keys(FIGURE_NAMES));

function isFigureId(value: unknown): value is FigureId {
  return typeof value === 'string' && VALID_FIGURES.has(value);
}

function isFigureArray(value: unknown, length: number): value is FigureId[] {
  return Array.isArray(value) && value.length === length && value.every(isFigureId);
}

router.post('/save', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      mothers, daughters, nephews, witnesses, judge, reconciler, houseFigures,
      userNotes, occurredAt, sky, tags,
    } = req.body as {
      mothers?: unknown;
      daughters?: unknown;
      nephews?: unknown;
      witnesses?: unknown;
      judge?: unknown;
      reconciler?: unknown;
      houseFigures?: unknown;
      userNotes?: string;
      occurredAt?: string;
      sky?: Record<string, unknown>;
      tags?: string[];
    };

    if (
      !isFigureArray(mothers, 4) ||
      !isFigureArray(daughters, 4) ||
      !isFigureArray(nephews, 4) ||
      !isFigureArray(witnesses, 2) ||
      !isFigureId(judge) ||
      (reconciler != null && !isFigureId(reconciler)) ||
      !isFigureArray(houseFigures, 12)
    ) {
      res.status(400).json({ message: 'Invalid geomantic shield chart' });
      return;
    }

    let when = new Date();
    if (occurredAt) {
      const parsed = new Date(occurredAt);
      if (!Number.isNaN(parsed.getTime())) when = parsed;
    }

    const entry = await JournalEntry.create({
      userId: req.userId,
      entryType: 'divination',
      occurredAt: when,
      title: `Geomancy — Judge: ${FIGURE_NAMES[judge]}`,
      body: typeof userNotes === 'string' ? userNotes : '',
      tags: [
        'geomancy',
        ...(Array.isArray(tags) ? tags.map((tag) => String(tag).toLowerCase()) : []),
      ],
      entities: [judge, ...mothers].map((id) => ({
        kind: 'other' as const,
        id,
        label: FIGURE_NAMES[id],
      })),
      sky: sky && typeof sky === 'object' ? sky : undefined,
      payload: {
        system: 'geomancy',
        mothers,
        daughters,
        nephews,
        witnesses,
        judge,
        ...(reconciler ? { reconciler } : {}),
        houseFigures,
      },
    });

    res.status(201).json({
      message: 'Geomantic chart saved to journal',
      entry: {
        _id: entry._id,
        entryType: entry.entryType,
        occurredAt: entry.occurredAt,
        title: entry.title,
        body: entry.body,
        payload: entry.payload,
      },
    });
  } catch (error) {
    console.error('Geomancy save error:', error);
    res.status(500).json({ message: 'Server error while saving geomantic chart' });
  }
});

export default router;
