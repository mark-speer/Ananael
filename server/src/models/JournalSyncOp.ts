import mongoose, { Document, Schema, Types } from 'mongoose';

/**
 * Idempotency ledger for the journal batch sync endpoint.
 *
 * Each client-originated mutation carries a `clientOpId` (a UUID minted on the
 * device). Before applying an operation, the sync route checks for an existing
 * record here; if found, the previously computed result is replayed instead of
 * re-applying the mutation. This makes retried batches (e.g. after a dropped
 * response on a flaky connection) safe to resend without double-creating,
 * double-deleting, or clobbering a newer edit.
 *
 * Records expire automatically (TTL index) — they only need to outlive the
 * client's own retry window, not forever.
 */
export interface IJournalSyncOp extends Document {
  userId: Types.ObjectId;
  clientOpId: string;
  type: 'create' | 'update' | 'delete';
  /** Serialized `{ status, entry?, message? }` result returned to the client on first apply. */
  result: Record<string, unknown>;
  createdAt: Date;
}

const JournalSyncOpSchema = new Schema<IJournalSyncOp>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  clientOpId: {
    type: String,
    required: true,
    maxlength: 100,
  },
  type: {
    type: String,
    enum: ['create', 'update', 'delete'],
    required: true,
  },
  result: {
    type: Schema.Types.Mixed,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

/** One outcome per user per client-minted operation id. */
JournalSyncOpSchema.index({ userId: 1, clientOpId: 1 }, { unique: true });
/** Idempotency records only need to survive the client's retry window. */
JournalSyncOpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

const JournalSyncOp = mongoose.model<IJournalSyncOp>(
  'JournalSyncOp',
  JournalSyncOpSchema
);

export default JournalSyncOp;
