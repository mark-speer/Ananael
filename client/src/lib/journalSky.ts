/**
 * Build sky auto-tags (moon, planetary day/hour, zodiac cues) for journal entries.
 */

import { dayPillar, formatPillarShort } from './chineseAstrology';
import { buildSkySnapshot, getBody } from './celestialEphemeris';
import { nakshatraFromSidereal, siderealFromTropical } from './hinduAstrology';
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
  /** Tropical Sun sign. */
  sunSign?: string;
  /** Moon nakshatra name (Lahiri). */
  nakshatra?: string;
  /** Chinese day pillar short label (element + animal). */
  chineseDay?: string;
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

  const skySnap = buildSkySnapshot(
    when,
    loc?.lat,
    loc?.lon
  );
  const sun = getBody(skySnap, 'Sun');
  const moonBody = getBody(skySnap, 'Moon');
  const nakshatra = moonBody
    ? nakshatraFromSidereal(
        siderealFromTropical(moonBody.longitude, when).longitude
      ).name
    : undefined;

  const sky: JournalSky = {
    moonPhase: moon.name,
    moonIllum: Math.round(moon.illumination * 1000) / 1000,
    sunSign: sun?.tropical.sign,
    nakshatra,
    chineseDay: formatPillarShort(dayPillar(when)),
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
