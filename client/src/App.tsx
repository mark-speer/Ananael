import { useState } from 'react';
import AccountMenu from './components/AccountMenu';
import CorrespondencesModule from './components/CorrespondencesModule';
import DashboardModule from './components/DashboardModule';
import GematriaModule from './components/GematriaModule';
import IChingModule from './components/IChingModule';
import JournalModule from './components/JournalModule';
import PlanetaryHoursModule from './components/PlanetaryHoursModule';
import RitualSpaceModule from './components/RitualSpaceModule';
import ScriptTranslatorModule from './components/ScriptTranslatorModule';
import Sidebar, { MODULES, type ModuleId } from './components/Sidebar';
import SolomonicCircleModule from './components/SolomonicCircleModule';
import TarotModule from './components/TarotModule';
import TreeOfLifeModule, {
  type TreeNavigateOptions,
} from './components/TreeOfLifeModule';
import type { JournalEntryType } from './lib/journal';
import { useAuth } from './context/AuthContext';

export type AppNavigateOptions = TreeNavigateOptions & {
  filter?: JournalEntryType | 'all';
};

/**
 * App shell: fixed sidebar + main content area.
 * Magical OS is the default home; other modules remain individually navigable.
 */
export default function App() {
  const { isLoading } = useAuth();
  const [activeModule, setActiveModule] = useState<ModuleId>('dashboard');
  const [gematriaPrefill, setGematriaPrefill] = useState<string | undefined>();
  const [journalFilter, setJournalFilter] = useState<
    JournalEntryType | 'all'
  >('all');

  const navigateToModule = (module: ModuleId, opts?: AppNavigateOptions) => {
    if (module === 'gematria' && opts?.gematriaPrefill !== undefined) {
      setGematriaPrefill(opts.gematriaPrefill);
    } else {
      setGematriaPrefill(undefined);
    }
    if (module === 'journal') {
      setJournalFilter(opts?.filter ?? 'all');
    }
    setActiveModule(module);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center font-display text-ananael-gold">
        Opening Ananael…
      </div>
    );
  }

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <DashboardModule onNavigate={navigateToModule} />;
      case 'tarot':
        return <TarotModule onNavigate={navigateToModule} />;
      case 'journal':
        return <JournalModule initialFilter={journalFilter} />;
      case 'gematria':
        return <GematriaModule initialText={gematriaPrefill} />;
      case 'planetary':
        return <PlanetaryHoursModule />;
      case 'translator':
        return <ScriptTranslatorModule />;
      case 'iching':
        return <IChingModule onNavigate={navigateToModule} />;
      case 'tree':
        return <TreeOfLifeModule onNavigate={navigateToModule} />;
      case 'correspondences':
        return <CorrespondencesModule onNavigate={navigateToModule} />;
      case 'ritual':
        return <RitualSpaceModule />;
      case 'solomonic':
        return <SolomonicCircleModule />;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="sticky top-0 hidden h-screen md:block">
        <Sidebar activeModule={activeModule} onSelect={navigateToModule} />
      </div>

      <div className="flex min-h-screen flex-1 flex-col">
        <div className="border-b border-ananael-border/60 bg-ananael-surface px-4 py-3 md:hidden">
          <div className="flex items-center justify-between gap-3">
            <p className="font-display text-lg text-ananael-gold">Ananael</p>
            <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
              <label className="flex min-w-0 items-center gap-2 text-xs text-ananael-muted">
                <span className="sr-only">Module</span>
                <select
                  value={activeModule}
                  onChange={(e) =>
                    navigateToModule(e.target.value as ModuleId)
                  }
                  className="max-w-[10rem] truncate rounded-md border border-ananael-border bg-ananael-bg px-2 py-1.5 text-sm text-zinc-200 outline-none focus:border-ananael-violet"
                >
                  {MODULES.map((mod) => (
                    <option key={mod.id} value={mod.id}>
                      {mod.label}
                      {mod.comingSoon ? ' (Soon)' : ''}
                    </option>
                  ))}
                </select>
              </label>
              <AccountMenu className="max-w-[9rem] shrink-0" />
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-6xl space-y-6">{renderModule()}</div>
        </main>
      </div>
    </div>
  );
}
