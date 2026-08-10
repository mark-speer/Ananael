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
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  /** Save lat/lon to localStorage and, when signed in, to the user profile. */
  saveLocation: (lat: number, lon: number) => Promise<void>;
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [locationTick, setLocationTick] = useState(0);

  const refreshLocation = useCallback(() => {
    setLocationTick((n) => n + 1);
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
            setUser(data.user);
            syncLocationFromUser(data.user);

            // If account has no location yet, push guest localStorage up.
            if (!data.user.location) {
              const local = loadPlanetaryLocation();
              if (local) {
                await persistPlanetaryLocation(local.lat, local.lon, true);
                const updated: AuthUser = { ...data.user, location: local };
                setUser(updated);
              }
            }
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
        setIsLoading(false);
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [refreshLocation]);

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
      refreshLocation();
    },
    [refreshLocation]
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
      persist(data);
    },
    [persist]
  );

  const logout = useCallback(() => {
    void apiFetch('/api/auth/logout', { method: 'POST' }).finally(() => {
      setUser(null);
      refreshLocation();
    });
  }, [refreshLocation]);

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

  const location = useMemo(() => {
    void locationTick;
    if (user?.location?.lat != null && user?.location?.lon != null) {
      return user.location;
    }
    return loadPlanetaryLocation();
  }, [user, locationTick]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      location,
      login,
      register,
      logout,
      saveLocation,
    }),
    [user, isLoading, location, login, register, logout, saveLocation]
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
