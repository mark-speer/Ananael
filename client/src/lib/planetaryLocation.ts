/**
 * Persist / load location used by Planetary Hours and Magical Journal sky tags.
 */

const STORAGE_KEY = 'ananael_planetary_location';

export interface PlanetaryLocation {
  lat: number;
  lon: number;
}

export function loadPlanetaryLocation(): PlanetaryLocation | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { lat?: unknown; lon?: unknown };
    const lat = Number(parsed.lat);
    const lon = Number(parsed.lon);
    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lon) ||
      lat < -90 ||
      lat > 90 ||
      lon < -180 ||
      lon > 180
    ) {
      return null;
    }
    return { lat, lon };
  } catch {
    return null;
  }
}

export function savePlanetaryLocation(lat: number, lon: number): void {
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180
  ) {
    return;
  }
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ lat, lon })
  );
}
