/**
 * Local-first journal repository.
 *
 * Every journal read/write in the client goes through this module instead of
 * calling `/api/journal/entries` directly. Writes land in IndexedDB
 * immediately (optimistic) and are queued in an "outbox"; a background sync
 * engine drains the outbox against the bounded `/api/journal/sync` batch
 * endpoint whenever the app is online, on reconnect, and on a periodic timer.
 * Conflicts are server-wins: the server's copy always replaces the local one.
 *
 * Design notes:
 * - Entries created while offline get a temporary `local-<uuid>` id. Once the
 *   create syncs, the record is re-keyed to the server's real id and an alias
 *   (`old id -> new id`) is stored so any caller still holding the temporary
 *   id (e.g. a ritual-runner session in React state) keeps working — every
 *   read/write here resolves through the alias chain first.
 * - At most one pending "intent" is kept per entry in the outbox: a later
 *   edit folds into a still-unsynced create, and a later edit folds into a
 *   still-unsynced update (batches always send the *latest* local state).
 *   A delete drops an unsynced create outright (it never needs the network)
 *   or supersedes a pending update.
 * - Known limitation: if a local edit lands in the exact window between a
 *   sync request being sent and its response arriving, the response's cache
 *   write can race that edit. The outbox itself is race-guarded (a `rev`
 *   stamp ensures a newer queued edit is never dropped), but the in-memory
 *   entries cache is last-write-wins for that narrow window. Given how rare
 *   and short that window is, this is treated as an acceptable trade-off
 *   rather than building full transactional isolation into IndexedDB.
 */

import { apiFetch } from './api';
import { isIndexedDbSupported, TypedIndexedDb } from './indexedDb';
import type {
  JournalEntity,
  JournalEntry,
  JournalEntryType,
  JournalSky,
  WorkingStatus,
} from './journal';

const DB_NAME = 'ananael-journal';
const DB_VERSION = 1;
const ENTRIES_STORE = 'entries';
const OUTBOX_STORE = 'outbox';
const META_STORE = 'meta';

/** Per-request cap, kept comfortably under the server's bounded limit (25). */
const MAX_BATCH = 20;
/** Full-list pull size; mirrors the server's own GET /entries upper bound. */
const PULL_LIMIT = 200;
/** Background sync cadence while the app is open and online. */
const PERIODIC_SYNC_MS = 90_000;

const store = new TypedIndexedDb(DB_NAME, DB_VERSION, [
  { name: ENTRIES_STORE, keyPath: '_id' },
  {
    name: OUTBOX_STORE,
    keyPath: 'clientOpId',
    indexes: [{ name: 'byLocalId', keyPath: 'localId' }],
  },
  { name: META_STORE, keyPath: 'key' },
]);

function uuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function tempId(): string {
  return `local-${uuid()}`;
}

function isTempId(id: string): boolean {
  return id.startsWith('local-');
}

function currentOnline(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine;
}

interface OutboxRecord {
  clientOpId: string;
  localId: string;
  type: 'create' | 'update' | 'delete';
  baseVersion?: number;
  entry?: Record<string, unknown>;
  createdAt: number;
  /** Bumped on every fold so an in-flight sync never deletes a newer edit. */
  rev: number;
}

interface MetaRecord {
  key: string;
  value: string;
}

export interface JournalCreateInput {
  entryType: JournalEntryType;
  occurredAt: string;
  title?: string;
  body?: string;
  mood?: number | null;
  energy?: number | null;
  status?: WorkingStatus | null;
  tags?: string[];
  entities?: JournalEntity[];
  sky?: JournalSky | null;
  /** Accepts any serializable payload shape (ritual-runner, shamanic journey, divination, etc.). */
  payload?: unknown;
  links?: JournalEntry['links'];
}

export type JournalUpdateInput = Partial<JournalCreateInput>;

export interface JournalOpResult {
  ok: boolean;
  conflict?: boolean;
  entry?: JournalEntry;
  message?: string;
}

export interface JournalListQuery {
  type?: JournalEntryType | 'all';
  status?: WorkingStatus;
  tag?: string;
  entity?: string;
  q?: string;
  limit?: number;
}

export interface JournalSyncStatus {
  online: boolean;
  syncing: boolean;
  pending: number;
  lastSyncedAt: string | null;
  lastError: string | null;
  conflicts: number;
}

async function resolveId(id: string): Promise<string> {
  let current = id;
  for (let hop = 0; hop < 8; hop += 1) {
    const alias = await store.get<MetaRecord>(META_STORE, `alias:${current}`);
    if (!alias) break;
    current = alias.value;
  }
  return current;
}

function matchesQuery(entry: JournalEntry, query: JournalListQuery): boolean {
  if (query.type && query.type !== 'all' && entry.entryType !== query.type) return false;
  if (query.status && entry.status !== query.status) return false;
  if (query.tag) {
    const needle = query.tag.trim().toLowerCase();
    if (needle && !(entry.tags ?? []).some((tag) => tag.toLowerCase() === needle)) {
      return false;
    }
  }
  if (query.entity) {
    const needle = query.entity.trim().toLowerCase();
    const hit = (entry.entities ?? []).some(
      (ent) =>
        ent.id.toLowerCase().includes(needle) ||
        ent.label.toLowerCase().includes(needle) ||
        ent.kind.toLowerCase().includes(needle)
    );
    if (needle && !hit) return false;
  }
  if (query.q) {
    const needle = query.q.trim().toLowerCase();
    const haystack = [entry.title ?? '', entry.body ?? '', ...(entry.tags ?? [])]
      .join(' ')
      .toLowerCase();
    if (needle && !haystack.includes(needle)) return false;
  }
  return true;
}

/** Reads the local cache only — instant, works offline. */
export async function listJournalEntries(
  query: JournalListQuery = {}
): Promise<JournalEntry[]> {
  if (!isIndexedDbSupported()) return [];
  const all = await store.getAll<JournalEntry>(ENTRIES_STORE);
  const filtered = all.filter((e) => matchesQuery(e, query));
  filtered.sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
  );
  const limit = query.limit ?? 80;
  return filtered.slice(0, limit);
}

/** Reads a single cached entry, following any id remap from a since-synced create. */
export async function getJournalEntry(id: string): Promise<JournalEntry | null> {
  if (!isIndexedDbSupported()) return null;
  const resolved = await resolveId(id);
  const entry = await store.get<JournalEntry>(ENTRIES_STORE, resolved);
  return entry ?? null;
}

/** Pulls the latest entries from the server and merges them into the cache. */
export async function refreshJournalFromServer(): Promise<{
  ok: boolean;
  message?: string;
}> {
  if (!currentOnline()) return { ok: false, message: 'Offline' };
  try {
    const res = await apiFetch(`/api/journal/entries?limit=${PULL_LIMIT}`);
    const data = (await res.json()) as { entries?: JournalEntry[]; message?: string };
    if (!res.ok) {
      return { ok: false, message: data.message || 'Failed to load journal' };
    }
    if (isIndexedDbSupported()) {
      await store.putMany(ENTRIES_STORE, data.entries ?? []);
      await store.put<MetaRecord>(META_STORE, {
        key: 'lastPulledAt',
        value: new Date().toISOString(),
      });
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Network error' };
  }
}

// ---------------------------------------------------------------------------
// Sync status pub/sub
// ---------------------------------------------------------------------------

let syncing = false;
let lastSyncedAt: string | null = null;
let lastError: string | null = null;
let conflicts = 0;
const listeners = new Set<(status: JournalSyncStatus) => void>();

let cachedStatus: JournalSyncStatus = {
  online: currentOnline(),
  syncing: false,
  pending: 0,
  lastSyncedAt: null,
  lastError: null,
  conflicts: 0,
};

async function pendingCount(): Promise<number> {
  if (!isIndexedDbSupported()) return 0;
  const all = await store.getAll<OutboxRecord>(OUTBOX_STORE);
  return all.length;
}

async function publishStatus(): Promise<void> {
  cachedStatus = {
    online: currentOnline(),
    syncing,
    pending: await pendingCount(),
    lastSyncedAt,
    lastError,
    conflicts,
  };
  listeners.forEach((cb) => cb(cachedStatus));
}

/** Current known status without waiting on IndexedDB (for initial render). */
export function getJournalSyncStatus(): JournalSyncStatus {
  return cachedStatus;
}

/** Subscribe to sync status changes; returns an unsubscribe function. */
export function subscribeJournalSyncStatus(
  cb: (status: JournalSyncStatus) => void
): () => void {
  listeners.add(cb);
  cb(cachedStatus);
  void publishStatus();
  return () => {
    listeners.delete(cb);
  };
}

// ---------------------------------------------------------------------------
// Writes (optimistic-local + outbox)
// ---------------------------------------------------------------------------

export async function createJournalEntry(
  input: JournalCreateInput
): Promise<JournalOpResult> {
  if (!isIndexedDbSupported()) {
    return { ok: false, message: 'Offline storage is not available in this browser' };
  }
  const now = new Date().toISOString();
  const id = tempId();
  const entry: JournalEntry = {
    _id: id,
    entryType: input.entryType,
    occurredAt: input.occurredAt,
    title: input.title ?? '',
    body: input.body ?? '',
    mood: input.mood ?? null,
    energy: input.energy ?? null,
    status: input.status ?? null,
    tags: input.tags ?? [],
    entities: input.entities ?? [],
    sky: input.sky ?? null,
    payload: (input.payload as Record<string, unknown> | null | undefined) ?? null,
    links: input.links ?? [],
    createdAt: now,
    updatedAt: now,
    version: 1,
    syncedAt: null,
  };

  await store.put(ENTRIES_STORE, entry);

  const op: OutboxRecord = {
    clientOpId: uuid(),
    localId: id,
    type: 'create',
    entry: { ...input },
    createdAt: Date.now(),
    rev: 1,
  };
  await store.put(OUTBOX_STORE, op);
  await publishStatus();
  void syncNow();

  return { ok: true, entry };
}

export async function updateJournalEntry(
  id: string,
  patch: JournalUpdateInput
): Promise<JournalOpResult> {
  if (!isIndexedDbSupported()) {
    return { ok: false, message: 'Offline storage is not available in this browser' };
  }
  const resolvedId = await resolveId(id);
  const current = await store.get<JournalEntry>(ENTRIES_STORE, resolvedId);
  if (!current) {
    return { ok: false, message: 'Entry not found locally' };
  }

  const merged = {
    ...current,
    ...patch,
    tags: patch.tags ?? current.tags,
    entities: patch.entities ?? current.entities,
    payload: (patch.payload as Record<string, unknown> | null | undefined) ?? current.payload,
    updatedAt: new Date().toISOString(),
  } as JournalEntry;
  await store.put(ENTRIES_STORE, merged);

  const outbox = await store.getAll<OutboxRecord>(OUTBOX_STORE, 'byLocalId', resolvedId);
  const pendingCreate = outbox.find((o) => o.type === 'create');
  const pendingUpdate = outbox.find((o) => o.type === 'update');

  if (pendingCreate) {
    pendingCreate.entry = { ...pendingCreate.entry, ...patch };
    pendingCreate.rev += 1;
    await store.put(OUTBOX_STORE, pendingCreate);
  } else if (pendingUpdate) {
    pendingUpdate.entry = { ...pendingUpdate.entry, ...patch };
    pendingUpdate.rev += 1;
    await store.put(OUTBOX_STORE, pendingUpdate);
  } else {
    const op: OutboxRecord = {
      clientOpId: uuid(),
      localId: resolvedId,
      type: 'update',
      baseVersion: current.version,
      entry: { ...patch },
      createdAt: Date.now(),
      rev: 1,
    };
    await store.put(OUTBOX_STORE, op);
  }

  await publishStatus();
  void syncNow();
  return { ok: true, entry: merged };
}

export async function deleteJournalEntry(id: string): Promise<JournalOpResult> {
  if (!isIndexedDbSupported()) {
    return { ok: false, message: 'Offline storage is not available in this browser' };
  }
  const resolvedId = await resolveId(id);
  const current = await store.get<JournalEntry>(ENTRIES_STORE, resolvedId);
  const outbox = await store.getAll<OutboxRecord>(OUTBOX_STORE, 'byLocalId', resolvedId);
  const pendingCreate = outbox.find((o) => o.type === 'create');

  await store.delete(ENTRIES_STORE, resolvedId);
  for (const o of outbox) {
    if (o.type === 'update') await store.delete(OUTBOX_STORE, o.clientOpId);
  }

  if (pendingCreate) {
    // Never reached the server — nothing to sync, just drop the intent.
    await store.delete(OUTBOX_STORE, pendingCreate.clientOpId);
    await publishStatus();
    return { ok: true };
  }

  const op: OutboxRecord = {
    clientOpId: uuid(),
    localId: resolvedId,
    type: 'delete',
    baseVersion: current?.version,
    createdAt: Date.now(),
    rev: 1,
  };
  await store.put(OUTBOX_STORE, op);
  await publishStatus();
  void syncNow();
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Sync engine
// ---------------------------------------------------------------------------

interface SyncResultItem {
  clientOpId: string;
  type: string;
  status: string;
  entry?: JournalEntry;
  message?: string;
}

/** Drains the outbox against POST /api/journal/sync in bounded batches. */
export async function syncNow(): Promise<void> {
  if (!isIndexedDbSupported() || syncing) return;
  if (!currentOnline()) {
    await publishStatus();
    return;
  }

  syncing = true;
  await publishStatus();

  try {
    let outbox = (await store.getAll<OutboxRecord>(OUTBOX_STORE)).sort(
      (a, b) => a.createdAt - b.createdAt
    );

    while (outbox.length > 0) {
      const batch = outbox.slice(0, MAX_BATCH);
      const body = {
        operations: batch.map((op) => ({
          clientOpId: op.clientOpId,
          type: op.type,
          ...(op.type !== 'create'
            ? {
                entryId: op.localId,
                ...(op.baseVersion !== undefined ? { baseVersion: op.baseVersion } : {}),
              }
            : {}),
          ...(op.entry ? { entry: op.entry } : {}),
        })),
      };

      let res: Response;
      try {
        res = await apiFetch('/api/journal/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } catch (err) {
        lastError = err instanceof Error ? err.message : 'Sync request failed';
        break;
      }

      if (!res.ok) {
        lastError = `Sync failed (HTTP ${res.status})`;
        break;
      }

      const data = (await res.json()) as { results?: SyncResultItem[] };

      for (const result of data.results ?? []) {
        const op = batch.find((o) => o.clientOpId === result.clientOpId);
        if (!op) continue;

        if (result.status === 'created' && result.entry) {
          await store.delete(ENTRIES_STORE, op.localId);
          await store.put(ENTRIES_STORE, result.entry);
          if (isTempId(op.localId)) {
            await store.put<MetaRecord>(META_STORE, {
              key: `alias:${op.localId}`,
              value: result.entry._id,
            });
          }
        } else if (result.status === 'updated' && result.entry) {
          await store.put(ENTRIES_STORE, result.entry);
        } else if (result.status === 'conflict') {
          conflicts += 1;
          if (result.entry) {
            await store.put(ENTRIES_STORE, result.entry);
          } else {
            await store.delete(ENTRIES_STORE, op.localId);
          }
        } else if (result.status === 'deleted' || result.status === 'not_found') {
          await store.delete(ENTRIES_STORE, op.localId);
        } else if (result.status === 'error') {
          lastError = result.message ?? 'Sync error';
        }

        // Only remove the queued op if no newer local edit folded into it
        // while this request was in flight (guarded by `rev`).
        const stillQueued = await store.get<OutboxRecord>(OUTBOX_STORE, op.clientOpId);
        if (stillQueued && stillQueued.rev === op.rev) {
          await store.delete(OUTBOX_STORE, op.clientOpId);
        }
      }

      outbox = outbox.slice(batch.length);
    }

    lastSyncedAt = new Date().toISOString();
    await refreshJournalFromServer();
  } catch (err) {
    lastError = err instanceof Error ? err.message : 'Sync failed';
  } finally {
    syncing = false;
    await publishStatus();
  }
}

let wired = false;

/**
 * Wires reconnect + periodic background sync. Safe to call from every
 * mount site that needs journal sync live (idempotent past the first call).
 */
export function ensureJournalSyncWiring(): void {
  if (wired || typeof window === 'undefined') return;
  wired = true;

  window.addEventListener('online', () => void syncNow());
  window.addEventListener('offline', () => void publishStatus());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && currentOnline()) {
      void syncNow();
    }
  });
  window.setInterval(() => {
    if (currentOnline()) void syncNow();
  }, PERIODIC_SYNC_MS);

  void refreshJournalFromServer().then(() => publishStatus());
  void syncNow();
}
