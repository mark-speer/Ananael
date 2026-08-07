/**
 * Simple explainable electional windows from planetary hours + sky flags.
 */

import { isRetrograde, type CelestialBodyId } from './celestialEphemeris';
import { getMoonPhase, type MoonPhaseName } from './moonPhase';
import {
  buildPlanetaryHours,
  type PlanetId,
  type PlanetaryHour,
} from './planetaryHours';

export interface ElectionFilters {
  /** Prefer this planetary day ruler (optional). */
  dayPlanet?: PlanetId | 'any';
  /** Prefer hours ruled by this planet. */
  hourPlanet: PlanetId;
  /** Skip hours when this planet is retrograde (classical bodies only). */
  avoidRetrograde?: PlanetId | 'none';
  /** Prefer waxing / waning / any. */
  moon?: 'any' | 'waxing' | 'waning' | 'new' | 'full';
}

export interface ElectionWindow {
  start: Date;
  end: Date;
  dayRuler: PlanetId;
  hourPlanet: PlanetId;
  moonPhase: MoonPhaseName;
  score: number;
  reasons: string[];
}

const WAXING: MoonPhaseName[] = [
  'New Moon',
  'Waxing Crescent',
  'First Quarter',
  'Waxing Gibbous',
];
const WANING: MoonPhaseName[] = [
  'Full Moon',
  'Waning Gibbous',
  'Last Quarter',
  'Waning Crescent',
];

function moonMatches(
  phase: MoonPhaseName,
  filter: ElectionFilters['moon']
): boolean {
  if (!filter || filter === 'any') return true;
  if (filter === 'new') return phase === 'New Moon';
  if (filter === 'full') return phase === 'Full Moon';
  if (filter === 'waxing')
    return WAXING.includes(phase) && phase !== 'Full Moon';
  if (filter === 'waning')
    return WANING.includes(phase) && phase !== 'New Moon';
  return true;
}

function asCelestial(p: PlanetId): CelestialBodyId | null {
  if (p === 'Sun' || p === 'Moon') return p;
  return p;
}

/**
 * Scan the next `days` from `from` at lat/lon and list matching hour windows.
 */
export function findElectionWindows(
  from: Date,
  lat: number,
  lon: number,
  filters: ElectionFilters,
  days = 7
): ElectionWindow[] {
  const out: ElectionWindow[] = [];
  const startDay = new Date(
    from.getFullYear(),
    from.getMonth(),
    from.getDate(),
    12,
    0,
    0,
    0
  );

  for (let d = 0; d < days; d++) {
    const noon = new Date(startDay.getTime() + d * 86400000);
    const chart = buildPlanetaryHours(noon, lat, lon, from);
    if (!chart) continue;

    if (
      filters.dayPlanet &&
      filters.dayPlanet !== 'any' &&
      chart.dayRuler !== filters.dayPlanet
    ) {
      continue;
    }

    for (const hour of chart.hours) {
      if (hour.end <= from) continue;
      if (hour.planet !== filters.hourPlanet) continue;

      const moon = getMoonPhase(hour.start);
      if (!moonMatches(moon.name, filters.moon)) continue;

      const reasons: string[] = [
        `${hour.segment} hour of ${hour.planet}`,
        `Day of ${chart.dayRuler}`,
        `Moon: ${moon.name}`,
      ];
      let score = 1;

      if (filters.dayPlanet === chart.dayRuler) {
        score += 2;
        reasons.push('Matches preferred planetary day');
      }

      const avoid = filters.avoidRetrograde;
      if (avoid && avoid !== 'none') {
        const body = asCelestial(avoid);
        if (body && body !== 'Sun' && body !== 'Moon') {
          if (isRetrograde(body, hour.start)) continue;
          reasons.push(`${avoid} not retrograde`);
          score += 1;
        }
      }

      out.push({
        start: hour.start,
        end: hour.end,
        dayRuler: chart.dayRuler,
        hourPlanet: hour.planet,
        moonPhase: moon.name,
        score,
        reasons,
      });
    }
  }

  out.sort((a, b) => b.score - a.score || a.start.getTime() - b.start.getTime());
  return out.slice(0, 40);
}

export type { PlanetaryHour };
