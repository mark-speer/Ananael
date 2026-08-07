import { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { searchRites, type LiturgyRite } from '../data/liturgy';
import { apiFetch } from '../lib/api';
import { buildJournalSky } from '../lib/journalSky';
import type { ModuleId } from './Sidebar';

export interface LiturgyNavigateOptions {
  planetaryPanel?: 'hours' | 'planets' | 'zodiac' | 'elections';
  filter?: 'working' | 'ritual' | 'all';
}

interface LiturgyModuleProps {
  onNavigate?: (module: ModuleId, opts?: LiturgyNavigateOptions) => void;
}

/**
 * Ritual Library — browse rites, suggested timing, log workings to the journal.
 */
export default function LiturgyModule({ onNavigate }: LiturgyModuleProps) {
  const { isAuthenticated } = useAuth();
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string>('lbrp');
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const rites = useMemo(() => searchRites(query), [query]);
  const rite: LiturgyRite | undefined =
    rites.find((item) => item.id === selectedId) ?? rites[0] ?? undefined;

  const logWorking = async () => {
    if (!isAuthenticated || !rite) return;
    setSaving(true);
    setStatus(null);
    try {
      const now = new Date();
      const sky = buildJournalSky(now);
      const body = rite.steps
        .map((s, i) => `${i + 1}. ${s.title}\n${s.body}`)
        .join('\n\n');
      const res = await apiFetch('/api/journal/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryType: 'working',
          title: rite.title,
          body,
          status: 'active',
          tags: ['liturgy', rite.id, ...rite.tags],
          occurredAt: now.toISOString(),
          sky,
        }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) throw new Error(data.message || 'Failed to log working');
      setStatus('Working logged to Magical Journal.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl text-ananael-gold">
          Ritual Library
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ananael-muted">
          Liturgy and rite sketches for practice. Open suggested planetary
          windows, log a working to the journal, or jump to ritual builders.
        </p>
      </header>

      <label className="block text-sm text-ananael-muted">
        Search
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="mt-1 w-full max-w-md rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet"
          placeholder="banishing, hexagram, goetia…"
        />
      </label>

      <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
        <ul className="space-y-1">
          {rites.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => setSelectedId(r.id)}
                className={[
                  'w-full rounded-md px-3 py-2 text-left text-sm',
                  rite?.id === r.id
                    ? 'bg-ananael-violet/25 text-ananael-gold'
                    : 'text-zinc-300 hover:bg-ananael-panel',
                ].join(' ')}
              >
                {r.title}
                {r.sketch && (
                  <span className="mt-0.5 block text-[10px] uppercase tracking-wider text-ananael-muted">
                    Study sketch
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>

        {rite && (
          <article className="space-y-4">
            <div>
              <h2 className="font-display text-2xl text-ananael-gold">
                {rite.title}
              </h2>
              <p className="mt-1 text-sm text-ananael-muted">
                {rite.tradition}
                {rite.suggestedPlanet
                  ? ` · suggested hour of ${rite.suggestedPlanet}`
                  : ''}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {rite.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded border border-ananael-border/60 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-zinc-400"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <section>
              <h3 className="text-xs uppercase tracking-wider text-ananael-muted">
                Tools
              </h3>
              <ul className="mt-1 list-inside list-disc text-sm text-zinc-300">
                {rite.tools.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </section>

            <section className="space-y-3">
              <h3 className="text-xs uppercase tracking-wider text-ananael-muted">
                Steps
              </h3>
              {rite.steps.map((s, i) => (
                <div
                  key={s.title}
                  className="rounded-md border border-ananael-border/50 bg-ananael-panel px-4 py-3"
                >
                  <p className="text-sm font-medium text-ananael-gold">
                    {i + 1}. {s.title}
                  </p>
                  <p className="mt-1 text-sm text-zinc-300">{s.body}</p>
                </div>
              ))}
            </section>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  onNavigate?.('planetary', { planetaryPanel: 'elections' })
                }
                className="rounded-md border border-ananael-gold/50 px-3 py-1.5 text-xs text-ananael-gold hover:bg-ananael-gold/10"
              >
                Suggested hour / Elections
              </button>
              {rite.ritualTemplate && (
                <button
                  type="button"
                  onClick={() => onNavigate?.('ritual')}
                  className="rounded-md border border-ananael-bronze/60 px-3 py-1.5 text-xs text-zinc-200 hover:bg-ananael-panel"
                >
                  Open Ritual Space
                </button>
              )}
              {(rite.tradition === 'Goetia' ||
                rite.tradition === 'Heptameron') && (
                <button
                  type="button"
                  onClick={() => onNavigate?.('solomonic')}
                  className="rounded-md border border-ananael-bronze/60 px-3 py-1.5 text-xs text-zinc-200 hover:bg-ananael-panel"
                >
                  Open Solomonic Circles
                </button>
              )}
              {isAuthenticated ? (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void logWorking()}
                  className="rounded-md bg-ananael-violet px-3 py-1.5 text-xs font-medium text-white hover:bg-ananael-violet-deep disabled:opacity-50"
                >
                  {saving ? 'Logging…' : 'Log working'}
                </button>
              ) : (
                <span className="text-xs text-ananael-muted">
                  Sign in to log a working
                </span>
              )}
            </div>
            {status && (
              <p className="text-sm text-ananael-gold">
                {status}{' '}
                {status.startsWith('Working') && (
                  <button
                    type="button"
                    className="underline"
                    onClick={() =>
                      onNavigate?.('journal', { filter: 'working' })
                    }
                  >
                    Open journal
                  </button>
                )}
              </p>
            )}
          </article>
        )}
      </div>
    </div>
  );
}
