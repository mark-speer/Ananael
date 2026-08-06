/**
 * Approximate lunar phase from synodic age.
 * Accuracy is typically within a few hours for phase name; illumination
 * uses a simple cosine of phase angle (not geometric refinement).
 *
 * Reference epoch: known new moon 2000-01-06 18:14 UTC.
 */

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
  /** Fraction of cycle 0–1. */
  phaseFraction: number;
  /** Illuminated fraction 0–1. */
  illumination: number;
  name: MoonPhaseName;
}

/** Mean synodic month length (days). */
const SYNODIC_MONTH = 29.530588853;

/** New moon near J2000: 2000-01-06 18:14 UTC. */
const KNOWN_NEW_MOON_MS = Date.UTC(2000, 0, 6, 18, 14, 0);

export function getMoonPhase(date: Date = new Date()): MoonPhaseInfo {
  const ageDays =
    ((date.getTime() - KNOWN_NEW_MOON_MS) / 86400000) % SYNODIC_MONTH;
  const normalizedAge = ageDays < 0 ? ageDays + SYNODIC_MONTH : ageDays;
  const phaseFraction = normalizedAge / SYNODIC_MONTH;
  // Illumination ≈ (1 − cos(2π × fraction)) / 2
  const illumination =
    (1 - Math.cos(2 * Math.PI * phaseFraction)) / 2;

  const name = phaseNameFromFraction(phaseFraction);

  return {
    ageDays: normalizedAge,
    phaseFraction,
    illumination,
    name,
  };
}

function phaseNameFromFraction(fraction: number): MoonPhaseName {
  // Eight equal slices of the synodic cycle
  const t = ((fraction % 1) + 1) % 1;
  if (t < 0.0625 || t >= 0.9375) return 'New Moon';
  if (t < 0.1875) return 'Waxing Crescent';
  if (t < 0.3125) return 'First Quarter';
  if (t < 0.4375) return 'Waxing Gibbous';
  if (t < 0.5625) return 'Full Moon';
  if (t < 0.6875) return 'Waning Gibbous';
  if (t < 0.8125) return 'Last Quarter';
  return 'Waning Crescent';
}
