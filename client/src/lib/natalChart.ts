/**
 * Natal chart computation — summary, positions, aspects, Ascendant, Whole Sign houses.
 * Client-side via astronomy-engine + existing zodiac / Chinese / correspondence libs.
 */

import { CORRESPONDENCE_KEYS } from '../data/correspondences';
import { modernBirthstonesForMonth } from '../data/birthstones';
import {
  buildChinesePillars,
  formatPillar,
  formatPillarShort,
  type ChinesePillars,
} from './chineseAstrology';
import {
  buildSkySnapshot,
  CELESTIAL_BODIES,
  formatBodyRow,
  getBody,
  type BodyPosition,
  type CelestialBodyId,
  type SkySnapshot,
} from './celestialEphemeris';
import {
  formatNakshatra,
  formatSiderealPosition,
  nakshatraFromSidereal,
  siderealFromTropical,
} from './hinduAstrology';
import {
  hasNatalHousesReady,
  type NatalProfile,
} from './natalProfile';
import {
  formatZodiacPosition,
  normalizeLongitude,
  tropicalFromLongitude,
  WESTERN_SIGNS,
  WESTERN_SIGN_GLYPHS,
  type WesternSign,
  type ZodiacPosition,
} from './westernZodiac';
import {
  buildEnochianNatal,
  enochianExportPayload,
  type EnochianNatal,
} from './enochianNatal';
import { MakeTime, SiderealTime } from 'astronomy-engine';

export type AspectKind =
  | 'conjunction'
  | 'sextile'
  | 'square'
  | 'trine'
  | 'opposition';

export interface NatalAspectDef {
  kind: AspectKind;
  angle: number;
  glyph: string;
}

export const MAJOR_ASPECTS: readonly NatalAspectDef[] = [
  { kind: 'conjunction', angle: 0, glyph: '☌' },
  { kind: 'sextile', angle: 60, glyph: '⚹' },
  { kind: 'square', angle: 90, glyph: '□' },
  { kind: 'trine', angle: 120, glyph: '△' },
  { kind: 'opposition', angle: 180, glyph: '☍' },
] as const;

/** Orb (degrees): luminaries vs other bodies. */
export const ASPECT_ORB_LIGHTS = 8;
export const ASPECT_ORB_OTHER = 6;

export const PLANET_GLYPHS: Record<CelestialBodyId, string> = {
  Sun: '☉',
  Moon: '☽',
  Mercury: '☿',
  Venus: '♀',
  Mars: '♂',
  Jupiter: '♃',
  Saturn: '♄',
  Uranus: '♅',
  Neptune: '♆',
  Pluto: '♇',
};

export interface HermeticSignRuler {
  sign: WesternSign;
  planet: string;
  hermeticStones: string[];
  pathKey?: number;
}

export interface NatalAspect {
  a: CelestialBodyId;
  b: CelestialBodyId;
  kind: AspectKind;
  glyph: string;
  exactAngle: number;
  orb: number;
  applying: boolean;
}

export interface WholeSignHouse {
  house: number;
  sign: WesternSign;
}

export interface NatalHousePlacement {
  id: CelestialBodyId;
  house: number;
  sign: WesternSign;
}

export interface NatalChart {
  profile: NatalProfile;
  /** Instant used for ephemeris (noon local if time unknown). */
  when: Date;
  timeUnknown: boolean;
  housesReady: boolean;
  sky: SkySnapshot;
  sun: BodyPosition | undefined;
  moon: BodyPosition | undefined;
  sunSign?: WesternSign;
  moonSign?: WesternSign;
  modernBirthstones: readonly string[];
  hermetic?: HermeticSignRuler;
  chinese: ChinesePillars;
  chineseYearLabel: string;
  hinduSun?: string;
  hinduMoon?: string;
  moonNakshatra?: string;
  positions: BodyPosition[];
  aspects: NatalAspect[];
  ascendant?: ZodiacPosition;
  houses?: WholeSignHouse[];
  housePlacements?: NatalHousePlacement[];
  /** Full natal for Magical OS / Almanac personalization gate. */
  isFullNatal: boolean;
  /** Heptarchia + Watchtower overlay; null until a Sun sign exists. */
  enochian?: EnochianNatal;
}

/** Parse profile into a local Date; noon when time missing. */
export function natalMoment(profile: NatalProfile): {
  when: Date;
  timeUnknown: boolean;
} {
  const [y, m, d] = profile.birthDate.split('-').map(Number);
  const timeUnknown = !profile.birthTime;
  if (timeUnknown) {
    return { when: new Date(y, m - 1, d, 12, 0, 0, 0), timeUnknown: true };
  }
  const [hh, mm] = profile.birthTime!.split(':').map(Number);
  return { when: new Date(y, m - 1, d, hh, mm, 0, 0), timeUnknown: false };
}

export function hermeticRulerForSign(sign: WesternSign): HermeticSignRuler {
  const key = CORRESPONDENCE_KEYS.find(
    (k) => k.kind === 'path' && k.zodiac === sign
  );
  return {
    sign,
    planet: key?.planet ?? '—',
    hermeticStones: key?.stone ?? [],
    pathKey: key?.key,
  };
}

/**
 * Tropical Ascendant (ecliptic longitude) from local sidereal time + latitude.
 * Matches astronomy-engine SiderealTime (GAST hours) + mean obliquity.
 */
export function ascendantLongitude(
  date: Date,
  lat: number,
  lon: number
): number {
  const time = MakeTime(date);
  const gast = SiderealTime(time);
  let lst = gast + lon / 15;
  lst = ((lst % 24) + 24) % 24;
  const ramc = lst * 15 * (Math.PI / 180);
  const T = time.tt / 36525;
  const eps =
    (23.4392911111 - 0.01300416667 * T - 1.638888e-7 * T * T) *
    (Math.PI / 180);
  const phi = lat * (Math.PI / 180);
  const y = Math.cos(ramc);
  const x = -(Math.sin(ramc) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps));
  const asc = (Math.atan2(y, x) * 180) / Math.PI;
  return normalizeLongitude(asc);
}

export function wholeSignHouses(ascSign: WesternSign): WholeSignHouse[] {
  const start = WESTERN_SIGNS.indexOf(ascSign);
  return WESTERN_SIGNS.map((_, i) => ({
    house: i + 1,
    sign: WESTERN_SIGNS[(start + i) % 12],
  }));
}

export function houseForSign(
  houses: WholeSignHouse[],
  sign: WesternSign
): number {
  const row = houses.find((h) => h.sign === sign);
  return row?.house ?? 1;
}

function shortestArc(a: number, b: number): number {
  let d = Math.abs(normalizeLongitude(a) - normalizeLongitude(b));
  if (d > 180) d = 360 - d;
  return d;
}

function orbForPair(a: CelestialBodyId, b: CelestialBodyId): number {
  if (a === 'Sun' || a === 'Moon' || b === 'Sun' || b === 'Moon') {
    return ASPECT_ORB_LIGHTS;
  }
  return ASPECT_ORB_OTHER;
}

export function buildNatalAspects(bodies: BodyPosition[]): NatalAspect[] {
  const aspects: NatalAspect[] = [];
  for (let i = 0; i < bodies.length; i++) {
    for (let j = i + 1; j < bodies.length; j++) {
      const A = bodies[i];
      const B = bodies[j];
      const sep = shortestArc(A.longitude, B.longitude);
      const maxOrb = orbForPair(A.id, B.id);
      for (const def of MAJOR_ASPECTS) {
        const orb = Math.abs(sep - def.angle);
        if (orb <= maxOrb) {
          // Crude applying flag: faster body closing (not full speed model).
          aspects.push({
            a: A.id,
            b: B.id,
            kind: def.kind,
            glyph: def.glyph,
            exactAngle: def.angle,
            orb,
            applying: false,
          });
          break;
        }
      }
    }
  }
  aspects.sort((x, y) => x.orb - y.orb);
  return aspects;
}

/**
 * Build a natal chart from a saved (or draft) birth profile.
 */
export function buildNatalChart(profile: NatalProfile): NatalChart | null {
  if (!profile.birthDate) return null;
  const { when, timeUnknown } = natalMoment(profile);
  const housesReady = hasNatalHousesReady(profile);
  const place = profile.birthPlace;
  const sky = buildSkySnapshot(
    when,
    housesReady && place ? place.lat : undefined,
    housesReady && place ? place.lon : undefined
  );
  const sun = getBody(sky, 'Sun');
  const moon = getBody(sky, 'Moon');
  const sunSign = sun?.tropical.sign;
  const moonSign = moon?.tropical.sign;
  const [y, month] = profile.birthDate.split('-').map(Number);
  void y;
  const chinese = buildChinesePillars(when);
  const sunSid = sun
    ? siderealFromTropical(sun.longitude, when)
    : undefined;
  const moonSid = moon
    ? siderealFromTropical(moon.longitude, when)
    : undefined;
  const nak =
    moonSid != null ? nakshatraFromSidereal(moonSid.longitude) : undefined;

  const aspects = buildNatalAspects(sky.bodies);

  let ascendant: ZodiacPosition | undefined;
  let houses: WholeSignHouse[] | undefined;
  let housePlacements: NatalHousePlacement[] | undefined;

  if (housesReady && place) {
    const ascLon = ascendantLongitude(when, place.lat, place.lon);
    ascendant = tropicalFromLongitude(ascLon);
    houses = wholeSignHouses(ascendant.sign);
    housePlacements = sky.bodies.map((b) => ({
      id: b.id,
      house: houseForSign(houses!, b.tropical.sign),
      sign: b.tropical.sign,
    }));
  }

  const isFullNatal = Boolean(
    housesReady && ascendant && houses && housePlacements && aspects
  );

  return {
    profile,
    when,
    timeUnknown,
    housesReady,
    sky,
    sun,
    moon,
    sunSign,
    moonSign,
    modernBirthstones: modernBirthstonesForMonth(month),
    hermetic: sunSign ? hermeticRulerForSign(sunSign) : undefined,
    chinese,
    chineseYearLabel: formatPillarShort(chinese.year),
    hinduSun: sunSid ? formatSiderealPosition(sunSid) : undefined,
    hinduMoon: moonSid ? formatSiderealPosition(moonSid) : undefined,
    moonNakshatra: nak ? formatNakshatra(nak) : undefined,
    positions: sky.bodies,
    aspects,
    ascendant,
    houses,
    housePlacements,
    isFullNatal,
    enochian:
      buildEnochianNatal({
        birthDate: profile.birthDate,
        sunSign,
        ascSign: ascendant?.sign,
        housesReady,
        birthPlaceSet: Boolean(place),
        positions: sky.bodies,
      }) ?? undefined,
  };
}

export function formatNatalSummaryLine(chart: NatalChart): string {
  const parts: string[] = [];
  if (chart.sunSign) {
    parts.push(
      `Sun ${WESTERN_SIGN_GLYPHS[chart.sunSign]} ${chart.sunSign}`
    );
  }
  if (chart.ascendant) {
    parts.push(
      `Asc ${WESTERN_SIGN_GLYPHS[chart.ascendant.sign]} ${chart.ascendant.sign}`
    );
  }
  if (chart.hermetic?.planet) {
    parts.push(`Ruler ${chart.hermetic.planet}`);
  }
  parts.push(chart.chineseYearLabel);
  return parts.join(' · ');
}

export function natalExportPayload(chart: NatalChart): Record<string, unknown> {
  return {
    system: 'ananael-natal',
    houseSystem: 'whole-sign',
    profile: chart.profile,
    when: chart.when.toISOString(),
    timeUnknown: chart.timeUnknown,
    sunSign: chart.sunSign,
    moonSign: chart.moonSign,
    ascendant: chart.ascendant
      ? formatZodiacPosition(chart.ascendant)
      : null,
    hermeticRuler: chart.hermetic?.planet ?? null,
    hermeticStones: chart.hermetic?.hermeticStones ?? [],
    modernBirthstones: [...chart.modernBirthstones],
    chinese: {
      year: formatPillar(chart.chinese.year),
      month: formatPillar(chart.chinese.month),
      day: formatPillar(chart.chinese.day),
      hour: chart.timeUnknown ? null : formatPillar(chart.chinese.hour),
    },
    positions: chart.positions.map((b) => ({
      id: b.id,
      tropical: formatBodyRow(b),
      longitude: b.longitude,
      house: chart.housePlacements?.find((h) => h.id === b.id)?.house ?? null,
    })),
    aspects: chart.aspects.map((a) => ({
      a: a.a,
      b: a.b,
      kind: a.kind,
      orb: Number(a.orb.toFixed(2)),
    })),
    houses: chart.houses ?? null,
    enochian: chart.enochian
      ? enochianExportPayload(chart.enochian)
      : null,
  };
}

export { CELESTIAL_BODIES, formatBodyRow, WESTERN_SIGN_GLYPHS };
