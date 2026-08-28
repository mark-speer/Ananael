/**
 * Celestial Timing — Natal panel: birth profile, summary, positions, aspects,
 * Whole Sign houses, and chart wheel.
 */

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  buildNatalChart,
  formatBodyRow,
  formatNatalSummaryLine,
  PLANET_GLYPHS,
  WESTERN_SIGN_GLYPHS,
  type NatalChart,
} from '../lib/natalChart';
import {
  formatEnochianCourt,
  type EnochianNatalCourt,
  type EnochianNatalWatchtower,
} from '../lib/enochianNatal';
import {
  aethyrFocus,
  heptarchiaFocus,
  isHeptarchiaPlanet,
  watchtowerFocus,
} from '../data/enochianHierarchy';
import {
  hasNatalHousesReady,
  isValidBirthDate,
  type NatalProfile,
} from '../lib/natalProfile';
import { formatPillar, formatPillarShort } from '../lib/chineseAstrology';
import { loadPlanetaryLocation } from '../lib/planetaryLocation';
import type { JournalEntryType } from '../lib/journal';
import type { PlanetaryPanelId } from '../lib/planetaryPanel';
import type { ModuleId } from './Sidebar';
import NatalChartWheel from './NatalChartWheel';

type TimingNavigateOptions = {
  correspondencesQuery?: string;
  planetaryPanel?: PlanetaryPanelId;
  filter?: JournalEntryType | 'all';
  enochianTab?: 'tablets' | 'calls' | 'hierarchy';
  enochianFocus?: string;
};

interface NatalPanelProps {
  onNavigate?: (module: ModuleId, opts?: TimingNavigateOptions) => void;
}

function HierarchyLink({
  label,
  focus,
  onNavigate,
}: {
  label: string;
  focus: string;
  onNavigate?: NatalPanelProps['onNavigate'];
}) {
  if (!onNavigate) return <>{label}</>;
  return (
    <button
      type="button"
      onClick={() =>
        onNavigate('enochian', {
          enochianTab: 'hierarchy',
          enochianFocus: focus,
        })
      }
      className="text-ananael-gold underline-offset-2 hover:underline"
    >
      {label}
    </button>
  );
}

function CourtLine({
  court,
  onNavigate,
}: {
  court: EnochianNatalCourt;
  onNavigate?: NatalPanelProps['onNavigate'];
}) {
  const focus = heptarchiaFocus(court.planet);
  return (
    <>
      <HierarchyLink
        label={court.king}
        focus={focus}
        onNavigate={onNavigate}
      />
      {' · '}
      <HierarchyLink
        label={court.prince}
        focus={focus}
        onNavigate={onNavigate}
      />
    </>
  );
}

function WatchtowerLine({
  wt,
  onNavigate,
}: {
  wt: EnochianNatalWatchtower;
  onNavigate?: NatalPanelProps['onNavigate'];
}) {
  const focus = watchtowerFocus(wt.element);
  return (
    <>
      {wt.element} ({wt.quarter}) ·{' '}
      <HierarchyLink label={wt.king} focus={focus} onNavigate={onNavigate} />
      {' · '}
      <HierarchyLink label={wt.union} focus={focus} onNavigate={onNavigate} />
    </>
  );
}

function profileToForm(p: NatalProfile | null): {
  birthDate: string;
  birthTime: string;
  lat: string;
  lon: string;
  label: string;
  timeUnknown: boolean;
} {
  const loc = p?.birthPlace ?? loadPlanetaryLocation();
  return {
    birthDate: p?.birthDate ?? '',
    birthTime: p?.birthTime ?? '',
    lat: loc ? String(loc.lat) : '',
    lon: loc ? String(loc.lon) : '',
    label: p?.label ?? '',
    timeUnknown: !p?.birthTime,
  };
}

export default function NatalPanel({ onNavigate }: NatalPanelProps) {
  const { natal, saveNatal, isAuthenticated, location } = useAuth();
  const [form, setForm] = useState(() => profileToForm(natal));
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(profileToForm(natal));
  }, [natal]);

  const draftProfile: NatalProfile | null = useMemo(() => {
    if (!isValidBirthDate(form.birthDate)) return null;
    const lat = Number(form.lat);
    const lon = Number(form.lon);
    const hasPlace =
      Number.isFinite(lat) &&
      Number.isFinite(lon) &&
      lat >= -90 &&
      lat <= 90 &&
      lon >= -180 &&
      lon <= 180;
    return {
      birthDate: form.birthDate,
      birthTime: form.timeUnknown || !form.birthTime ? null : form.birthTime,
      birthPlace: hasPlace ? { lat, lon } : null,
      label: form.label.trim() || null,
    };
  }, [form]);

  const chart: NatalChart | null = useMemo(
    () => (draftProfile ? buildNatalChart(draftProfile) : null),
    [draftProfile]
  );

  const fillObserverLocation = () => {
    const loc = location ?? loadPlanetaryLocation();
    if (!loc) {
      setStatus('Set a location in Celestial Timing (or Magical OS) first.');
      return;
    }
    setForm((f) => ({ ...f, lat: String(loc.lat), lon: String(loc.lon) }));
    setStatus(null);
  };

  const onSave = async () => {
    if (!draftProfile) {
      setStatus('Enter a valid birth date (YYYY-MM-DD).');
      return;
    }
    setSaving(true);
    setStatus(null);
    try {
      await saveNatal(draftProfile);
      setStatus(
        isAuthenticated
          ? 'Natal profile saved to your account.'
          : 'Natal profile saved on this device. Sign in to sync.'
      );
    } catch {
      setStatus('Could not save natal profile.');
    } finally {
      setSaving(false);
    }
  };

  const openSign = (sign: string) => {
    onNavigate?.('correspondences', { correspondencesQuery: sign });
  };

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-ananael-border/50 bg-ananael-surface p-4 sm:p-5">
        <h2 className="font-display text-lg text-ananael-gold">Birth data</h2>
        <p className="mt-1 text-xs text-ananael-muted">
          Date is enough for Sun sign, Chinese year, and birthstones. Time and
          place unlock Ascendant, Whole Sign houses, and the chart wheel.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block text-sm">
            <span className="text-[11px] uppercase tracking-wider text-ananael-muted">
              Birth date
            </span>
            <input
              type="date"
              value={form.birthDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, birthDate: e.target.value }))
              }
              className="mt-1 w-full rounded-md border border-ananael-border/60 bg-ananael-panel px-3 py-2 text-zinc-100"
            />
          </label>

          <label className="block text-sm">
            <span className="text-[11px] uppercase tracking-wider text-ananael-muted">
              Birth time
            </span>
            <input
              type="time"
              value={form.birthTime}
              disabled={form.timeUnknown}
              onChange={(e) =>
                setForm((f) => ({ ...f, birthTime: e.target.value }))
              }
              className="mt-1 w-full rounded-md border border-ananael-border/60 bg-ananael-panel px-3 py-2 text-zinc-100 disabled:opacity-40"
            />
          </label>

          <label className="flex items-end gap-2 pb-2 text-sm text-zinc-300">
            <input
              type="checkbox"
              checked={form.timeUnknown}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  timeUnknown: e.target.checked,
                  birthTime: e.target.checked ? '' : f.birthTime,
                }))
              }
              className="rounded border-ananael-border"
            />
            Time unknown (use local noon)
          </label>

          <label className="block text-sm">
            <span className="text-[11px] uppercase tracking-wider text-ananael-muted">
              Birth lat
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={form.lat}
              onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))}
              placeholder="40.7128"
              className="mt-1 w-full rounded-md border border-ananael-border/60 bg-ananael-panel px-3 py-2 text-zinc-100"
            />
          </label>

          <label className="block text-sm">
            <span className="text-[11px] uppercase tracking-wider text-ananael-muted">
              Birth lon
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={form.lon}
              onChange={(e) => setForm((f) => ({ ...f, lon: e.target.value }))}
              placeholder="-74.0060"
              className="mt-1 w-full rounded-md border border-ananael-border/60 bg-ananael-panel px-3 py-2 text-zinc-100"
            />
          </label>

          <label className="block text-sm">
            <span className="text-[11px] uppercase tracking-wider text-ananael-muted">
              Label
            </span>
            <input
              type="text"
              value={form.label}
              onChange={(e) =>
                setForm((f) => ({ ...f, label: e.target.value }))
              }
              placeholder="My natal"
              maxLength={80}
              className="mt-1 w-full rounded-md border border-ananael-border/60 bg-ananael-panel px-3 py-2 text-zinc-100"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void onSave()}
            disabled={saving || !draftProfile}
            className="rounded-md border border-ananael-gold/50 bg-ananael-gold/10 px-3 py-1.5 text-sm text-ananael-gold transition hover:bg-ananael-gold/20 disabled:opacity-40"
          >
            {saving ? 'Saving…' : 'Save as my natal'}
          </button>
          <button
            type="button"
            onClick={fillObserverLocation}
            className="rounded-md border border-ananael-border/60 px-3 py-1.5 text-sm text-zinc-200 transition hover:border-ananael-violet/50"
          >
            Use observer location
          </button>
        </div>
        {status && (
          <p className="mt-2 text-xs text-ananael-muted">{status}</p>
        )}
      </section>

      {!chart && (
        <p className="text-sm text-zinc-400">
          Enter a birth date to compute your natal summary.
        </p>
      )}

      {chart && (
        <>
          {chart.timeUnknown && (
            <p className="rounded-md border border-ananael-bronze/40 bg-ananael-bronze/10 px-3 py-2 text-xs text-zinc-200">
              Birth time unknown — positions use local noon. Ascendant, houses,
              and the chart wheel stay locked until time and place are set.
            </p>
          )}

          <section className="rounded-xl border border-ananael-border/50 bg-ananael-surface p-4 sm:p-5">
            <h2 className="font-display text-lg text-ananael-gold">Summary</h2>
            <p className="mt-1 text-sm text-zinc-300">
              {formatNatalSummaryLine(chart)}
            </p>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-ananael-muted">
                  Sun (tropical)
                </dt>
                <dd className="mt-1 text-zinc-100">
                  {chart.sunSign ? (
                    onNavigate ? (
                      <button
                        type="button"
                        onClick={() => openSign(chart.sunSign!)}
                        className="text-ananael-gold underline-offset-2 hover:underline"
                      >
                        {WESTERN_SIGN_GLYPHS[chart.sunSign]}{' '}
                        {chart.sun ? formatBodyRow(chart.sun) : chart.sunSign}
                      </button>
                    ) : (
                      <>
                        {WESTERN_SIGN_GLYPHS[chart.sunSign]}{' '}
                        {chart.sun ? formatBodyRow(chart.sun) : chart.sunSign}
                      </>
                    )
                  ) : (
                    '—'
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-ananael-muted">
                  Moon (tropical)
                </dt>
                <dd className="mt-1 text-zinc-100">
                  {chart.moon ? formatBodyRow(chart.moon) : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-ananael-muted">
                  Hermetic ruler
                </dt>
                <dd className="mt-1 text-zinc-100">
                  {chart.hermetic?.planet ?? '—'}
                  {chart.hermetic?.hermeticStones?.length
                    ? ` · ${chart.hermetic.hermeticStones.join(', ')}`
                    : ''}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-ananael-muted">
                  Modern birthstone
                </dt>
                <dd className="mt-1 text-zinc-100">
                  {chart.modernBirthstones.length
                    ? chart.modernBirthstones.join(', ')
                    : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-ananael-muted">
                  Chinese year
                </dt>
                <dd className="mt-1 text-zinc-100">
                  {formatPillar(chart.chinese.year)}
                  <span className="mt-0.5 block text-[11px] text-ananael-muted">
                    Lìchūn / BaZi year pillar
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-ananael-muted">
                  Chinese pillars
                </dt>
                <dd className="mt-1 text-zinc-100">
                  {formatPillarShort(chart.chinese.month)} ·{' '}
                  {formatPillarShort(chart.chinese.day)}
                  {!chart.timeUnknown && (
                    <> · {formatPillarShort(chart.chinese.hour)}</>
                  )}
                </dd>
              </div>
              {chart.hinduSun && (
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-ananael-muted">
                    Sun rashi (Lahiri)
                  </dt>
                  <dd className="mt-1 text-zinc-100">{chart.hinduSun}</dd>
                </div>
              )}
              {chart.moonNakshatra && (
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-ananael-muted">
                    Moon nakshatra
                  </dt>
                  <dd className="mt-1 text-zinc-100">{chart.moonNakshatra}</dd>
                </div>
              )}
              {chart.ascendant && (
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-ananael-muted">
                    Ascendant
                  </dt>
                  <dd className="mt-1 text-ananael-gold">
                    {WESTERN_SIGN_GLYPHS[chart.ascendant.sign]}{' '}
                    {chart.ascendant.sign} {chart.ascendant.deg}°
                    {String(chart.ascendant.min).padStart(2, '0')}′
                  </dd>
                </div>
              )}
            </dl>
          </section>

          {chart.enochian && (
            <section className="rounded-xl border border-ananael-border/50 bg-ananael-surface p-4 sm:p-5">
              <h2 className="font-display text-lg text-ananael-gold">
                Enochian natal
              </h2>
              <p className="mt-1 text-xs text-ananael-muted">
                Study overlay, not a Dee nativity method. Heptarchia courts
                follow <em>Heptarchia Mystica</em>; Watchtower Kings are
                Golden Dawn reconstruction. Distinct from the 777 hermetic
                ruler above.
              </p>
              <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-ananael-muted">
                    Heptarchic day
                  </dt>
                  <dd className="mt-1 text-zinc-100">
                    {chart.enochian.dayCourt.weekday} ·{' '}
                    <CourtLine
                      court={chart.enochian.dayCourt}
                      onNavigate={onNavigate}
                    />
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-ananael-muted">
                    Sun court
                  </dt>
                  <dd className="mt-1 text-zinc-100">
                    <CourtLine
                      court={chart.enochian.sunCourt}
                      onNavigate={onNavigate}
                    />
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-ananael-muted">
                    Chart-ruler court
                  </dt>
                  <dd className="mt-1 text-zinc-100">
                    {chart.enochian.rulerCourt.planet} ·{' '}
                    <CourtLine
                      court={chart.enochian.rulerCourt}
                      onNavigate={onNavigate}
                    />
                  </dd>
                </div>
                {chart.enochian.risingCourt && (
                  <div>
                    <dt className="text-[11px] uppercase tracking-wider text-ananael-muted">
                      Rising court
                    </dt>
                    <dd className="mt-1 text-zinc-100">
                      {chart.enochian.risingCourt.planet} ·{' '}
                      <CourtLine
                        court={chart.enochian.risingCourt}
                        onNavigate={onNavigate}
                      />
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-ananael-muted">
                    Sun Watchtower
                  </dt>
                  <dd className="mt-1 text-zinc-100">
                    <WatchtowerLine
                      wt={chart.enochian.sunWatchtower}
                      onNavigate={onNavigate}
                    />
                  </dd>
                </div>
                {chart.enochian.risingWatchtower && (
                  <div>
                    <dt className="text-[11px] uppercase tracking-wider text-ananael-muted">
                      Rising Watchtower
                    </dt>
                    <dd className="mt-1 text-zinc-100">
                      {chart.enochian.risingWatchtower.element ===
                      chart.enochian.sunWatchtower.element ? (
                        <span className="text-ananael-muted">
                          Same as Sun (
                          {chart.enochian.risingWatchtower.element})
                        </span>
                      ) : (
                        <WatchtowerLine
                          wt={chart.enochian.risingWatchtower}
                          onNavigate={onNavigate}
                        />
                      )}
                    </dd>
                  </div>
                )}
              </dl>
              {chart.enochian.governorsPlaceSet && (
                <p className="mt-4 text-xs text-zinc-300">
                  Birth coordinates are set. The 91 Governors rule Parts of
                  the Earth, not natal planets — browse the Hierarchy Aethyrs.{' '}
                  <HierarchyLink
                    label="Open Aethyrs"
                    focus={aethyrFocus('LIL')}
                    onNavigate={onNavigate}
                  />
                </p>
              )}
            </section>
          )}

          <section className="rounded-xl border border-ananael-border/50 bg-ananael-surface">
            <div className="border-b border-ananael-border/40 px-4 py-3">
              <h2 className="font-display text-lg text-ananael-gold">
                Positions
              </h2>
              <p className="text-xs text-ananael-muted">
                Tropical ecliptic of date at birth moment
              </p>
            </div>
            {/* Phone layout: one card per body */}
            <ul className="divide-y divide-ananael-border/30 sm:hidden">
              {chart.positions.map((b) => {
                const house = chart.housePlacements?.find(
                  (h) => h.id === b.id
                )?.house;
                return (
                  <li
                    key={b.id}
                    className="flex items-center gap-3 px-4 py-2.5"
                  >
                    <p className="w-24 shrink-0 font-medium text-zinc-100">
                      <span className="mr-1 text-ananael-gold">
                        {PLANET_GLYPHS[b.id]}
                      </span>
                      {b.id}
                      {b.retrograde && (
                        <span className="ml-1 text-ananael-muted">℞</span>
                      )}
                    </p>
                    <div className="min-w-0 text-sm">
                      {onNavigate ? (
                        <button
                          type="button"
                          onClick={() => openSign(b.tropical.sign)}
                          className="text-left text-ananael-gold underline-offset-2 hover:underline"
                        >
                          {formatBodyRow(b)}
                        </button>
                      ) : (
                        formatBodyRow(b)
                      )}
                      {house != null && (
                        <p className="text-xs text-zinc-400">House {house}</p>
                      )}
                      <p className="text-xs text-zinc-400">
                        Heptarchia:{' '}
                        {isHeptarchiaPlanet(b.id) &&
                        chart.enochian?.bodies[b.id] ? (
                          onNavigate ? (
                            <HierarchyLink
                              label={formatEnochianCourt(
                                chart.enochian.bodies[b.id]!
                              )}
                              focus={heptarchiaFocus(b.id)}
                              onNavigate={onNavigate}
                            />
                          ) : (
                            formatEnochianCourt(chart.enochian.bodies[b.id]!)
                          )
                        ) : (
                          '—'
                        )}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="hidden overflow-x-auto sm:block">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ananael-border/60 text-xs uppercase tracking-wider text-ananael-muted">
                  <th className="px-4 py-3 font-medium">Body</th>
                  <th className="px-4 py-3 font-medium">Tropical</th>
                  <th className="px-4 py-3 font-medium">House</th>
                  <th className="px-4 py-3 font-medium">Heptarchia</th>
                  <th className="px-4 py-3 font-medium">℞</th>
                </tr>
              </thead>
              <tbody>
                {chart.positions.map((b) => {
                  const house = chart.housePlacements?.find(
                    (h) => h.id === b.id
                  )?.house;
                  return (
                    <tr
                      key={b.id}
                      className="border-b border-ananael-border/30 last:border-0"
                    >
                      <td className="px-4 py-2 font-medium text-zinc-100">
                        <span className="mr-1 text-ananael-gold">
                          {PLANET_GLYPHS[b.id]}
                        </span>
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
                        {house ?? '—'}
                      </td>
                      <td className="px-4 py-2 text-zinc-300">
                        {isHeptarchiaPlanet(b.id) &&
                        chart.enochian?.bodies[b.id] ? (
                          onNavigate ? (
                            <HierarchyLink
                              label={formatEnochianCourt(
                                chart.enochian.bodies[b.id]!
                              )}
                              focus={heptarchiaFocus(b.id)}
                              onNavigate={onNavigate}
                            />
                          ) : (
                            formatEnochianCourt(chart.enochian.bodies[b.id]!)
                          )
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-2 text-ananael-muted">
                        {b.retrograde ? '℞' : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </section>

          <section className="overflow-x-auto rounded-xl border border-ananael-border/50 bg-ananael-surface">
            <div className="border-b border-ananael-border/40 px-4 py-3">
              <h2 className="font-display text-lg text-ananael-gold">
                Aspects
              </h2>
              <p className="text-xs text-ananael-muted">
                Major aspects · orbs 8° lights / 6° others
              </p>
            </div>
            {chart.aspects.length === 0 ? (
              <p className="px-4 py-3 text-sm text-ananael-muted">
                No major aspects within orb.
              </p>
            ) : (
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-ananael-border/60 text-xs uppercase tracking-wider text-ananael-muted">
                    <th className="px-3 py-3 font-medium sm:px-4">Pair</th>
                    <th className="px-3 py-3 font-medium sm:px-4">Aspect</th>
                    <th className="px-3 py-3 font-medium sm:px-4">Orb</th>
                  </tr>
                </thead>
                <tbody>
                  {chart.aspects.map((a) => (
                    <tr
                      key={`${a.a}-${a.b}-${a.kind}`}
                      className="border-b border-ananael-border/30 last:border-0"
                    >
                      <td className="px-3 py-2 text-zinc-100 sm:px-4">
                        {PLANET_GLYPHS[a.a]} {a.a} · {PLANET_GLYPHS[a.b]} {a.b}
                      </td>
                      <td className="px-3 py-2 text-ananael-gold sm:px-4">
                        {a.glyph} {a.kind}
                      </td>
                      <td className="px-3 py-2 text-zinc-400 sm:px-4">
                        {a.orb.toFixed(2)}°
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {!hasNatalHousesReady(draftProfile) && (
            <p className="rounded-md border border-ananael-border/50 bg-ananael-panel px-3 py-3 text-sm text-zinc-300">
              Add birth <strong className="text-zinc-100">time</strong> and{' '}
              <strong className="text-zinc-100">place</strong> to unlock
              Ascendant, Whole Sign houses, and the chart wheel.
            </p>
          )}

          {chart.houses && (
            <section className="rounded-xl border border-ananael-border/50 bg-ananael-surface p-4 sm:p-5">
              <h2 className="font-display text-lg text-ananael-gold">
                Whole Sign houses
              </h2>
              <p className="mt-1 text-xs text-ananael-muted">
                House 1 = Ascendant sign
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 text-sm">
                {chart.houses.map((h) => (
                  <div
                    key={h.house}
                    className="rounded-md border border-ananael-border/40 px-3 py-2"
                  >
                    <p className="text-[11px] uppercase tracking-wider text-ananael-muted">
                      House {h.house}
                    </p>
                    <p className="text-zinc-100">
                      {WESTERN_SIGN_GLYPHS[h.sign]} {h.sign}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {chart.isFullNatal && <NatalChartWheel chart={chart} />}
        </>
      )}
    </div>
  );
}
