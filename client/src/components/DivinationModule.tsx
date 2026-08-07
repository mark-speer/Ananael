import { useEffect, useState } from 'react';
import type { ModuleId } from './Sidebar';
import GeomancyModule from './GeomancyModule';
import IChingModule from './IChingModule';
import RunesModule from './RunesModule';
import TarotModule from './TarotModule';

export type DivinationTab = 'tarot' | 'iching' | 'geomancy' | 'runes';

export interface DivinationNavigateOptions {
  filter?: 'divination';
  divinationTab?: DivinationTab;
}

interface DivinationModuleProps {
  initialTab?: DivinationTab;
  onNavigate?: (module: ModuleId, opts?: DivinationNavigateOptions) => void;
}

const TABS: { id: DivinationTab; label: string }[] = [
  { id: 'tarot', label: 'Tarot' },
  { id: 'iching', label: 'I Ching' },
  { id: 'geomancy', label: 'Geomancy' },
  { id: 'runes', label: 'Runes' },
];

/**
 * Divination portal — tabbed shell for Tarot, I Ching, Geomancy, and Runes.
 */
export default function DivinationModule({
  initialTab = 'tarot',
  onNavigate,
}: DivinationModuleProps) {
  const [tab, setTab] = useState<DivinationTab>(initialTab);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl text-ananael-gold">Divination</h1>
        <p className="mt-2 max-w-2xl text-sm text-ananael-muted">
          Cast Tarot, I Ching, Geomancy, or Runes in one place. Guests may cast
          freely; sign in to archive readings in the Magical Journal.
        </p>
      </header>

      <div
        className="flex flex-wrap gap-2 border-b border-ananael-border/50 pb-3"
        role="tablist"
        aria-label="Divination systems"
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
        {tab === 'tarot' && (
          <TarotModule embedded onNavigate={onNavigate} />
        )}
        {tab === 'iching' && (
          <IChingModule embedded onNavigate={onNavigate} />
        )}
        {tab === 'geomancy' && (
          <GeomancyModule embedded onNavigate={onNavigate} />
        )}
        {tab === 'runes' && (
          <RunesModule embedded onNavigate={onNavigate} />
        )}
      </div>
    </div>
  );
}
