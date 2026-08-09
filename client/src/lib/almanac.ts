/**
 * Magical Almanac — month summaries and day counsel from sky + season markers.
 */

import {
  buildSkySnapshot,
  getBody,
  getLunationMarkers,
  getSeasonMarkers,
  type LunationMarker,
  type SeasonMarker,
} from './celestialEphemeris';
import { dayPillar, formatPillarShort } from './chineseAstrology';
import { buildJournalSky, type JournalSky } from './journalSky';
import { getMoonPhase, type MoonPhaseName } from './moonPhase';
import { DAY_RULERS, type PlanetId } from './planetaryHours';

export interface AlmanacDay {
  /** Local calendar date at noon. */
  date: Date;
  year: number;
  month: number;
  day: number;
  dayRuler: PlanetId;
  moonPhase: MoonPhaseName;
  moonIllum: number;
  sunSign?: string;
  chineseDay: string;
}

export type AlmanacMarkerKind =
  | SeasonMarker['kind']
  | LunationMarker['quarter'];

export interface AlmanacMarker {
  kind: AlmanacMarkerKind;
  label: string;
  when: Date;
  /** Local Y/M/D for grid badge placement. */
  year: number;
  month: number;
  day: number;
}

export interface DayCounsel {
  sky: JournalSky;
  dayTheme: string;
  moonTheme: string;
  /** One- or two-line practice counsel. */
  summary: string;
}

const DAY_THEMES: Record<PlanetId, string> = {
  Sun: 'Vitality, visibility, and solar adorations — charge talismans of honor and will.',
  Moon: 'Dreams, divination, and fluid workings — tend the astral and the waters within.',
  Mars: 'Courage, banishing, and sharp focus — cut cords and fortify the circle.',
  Mercury: 'Messages, study, and mercurial craft — write, cast lots, and open roads.',
  Jupiter: 'Expansion, blessing, and patronage — petition for increase and good fortune.',
  Venus: 'Harmony, attraction, and the arts — sweeten bonds and consecrate beauty.',
  Saturn: 'Boundaries, endurance, and binding — seal, restrict, and honor the elders.',
};

const MOON_THEMES: Record<MoonPhaseName, string> = {
  'New Moon': 'Plant seeds in silence — begin, consecrate, and set intention.',
  'Waxing Crescent': 'Feed what grows — charge, attract, and build momentum.',
  'First Quarter': 'Act with decision — challenge obstacles and commit the working.',
  'Waxing Gibbous': 'Refine and perfect — polish rites before the fullness.',
  'Full Moon': 'Peak power and revelation — scry, charge, and celebrate completion.',
  'Waning Gibbous': 'Share and teach — give thanks, then begin to release.',
  'Last Quarter': 'Cut and clear — banish, compost, and close what is finished.',
  'Waning Crescent': 'Rest and empty — dream deep, purify, and prepare the next seed.',
};

/** Compact moon label for calendar cells. */
export function moonPhaseShort(name: MoonPhaseName): string {
  switch (name) {
    case 'New Moon':
      return 'New';
    case 'Waxing Crescent':
      return 'Wax';
    case 'First Quarter':
      return '1Q';
    case 'Waxing Gibbous':
      return 'Gib';
    case 'Full Moon':
      return 'Full';
    case 'Waning Gibbous':
      return 'Gib';
    case 'Last Quarter':
      return '3Q';
    case 'Waning Crescent':
      return 'Wan';
    default:
      return 'Moon';
  }
}

/** Two-letter day-ruler cue for calendar cells. */
export function dayRulerShort(planet: PlanetId): string {
  const map: Record<PlanetId, string> = {
    Sun: 'Su',
    Moon: 'Mo',
    Mars: 'Ma',
    Mercury: 'Me',
    Jupiter: 'Ju',
    Venus: 'Ve',
    Saturn: 'Sa',
  };
  return map[planet];
}

function localYmd(d: Date): { year: number; month: number; day: number } {
  return {
    year: d.getFullYear(),
    month: d.getMonth(),
    day: d.getDate(),
  };
}

function noonLocal(year: number, month: number, day: number): Date {
  return new Date(year, month, day, 12, 0, 0, 0);
}

/**
 * One AlmanacDay per calendar day in the month (month is 0-based).
 */
export function buildMonthDays(
  year: number,
  month: number,
  lat?: number,
  lon?: number
): AlmanacDay[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const out: AlmanacDay[] = [];
  const hasLoc =
    lat != null &&
    lon != null &&
    Number.isFinite(lat) &&
    Number.isFinite(lon);

  for (let day = 1; day <= daysInMonth; day++) {
    const date = noonLocal(year, month, day);
    const moon = getMoonPhase(date);
    const sky = buildSkySnapshot(
      date,
      hasLoc ? lat : undefined,
      hasLoc ? lon : undefined
    );
    const sun = getBody(sky, 'Sun');
    out.push({
      date,
      year,
      month,
      day,
      dayRuler: DAY_RULERS[date.getDay()] as PlanetId,
      moonPhase: moon.name,
      moonIllum: moon.illumination,
      sunSign: sun?.tropical.sign,
      chineseDay: formatPillarShort(dayPillar(date)),
    });
  }
  return out;
}

/**
 * Season quarters + new/full/quarter moons falling in the local calendar month.
 */
export function monthMarkers(year: number, month: number): AlmanacMarker[] {
  const start = new Date(year, month, 1, 0, 0, 0, 0);
  const end = new Date(year, month + 1, 1, 0, 0, 0, 0);
  const markers: AlmanacMarker[] = [];

  for (const s of getSeasonMarkers(year)) {
    if (s.when >= start && s.when < end) {
      const ymd = localYmd(s.when);
      markers.push({
        kind: s.kind,
        label: s.label,
        when: s.when,
        year: ymd.year,
        month: ymd.month,
        day: ymd.day,
      });
    }
  }

  // Lunations near month edges can land just inside local midnight from UTC.
  for (const l of getLunationMarkers(
    new Date(start.getTime() - 2 * 86400000),
    new Date(end.getTime() + 2 * 86400000)
  )) {
    const ymd = localYmd(l.when);
    if (ymd.year !== year || ymd.month !== month) continue;
    markers.push({
      kind: l.quarter,
      label: l.label,
      when: l.when,
      year: ymd.year,
      month: ymd.month,
      day: ymd.day,
    });
  }

  markers.sort((a, b) => a.when.getTime() - b.when.getTime());
  return markers;
}

export function buildDayCounsel(
  when: Date = new Date(),
  lat?: number,
  lon?: number
): DayCounsel {
  const sky = buildJournalSky(when, lat, lon);
  const dayRuler = (sky.dayRuler as PlanetId | undefined) ?? DAY_RULERS[when.getDay()];
  const moonName = (sky.moonPhase as MoonPhaseName | undefined) ?? getMoonPhase(when).name;
  const dayTheme = DAY_THEMES[dayRuler];
  const moonTheme = MOON_THEMES[moonName];
  const summary = `Day of ${dayRuler}: ${dayTheme} ${moonName}: ${moonTheme}`;
  return { sky, dayTheme, moonTheme, summary };
}

/** Next season or lunation at or after `from` within the given month (or shortly after). */
export function nextMonthHighlight(
  from: Date,
  year: number,
  month: number
): AlmanacMarker | null {
  const markers = monthMarkers(year, month);
  const upcoming = markers.find((m) => m.when.getTime() >= from.getTime() - 60_000);
  if (upcoming) return upcoming;
  // Peek at next month if this month is spent.
  const nextYear = month === 11 ? year + 1 : year;
  const nextMonth = month === 11 ? 0 : month + 1;
  const next = monthMarkers(nextYear, nextMonth);
  return next[0] ?? null;
}

export function sameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
