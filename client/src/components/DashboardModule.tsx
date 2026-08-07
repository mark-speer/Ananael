import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { shuffleDeck, TAROT_DECK } from '../data/tarotDeck';
import { loadDeckStyle } from '../data/tarotDeckArt';
import { apiFetch } from '../lib/api';
import { buildJournalSky } from '../lib/journalSky';
import type { JournalEntry, JournalEntryType } from '../lib/journal';
import {
  buildPlanetaryHours,
  formatTime,
  type PlanetaryHoursChart,
} from '../lib/planetaryHours';
import { summarizeReading } from '../lib/tarotSummary';
import type { ModuleId } from './Sidebar';
import TarotCard, { type DealtCard } from './TarotCard';

const REVERSAL_CHANCE = 0.2;
const SKY_REFRESH_MS = 60_000;

export interface DashboardNavigateOptions {
  filter?: JournalEntryType | 'all';
  gematriaPrefill?: string;
}

interface DashboardModuleProps {
  onNavigate: (module: ModuleId, opts?: DashboardNavigateOptions) => void;
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return '0m';
  const totalMin = Math.ceil(ms / 60_000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function tileClassName(extra = ''): string {
  return [
    'rounded-lg border border-ananael-border/70 bg-ananael-panel/50 p-4',
    extra,
  ]
    .filter(Boolean)
    .join(' ');
}

function TileLink({
  label,
  onClick,
  tone = 'violet',
}: {
  label: string;
  onClick: () => void;
  tone?: 'violet' | 'gold' | 'bronze';
}) {
  const tones = {
    violet:
      'border-ananael-violet/50 text-ananael-violet hover:bg-ananael-violet/15',
    gold: 'border-ananael-gold/50 text-ananael-gold hover:bg-ananael-gold/10',
    bronze:
      'border-ananael-bronze/60 text-zinc-200 hover:bg-ananael-panel hover:text-ananael-gold',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-3 py-1.5 text-xs transition ${tones[tone]}`}
    >
      {label}
    </button>
  );
}

/**
 * Magical OS — default-home dashboard composing sky, quick tarot,
 * journal/workings, and deep-links into live modules.
 */
export default function DashboardModule({ onNavigate }: DashboardModuleProps) {
  const { isAuthenticated, location, saveLocation } = useAuth();
  const [now, setNow] = useState(() => new Date());
  const [dealt, setDealt] = useState<DealtCard | null>(null);
  const [deckStyle] = useState(() => loadDeckStyle());
  const [workings, setWorkings] = useState<JournalEntry[]>([]);
  const [workingsError, setWorkingsError] = useState<string | null>(null);
  const [workingsLoading, setWorkingsLoading] = useState(false);
  const [geoStatus, setGeoStatus] = useState<string | null>(null);

  const refreshSky = useCallback(() => {
    setNow(new Date());
  }, []);

  useEffect(() => {
    const id = window.setInterval(refreshSky, SKY_REFRESH_MS);
    const onFocus = () => refreshSky();
    window.addEventListener('focus', onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, [refreshSky]);

  const loc = location;
  const sky = buildJournalSky(now, loc?.lat, loc?.lon);
  let chart: PlanetaryHoursChart | null = null;
  if (loc) {
    chart = buildPlanetaryHours(now, loc.lat, loc.lon, now);
  }

  const hourRemainingMs = chart?.currentHour
    ? chart.currentHour.end.getTime() - now.getTime()
    : null;

  const requestGeo = () => {
    setGeoStatus(null);
    if (!navigator.geolocation) {
      setGeoStatus('Geolocation is not available in this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void saveLocation(pos.coords.latitude, pos.coords.longitude)
          .then(() => {
            setGeoStatus(
              isAuthenticated
                ? 'Location saved to your account.'
                : 'Location saved on this device. Sign in to sync.'
            );
            refreshSky();
          })
          .catch(() => {
            setGeoStatus('Could not save location.');
          });
      },
      () => {
        setGeoStatus('Unable to read location.');
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  };

  const loadWorkings = useCallback(async () => {
    if (!isAuthenticated) {
      setWorkings([]);
      return;
    }
    setWorkingsLoading(true);
    setWorkingsError(null);
    try {
      const res = await apiFetch('/api/journal/entries?type=working&limit=40');
      if (!res.ok) {
        throw new Error('Failed to load workings');
      }
      const data = (await res.json()) as { entries: JournalEntry[] };
      const ongoing = (data.entries ?? []).filter(
        (e) => e.status === 'active' || e.status === 'paused'
      );
      setWorkings(ongoing);
    } catch {
      setWorkingsError('Could not load workings.');
      setWorkings([]);
    } finally {
      setWorkingsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void loadWorkings();
  }, [loadWorkings]);

  const drawCard = () => {
    const shuffled = shuffleDeck(TAROT_DECK);
    setDealt({
      card: shuffled[0],
      isReversed: Math.random() < REVERSAL_CHANCE,
      position: 'Guidance',
      isFlipped: false,
    });
  };

  const quickSummary = useMemo(() => {
    if (!dealt?.isFlipped) return null;
    return summarizeReading([dealt], 'single');
  }, [dealt]);

  const openJournal = (filter: JournalEntryType | 'all' = 'all') => {
    onNavigate('journal', { filter });
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl text-ananael-gold">Magical OS</h1>
        <p className="mt-1 text-sm text-ananael-muted">
          Sanctum overview — sky conditions, quick tools, and paths into every
          module.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Sky clock */}
        <section className={tileClassName('sm:col-span-2 lg:col-span-2')}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-lg text-ananael-gold">
                Sky clock
              </h2>
              <p className="mt-0.5 text-xs text-ananael-muted">
                Moon and planetary day / hour
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {!loc && (
                <TileLink
                  label="Use my location"
                  onClick={requestGeo}
                  tone="bronze"
                />
              )}
              <TileLink
                label="Planetary Hours"
                onClick={() => onNavigate('planetary')}
                tone="gold"
              />
            </div>
          </div>

          <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-ananael-muted">
                Moon
              </dt>
              <dd className="mt-1 text-zinc-100">
                {sky.moonPhase ?? '—'}
                {sky.moonIllum != null && (
                  <span className="ml-1 text-sm text-ananael-muted">
                    ({Math.round(sky.moonIllum * 100)}%)
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-ananael-muted">
                Day ruler
              </dt>
              <dd className="mt-1 text-zinc-100">{sky.dayRuler ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-ananael-muted">
                Hour ruler
              </dt>
              <dd className="mt-1 text-zinc-100">
                {chart?.currentHour
                  ? `${chart.currentHour.planet} (${chart.currentHour.segment} ${chart.currentHour.hourOfSegment})`
                  : sky.hourRuler ?? 'Set location'}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-ananael-muted">
                Until next hour
              </dt>
              <dd className="mt-1 text-zinc-100">
                {hourRemainingMs != null && chart?.currentHour
                  ? `${formatRemaining(hourRemainingMs)} · ends ${formatTime(chart.currentHour.end)}`
                  : '—'}
              </dd>
            </div>
          </dl>

          {!loc && (
            <p className="mt-3 text-xs text-ananael-muted">
              Set a location (here or in Planetary Hours) for the current
              planetary hour
              {isAuthenticated
                ? ' — it is saved to your account.'
                : '. Sign in to sync location across devices.'}
            </p>
          )}
          {geoStatus && (
            <p className="mt-2 text-xs text-zinc-500">{geoStatus}</p>
          )}
          {loc && (
            <p className="mt-3 text-[11px] text-ananael-muted">
              Using {loc.lat.toFixed(4)}, {loc.lon.toFixed(4)}
              {isAuthenticated ? ' (account)' : ' (this device)'}
            </p>
          )}
        </section>

        {/* Quick tarot */}
        <section className={tileClassName()}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="font-display text-lg text-ananael-gold">
                Quick tarot
              </h2>
              <p className="mt-0.5 text-xs text-ananael-muted">
                Single-card guidance
              </p>
            </div>
            <TileLink
              label="Full Tarot"
              onClick={() => onNavigate('tarot')}
              tone="gold"
            />
          </div>

          <div className="mt-4 flex flex-col items-center gap-3">
            {dealt ? (
              <TarotCard
                dealt={dealt}
                deckStyle={deckStyle}
                onFlip={() =>
                  setDealt((prev) =>
                    prev ? { ...prev, isFlipped: true } : prev
                  )
                }
              />
            ) : (
              <div className="flex h-[220px] w-[140px] items-center justify-center rounded-lg border border-dashed border-ananael-border/70 text-center text-xs text-ananael-muted sm:w-[160px]">
                Draw a card
              </div>
            )}
            <button
              type="button"
              onClick={drawCard}
              className="rounded-md border border-ananael-bronze/60 px-4 py-2 text-sm text-zinc-200 transition hover:bg-ananael-panel hover:text-ananael-gold"
            >
              {dealt ? 'Draw again' : 'Draw'}
            </button>
            {quickSummary && (
              <div className="w-full space-y-2 border-t border-ananael-border/40 pt-3 text-left">
                <p className="text-xs leading-relaxed text-zinc-300">
                  {quickSummary.walkthrough[0]}
                </p>
                {quickSummary.correspondences[0] && (
                  <p className="text-[11px] leading-relaxed text-ananael-muted">
                    {quickSummary.correspondences[0]}
                  </p>
                )}
                {quickSummary.prompts[0] && (
                  <p className="text-[11px] leading-relaxed text-ananael-gold/80">
                    {quickSummary.prompts[0]}
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Magical Journal */}
        <section className={tileClassName()}>
          <h2 className="font-display text-lg text-ananael-gold">
            Magical Journal
          </h2>
          <p className="mt-1 text-sm text-ananael-muted">
            Rituals, dreams, divinatory saves, and notes in one ledger.
          </p>
          {!isAuthenticated && (
            <p className="mt-3 text-xs text-ananael-muted">
              Sign in from the account menu to read and write journal entries.
            </p>
          )}
          <div className="mt-4">
            <TileLink
              label="Open journal"
              onClick={() => openJournal('all')}
              tone="bronze"
            />
          </div>
        </section>

        {/* Active workings */}
        <section className={tileClassName()}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="font-display text-lg text-ananael-gold">
                Active workings
              </h2>
              <p className="mt-0.5 text-xs text-ananael-muted">
                Ongoing journal workings
              </p>
            </div>
            {isAuthenticated && (
              <TileLink
                label="View all"
                onClick={() => openJournal('working')}
                tone="violet"
              />
            )}
          </div>

          {!isAuthenticated ? (
            <p className="mt-3 text-xs text-ananael-muted">
              Sign in to track active and paused workings.
            </p>
          ) : workingsLoading ? (
            <p className="mt-3 text-xs text-ananael-muted">Loading…</p>
          ) : workingsError ? (
            <p className="mt-3 text-xs text-red-400/90">{workingsError}</p>
          ) : workings.length === 0 ? (
            <p className="mt-3 text-xs text-ananael-muted">
              No active or paused workings. Log one in the journal.
            </p>
          ) : (
            <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto">
              {workings.map((entry) => (
                <li key={entry._id}>
                  <button
                    type="button"
                    onClick={() => openJournal('working')}
                    className="flex w-full items-center justify-between gap-2 rounded-md border border-ananael-border/50 bg-ananael-bg/40 px-3 py-2 text-left text-sm transition hover:border-ananael-violet/50"
                  >
                    <span className="truncate text-zinc-200">
                      {entry.title?.trim() || 'Untitled working'}
                    </span>
                    <span
                      className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wider ${
                        entry.status === 'active'
                          ? 'border-ananael-gold/40 text-ananael-gold'
                          : 'border-zinc-600 text-zinc-400'
                      }`}
                    >
                      {entry.status}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Correspondences */}
        <section className={tileClassName()}>
          <h2 className="font-display text-lg text-ananael-gold">
            Correspondences
          </h2>
          <p className="mt-1 text-sm text-ananael-muted">
            Liber 777 key scale — search planets, letters, angels, and more.
          </p>
          <div className="mt-4">
            <TileLink
              label="Open correspondences"
              onClick={() => onNavigate('correspondences')}
              tone="violet"
            />
          </div>
        </section>

        {/* Ritual builders */}
        <section className={tileClassName('sm:col-span-2 lg:col-span-1')}>
          <h2 className="font-display text-lg text-ananael-gold">
            Ritual builders
          </h2>
          <p className="mt-1 text-sm text-ananael-muted">
            Altar layouts and Solomonic circle geometry.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <TileLink
              label="Ritual Space"
              onClick={() => onNavigate('ritual')}
              tone="bronze"
            />
            <TileLink
              label="Solomonic Circles"
              onClick={() => onNavigate('solomonic')}
              tone="bronze"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
