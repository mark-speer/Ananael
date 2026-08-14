import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import { buildJournalSky } from '../lib/journalSky';
import {
  castRunes,
  positionsForMode,
  type CastRune,
  type RuneCastMode,
} from '../lib/runes';
import GlyphFrame from './glyphs/GlyphFrame';
import RuneSvg from './glyphs/RuneSvg';
import type { ModuleId } from './Sidebar';

const MODES: { id: RuneCastMode; label: string; description: string }[] = [
  { id: 'single', label: 'Single Rune', description: 'Daily guidance' },
  {
    id: 'norn',
    label: 'Three Norns',
    description: 'Past · Present · Future',
  },
  {
    id: 'cross',
    label: 'Five-Rune Cross',
    description: 'Overview through outcome',
  },
];

interface RunesModuleProps {
  /** When true, hide the standalone page header (used inside Divination portal). */
  embedded?: boolean;
  onNavigate?: (module: ModuleId, opts?: { filter?: 'divination' }) => void;
}

/**
 * Elder Futhark casting — single / Norns / five-rune cross + journal save.
 */
export default function RunesModule({
  embedded = false,
  onNavigate,
}: RunesModuleProps) {
  const { isAuthenticated } = useAuth();
  const [mode, setMode] = useState<RuneCastMode>('norn');
  const [drawn, setDrawn] = useState<CastRune[]>([]);
  const [notes, setNotes] = useState('');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const doCast = () => {
    setSaveStatus(null);
    setDrawn(castRunes(mode));
  };

  const saveCast = async () => {
    if (!isAuthenticated || drawn.length === 0) return;
    setSaving(true);
    setSaveStatus(null);
    try {
      const now = new Date();
      const sky = buildJournalSky(now);
      const entities = drawn.map((d) => ({
        kind: 'other' as const,
        id: d.rune.id,
        label: d.isReversed ? `${d.rune.name} (rev)` : d.rune.name,
      }));
      const res = await apiFetch('/api/runes/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          positions: positionsForMode(mode),
          runesDrawn: drawn.map((d) => ({
            runeId: d.rune.id,
            name: d.rune.name,
            isReversed: d.isReversed,
            position: d.position,
          })),
          userNotes: notes,
          occurredAt: now.toISOString(),
          sky,
          entities,
        }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) throw new Error(data.message || 'Failed to save cast');
      setSaveStatus('Saved to Magical Journal.');
    } catch (err) {
      setSaveStatus(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {!embedded && (
        <header>
          <h1 className="font-display text-3xl text-ananael-gold">
            Elder Futhark
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ananael-muted">
            Cast a single rune, the Three Norns, or a five-rune cross. Sign in to
            save casts to the Magical Journal.
          </p>
        </header>
      )}

      <div className="flex flex-wrap gap-3">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => {
              setMode(m.id);
              setDrawn([]);
              setSaveStatus(null);
            }}
            className={[
              'rounded-md border px-4 py-3 text-left transition',
              mode === m.id
                ? 'border-ananael-violet bg-ananael-violet/20 shadow-glow'
                : 'border-ananael-border bg-ananael-panel hover:border-ananael-gold/40',
            ].join(' ')}
          >
            <p className="text-sm font-medium text-zinc-100">{m.label}</p>
            <p className="text-xs text-ananael-muted">{m.description}</p>
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={doCast}
        className="rounded-md bg-ananael-violet px-5 py-2.5 text-sm font-medium text-white transition hover:bg-ananael-violet-deep"
      >
        Cast Runes
      </button>

      {drawn.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {drawn.map((d) => (
            <article
              key={`${d.position}-${d.rune.id}`}
              className="rounded-lg border border-ananael-border/60 bg-ananael-panel p-4"
            >
              <p className="text-[10px] uppercase tracking-wider text-ananael-muted">
                {d.position}
              </p>
              <div className="mt-2 flex justify-center">
                <GlyphFrame>
                  <RuneSvg runeId={d.rune.id} reversed={d.isReversed} />
                </GlyphFrame>
              </div>
              <h3 className="mt-2 text-lg text-zinc-100">
                {d.rune.name}
                {d.isReversed ? ' (reversed)' : ''}
              </h3>
              <p className="text-xs text-ananael-muted">
                {d.rune.keywords.join(' · ')}
              </p>
              <p className="mt-2 text-sm text-zinc-300">
                {d.isReversed ? d.rune.reversed : d.rune.upright}
              </p>
            </article>
          ))}
        </div>
      )}

      {drawn.length > 0 && (
        <>
          <label className="block text-sm text-ananael-muted">
            Notes
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet"
              placeholder="Question and reading notes…"
            />
          </label>

          <div className="flex flex-wrap items-center gap-3">
            {isAuthenticated ? (
              <button
                type="button"
                disabled={saving}
                onClick={() => void saveCast()}
                className="rounded-md bg-ananael-violet px-5 py-2.5 text-sm font-medium text-white transition hover:bg-ananael-violet-deep disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save to Journal'}
              </button>
            ) : (
              <p className="text-sm text-ananael-muted">
                Sign in to save this cast to the Magical Journal.
              </p>
            )}
            {saveStatus && (
              <p className="text-sm text-ananael-gold">
                {saveStatus}{' '}
                {saveStatus.startsWith('Saved') && onNavigate && (
                  <button
                    type="button"
                    className="underline"
                    onClick={() =>
                      onNavigate('journal', { filter: 'divination' })
                    }
                  >
                    Open journal
                  </button>
                )}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
