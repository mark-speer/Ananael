/**
 * Lunar phase — backed by astronomy-engine via celestialEphemeris.
 * Types and getMoonPhase remain the public API for journal / dashboard.
 */

import { getEphemerisMoonPhase } from './celestialEphemeris';

export type MoonPhaseName =
  | 'New Moon'
  | 'Waxing Crescent'
  | 'First Quarter'
  | 'Waxing Gibbous'
  | 'Full Moon'
  | 'Waning Gibbous'
  | 'Last Quarter'
  | 'Waning Crescent';

export interface MoonPhaseInfo {
  /** Synodic age in days (0 … ~29.53). */
  ageDays: number;
  /** Fraction of cycle 0–1 (0 = new). */
  phaseFraction: number;
  /** Illuminated fraction 0–1. */
  illumination: number;
  name: MoonPhaseName;
}

export function getMoonPhase(date: Date = new Date()): MoonPhaseInfo {
  return getEphemerisMoonPhase(date);
}
