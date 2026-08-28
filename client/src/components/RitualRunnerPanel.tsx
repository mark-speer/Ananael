import { useCallback, useEffect, useMemo, useState } from 'react';
import type { LiturgyRite } from '../data/liturgy';
import { apiFetch } from '../lib/api';
import { buildJournalSky } from '../lib/journalSky';
import type { JournalEntry, JournalSky } from '../lib/journal';
import {
  buildPlanetaryHours,
  DAY_RULERS,
  formatTime,
  type PlanetId,
} from '../lib/planetaryHours';
import { loadPlanetaryLocation } from '../lib/planetaryLocation';
import {
  buildCompletionBody,
  clampStepIndex,
  createRunnerPayload,
  goToPreviousStep,
  markStepDone,
  progressFraction,
  skipStep,
  type RitualRunnerSession,
} from '../lib/ritualRunner';
import type { ModuleId } from './Sidebar';
import type { LiturgyNavigateOptions } from './LiturgyModule';

const SKY_TICK_MS = 30_000;

export interface RitualRunnerPanelProps {
  rite: LiturgyRite;
  session: RitualRunnerSession;
  onSessionChange: (next: RitualRunnerSession) => void;
  onExit: () => void;
  onFinished: () => void;
  onNavigate?: (module: ModuleId, opts?: LiturgyNavigateOptions) => void;
}

function SkyStrip({
  suggestedPlanet,
}: {
  suggestedPlanet?: PlanetId;
}) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), SKY_TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  const loc = loadPlanetaryLocation();
  const lat = loc?.lat;
  const lon = loc?.lon;
  const dayRuler = DAY_RULERS[now.getDay()] ?? 'Sun';
  const chart = useMemo(() => {
    if (lat == null || lon == null) return null;
    return buildPlanetaryHours(now, lat, lon);
  }, [now, lat, lon]);

  const hourPlanet = chart?.currentHour?.planet ?? null;
  const match =
    suggestedPlanet != null &&
    hourPlanet != null &&
    hourPlanet === suggestedPlanet;

  return (
    <div className="rounded-md border border-ananael-border/50 bg-ananael-bg/70 px-3 py-2 text-xs">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-zinc-300">
        <span>
          Day of <span className="text-ananael-gold">{dayRuler}</span>
        </span>
        {hourPlanet ? (
          <span>
            Hour of <span className="text-ananael-gold">{hourPlanet}</span>
            {chart?.currentHour && (
              <span className="text-ananael-muted">
                {' '}
                ({formatTime(chart.currentHour.start)}–
                {formatTime(chart.currentHour.end)})
              </span>
            )}
          </span>
        ) : (
          <span className="text-ananael-muted">
            Set location in Celestial Timing for the current hour
          </span>
        )}
        {suggestedPlanet && (
          <span className="text-ananael-muted">
            Suggested: {suggestedPlanet}
          </span>
        )}
      </div>
      {match && (
        <p className="mt-1 text-ananael-gold">
          Current hour matches this rite&apos;s suggested planet.
        </p>
      )}
      {suggestedPlanet && hourPlanet && !match && (
        <p className="mt-1 text-ananael-muted">
          Waiting for the hour of {suggestedPlanet}.
        </p>
      )}
    </div>
  );
}

function StepPanel({
  step,
  stepIndex,
  session,
}: {
  step: { title: string; body: string; durationSec?: number };
  stepIndex: number;
  session: RitualRunnerSession;
}) {
  const [remaining, setRemaining] = useState<number | null>(
    step.durationSec ?? null
  );

  useEffect(() => {
    setRemaining(step.durationSec ?? null);
  }, [stepIndex, step.durationSec]);

  useEffect(() => {
    if (step.durationSec == null) return;
    const id = window.setInterval(() => {
      setRemaining((r) => (r != null && r > 0 ? r - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [stepIndex, step.durationSec]);

  const fmt = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="rounded-md border border-ananael-border/50 bg-ananael-panel px-4 py-4">
      <p className="text-sm font-medium text-ananael-gold">
        {stepIndex + 1}. {step.title}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-zinc-300">{step.body}</p>
      {step.durationSec != null && remaining != null && (
        <p
          className={[
            'mt-3 font-display text-2xl tabular-nums',
            remaining === 0 ? 'text-ananael-gold' : 'text-ananael-violet',
          ].join(' ')}
          aria-live="polite"
        >
          {remaining > 0 ? fmt(remaining) : 'Hold complete'}
        </p>
      )}
      {session.completedSteps.includes(stepIndex) && (
        <p className="mt-2 text-[10px] uppercase tracking-wider text-ananael-gold">
          Marked done
        </p>
      )}
    </div>
  );
}

/**
 * Guided ritual run — focused steps, live hour strip, journal sync when signed in.
 */
export default function RitualRunnerPanel({
  rite,
  session,
  onSessionChange,
  onExit,
  onFinished,
  onNavigate,
}: RitualRunnerPanelProps) {
  const stepCount = rite.steps.length;
  const stepIndex = clampStepIndex(session.stepIndex, stepCount);
  const step = rite.steps[stepIndex];
  const progress = progressFraction(session.completedSteps, stepCount);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showComplete, setShowComplete] = useState(false);
  const [notes, setNotes] = useState('');
  const [guestDone, setGuestDone] = useState(false);

  const persist = useCallback(
    async (
      next: RitualRunnerSession,
      extra?: {
        status?: 'active' | 'paused' | 'complete';
        body?: string;
        sky?: JournalSky;
        payloadExtras?: Partial<{
          completedAt: string;
          skyEnd: JournalSky;
        }>;
      }
    ) => {
      if (!next.entryId) {
        onSessionChange(next);
        return;
      }
      setBusy(true);
      setError(null);
      try {
        const status = extra?.status ?? next.status;
        const payload = {
          ...createRunnerPayload(next.riteId, {
            stepIndex: next.stepIndex,
            completedSteps: next.completedSteps,
            startedAt: next.startedAt,
            skyStart: next.skyStart,
          }),
          ...extra?.payloadExtras,
        };
        const res = await apiFetch(`/api/journal/entries/${next.entryId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status,
            payload,
            ...(extra?.body !== undefined ? { body: extra.body } : {}),
            ...(extra?.sky ? { sky: extra.sky } : {}),
          }),
        });
        const data = (await res.json()) as {
          message?: string;
          entry?: JournalEntry;
        };
        if (!res.ok) throw new Error(data.message || 'Failed to update run');
        onSessionChange({ ...next, status });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Save failed');
        throw err;
      } finally {
        setBusy(false);
      }
    },
    [onSessionChange]
  );

  const applyLocal = (next: RitualRunnerSession) => {
    onSessionChange(next);
    if (next.entryId) {
      void persist(next).catch(() => {
        /* error already set */
      });
    }
  };

  const handleDone = () => {
    const next = markStepDone(
      { ...session, stepIndex },
      stepIndex,
      stepCount
    );
    applyLocal(next);
    if (
      stepIndex >= stepCount - 1 ||
      next.completedSteps.length >= stepCount
    ) {
      setShowComplete(true);
    }
  };

  const handleSkip = () => {
    applyLocal(skipStep({ ...session, stepIndex }, stepCount));
  };

  const handlePrev = () => {
    applyLocal(goToPreviousStep({ ...session, stepIndex }));
  };

  const handlePause = async () => {
    const next = { ...session, stepIndex, status: 'paused' as const };
    try {
      await persist(next, { status: 'paused' });
      onExit();
    } catch {
      /* stay on runner */
    }
  };

  const handleComplete = async () => {
    const now = new Date();
    const skyEnd = buildJournalSky(now);
    const body = buildCompletionBody(rite, session.completedSteps, notes);
    const next: RitualRunnerSession = {
      ...session,
      stepIndex,
      status: 'complete',
    };
    if (!session.entryId) {
      setGuestDone(true);
      onSessionChange(next);
      return;
    }
    try {
      await persist(next, {
        status: 'complete',
        body,
        sky: skyEnd,
        payloadExtras: {
          completedAt: now.toISOString(),
          skyEnd,
        },
      });
      onFinished();
    } catch {
      /* stay on complete form */
    }
  };

  if (guestDone) {
    return (
      <div className="space-y-4 rounded-xl border border-ananael-border/50 bg-ananael-surface p-4 sm:p-5">
        <h2 className="font-display text-2xl text-ananael-gold">Run complete</h2>
        <p className="text-sm text-ananael-muted">
          Guest sessions are not saved. Sign in before starting to keep progress
          in the Magical Journal.
        </p>
        <button
          type="button"
          onClick={onFinished}
          className="rounded-md bg-ananael-violet px-3 py-1.5 text-xs font-medium text-white hover:bg-ananael-violet-deep"
        >
          Back to library
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-ananael-border/50 bg-ananael-surface p-4 sm:p-5">
      {/* top offset clears the sticky mobile app header (hidden at md+) */}
      <div className="sticky top-[77px] z-10 -mx-4 -mt-4 space-y-3 border-b border-ananael-border/40 bg-ananael-surface/95 px-4 pb-3 pt-4 backdrop-blur-sm sm:-mx-5 sm:-mt-5 sm:px-5 md:top-0">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-ananael-muted">
              Ritual Runner
              {session.entryId ? '' : ' · guest'}
              {session.status === 'paused' ? ' · paused' : ''}
            </p>
            <h2 className="font-display text-2xl text-ananael-gold">
              {rite.title}
            </h2>
            <p className="mt-0.5 text-sm text-ananael-muted">
              Step {stepCount === 0 ? 0 : stepIndex + 1} / {stepCount}
            </p>
          </div>
          <button
            type="button"
            onClick={onExit}
            className="rounded-md border border-ananael-border/60 px-2.5 py-1 text-xs text-zinc-300 hover:bg-ananael-panel"
          >
            Exit
          </button>
        </div>
        <div
          className="h-1.5 overflow-hidden rounded-full bg-ananael-bg"
          role="progressbar"
          aria-valuenow={Math.round(progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-ananael-gold/80 transition-[width]"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
        <SkyStrip suggestedPlanet={rite.suggestedPlanet} />
      </div>

      {!showComplete && step && (
        <StepPanel step={step} stepIndex={stepIndex} session={session} />
      )}

      {!showComplete && stepCount === 0 && (
        <p className="text-sm text-ananael-muted">This rite has no steps.</p>
      )}

      {showComplete ? (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-ananael-gold">
            Complete this working
          </h3>
          <label className="block">
            <span className="mb-1 block text-xs text-ananael-muted">
              Notes (optional)
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet"
              placeholder="Impressions, omens, adjustments…"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleComplete()}
              className="rounded-md bg-ananael-violet px-3 py-1.5 text-xs font-medium text-white hover:bg-ananael-violet-deep disabled:opacity-50"
            >
              {busy ? 'Saving…' : 'Complete'}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setShowComplete(false)}
              className="rounded-md border border-ananael-border/60 px-3 py-1.5 text-xs text-zinc-300 hover:bg-ananael-panel"
            >
              Back to steps
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy || stepIndex <= 0}
            onClick={handlePrev}
            className="rounded-md border border-ananael-border/60 px-3 py-1.5 text-xs text-zinc-300 hover:bg-ananael-panel disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={busy || !step}
            onClick={handleDone}
            className="rounded-md bg-ananael-violet px-3 py-1.5 text-xs font-medium text-white hover:bg-ananael-violet-deep disabled:opacity-50"
          >
            Mark done
          </button>
          <button
            type="button"
            disabled={busy || !step || stepIndex >= stepCount - 1}
            onClick={handleSkip}
            className="rounded-md border border-ananael-border/60 px-3 py-1.5 text-xs text-zinc-300 hover:bg-ananael-panel disabled:opacity-40"
          >
            Skip
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setShowComplete(true)}
            className="rounded-md border border-ananael-gold/50 px-3 py-1.5 text-xs text-ananael-gold hover:bg-ananael-gold/10"
          >
            Finish…
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void handlePause()}
            className="rounded-md border border-ananael-bronze/60 px-3 py-1.5 text-xs text-zinc-200 hover:bg-ananael-panel disabled:opacity-50"
          >
            Pause
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-t border-ananael-border/40 pt-3">
        <button
          type="button"
          onClick={() =>
            onNavigate?.('planetary', { planetaryPanel: 'elections' })
          }
          className="rounded-md border border-ananael-gold/50 px-3 py-1.5 text-xs text-ananael-gold hover:bg-ananael-gold/10"
        >
          Elections
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
            Ritual Space
          </button>
        )}
        {(rite.tradition === 'Goetia' || rite.tradition === 'Heptameron') && (
          <button
            type="button"
            onClick={() => onNavigate?.('solomonic')}
            className="rounded-md border border-ananael-bronze/60 px-3 py-1.5 text-xs text-zinc-200 hover:bg-ananael-panel"
          >
            Solomonic Circles
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-400/90">{error}</p>}
    </div>
  );
}
