/**
 * Tropical (Western) zodiac helpers from geocentric ecliptic longitude.
 */

export type WesternSign =
  | 'Aries'
  | 'Taurus'
  | 'Gemini'
  | 'Cancer'
  | 'Leo'
  | 'Virgo'
  | 'Libra'
  | 'Scorpio'
  | 'Sagittarius'
  | 'Capricorn'
  | 'Aquarius'
  | 'Pisces';

export const WESTERN_SIGNS: readonly WesternSign[] = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
] as const;

/** Unicode glyphs for the twelve signs (Aries … Pisces). */
export const WESTERN_SIGN_GLYPHS: Record<WesternSign, string> = {
  Aries: '♈',
  Taurus: '♉',
  Gemini: '♊',
  Cancer: '♋',
  Leo: '♌',
  Virgo: '♍',
  Libra: '♎',
  Scorpio: '♏',
  Sagittarius: '♐',
  Capricorn: '♑',
  Aquarius: '♒',
  Pisces: '♓',
};

export interface ZodiacPosition {
  /** Ecliptic longitude 0…360. */
  longitude: number;
  sign: WesternSign;
  /** Degree within the sign 0…30. */
  degreeInSign: number;
  /** Whole degrees within the sign. */
  deg: number;
  /** Arcminutes within the degree. */
  min: number;
}

/** Normalize longitude into [0, 360). */
export function normalizeLongitude(lon: number): number {
  const x = lon % 360;
  return x < 0 ? x + 360 : x;
}

/** Map tropical ecliptic longitude to sign + degree. */
export function tropicalFromLongitude(longitude: number): ZodiacPosition {
  const lon = normalizeLongitude(longitude);
  const signIndex = Math.floor(lon / 30) % 12;
  const degreeInSign = lon - signIndex * 30;
  const deg = Math.floor(degreeInSign);
  const min = Math.floor((degreeInSign - deg) * 60);
  return {
    longitude: lon,
    sign: WESTERN_SIGNS[signIndex],
    degreeInSign,
    deg,
    min,
  };
}

/** Format as e.g. "Leo 14°22′". */
export function formatZodiacPosition(pos: ZodiacPosition): string {
  const min = String(pos.min).padStart(2, '0');
  return `${pos.sign} ${pos.deg}°${min}′`;
}
