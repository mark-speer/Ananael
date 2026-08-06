/**
 * Build sky auto-tags (moon phase + planetary day/hour) for journal entries.
 */

import { getMoonPhase } from './moonPhase';
import {
  buildPlanetaryHours,
  DAY_RULERS,
  type PlanetId,
} from './planetaryHours';
import { loadPlanetaryLocation } from './planetaryLocation';

export interface JournalSky {
  moonPhase?: string;
  moonIllum?: number;
  dayRuler?: string;
  hourRuler?: string;
  lat?: number;
  lon?: number;
}

/**
 * Compute sky fields for a given moment.
 * Uses saved planetary location when available; otherwise day ruler only
 * (hour ruler omitted without lat/lon).
 */
export function buildJournalSky(
  when: Date = new Date(),
  lat?: number,
  lon?: number
): JournalSky {
  const moon = getMoonPhase(when);
  const loc =
    lat != null && lon != null
      ? { lat, lon }
      : loadPlanetaryLocation();

  const sky: JournalSky = {
    moonPhase: moon.name,
    moonIllum: Math.round(moon.illumination * 1000) / 1000,
  };

  if (loc) {
    sky.lat = loc.lat;
    sky.lon = loc.lon;
    const chart = buildPlanetaryHours(when, loc.lat, loc.lon, when);
    if (chart) {
      sky.dayRuler = chart.dayRuler;
      sky.hourRuler = chart.currentHour?.planet;
    } else {
      sky.dayRuler = DAY_RULERS[when.getDay()] as PlanetId;
    }
  } else {
    sky.dayRuler = DAY_RULERS[when.getDay()] as PlanetId;
  }

  return sky;
}
