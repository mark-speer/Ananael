import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { shuffleDeck, TAROT_DECK } from '../data/tarotDeck';
import { loadDeckStyle } from '../data/tarotDeckArt';
import { apiFetch } from '../lib/api';
import { buildDayCounsel, nextMonthHighlight } from '../lib/almanac';
import { buildJournalSky } from '../lib/journalSky';
import type { JournalEntry, JournalEntryType } from '../lib/journal';
import {
  buildPlanetaryHours,
  formatTime,
  type PlanetaryHoursChart,
} from '../lib/planetaryHours';
import {
  formatNatalSummaryLine,
  WESTERN_SIGN_GLYPHS,
} from '../lib/natalChart';
import {
  fullNatalChartFromProfile,
  natalAlmanacContextFromProfile,
} from '../lib/natalPersonalization';
import { summarizeReading } from '../lib/tarotSummary';
import type { OpusStageId } from '../data/alchemy';
import type { TemplateId } from '../data/ritualTools';
import type { LiturgyMode } from '../lib/ritualRunner';
import { isRitualRunnerPayload } from '../lib/ritualRunner';
import { isShamanicJourneyPayload } from '../lib/shamanismJourney';
import { suggestedWorldFromSky } from '../lib/shamanism';
import { getWorld } from '../data/shamanism';
import { suggestEasternRite } from '../lib/subtleBodyCounsel';
import type { ModuleId } from './Sidebar';
import TarotCard, { type DealtCard } from './TarotCard';

const REVERSAL_CHANCE = 0.2;
const SKY_REFRESH_MS = 60_000;

export interface DashboardNavigateOptions {
  filter?: JournalEntryType | 'all';
  entryId?: string;
  gematriaPrefill?: string;
  correspondencesQuery?: string;
  divinationTab?: 'tarot' | 'iching' | 'geomancy' | 'runes';
  planetaryPanel?:
    | 'hours'
    | 'planets'
    | 'zodiac'
    | 'elections'
    | 'almanac'
    | 'natal';
  ritualTemplate?: TemplateId;
  atelierTab?: 'ritual' | 'solomonic' | 'talisman';
  opusPane?: 'stages' | 'vessel' | 'emblem';
  stageId?: OpusStageId;
  metal?: string;
  riteId?: string;
  runEntryId?: string;
  liturgyMode?: LiturgyMode;
  subtleBodyPane?: 'chakras' | 'meridians' | 'maps' | 'neidan' | 'practice';
  subtleBodyFocus?: string;
  shamanismPane?:
    | 'worlds'
    | 'directions'
    | 'allies'
    | 'journey'
    | 'cast'
    | 'practice';
  shamanismFocus?: string;
};

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
    'rounded-lg border border-ananael-border/70 bg-ananael-panel p-4',
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
  const { isAuthenticated, location, saveLocation, natal } = useAuth();
  const [now, setNow] = useState(() => new Date());
  const [dealt, setDealt] = useState<DealtCard | null>(null);
  const [deckStyle] = useState(() => loadDeckStyle());
  const [workings, setWorkings] = useState<JournalEntry[]>([]);
  const [workingsError, setWorkingsError] = useState<string | null>(null);
  const [workingsLoading, setWorkingsLoading] = useState(false);
  const [vesselCount, setVesselCount] = useState(0);
  const [userCount, setUserCount] = useState<number | null>(null);
  const [onlineCount, setOnlineCount] = useState<number | null>(null);
  const [geoStatus, setGeoStatus] = useState<string | null>(null);
  const [corrQuery, setCorrQuery] = useState('');

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

  const natalCtx = useMemo(
    () => natalAlmanacContextFromProfile(natal),
    [natal]
  );
  const fullNatal = useMemo(
    () => fullNatalChartFromProfile(natal),
    [natal]
  );

  const dayCounsel = useMemo(
    () => buildDayCounsel(now, loc?.lat, loc?.lon, natalCtx),
    [now, loc?.lat, loc?.lon, natalCtx]
  );

  const easternRiteSuggestion = useMemo(
    () =>
      suggestEasternRite(
        now,
        (dayCounsel.sky.moonPhase as import('../lib/moonPhase').MoonPhaseName) ??
          'New Moon',
        dayCounsel.sky.nakshatra
      ),
    [now, dayCounsel.sky.moonPhase, dayCounsel.sky.nakshatra]
  );

  const nextHighlight = useMemo(
    () => nextMonthHighlight(now, now.getFullYear(), now.getMonth()),
    [now]
  );

  const opusWorkingCount = useMemo(
    () =>
      workings.filter(
        (w) =>
          w.tags?.includes('opus') ||
          w.entities?.some((e) => e.kind === 'opusStage')
      ).length,
    [workings]
  );

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
      setVesselCount(0);
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
    try {
      const vRes = await apiFetch('/api/opus/vessels');
      if (vRes.ok) {
        const vData = (await vRes.json()) as { vessels?: unknown[] };
        setVesselCount((vData.vessels ?? []).length);
      }
    } catch {
      setVesselCount(0);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void loadWorkings();
  }, [loadWorkings]);

  useEffect(() => {
    let cancelled = false;

    const loadUserCount = async () => {
      try {
        const res = await apiFetch('/api/auth/user-count');
        if (!res.ok) return;
        const data = (await res.json()) as {
          count?: number;
          online?: number;
        };
        if (
          !cancelled &&
          typeof data.count === 'number' &&
          typeof data.online === 'number'
        ) {
          setUserCount(data.count);
          setOnlineCount(data.online);
        }
      } catch {
        /* leave counts null on failure */
      }
    };

    void loadUserCount();
    const id = window.setInterval(() => {
      void loadUserCount();
    }, SKY_REFRESH_MS);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

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

  const openJournal = (
    filter: JournalEntryType | 'all' = 'all',
    entryId?: string
  ) => {
    onNavigate('journal', { filter, entryId });
  };

  const correspondencesPrefill =
    sky.hourRuler?.trim() || sky.dayRuler?.trim() || '';

  const openAthanorStages = () => {
    onNavigate('opus', {
      opusPane: 'stages',
      stageId: dayCounsel.stageId,
      metal: dayCounsel.operation.metal,
    });
  };

  const skyMetricBtn =
    'mt-1 block w-full rounded-md text-left text-zinc-100 transition hover:text-ananael-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ananael-violet';

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ananael-gold">Magical OS</h1>
          <p className="mt-1 text-sm text-ananael-muted">
            Sanctum overview — sky conditions, quick tools, and paths into every
            module.
          </p>
        </div>
        {userCount !== null && onlineCount !== null && (
          <p className="shrink-0 pt-1 text-xs text-ananael-muted">
            {onlineCount} / {userCount} practitioners online
          </p>
        )}
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
                Moon, planetary hour, Sun sign, and day pillar
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
                label="Almanac"
                onClick={() =>
                  onNavigate('planetary', { planetaryPanel: 'almanac' })
                }
                tone="gold"
              />
              <TileLink
                label="Elections"
                onClick={() =>
                  onNavigate('planetary', { planetaryPanel: 'elections' })
                }
                tone="violet"
              />
            </div>
          </div>

          <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-ananael-muted">
                Moon
              </dt>
              <dd>
                <button
                  type="button"
                  className={skyMetricBtn}
                  onClick={() =>
                    onNavigate('planetary', { planetaryPanel: 'zodiac' })
                  }
                >
                  {sky.moonPhase ?? '—'}
                  {sky.moonIllum != null && (
                    <span className="ml-1 text-sm text-ananael-muted">
                      ({Math.round(sky.moonIllum * 100)}%)
                    </span>
                  )}
                </button>
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-ananael-muted">
                Day ruler
              </dt>
              <dd>
                <button
                  type="button"
                  className={skyMetricBtn}
                  onClick={() =>
                    onNavigate('planetary', { planetaryPanel: 'planets' })
                  }
                >
                  {sky.dayRuler ?? '—'}
                </button>
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-ananael-muted">
                Hour ruler
              </dt>
              <dd>
                <button
                  type="button"
                  className={skyMetricBtn}
                  onClick={() =>
                    onNavigate('planetary', { planetaryPanel: 'hours' })
                  }
                >
                  {chart?.currentHour
                    ? `${chart.currentHour.planet} (${chart.currentHour.segment} ${chart.currentHour.hourOfSegment})`
                    : sky.hourRuler ?? 'Set location'}
                </button>
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-ananael-muted">
                Until next hour
              </dt>
              <dd>
                <button
                  type="button"
                  className={skyMetricBtn}
                  onClick={() =>
                    onNavigate('planetary', { planetaryPanel: 'hours' })
                  }
                >
                  {hourRemainingMs != null && chart?.currentHour
                    ? `${formatRemaining(hourRemainingMs)} · ends ${formatTime(chart.currentHour.end)}`
                    : '—'}
                </button>
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-ananael-muted">
                Sun
              </dt>
              <dd>
                <button
                  type="button"
                  className={skyMetricBtn}
                  onClick={() =>
                    onNavigate('planetary', { planetaryPanel: 'zodiac' })
                  }
                >
                  {sky.sunSign ?? '—'}
                </button>
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-ananael-muted">
                Day pillar
              </dt>
              <dd>
                <button
                  type="button"
                  className={skyMetricBtn}
                  onClick={() =>
                    onNavigate('planetary', { planetaryPanel: 'zodiac' })
                  }
                >
                  {sky.chineseDay ?? '—'}
                </button>
              </dd>
            </div>
          </dl>

          {!loc && (
            <p className="mt-3 text-xs text-ananael-muted">
              Set a location (here or in Celestial Timing) for the current
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

        {/* Magical Almanac */}
        <section className={tileClassName('sm:col-span-2 lg:col-span-1')}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="font-display text-lg text-ananael-gold">
                Magical Almanac
              </h2>
              <p className="mt-0.5 text-xs text-ananael-muted">
                Today&apos;s counsel under the sky
              </p>
            </div>
            <TileLink
              label="Open Almanac"
              onClick={() =>
                onNavigate('planetary', { planetaryPanel: 'almanac' })
              }
              tone="gold"
            />
          </div>
          <p className="mt-4 text-sm leading-relaxed text-zinc-300">
            <span className="text-ananael-gold">
              Day of {dayCounsel.sky.dayRuler ?? '—'}.
            </span>{' '}
            {dayCounsel.dayTheme}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            {dayCounsel.moonTheme}
          </p>
          <button
            type="button"
            onClick={openAthanorStages}
            className="mt-3 block w-full rounded-md text-left text-sm leading-relaxed text-zinc-300 transition hover:text-ananael-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ananael-violet"
          >
            <span className="text-[11px] uppercase tracking-wider text-ananael-violet">
              Operation
            </span>
            <span className="mt-1 block">{dayCounsel.alchemyTheme}</span>
          </button>
          <p className="mt-2 text-xs italic text-ananael-muted">
            {dayCounsel.operation.axiom}
          </p>
          {dayCounsel.natalAffinity && (
            <p className="mt-3 rounded-md border border-ananael-gold/40 bg-ananael-gold/10 px-2.5 py-2 text-xs text-zinc-200">
              <span className="text-[11px] uppercase tracking-wider text-ananael-gold">
                Natal ·{' '}
              </span>
              {dayCounsel.natalAffinity}
            </p>
          )}
          {dayCounsel.natalSubtleBodyAffinity && (
            <p className="mt-3 rounded-md border border-ananael-violet/40 bg-ananael-violet/10 px-2.5 py-2 text-xs text-zinc-200">
              <span className="text-[11px] uppercase tracking-wider text-ananael-violet">
                Natal subtle body ·{' '}
              </span>
              {dayCounsel.natalSubtleBodyAffinity}
            </p>
          )}
          {dayCounsel.subtleBodyTheme && (
            <p className="mt-3 rounded-md border border-ananael-violet/30 bg-ananael-violet/10 px-2.5 py-2 text-xs text-zinc-200">
              <span className="text-[11px] uppercase tracking-wider text-ananael-violet">
                Subtle body ·{' '}
              </span>
              {dayCounsel.subtleBodyTheme}{' '}
              <button
                type="button"
                onClick={() =>
                  onNavigate('subtleBody', { subtleBodyPane: 'meridians' })
                }
                className="text-ananael-gold hover:underline"
              >
                Atlas
              </button>
              {' · '}
              <button
                type="button"
                onClick={() =>
                  onNavigate('liturgy', {
                    riteId: easternRiteSuggestion.riteId,
                    liturgyMode: 'run',
                  })
                }
                className="text-ananael-gold hover:underline"
              >
                {easternRiteSuggestion.label}
              </button>
            </p>
          )}
          {dayCounsel.shamanismTheme && (
            <p className="mt-3 rounded-md border border-ananael-violet/30 bg-ananael-violet/10 px-2.5 py-2 text-xs text-zinc-200">
              <span className="text-[11px] uppercase tracking-wider text-ananael-violet">
                Journey ·{' '}
              </span>
              {dayCounsel.shamanismTheme}{' '}
              <button
                type="button"
                onClick={() =>
                  onNavigate('shamanism', { shamanismPane: 'journey' })
                }
                className="text-ananael-gold hover:underline"
              >
                Journey
              </button>
            </p>
          )}
          {nextHighlight && (
            <p className="mt-3 text-xs text-ananael-violet">
              Next: {nextHighlight.label} ·{' '}
              {nextHighlight.when.toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          )}
        </section>

        {fullNatal && (
          <section className={tileClassName()}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="font-display text-lg text-ananael-gold">
                  Natal chart
                </h2>
                <p className="mt-0.5 text-xs text-ananael-muted">
                  Whole Sign · your saved birth figure
                </p>
              </div>
              <TileLink
                label="Open Natal"
                onClick={() =>
                  onNavigate('planetary', { planetaryPanel: 'natal' })
                }
                tone="gold"
              />
            </div>
            <p className="mt-4 text-sm text-zinc-200">
              {formatNatalSummaryLine(fullNatal)}
            </p>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-ananael-muted">
                  Sun
                </dt>
                <dd className="text-zinc-100">
                  {fullNatal.sunSign
                    ? `${WESTERN_SIGN_GLYPHS[fullNatal.sunSign]} ${fullNatal.sunSign}`
                    : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-ananael-muted">
                  Asc
                </dt>
                <dd className="text-zinc-100">
                  {fullNatal.ascendant
                    ? `${WESTERN_SIGN_GLYPHS[fullNatal.ascendant.sign]} ${fullNatal.ascendant.sign}`
                    : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-ananael-muted">
                  Ruler
                </dt>
                <dd className="text-zinc-100">
                  {fullNatal.hermetic?.planet ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-ananael-muted">
                  Year
                </dt>
                <dd className="text-zinc-100">{fullNatal.chineseYearLabel}</dd>
              </div>
            </dl>
            {dayCounsel.natalAffinity && (
              <p className="mt-3 text-xs text-ananael-violet">
                Today: favor hours of {fullNatal.hermetic?.planet ?? 'your ruler'}{' '}
                when electing.
              </p>
            )}
          </section>
        )}

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
            <div className="flex flex-wrap gap-2">
              <TileLink
                label="Tarot"
                onClick={() =>
                  onNavigate('divination', { divinationTab: 'tarot' })
                }
                tone="gold"
              />
              <TileLink
                label="I Ching"
                onClick={() =>
                  onNavigate('divination', { divinationTab: 'iching' })
                }
                tone="violet"
              />
              <TileLink
                label="Geomancy"
                onClick={() =>
                  onNavigate('divination', { divinationTab: 'geomancy' })
                }
                tone="bronze"
              />
              <TileLink
                label="Runes"
                onClick={() =>
                  onNavigate('divination', { divinationTab: 'runes' })
                }
                tone="bronze"
              />
            </div>
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
              {workings.map((entry) => {
                const runner = isRitualRunnerPayload(entry.payload);
                const journey = isShamanicJourneyPayload(entry.payload);
                return (
                  <li key={entry._id}>
                    <div className="flex items-center gap-2 rounded-md border border-ananael-border/50 bg-ananael-bg px-3 py-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (runner) {
                            onNavigate('liturgy', {
                              liturgyMode: 'run',
                              riteId: entry.payload!.riteId as string,
                              runEntryId: entry._id,
                            });
                            return;
                          }
                          if (journey) {
                            onNavigate('shamanism', {
                              shamanismPane: 'journey',
                              runEntryId: entry._id,
                            });
                            return;
                          }
                          openJournal('working', entry._id);
                        }}
                        className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left text-sm transition hover:opacity-90"
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
                          {runner || journey ? 'Resume' : entry.status}
                        </span>
                      </button>
                      {(runner || journey) && (
                        <button
                          type="button"
                          onClick={() => openJournal('working', entry._id)}
                          className="shrink-0 text-[10px] uppercase tracking-wider text-ananael-muted underline hover:text-zinc-300"
                        >
                          Journal
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Subtle Body */}
        <section className={tileClassName()}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="font-display text-lg text-ananael-gold">
                Subtle Body
              </h2>
              <p className="mt-0.5 text-xs text-ananael-muted">
                Chakras, meridians, neidan study
              </p>
            </div>
            <TileLink
              label="Open atlas"
              onClick={() => onNavigate('subtleBody')}
              tone="violet"
            />
          </div>
          <p className="mt-3 text-sm text-zinc-300">
            Eastern internal work across traditions — comparative maps to the
            Tree and I Ching, plus guided rites in the Ritual Library.
          </p>
          <p className="mt-2 text-xs text-ananael-muted">
            Today: {easternRiteSuggestion.reason} — try{' '}
            <button
              type="button"
              onClick={() =>
                onNavigate('liturgy', {
                  riteId: easternRiteSuggestion.riteId,
                  liturgyMode: 'run',
                })
              }
              className="text-ananael-gold hover:underline"
            >
              {easternRiteSuggestion.label}
            </button>
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <TileLink
              label="Chakras"
              onClick={() =>
                onNavigate('subtleBody', { subtleBodyPane: 'chakras' })
              }
              tone="gold"
            />
            <TileLink
              label="Qigong rites"
              onClick={() =>
                onNavigate('liturgy', {
                  riteId: 'ba-duan-jin',
                  liturgyMode: 'browse',
                })
              }
              tone="bronze"
            />
          </div>
        </section>

        {/* Shamanism */}
        <section className={tileClassName()}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="font-display text-lg text-ananael-gold">
                Shamanism
              </h2>
              <p className="mt-0.5 text-xs text-ananael-muted">
                Three worlds, journey, lots
              </p>
            </div>
            <TileLink
              label="Open chamber"
              onClick={() => onNavigate('shamanism')}
              tone="violet"
            />
          </div>
          <p className="mt-3 text-sm text-zinc-300">
            {(() => {
              const worldId = suggestedWorldFromSky({
                hourRuler: chart?.currentHour?.planet ?? sky.hourRuler,
                dayRuler: sky.dayRuler,
                moonPhase: sky.moonPhase,
                hourSegment: chart?.currentHour?.segment,
              });
              const world = getWorld(worldId);
              return `Suggested world: ${world?.name ?? 'Middle World'} — study weather, not a command.`;
            })()}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <TileLink
              label="Journey"
              onClick={() =>
                onNavigate('shamanism', { shamanismPane: 'journey' })
              }
              tone="gold"
            />
            <TileLink
              label="Worlds"
              onClick={() =>
                onNavigate('shamanism', { shamanismPane: 'worlds' })
              }
              tone="bronze"
            />
            <TileLink
              label="Quarters rite"
              onClick={() =>
                onNavigate('liturgy', {
                  riteId: 'shamanic-quarters',
                  liturgyMode: 'browse',
                })
              }
              tone="violet"
            />
          </div>
        </section>

        {/* Correspondences */}
        <section className={tileClassName()}>
          <h2 className="font-display text-lg text-ananael-gold">
            Correspondences
          </h2>
          <p className="mt-1 text-sm text-ananael-muted">
            Liber 777 key scale — search planets, letters, angels, deities,
            hexagrams, and more.
          </p>
          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              const q = corrQuery.trim() || correspondencesPrefill;
              onNavigate('correspondences', {
                correspondencesQuery: q || undefined,
              });
            }}
          >
            <label className="block">
              <span className="sr-only">Search correspondences</span>
              <input
                type="search"
                value={corrQuery}
                onChange={(e) => setCorrQuery(e.target.value)}
                placeholder={
                  correspondencesPrefill
                    ? `Search — e.g. ${correspondencesPrefill}`
                    : 'Search — e.g. Venus, Netzach…'
                }
                className="w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-ananael-muted focus:border-ananael-violet"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <TileLink
                label="Search"
                onClick={() => {
                  const q = corrQuery.trim() || correspondencesPrefill;
                  onNavigate('correspondences', {
                    correspondencesQuery: q || undefined,
                  });
                }}
                tone="violet"
              />
              <TileLink
                label="Open correspondences"
                onClick={() =>
                  onNavigate('correspondences', {
                    correspondencesQuery: correspondencesPrefill || undefined,
                  })
                }
                tone="bronze"
              />
            </div>
          </form>
        </section>

        {/* Athanor */}
        <section className={tileClassName()}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="font-display text-lg text-ananael-gold">Athanor</h2>
              <p className="mt-0.5 text-xs text-ananael-muted">
                Opus stage · metal · principle
              </p>
            </div>
            <TileLink
              label="Open Athanor"
              onClick={openAthanorStages}
              tone="gold"
            />
          </div>
          <button
            type="button"
            onClick={openAthanorStages}
            className="mt-4 block w-full rounded-md text-left text-sm leading-relaxed text-zinc-300 transition hover:text-ananael-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ananael-violet"
          >
            <span className="text-ananael-gold">
              {dayCounsel.operation.stage.name}
            </span>
            {' · '}
            {dayCounsel.operation.metal}
            {' · '}
            {dayCounsel.operation.principle.name}
          </button>
          <p className="mt-2 text-xs text-zinc-400">
            {dayCounsel.alchemyTheme}
          </p>
          {isAuthenticated && (
            <p className="mt-2 text-xs text-ananael-muted">
              {vesselCount > 0
                ? `${vesselCount} saved vessel${vesselCount === 1 ? '' : 's'}`
                : 'No saved vessels yet'}
              {' · '}
              {opusWorkingCount} active opus working
              {opusWorkingCount === 1 ? '' : 's'}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <TileLink
              label="Vessel"
              onClick={() =>
                onNavigate('opus', {
                  opusPane: 'vessel',
                  stageId: dayCounsel.stageId,
                  metal: dayCounsel.operation.metal,
                })
              }
              tone="violet"
            />
            <TileLink
              label="Emblem"
              onClick={() => onNavigate('opus', { opusPane: 'emblem' })}
              tone="bronze"
            />
          </div>
        </section>

        {/* Study tools */}
        <section className={tileClassName()}>
          <h2 className="font-display text-lg text-ananael-gold">
            Study tools
          </h2>
          <p className="mt-1 text-sm text-ananael-muted">
            Calculation, scripts, and the Tree of Life.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <TileLink
              label="Gematria"
              onClick={() => onNavigate('gematria')}
              tone="violet"
            />
            <TileLink
              label="Script Translator"
              onClick={() => onNavigate('translator')}
              tone="bronze"
            />
            <TileLink
              label="Tree of Life"
              onClick={() => onNavigate('tree')}
              tone="gold"
            />
          </div>
        </section>

        {/* Ritual builders */}
        <section className={tileClassName('sm:col-span-2 lg:col-span-1')}>
          <h2 className="font-display text-lg text-ananael-gold">
            Ritual builders
          </h2>
          <p className="mt-1 text-sm text-ananael-muted">
            Altar layouts, Solomonic circles, talismans, Enochian, liturgy, and
            the athanor.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <TileLink
              label="Ritual Space"
              onClick={() =>
                onNavigate('ritual', { ritualTemplate: 'lbrp' })
              }
              tone="bronze"
            />
            <TileLink
              label="Circles"
              onClick={() => onNavigate('solomonic')}
              tone="bronze"
            />
            <TileLink
              label="Talismans"
              onClick={() => onNavigate('talisman')}
              tone="bronze"
            />
            <TileLink
              label="Athanor"
              onClick={openAthanorStages}
              tone="gold"
            />
            <TileLink
              label="Enochian"
              onClick={() => onNavigate('enochian')}
              tone="violet"
            />
            <TileLink
              label="Ritual Library"
              onClick={() => onNavigate('liturgy')}
              tone="gold"
            />
            <TileLink
              label="Divination"
              onClick={() =>
                onNavigate('divination', { divinationTab: 'tarot' })
              }
              tone="gold"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
