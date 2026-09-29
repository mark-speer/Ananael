import { useState } from 'react';
import AlchemyModule, { type OpusPaneId } from './AlchemyModule';
import EnochianModule from './EnochianModule';
import IChingReferencePanel from './IChingReferencePanel';
import ShamanismModule from './ShamanismModule';
import SubtleBodyModule from './SubtleBodyModule';
import TarotReferencePanel from './TarotReferencePanel';
import TreeOfLifeModule from './TreeOfLifeModule';
import type { ModuleId } from './Sidebar';
import type { TreeNavigateOptions } from './TreeOfLifeModule';
import type { OpusStageId } from '../data/alchemy';
import type { SubtleBodyPane } from '../lib/subtleBody';
import type { ShamanismPane } from '../lib/shamanism';

export type GrimoireTab = 'tree' | 'athanor' | 'enochian' | 'subtleBody' | 'shamanism' | 'tarot' | 'iching';

interface GrimoireModuleProps {
  onNavigate: (module: ModuleId, opts?: TreeNavigateOptions) => void;
  initialTab?: GrimoireTab;
  initialTreeNavigateOptions?: TreeNavigateOptions;
}

const TABS: { id: GrimoireTab; label: string }[] = [
  { id: 'tree', label: 'Tree of Life' },
  { id: 'athanor', label: 'Athanor' },
  { id: 'enochian', label: 'Enochian' },
  { id: 'subtleBody', label: 'Subtle Body' },
  { id: 'shamanism', label: 'Shamanism' },
  { id: 'tarot', label: 'Tarot' },
  { id: 'iching', label: 'I Ching' },
];

/**
 * Grimoire: A unified reference container for esoteric study materials.
 * Combines Tree of Life, Athanor, Enochian, Subtle Body, Shamanism,
 * Tarot, and I Ching into separate tabs for streamlined navigation and thematic organization.
 */
export default function GrimoireModule({
  onNavigate,
  initialTab = 'tree',
  initialTreeNavigateOptions,
}: GrimoireModuleProps) {
  const [activeTab, setActiveTab] = useState<GrimoireTab>(initialTab);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'tree':
        return (
          <TreeOfLifeModule
            onNavigate={onNavigate}
            {...(initialTreeNavigateOptions ?? {})}
          />
        );
      case 'athanor':
        return (
          <AlchemyModule
            onNavigate={onNavigate}
            initialPane={initialTreeNavigateOptions?.opusPane as OpusPaneId | undefined ?? 'stages'}
            initialStageId={initialTreeNavigateOptions?.stageId as OpusStageId | undefined}
            initialMetal={initialTreeNavigateOptions?.metal}
          />
        );
      case 'enochian':
        return (
          <EnochianModule
            onNavigate={onNavigate}
            initialTab={initialTreeNavigateOptions?.enochianTab ?? 'tablets'}
            initialFocus={initialTreeNavigateOptions?.enochianFocus}
          />
        );
      case 'subtleBody':
        return (
          <SubtleBodyModule
            onNavigate={onNavigate}
            initialPane={initialTreeNavigateOptions?.subtleBodyPane as SubtleBodyPane | undefined ?? 'chakras'}
            initialFocus={initialTreeNavigateOptions?.subtleBodyFocus}
          />
        );
      case 'shamanism':
        return (
          <ShamanismModule
            onNavigate={onNavigate}
            initialPane={initialTreeNavigateOptions?.shamanismPane as ShamanismPane | undefined ?? 'worlds'}
            initialFocus={initialTreeNavigateOptions?.shamanismFocus}
            initialRunEntryId={initialTreeNavigateOptions?.runEntryId}
          />
        );
      case 'tarot':
        return <TarotReferencePanel />;
      case 'iching':
        return <IChingReferencePanel />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Tab Navigation */}
      <div className="border-b border-ananael-border/60 bg-ananael-surface/50 backdrop-blur-sm">
        <div className="flex gap-1 overflow-x-auto px-4 py-3">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={[
                'whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition',
                activeTab === tab.id
                  ? 'bg-ananael-violet/30 text-ananael-gold shadow-glow'
                  : 'text-zinc-400 hover:bg-ananael-panel hover:text-zinc-200',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {renderTabContent()}
      </div>
    </div>
  );
}
