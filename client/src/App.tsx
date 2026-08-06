import { useState } from 'react';
import AuthForms from './components/AuthForms';
import GematriaModule from './components/GematriaModule';
import IChingModule from './components/IChingModule';
import ModuleShell from './components/ModuleShell';
import PlanetaryHoursModule from './components/PlanetaryHoursModule';
import ScriptTranslatorModule from './components/ScriptTranslatorModule';
import Sidebar, { MODULES, type ModuleId } from './components/Sidebar';
import TarotModule from './components/TarotModule';
import { useAuth } from './context/AuthContext';

const SHELL_COPY: Partial<Record<ModuleId, { title: string; description: string }>> = {
  tree: {
    title: 'Tree of Life',
    description:
      'An interactive Glyph of the Sephiroth with path correspondences is planned for Phase 4.',
  },
  ritual: {
    title: 'Ritual Space Planner',
    description:
      'Canvas altar layouts, quarters, and export tools will arrive with Phase 4.',
  },
};

/**
 * App shell: fixed sidebar + main content area.
 * Phase 3 routes I Ching; unfinished modules show shells.
 */
export default function App() {
  const { isLoading } = useAuth();
  const [activeModule, setActiveModule] = useState<ModuleId>('tarot');

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center font-display text-ananael-gold">
        Opening Ananael…
      </div>
    );
  }

  const renderModule = () => {
    switch (activeModule) {
      case 'tarot':
        return <TarotModule />;
      case 'gematria':
        return <GematriaModule />;
      case 'planetary':
        return <PlanetaryHoursModule />;
      case 'translator':
        return <ScriptTranslatorModule />;
      case 'iching':
        return <IChingModule />;
      default: {
        const shell = SHELL_COPY[activeModule];
        if (!shell) return null;
        return <ModuleShell title={shell.title} description={shell.description} />;
      }
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="sticky top-0 hidden h-screen md:block">
        <Sidebar activeModule={activeModule} onSelect={setActiveModule} />
      </div>

      <div className="flex min-h-screen flex-1 flex-col">
        <div className="border-b border-ananael-border/60 bg-ananael-surface px-4 py-3 md:hidden">
          <div className="flex items-center justify-between gap-3">
            <p className="font-display text-lg text-ananael-gold">Ananael</p>
            <label className="flex min-w-0 flex-1 items-center justify-end gap-2 text-xs text-ananael-muted">
              <span className="sr-only">Module</span>
              <select
                value={activeModule}
                onChange={(e) => setActiveModule(e.target.value as ModuleId)}
                className="max-w-[14rem] truncate rounded-md border border-ananael-border bg-ananael-bg px-2 py-1.5 text-sm text-zinc-200 outline-none focus:border-ananael-violet"
              >
                {MODULES.map((mod) => (
                  <option key={mod.id} value={mod.id}>
                    {mod.label}
                    {mod.comingSoon ? ' (Soon)' : ''}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-6xl space-y-6">
            <AuthForms />
            {renderModule()}
          </div>
        </main>
      </div>
    </div>
  );
}
