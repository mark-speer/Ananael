/**
 * Unit tests for journal batch-sync request validation.
 * Pure logic — no DB/network — matching the existing no-fixture test style.
 */

import {
  validateSyncOperations,
  MAX_SYNC_OPERATIONS,
} from '../src/lib/journalSyncValidation';

describe('validateSyncOperations', () => {
  test('rejects a non-object body', () => {
    const result = validateSyncOperations(null);
    expect(result.ok).toBe(false);
  });

  test('rejects a missing operations array', () => {
    const result = validateSyncOperations({});
    expect(result.ok).toBe(false);
  });

  test('rejects an empty operations array', () => {
    const result = validateSyncOperations({ operations: [] });
    expect(result.ok).toBe(false);
  });

  test('rejects a batch larger than MAX_SYNC_OPERATIONS', () => {
    const operations = Array.from({ length: MAX_SYNC_OPERATIONS + 1 }, (_, i) => ({
      clientOpId: `op-${i}`,
      type: 'create',
      entry: { entryType: 'note' },
    }));
    const result = validateSyncOperations({ operations });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/cannot exceed/);
    }
  });

  test('accepts a batch at exactly the bound', () => {
    const operations = Array.from({ length: MAX_SYNC_OPERATIONS }, (_, i) => ({
      clientOpId: `op-${i}`,
      type: 'create',
      entry: { entryType: 'note' },
    }));
    const result = validateSyncOperations({ operations });
    expect(result.ok).toBe(true);
  });

  test('rejects duplicate clientOpId within the same batch', () => {
    const result = validateSyncOperations({
      operations: [
        { clientOpId: 'dupe', type: 'create', entry: { entryType: 'note' } },
        { clientOpId: 'dupe', type: 'create', entry: { entryType: 'note' } },
      ],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/Duplicate clientOpId/);
    }
  });

  test('rejects an unknown operation type', () => {
    const result = validateSyncOperations({
      operations: [{ clientOpId: 'a', type: 'noop' }],
    });
    expect(result.ok).toBe(false);
  });

  test('rejects create without an entry object', () => {
    const result = validateSyncOperations({
      operations: [{ clientOpId: 'a', type: 'create' }],
    });
    expect(result.ok).toBe(false);
  });

  test('rejects update without entryId or baseVersion', () => {
    const missingEntryId = validateSyncOperations({
      operations: [{ clientOpId: 'a', type: 'update', baseVersion: 1, entry: {} }],
    });
    expect(missingEntryId.ok).toBe(false);

    const missingVersion = validateSyncOperations({
      operations: [{ clientOpId: 'a', type: 'update', entryId: 'x', entry: {} }],
    });
    expect(missingVersion.ok).toBe(false);
  });

  test('accepts a well-formed update operation', () => {
    const result = validateSyncOperations({
      operations: [
        {
          clientOpId: 'a',
          type: 'update',
          entryId: '507f1f77bcf86cd799439011',
          baseVersion: 2,
          entry: { title: 'Updated' },
        },
      ],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.operations[0]).toMatchObject({
        type: 'update',
        entryId: '507f1f77bcf86cd799439011',
        baseVersion: 2,
      });
    }
  });

  test('delete does not require baseVersion', () => {
    const result = validateSyncOperations({
      operations: [
        { clientOpId: 'a', type: 'delete', entryId: '507f1f77bcf86cd799439011' },
      ],
    });
    expect(result.ok).toBe(true);
  });

  test('delete rejects a non-integer baseVersion when provided', () => {
    const result = validateSyncOperations({
      operations: [
        {
          clientOpId: 'a',
          type: 'delete',
          entryId: '507f1f77bcf86cd799439011',
          baseVersion: 'nope',
        },
      ],
    });
    expect(result.ok).toBe(false);
  });

  test('rejects a missing or empty clientOpId', () => {
    const result = validateSyncOperations({
      operations: [{ type: 'create', entry: { entryType: 'note' } }],
    });
    expect(result.ok).toBe(false);
  });
});
