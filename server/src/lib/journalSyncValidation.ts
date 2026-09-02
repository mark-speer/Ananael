/**
 * Pure request-shape validation for POST /api/journal/sync.
 * Kept dependency-free (no Mongoose/Express) so it can be unit tested in isolation.
 */

/** Hard cap on operations per batch — keeps each request small and bounded. */
export const MAX_SYNC_OPERATIONS = 25;

export type SyncOpType = 'create' | 'update' | 'delete';

export interface RawSyncOperation {
  clientOpId: string;
  type: SyncOpType;
  entryId?: string;
  baseVersion?: number;
  entry?: Record<string, unknown>;
}

export type SyncValidationResult =
  | { ok: true; operations: RawSyncOperation[] }
  | { ok: false; message: string };

const VALID_TYPES: SyncOpType[] = ['create', 'update', 'delete'];

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Validates the outer batch shape and each operation's envelope fields.
 * Does not validate entry field contents — that stays with the existing
 * per-field normalizers used by the single-entry routes.
 */
export function validateSyncOperations(body: unknown): SyncValidationResult {
  if (!isPlainObject(body)) {
    return { ok: false, message: 'Request body must be an object' };
  }

  const { operations } = body as { operations?: unknown };

  if (!Array.isArray(operations)) {
    return { ok: false, message: 'operations must be an array' };
  }

  if (operations.length === 0) {
    return { ok: false, message: 'operations must contain at least one entry' };
  }

  if (operations.length > MAX_SYNC_OPERATIONS) {
    return {
      ok: false,
      message: `operations cannot exceed ${MAX_SYNC_OPERATIONS} per batch`,
    };
  }

  const seen = new Set<string>();
  const parsed: RawSyncOperation[] = [];

  for (const raw of operations) {
    if (!isPlainObject(raw)) {
      return { ok: false, message: 'Each operation must be an object' };
    }

    const clientOpId = raw.clientOpId;
    if (typeof clientOpId !== 'string' || !clientOpId.trim() || clientOpId.length > 100) {
      return {
        ok: false,
        message: 'Each operation requires a non-empty clientOpId (max 100 chars)',
      };
    }
    if (seen.has(clientOpId)) {
      return { ok: false, message: `Duplicate clientOpId in batch: ${clientOpId}` };
    }
    seen.add(clientOpId);

    const rawType = raw.type;
    if (typeof rawType !== 'string' || !VALID_TYPES.includes(rawType as SyncOpType)) {
      return {
        ok: false,
        message: `operation.type must be one of: ${VALID_TYPES.join(', ')}`,
      };
    }
    const type = rawType as SyncOpType;

    if (type === 'create') {
      if (!isPlainObject(raw.entry)) {
        return { ok: false, message: 'create operations require an entry object' };
      }
      parsed.push({ clientOpId, type, entry: raw.entry as Record<string, unknown> });
      continue;
    }

    const entryId = raw.entryId;
    if (typeof entryId !== 'string' || !entryId.trim()) {
      return { ok: false, message: `${type} operations require an entryId` };
    }

    if (type === 'update') {
      if (!isPlainObject(raw.entry)) {
        return { ok: false, message: 'update operations require an entry object' };
      }
      const baseVersion = raw.baseVersion;
      if (!Number.isInteger(baseVersion) || (baseVersion as number) < 1) {
        return { ok: false, message: 'update operations require a positive integer baseVersion' };
      }
      parsed.push({
        clientOpId,
        type,
        entryId,
        baseVersion: baseVersion as number,
        entry: raw.entry as Record<string, unknown>,
      });
      continue;
    }

    // delete — baseVersion is optional (server-wins conflict surfaced only if provided and stale)
    const baseVersion = raw.baseVersion;
    if (baseVersion !== undefined && (!Number.isInteger(baseVersion) || (baseVersion as number) < 1)) {
      return { ok: false, message: 'delete baseVersion must be a positive integer when provided' };
    }
    parsed.push({
      clientOpId,
      type,
      entryId,
      baseVersion: baseVersion as number | undefined,
    });
  }

  return { ok: true, operations: parsed };
}
