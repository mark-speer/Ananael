import { Router, Response } from 'express';
import JournalEntry from '../models/JournalEntry';
import { AuthRequest, protect } from '../middleware/auth';

type CastMode = 'single' | 'three' | 'pendulum';

const LOT_IDS = new Set([
  'assent',
  'decline',
  'delay',
  'hidden',
  'ally',
  'warning',
  'path',
  'return',
]);

const MODE_LABELS: Record<CastMode, string> = {
  single: 'Single lot',
  three: 'Three lots',
  pendulum: 'Pendulum',
};

const MODE_POSITIONS: Record<Exclude<CastMode, 'pendulum'>, string[]> = {
  single: ['Guidance'],
  three: ['Situation', 'Obstacle', 'Counsel'],
};

interface LotDraw {
  lotId: string;
  name: string;
  position: string;
}

function isCastMode(value: unknown): value is CastMode {
  return value === 'single' || value === 'three' || value === 'pendulum';
}

const router = Router();

/**
 * POST /api/shamanism/save
 * Requires JWT. Saves a cleromancy / pendulum log as a Magical Journal entry.
 */
router.post(
  '/save',
  protect,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { mode, lotsDrawn, pendulum, userNotes, occurredAt, sky } =
        req.body as {
          mode?: CastMode;
          lotsDrawn?: LotDraw[];
          pendulum?: 'yes' | 'maybe' | 'no';
          userNotes?: string;
          occurredAt?: string;
          sky?: Record<string, unknown>;
        };

      if (!isCastMode(mode)) {
        res.status(400).json({
          message: 'mode must be one of: single, three, pendulum',
        });
        return;
      }

      let when = new Date();
      if (occurredAt) {
        const parsed = new Date(occurredAt);
        if (!Number.isNaN(parsed.getTime())) when = parsed;
      }

      if (mode === 'pendulum') {
        if (pendulum !== 'yes' && pendulum !== 'maybe' && pendulum !== 'no') {
          res.status(400).json({ message: 'pendulum must be yes, maybe, or no' });
          return;
        }
        const entry = await JournalEntry.create({
          userId: req.userId,
          entryType: 'divination',
          occurredAt: when,
          title: `Shamanism · Pendulum · ${pendulum}`,
          body: typeof userNotes === 'string' ? userNotes : '',
          tags: ['shamanism', 'pendulum', pendulum],
          entities: [],
          sky: sky && typeof sky === 'object' ? sky : undefined,
          payload: {
            system: 'shamanic-cast',
            mode,
            pendulum,
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
        return;
      }

      const expectedPositions = MODE_POSITIONS[mode];
      if (
        !Array.isArray(lotsDrawn) ||
        lotsDrawn.length !== expectedPositions.length
      ) {
        res.status(400).json({
          message: `${mode} casts require ${expectedPositions.length} lot${
            expectedPositions.length === 1 ? '' : 's'
          }`,
        });
        return;
      }

      const lotIds = new Set<string>();
      for (let index = 0; index < lotsDrawn.length; index += 1) {
        const draw = lotsDrawn[index];
        if (
          !draw ||
          !LOT_IDS.has(draw.lotId) ||
          typeof draw.name !== 'string' ||
          !draw.name.trim() ||
          draw.position !== expectedPositions[index] ||
          lotIds.has(draw.lotId)
        ) {
          res.status(400).json({
            message:
              'Each lot must be valid, unique, and assigned to the expected cast position',
          });
          return;
        }
        lotIds.add(draw.lotId);
      }

      const normalized = lotsDrawn.map((draw) => ({
        lotId: draw.lotId,
        name: draw.name.trim().slice(0, 100),
        position: draw.position,
      }));

      const entry = await JournalEntry.create({
        userId: req.userId,
        entryType: 'divination',
        occurredAt: when,
        title: `Shamanism · ${MODE_LABELS[mode]}`,
        body: typeof userNotes === 'string' ? userNotes : '',
        tags: ['shamanism', 'lots', mode],
        entities: normalized.map((draw) => ({
          kind: 'other' as const,
          id: draw.lotId,
          label: draw.name,
        })),
        sky: sky && typeof sky === 'object' ? sky : undefined,
        payload: {
          system: 'shamanic-cast',
          mode,
          lotsDrawn: normalized,
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
      console.error('Shamanism save error:', error);
      res.status(500).json({ message: 'Server error while saving cast' });
    }
  }
);

export default router;
