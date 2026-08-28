/**
 * Enochian natal overlay — Heptarchia courts from planets / weekday,
 * Watchtower King + Tablet of Union from sign element. Governors are
 * geographic (Parts of the Earth), not horoscopic: this lib only flags
 * whether birth place is set so the UI can point at the study tables.
 *
 * Not a Dee nativity method. Watchtower Kings are Golden Dawn reconstruction.
 * Traditional domiciles only (no Uranus / Neptune / Pluto officers).
 */

import {
  getHeptarchiaCourt,
  getHeptarchiaCourtByWeekday,
  getWatchtower,
  isHeptarchiaPlanet,
  type HeptarchiaCourt,
  type HeptarchiaPlanet,
  type HeptarchiaWeekday,
  type WatchtowerRecord,
} from '../data/enochianHierarchy';
import type { CelestialBodyId } from './celestialEphemeris';
import type { WesternSign } from './westernZodiac';

const WEEKDAYS: readonly HeptarchiaWeekday[] = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

/** Traditional domicile lords — never modern outers. */
export const TRADITIONAL_DOMICILE: Record<WesternSign, HeptarchiaPlanet> = {
  Aries: 'Mars',
  Taurus: 'Venus',
  Gemini: 'Mercury',
  Cancer: 'Moon',
  Leo: 'Sun',
  Virgo: 'Mercury',
  Libra: 'Venus',
  Scorpio: 'Mars',
  Sagittarius: 'Jupiter',
  Capricorn: 'Saturn',
  Aquarius: 'Saturn',
  Pisces: 'Jupiter',
};

export const SIGN_ELEMENT: Record<
  WesternSign,
  WatchtowerRecord['element']
> = {
  Aries: 'Fire',
  Leo: 'Fire',
  Sagittarius: 'Fire',
  Taurus: 'Earth',
  Virgo: 'Earth',
  Capricorn: 'Earth',
  Gemini: 'Air',
  Libra: 'Air',
  Aquarius: 'Air',
  Cancer: 'Water',
  Scorpio: 'Water',
  Pisces: 'Water',
};

export interface EnochianNatalCourt {
  planet: HeptarchiaPlanet;
  weekday: HeptarchiaWeekday;
  king: string;
  prince: string;
}

export interface EnochianNatalWatchtower {
  element: WatchtowerRecord['element'];
  quarter: WatchtowerRecord['quarter'];
  king: string;
  union: string;
}

export type EnochianNatalBodies = Partial<
  Record<HeptarchiaPlanet, EnochianNatalCourt>
>;

export interface EnochianNatal {
  dayCourt: EnochianNatalCourt;
  sunCourt: EnochianNatalCourt;
  rulerCourt: EnochianNatalCourt;
  risingCourt?: EnochianNatalCourt;
  sunWatchtower: EnochianNatalWatchtower;
  risingWatchtower?: EnochianNatalWatchtower;
  bodies: EnochianNatalBodies;
  /** True when birth place is present — Governors remain a study note. */
  governorsPlaceSet: boolean;
}

export interface EnochianNatalInput {
  birthDate: string;
  sunSign?: WesternSign;
  ascSign?: WesternSign;
  housesReady: boolean;
  birthPlaceSet: boolean;
  positions: ReadonlyArray<{ id: CelestialBodyId }>;
}

function courtToNatal(court: HeptarchiaCourt): EnochianNatalCourt {
  return {
    planet: court.planet,
    weekday: court.weekday,
    king: court.king,
    prince: court.prince,
  };
}

function courtForPlanet(planet: HeptarchiaPlanet): EnochianNatalCourt {
  return courtToNatal(getHeptarchiaCourt(planet)!);
}

function watchtowerForSign(sign: WesternSign): EnochianNatalWatchtower {
  const rec = getWatchtower(SIGN_ELEMENT[sign])!;
  return {
    element: rec.element,
    quarter: rec.quarter,
    king: rec.king,
    union: rec.union,
  };
}

/** Local civil weekday of YYYY-MM-DD (Sunday = Dee’s first heptarchic day). */
export function weekdayFromBirthDate(birthDate: string): HeptarchiaWeekday {
  const [y, m, d] = birthDate.split('-').map(Number);
  const day = new Date(y, m - 1, d).getDay();
  return WEEKDAYS[day];
}

export function buildEnochianNatal(
  input: EnochianNatalInput
): EnochianNatal | null {
  if (!input.sunSign) return null;
  const dayCourt = courtToNatal(
    getHeptarchiaCourtByWeekday(weekdayFromBirthDate(input.birthDate))!
  );
  const sunCourt = courtForPlanet('Sun');
  const rulerCourt = courtForPlanet(TRADITIONAL_DOMICILE[input.sunSign]);
  const sunWatchtower = watchtowerForSign(input.sunSign);

  const bodies: EnochianNatalBodies = {};
  for (const row of input.positions) {
    if (isHeptarchiaPlanet(row.id)) {
      bodies[row.id] = courtForPlanet(row.id);
    }
  }

  const result: EnochianNatal = {
    dayCourt,
    sunCourt,
    rulerCourt,
    sunWatchtower,
    bodies,
    governorsPlaceSet: input.birthPlaceSet,
  };

  if (input.housesReady && input.ascSign) {
    result.risingCourt = courtForPlanet(TRADITIONAL_DOMICILE[input.ascSign]);
    result.risingWatchtower = watchtowerForSign(input.ascSign);
  }

  return result;
}

export function formatEnochianCourt(court: EnochianNatalCourt): string {
  return `${court.king} · ${court.prince}`;
}

export function formatEnochianWatchtower(
  wt: EnochianNatalWatchtower
): string {
  return `${wt.king} · ${wt.union}`;
}

export function enochianExportPayload(
  overlay: EnochianNatal
): Record<string, unknown> {
  return {
    dayCourt: overlay.dayCourt,
    sunCourt: overlay.sunCourt,
    rulerCourt: overlay.rulerCourt,
    risingCourt: overlay.risingCourt ?? null,
    sunWatchtower: overlay.sunWatchtower,
    risingWatchtower: overlay.risingWatchtower ?? null,
    bodies: overlay.bodies,
    governorsPlaceSet: overlay.governorsPlaceSet,
  };
}
