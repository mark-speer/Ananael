import { useEffect, useRef, useState } from 'react';
import AccountMenu from './components/AccountMenu';
import CelestialTimingModule from './components/CelestialTimingModule';
import CorrespondencesModule from './components/CorrespondencesModule';
import DashboardModule from './components/DashboardModule';
import DivinationModule, {
  type DivinationTab,
} from './components/DivinationModule';
import EnochianModule from './components/EnochianModule';
import GematriaModule from './components/GematriaModule';
import JournalModule from './components/JournalModule';
import LiturgyModule from './components/LiturgyModule';
import RitualSpaceModule from './components/RitualSpaceModule';
import ScriptTranslatorModule from './components/ScriptTranslatorModule';
import Sidebar, { MODULES, type ModuleId } from './components/Sidebar';
import SolomonicCircleModule from './components/SolomonicCircleModule';
import SplashPage from './components/SplashPage';
import TalismanModule from './components/TalismanModule';
import TreeOfLifeModule, {
  type TreeNavigateOptions,
} from './components/TreeOfLifeModule';
import type { TemplateId } from './data/ritualTools';
import type { JournalEntryType } from './lib/journal';
import { useAuth } from './context/AuthContext';

export type AppNavigateOptions = TreeNavigateOptions & {
  filter?: JournalEntryType | 'all';
  divinationTab?: DivinationTab;
  planetaryPanel?: 'hours' | 'planets' | 'zodiac' | 'elections' | 'almanac';
  ritualTemplate?: TemplateId;
};

function resolveModule(module: ModuleId): {
  module: ModuleId;
  divinationTab?: DivinationTab;
} {
  if (module === 'tarot') return { module: 'divination', divinationTab: 'tarot' };
  if (module === 'iching')
    return { module: 'divination', divinationTab: 'iching' };
  return { module };
}

/**
 * App shell: fixed sidebar + main content area.
 * Magical OS is the default home; other modules remain individually navigable.
 * Logged-out visitors see the splash until they sign in or continue as guest.
 */
export default function App() {
  const { isLoading, isAuthenticated } = useAuth();
  const [enteredAsGuest, setEnteredAsGuest] = useState(false);
  const wasAuthenticated = useRef(false);
  const [activeModule, setActiveModule] = useState<ModuleId>('dashboard');
  const [gematriaPrefill, setGematriaPrefill] = useState<string | undefined>();
  const [correspondencesQuery, setCorrespondencesQuery] = useState<
    string | undefined
  >();
  const [journalFilter, setJournalFilter] = useState<
    JournalEntryType | 'all'
  >('all');
  const [divinationTab, setDivinationTab] = useState<DivinationTab>('tarot');
  const [planetaryPanel, setPlanetaryPanel] = useState<
    'hours' | 'planets' | 'zodiac' | 'elections' | 'almanac'
  >('hours');
  const [ritualTemplate, setRitualTemplate] = useState<
    TemplateId | undefined
  >();
  const [talismanPrefill, setTalismanPrefill] = useState<string | undefined>();

  useEffect(() => {
    if (wasAuthenticated.current && !isAuthenticated) {
      setEnteredAsGuest(false);
    }
    wasAuthenticated.current = isAuthenticated;
  }, [isAuthenticated]);

  const navigateToModule = (module: ModuleId, opts?: AppNavigateOptions) => {
    const resolved = resolveModule(module);
    const target = resolved.module;

    if (target === 'gematria' && opts?.gematriaPrefill !== undefined) {
      setGematriaPrefill(opts.gematriaPrefill);
    } else {
      setGematriaPrefill(undefined);
    }
    if (
      target === 'correspondences' &&
      opts?.correspondencesQuery !== undefined
    ) {
      setCorrespondencesQuery(opts.correspondencesQuery);
    } else {
      setCorrespondencesQuery(undefined);
    }
    if (target === 'journal') {
      setJournalFilter(opts?.filter ?? 'all');
    }
    if (target === 'divination') {
      setDivinationTab(
        opts?.divinationTab ?? resolved.divinationTab ?? 'tarot'
      );
    }
    if (target === 'planetary') {
      setPlanetaryPanel(opts?.planetaryPanel ?? 'hours');
    }
    if (target === 'ritual') {
      setRitualTemplate(opts?.ritualTemplate);
    } else {
      setRitualTemplate(undefined);
    }
    if (target === 'talisman' && opts?.gematriaPrefill !== undefined) {
      setTalismanPrefill(opts.gematriaPrefill);
    } else if (target !== 'talisman') {
      setTalismanPrefill(undefined);
    }
    setActiveModule(target);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center font-display text-ananael-gold">
        Opening Ananael…
      </div>
    );
  }

  if (!isAuthenticated && !enteredAsGuest) {
    return <SplashPage onEnterGuest={() => setEnteredAsGuest(true)} />;
  }

  const renderModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <DashboardModule onNavigate={navigateToModule} />;
      case 'divination':
      case 'tarot':
      case 'iching':
        return (
          <DivinationModule
            initialTab={divinationTab}
            onNavigate={navigateToModule}
          />
        );
      case 'journal':
        return <JournalModule initialFilter={journalFilter} />;
      case 'gematria':
        return <GematriaModule initialText={gematriaPrefill} />;
      case 'planetary':
        return (
          <CelestialTimingModule
            initialPanel={planetaryPanel}
            onNavigate={navigateToModule}
          />
        );
      case 'translator':
        return <ScriptTranslatorModule />;
      case 'tree':
        return <TreeOfLifeModule onNavigate={navigateToModule} />;
      case 'correspondences':
        return (
          <CorrespondencesModule
            onNavigate={navigateToModule}
            initialQuery={correspondencesQuery}
          />
        );
      case 'ritual':
        return <RitualSpaceModule initialTemplate={ritualTemplate} />;
      case 'solomonic':
        return <SolomonicCircleModule />;
      case 'talisman':
        return (
          <TalismanModule
            initialName={talismanPrefill}
            onNavigate={navigateToModule}
          />
        );
      case 'enochian':
        return <EnochianModule onNavigate={navigateToModule} />;
      case 'liturgy':
        return <LiturgyModule onNavigate={navigateToModule} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-ananael-bg">
      <div className="sticky top-0 hidden h-screen md:block">
        <Sidebar activeModule={activeModule} onSelect={navigateToModule} />
      </div>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <div className="border-b border-ananael-border/60 bg-ananael-surface px-4 py-3 md:hidden">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3">
              <p className="font-display text-lg text-ananael-gold">Ananael</p>
              <AccountMenu className="max-w-[9rem] shrink-0" />
            </div>
            <label className="block text-xs text-ananael-muted">
              <span className="sr-only">Module</span>
              <select
                value={
                  activeModule === 'tarot' || activeModule === 'iching'
                    ? 'divination'
                    : activeModule
                }
                onChange={(e) =>
                  navigateToModule(e.target.value as ModuleId)
                }
                className="w-full rounded-md border border-ananael-border bg-ananael-bg px-2 py-1.5 text-sm text-zinc-200 outline-none focus:border-ananael-violet"
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

        <main className="flex-1 overflow-x-hidden overflow-y-auto px-4 py-6 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-6xl space-y-6">{renderModule()}</div>
        </main>
      </div>
    </div>
  );
}
