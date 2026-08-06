/**
 * Planetary hours — client-side diurnal/nocturnal hour table.
 *
 * Sunrise/sunset: NOAA Solar Calculator approximation
 * (https://www.esrl.noaa.gov/gmd/grad/solcalc/solareqns.PDF),
 * adapted to TypeScript. Accuracy is typically within a few minutes
 * for mid-latitudes; polar day/night edge cases return null sun events.
 *
 * Planetary day rulers and Chaldean hour order follow the traditional
 * Western astrological / hermetic sequence.
 */

export type PlanetId =
  | 'Sun'
  | 'Moon'
  | 'Mars'
  | 'Mercury'
  | 'Jupiter'
  | 'Venus'
  | 'Saturn';

/** Chaldean order used for successive planetary hours. */
export const CHALDEAN_ORDER: PlanetId[] = [
  'Saturn',
  'Jupiter',
  'Mars',
  'Sun',
  'Venus',
  'Mercury',
  'Moon',
];

/** Day ruler by JavaScript getDay(): 0=Sunday … 6=Saturday. */
export const DAY_RULERS: PlanetId[] = [
  'Sun',
  'Moon',
  'Mars',
  'Mercury',
  'Jupiter',
  'Venus',
  'Saturn',
];

export interface SunTimes {
  sunrise: Date;
  sunset: Date;
}

export interface PlanetaryHour {
  index: number;
  /** 1–12 within day or night segment. */
  hourOfSegment: number;
  segment: 'day' | 'night';
  planet: PlanetId;
  start: Date;
  end: Date;
}

export interface PlanetaryHoursChart {
  dayRuler: PlanetId;
  sunrise: Date;
  sunset: Date;
  nextSunrise: Date;
  hours: PlanetaryHour[];
  currentHour: PlanetaryHour | null;
}

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

function toJulian(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

/**
 * Approximate sunrise and sunset (local civil) for a calendar day at lat/lon.
 * Returns null when the sun does not rise or set that day.
 */
export function calculateSunTimes(
  date: Date,
  latitude: number,
  longitude: number
): SunTimes | null {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  // Noon local as reference for day-of-year
  const noonLocal = new Date(year, month - 1, day, 12, 0, 0, 0);
  const jc = (toJulian(noonLocal) - 2451545) / 36525;

  const geomMeanLong =
    (280.46646 + jc * (36000.76983 + 0.0003032 * jc)) % 360;
  const geomMeanAnom =
    357.52911 + jc * (35999.05029 - 0.0001537 * jc);
  const eccent =
    0.016708634 - jc * (0.000042037 + 0.0000001267 * jc);
  const sunEqCtr =
    Math.sin(geomMeanAnom * DEG) *
      (1.914602 - jc * (0.004817 + 0.000014 * jc)) +
    Math.sin(2 * geomMeanAnom * DEG) * (0.019993 - 0.000101 * jc) +
    Math.sin(3 * geomMeanAnom * DEG) * 0.000289;
  const sunTrueLong = geomMeanLong + sunEqCtr;
  const sunAppLong =
    sunTrueLong -
    0.00569 -
    0.00478 * Math.sin((125.04 - 1934.136 * jc) * DEG);
  const meanObliq =
    23 +
    (26 + (21.448 - jc * (46.815 + jc * (0.00059 - jc * 0.001813))) / 60) /
      60;
  const obliqCorr =
    meanObliq + 0.00256 * Math.cos((125.04 - 1934.136 * jc) * DEG);
  const sunDecl =
    Math.asin(Math.sin(obliqCorr * DEG) * Math.sin(sunAppLong * DEG)) * RAD;

  const varY = Math.tan((obliqCorr / 2) * DEG) ** 2;
  const eqTime =
    4 *
    RAD *
    (varY * Math.sin(2 * geomMeanLong * DEG) -
      2 * eccent * Math.sin(geomMeanAnom * DEG) +
      4 *
        eccent *
        varY *
        Math.sin(geomMeanAnom * DEG) *
        Math.cos(2 * geomMeanLong * DEG) -
      0.5 * varY * varY * Math.sin(4 * geomMeanLong * DEG) -
      1.25 * eccent * eccent * Math.sin(2 * geomMeanAnom * DEG));

  const hourAngleArg =
    (Math.cos(90.833 * DEG) /
      (Math.cos(latitude * DEG) * Math.cos(sunDecl * DEG)) -
      Math.tan(latitude * DEG) * Math.tan(sunDecl * DEG));

  if (hourAngleArg < -1 || hourAngleArg > 1) {
    return null;
  }

  const ha = Math.acos(hourAngleArg) * RAD;
  const solarNoonMin = 720 - 4 * longitude - eqTime;
  // Convert solar minutes to UTC, then to local Date via timezone offset of the reference day
  const tzOffsetMin = -noonLocal.getTimezoneOffset();
  const sunriseMin = solarNoonMin - ha * 4 + tzOffsetMin;
  const sunsetMin = solarNoonMin + ha * 4 + tzOffsetMin;

  const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
  const sunrise = new Date(startOfDay.getTime() + sunriseMin * 60000);
  const sunset = new Date(startOfDay.getTime() + sunsetMin * 60000);

  if (!(sunrise < sunset)) return null;
  return { sunrise, sunset };
}

function planetForHour(dayRuler: PlanetId, hourIndex: number): PlanetId {
  const start = CHALDEAN_ORDER.indexOf(dayRuler);
  return CHALDEAN_ORDER[(start + hourIndex) % 7];
}

/**
 * Build the 24 unequal planetary hours from sunrise to next sunrise.
 */
export function buildPlanetaryHours(
  date: Date,
  latitude: number,
  longitude: number,
  now: Date = new Date()
): PlanetaryHoursChart | null {
  const today = calculateSunTimes(date, latitude, longitude);
  if (!today) return null;

  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  const tomorrow = calculateSunTimes(nextDay, latitude, longitude);
  if (!tomorrow) return null;

  const { sunrise, sunset } = today;
  const nextSunrise = tomorrow.sunrise;
  const dayRuler = DAY_RULERS[date.getDay()];

  const dayLengthMs = sunset.getTime() - sunrise.getTime();
  const nightLengthMs = nextSunrise.getTime() - sunset.getTime();
  const dayHourMs = dayLengthMs / 12;
  const nightHourMs = nightLengthMs / 12;

  const hours: PlanetaryHour[] = [];

  for (let i = 0; i < 12; i++) {
    const start = new Date(sunrise.getTime() + i * dayHourMs);
    const end = new Date(sunrise.getTime() + (i + 1) * dayHourMs);
    hours.push({
      index: i,
      hourOfSegment: i + 1,
      segment: 'day',
      planet: planetForHour(dayRuler, i),
      start,
      end,
    });
  }

  for (let i = 0; i < 12; i++) {
    const start = new Date(sunset.getTime() + i * nightHourMs);
    const end = new Date(sunset.getTime() + (i + 1) * nightHourMs);
    hours.push({
      index: 12 + i,
      hourOfSegment: i + 1,
      segment: 'night',
      planet: planetForHour(dayRuler, 12 + i),
      start,
      end,
    });
  }

  const currentHour =
    hours.find((h) => now >= h.start && now < h.end) ?? null;

  return {
    dayRuler,
    sunrise,
    sunset,
    nextSunrise,
    hours,
    currentHour,
  };
}

export function formatTime(d: Date): string {
  return d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}
