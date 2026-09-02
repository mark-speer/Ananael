import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getRite,
  groupRitesByTradition,
  LITURGY_TRADITION_ORDER,
  searchRites,
  type LiturgyRite,
} from '../data/liturgy';
import type { TemplateId } from '../data/ritualTools';
import { buildJournalSky } from '../lib/journalSky';
import {
  createJournalEntry,
  getJournalEntry,
} from '../lib/journalRepo';
import {
  createRunnerPayload,
  createRunnerSession,
  isRitualRunnerPayload,
  sessionFromPayload,
  type LiturgyMode,
  type RitualRunnerSession,
} from '../lib/ritualRunner';
import type { SubtleBodyPane } from '../lib/subtleBody';
import type { ModuleId } from './Sidebar';
import RitualRunnerPanel from './RitualRunnerPanel';

export interface LiturgyNavigateOptions {
  planetaryPanel?:
    | 'hours'
    | 'planets'
    | 'zodiac'
    | 'elections'
    | 'almanac'
    | 'natal';
  filter?: 'working' | 'ritual' | 'all';
  ritualTemplate?: TemplateId;
  riteId?: string;
  runEntryId?: string;
  liturgyMode?: LiturgyMode;
  correspondencesQuery?: string;
  subtleBodyPane?: SubtleBodyPane;
  subtleBodyFocus?: string;
}

interface LiturgyModuleProps {
  onNavigate?: (module: ModuleId, opts?: LiturgyNavigateOptions) => void;
  initialRiteId?: string;
  initialRunEntryId?: string;
  initialMode?: LiturgyMode;
}

/**
 * Ritual Library — browse rites, guided Ritual Runner, log workings.
 */
export default function LiturgyModule({
  onNavigate,
  initialRiteId,
  initialRunEntryId,
  initialMode = 'browse',
}: LiturgyModuleProps) {
  const { isAuthenticated } = useAuth();
  const [query, setQuery] = useState('');
  const [traditionFilter, setTraditionFilter] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string>(
    initialRiteId ?? 'lbrp'
  );
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<LiturgyMode>(
    initialMode === 'run' ? 'run' : 'browse'
  );
  const [session, setSession] = useState<RitualRunnerSession | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [resuming, setResuming] = useState(false);

  const rites = useMemo(() => {
    const found = searchRites(query);
    if (!traditionFilter) return found;
    return found.filter((r) => r.tradition === traditionFilter);
  }, [query, traditionFilter]);
  const grouped = useMemo(() => groupRitesByTradition(rites), [rites]);
  const rite: LiturgyRite | undefined =
    rites.find((item) => item.id === selectedId) ??
    getRite(selectedId) ??
    rites[0] ??
    undefined;

  const exitRunner = useCallback(() => {
    setMode('browse');
    setSession(null);
    setResumeError(null);
  }, []);

  const startRun = async (target: LiturgyRite) => {
    setSaving(true);
    setStatus(null);
    setResumeError(null);
    try {
      const now = new Date();
      const sky = buildJournalSky(now);
      if (!isAuthenticated) {
        const guest = createRunnerSession(target, {
          entryId: null,
          startedAt: now.toISOString(),
          skyStart: sky,
        });
        setSession(guest);
        setSelectedId(target.id);
        setMode('run');
        return;
      }

      const payload = createRunnerPayload(target.id, {
        startedAt: now.toISOString(),
        skyStart: sky,
      });
      const toolsLine =
        target.tools.length > 0
          ? `Tools: ${target.tools.join(', ')}`
          : '';
      const result = await createJournalEntry({
        entryType: 'working',
        title: target.title,
        body: toolsLine,
        status: 'active',
        tags: ['liturgy', 'runner', target.id, ...target.tags],
        occurredAt: now.toISOString(),
        sky,
        payload,
      });
      if (!result.ok || !result.entry) {
        throw new Error(result.message || 'Failed to start run');
      }
      const next = createRunnerSession(target, {
        entryId: result.entry._id,
        startedAt: payload.startedAt,
        skyStart: sky,
        status: 'active',
      });
      setSession(next);
      setSelectedId(target.id);
      setMode('run');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Could not start run');
    } finally {
      setSaving(false);
    }
  };

  const resumeFromEntry = useCallback(
    async (entryId: string, preferredRiteId?: string) => {
      setResuming(true);
      setResumeError(null);
      try {
        const entry = await getJournalEntry(entryId);
        if (!entry) {
          throw new Error('Working not found');
        }
        if (!isRitualRunnerPayload(entry.payload)) {
          throw new Error('This working is not a ritual run');
        }
        const riteId = preferredRiteId || entry.payload.riteId;
        const target = getRite(riteId);
        if (!target) {
          throw new Error('Rite for this run is no longer available');
        }
        const restored = sessionFromPayload(
          entry.payload,
          entry._id,
          entry.status === 'paused' || entry.status === 'complete'
            ? entry.status
            : 'active'
        );
        if (restored.status === 'complete') {
          throw new Error('This run is already complete');
        }
        setSelectedId(target.id);
        setSession(restored);
        setMode('run');
      } catch (err) {
        setResumeError(
          err instanceof Error ? err.message : 'Could not resume run'
        );
        setMode('browse');
        setSession(null);
      } finally {
        setResuming(false);
      }
    },
    []
  );

  useEffect(() => {
    if (initialRiteId) {
      setSelectedId(initialRiteId);
    }
  }, [initialRiteId]);

  useEffect(() => {
    if (initialMode === 'run' && initialRunEntryId && isAuthenticated) {
      void resumeFromEntry(initialRunEntryId, initialRiteId);
    }
  }, [
    initialMode,
    initialRunEntryId,
    initialRiteId,
    isAuthenticated,
    resumeFromEntry,
  ]);

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
      const result = await createJournalEntry({
        entryType: 'working',
        title: rite.title,
        body,
        status: 'active',
        tags: ['liturgy', rite.id, ...rite.tags],
        occurredAt: now.toISOString(),
        sky,
      });
      if (!result.ok) throw new Error(result.message || 'Failed to log working');
      setStatus('Working logged to Magical Journal.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const runRite =
    mode === 'run' && session
      ? getRite(session.riteId) ?? rite
      : undefined;

  if (mode === 'run' && session && runRite) {
    return (
      <div className="space-y-8">
        <header>
          <h1 className="font-display text-2xl text-ananael-gold sm:text-3xl">
            Ritual Library
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ananael-muted">
            Guided run in progress. Pause to resume later from Magical OS when
            signed in.
          </p>
        </header>
        <RitualRunnerPanel
          rite={runRite}
          session={session}
          onSessionChange={setSession}
          onExit={exitRunner}
          onFinished={exitRunner}
          onNavigate={onNavigate}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-2xl text-ananael-gold sm:text-3xl">
          Ritual Library
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ananael-muted">
          Study liturgy and practice outlines across Golden Dawn, Solomonic, and
          daily forms. Start a guided run, open suggested planetary windows, log
          a working to the journal, or jump to ritual builders.
        </p>
      </header>

      {(resuming || resumeError) && (
        <p
          className={`text-sm ${
            resumeError ? 'text-red-400/90' : 'text-ananael-muted'
          }`}
        >
          {resuming ? 'Resuming run…' : resumeError}
        </p>
      )}

      <div className="space-y-3 rounded-xl border border-ananael-border/50 bg-ananael-surface p-4 sm:p-5">
        <label className="block">
          <span className="sr-only">Search rites</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-ananael-muted focus:border-ananael-violet"
            placeholder="Search — banishing, hexagram, goetia…"
          />
        </label>
        <div
          className="-mx-1 flex flex-nowrap gap-2 overflow-x-auto px-1 pb-1"
          role="group"
          aria-label="Tradition filter"
        >
          <button
            type="button"
            onClick={() => setTraditionFilter(null)}
            className={[
              'shrink-0 rounded-md border px-2.5 py-1 text-xs transition',
              traditionFilter === null
                ? 'border-ananael-gold/60 bg-ananael-gold/15 text-ananael-gold'
                : 'border-ananael-border/60 text-ananael-muted hover:border-ananael-violet/50 hover:text-zinc-200',
            ].join(' ')}
          >
            All
          </button>
          {LITURGY_TRADITION_ORDER.map((tradition) => {
            const active = traditionFilter === tradition;
            return (
              <button
                key={tradition}
                type="button"
                onClick={() =>
                  setTraditionFilter(active ? null : tradition)
                }
                className={[
                  'shrink-0 rounded-md border px-2.5 py-1 text-xs transition',
                  active
                    ? 'border-ananael-gold/60 bg-ananael-gold/15 text-ananael-gold'
                    : 'border-ananael-border/60 text-ananael-muted hover:border-ananael-violet/50 hover:text-zinc-200',
                ].join(' ')}
              >
                {tradition}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
        <div className="space-y-4">
          {grouped.map((group) => (
            <div key={group.tradition}>
              <p className="mb-1 px-3 text-[10px] uppercase tracking-wider text-ananael-muted">
                {group.tradition}
              </p>
              <ul className="space-y-1">
                {group.rites.map((r) => (
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
            </div>
          ))}
          {rites.length === 0 && (
            <p className="px-3 text-sm text-ananael-muted">No rites match.</p>
          )}
        </div>

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
              {rite.purpose && (
                <p className="mt-2 text-sm text-zinc-300">{rite.purpose}</p>
              )}
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
              {(rite.relatedChakras?.length ||
                rite.relatedMeridians?.length ||
                rite.relatedMudras?.length) ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {rite.relatedChakras?.map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() =>
                        onNavigate?.('correspondences', {
                          correspondencesQuery: id,
                        })
                      }
                      className="rounded border border-ananael-violet/40 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-ananael-violet hover:bg-ananael-violet/10"
                    >
                      chakra: {id}
                    </button>
                  ))}
                  {rite.relatedMeridians?.map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() =>
                        onNavigate?.('correspondences', {
                          correspondencesQuery: id,
                        })
                      }
                      className="rounded border border-ananael-gold/40 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-ananael-gold hover:bg-ananael-gold/10"
                    >
                      meridian: {id}
                    </button>
                  ))}
                  {rite.relatedMudras?.map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() =>
                        onNavigate?.('subtleBody', {
                          subtleBodyPane: 'mudras',
                          subtleBodyFocus: id,
                        })
                      }
                      className="rounded border border-ananael-gold/40 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-ananael-gold hover:bg-ananael-gold/10"
                    >
                      mudra: {id}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {rite.notes && (
              <p className="rounded-md border border-ananael-border/50 bg-ananael-bg/60 px-3 py-2 text-xs text-ananael-muted">
                {rite.notes}
              </p>
            )}

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
                  key={`${rite.id}-${i}-${s.title}`}
                  className="rounded-md border border-ananael-border/50 bg-ananael-panel px-4 py-3"
                >
                  <p className="text-sm font-medium text-ananael-gold">
                    {i + 1}. {s.title}
                  </p>
                  <p className="mt-1 text-sm text-zinc-300">{s.body}</p>
                </div>
              ))}
            </section>

            {rite.sources && rite.sources.length > 0 && (
              <section>
                <h3 className="text-xs uppercase tracking-wider text-ananael-muted">
                  Sources
                </h3>
                <ul className="mt-1 list-inside list-disc text-xs text-ananael-muted">
                  {rite.sources.map((src) => (
                    <li key={src}>{src}</li>
                  ))}
                </ul>
              </section>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={saving || resuming}
                onClick={() => void startRun(rite)}
                className="rounded-md bg-ananael-violet px-3 py-1.5 text-xs font-medium text-white hover:bg-ananael-violet-deep disabled:opacity-50"
              >
                {saving ? 'Starting…' : 'Start run'}
              </button>
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
                  onClick={() =>
                    onNavigate?.('ritual', {
                      ritualTemplate: rite.ritualTemplate,
                    })
                  }
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
                  className="rounded-md border border-ananael-border/60 px-3 py-1.5 text-xs text-zinc-300 hover:bg-ananael-panel disabled:opacity-50"
                >
                  {saving ? 'Logging…' : 'Log working'}
                </button>
              ) : (
                <span className="text-xs text-ananael-muted">
                  Sign in to save runs and log workings
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
