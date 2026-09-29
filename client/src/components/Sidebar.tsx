import AccountMenu from './AccountMenu';

export type ModuleId =
  | 'dashboard'
  | 'divination'
  | 'tarot'
  | 'iching'
  | 'planetary'
  | 'gematria'
  | 'grimoire'
  | 'translator'
  | 'atelier'
  | 'ritual'
  | 'solomonic'
  | 'correspondences'
  | 'journal'
  | 'talisman'
  | 'enochian'
  | 'liturgy'
  | 'opus'
  | 'subtleBody'
  | 'shamanism'
  | 'tree';

export type ModuleGroup = 'Home' | 'Practice' | 'Study';

const MODULE_GROUP_ORDER: ModuleGroup[] = ['Home', 'Practice', 'Study'];

/** Collapse legacy aliases to the sidebar module they live under. */
export function canonicalModuleId(id: ModuleId): ModuleId {
  if (id === 'tarot' || id === 'iching') return 'divination';
  if (id === 'ritual' || id === 'solomonic' || id === 'talisman') return 'atelier';
  if (id === 'tree' || id === 'opus' || id === 'enochian' || id === 'subtleBody' || id === 'shamanism') return 'grimoire';
  return id;
}

export interface ModuleDef {
  id: ModuleId;
  label: string;
  /** Shorter label for the mobile drawer. */
  shortLabel?: string;
  group: ModuleGroup;
  /** When true, show Soon badge; module remains navigable (shell). */
  comingSoon?: boolean;
}

export const MODULES: ModuleDef[] = [
  { id: 'dashboard', label: 'Magical OS', group: 'Home' },
  { id: 'divination', label: 'Divination', group: 'Practice' },
  { id: 'journal', label: 'Magical Journal', shortLabel: 'Journal', group: 'Practice' },
  { id: 'gematria', label: 'Gematria', group: 'Study' },
  { id: 'planetary', label: 'Celestial Timing', shortLabel: 'Timing', group: 'Practice' },
  { id: 'translator', label: 'Script Translator', shortLabel: 'Translator', group: 'Study' },
  { id: 'grimoire', label: 'Grimoire', group: 'Study' },
  { id: 'correspondences', label: 'Correspondences', group: 'Study' },
  { id: 'atelier', label: 'Atelier', group: 'Practice' },
  { id: 'liturgy', label: 'Ritual Library', shortLabel: 'Library', group: 'Practice' },
];

function modulesByGroup(): { group: ModuleGroup; modules: ModuleDef[] }[] {
  return MODULE_GROUP_ORDER.map((group) => ({
    group,
    modules: MODULES.filter((mod) => mod.group === group),
  })).filter((entry) => entry.modules.length > 0);
}

interface SidebarProps {
  activeModule: ModuleId;
  onSelect: (id: ModuleId) => void;
  /** `drawer` groups modules and omits the account footer (shown in the mobile header). */
  variant?: 'rail' | 'drawer';
  onClose?: () => void;
}

function ModuleButton({
  mod,
  isActive,
  label,
  onSelect,
}: {
  mod: ModuleDef;
  isActive: boolean;
  label: string;
  onSelect: (id: ModuleId) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(mod.id)}
      className={[
        'group flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-sm transition',
        isActive
          ? 'bg-ananael-violet/20 text-ananael-gold shadow-glow'
          : 'text-zinc-300 hover:bg-ananael-panel hover:text-ananael-gold',
      ].join(' ')}
    >
      <span className="font-medium">{label}</span>
      {mod.comingSoon && (
        <span className="rounded border border-zinc-700 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-zinc-500">
          Soon
        </span>
      )}
    </button>
  );
}

/**
 * Fixed left navigation listing all Phase roadmap modules.
 * Active modules are clickable; optional Soon badge via comingSoon.
 * `variant="drawer"` is the mobile slide-over: grouped labels, optional close.
 */
export default function Sidebar({
  activeModule,
  onSelect,
  variant = 'rail',
  onClose,
}: SidebarProps) {
  const highlightId = canonicalModuleId(activeModule);
  const grouped = variant === 'drawer';

  return (
    <aside className="flex h-full w-64 max-w-[85vw] shrink-0 flex-col border-r border-ananael-border/60 bg-ananael-surface/90 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-2 border-b border-ananael-border/60 px-5 py-6">
        <div>
          <p className="font-display text-2xl font-semibold tracking-wide text-ananael-gold">
            Ananael
          </p>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-ananael-muted">
            Inner Sanctum
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-md text-ananael-muted transition hover:bg-ananael-panel hover:text-zinc-200"
            aria-label="Close menu"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              aria-hidden
            >
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Modules">
        {grouped
          ? modulesByGroup().map((entry) => (
              <div key={entry.group} className="space-y-1 pt-2 first:pt-0">
                <p className="px-3 pb-1 text-[10px] uppercase tracking-[0.2em] text-ananael-muted">
                  {entry.group}
                </p>
                {entry.modules.map((mod) => (
                  <ModuleButton
                    key={mod.id}
                    mod={mod}
                    isActive={highlightId === mod.id}
                    label={mod.shortLabel ?? mod.label}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            ))
          : MODULES.map((mod) => (
              <ModuleButton
                key={mod.id}
                mod={mod}
                isActive={highlightId === mod.id}
                label={mod.label}
                onSelect={onSelect}
              />
            ))}
      </nav>

      {variant === 'rail' && (
        <div className="border-t border-ananael-border/60 px-3 py-3">
          <AccountMenu className="w-full" />
        </div>
      )}
    </aside>
  );
}
