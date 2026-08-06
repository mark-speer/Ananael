/**
 * Persist / load location used by Planetary Hours, Magical Journal sky tags,
 * and Magical OS. localStorage is the guest/offline cache; signed-in users
 * also sync to /api/auth/location on the User document.
 */

const STORAGE_KEY = 'ananael_planetary_location';

export interface PlanetaryLocation {
  lat: number;
  lon: number;
}

export function isValidPlanetaryLocation(lat: unknown, lon: unknown): boolean {
  const la = Number(lat);
  const lo = Number(lon);
  return (
    Number.isFinite(la) &&
    Number.isFinite(lo) &&
    la >= -90 &&
    la <= 90 &&
    lo >= -180 &&
    lo <= 180
  );
}

export function loadPlanetaryLocation(): PlanetaryLocation | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { lat?: unknown; lon?: unknown };
    const lat = Number(parsed.lat);
    const lon = Number(parsed.lon);
    if (!isValidPlanetaryLocation(lat, lon)) {
      return null;
    }
    return { lat, lon };
  } catch {
    return null;
  }
}

/** Write to localStorage only (guest cache / optimistic sync). */
export function savePlanetaryLocation(lat: number, lon: number): void {
  if (!isValidPlanetaryLocation(lat, lon)) {
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ lat, lon }));
}

/**
 * Persist location locally and, when authenticated, to the user profile.
 * Returns the saved location or null on validation failure.
 */
export async function persistPlanetaryLocation(
  lat: number,
  lon: number,
  token?: string | null
): Promise<PlanetaryLocation | null> {
  if (!isValidPlanetaryLocation(lat, lon)) {
    return null;
  }
  savePlanetaryLocation(lat, lon);
  if (!token) {
    return { lat, lon };
  }
  const res = await fetch('/api/auth/location', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ lat, lon }),
  });
  if (!res.ok) {
    throw new Error('Failed to save location to account');
  }
  return { lat, lon };
}
