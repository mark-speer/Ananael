import { Router, Response } from 'express';
import JournalEntry, {
  ENTRY_TYPES,
  ENTITY_KINDS,
  type JournalEntryType,
  type JournalEntityKind,
  type WorkingStatus,
} from '../models/JournalEntry';
import { AuthRequest, protect } from '../middleware/auth';
import { migrateLegacyToJournal } from '../services/migrateJournal';

const router = Router();

const VALID_STATUS: WorkingStatus[] = ['active', 'paused', 'complete'];

function normalizeTags(tags: unknown): string[] {
  if (!Array.isArray(tags)) return [];
  return tags
    .filter((t): t is string => typeof t === 'string')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 40);
}

function normalizeEntities(entities: unknown) {
  if (!Array.isArray(entities)) return [];
  return entities
    .filter(
      (e): e is { kind: JournalEntityKind; id: string; label: string } =>
        e != null &&
        typeof e === 'object' &&
        typeof (e as { kind?: unknown }).kind === 'string' &&
        ENTITY_KINDS.includes((e as { kind: JournalEntityKind }).kind) &&
        typeof (e as { id?: unknown }).id === 'string' &&
        typeof (e as { label?: unknown }).label === 'string'
    )
    .map((e) => ({
      kind: e.kind,
      id: e.id.trim(),
      label: e.label.trim(),
    }))
    .filter((e) => e.id && e.label)
    .slice(0, 60);
}

function clampScale(n: unknown): number | null {
  if (n === null || n === undefined || n === '') return null;
  const v = Number(n);
  if (!Number.isFinite(v) || v < 1 || v > 5) return null;
  return Math.round(v);
}

function serializeEntry(e: {
  _id: unknown;
  userId: unknown;
  entryType: string;
  occurredAt: Date;
  title?: string;
  body?: string;
  mood?: number | null;
  energy?: number | null;
  status?: string | null;
  tags?: string[];
  entities?: unknown[];
  sky?: unknown;
  payload?: unknown;
  links?: unknown[];
  createdAt?: Date;
  updatedAt?: Date;
}) {
  return {
    _id: e._id,
    userId: e.userId,
    entryType: e.entryType,
    occurredAt: e.occurredAt,
    title: e.title ?? '',
    body: e.body ?? '',
    mood: e.mood ?? null,
    energy: e.energy ?? null,
    status: e.status ?? null,
    tags: e.tags ?? [],
    entities: e.entities ?? [],
    sky: e.sky ?? null,
    payload: e.payload ?? null,
    links: e.links ?? [],
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
  };
}

/**
 * POST /api/journal/migrate
 * Idempotent copy of legacy Tarot/I Ching history into journal for this user.
 */
router.post('/migrate', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await migrateLegacyToJournal(req.userId!);
    res.json({ message: 'Migration complete', ...result });
  } catch (error) {
    console.error('Journal migrate error:', error);
    res.status(500).json({ message: 'Server error while migrating journal' });
  }
});

/**
 * GET /api/journal/entries
 * Query: type, status, q, tag, entity, from, to, limit
 * Runs lazy legacy migration once per request (idempotent).
 */
router.get('/entries', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await migrateLegacyToJournal(req.userId!);

    const {
      type,
      status,
      q,
      tag,
      entity,
      from,
      to,
      limit: limitRaw,
    } = req.query as Record<string, string | undefined>;

    const filter: Record<string, unknown> = { userId: req.userId };

    if (type && ENTRY_TYPES.includes(type as JournalEntryType)) {
      filter.entryType = type;
    }

    if (status && VALID_STATUS.includes(status as WorkingStatus)) {
      filter.status = status;
    }

    if (tag && typeof tag === 'string' && tag.trim()) {
      filter.tags = tag.trim().toLowerCase();
    }

    if (entity && typeof entity === 'string' && entity.trim()) {
      const term = entity.trim();
      filter.$or = [
        { 'entities.id': { $regex: term, $options: 'i' } },
        { 'entities.label': { $regex: term, $options: 'i' } },
        { 'entities.kind': { $regex: term, $options: 'i' } },
      ];
    }

    if (from || to) {
      const occurredAt: Record<string, Date> = {};
      if (from) {
        const d = new Date(from);
        if (!Number.isNaN(d.getTime())) occurredAt.$gte = d;
      }
      if (to) {
        const d = new Date(to);
        if (!Number.isNaN(d.getTime())) occurredAt.$lte = d;
      }
      if (Object.keys(occurredAt).length) filter.occurredAt = occurredAt;
    }

    if (q && q.trim()) {
      filter.$text = { $search: q.trim() };
    }

    const limit = Math.min(
      Math.max(Number(limitRaw) || 50, 1),
      200
    );

    let query = JournalEntry.find(filter).sort({ occurredAt: -1 }).limit(limit);
    if (q && q.trim()) {
      query = query.select({ score: { $meta: 'textScore' } }).sort({
        score: { $meta: 'textScore' },
        occurredAt: -1,
      });
    }

    const entries = await query.lean();
    res.json({ entries: entries.map(serializeEntry) });
  } catch (error) {
    console.error('Journal list error:', error);
    res.status(500).json({ message: 'Server error while loading journal' });
  }
});

/**
 * POST /api/journal/entries
 */
router.post('/entries', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      entryType,
      occurredAt,
      title,
      body,
      mood,
      energy,
      status,
      tags,
      entities,
      sky,
      payload,
      links,
    } = req.body as Record<string, unknown>;

    if (
      !entryType ||
      typeof entryType !== 'string' ||
      !ENTRY_TYPES.includes(entryType as JournalEntryType)
    ) {
      res.status(400).json({
        message: `entryType must be one of: ${ENTRY_TYPES.join(', ')}`,
      });
      return;
    }

    let when = new Date();
    if (occurredAt) {
      const d = new Date(occurredAt as string);
      if (Number.isNaN(d.getTime())) {
        res.status(400).json({ message: 'occurredAt must be a valid date' });
        return;
      }
      when = d;
    }

    let workingStatus: WorkingStatus | null = null;
    if (entryType === 'working') {
      if (
        status &&
        typeof status === 'string' &&
        VALID_STATUS.includes(status as WorkingStatus)
      ) {
        workingStatus = status as WorkingStatus;
      } else {
        workingStatus = 'active';
      }
    }

    const entry = await JournalEntry.create({
      userId: req.userId,
      entryType,
      occurredAt: when,
      title: typeof title === 'string' ? title.slice(0, 200) : '',
      body: typeof body === 'string' ? body.slice(0, 20000) : '',
      mood: clampScale(mood),
      energy: clampScale(energy),
      ...(workingStatus ? { status: workingStatus } : {}),
      tags: normalizeTags(tags),
      entities: normalizeEntities(entities),
      sky: sky && typeof sky === 'object' ? sky : undefined,
      payload: payload && typeof payload === 'object' ? payload : undefined,
      links: Array.isArray(links) ? links : [],
    });

    res.status(201).json({
      message: 'Entry saved',
      entry: serializeEntry(entry.toObject()),
    });
  } catch (error) {
    console.error('Journal create error:', error);
    res.status(500).json({ message: 'Server error while saving journal entry' });
  }
});

/**
 * GET /api/journal/entries/:id
 */
router.get('/entries/:id', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const entry = await JournalEntry.findOne({
      _id: req.params.id,
      userId: req.userId,
    }).lean();

    if (!entry) {
      res.status(404).json({ message: 'Entry not found' });
      return;
    }

    res.json({ entry: serializeEntry(entry) });
  } catch (error) {
    console.error('Journal get error:', error);
    res.status(500).json({ message: 'Server error while loading entry' });
  }
});

/**
 * PATCH /api/journal/entries/:id
 */
router.patch('/entries/:id', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const entry = await JournalEntry.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!entry) {
      res.status(404).json({ message: 'Entry not found' });
      return;
    }

    const {
      entryType,
      occurredAt,
      title,
      body,
      mood,
      energy,
      status,
      tags,
      entities,
      sky,
      payload,
    } = req.body as Record<string, unknown>;

    if (
      entryType !== undefined &&
      typeof entryType === 'string' &&
      ENTRY_TYPES.includes(entryType as JournalEntryType)
    ) {
      entry.entryType = entryType as JournalEntryType;
    }

    if (occurredAt !== undefined) {
      const d = new Date(occurredAt as string);
      if (Number.isNaN(d.getTime())) {
        res.status(400).json({ message: 'occurredAt must be a valid date' });
        return;
      }
      entry.occurredAt = d;
    }

    if (typeof title === 'string') entry.title = title.slice(0, 200);
    if (typeof body === 'string') entry.body = body.slice(0, 20000);
    if (mood !== undefined) entry.mood = clampScale(mood);
    if (energy !== undefined) entry.energy = clampScale(energy);

    if (entry.entryType === 'working') {
      if (
        status &&
        typeof status === 'string' &&
        VALID_STATUS.includes(status as WorkingStatus)
      ) {
        entry.status = status as WorkingStatus;
      }
    } else if (status === null) {
      entry.status = null;
    }

    if (tags !== undefined) entry.tags = normalizeTags(tags);
    if (entities !== undefined) entry.entities = normalizeEntities(entities);
    if (sky !== undefined && sky && typeof sky === 'object') {
      entry.sky = sky as typeof entry.sky;
    }
    if (payload !== undefined && payload && typeof payload === 'object') {
      entry.payload = payload as Record<string, unknown>;
    }

    await entry.save();
    res.json({ message: 'Entry updated', entry: serializeEntry(entry.toObject()) });
  } catch (error) {
    console.error('Journal patch error:', error);
    res.status(500).json({ message: 'Server error while updating entry' });
  }
});

/**
 * DELETE /api/journal/entries/:id
 */
router.delete('/entries/:id', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await JournalEntry.deleteOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (result.deletedCount === 0) {
      res.status(404).json({ message: 'Entry not found' });
      return;
    }

    res.json({ message: 'Entry deleted' });
  } catch (error) {
    console.error('Journal delete error:', error);
    res.status(500).json({ message: 'Server error while deleting entry' });
  }
});

export default router;
