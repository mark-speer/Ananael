import { useEffect, useState } from 'react';
import type { AppNavigateOptions } from '../App';
import type { TemplateId } from '../data/ritualTools';
import type { ModuleId } from './Sidebar';
import RitualSpaceModule from './RitualSpaceModule';
import SolomonicCircleModule from './SolomonicCircleModule';
import TalismanModule from './TalismanModule';

export type AtelierTab = 'ritual' | 'solomonic' | 'talisman';

interface AtelierModuleProps {
  initialTab?: AtelierTab;
  initialTemplate?: TemplateId;
  initialTalismanName?: string;
  onNavigate?: (module: ModuleId, opts?: AppNavigateOptions) => void;
}

const TABS: { id: AtelierTab; label: string }[] = [
  { id: 'ritual', label: 'Ritual Space' },
  { id: 'solomonic', label: 'Circles' },
  { id: 'talisman', label: 'Talismans' },
];

/**
 * Atelier portal — tabbed shell for Ritual Space, Solomonic Circles, and Talismans.
 */
export default function AtelierModule({
  initialTab = 'ritual',
  initialTemplate,
  initialTalismanName,
  onNavigate,
}: AtelierModuleProps) {
  const [tab, setTab] = useState<AtelierTab>(initialTab);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl text-ananael-gold">Atelier</h1>
        <p className="mt-2 max-w-2xl text-sm text-ananael-muted">
          Design altar layouts, Solomonic circles, and talismans in one workshop.
          Export PNG or JSON; sign in to save designs to your profile.
        </p>
      </header>

      <div
        className="flex flex-wrap gap-2 border-b border-ananael-border/50 pb-3"
        role="tablist"
        aria-label="Atelier crafts"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={[
              'rounded-md border px-4 py-2 text-sm transition',
              tab === t.id
                ? 'border-ananael-violet bg-ananael-violet/20 text-ananael-gold shadow-glow'
                : 'border-ananael-border bg-ananael-panel text-zinc-300 hover:border-ananael-gold/40 hover:text-ananael-gold',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel">
        {tab === 'ritual' && (
          <RitualSpaceModule embedded initialTemplate={initialTemplate} />
        )}
        {tab === 'solomonic' && <SolomonicCircleModule embedded />}
        {tab === 'talisman' && (
          <TalismanModule
            embedded
            initialName={initialTalismanName}
            onNavigate={onNavigate}
          />
        )}
      </div>
    </div>
  );
}
