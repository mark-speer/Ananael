import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import {
  buildChinesePillars,
  formatPillar,
  formatPillarShort,
} from '../lib/chineseAstrology';
import {
  buildSkySnapshot,
  formatBodyRow,
  getBody,
} from '../lib/celestialEphemeris';
import {
  formatNakshatra,
  formatSiderealPosition,
  nakshatraFromSidereal,
  siderealFromTropical,
} from '../lib/hinduAstrology';
import {
  buildPlanetaryHours,
  CHALDEAN_ORDER,
  formatTime,
  type PlanetId,
} from '../lib/planetaryHours';
import { loadPlanetaryLocation } from '../lib/planetaryLocation';
import { natalAlmanacContextFromProfile } from '../lib/natalPersonalization';
import { WESTERN_SIGN_GLYPHS } from '../lib/westernZodiac';
import type { JournalEntryType } from '../lib/journal';
import type { ModuleId } from './Sidebar';
import type { TreeNavigateOptions } from './TreeOfLifeModule';
import {
  buildDayCounsel,
  buildMonthDays,
  dayRulerShort,
  monthMarkers,
  moonPhaseShort,
  sameLocalDay,
  type AlmanacMarker,
} from '../lib/almanac';
import {
  findElectionWindows,
  type ElectionFilters,
} from '../lib/elections';
import { meridianPeakingAt } from '../data/meridians';
import NatalPanel from './NatalPanel';
import type { PlanetaryPanelId } from '../lib/planetaryPanel';

type PanelId = PlanetaryPanelId;

export type { PlanetaryPanelId };

type TimingNavigateOptions = TreeNavigateOptions & {
  planetaryPanel?: PanelId;
  filter?: JournalEntryType | 'all';
};

interface SavedChart {
  _id: string;
  name: string;
  date: string;
  config: Record<string, unknown>;
  notes?: string;
}

const PANEL_IDS: PanelId[] = [
  'hours',
  'planets',
  'zodiac',
  'elections',
  'almanac',
  'natal',
];

function toDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toTimeInputValue(d: Date): string {
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${min}`;
}

function initialCoords(authLoc: { lat: number; lon: number } | null): {
  lat: string;
  lon: string;
} {
  const saved = authLoc ?? loadPlanetaryLocation();
  if (saved) {
    return { lat: String(saved.lat), lon: String(saved.lon) };
  }
  return { lat: '40.7128', lon: '-74.0060' };
}

function formatAlt(alt: number | undefined): string {
  if (alt == null || !Number.isFinite(alt)) return '—';
  const sign = alt >= 0 ? '+' : '';
  return `${sign}${alt.toFixed(1)}°`;
}

interface CelestialTimingModuleProps {
  initialPanel?: PanelId;
  onNavigate?: (module: ModuleId, opts?: TimingNavigateOptions) => void;
}

/**
 * Celestial Timing: planetary hours, ephemeris, and Western / Hindu / Chinese zodiac.
 * Location syncs to the signed-in user profile when authenticated.
 */
export default function CelestialTimingModule({
  initialPanel = 'hours',
  onNavigate,
}: CelestialTimingModuleProps) {
  const { location: authLocation, saveLocation, isAuthenticated, natal } =
    useAuth();
  const nowInit = new Date();
  const coords = initialCoords(authLocation);
  const [latitude, setLatitude] = useState(coords.lat);
  const [longitude, setLongitude] = useState(coords.lon);
  const [dateStr, setDateStr] = useState(toDateInputValue(nowInit));
  const [timeStr, setTimeStr] = useState(toTimeInputValue(nowInit));
  const [geoStatus, setGeoStatus] = useState<string | null>(null);
  const [coordsTouched, setCoordsTouched] = useState(false);
  const [panel, setPanel] = useState<PanelId>(initialPanel);
  const [electionDay, setElectionDay] = useState<PlanetId | 'any'>('any');
  const [electionHour, setElectionHour] = useState<PlanetId>('Mercury');
  const [electionMoon, setElectionMoon] =
    useState<ElectionFilters['moon']>('any');
  const [avoidRetro, setAvoidRetro] = useState<PlanetId | 'none'>('none');
  const [electionPractice, setElectionPractice] =
    useState<ElectionFilters['practice']>('any');
  const [almanacCursor, setAlmanacCursor] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [chartName, setChartName] = useState('Untitled chart');
  const [chartNotes, setChartNotes] = useState('');
  const [savedChartId, setSavedChartId] = useState<string | null>(null);
  const [savedCharts, setSavedCharts] = useState<SavedChart[]>([]);
  const [chartSaving, setChartSaving] = useState(false);
  const [chartStatus, setChartStatus] = useState<string | null>(null);

  useEffect(() => {
    setPanel(initialPanel);
  }, [initialPanel]);

  const loadChartHistory = useCallback(async () => {
    if (!isAuthenticated) {
      setSavedCharts([]);
      return;
    }
    try {
      const res = await apiFetch('/api/planetary/charts');
      const data = (await res.json()) as {
        charts?: SavedChart[];
        message?: string;
      };
      if (!res.ok) throw new Error(data.message || 'Failed to load charts');
      setSavedCharts(data.charts ?? []);
    } catch (err) {
      setChartStatus(err instanceof Error ? err.message : 'History failed');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void loadChartHistory();
  }, [loadChartHistory]);

  const lat = Number(latitude);
  const lon = Number(longitude);
  const coordsValid =
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180;

  useEffect(() => {
    if (coordsTouched || !authLocation) return;
    setLatitude(String(authLocation.lat));
    setLongitude(String(authLocation.lon));
  }, [authLocation, coordsTouched]);

  useEffect(() => {
    if (!coordsTouched || !coordsValid) return;
    void saveLocation(lat, lon).catch(() => {
      setGeoStatus('Saved locally; could not sync to account.');
    });
  }, [lat, lon, coordsTouched, coordsValid, saveLocation]);

  const referenceNow = useMemo(() => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const [hh, mm] = timeStr.split(':').map(Number);
    return new Date(y, m - 1, d, hh, mm, 0, 0);
  }, [dateStr, timeStr]);

  const chart = useMemo(() => {
    if (!coordsValid) return null;
    return buildPlanetaryHours(referenceNow, lat, lon, referenceNow);
  }, [referenceNow, lat, lon, coordsValid]);

  const sky = useMemo(
    () =>
      buildSkySnapshot(
        referenceNow,
        coordsValid ? lat : undefined,
        coordsValid ? lon : undefined
      ),
    [referenceNow, lat, lon, coordsValid]
  );

  const pillars = useMemo(
    () => buildChinesePillars(referenceNow),
    [referenceNow]
  );

  const sun = getBody(sky, 'Sun');
  const moon = getBody(sky, 'Moon');
  const sunSidereal = sun
    ? siderealFromTropical(sun.longitude, referenceNow)
    : null;
  const moonSidereal = moon
    ? siderealFromTropical(moon.longitude, referenceNow)
    : null;
  const moonNakshatra = moonSidereal
    ? nakshatraFromSidereal(moonSidereal.longitude)
    : null;

  const requestGeo = () => {
    setGeoStatus(null);
    if (!navigator.geolocation) {
      setGeoStatus('Geolocation is not available in this browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const la = pos.coords.latitude;
        const lo = pos.coords.longitude;
        setCoordsTouched(true);
        setLatitude(la.toFixed(4));
        setLongitude(lo.toFixed(4));
        void saveLocation(la, lo)
          .then(() => {
            setGeoStatus(
              isAuthenticated
                ? 'Location applied and saved to your account.'
                : 'Location applied (sign in to sync across devices).'
            );
          })
          .catch(() => {
            setGeoStatus('Location applied locally; account sync failed.');
          });
      },
      () => {
        setGeoStatus('Unable to read location. Enter coordinates manually.');
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  };

  useEffect(() => {
    const today = toDateInputValue(new Date());
    if (dateStr !== today) return;
    const id = window.setInterval(() => {
      setTimeStr(toTimeInputValue(new Date()));
    }, 60000);
    return () => window.clearInterval(id);
  }, [dateStr]);

  const openSign = (sign: string) => {
    onNavigate?.('correspondences', { correspondencesQuery: sign });
  };

  const tabs: { id: PanelId; label: string }[] = [
    { id: 'hours', label: 'Hours' },
    { id: 'planets', label: 'Planets' },
    { id: 'zodiac', label: 'Zodiac' },
    { id: 'elections', label: 'Elections' },
    { id: 'almanac', label: 'Almanac' },
    { id: 'natal', label: 'Natal' },
  ];

  const electionWindows = useMemo(() => {
    if (!coordsValid || panel !== 'elections') return [];
    return findElectionWindows(referenceNow, lat, lon, {
      dayPlanet: electionDay,
      hourPlanet: electionHour,
      moon: electionMoon,
      avoidRetrograde: avoidRetro,
      practice: electionPractice,
    });
  }, [
    coordsValid,
    panel,
    referenceNow,
    lat,
    lon,
    electionDay,
    electionHour,
    electionMoon,
    avoidRetro,
    electionPractice,
  ]);

  const natalAlmanac = useMemo(
    () => natalAlmanacContextFromProfile(natal),
    [natal]
  );

  const almanacDays = useMemo(
    () =>
      buildMonthDays(
        almanacCursor.year,
        almanacCursor.month,
        coordsValid ? lat : undefined,
        coordsValid ? lon : undefined,
        natalAlmanac
      ),
    [
      almanacCursor.year,
      almanacCursor.month,
      coordsValid,
      lat,
      lon,
      natalAlmanac,
    ]
  );

  const almanacMarkers = useMemo(
    () => monthMarkers(almanacCursor.year, almanacCursor.month),
    [almanacCursor.year, almanacCursor.month]
  );

  const markersByDay = useMemo(() => {
    const map = new Map<number, AlmanacMarker[]>();
    for (const m of almanacMarkers) {
      const list = map.get(m.day) ?? [];
      list.push(m);
      map.set(m.day, list);
    }
    return map;
  }, [almanacMarkers]);

  const selectedAlmanacDay = useMemo(() => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return (
      almanacDays.find(
        (day) => day.year === y && day.month === m - 1 && day.day === d
      ) ?? null
    );
  }, [almanacDays, dateStr]);

  const dayCounsel = useMemo(() => {
    if (!selectedAlmanacDay) return null;
    return buildDayCounsel(
      selectedAlmanacDay.date,
      coordsValid ? lat : undefined,
      coordsValid ? lon : undefined,
      natalAlmanac
    );
  }, [selectedAlmanacDay, coordsValid, lat, lon, natalAlmanac]);

  const almanacDayElections = useMemo(() => {
    if (!coordsValid || !selectedAlmanacDay || panel !== 'almanac') return [];
    const dayStart = new Date(
      selectedAlmanacDay.year,
      selectedAlmanacDay.month,
      selectedAlmanacDay.day,
      0,
      0,
      0,
      0
    );
    return findElectionWindows(
      dayStart,
      lat,
      lon,
      {
        dayPlanet: selectedAlmanacDay.dayRuler,
        hourPlanet: selectedAlmanacDay.dayRuler,
        moon: 'any',
      },
      1
    ).slice(0, 6);
  }, [coordsValid, selectedAlmanacDay, panel, lat, lon]);

  const almanacMonthLabel = useMemo(
    () =>
      new Date(almanacCursor.year, almanacCursor.month, 1).toLocaleString(
        undefined,
        { month: 'long', year: 'numeric' }
      ),
    [almanacCursor.year, almanacCursor.month]
  );

  const almanacPadStart = useMemo(() => {
    return new Date(almanacCursor.year, almanacCursor.month, 1).getDay();
  }, [almanacCursor.year, almanacCursor.month]);

  const selectAlmanacDay = (year: number, month: number, day: number) => {
    const next = new Date(year, month, day);
    setAlmanacCursor({ year, month });
    setDateStr(toDateInputValue(next));
  };

  const shiftAlmanacMonth = (delta: number) => {
    const d = new Date(almanacCursor.year, almanacCursor.month + delta, 1);
    setAlmanacCursor({ year: d.getFullYear(), month: d.getMonth() });
  };

  const chartConfig = () => ({
    lat,
    lon,
    datetime: referenceNow.toISOString(),
    panel,
    elections: {
      day: electionDay,
      hour: electionHour,
      moon: electionMoon,
      avoidRetro,
      practice: electionPractice,
    },
    almanacCursor,
  });

  const saveChart = async () => {
    if (!isAuthenticated || !chartName.trim() || !coordsValid) return;
    setChartSaving(true);
    setChartStatus(null);
    try {
      const res = await apiFetch(
        savedChartId
          ? `/api/planetary/charts/${savedChartId}`
          : '/api/planetary/charts',
        {
          method: savedChartId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: chartName.trim(),
            config: chartConfig(),
            notes: chartNotes.trim(),
          }),
        }
      );
      const data = (await res.json()) as {
        chart?: SavedChart;
        message?: string;
      };
      if (!res.ok) throw new Error(data.message || 'Save failed');
      setSavedChartId(data.chart?._id ?? savedChartId);
      setChartStatus(savedChartId ? 'Chart updated.' : 'Chart saved.');
      await loadChartHistory();
    } catch (err) {
      setChartStatus(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setChartSaving(false);
    }
  };

  const loadChart = (saved: SavedChart) => {
    const cfg = saved.config ?? {};
    if (typeof cfg.lat === 'number' && Number.isFinite(cfg.lat)) {
      setCoordsTouched(true);
      setLatitude(String(cfg.lat));
    }
    if (typeof cfg.lon === 'number' && Number.isFinite(cfg.lon)) {
      setCoordsTouched(true);
      setLongitude(String(cfg.lon));
    }
    if (typeof cfg.datetime === 'string') {
      const d = new Date(cfg.datetime);
      if (!Number.isNaN(d.getTime())) {
        setDateStr(toDateInputValue(d));
        setTimeStr(toTimeInputValue(d));
        setAlmanacCursor({ year: d.getFullYear(), month: d.getMonth() });
      }
    }
    if (
      typeof cfg.panel === 'string' &&
      PANEL_IDS.includes(cfg.panel as PanelId)
    ) {
      setPanel(cfg.panel as PanelId);
    }
    const el =
      cfg.elections && typeof cfg.elections === 'object'
        ? (cfg.elections as Record<string, unknown>)
        : null;
    if (el) {
      if (el.day === 'any' || typeof el.day === 'string') {
        setElectionDay(el.day as PlanetId | 'any');
      }
      if (typeof el.hour === 'string') {
        setElectionHour(el.hour as PlanetId);
      }
      if (typeof el.moon === 'string') {
        setElectionMoon(el.moon as ElectionFilters['moon']);
      }
      if (el.avoidRetro === 'none' || typeof el.avoidRetro === 'string') {
        setAvoidRetro(el.avoidRetro as PlanetId | 'none');
      }
      if (
        el.practice === 'any' ||
        el.practice === 'meridian-peak' ||
        el.practice === 'yin-moon' ||
        el.practice === 'journey-night'
      ) {
        setElectionPractice(el.practice);
      }
    }
    const cursor =
      cfg.almanacCursor && typeof cfg.almanacCursor === 'object'
        ? (cfg.almanacCursor as { year?: number; month?: number })
        : null;
    if (
      cursor &&
      typeof cursor.year === 'number' &&
      typeof cursor.month === 'number'
    ) {
      setAlmanacCursor({ year: cursor.year, month: cursor.month });
    }
    setSavedChartId(saved._id);
    setChartName(saved.name);
    setChartNotes(saved.notes ?? '');
    setChartStatus(null);
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-2xl text-ananael-gold sm:text-3xl">
          Celestial Timing
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ananael-muted">
          Planetary hours, live ephemeris, Western / Hindu / Chinese zodiac,
          elections, and a Magical Almanac for your place and moment.
          Calculations run in your browser
          {isAuthenticated
            ? '; location syncs to your account, and you can bookmark charts.'
            : '; sign in to save location and bookmark charts.'}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block text-sm text-ananael-muted">
          Latitude
          <input
            type="number"
            step="any"
            value={latitude}
            onChange={(e) => {
              setCoordsTouched(true);
              setLatitude(e.target.value);
            }}
            className="mt-1 w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet"
          />
        </label>
        <label className="block text-sm text-ananael-muted">
          Longitude
          <input
            type="number"
            step="any"
            value={longitude}
            onChange={(e) => {
              setCoordsTouched(true);
              setLongitude(e.target.value);
            }}
            className="mt-1 w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet"
          />
        </label>
        <label className="block text-sm text-ananael-muted">
          Date
          <input
            type="date"
            value={dateStr}
            onChange={(e) => {
              const v = e.target.value;
              setDateStr(v);
              const [y, m] = v.split('-').map(Number);
              if (Number.isFinite(y) && Number.isFinite(m)) {
                setAlmanacCursor({ year: y, month: m - 1 });
              }
            }}
            className="mt-1 w-full min-w-0 max-w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet"
          />
        </label>
        <label className="block text-sm text-ananael-muted">
          Time
          <input
            type="time"
            value={timeStr}
            onChange={(e) => setTimeStr(e.target.value)}
            className="mt-1 w-full min-w-0 max-w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={requestGeo}
          className="rounded-md border border-ananael-bronze/60 px-4 py-2 text-sm text-ananael-gold transition hover:bg-ananael-panel"
        >
          Use my location
        </button>
        {geoStatus && <p className="text-xs text-zinc-500">{geoStatus}</p>}
      </div>

      {isAuthenticated && (
        <section className="space-y-3 rounded-xl border border-ananael-border/50 bg-ananael-surface/60 p-4">
          <h2 className="font-display text-sm tracking-wide text-ananael-gold">
            Bookmark chart
          </h2>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <label className="block text-sm text-ananael-muted">
              Name
              <input
                type="text"
                value={chartName}
                onChange={(e) => setChartName(e.target.value)}
                maxLength={100}
                className="mt-1 w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={chartSaving || !chartName.trim() || !coordsValid}
                onClick={() => void saveChart()}
                className="rounded-md border border-ananael-gold/50 bg-ananael-gold/10 px-3 py-2 text-xs font-medium text-ananael-gold transition hover:bg-ananael-gold/20 disabled:opacity-40"
              >
                {chartSaving ? 'Saving…' : savedChartId ? 'Update' : 'Save'}
              </button>
              {savedChartId && (
                <button
                  type="button"
                  onClick={() => {
                    setSavedChartId(null);
                    setChartName('Untitled chart');
                    setChartNotes('');
                    setChartStatus(null);
                  }}
                  className="rounded-md border border-ananael-border/70 px-3 py-2 text-xs text-zinc-300"
                >
                  New
                </button>
              )}
            </div>
          </div>
          <label className="block text-sm text-ananael-muted">
            Notes
            <input
              type="text"
              value={chartNotes}
              onChange={(e) => setChartNotes(e.target.value)}
              maxLength={500}
              className="mt-1 w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet"
            />
          </label>
          {chartStatus && (
            <p className="text-xs text-ananael-muted">{chartStatus}</p>
          )}
          {savedCharts.length > 0 && (
            <div>
              <p className="mb-2 text-xs uppercase tracking-wider text-ananael-muted">
                Recent charts
              </p>
              <ul className="space-y-1">
                {savedCharts.map((c) => (
                  <li key={c._id}>
                    <button
                      type="button"
                      onClick={() => loadChart(c)}
                      className="w-full rounded-md border border-transparent px-2 py-1.5 text-left text-sm text-zinc-300 transition hover:border-ananael-border hover:bg-ananael-bg hover:text-ananael-gold"
                    >
                      <span className="font-medium">{c.name}</span>
                      <span className="ml-2 text-xs text-ananael-muted">
                        {new Date(c.date).toLocaleString()}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* Summary strip */}
      <div className="flex flex-wrap gap-4 rounded-xl border border-ananael-border/50 bg-ananael-surface px-3 py-4 text-sm sm:gap-6 sm:px-6">
        <div>
          <p className="text-xs uppercase tracking-wider text-ananael-muted">
            Planetary hour
          </p>
          <p className="mt-1 font-display text-lg text-ananael-gold">
            {chart?.currentHour
              ? `${chart.currentHour.planet} (${chart.currentHour.segment} ${chart.currentHour.hourOfSegment})`
              : coordsValid
                ? 'Outside chart window'
                : 'Set location'}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-ananael-muted">
            Moon
          </p>
          <p className="mt-1 text-zinc-200">
            {sky.moon.name}{' '}
            <span className="text-ananael-muted">
              ({Math.round(sky.moon.illumination * 100)}%)
            </span>
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-ananael-muted">
            Sun (tropical)
          </p>
          <p className="mt-1 text-zinc-200">
            {sun ? (
              onNavigate ? (
                <button
                  type="button"
                  onClick={() => openSign(sun.tropical.sign)}
                  className="text-left text-ananael-gold underline-offset-2 hover:underline"
                >
                  {WESTERN_SIGN_GLYPHS[sun.tropical.sign]}{' '}
                  {sun.tropical.sign} {sun.tropical.deg}°
                </button>
              ) : (
                <>
                  {WESTERN_SIGN_GLYPHS[sun.tropical.sign]} {sun.tropical.sign}{' '}
                  {sun.tropical.deg}°
                </>
              )
            ) : (
              '—'
            )}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-ananael-muted">
            Chinese day
          </p>
          <p className="mt-1 text-zinc-200">
            {formatPillarShort(pillars.day)}
          </p>
        </div>
      </div>

      <div className="flex flex-nowrap gap-2 overflow-x-auto border-b border-ananael-border/40 pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setPanel(t.id)}
            className={[
              'min-h-10 shrink-0 rounded-md px-3 py-1.5 text-sm transition',
              panel === t.id
                ? 'bg-ananael-violet/25 text-ananael-gold'
                : 'text-ananael-muted hover:text-zinc-200',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {panel === 'hours' && (
        <>
          {!chart && (
            <p className="text-sm text-zinc-400">
              Enter a valid latitude and longitude. Polar day/night may prevent
              sunrise or sunset for this date.
            </p>
          )}
          {chart && (
            <>
              <div className="flex flex-wrap gap-4 rounded-xl border border-ananael-border/50 bg-ananael-surface px-3 py-4 text-sm sm:gap-6 sm:px-6">
                <div>
                  <p className="text-xs uppercase tracking-wider text-ananael-muted">
                    Day ruler
                  </p>
                  <p className="mt-1 font-display text-xl text-ananael-gold">
                    {chart.dayRuler}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-ananael-muted">
                    Sunrise
                  </p>
                  <p className="mt-1 text-zinc-200">
                    {formatTime(chart.sunrise)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-ananael-muted">
                    Sunset
                  </p>
                  <p className="mt-1 text-zinc-200">
                    {formatTime(chart.sunset)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-ananael-muted">
                    Current hour
                  </p>
                  <p className="mt-1 font-display text-xl text-ananael-gold">
                    {chart.currentHour
                      ? `${chart.currentHour.planet} (${chart.currentHour.segment} ${chart.currentHour.hourOfSegment})`
                      : 'Outside chart window'}
                  </p>
                </div>
              </div>

              {chart.currentHour &&
                meridianPeakingAt(chart.currentHour.start.getHours()).length >
                  0 && (
                  <p className="rounded-xl border border-ananael-violet/30 bg-ananael-violet/10 px-4 py-3 text-sm text-zinc-200">
                    <span className="text-[11px] uppercase tracking-wider text-ananael-violet">
                      Meridian peak ·{' '}
                    </span>
                    {meridianPeakingAt(chart.currentHour.start.getHours())
                      .map((m) => m.name)
                      .join(' / ')}{' '}
                    — qigong, breath, or meridian-aware stillness.{' '}
                    {onNavigate && (
                      <button
                        type="button"
                        onClick={() =>
                          onNavigate('subtleBody', {
                            subtleBodyPane: 'meridians',
                            subtleBodyFocus: meridianPeakingAt(
                              chart.currentHour!.start.getHours()
                            )[0]?.id,
                          })
                        }
                        className="text-ananael-gold hover:underline"
                      >
                        Atlas
                      </button>
                    )}
                  </p>
                )}

              <div className="overflow-x-auto rounded-xl border border-ananael-border/50 bg-ananael-surface">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-ananael-border/60 text-xs uppercase tracking-wider text-ananael-muted">
                      <th className="px-4 py-3 font-medium">#</th>
                      <th className="px-4 py-3 font-medium">Segment</th>
                      <th className="px-4 py-3 font-medium">Planet</th>
                      <th className="px-4 py-3 font-medium">Meridian</th>
                      <th className="px-4 py-3 font-medium">Start</th>
                      <th className="px-4 py-3 font-medium">End</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chart.hours.map((h) => {
                      const isCurrent = chart.currentHour?.index === h.index;
                      const peaking = meridianPeakingAt(h.start.getHours());
                      return (
                        <tr
                          key={h.index}
                          className={[
                            'border-b border-ananael-border/30 last:border-0',
                            isCurrent
                              ? 'bg-ananael-violet/20 text-ananael-gold'
                              : '',
                          ].join(' ')}
                        >
                          <td className="px-4 py-2">{h.hourOfSegment}</td>
                          <td className="px-4 py-2 capitalize">{h.segment}</td>
                          <td className="px-4 py-2 font-medium">
                            {h.planet as PlanetId}
                          </td>
                          <td className="px-4 py-2 text-xs text-zinc-300">
                            {peaking.length ? (
                              onNavigate ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onNavigate('subtleBody', {
                                      subtleBodyPane: 'meridians',
                                      subtleBodyFocus: peaking[0].id,
                                    })
                                  }
                                  className="text-left text-ananael-violet hover:underline"
                                >
                                  {peaking.map((m) => m.name).join(' / ')}
                                </button>
                              ) : (
                                peaking.map((m) => m.name).join(' / ')
                              )
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="px-4 py-2">{formatTime(h.start)}</td>
                          <td className="px-4 py-2">{formatTime(h.end)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {panel === 'planets' && (
        <div className="overflow-x-auto rounded-xl border border-ananael-border/50 bg-ananael-surface">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-ananael-border/60 text-xs uppercase tracking-wider text-ananael-muted">
                <th className="px-4 py-3 font-medium">Body</th>
                <th className="px-4 py-3 font-medium">Tropical</th>
                <th className="px-4 py-3 font-medium">Sidereal (Lahiri)</th>
                <th className="px-4 py-3 font-medium">℞</th>
                <th className="px-4 py-3 font-medium">Alt</th>
              </tr>
            </thead>
            <tbody>
              {sky.bodies.map((b) => {
                const sid = siderealFromTropical(b.longitude, referenceNow);
                return (
                  <tr
                    key={b.id}
                    className="border-b border-ananael-border/30 last:border-0"
                  >
                    <td className="px-4 py-2 font-medium text-zinc-100">
                      {b.id}
                    </td>
                    <td className="px-4 py-2">
                      {onNavigate ? (
                        <button
                          type="button"
                          onClick={() => openSign(b.tropical.sign)}
                          className="text-ananael-gold underline-offset-2 hover:underline"
                        >
                          {formatBodyRow(b)}
                        </button>
                      ) : (
                        formatBodyRow(b)
                      )}
                    </td>
                    <td className="px-4 py-2 text-zinc-300">
                      {formatSiderealPosition(sid)}
                    </td>
                    <td className="px-4 py-2 text-ananael-muted">
                      {b.retrograde ? '℞' : '—'}
                    </td>
                    <td className="px-4 py-2 text-zinc-400">
                      {formatAlt(b.altitude)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!coordsValid && (
            <p className="border-t border-ananael-border/40 px-4 py-2 text-xs text-ananael-muted">
              Set location to show altitude above the horizon.
            </p>
          )}
        </div>
      )}

      {panel === 'zodiac' && (
        <div className="grid gap-4 lg:grid-cols-3">
          <section className="rounded-xl border border-ananael-border/50 bg-ananael-surface p-4 sm:p-5">
            <h2 className="font-display text-lg text-ananael-gold">Western</h2>
            <p className="mt-1 text-xs text-ananael-muted">
              Tropical ecliptic of date
            </p>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-ananael-muted">
                  Sun
                </dt>
                <dd className="mt-1 text-zinc-100">
                  {sun ? formatBodyRow(sun) : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-ananael-muted">
                  Moon
                </dt>
                <dd className="mt-1 text-zinc-100">
                  {moon ? formatBodyRow(moon) : '—'}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-ananael-border/50 bg-ananael-surface p-4 sm:p-5">
            <h2 className="font-display text-lg text-ananael-gold">Hindu</h2>
            <p className="mt-1 text-xs text-ananael-muted">
              Lahiri sidereal · Moon nakshatra
            </p>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-ananael-muted">
                  Sun rashi
                </dt>
                <dd className="mt-1 text-zinc-100">
                  {sunSidereal ? formatSiderealPosition(sunSidereal) : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-ananael-muted">
                  Moon rashi
                </dt>
                <dd className="mt-1 text-zinc-100">
                  {moonSidereal ? formatSiderealPosition(moonSidereal) : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-ananael-muted">
                  Moon nakshatra
                </dt>
                <dd className="mt-1 text-zinc-100">
                  {moonNakshatra ? formatNakshatra(moonNakshatra) : '—'}
                </dd>
              </div>
              {sunSidereal && (
                <p className="text-[11px] text-ananael-muted">
                  Ayanamsa {sunSidereal.ayanamsa.toFixed(4)}°
                </p>
              )}
            </dl>
          </section>

          <section className="rounded-xl border border-ananael-border/50 bg-ananael-surface p-4 sm:p-5">
            <h2 className="font-display text-lg text-ananael-gold">Chinese</h2>
            <p className="mt-1 text-xs text-ananael-muted">
              Sexagenary pillars (Lìchūn year)
            </p>
            <dl className="mt-4 space-y-3 text-sm">
              {(
                [
                  ['Year', pillars.year],
                  ['Month', pillars.month],
                  ['Day', pillars.day],
                  ['Hour', pillars.hour],
                ] as const
              ).map(([label, p]) => (
                <div key={label}>
                  <dt className="text-[11px] uppercase tracking-wider text-ananael-muted">
                    {label}
                  </dt>
                  <dd className="mt-1 text-zinc-100">{formatPillar(p)}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      )}

      {panel === 'elections' && (
        <div className="space-y-6">
          <p className="text-sm text-ananael-muted">
            Explainable windows for the next seven days from your location and
            the reference date/time above. Filters combine planetary day, hour
            ruler, moon phase, and optional retrograde avoidance.
          </p>
          {!coordsValid && (
            <p className="text-sm text-zinc-400">
              Enter a valid latitude and longitude to compute elections.
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <label className="block text-sm text-ananael-muted">
              Preferred day
              <select
                value={electionDay}
                onChange={(e) =>
                  setElectionDay(e.target.value as PlanetId | 'any')
                }
                className="mt-1 w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet"
              >
                <option value="any">Any day</option>
                {CHALDEAN_ORDER.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-ananael-muted">
              Hour planet
              <select
                value={electionHour}
                onChange={(e) =>
                  setElectionHour(e.target.value as PlanetId)
                }
                className="mt-1 w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet"
              >
                {CHALDEAN_ORDER.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-ananael-muted">
              Moon
              <select
                value={electionMoon}
                onChange={(e) =>
                  setElectionMoon(e.target.value as ElectionFilters['moon'])
                }
                className="mt-1 w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet"
              >
                <option value="any">Any phase</option>
                <option value="waxing">Waxing</option>
                <option value="waning">Waning</option>
                <option value="new">New</option>
                <option value="full">Full</option>
              </select>
            </label>
            <label className="block text-sm text-ananael-muted">
              Avoid retrograde
              <select
                value={avoidRetro}
                onChange={(e) =>
                  setAvoidRetro(e.target.value as PlanetId | 'none')
                }
                className="mt-1 w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet"
              >
                <option value="none">None</option>
                {CHALDEAN_ORDER.filter((p) => p !== 'Sun' && p !== 'Moon').map(
                  (p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  )
                )}
              </select>
            </label>
            <label className="block text-sm text-ananael-muted">
              Practice
              <select
                value={electionPractice}
                onChange={(e) =>
                  setElectionPractice(
                    e.target.value as ElectionFilters['practice']
                  )
                }
                className="mt-1 w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet"
              >
                <option value="any">Any</option>
                <option value="meridian-peak">Meridian peak</option>
                <option value="yin-moon">Yin moon (Ren/Du)</option>
                <option value="journey-night">Journey night</option>
              </select>
            </label>
          </div>

          {coordsValid && electionWindows.length === 0 && (
            <p className="text-sm text-zinc-400">
              No matching windows in the next seven days for these filters.
            </p>
          )}

          {electionWindows.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-ananael-border/50 bg-ananael-surface">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-ananael-border/60 text-xs uppercase tracking-wider text-ananael-muted">
                    <th className="px-4 py-3 font-medium">When</th>
                    <th className="px-4 py-3 font-medium">Day</th>
                    <th className="px-4 py-3 font-medium">Hour</th>
                    <th className="px-4 py-3 font-medium">Moon</th>
                    <th className="px-4 py-3 font-medium">Why</th>
                  </tr>
                </thead>
                <tbody>
                  {electionWindows.map((w) => (
                    <tr
                      key={w.start.toISOString()}
                      className="border-b border-ananael-border/30 last:border-0"
                    >
                      <td className="px-4 py-2 text-zinc-200">
                        {w.start.toLocaleString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        <span className="text-ananael-muted">
                          {' '}
                          – {formatTime(w.end)}
                        </span>
                      </td>
                      <td className="px-4 py-2">{w.dayRuler}</td>
                      <td className="px-4 py-2 text-ananael-gold">
                        {w.hourPlanet}
                      </td>
                      <td className="px-4 py-2">{w.moonPhase}</td>
                      <td className="px-4 py-2 text-xs text-ananael-muted">
                        {w.reasons.join(' · ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {panel === 'almanac' && (
        <div className="space-y-6">
          <p className="text-sm text-ananael-muted">
            Magical Almanac — month sky at a glance with day counsel, solar
            quarters, and lunation markers. Select a day to sync Hours and
            Planets.
          </p>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => shiftAlmanacMonth(-1)}
                className="rounded-md border border-ananael-border/60 px-3 py-1.5 text-sm text-zinc-200 transition hover:border-ananael-gold/50 hover:text-ananael-gold"
              >
                Prev
              </button>
              <h2 className="min-w-[10rem] text-center font-display text-xl text-ananael-gold">
                {almanacMonthLabel}
              </h2>
              <button
                type="button"
                onClick={() => shiftAlmanacMonth(1)}
                className="rounded-md border border-ananael-border/60 px-3 py-1.5 text-sm text-zinc-200 transition hover:border-ananael-gold/50 hover:text-ananael-gold"
              >
                Next
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                const t = new Date();
                setAlmanacCursor({
                  year: t.getFullYear(),
                  month: t.getMonth(),
                });
                setDateStr(toDateInputValue(t));
              }}
              className="rounded-md border border-ananael-violet/50 px-3 py-1.5 text-xs text-ananael-violet transition hover:bg-ananael-violet/15"
            >
              Today
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <div className="overflow-x-auto rounded-xl border border-ananael-border/50 bg-ananael-surface p-3 sm:p-4">
              <div className="grid grid-cols-7 gap-1 text-center text-[11px] uppercase tracking-wider text-ananael-muted">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                  <div key={d} className="py-1">
                    {d}
                  </div>
                ))}
              </div>
              <div className="mt-1 grid grid-cols-7 gap-1">
                {Array.from({ length: almanacPadStart }).map((_, i) => (
                  <div
                    key={`pad-${i}`}
                    className="min-h-[4.5rem] rounded-md opacity-30"
                  />
                ))}
                {almanacDays.map((day) => {
                  const selected =
                    selectedAlmanacDay?.day === day.day &&
                    selectedAlmanacDay.month === day.month &&
                    selectedAlmanacDay.year === day.year;
                  const today = sameLocalDay(day.date, new Date());
                  const dayMarkers = markersByDay.get(day.day) ?? [];
                  return (
                    <button
                      key={day.day}
                      type="button"
                      onClick={() =>
                        selectAlmanacDay(day.year, day.month, day.day)
                      }
                      className={[
                        'min-h-[4.5rem] rounded-md border px-1.5 py-1.5 text-left transition',
                        selected
                          ? 'border-ananael-gold/70 bg-ananael-violet/25'
                          : day.isBirthday
                            ? 'border-ananael-gold/50 bg-ananael-gold/10 hover:border-ananael-gold/70'
                            : day.natalResonance
                              ? 'border-ananael-violet/60 bg-ananael-violet/15 hover:border-ananael-gold/40'
                              : today
                                ? 'border-ananael-violet/50 bg-ananael-panel/80 hover:border-ananael-gold/40'
                                : 'border-ananael-border/40 bg-ananael-bg/40 hover:border-ananael-gold/30',
                      ].join(' ')}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span
                          className={[
                            'text-sm font-medium',
                            selected || today || day.isBirthday
                              ? 'text-ananael-gold'
                              : 'text-zinc-100',
                          ].join(' ')}
                        >
                          {day.day}
                        </span>
                        <span className="text-[10px] text-ananael-muted">
                          {dayRulerShort(day.dayRuler)}
                        </span>
                      </div>
                      <p className="mt-1 text-[10px] text-zinc-400">
                        {moonPhaseShort(day.moonPhase)}
                      </p>
                      {day.isBirthday && (
                        <p className="mt-1 text-[10px] text-ananael-gold">
                          Birthday
                        </p>
                      )}
                      {!day.isBirthday && day.natalResonance && (
                        <p className="mt-1 text-[10px] text-ananael-violet">
                          Natal
                        </p>
                      )}
                      {dayMarkers.length > 0 && (
                        <p className="mt-1 truncate text-[10px] text-ananael-violet">
                          {dayMarkers[0].label}
                          {dayMarkers.length > 1
                            ? ` +${dayMarkers.length - 1}`
                            : ''}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4 rounded-xl border border-ananael-border/50 bg-ananael-surface p-4 sm:p-5">
              <h3 className="font-display text-lg text-ananael-gold">
                Day counsel
              </h3>
              {!selectedAlmanacDay || !dayCounsel ? (
                <p className="text-sm text-ananael-muted">
                  Select a day in this month for counsel.
                </p>
              ) : (
                <>
                  <p className="text-sm text-zinc-200">
                    {selectedAlmanacDay.date.toLocaleDateString(undefined, {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                  <dl className="grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-[11px] uppercase tracking-wider text-ananael-muted">
                        Day ruler
                      </dt>
                      <dd className="mt-1 text-zinc-100">
                        {selectedAlmanacDay.dayRuler}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[11px] uppercase tracking-wider text-ananael-muted">
                        Moon
                      </dt>
                      <dd className="mt-1 text-zinc-100">
                        {selectedAlmanacDay.moonPhase}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[11px] uppercase tracking-wider text-ananael-muted">
                        Sun
                      </dt>
                      <dd className="mt-1 text-zinc-100">
                        {selectedAlmanacDay.sunSign ?? '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[11px] uppercase tracking-wider text-ananael-muted">
                        Day pillar
                      </dt>
                      <dd className="mt-1 text-zinc-100">
                        {selectedAlmanacDay.chineseDay}
                      </dd>
                    </div>
                  </dl>
                  <p className="text-sm leading-relaxed text-zinc-300">
                    {dayCounsel.dayTheme}
                  </p>
                  <p className="text-sm leading-relaxed text-zinc-400">
                    {dayCounsel.moonTheme}
                  </p>
                  <div className="rounded-lg border border-ananael-border/40 bg-ananael-bg/40 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wider text-ananael-violet">
                      Operation
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-200">
                      {dayCounsel.alchemyTheme}
                    </p>
                    <p className="mt-1 text-xs italic text-ananael-muted">
                      {dayCounsel.operation.axiom}
                    </p>
                  </div>
                  {dayCounsel.natalAffinity && (
                    <div className="rounded-lg border border-ananael-gold/40 bg-ananael-gold/10 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wider text-ananael-gold">
                        Natal affinity
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-zinc-200">
                        {dayCounsel.natalAffinity}
                      </p>
                    </div>
                  )}
                  {dayCounsel.shamanismTheme && (
                    <div className="rounded-lg border border-ananael-violet/40 bg-ananael-violet/10 px-3 py-2">
                      <p className="text-[11px] uppercase tracking-wider text-ananael-violet">
                        Journey
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-zinc-200">
                        {dayCounsel.shamanismTheme}
                      </p>
                      {onNavigate && (
                        <button
                          type="button"
                          onClick={() =>
                            onNavigate('shamanism', {
                              shamanismPane: 'journey',
                            })
                          }
                          className="mt-2 text-xs text-ananael-gold hover:underline"
                        >
                          Open Journey pane
                        </button>
                      )}
                    </div>
                  )}
                  {(markersByDay.get(selectedAlmanacDay.day) ?? []).length >
                    0 && (
                    <ul className="space-y-1 text-xs text-ananael-violet">
                      {(markersByDay.get(selectedAlmanacDay.day) ?? []).map(
                        (m) => (
                          <li key={`${m.kind}-${m.when.toISOString()}`}>
                            {m.label}
                            {' · '}
                            {m.when.toLocaleString(undefined, {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </li>
                        )
                      )}
                    </ul>
                  )}

                  {coordsValid && (
                    <div className="border-t border-ananael-border/40 pt-3">
                      <p className="text-[11px] uppercase tracking-wider text-ananael-muted">
                        Hours of {selectedAlmanacDay.dayRuler} today
                      </p>
                      {almanacDayElections.length === 0 ? (
                        <p className="mt-2 text-xs text-ananael-muted">
                          No matching hour windows left for this day (or chart
                          unavailable).
                        </p>
                      ) : (
                        <ul className="mt-2 space-y-1 text-xs text-zinc-300">
                          {almanacDayElections.map((w) => (
                            <li key={w.start.toISOString()}>
                              {formatTime(w.start)} – {formatTime(w.end)}
                              <span className="text-ananael-muted">
                                {' '}
                                · {w.moonPhase}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 border-t border-ananael-border/40 pt-3">
                    <button
                      type="button"
                      onClick={() => setPanel('hours')}
                      className="rounded-md border border-ananael-gold/50 px-3 py-1.5 text-xs text-ananael-gold transition hover:bg-ananael-gold/10"
                    >
                      View Hours
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setElectionDay(selectedAlmanacDay.dayRuler);
                        setElectionHour(selectedAlmanacDay.dayRuler);
                        setPanel('elections');
                      }}
                      className="rounded-md border border-ananael-violet/50 px-3 py-1.5 text-xs text-ananael-violet transition hover:bg-ananael-violet/15"
                    >
                      Elections
                    </button>
                    {onNavigate && (
                      <>
                        <button
                          type="button"
                          onClick={() => onNavigate('liturgy')}
                          className="rounded-md border border-ananael-bronze/60 px-3 py-1.5 text-xs text-zinc-200 transition hover:bg-ananael-panel hover:text-ananael-gold"
                        >
                          Ritual Library
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onNavigate('journal', { filter: 'working' })
                          }
                          className="rounded-md border border-ananael-bronze/60 px-3 py-1.5 text-xs text-zinc-200 transition hover:bg-ananael-panel hover:text-ananael-gold"
                        >
                          Journal
                        </button>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {almanacMarkers.length > 0 && (
            <div className="rounded-xl border border-ananael-border/50 bg-ananael-surface px-4 py-3">
              <p className="text-[11px] uppercase tracking-wider text-ananael-muted">
                Markers this month
              </p>
              <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-300">
                {almanacMarkers.map((m) => (
                  <li key={`${m.kind}-${m.when.toISOString()}`}>
                    <button
                      type="button"
                      onClick={() =>
                        selectAlmanacDay(m.year, m.month, m.day)
                      }
                      className="text-left hover:text-ananael-gold"
                    >
                      {m.label}
                      <span className="text-ananael-muted">
                        {' '}
                        ·{' '}
                        {m.when.toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {panel === 'natal' && <NatalPanel onNavigate={onNavigate} />}
    </div>
  );
}
