import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
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
  token: string;
  user: AuthUser;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
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

const STORAGE_KEY = 'ananael_auth';

interface StoredAuth {
  token: string;
  user: AuthUser;
}

async function authRequest(
  path: string,
  body: Record<string, string>
): Promise<AuthResponse> {
  const res = await fetch(path, {
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
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [locationTick, setLocationTick] = useState(0);

  const refreshLocation = useCallback(() => {
    setLocationTick((n) => n + 1);
  }, []);

  /** Hydrate session from localStorage, then refresh profile from API. */
  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      let storedToken: string | null = null;
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as StoredAuth;
          if (parsed.token && parsed.user) {
            storedToken = parsed.token;
            if (!cancelled) {
              setToken(parsed.token);
              setUser(parsed.user);
              syncLocationFromUser(parsed.user);
            }
          }
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }

      if (storedToken) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${storedToken}` },
          });
          if (res.ok) {
            const data = (await res.json()) as { user: AuthUser };
            if (!cancelled) {
              setUser(data.user);
              localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({
                  token: storedToken,
                  user: data.user,
                } satisfies StoredAuth)
              );
              syncLocationFromUser(data.user);

              // If account has no location yet, push guest localStorage up.
              if (!data.user.location) {
                const local = loadPlanetaryLocation();
                if (local) {
                  await persistPlanetaryLocation(
                    local.lat,
                    local.lon,
                    storedToken
                  );
                  const updated: AuthUser = { ...data.user, location: local };
                  setUser(updated);
                  localStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify({
                      token: storedToken,
                      user: updated,
                    } satisfies StoredAuth)
                  );
                }
              }
            }
          } else if (res.status === 401) {
            localStorage.removeItem(STORAGE_KEY);
            if (!cancelled) {
              setToken(null);
              setUser(null);
            }
          }
        } catch {
          // Keep cached session if network fails
        }
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

  const persist = useCallback(
    (next: AuthResponse) => {
      setToken(next.token);
      setUser(next.user);
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          token: next.token,
          user: next.user,
        } satisfies StoredAuth)
      );
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
            await persistPlanetaryLocation(local.lat, local.lon, data.token);
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
          await persistPlanetaryLocation(local.lat, local.lon, data.token);
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
    setToken(null);
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    refreshLocation();
  }, [refreshLocation]);

  const saveLocation = useCallback(
    async (lat: number, lon: number) => {
      await persistPlanetaryLocation(lat, lon, token);
      if (token) {
        setUser((prev) => {
          if (!prev) return prev;
          if (
            prev.location?.lat === lat &&
            prev.location?.lon === lon
          ) {
            return prev;
          }
          const nextUser: AuthUser = {
            ...prev,
            location: { lat, lon },
          };
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ token, user: nextUser } satisfies StoredAuth)
          );
          return nextUser;
        });
      }
      refreshLocation();
    },
    [token, refreshLocation]
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
      token,
      isAuthenticated: Boolean(user && token),
      isLoading,
      location,
      login,
      register,
      logout,
      saveLocation,
    }),
    [
      user,
      token,
      isLoading,
      location,
      login,
      register,
      logout,
      saveLocation,
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
