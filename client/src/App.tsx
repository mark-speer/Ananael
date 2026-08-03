import { useState } from 'react';
import AuthForms from './components/AuthForms';
import Sidebar, { type ModuleId } from './components/Sidebar';
import TarotModule from './components/TarotModule';
import { useAuth } from './context/AuthContext';

/**
 * App shell: fixed sidebar + main content area.
 * Phase 1 routes all interactive work through the Tarot module.
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

  return (
    <div className="flex min-h-screen">
      <div className="sticky top-0 hidden h-screen md:block">
        <Sidebar activeModule={activeModule} onSelect={setActiveModule} />
      </div>

      {/* Mobile top bar with compact module switch */}
      <div className="flex min-h-screen flex-1 flex-col">
        <div className="border-b border-ananael-border/60 bg-ananael-surface px-4 py-3 md:hidden">
          <p className="font-display text-lg text-ananael-gold">Ananael</p>
        </div>

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-6xl space-y-6">
            <AuthForms />
            {activeModule === 'tarot' && <TarotModule />}
          </div>
        </main>
      </div>
    </div>
  );
}
