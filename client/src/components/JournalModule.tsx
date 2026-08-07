import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCardById } from '../data/tarotDeck';
import { apiFetch } from '../lib/api';
import { buildJournalSky } from '../lib/journalSky';
import {
  ENTRY_TYPE_LABELS,
  ENTRY_TYPES,
  suggestJournalEntities,
  type JournalEntry,
  type JournalEntryType,
  type JournalEntity,
  type WorkingStatus,
} from '../lib/journal';

export interface JournalNavigateOptions {
  /** Pre-select entry type filter (e.g. after saving a divination). */
  filter?: JournalEntryType | 'all';
  gematriaPrefill?: string;
}

interface JournalModuleProps {
  initialFilter?: JournalEntryType | 'all';
}

function toDatetimeLocalValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day}T${h}:${min}`;
}

function parseDatetimeLocal(value: string): Date {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

function ScalePicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (n: number | null) => void;
}) {
  return (
    <label className="block text-sm text-ananael-muted">
      {label}
      <div className="mt-1 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(value === n ? null : n)}
            className={`h-8 w-8 rounded-md border text-xs ${
              value === n
                ? 'border-ananael-gold bg-ananael-gold/20 text-ananael-gold'
                : 'border-ananael-border text-zinc-400 hover:border-ananael-violet'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </label>
  );
}

function entityDisplayLabel(e: JournalEntity): string {
  if (e.kind === 'tarot') {
    const card = getCardById(e.id);
    return card?.name ?? e.label;
  }
  return e.label;
}

function payloadSummary(entry: JournalEntry): string | null {
  const p = entry.payload;
  if (!p || typeof p !== 'object') return null;
  if (p.system === 'tarot' && Array.isArray(p.cardsDrawn)) {
    const names = (
      p.cardsDrawn as Array<{ cardId: string; isReversed: boolean }>
    )
      .map((c) => {
        const card = getCardById(c.cardId);
        const name = card?.name ?? c.cardId;
        return c.isReversed ? `${name} (rev)` : name;
      })
      .join(', ');
    return names || null;
  }
  if (p.system === 'iching' && typeof p.primaryNumber === 'number') {
    const rel =
      typeof p.relatingNumber === 'number'
        ? ` → ${p.relatingNumber}`
        : '';
    return `Hexagram ${p.primaryNumber}${rel}`;
  }
  return null;
}

/**
 * Magical Journal — unified ritual / dream / divination / mood / working log.
 */
export default function JournalModule({
  initialFilter = 'all',
}: JournalModuleProps) {
  const { isAuthenticated } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [typeFilter, setTypeFilter] = useState<JournalEntryType | 'all'>(
    initialFilter
  );
  const [searchQ, setSearchQ] = useState('');
  const [entityQ, setEntityQ] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [entryType, setEntryType] = useState<JournalEntryType>('note');
  const [occurredAt, setOccurredAt] = useState(() =>
    toDatetimeLocalValue(new Date())
  );
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [mood, setMood] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [status, setStatus] = useState<WorkingStatus>('active');
  const [tagsInput, setTagsInput] = useState('');
  const [entities, setEntities] = useState<JournalEntity[]>([]);
  const [entitySuggestQ, setEntitySuggestQ] = useState('');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTypeFilter(initialFilter);
  }, [initialFilter]);

  const skyPreview = useMemo(
    () => buildJournalSky(parseDatetimeLocal(occurredAt)),
    [occurredAt]
  );

  const suggestions = useMemo(
    () => suggestJournalEntities(entitySuggestQ, 10),
    [entitySuggestQ]
  );

  const resetForm = useCallback(() => {
    setEditingId(null);
    setEntryType('note');
    setOccurredAt(toDatetimeLocalValue(new Date()));
    setTitle('');
    setBody('');
    setMood(null);
    setEnergy(null);
    setStatus('active');
    setTagsInput('');
    setEntities([]);
    setEntitySuggestQ('');
    setSaveStatus(null);
  }, []);

  const loadEntries = useCallback(async () => {
    if (!isAuthenticated) {
      setEntries([]);
      return;
    }
    setLoading(true);
    setListError(null);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (searchQ.trim()) params.set('q', searchQ.trim());
      if (entityQ.trim()) params.set('entity', entityQ.trim());
      params.set('limit', '80');

      const res = await apiFetch(`/api/journal/entries?${params}`);
      const data = (await res.json()) as {
        entries?: JournalEntry[];
        message?: string;
      };
      if (!res.ok) {
        throw new Error(data.message || 'Failed to load journal');
      }
      setEntries(data.entries ?? []);
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, typeFilter, searchQ, entityQ]);

  useEffect(() => {
    if (isAuthenticated) {
      void loadEntries();
    } else {
      setEntries([]);
    }
  }, [isAuthenticated, loadEntries]);

  const loadIntoForm = (entry: JournalEntry) => {
    setEditingId(entry._id);
    setEntryType(entry.entryType);
    setOccurredAt(toDatetimeLocalValue(new Date(entry.occurredAt)));
    setTitle(entry.title ?? '');
    setBody(entry.body ?? '');
    setMood(entry.mood ?? null);
    setEnergy(entry.energy ?? null);
    setStatus(entry.status ?? 'active');
    setTagsInput((entry.tags ?? []).join(', '));
    setEntities(entry.entities ?? []);
    setSaveStatus(null);
  };

  const parseTags = (): string[] =>
    tagsInput
      .split(/[,#]/)
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

  const saveEntry = async () => {
    if (!isAuthenticated) return;
    setSaving(true);
    setSaveStatus(null);
    try {
      const when = parseDatetimeLocal(occurredAt);
      const sky = buildJournalSky(when);
      const payload = {
        entryType,
        occurredAt: when.toISOString(),
        title,
        body,
        mood,
        energy,
        status: entryType === 'working' ? status : null,
        tags: parseTags(),
        entities,
        sky,
      };

      const url = editingId
        ? `/api/journal/entries/${editingId}`
        : '/api/journal/entries';
      const method = editingId ? 'PATCH' : 'POST';

      const res = await apiFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        throw new Error(data.message || 'Failed to save entry');
      }
      setSaveStatus(editingId ? 'Entry updated.' : 'Entry saved.');
      resetForm();
      await loadEntries();
    } catch (err) {
      setSaveStatus(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const deleteEntry = async (id: string) => {
    if (!isAuthenticated) return;
    if (!window.confirm('Delete this journal entry?')) return;
    try {
      const res = await apiFetch(`/api/journal/entries/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = (await res.json()) as { message?: string };
        throw new Error(data.message || 'Delete failed');
      }
      if (editingId === id) resetForm();
      await loadEntries();
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const addEntity = (e: JournalEntity) => {
    setEntities((prev) => {
      if (prev.some((x) => x.kind === e.kind && x.id === e.id)) return prev;
      return [...prev, e];
    });
    setEntitySuggestQ('');
  };

  const removeEntity = (kind: string, id: string) => {
    setEntities((prev) => prev.filter((e) => !(e.kind === kind && e.id === id)));
  };

  if (!isAuthenticated) {
    return (
      <div className="space-y-4">
        <header>
          <h1 className="font-display text-3xl text-ananael-gold">
            Magical Journal
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ananael-muted">
            Sign in to keep ritual logs, dreams, divinatory records, and mood
            tracking with moon and planetary-hour tags.
          </p>
        </header>
        <p className="text-sm text-zinc-400">
          Use the account menu to register or log in.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl text-ananael-gold">
          Magical Journal
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ananael-muted">
          The shared log for rituals, dreams, divinations, mood, and ongoing
          workings. Moon phase and planetary hour are tagged automatically.
        </p>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTypeFilter('all')}
          className={`rounded-md border px-3 py-1.5 text-xs ${
            typeFilter === 'all'
              ? 'border-ananael-gold text-ananael-gold'
              : 'border-ananael-border text-zinc-400'
          }`}
        >
          All
        </button>
        {ENTRY_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTypeFilter(t)}
            className={`rounded-md border px-3 py-1.5 text-xs ${
              typeFilter === t
                ? 'border-ananael-gold text-ananael-gold'
                : 'border-ananael-border text-zinc-400'
            }`}
          >
            {ENTRY_TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm text-ananael-muted">
          Search text
          <input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="symbol, notes, tags…"
            className="mt-1 w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet"
          />
        </label>
        <label className="block text-sm text-ananael-muted">
          Entity / spirit / planet
          <input
            value={entityQ}
            onChange={(e) => setEntityQ(e.target.value)}
            placeholder="Venus, Yesod, Paimon…"
            className="mt-1 w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet"
          />
        </label>
      </div>

      {/* Editor */}
      <section className="space-y-4 border border-ananael-border/50 bg-ananael-surface/40 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-xl text-ananael-gold">
            {editingId ? 'Edit entry' : 'New entry'}
          </h2>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs text-ananael-muted hover:text-zinc-200"
            >
              Cancel edit
            </button>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block text-sm text-ananael-muted">
            Type
            <select
              value={entryType}
              onChange={(e) =>
                setEntryType(e.target.value as JournalEntryType)
              }
              className="mt-1 w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet"
            >
              {ENTRY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {ENTRY_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-ananael-muted">
            When
            <input
              type="datetime-local"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              className="mt-1 w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet"
            />
          </label>
          {entryType === 'working' && (
            <label className="block text-sm text-ananael-muted">
              Status
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as WorkingStatus)}
                className="mt-1 w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="complete">Complete</option>
              </select>
            </label>
          )}
        </div>

        <label className="block text-sm text-ananael-muted">
          Title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet"
          />
        </label>

        <label className="block text-sm text-ananael-muted">
          Body
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            className="mt-1 w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <ScalePicker label="Mood" value={mood} onChange={setMood} />
          <ScalePicker label="Energy" value={energy} onChange={setEnergy} />
        </div>

        <label className="block text-sm text-ananael-muted">
          Tags (comma-separated)
          <input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="mercury, incense, LBRP"
            className="mt-1 w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet"
          />
        </label>

        <div>
          <p className="text-sm text-ananael-muted">Entities</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {entities.map((e) => (
              <button
                key={`${e.kind}:${e.id}`}
                type="button"
                onClick={() => removeEntity(e.kind, e.id)}
                className="rounded border border-ananael-border/80 px-2 py-0.5 text-xs text-zinc-300 hover:border-red-400/50"
                title="Remove"
              >
                {entityDisplayLabel(e)}
                <span className="ml-1 text-ananael-muted">×</span>
              </button>
            ))}
          </div>
          <input
            value={entitySuggestQ}
            onChange={(e) => setEntitySuggestQ(e.target.value)}
            placeholder="Add planet, sephirah, spirit…"
            className="mt-2 w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet"
          />
          {entitySuggestQ.trim() && suggestions.length > 0 && (
            <ul className="mt-1 max-h-40 overflow-y-auto border border-ananael-border/40 bg-ananael-bg">
              {suggestions.map((s) => (
                <li key={`${s.kind}:${s.id}`}>
                  <button
                    type="button"
                    onClick={() => addEntity(s)}
                    className="flex w-full items-center justify-between px-3 py-1.5 text-left text-xs text-zinc-300 hover:bg-ananael-violet/20"
                  >
                    <span>{s.label}</span>
                    <span className="text-ananael-muted">{s.kind}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-ananael-muted">
          {skyPreview.moonPhase && (
            <span className="rounded border border-ananael-border/60 px-2 py-1">
              {skyPreview.moonPhase}
              {skyPreview.moonIllum != null
                ? ` · ${Math.round(skyPreview.moonIllum * 100)}%`
                : ''}
            </span>
          )}
          {skyPreview.dayRuler && (
            <span className="rounded border border-ananael-border/60 px-2 py-1">
              Day · {skyPreview.dayRuler}
            </span>
          )}
          {skyPreview.hourRuler && (
            <span className="rounded border border-ananael-border/60 px-2 py-1">
              Hour · {skyPreview.hourRuler}
            </span>
          )}
          {!skyPreview.hourRuler && (
            <span className="text-zinc-500">
              Set location in Planetary Hours for hour tags.
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void saveEntry()}
            disabled={saving}
            className="rounded-md border border-ananael-gold/70 bg-ananael-gold/10 px-4 py-2 text-sm text-ananael-gold hover:bg-ananael-gold/20 disabled:opacity-50"
          >
            {saving ? 'Saving…' : editingId ? 'Update' : 'Save entry'}
          </button>
          {saveStatus && (
            <p className="text-sm text-zinc-400">{saveStatus}</p>
          )}
        </div>
      </section>

      {/* Timeline */}
      <section>
        <h2 className="font-display text-xl text-ananael-gold">Timeline</h2>
        {loading && (
          <p className="mt-2 text-sm text-ananael-muted">Loading…</p>
        )}
        {listError && (
          <p className="mt-2 text-sm text-red-400/90">{listError}</p>
        )}
        {!loading && !listError && entries.length === 0 && (
          <p className="mt-2 text-sm text-ananael-muted">No entries yet.</p>
        )}
        <ul className="mt-4 space-y-4">
          {entries.map((entry) => {
            const when = new Date(entry.occurredAt);
            const summary = payloadSummary(entry);
            return (
              <li
                key={entry._id}
                className="border-b border-ananael-border/30 pb-4 last:border-0"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm text-zinc-200">
                      <span className="font-display text-ananael-gold">
                        {ENTRY_TYPE_LABELS[entry.entryType]}
                      </span>
                      {entry.title ? (
                        <span className="text-zinc-300"> · {entry.title}</span>
                      ) : null}
                      {entry.status ? (
                        <span className="text-ananael-muted">
                          {' '}
                          · {entry.status}
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 text-xs text-ananael-muted">
                      {when.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => loadIntoForm(entry)}
                      className="text-xs text-ananael-violet hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteEntry(entry._id)}
                      className="text-xs text-red-400/80 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                {summary && (
                  <p className="mt-1 text-xs text-zinc-400 line-clamp-2">
                    {summary}
                  </p>
                )}
                {typeof entry.payload?.summary === 'string' &&
                  entry.payload.summary.trim() !== '' && (
                    <div className="mt-2">
                      <p className="text-[10px] uppercase tracking-[0.12em] text-ananael-muted">
                        Summary
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-ananael-muted line-clamp-4 whitespace-pre-wrap">
                        {entry.payload.summary}
                      </p>
                    </div>
                  )}
                {entry.body && (
                  <p className="mt-1 text-sm text-zinc-400 line-clamp-3 whitespace-pre-wrap">
                    {entry.body}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {entry.sky?.moonPhase && (
                    <span className="rounded border border-ananael-border/50 px-1.5 py-0.5 text-[10px] text-ananael-muted">
                      {entry.sky.moonPhase}
                    </span>
                  )}
                  {entry.sky?.dayRuler && (
                    <span className="rounded border border-ananael-border/50 px-1.5 py-0.5 text-[10px] text-ananael-muted">
                      Day {entry.sky.dayRuler}
                    </span>
                  )}
                  {entry.sky?.hourRuler && (
                    <span className="rounded border border-ananael-border/50 px-1.5 py-0.5 text-[10px] text-ananael-muted">
                      Hour {entry.sky.hourRuler}
                    </span>
                  )}
                  {(entry.entities ?? []).slice(0, 8).map((e) => (
                    <span
                      key={`${e.kind}:${e.id}`}
                      className="rounded border border-ananael-border/50 px-1.5 py-0.5 text-[10px] text-zinc-400"
                    >
                      {entityDisplayLabel(e)}
                    </span>
                  ))}
                  {(entry.tags ?? []).slice(0, 6).map((t) => (
                    <span
                      key={t}
                      className="rounded border border-ananael-border/40 px-1.5 py-0.5 text-[10px] text-zinc-500"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
