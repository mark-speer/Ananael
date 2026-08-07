/**
 * Geocentric true-ecliptic-of-date positions via astronomy-engine.
 * Tropical longitudes for Western astrology; altitude when lat/lon given.
 */

import {
  Body,
  Equator,
  GeoVector,
  Horizon,
  Illumination,
  MoonPhase,
  Observer,
  RotateVector,
  Rotation_EQJ_ECT,
  SphereFromVector,
  SunPosition,
  EclipticGeoMoon,
} from 'astronomy-engine';
import {
  formatZodiacPosition,
  tropicalFromLongitude,
  type ZodiacPosition,
} from './westernZodiac';

export type EphemerisMoonPhaseName =
  | 'New Moon'
  | 'Waxing Crescent'
  | 'First Quarter'
  | 'Waxing Gibbous'
  | 'Full Moon'
  | 'Waning Gibbous'
  | 'Last Quarter'
  | 'Waning Crescent';

export interface EphemerisMoonPhase {
  ageDays: number;
  phaseFraction: number;
  illumination: number;
  name: EphemerisMoonPhaseName;
}

export type CelestialBodyId =
  | 'Sun'
  | 'Moon'
  | 'Mercury'
  | 'Venus'
  | 'Mars'
  | 'Jupiter'
  | 'Saturn'
  | 'Uranus'
  | 'Neptune'
  | 'Pluto';

export const CELESTIAL_BODIES: readonly CelestialBodyId[] = [
  'Sun',
  'Moon',
  'Mercury',
  'Venus',
  'Mars',
  'Jupiter',
  'Saturn',
  'Uranus',
  'Neptune',
  'Pluto',
] as const;

const BODY_MAP: Record<CelestialBodyId, Body> = {
  Sun: Body.Sun,
  Moon: Body.Moon,
  Mercury: Body.Mercury,
  Venus: Body.Venus,
  Mars: Body.Mars,
  Jupiter: Body.Jupiter,
  Saturn: Body.Saturn,
  Uranus: Body.Uranus,
  Neptune: Body.Neptune,
  Pluto: Body.Pluto,
};

/** Mean synodic month (days) — used only for ageDays display. */
const SYNODIC_MONTH = 29.530588853;

export interface BodyPosition {
  id: CelestialBodyId;
  /** Geocentric true ecliptic-of-date longitude (degrees). */
  longitude: number;
  tropical: ZodiacPosition;
  retrograde: boolean;
  /** Altitude in degrees when observer given; else undefined. */
  altitude?: number;
  /** Azimuth degrees clockwise from north when observer given. */
  azimuth?: number;
  aboveHorizon?: boolean;
}

export interface SkySnapshot {
  when: Date;
  bodies: BodyPosition[];
  moon: EphemerisMoonPhase;
}

/**
 * Geocentric true ecliptic-of-date longitude for a body (degrees 0…360).
 */
export function geocentricEclipticLongitude(
  id: CelestialBodyId,
  date: Date
): number {
  if (id === 'Sun') {
    return normalize360(SunPosition(date).elon);
  }
  if (id === 'Moon') {
    return normalize360(EclipticGeoMoon(date).lon);
  }
  const body = BODY_MAP[id];
  const vec = GeoVector(body, date, true);
  const rot = Rotation_EQJ_ECT(date);
  const ect = RotateVector(rot, vec);
  return normalize360(SphereFromVector(ect).lon);
}

function normalize360(lon: number): number {
  const x = lon % 360;
  return x < 0 ? x + 360 : x;
}

/** Shortest signed longitude delta in (−180, 180]. */
function lonDelta(later: number, earlier: number): number {
  let d = later - earlier;
  if (d > 180) d -= 360;
  if (d <= -180) d += 360;
  return d;
}

/**
 * True when ecliptic longitude decreases over a short interval
 * (apparent retrograde motion). Sun/Moon are never retrograde.
 */
export function isRetrograde(id: CelestialBodyId, date: Date): boolean {
  if (id === 'Sun' || id === 'Moon') return false;
  const later = new Date(date.getTime() + 12 * 60 * 60 * 1000);
  const a = geocentricEclipticLongitude(id, date);
  const b = geocentricEclipticLongitude(id, later);
  return lonDelta(b, a) < 0;
}

function horizonForBody(
  id: CelestialBodyId,
  date: Date,
  lat: number,
  lon: number
): { altitude: number; azimuth: number } {
  const observer = new Observer(lat, lon, 0);
  const body = BODY_MAP[id];
  const eq = Equator(body, date, observer, true, true);
  const hor = Horizon(date, observer, eq.ra, eq.dec, 'normal');
  return { altitude: hor.altitude, azimuth: hor.azimuth };
}

function phaseNameFromElongation(elongation: number): EphemerisMoonPhaseName {
  const t = ((elongation % 360) + 360) % 360;
  // Eight equal slices around the synodic cycle (0 = new)
  if (t < 22.5 || t >= 337.5) return 'New Moon';
  if (t < 67.5) return 'Waxing Crescent';
  if (t < 112.5) return 'First Quarter';
  if (t < 157.5) return 'Waxing Gibbous';
  if (t < 202.5) return 'Full Moon';
  if (t < 247.5) return 'Waning Gibbous';
  if (t < 292.5) return 'Last Quarter';
  return 'Waning Crescent';
}

/** Moon phase + illumination from astronomy-engine. */
export function getEphemerisMoonPhase(date: Date = new Date()): EphemerisMoonPhase {
  const elongation = MoonPhase(date);
  const illum = Illumination(Body.Moon, date);
  const phaseFraction = normalize360(elongation) / 360;
  return {
    ageDays: phaseFraction * SYNODIC_MONTH,
    phaseFraction,
    illumination: illum.phase_fraction,
    name: phaseNameFromElongation(elongation),
  };
}

/**
 * Full sky snapshot for the given moment.
 * Pass lat/lon for altitude / above-horizon flags.
 */
export function buildSkySnapshot(
  when: Date,
  lat?: number,
  lon?: number
): SkySnapshot {
  const hasObserver =
    lat != null &&
    lon != null &&
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180;

  const bodies: BodyPosition[] = CELESTIAL_BODIES.map((id) => {
    const longitude = geocentricEclipticLongitude(id, when);
    const tropical = tropicalFromLongitude(longitude);
    const retrograde = isRetrograde(id, when);
    const pos: BodyPosition = {
      id,
      longitude,
      tropical,
      retrograde,
    };
    if (hasObserver) {
      const hor = horizonForBody(id, when, lat!, lon!);
      pos.altitude = hor.altitude;
      pos.azimuth = hor.azimuth;
      pos.aboveHorizon = hor.altitude > 0;
    }
    return pos;
  });

  return {
    when,
    bodies,
    moon: getEphemerisMoonPhase(when),
  };
}

export function formatBodyRow(body: BodyPosition): string {
  const trop = formatZodiacPosition(body.tropical);
  return body.retrograde ? `${trop} ℞` : trop;
}

export function getBody(
  snapshot: SkySnapshot,
  id: CelestialBodyId
): BodyPosition | undefined {
  return snapshot.bodies.find((b) => b.id === id);
}
