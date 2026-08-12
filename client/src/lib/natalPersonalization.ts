/**
 * Helpers to bridge saved natal profile → Almanac / Magical OS personalization.
 */

import { buildNatalChart, type NatalChart } from './natalChart';
import type { NatalAlmanacContext } from './almanac';
import {
  nakshatraFromSidereal,
  siderealFromTropical,
} from './hinduAstrology';
import {
  hasNatalHousesReady,
  type NatalProfile,
} from './natalProfile';

export function natalAlmanacContextFromProfile(
  profile: NatalProfile | null | undefined
): NatalAlmanacContext | null {
  if (!profile || !hasNatalHousesReady(profile)) return null;
  const chart = buildNatalChart(profile);
  if (!chart?.isFullNatal) return null;
  const [, month, day] = profile.birthDate.split('-').map(Number);
  const moonSid =
    chart.moon != null
      ? siderealFromTropical(chart.moon.longitude, chart.when)
      : undefined;
  const nak =
    moonSid != null ? nakshatraFromSidereal(moonSid.longitude) : undefined;
  return {
    isFullNatal: true,
    sunSign: chart.sunSign,
    ascSign: chart.ascendant?.sign,
    rulerPlanet: chart.hermetic?.planet,
    birthMonth: month,
    birthDay: day,
    natalMoonSign: chart.moonSign,
    natalMoonNakshatra: nak?.name,
  };
}

export function fullNatalChartFromProfile(
  profile: NatalProfile | null | undefined
): NatalChart | null {
  if (!profile || !hasNatalHousesReady(profile)) return null;
  const chart = buildNatalChart(profile);
  return chart?.isFullNatal ? chart : null;
}
