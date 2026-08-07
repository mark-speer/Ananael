import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
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
  formatTime,
  type PlanetId,
} from '../lib/planetaryHours';
import { loadPlanetaryLocation } from '../lib/planetaryLocation';
import { WESTERN_SIGN_GLYPHS } from '../lib/westernZodiac';
import type { ModuleId } from './Sidebar';
import type { TreeNavigateOptions } from './TreeOfLifeModule';

type PanelId = 'hours' | 'planets' | 'zodiac';

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
  onNavigate?: (module: ModuleId, opts?: TreeNavigateOptions) => void;
}

/**
 * Celestial Timing: planetary hours, ephemeris, and Western / Hindu / Chinese zodiac.
 * Location syncs to the signed-in user profile when authenticated.
 */
export default function CelestialTimingModule({
  onNavigate,
}: CelestialTimingModuleProps) {
  const { location: authLocation, saveLocation, isAuthenticated } = useAuth();
  const nowInit = new Date();
  const coords = initialCoords(authLocation);
  const [latitude, setLatitude] = useState(coords.lat);
  const [longitude, setLongitude] = useState(coords.lon);
  const [dateStr, setDateStr] = useState(toDateInputValue(nowInit));
  const [timeStr, setTimeStr] = useState(toTimeInputValue(nowInit));
  const [geoStatus, setGeoStatus] = useState<string | null>(null);
  const [coordsTouched, setCoordsTouched] = useState(false);
  const [panel, setPanel] = useState<PanelId>('hours');

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
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl text-ananael-gold">
          Celestial Timing
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ananael-muted">
          Planetary hours, live ephemeris, and Western / Hindu / Chinese zodiac
          for your place and moment. Calculations run in your browser
          {isAuthenticated
            ? '; location is saved to your account for Magical OS and journal sky tags.'
            : '; sign in to save location to your account.'}
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
            onChange={(e) => setDateStr(e.target.value)}
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

      <div className="flex flex-wrap gap-2 border-b border-ananael-border/40 pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setPanel(t.id)}
            className={[
              'rounded-md px-3 py-1.5 text-sm transition',
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

              <div className="overflow-x-auto rounded-xl border border-ananael-border/50 bg-ananael-surface">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-ananael-border/60 text-xs uppercase tracking-wider text-ananael-muted">
                      <th className="px-4 py-3 font-medium">#</th>
                      <th className="px-4 py-3 font-medium">Segment</th>
                      <th className="px-4 py-3 font-medium">Planet</th>
                      <th className="px-4 py-3 font-medium">Start</th>
                      <th className="px-4 py-3 font-medium">End</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chart.hours.map((h) => {
                      const isCurrent = chart.currentHour?.index === h.index;
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
    </div>
  );
}
