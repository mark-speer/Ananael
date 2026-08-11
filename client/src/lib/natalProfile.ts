/**
 * Persist / load natal birth profile. localStorage is the guest cache;
 * signed-in users also sync to /api/auth/natal on the User document.
 */

import { apiFetch } from './api';
import {
  isValidPlanetaryLocation,
  type PlanetaryLocation,
} from './planetaryLocation';

const STORAGE_KEY = 'ananael_natal_profile';

/** Birth data used for natal chart calculation. */
export interface NatalProfile {
  /** Local civil date YYYY-MM-DD. */
  birthDate: string;
  /** Optional local time HH:MM. */
  birthTime?: string | null;
  /** Birth place coordinates (required for Asc / houses). */
  birthPlace?: PlanetaryLocation | null;
  /** Optional display label. */
  label?: string | null;
}

export function isValidBirthDate(date: unknown): date is string {
  if (typeof date !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const [y, m, d] = date.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return (
    dt.getFullYear() === y &&
    dt.getMonth() === m - 1 &&
    dt.getDate() === d
  );
}

export function isValidBirthTime(time: unknown): time is string {
  if (typeof time !== 'string' || time === '') return false;
  if (!/^\d{2}:\d{2}$/.test(time)) return false;
  const [hh, mm] = time.split(':').map(Number);
  return hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59;
}

export function normalizeNatalProfile(
  raw: unknown
): NatalProfile | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  if (!isValidBirthDate(o.birthDate)) return null;

  let birthTime: string | null = null;
  if (o.birthTime != null && o.birthTime !== '') {
    if (!isValidBirthTime(o.birthTime)) return null;
    birthTime = o.birthTime;
  }

  let birthPlace: PlanetaryLocation | null = null;
  const place = o.birthPlace;
  if (place && typeof place === 'object') {
    const p = place as { lat?: unknown; lon?: unknown };
    if (isValidPlanetaryLocation(p.lat, p.lon)) {
      birthPlace = { lat: Number(p.lat), lon: Number(p.lon) };
    }
  }

  const label =
    typeof o.label === 'string' && o.label.trim()
      ? o.label.trim().slice(0, 80)
      : null;

  return {
    birthDate: o.birthDate,
    birthTime,
    birthPlace,
    label,
  };
}

export function loadNatalProfile(): NatalProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return normalizeNatalProfile(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveNatalProfileLocal(profile: NatalProfile): void {
  const normalized = normalizeNatalProfile(profile);
  if (!normalized) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
}

export function clearNatalProfileLocal(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Persist natal profile locally and, when authenticated, to the user account.
 */
export async function persistNatalProfile(
  profile: NatalProfile,
  syncToAccount = false
): Promise<NatalProfile | null> {
  const normalized = normalizeNatalProfile(profile);
  if (!normalized) return null;
  saveNatalProfileLocal(normalized);
  if (!syncToAccount) {
    return normalized;
  }
  const res = await apiFetch('/api/auth/natal', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(normalized),
  });
  if (!res.ok) {
    throw new Error('Failed to save natal profile to account');
  }
  return normalized;
}

/** True when date + time + place are present (houses / full natal possible). */
export function hasNatalHousesReady(profile: NatalProfile | null | undefined): boolean {
  if (!profile) return false;
  return (
    isValidBirthDate(profile.birthDate) &&
    isValidBirthTime(profile.birthTime) &&
    Boolean(
      profile.birthPlace &&
        isValidPlanetaryLocation(
          profile.birthPlace.lat,
          profile.birthPlace.lon
        )
    )
  );
}
