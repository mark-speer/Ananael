/**
 * Hindu / Vedic sidereal astrology helpers.
 * Default ayanamsa: Lahiri (Chitrapaksha) — standard civil/Vedic default.
 */

import {
  formatZodiacPosition,
  tropicalFromLongitude,
  type WesternSign,
  type ZodiacPosition,
} from './westernZodiac';

/** Sidereal rashis use the same twelve names as Western signs. */
export type Rashi = WesternSign;

export interface SiderealPosition extends ZodiacPosition {
  /** Lahiri ayanamsa applied (degrees). */
  ayanamsa: number;
  /** Tropical longitude before ayanamsa. */
  tropicalLongitude: number;
}

export type NakshatraName =
  | 'Ashwini'
  | 'Bharani'
  | 'Krittika'
  | 'Rohini'
  | 'Mrigashira'
  | 'Ardra'
  | 'Punarvasu'
  | 'Pushya'
  | 'Ashlesha'
  | 'Magha'
  | 'Purva Phalguni'
  | 'Uttara Phalguni'
  | 'Hasta'
  | 'Chitra'
  | 'Swati'
  | 'Vishakha'
  | 'Anuradha'
  | 'Jyeshtha'
  | 'Mula'
  | 'Purva Ashadha'
  | 'Uttara Ashadha'
  | 'Shravana'
  | 'Dhanishta'
  | 'Shatabhisha'
  | 'Purva Bhadrapada'
  | 'Uttara Bhadrapada'
  | 'Revati';

export const NAKSHATRAS: readonly NakshatraName[] = [
  'Ashwini',
  'Bharani',
  'Krittika',
  'Rohini',
  'Mrigashira',
  'Ardra',
  'Punarvasu',
  'Pushya',
  'Ashlesha',
  'Magha',
  'Purva Phalguni',
  'Uttara Phalguni',
  'Hasta',
  'Chitra',
  'Swati',
  'Vishakha',
  'Anuradha',
  'Jyeshtha',
  'Mula',
  'Purva Ashadha',
  'Uttara Ashadha',
  'Shravana',
  'Dhanishta',
  'Shatabhisha',
  'Purva Bhadrapada',
  'Uttara Bhadrapada',
  'Revati',
] as const;

/** Each nakshatra spans 13°20′ (360/27). */
export const NAKSHATRA_SPAN = 360 / 27;

export interface NakshatraInfo {
  index: number;
  name: NakshatraName;
  /** Pada 1–4 within the nakshatra. */
  pada: 1 | 2 | 3 | 4;
  /** Degrees into the nakshatra 0…13°20′. */
  degreeInNakshatra: number;
  /** Sidereal longitude used. */
  siderealLongitude: number;
}

/**
 * Lahiri (Chitrapaksha) ayanamsa in degrees.
 * Linear model from J2000.0 value ≈ 23.8534578° with ~50.29″/year.
 */
export function lahiriAyanamsa(date: Date): number {
  const j2000 = Date.UTC(2000, 0, 1, 12, 0, 0);
  const days = (date.getTime() - j2000) / 86_400_000;
  const years = days / 365.25;
  return 23.8534578 + (50.290966 / 3600) * years;
}

function normalize360(lon: number): number {
  const x = lon % 360;
  return x < 0 ? x + 360 : x;
}

/** Convert tropical ecliptic longitude to Lahiri sidereal. */
export function siderealFromTropical(
  tropicalLongitude: number,
  date: Date
): SiderealPosition {
  const ayanamsa = lahiriAyanamsa(date);
  const siderealLon = normalize360(tropicalLongitude - ayanamsa);
  const base = tropicalFromLongitude(siderealLon);
  return {
    ...base,
    ayanamsa,
    tropicalLongitude: normalize360(tropicalLongitude),
  };
}

/** Nakshatra + pada from sidereal longitude (0° = start of Ashwini). */
export function nakshatraFromSidereal(siderealLongitude: number): NakshatraInfo {
  const lon = normalize360(siderealLongitude);
  const index = Math.floor(lon / NAKSHATRA_SPAN) % 27;
  const degreeInNakshatra = lon - index * NAKSHATRA_SPAN;
  const pada = (Math.floor(degreeInNakshatra / (NAKSHATRA_SPAN / 4)) + 1) as
    | 1
    | 2
    | 3
    | 4;
  return {
    index,
    name: NAKSHATRAS[index],
    pada,
    degreeInNakshatra,
    siderealLongitude: lon,
  };
}

export function formatSiderealPosition(pos: SiderealPosition): string {
  return formatZodiacPosition(pos);
}

export function formatNakshatra(info: NakshatraInfo): string {
  return `${info.name} (pada ${info.pada})`;
}
