import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { apiFetch } from '../lib/api';
import {
  loadNatalProfile,
  normalizeNatalProfile,
  persistNatalProfile,
  saveNatalProfileLocal,
  type NatalProfile,
} from '../lib/natalProfile';
import {
  loadPlanetaryLocation,
  persistPlanetaryLocation,
  savePlanetaryLocation,
  type PlanetaryLocation,
} from '../lib/planetaryLocation';

export interface AuthUser {
  _id: string;
  username: string;
  email: string;
  location?: PlanetaryLocation | null;
  natal?: NatalProfile | null;
}

interface AuthResponse {
  user: AuthUser;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  /** Resolved location: account → localStorage cache. */
  location: PlanetaryLocation | null;
  /** Resolved natal profile: account → localStorage cache. */
  natal: NatalProfile | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  /** Save lat/lon to localStorage and, when signed in, to the user profile. */
  saveLocation: (lat: number, lon: number) => Promise<void>;
  /** Save natal birth profile locally and, when signed in, to the account. */
  saveNatal: (profile: NatalProfile) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function authRequest(
  path: string,
  body: Record<string, string>
): Promise<AuthResponse> {
  const res = await apiFetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as AuthResponse & { message?: string };

  if (!res.ok) {
    throw new Error(data.message || 'Authentication failed');
  }

  return data;
}

function syncLocationFromUser(user: AuthUser): void {
  if (user.location?.lat != null && user.location?.lon != null) {
    savePlanetaryLocation(user.location.lat, user.location.lon);
  }
}

function syncNatalFromUser(user: AuthUser): void {
  const natal = normalizeNatalProfile(user.natal);
  if (natal) {
    saveNatalProfileLocal(natal);
  }
}

async function pushGuestNatalIfNeeded(user: AuthUser): Promise<AuthUser> {
  if (user.natal && normalizeNatalProfile(user.natal)) {
    syncNatalFromUser(user);
    return user;
  }
  const local = loadNatalProfile();
  if (!local) return user;
  try {
    await persistNatalProfile(local, true);
    const next = { ...user, natal: local };
    syncNatalFromUser(next);
    return next;
  } catch {
    return user;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [locationTick, setLocationTick] = useState(0);
  const [natalTick, setNatalTick] = useState(0);

  const refreshLocation = useCallback(() => {
    setLocationTick((n) => n + 1);
  }, []);

  const refreshNatal = useCallback(() => {
    setNatalTick((n) => n + 1);
  }, []);

  /** Hydrate session from HttpOnly cookie via /api/auth/me. */
  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      // Clear legacy localStorage JWT if present from older clients.
      try {
        localStorage.removeItem('ananael_auth');
      } catch {
        // ignore
      }

      try {
        const res = await apiFetch('/api/auth/me');
        if (res.ok) {
          const data = (await res.json()) as { user: AuthUser };
          if (!cancelled) {
            let next = data.user;
            syncLocationFromUser(next);

            // If account has no location yet, push guest localStorage up.
            if (!next.location) {
              const local = loadPlanetaryLocation();
              if (local) {
                await persistPlanetaryLocation(local.lat, local.lon, true);
                next = { ...next, location: local };
              }
            }

            next = await pushGuestNatalIfNeeded(next);
            setUser(next);
          }
        } else if (res.status === 401) {
          if (!cancelled) {
            setUser(null);
          }
        }
      } catch {
        // Keep unauthenticated UI if network fails
      }

      if (!cancelled) {
        refreshLocation();
        refreshNatal();
        setIsLoading(false);
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [refreshLocation, refreshNatal]);

  /** Keep lastSeenAt fresh while signed in (dashboard online count). */
  useEffect(() => {
    if (!user) return;

    const PRESENCE_MS = 2.5 * 60 * 1000;

    const ping = () => {
      void apiFetch('/api/auth/presence', { method: 'POST' }).catch(() => {
        /* ignore heartbeat failures */
      });
    };

    ping();
    const id = window.setInterval(ping, PRESENCE_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        ping();
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [user]);

  const persist = useCallback(
    (next: AuthResponse) => {
      setUser(next.user);
      syncLocationFromUser(next.user);
      syncNatalFromUser(next.user);
      refreshLocation();
      refreshNatal();
    },
    [refreshLocation, refreshNatal]
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await authRequest('/api/auth/login', { email, password });
      // Prefer account location; otherwise upload guest cache.
      if (!data.user.location) {
        const local = loadPlanetaryLocation();
        if (local) {
          try {
            await persistPlanetaryLocation(local.lat, local.lon, true);
            data.user = { ...data.user, location: local };
          } catch {
            // Keep login even if location sync fails
          }
        }
      } else {
        syncLocationFromUser(data.user);
      }
      data.user = await pushGuestNatalIfNeeded(data.user);
      persist(data);
    },
    [persist]
  );

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      const data = await authRequest('/api/auth/register', {
        username,
        email,
        password,
      });
      const local = loadPlanetaryLocation();
      if (local) {
        try {
          await persistPlanetaryLocation(local.lat, local.lon, true);
          data.user = { ...data.user, location: local };
        } catch {
          // Keep register even if location sync fails
        }
      }
      data.user = await pushGuestNatalIfNeeded(data.user);
      persist(data);
    },
    [persist]
  );

  const logout = useCallback(() => {
    void apiFetch('/api/auth/logout', { method: 'POST' }).finally(() => {
      setUser(null);
      refreshLocation();
      refreshNatal();
    });
  }, [refreshLocation, refreshNatal]);

  const saveLocation = useCallback(
    async (lat: number, lon: number) => {
      await persistPlanetaryLocation(lat, lon, Boolean(user));
      if (user) {
        setUser((prev) => {
          if (!prev) return prev;
          if (
            prev.location?.lat === lat &&
            prev.location?.lon === lon
          ) {
            return prev;
          }
          return {
            ...prev,
            location: { lat, lon },
          };
        });
      }
      refreshLocation();
    },
    [user, refreshLocation]
  );

  const saveNatal = useCallback(
    async (profile: NatalProfile) => {
      const saved = await persistNatalProfile(profile, Boolean(user));
      if (!saved) {
        throw new Error('Invalid natal profile');
      }
      if (user) {
        setUser((prev) => (prev ? { ...prev, natal: saved } : prev));
      }
      refreshNatal();
    },
    [user, refreshNatal]
  );

  const location = useMemo(() => {
    void locationTick;
    if (user?.location?.lat != null && user?.location?.lon != null) {
      return user.location;
    }
    return loadPlanetaryLocation();
  }, [user, locationTick]);

  const natal = useMemo(() => {
    void natalTick;
    const fromUser = normalizeNatalProfile(user?.natal);
    if (fromUser) return fromUser;
    return loadNatalProfile();
  }, [user, natalTick]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      location,
      natal,
      login,
      register,
      logout,
      saveLocation,
      saveNatal,
    }),
    [
      user,
      isLoading,
      location,
      natal,
      login,
      register,
      logout,
      saveLocation,
      saveNatal,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
