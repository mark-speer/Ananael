import { Router, Response } from 'express';
import JournalEntry, {
  ENTRY_TYPES,
  ENTITY_KINDS,
  type JournalEntryType,
  type JournalEntityKind,
  type WorkingStatus,
} from '../models/JournalEntry';
import JournalSyncOp from '../models/JournalSyncOp';
import { AuthRequest, protect } from '../middleware/auth';
import { migrateLegacyToJournal } from '../services/migrateJournal';
import { validateSyncOperations } from '../lib/journalSyncValidation';

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
  version?: number;
  syncedAt?: Date | null;
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
    version: e.version ?? 1,
    syncedAt: e.syncedAt ?? null,
  };
}

type BuildResult<T> =
  | { ok: true; value: T }
  | { ok: false; status: number; message: string };

/**
 * Validates + normalizes a full-entry payload for creation.
 * Shared by POST /entries and the 'create' operation in POST /sync so both
 * paths apply identical field rules.
 */
function buildJournalCreateDoc(
  raw: Record<string, unknown>
): BuildResult<Record<string, unknown>> {
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
  } = raw;

  if (
    !entryType ||
    typeof entryType !== 'string' ||
    !ENTRY_TYPES.includes(entryType as JournalEntryType)
  ) {
    return {
      ok: false,
      status: 400,
      message: `entryType must be one of: ${ENTRY_TYPES.join(', ')}`,
    };
  }

  let when = new Date();
  if (occurredAt) {
    const d = new Date(occurredAt as string);
    if (Number.isNaN(d.getTime())) {
      return { ok: false, status: 400, message: 'occurredAt must be a valid date' };
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

  return {
    ok: true,
    value: {
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
    },
  };
}

/**
 * Validates + normalizes a partial-entry patch for an existing entry.
 * Shared by PATCH /entries/:id and the 'update' operation in POST /sync.
 * Only fields present in `raw` are included in the returned $set.
 */
function buildJournalUpdateSet(
  currentEntryType: JournalEntryType,
  raw: Record<string, unknown>
): BuildResult<Record<string, unknown>> {
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
  } = raw;

  const updates: Record<string, unknown> = {};

  if (
    entryType !== undefined &&
    typeof entryType === 'string' &&
    ENTRY_TYPES.includes(entryType as JournalEntryType)
  ) {
    updates.entryType = entryType as JournalEntryType;
  }

  if (occurredAt !== undefined) {
    const d = new Date(occurredAt as string);
    if (Number.isNaN(d.getTime())) {
      return { ok: false, status: 400, message: 'occurredAt must be a valid date' };
    }
    updates.occurredAt = d;
  }

  if (typeof title === 'string') updates.title = title.slice(0, 200);
  if (typeof body === 'string') updates.body = body.slice(0, 20000);
  if (mood !== undefined) updates.mood = clampScale(mood);
  if (energy !== undefined) updates.energy = clampScale(energy);

  const nextEntryType = (updates.entryType ?? currentEntryType) as JournalEntryType;
  if (nextEntryType === 'working') {
    if (
      status &&
      typeof status === 'string' &&
      VALID_STATUS.includes(status as WorkingStatus)
    ) {
      updates.status = status as WorkingStatus;
    }
  } else if (status === null) {
    updates.status = null;
  }

  if (tags !== undefined) updates.tags = normalizeTags(tags);
  if (entities !== undefined) updates.entities = normalizeEntities(entities);
  if (sky !== undefined && sky && typeof sky === 'object') {
    updates.sky = sky;
  }
  if (payload !== undefined && payload && typeof payload === 'object') {
    updates.payload = payload;
  }

  return { ok: true, value: updates };
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
    const built = buildJournalCreateDoc(req.body as Record<string, unknown>);
    if (!built.ok) {
      res.status(built.status).json({ message: built.message });
      return;
    }

    const entry = await JournalEntry.create({
      userId: req.userId,
      ...built.value,
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
    }).lean();

    if (!entry) {
      res.status(404).json({ message: 'Entry not found' });
      return;
    }

    const expectedVersion = Number((req.body as Record<string, unknown>).version);
    if (!Number.isInteger(expectedVersion) || expectedVersion < 1) {
      res.status(400).json({ message: 'version must be a positive integer' });
      return;
    }
    if (expectedVersion !== (entry.version ?? 1)) {
      res.status(409).json({
        message: 'Entry changed on the server; reload before editing again',
        entry: serializeEntry(entry),
      });
      return;
    }

    const built = buildJournalUpdateSet(
      entry.entryType,
      req.body as Record<string, unknown>
    );
    if (!built.ok) {
      res.status(built.status).json({ message: built.message });
      return;
    }
    const updates = built.value;

    const updated = await JournalEntry.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId, version: expectedVersion },
      { $set: { ...updates, syncedAt: new Date() }, $inc: { version: 1 } },
      { new: true, runValidators: true }
    ).lean();
    if (!updated) {
      const current = await JournalEntry.findOne({
        _id: req.params.id,
        userId: req.userId,
      }).lean();
      res.status(409).json({
        message: 'Entry changed on the server; reload before editing again',
        entry: current ? serializeEntry(current) : null,
      });
      return;
    }
    res.json({ message: 'Entry updated', entry: serializeEntry(updated) });
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

/**
 * POST /api/journal/sync
 *
 * Bounded, authenticated batch endpoint for offline-queued journal mutations.
 * Accepts up to `MAX_SYNC_OPERATIONS` create/update/delete operations per
 * request. Every operation carries a client-minted `clientOpId`; replaying a
 * batch (e.g. after a dropped response) is safe because a previously applied
 * `clientOpId` returns its cached outcome instead of re-applying the
 * mutation (idempotent-safe).
 *
 * Conflicts (a stale `baseVersion` on update, or a version mismatch on a
 * version-guarded delete) never abort the batch — the server always wins and
 * reports the current entry inline for that operation so the client can
 * discard its local change and adopt the server's copy. One op failing does
 * not affect the others; the response is always 200 with a per-operation
 * status, unless the request shape itself is invalid (400).
 */
router.post('/sync', protect, async (req: AuthRequest, res: Response): Promise<void> => {
  const validation = validateSyncOperations(req.body);
  if (!validation.ok) {
    res.status(400).json({ message: validation.message });
    return;
  }

  const userId = req.userId!;
  const results: Array<Record<string, unknown>> = [];

  for (const op of validation.operations) {
    try {
      const existing = await JournalSyncOp.findOne({
        userId,
        clientOpId: op.clientOpId,
      }).lean();

      if (existing) {
        results.push({
          clientOpId: op.clientOpId,
          type: op.type,
          ...existing.result,
          replayed: true,
        });
        continue;
      }

      let outcome: Record<string, unknown>;

      if (op.type === 'create') {
        const built = buildJournalCreateDoc(op.entry ?? {});
        if (!built.ok) {
          outcome = { status: 'error', message: built.message };
        } else {
          const created = await JournalEntry.create({
            userId,
            ...built.value,
          });
          outcome = {
            status: 'created',
            entry: serializeEntry(created.toObject()),
          };
        }
      } else if (op.type === 'update') {
        const current = await JournalEntry.findOne({
          _id: op.entryId,
          userId,
        }).lean();

        if (!current) {
          outcome = { status: 'not_found', message: 'Entry not found' };
        } else if ((current.version ?? 1) !== op.baseVersion) {
          outcome = {
            status: 'conflict',
            message:
              'Entry changed on the server; local edit discarded (server wins)',
            entry: serializeEntry(current),
          };
        } else {
          const built = buildJournalUpdateSet(current.entryType, op.entry ?? {});
          if (!built.ok) {
            outcome = { status: 'error', message: built.message };
          } else {
            const updated = await JournalEntry.findOneAndUpdate(
              { _id: op.entryId, userId, version: op.baseVersion },
              { $set: { ...built.value, syncedAt: new Date() }, $inc: { version: 1 } },
              { new: true, runValidators: true }
            ).lean();
            if (!updated) {
              const latest = await JournalEntry.findOne({
                _id: op.entryId,
                userId,
              }).lean();
              outcome = {
                status: 'conflict',
                message:
                  'Entry changed on the server; local edit discarded (server wins)',
                entry: latest ? serializeEntry(latest) : null,
              };
            } else {
              outcome = { status: 'updated', entry: serializeEntry(updated) };
            }
          }
        }
      } else {
        // delete
        const current = await JournalEntry.findOne({
          _id: op.entryId,
          userId,
        }).lean();

        if (!current) {
          // Already gone (e.g. a prior sync applied it) — idempotent no-op success.
          outcome = { status: 'deleted' };
        } else if (
          op.baseVersion !== undefined &&
          (current.version ?? 1) !== op.baseVersion
        ) {
          outcome = {
            status: 'conflict',
            message:
              'Entry changed on the server; delete skipped (server wins)',
            entry: serializeEntry(current),
          };
        } else {
          await JournalEntry.deleteOne({ _id: op.entryId, userId });
          outcome = { status: 'deleted' };
        }
      }

      results.push({ clientOpId: op.clientOpId, type: op.type, ...outcome });

      try {
        await JournalSyncOp.create({
          userId,
          clientOpId: op.clientOpId,
          type: op.type,
          result: outcome,
        });
      } catch (persistError) {
        const code = (persistError as { code?: number } | null)?.code;
        if (code !== 11000) {
          // Not a duplicate-key race from a concurrent retry — worth logging.
          console.error('Journal sync op ledger error:', persistError);
        }
      }
    } catch (error) {
      console.error('Journal sync op error:', error);
      results.push({
        clientOpId: op.clientOpId,
        type: op.type,
        status: 'error',
        message: 'Server error while applying operation',
      });
    }
  }

  res.json({ results, serverTime: new Date().toISOString() });
});

export default router;
