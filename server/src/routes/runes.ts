import { Router, Response } from 'express';
import JournalEntry from '../models/JournalEntry';
import { AuthRequest, protect } from '../middleware/auth';

type CastMode = 'single' | 'norn' | 'cross';

interface RuneDraw {
  runeId: string;
  name: string;
  isReversed: boolean;
  position: string;
}

const router = Router();

const MODE_LABELS: Record<CastMode, string> = {
  single: 'Single Rune',
  norn: 'Norn Cast',
  cross: 'Rune Cross',
};

const MODE_POSITIONS: Record<CastMode, string[]> = {
  single: ['Guidance'],
  norn: ['Past', 'Present', 'Future'],
  cross: ['Overview', 'Challenge', 'Counsel', 'Foundation', 'Outcome'],
};

const RUNE_IDS = new Set([
  'fehu',
  'uruz',
  'thurisaz',
  'ansuz',
  'raidho',
  'kenaz',
  'gebo',
  'wunjo',
  'hagalaz',
  'nauthiz',
  'isa',
  'jera',
  'eihwaz',
  'perthro',
  'algiz',
  'sowilo',
  'tiwaz',
  'berkano',
  'ehwaz',
  'mannaz',
  'laguz',
  'ingwaz',
  'dagaz',
  'othala',
]);

function isCastMode(value: unknown): value is CastMode {
  return value === 'single' || value === 'norn' || value === 'cross';
}

/**
 * POST /api/runes/save
 * Requires JWT. Saves an Elder Futhark cast as a Magical Journal entry.
 */
router.post(
  '/save',
  protect,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { mode, runesDrawn, userNotes, occurredAt, sky } = req.body as {
        mode?: CastMode;
        runesDrawn?: RuneDraw[];
        userNotes?: string;
        occurredAt?: string;
        sky?: Record<string, unknown>;
      };

      if (!isCastMode(mode)) {
        res.status(400).json({
          message: 'mode must be one of: single, norn, cross',
        });
        return;
      }

      const expectedPositions = MODE_POSITIONS[mode];
      if (
        !Array.isArray(runesDrawn) ||
        runesDrawn.length !== expectedPositions.length
      ) {
        res.status(400).json({
          message: `${mode} casts require ${expectedPositions.length} rune${
            expectedPositions.length === 1 ? '' : 's'
          }`,
        });
        return;
      }

      const runeIds = new Set<string>();
      for (let index = 0; index < runesDrawn.length; index += 1) {
        const draw = runesDrawn[index];
        if (
          !draw ||
          !RUNE_IDS.has(draw.runeId) ||
          typeof draw.name !== 'string' ||
          !draw.name.trim() ||
          typeof draw.isReversed !== 'boolean' ||
          draw.position !== expectedPositions[index] ||
          runeIds.has(draw.runeId)
        ) {
          res.status(400).json({
            message:
              'Each rune must be valid, unique, and assigned to the expected cast position',
          });
          return;
        }
        runeIds.add(draw.runeId);
      }

      let when = new Date();
      if (occurredAt) {
        const parsed = new Date(occurredAt);
        if (!Number.isNaN(parsed.getTime())) when = parsed;
      }

      const normalizedRunes = runesDrawn.map((draw) => ({
        runeId: draw.runeId,
        name: draw.name.trim().slice(0, 100),
        isReversed: draw.isReversed,
        position: draw.position,
      }));

      const entry = await JournalEntry.create({
        userId: req.userId,
        entryType: 'divination',
        occurredAt: when,
        title: `Runes · ${MODE_LABELS[mode]}`,
        body: typeof userNotes === 'string' ? userNotes : '',
        tags: ['runes', mode],
        entities: normalizedRunes.map((draw) => ({
          kind: 'other' as const,
          id: draw.runeId,
          label: draw.name,
        })),
        sky: sky && typeof sky === 'object' ? sky : undefined,
        payload: {
          system: 'runes',
          mode,
          runesDrawn: normalizedRunes,
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
      });
    } catch (error) {
      console.error('Runes save error:', error);
      res.status(500).json({ message: 'Server error while saving cast' });
    }
  }
);

export default router;
