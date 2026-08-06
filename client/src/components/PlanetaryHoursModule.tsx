import { useEffect, useMemo, useState } from 'react';
import {
  buildPlanetaryHours,
  formatTime,
  type PlanetId,
} from '../lib/planetaryHours';

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

/**
 * Planetary Hours: sunrise-based diurnal/nocturnal table with current hour.
 */
export default function PlanetaryHoursModule() {
  const nowInit = new Date();
  const [latitude, setLatitude] = useState('40.7128');
  const [longitude, setLongitude] = useState('-74.0060');
  const [dateStr, setDateStr] = useState(toDateInputValue(nowInit));
  const [timeStr, setTimeStr] = useState(toTimeInputValue(nowInit));
  const [geoStatus, setGeoStatus] = useState<string | null>(null);

  const lat = Number(latitude);
  const lon = Number(longitude);

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
        setLatitude(pos.coords.latitude.toFixed(4));
        setLongitude(pos.coords.longitude.toFixed(4));
        setGeoStatus('Location applied.');
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
          order. Calculations run entirely in your browser.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block text-sm text-ananael-muted">
          Latitude
          <input
            type="number"
            step="any"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            className="mt-1 w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet"
          />
        </label>
        <label className="block text-sm text-ananael-muted">
          Longitude
          <input
            type="number"
            step="any"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            className="mt-1 w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet"
          />
        </label>
        <label className="block text-sm text-ananael-muted">
          Date
          <input
            type="date"
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
            className="mt-1 w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet"
          />
        </label>
        <label className="block text-sm text-ananael-muted">
          Time
          <input
            type="time"
            value={timeStr}
            onChange={(e) => setTimeStr(e.target.value)}
            className="mt-1 w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet"
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
          <div className="flex flex-wrap gap-6 rounded-xl border border-ananael-border/50 bg-ananael-surface/40 px-6 py-4 text-sm">
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

          <div className="overflow-x-auto rounded-xl border border-ananael-border/50 bg-ananael-surface/40">
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
