import { useEffect, useState } from 'react';
import {
  getJournalSyncStatus,
  subscribeJournalSyncStatus,
  syncNow,
  type JournalSyncStatus,
} from '../lib/journalRepo';

/**
 * Compact, always-visible indicator of the local-first journal sync state:
 * online/offline, pending outbox count, syncing spinner, last-synced time,
 * and a manual "Sync now" action. Conflicts (server-wins overwrites) are
 * called out so the practitioner knows a local edit was superseded.
 */
export default function SyncStatusBadge() {
  const [status, setStatus] = useState<JournalSyncStatus>(getJournalSyncStatus());

  useEffect(() => subscribeJournalSyncStatus(setStatus), []);

  const label = !status.online
    ? 'Offline'
    : status.syncing
      ? 'Syncing…'
      : status.pending > 0
        ? `${status.pending} pending`
        : 'Synced';

  const dotClass = !status.online
    ? 'bg-zinc-500'
    : status.syncing
      ? 'bg-ananael-violet animate-pulse'
      : status.pending > 0
        ? 'bg-ananael-gold'
        : 'bg-emerald-500';

  const lastSynced = status.lastSyncedAt
    ? new Date(status.lastSyncedAt).toLocaleTimeString()
    : null;

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-ananael-muted">
      <span
        className="inline-flex items-center gap-1.5 rounded-full border border-ananael-border/60 px-2.5 py-1"
        title={
          status.online
            ? 'Journal entries save to this device instantly and sync in the background.'
            : 'You are offline. Entries save to this device and will sync automatically once reconnected.'
        }
      >
        <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} aria-hidden />
        {label}
      </span>
      {lastSynced && !status.syncing && (
        <span className="text-zinc-500">Last synced {lastSynced}</span>
      )}
      {status.conflicts > 0 && (
        <span className="rounded border border-red-400/40 px-1.5 py-0.5 text-red-400/90">
          {status.conflicts} conflict{status.conflicts === 1 ? '' : 's'} resolved (server kept)
        </span>
      )}
      {status.lastError && (
        <span className="text-red-400/80" title={status.lastError}>
          Sync error
        </span>
      )}
      {status.online && status.pending > 0 && !status.syncing && (
        <button
          type="button"
          onClick={() => void syncNow()}
          className="text-ananael-violet hover:underline"
        >
          Sync now
        </button>
      )}
    </div>
  );
}
