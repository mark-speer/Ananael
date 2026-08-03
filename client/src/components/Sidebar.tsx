import { useAuth } from '../context/AuthContext';

export type ModuleId =
  | 'tarot'
  | 'planetary'
  | 'iching'
  | 'gematria'
  | 'tree'
  | 'translator'
  | 'ritual';

interface ModuleDef {
  id: ModuleId;
  label: string;
  comingSoon?: boolean;
}

const MODULES: ModuleDef[] = [
  { id: 'tarot', label: 'Tarot' },
  { id: 'planetary', label: 'Planetary Hours', comingSoon: true },
  { id: 'iching', label: 'I Ching', comingSoon: true },
  { id: 'gematria', label: 'Gematria', comingSoon: true },
  { id: 'tree', label: 'Tree of Life', comingSoon: true },
  { id: 'translator', label: 'Script Translator', comingSoon: true },
  { id: 'ritual', label: 'Ritual Space Planner', comingSoon: true },
];

interface SidebarProps {
  activeModule: ModuleId;
  onSelect: (id: ModuleId) => void;
}

/**
 * Fixed left navigation listing all Phase roadmap modules.
 * Only Tarot is interactive in Phase 1; others show Coming Soon.
 */
export default function Sidebar({ activeModule, onSelect }: SidebarProps) {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-ananael-border/60 bg-ananael-surface/90 backdrop-blur-sm">
      <div className="border-b border-ananael-border/60 px-5 py-6">
        <p className="font-display text-2xl font-semibold tracking-wide text-ananael-gold">
          Ananael
        </p>
        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-ananael-muted">
          Inner Sanctum
        </p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Modules">
        {MODULES.map((mod) => {
          const isActive = activeModule === mod.id && !mod.comingSoon;
          const disabled = Boolean(mod.comingSoon);

          return (
            <button
              key={mod.id}
              type="button"
              disabled={disabled}
              onClick={() => {
                if (!disabled) onSelect(mod.id);
              }}
              className={[
                'group flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-sm transition',
                disabled
                  ? 'cursor-not-allowed text-zinc-600'
                  : isActive
                    ? 'bg-ananael-violet/20 text-ananael-gold shadow-glow'
                    : 'text-zinc-300 hover:bg-ananael-panel hover:text-ananael-gold',
              ].join(' ')}
            >
              <span className="font-medium">{mod.label}</span>
              {mod.comingSoon && (
                <span className="rounded border border-zinc-700 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-zinc-500">
                  Soon
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-ananael-border/60 px-4 py-4">
        {isAuthenticated && user ? (
          <div className="space-y-2">
            <p className="truncate text-sm text-zinc-300">
              <span className="text-ananael-muted">Signed in as </span>
              {user.username}
            </p>
            <button
              type="button"
              onClick={logout}
              className="w-full rounded-md border border-ananael-border px-3 py-2 text-sm text-zinc-300 transition hover:border-ananael-violet hover:text-ananael-gold"
            >
              Sign out
            </button>
          </div>
        ) : (
          <p className="text-xs text-ananael-muted">
            Sign in to save readings to your profile.
          </p>
        )}
      </div>
    </aside>
  );
}
