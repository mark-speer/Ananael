import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import {
  ALLIES,
  DIRECTION_TRADITIONS,
  WORLDS,
  directionsForTradition,
  getAlly,
  getWorld,
  type DirectionTraditionId,
  type WorldId,
} from '../data/shamanism';
import {
  SHAMANISM_PANES,
  searchShamanism,
  type ShamanismPane,
} from '../lib/shamanism';
import {
  CAST_MODES,
  castLots,
  type CastLot,
  type PendulumAnswer,
  type ShamanicCastMode,
} from '../lib/shamanismCast';
import { createJourneyDrum } from '../lib/shamanismDrum';
import {
  JOURNEY_STEPS,
  createJourneyPayload,
  isShamanicJourneyPayload,
  journeyProgress,
  markJourneyStepDone,
  sessionFromJourneyPayload,
  type ShamanicJourneySession,
} from '../lib/shamanismJourney';
import { buildJournalSky } from '../lib/journalSky';
import {
  createJournalEntry,
  getJournalEntry,
  updateJournalEntry,
} from '../lib/journalRepo';
import type { ModuleId } from './Sidebar';
import type { TreeNavigateOptions } from './TreeOfLifeModule';
import GlyphFrame from './glyphs/GlyphFrame';
import WorldTreeSvg from './glyphs/WorldTreeSvg';
import DirectionWheelSvg from './glyphs/DirectionWheelSvg';
import LotSvg from './glyphs/LotSvg';

export interface ShamanismNavigateOptions extends TreeNavigateOptions {
  shamanismPane?: ShamanismPane;
  shamanismFocus?: string;
  runEntryId?: string;
}

interface ShamanismModuleProps {
  onNavigate?: (module: ModuleId, opts?: ShamanismNavigateOptions) => void;
  initialPane?: ShamanismPane;
  initialFocus?: string;
  initialRunEntryId?: string;
}

type VesselRow = {
  _id: string;
  name: string;
  date: string;
  config: Record<string, unknown>;
};

/**
 * Shamanism chamber — worlds, directions, allies, journey, cast, practice.
 * Study outlines only; not a substitute for lineage instruction.
 */
export default function ShamanismModule({
  initialPane = 'worlds',
  initialFocus,
  initialRunEntryId,
}: ShamanismModuleProps) {
  const { isAuthenticated } = useAuth();
  const [pane, setPane] = useState<ShamanismPane>(initialPane);
  const [query, setQuery] = useState('');
  const [focusId, setFocusId] = useState<string | null>(initialFocus ?? null);

  const [worldId, setWorldId] = useState<WorldId>('middle');
  const [allyId, setAllyId] = useState('');
  const [intention, setIntention] = useState('');
  const [session, setSession] = useState<ShamanicJourneySession | null>(null);
  const [journeyStatus, setJourneyStatus] = useState<string | null>(null);
  const [journeyBusy, setJourneyBusy] = useState(false);
  const drumRef = useRef(createJourneyDrum());
  const [drumOn, setDrumOn] = useState(false);

  const [traditionId, setTraditionId] = useState<DirectionTraditionId>('four');

  const [castMode, setCastMode] = useState<ShamanicCastMode>('three');
  const [drawn, setDrawn] = useState<CastLot[]>([]);
  const [pendulum, setPendulum] = useState<PendulumAnswer | null>(null);
  const [castNotes, setCastNotes] = useState('');
  const [castStatus, setCastStatus] = useState<string | null>(null);
  const [castSaving, setCastSaving] = useState(false);

  const [vesselName, setVesselName] = useState('Untitled journey vessel');
  const [vesselIntent, setVesselIntent] = useState('');
  const [vesselWorldId, setVesselWorldId] = useState<WorldId>('middle');
  const [vesselAllyIds, setVesselAllyIds] = useState<string[]>([]);
  const [vesselNotes, setVesselNotes] = useState('');
  const [savedVesselId, setSavedVesselId] = useState<string | null>(null);
  const [vessels, setVessels] = useState<VesselRow[]>([]);
  const [vesselSaving, setVesselSaving] = useState(false);
  const [vesselStatus, setVesselStatus] = useState<string | null>(null);

  const loadVessels = useCallback(async () => {
    if (!isAuthenticated) {
      setVessels([]);
      return;
    }
    try {
      const res = await apiFetch('/api/practice/vessels');
      const data = (await res.json()) as { vessels?: VesselRow[] };
      if (res.ok) {
        setVessels(
          (data.vessels ?? []).filter((v) => v.config?.system === 'shamanism')
        );
      }
    } catch {
      /* ignore */
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void loadVessels();
  }, [loadVessels]);

  useEffect(() => {
    if (initialPane) setPane(initialPane);
  }, [initialPane]);

  useEffect(() => {
    if (initialFocus) {
      setFocusId(initialFocus);
      if (initialFocus === 'lower' || initialFocus === 'middle' || initialFocus === 'upper') {
        setWorldId(initialFocus);
      }
    }
  }, [initialFocus]);

  useEffect(() => {
    return () => drumRef.current.stop();
  }, []);

  const resumeJourney = useCallback(
    async (entryId: string) => {
      setJourneyBusy(true);
      setJourneyStatus(null);
      try {
        const entry = await getJournalEntry(entryId);
        if (!entry) {
          throw new Error('Working not found');
        }
        if (!isShamanicJourneyPayload(entry.payload)) {
          throw new Error('This working is not a shamanic journey');
        }
        setSession(
          sessionFromJourneyPayload(
            entry.payload,
            entry._id,
            entry.status ?? 'active'
          )
        );
        setWorldId(entry.payload.worldId);
        setIntention(entry.payload.intention);
        setAllyId(entry.payload.allyId ?? '');
        setPane('journey');
      } catch (err) {
        setJourneyStatus(err instanceof Error ? err.message : 'Resume failed');
      } finally {
        setJourneyBusy(false);
      }
    },
    []
  );

  useEffect(() => {
    if (initialRunEntryId) void resumeJourney(initialRunEntryId);
  }, [initialRunEntryId, resumeJourney]);

  const { worlds, allies, directions } = useMemo(
    () => searchShamanism(query, pane),
    [query, pane]
  );

  const selectedWorld =
    worlds.find((w) => w.id === focusId) ?? getWorld(worldId) ?? WORLDS[1]!;
  const selectedAlly = allies.find((a) => a.id === focusId) ?? getAlly(focusId ?? '');
  const tradition = DIRECTION_TRADITIONS.find((t) => t.id === traditionId)!;
  const traditionDirs = directionsForTradition(traditionId);
  const selectedDirection =
    traditionDirs.find((d) => d.id === focusId) ??
    directions.find((d) => d.id === focusId) ??
    traditionDirs[0];

  const persistJourney = async (
    next: ShamanicJourneySession,
    extra?: { status?: 'active' | 'paused' | 'complete'; body?: string }
  ) => {
    if (!next.entryId) {
      setSession(next);
      return;
    }
    setJourneyBusy(true);
    try {
      const payload = createJourneyPayload({
        worldId: next.worldId,
        intention: next.intention,
        allyId: next.allyId,
        stepIndex: next.stepIndex,
        completedSteps: next.completedSteps,
        startedAt: next.startedAt,
        skyStart: next.skyStart,
        encounterNotes: next.encounterNotes,
      });
      const result = await updateJournalEntry(next.entryId, {
        status: extra?.status ?? next.status,
        payload,
        ...(extra?.body !== undefined ? { body: extra.body } : {}),
      });
      if (!result.ok) throw new Error(result.message || 'Failed to update journey');
      setSession({ ...next, status: extra?.status ?? next.status });
    } catch (err) {
      setJourneyStatus(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setJourneyBusy(false);
    }
  };

  const startJourney = async () => {
    setJourneyStatus(null);
    const now = new Date();
    const sky = buildJournalSky(now);
    const world = getWorld(worldId);
    const ally = allyId ? getAlly(allyId) : undefined;
    if (!isAuthenticated) {
      setSession({
        entryId: null,
        worldId,
        allyId: allyId || undefined,
        intention: intention.trim(),
        stepIndex: 0,
        completedSteps: [],
        startedAt: now.toISOString(),
        status: 'active',
        encounterNotes: '',
        skyStart: sky,
      });
      return;
    }
    setJourneyBusy(true);
    try {
      const payload = createJourneyPayload({
        worldId,
        intention: intention.trim(),
        allyId: allyId || undefined,
        startedAt: now.toISOString(),
        skyStart: sky,
      });
      const result = await createJournalEntry({
        entryType: 'working',
        title: `Journey · ${world?.name ?? worldId}`,
        body: intention.trim(),
        status: 'active',
        tags: ['shamanism', 'journey', worldId, ...(ally ? [ally.id] : [])],
        occurredAt: now.toISOString(),
        sky,
        entities: [
          { kind: 'world', id: worldId, label: world?.name ?? worldId },
          ...(ally
            ? [{ kind: 'ally' as const, id: ally.id, label: ally.name }]
            : []),
        ],
        payload,
      });
      if (!result.ok || !result.entry) {
        throw new Error(result.message || 'Failed to start journey');
      }
      setSession(
        sessionFromJourneyPayload(payload, result.entry._id, 'active')
      );
    } catch (err) {
      setJourneyStatus(err instanceof Error ? err.message : 'Could not start');
    } finally {
      setJourneyBusy(false);
    }
  };

  const completeJourney = async () => {
    if (!session) return;
    drumRef.current.stop();
    setDrumOn(false);
    const notes = [
      intention.trim(),
      session.encounterNotes.trim()
        ? `Encounter: ${session.encounterNotes.trim()}`
        : '',
    ]
      .filter(Boolean)
      .join('\n\n');
    await persistJourney(
      { ...session, completedSteps: [0, 1, 2, 3, 4, 5], stepIndex: 5 },
      { status: 'complete', body: notes }
    );
    setJourneyStatus(
      isAuthenticated
        ? 'Journey saved to Magical Journal.'
        : 'Journey complete (guest — not saved).'
    );
  };

  const saveCast = async () => {
    if (!isAuthenticated) return;
    if (castMode !== 'pendulum' && drawn.length === 0) return;
    if (castMode === 'pendulum' && !pendulum) return;
    setCastSaving(true);
    setCastStatus(null);
    try {
      const now = new Date();
      const sky = buildJournalSky(now);
      const res = await apiFetch('/api/shamanism/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: castMode,
          lotsDrawn:
            castMode === 'pendulum'
              ? []
              : drawn.map((d) => ({
                  lotId: d.lot.id,
                  name: d.lot.name,
                  position: d.position,
                })),
          pendulum: castMode === 'pendulum' ? pendulum : undefined,
          userNotes: castNotes,
          occurredAt: now.toISOString(),
          sky,
        }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) throw new Error(data.message || 'Failed to save cast');
      setCastStatus('Saved to Magical Journal.');
    } catch (err) {
      setCastStatus(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setCastSaving(false);
    }
  };

  const saveVessel = async () => {
    if (!isAuthenticated || !vesselName.trim()) return;
    setVesselSaving(true);
    setVesselStatus(null);
    try {
      const config = {
        system: 'shamanism',
        intent: vesselIntent.trim(),
        worldId: vesselWorldId,
        allyIds: vesselAllyIds,
        directionTradition: traditionId,
      };
      const res = await apiFetch(
        savedVesselId
          ? `/api/practice/vessels/${savedVesselId}`
          : '/api/practice/vessels',
        {
          method: savedVesselId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: vesselName.trim(),
            config,
            notes: vesselNotes.trim(),
          }),
        }
      );
      const data = (await res.json()) as {
        message?: string;
        vessel?: VesselRow;
      };
      if (!res.ok) throw new Error(data.message || 'Save failed');
      if (data.vessel) setSavedVesselId(data.vessel._id);
      setVesselStatus('Practice vessel saved.');
      await loadVessels();
    } catch (err) {
      setVesselStatus(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setVesselSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl text-ananael-gold sm:text-3xl">Shamanism</h1>
        <p className="mt-2 max-w-2xl text-sm text-ananael-muted">
          Three-worlds study chamber: axis mundi, direction wheels, allies,
          timed journey, and cleromancy lots. Labeled comparative maps — not a
          closed indigenous ceremony, and not plant-medicine instruction.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {SHAMANISM_PANES.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              setPane(p.id);
              setQuery('');
            }}
            className={[
              'rounded-md border px-3 py-1.5 text-xs font-medium transition',
              pane === p.id
                ? 'border-ananael-gold/60 bg-ananael-gold/15 text-ananael-gold'
                : 'border-ananael-border/60 text-ananael-muted hover:border-ananael-violet/50',
            ].join(' ')}
          >
            {p.label}
          </button>
        ))}
      </div>

      {(pane === 'worlds' || pane === 'allies' || pane === 'directions') && (
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            pane === 'worlds'
              ? 'Search worlds…'
              : pane === 'allies'
                ? 'Search allies…'
                : 'Search directions…'
          }
          className="w-full max-w-md rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet"
        />
      )}

      {pane === 'worlds' && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)]">
          <button
            type="button"
            className="justify-self-center"
            onClick={() => {
              const order: WorldId[] = ['upper', 'middle', 'lower'];
              const i = order.indexOf((focusId as WorldId) || 'middle');
              const next = order[(i + 1) % order.length]!;
              setFocusId(next);
              setWorldId(next);
            }}
            aria-label="Cycle selected world"
          >
            <WorldTreeSvg selectedId={selectedWorld.id} />
          </button>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {WORLDS.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => {
                    setFocusId(w.id);
                    setWorldId(w.id);
                  }}
                  className={[
                    'rounded-md border px-3 py-1.5 text-xs',
                    selectedWorld.id === w.id
                      ? 'border-ananael-gold/60 text-ananael-gold'
                      : 'border-ananael-border/60 text-zinc-300',
                  ].join(' ')}
                >
                  {w.name}
                </button>
              ))}
            </div>
            <h2 className="font-display text-xl text-ananael-gold">
              {selectedWorld.name}
            </h2>
            <p className="text-sm text-zinc-300">{selectedWorld.typicalWork}</p>
            <p className="text-xs text-ananael-muted">
              {selectedWorld.keywords.join(' · ')}
            </p>
            {selectedWorld.sephirahName && (
              <p className="text-xs text-ananael-muted">
                Comparative sephirah: {selectedWorld.sephirahName} (Key{' '}
                {selectedWorld.sephirahKey}) — study map only.
              </p>
            )}
            <button
              type="button"
              onClick={() => {
                setWorldId(selectedWorld.id);
                setPane('journey');
              }}
              className="rounded-md border border-ananael-violet/50 px-3 py-1.5 text-xs text-zinc-200 hover:bg-ananael-violet/10"
            >
              Journey this world
            </button>
          </div>
        </div>
      )}

      {pane === 'directions' && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {DIRECTION_TRADITIONS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTraditionId(t.id)}
                  className={[
                    'rounded-md border px-3 py-1.5 text-xs',
                    traditionId === t.id
                      ? 'border-ananael-gold/60 text-ananael-gold'
                      : 'border-ananael-border/60 text-zinc-300',
                  ].join(' ')}
                >
                  {t.name}
                </button>
              ))}
            </div>
            <p className="text-xs text-ananael-muted">{tradition.description}</p>
            <DirectionWheelSvg
              directionIds={tradition.directionIds}
              selectedId={selectedDirection?.id}
            />
          </div>
          <ul className="space-y-2">
            {traditionDirs.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => setFocusId(d.id)}
                  className={[
                    'w-full rounded-md border px-3 py-2 text-left text-sm',
                    selectedDirection?.id === d.id
                      ? 'border-ananael-gold/50 bg-ananael-gold/10 text-ananael-gold'
                      : 'border-ananael-border/50 text-zinc-300',
                  ].join(' ')}
                >
                  <span className="font-medium">{d.name}</span>
                  {d.element && (
                    <span className="ml-2 text-xs text-ananael-muted">
                      {d.element}
                    </span>
                  )}
                  <p className="mt-1 text-xs text-ananael-muted">
                    {d.keywords.join(' · ')}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {pane === 'allies' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(allies.length ? allies : ALLIES).map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setFocusId(a.id)}
              className={[
                'rounded-xl border p-4 text-left',
                selectedAlly?.id === a.id
                  ? 'border-ananael-gold/50 bg-ananael-gold/10'
                  : 'border-ananael-border/50 bg-ananael-surface',
              ].join(' ')}
            >
              <p className="text-[10px] uppercase tracking-wider text-ananael-muted">
                {a.kind} · {a.tradition}
              </p>
              <h3 className="mt-1 font-display text-lg text-ananael-gold">
                {a.name}
              </h3>
              <p className="mt-2 text-xs text-zinc-300">
                {a.keywords.join(' · ')}
              </p>
              {a.notes && (
                <p className="mt-2 text-xs text-ananael-muted">{a.notes}</p>
              )}
            </button>
          ))}
        </div>
      )}

      {pane === 'journey' && (
        <section className="space-y-4 rounded-xl border border-ananael-border/50 bg-ananael-surface p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm text-ananael-muted">
              World
              <select
                value={worldId}
                onChange={(e) => setWorldId(e.target.value as WorldId)}
                className="mt-1 w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100"
              >
                {WORLDS.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-ananael-muted">
              Ally (optional)
              <select
                value={allyId}
                onChange={(e) => setAllyId(e.target.value)}
                className="mt-1 w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100"
              >
                <option value="">None</option>
                {ALLIES.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block text-sm text-ananael-muted">
            Intention
            <textarea
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void startJourney()}
              disabled={journeyBusy || !intention.trim()}
              className="rounded-md border border-ananael-gold/50 bg-ananael-gold/10 px-3 py-1.5 text-xs text-ananael-gold disabled:opacity-40"
            >
              Start journey
            </button>
            <button
              type="button"
              onClick={() => {
                if (drumOn) {
                  drumRef.current.stop();
                  setDrumOn(false);
                } else {
                  drumRef.current.start();
                  setDrumOn(true);
                }
              }}
              className="rounded-md border border-ananael-violet/50 px-3 py-1.5 text-xs text-zinc-200"
            >
              {drumOn ? 'Stop drum' : 'Start drum'}
            </button>
          </div>
          {session && (
            <div className="space-y-3">
              <div className="h-1.5 overflow-hidden rounded bg-ananael-bg">
                <div
                  className="h-full bg-ananael-gold/70"
                  style={{
                    width: `${Math.round(journeyProgress(session.completedSteps) * 100)}%`,
                  }}
                />
              </div>
              {JOURNEY_STEPS.map((step, i) => {
                const active = session.stepIndex === i;
                const done = session.completedSteps.includes(i);
                return (
                  <div
                    key={step.id}
                    className={[
                      'rounded-md border px-3 py-2',
                      active
                        ? 'border-ananael-gold/50 bg-ananael-gold/10'
                        : 'border-ananael-border/40',
                    ].join(' ')}
                  >
                    <p className="text-xs uppercase tracking-wider text-ananael-muted">
                      {i + 1}. {step.title}
                      {done ? ' · done' : ''}
                    </p>
                    {active && (
                      <>
                        <p className="mt-1 text-sm text-zinc-300">{step.body}</p>
                        {step.id === 'encounter' && (
                          <textarea
                            value={session.encounterNotes}
                            onChange={(e) =>
                              setSession({
                                ...session,
                                encounterNotes: e.target.value,
                              })
                            }
                            rows={2}
                            placeholder="What met you…"
                            className="mt-2 w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100"
                          />
                        )}
                      </>
                    )}
                  </div>
                );
              })}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={journeyBusy}
                  onClick={() => void persistJourney(markJourneyStepDone(session))}
                  className="rounded-md border border-ananael-violet/50 px-3 py-1.5 text-xs text-zinc-200"
                >
                  Next step
                </button>
                <button
                  type="button"
                  disabled={journeyBusy}
                  onClick={() => void completeJourney()}
                  className="rounded-md border border-ananael-gold/50 px-3 py-1.5 text-xs text-ananael-gold"
                >
                  Complete
                </button>
              </div>
            </div>
          )}
          {journeyStatus && (
            <p className="text-xs text-ananael-muted">{journeyStatus}</p>
          )}
          {!isAuthenticated && (
            <p className="text-xs text-ananael-muted">
              Guests may run a journey in memory. Sign in to persist and resume.
            </p>
          )}
        </section>
      )}

      {pane === 'cast' && (
        <section className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {CAST_MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  setCastMode(m.id);
                  setDrawn([]);
                  setPendulum(null);
                  setCastStatus(null);
                }}
                className={[
                  'rounded-md border px-3 py-1.5 text-xs',
                  castMode === m.id
                    ? 'border-ananael-gold/60 text-ananael-gold'
                    : 'border-ananael-border/60 text-zinc-300',
                ].join(' ')}
              >
                {m.label}
              </button>
            ))}
          </div>
          {castMode !== 'pendulum' ? (
            <button
              type="button"
              onClick={() => {
                setDrawn(castLots(castMode));
                setCastStatus(null);
              }}
              className="rounded-md border border-ananael-gold/50 bg-ananael-gold/10 px-3 py-1.5 text-xs text-ananael-gold"
            >
              Cast lots
            </button>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(['yes', 'maybe', 'no'] as PendulumAnswer[]).map((ans) => (
                <button
                  key={ans}
                  type="button"
                  onClick={() => setPendulum(ans)}
                  className={[
                    'rounded-md border px-3 py-1.5 text-xs capitalize',
                    pendulum === ans
                      ? 'border-ananael-gold/60 text-ananael-gold'
                      : 'border-ananael-border/60 text-zinc-300',
                  ].join(' ')}
                >
                  {ans}
                </button>
              ))}
            </div>
          )}
          {drawn.length > 0 && (
            <div className="flex flex-wrap gap-4">
              {drawn.map((d) => (
                <GlyphFrame key={`${d.position}-${d.lot.id}`} label={d.position}>
                  <LotSvg lotId={d.lot.id} />
                  <p className="mt-2 text-sm text-ananael-gold">{d.lot.name}</p>
                  <p className="max-w-[12rem] text-[11px] text-ananael-muted">
                    {d.lot.meaning}
                  </p>
                </GlyphFrame>
              ))}
            </div>
          )}
          <textarea
            value={castNotes}
            onChange={(e) => setCastNotes(e.target.value)}
            rows={2}
            placeholder="Notes…"
            className="w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100"
          />
          {isAuthenticated ? (
            <button
              type="button"
              disabled={castSaving}
              onClick={() => void saveCast()}
              className="rounded-md border border-ananael-violet/50 px-3 py-1.5 text-xs text-zinc-200"
            >
              {castSaving ? 'Saving…' : 'Save to Journal'}
            </button>
          ) : (
            <p className="text-xs text-ananael-muted">
              Sign in to archive casts in the Magical Journal.
            </p>
          )}
          {castStatus && (
            <p className="text-xs text-ananael-muted">{castStatus}</p>
          )}
        </section>
      )}

      {pane === 'practice' && (
        <section className="space-y-4 rounded-xl border border-ananael-border/50 bg-ananael-surface p-5">
          <p className="text-sm text-ananael-muted">
            Saved intent vessel. Personal allies live here — not a spirit-animal
            quiz. Sign in to persist.
          </p>
          <label className="block text-sm text-ananael-muted">
            Name
            <input
              value={vesselName}
              onChange={(e) => setVesselName(e.target.value)}
              className="mt-1 w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100"
            />
          </label>
          <label className="block text-sm text-ananael-muted">
            Intent
            <textarea
              value={vesselIntent}
              onChange={(e) => setVesselIntent(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100"
            />
          </label>
          <label className="block text-sm text-ananael-muted">
            Preferred world
            <select
              value={vesselWorldId}
              onChange={(e) => setVesselWorldId(e.target.value as WorldId)}
              className="mt-1 w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100"
            >
              {WORLDS.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </label>
          <fieldset>
            <legend className="text-sm text-ananael-muted">Personal allies</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {ALLIES.map((a) => {
                const on = vesselAllyIds.includes(a.id);
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() =>
                      setVesselAllyIds((prev) =>
                        on ? prev.filter((id) => id !== a.id) : [...prev, a.id]
                      )
                    }
                    className={[
                      'rounded-md border px-2 py-1 text-[11px]',
                      on
                        ? 'border-ananael-gold/50 text-ananael-gold'
                        : 'border-ananael-border/50 text-zinc-400',
                    ].join(' ')}
                  >
                    {a.name}
                  </button>
                );
              })}
            </div>
          </fieldset>
          <label className="block text-sm text-ananael-muted">
            Notes
            <textarea
              value={vesselNotes}
              onChange={(e) => setVesselNotes(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100"
            />
          </label>
          {isAuthenticated ? (
            <button
              type="button"
              disabled={vesselSaving}
              onClick={() => void saveVessel()}
              className="rounded-md border border-ananael-gold/50 px-3 py-1.5 text-xs text-ananael-gold"
            >
              {vesselSaving ? 'Saving…' : savedVesselId ? 'Update vessel' : 'Save vessel'}
            </button>
          ) : (
            <p className="text-xs text-ananael-muted">Sign in to save vessels.</p>
          )}
          {vesselStatus && (
            <p className="text-xs text-ananael-muted">{vesselStatus}</p>
          )}
          {vessels.length > 0 && (
            <ul className="space-y-1">
              {vessels.map((v) => (
                <li key={v._id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSavedVesselId(v._id);
                      setVesselName(v.name);
                      const c = v.config;
                      setVesselIntent(typeof c.intent === 'string' ? c.intent : '');
                      if (c.worldId === 'lower' || c.worldId === 'middle' || c.worldId === 'upper') {
                        setVesselWorldId(c.worldId);
                      }
                      if (Array.isArray(c.allyIds)) {
                        setVesselAllyIds(c.allyIds.filter((x): x is string => typeof x === 'string'));
                      }
                    }}
                    className="text-left text-xs text-ananael-gold hover:underline"
                  >
                    {v.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
