import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  buildPlanetaryHours,
  formatTime,
  type PlanetId,
} from '../lib/planetaryHours';
import { loadPlanetaryLocation } from '../lib/planetaryLocation';

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

/**
 * Planetary Hours: sunrise-based diurnal/nocturnal table with current hour.
 * Location syncs to the signed-in user profile when authenticated.
 */
export default function PlanetaryHoursModule() {
  const { location: authLocation, saveLocation, isAuthenticated } = useAuth();
  const nowInit = new Date();
  const coords = initialCoords(authLocation);
  const [latitude, setLatitude] = useState(coords.lat);
  const [longitude, setLongitude] = useState(coords.lon);
  const [dateStr, setDateStr] = useState(toDateInputValue(nowInit));
  const [timeStr, setTimeStr] = useState(toTimeInputValue(nowInit));
  const [geoStatus, setGeoStatus] = useState<string | null>(null);
  const [coordsTouched, setCoordsTouched] = useState(false);

  const lat = Number(latitude);
  const lon = Number(longitude);

  // Apply account location once it hydrates if the user hasn't edited yet.
  useEffect(() => {
    if (coordsTouched || !authLocation) return;
    setLatitude(String(authLocation.lat));
    setLongitude(String(authLocation.lon));
  }, [authLocation, coordsTouched]);

  useEffect(() => {
    if (
      !coordsTouched ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lon) ||
      lat < -90 ||
      lat > 90 ||
      lon < -180 ||
      lon > 180
    ) {
      return;
    }
    void saveLocation(lat, lon).catch(() => {
      setGeoStatus('Saved locally; could not sync to account.');
    });
  }, [lat, lon, coordsTouched, saveLocation]);

  const referenceNow = useMemo(() => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const [hh, mm] = timeStr.split(':').map(Number);
    return new Date(y, m - 1, d, hh, mm, 0, 0);
  }, [dateStr, timeStr]);

  const chart = useMemo(() => {
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;
    return buildPlanetaryHours(referenceNow, lat, lon, referenceNow);
  }, [referenceNow, lat, lon]);

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

  // Keep "now" fresh when viewing today's date (optional light refresh)
  useEffect(() => {
    const today = toDateInputValue(new Date());
    if (dateStr !== today) return;
    const id = window.setInterval(() => {
      setTimeStr(toTimeInputValue(new Date()));
    }, 60000);
    return () => window.clearInterval(id);
  }, [dateStr]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl text-ananael-gold">
          Planetary Hours
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ananael-muted">
          Unequal hours from local sunrise to sunrise, ruled by the Chaldean
          order. Calculations run in your browser
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
              <p className="mt-1 text-zinc-200">{formatTime(chart.sunrise)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-ananael-muted">
                Sunset
              </p>
              <p className="mt-1 text-zinc-200">{formatTime(chart.sunset)}</p>
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
    </div>
  );
}
