import { useEffect, useId, useRef, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import AccountMenu from './components/AccountMenu';
import AlchemyModule, {
  type OpusPaneId,
} from './components/AlchemyModule';
import AtelierModule, {
  type AtelierTab,
} from './components/AtelierModule';
import CelestialTimingModule from './components/CelestialTimingModule';
import CorrespondencesModule from './components/CorrespondencesModule';
import DashboardModule from './components/DashboardModule';
import DivinationModule, {
  type DivinationTab,
} from './components/DivinationModule';
import EnochianModule, {
  type EnochianTabId,
} from './components/EnochianModule';
import GematriaModule from './components/GematriaModule';
import JournalModule from './components/JournalModule';
import LiturgyModule from './components/LiturgyModule';
import ScriptTranslatorModule from './components/ScriptTranslatorModule';
import Sidebar, { type ModuleId } from './components/Sidebar';
import SplashPage from './components/SplashPage';
import SharePage from './components/SharePage';
import ProfilePage from './components/ProfilePage';
import SubtleBodyModule from './components/SubtleBodyModule';
import ShamanismModule from './components/ShamanismModule';
import type { SubtleBodyPane } from './lib/subtleBody';
import type { ShamanismPane } from './lib/shamanism';
import TreeOfLifeModule, {
  type TreeNavigateOptions,
} from './components/TreeOfLifeModule';
import type { OpusStageId } from './data/alchemy';
import type { TemplateId } from './data/ritualTools';
import type { JournalEntryType } from './lib/journal';
import type { LiturgyMode } from './lib/ritualRunner';
import type { ScriptId } from './lib/transliterate';
import { useAuth } from './context/AuthContext';

export type AppNavigateOptions = TreeNavigateOptions & {
  filter?: JournalEntryType | 'all';
  entryId?: string;
  divinationTab?: DivinationTab;
  atelierTab?: AtelierTab;
  planetaryPanel?:
    | 'hours'
    | 'planets'
    | 'zodiac'
    | 'elections'
    | 'almanac'
    | 'natal';
  ritualTemplate?: TemplateId;
  opusPane?: OpusPaneId;
  metal?: string;
  riteId?: string;
  runEntryId?: string;
  liturgyMode?: LiturgyMode;
};

function resolveModule(module: ModuleId): {
  module: ModuleId;
  divinationTab?: DivinationTab;
  atelierTab?: AtelierTab;
} {
  if (module === 'tarot') return { module: 'divination', divinationTab: 'tarot' };
  if (module === 'iching')
    return { module: 'divination', divinationTab: 'iching' };
  if (module === 'ritual') return { module: 'atelier', atelierTab: 'ritual' };
  if (module === 'solomonic')
    return { module: 'atelier', atelierTab: 'solomonic' };
  if (module === 'talisman')
    return { module: 'atelier', atelierTab: 'talisman' };
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
  const [journalEntryId, setJournalEntryId] = useState<string | undefined>();
  const [divinationTab, setDivinationTab] = useState<DivinationTab>('tarot');
  const [atelierTab, setAtelierTab] = useState<AtelierTab>('ritual');
  const [planetaryPanel, setPlanetaryPanel] = useState<
    'hours' | 'planets' | 'zodiac' | 'elections' | 'almanac' | 'natal'
  >('hours');
  const [ritualTemplate, setRitualTemplate] = useState<
    TemplateId | undefined
  >();
  const [talismanPrefill, setTalismanPrefill] = useState<string | undefined>();
  const [opusPane, setOpusPane] = useState<OpusPaneId>('stages');
  const [opusStageId, setOpusStageId] = useState<OpusStageId | undefined>();
  const [opusMetal, setOpusMetal] = useState<string | undefined>();
  const [liturgyMode, setLiturgyMode] = useState<LiturgyMode>('browse');
  const [liturgyRiteId, setLiturgyRiteId] = useState<string | undefined>();
  const [liturgyRunEntryId, setLiturgyRunEntryId] = useState<
    string | undefined
  >();
  const [subtleBodyPane, setSubtleBodyPane] = useState<SubtleBodyPane>('chakras');
  const [subtleBodyFocus, setSubtleBodyFocus] = useState<string | undefined>();
  const [shamanismPane, setShamanismPane] = useState<ShamanismPane>('worlds');
  const [shamanismFocus, setShamanismFocus] = useState<string | undefined>();
  const [shamanismRunEntryId, setShamanismRunEntryId] = useState<
    string | undefined
  >();
  const [translatorPrefill, setTranslatorPrefill] = useState<string | undefined>();
  const [translatorSource, setTranslatorSource] = useState<ScriptId | undefined>();
  const [translatorTarget, setTranslatorTarget] = useState<ScriptId | undefined>();
  const [enochianTab, setEnochianTab] = useState<EnochianTabId>('tablets');
  const [enochianFocus, setEnochianFocus] = useState<string | undefined>();
  const [navOpen, setNavOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const drawerTitleId = useId();

  useEffect(() => {
    if (wasAuthenticated.current && !isAuthenticated) {
      setEnteredAsGuest(false);
    }
    wasAuthenticated.current = isAuthenticated;
  }, [isAuthenticated]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = () => {
      if (mq.matches) setNavOpen(false);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!navOpen) return;

    const panel = drawerRef.current;
    const focusables = () =>
      panel
        ? Array.from(
            panel.querySelectorAll<HTMLElement>(
              'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            )
          )
        : [];

    const first = focusables()[0];
    first?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setNavOpen(false);
        return;
      }
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) return;
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstItem) {
        e.preventDefault();
        lastItem.focus();
      } else if (!e.shiftKey && document.activeElement === lastItem) {
        e.preventDefault();
        firstItem.focus();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      menuButtonRef.current?.focus();
    };
  }, [navOpen]);

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
      setJournalEntryId(opts?.entryId);
    } else {
      setJournalEntryId(undefined);
    }
    if (target === 'divination') {
      setDivinationTab(
        opts?.divinationTab ?? resolved.divinationTab ?? 'tarot'
      );
    }
    if (target === 'planetary') {
      setPlanetaryPanel(opts?.planetaryPanel ?? 'hours');
    }
    if (target === 'atelier') {
      setAtelierTab(
        opts?.atelierTab ?? resolved.atelierTab ?? 'ritual'
      );
      setRitualTemplate(opts?.ritualTemplate);
      if (opts?.gematriaPrefill !== undefined) {
        setTalismanPrefill(opts.gematriaPrefill);
      } else {
        setTalismanPrefill(undefined);
      }
    } else {
      setRitualTemplate(undefined);
      setTalismanPrefill(undefined);
    }
    if (target === 'opus') {
      setOpusPane(opts?.opusPane ?? 'stages');
      setOpusStageId(opts?.stageId as OpusStageId | undefined);
      setOpusMetal(opts?.metal);
    } else {
      setOpusStageId(undefined);
      setOpusMetal(undefined);
    }
    if (target === 'liturgy') {
      setLiturgyMode(opts?.liturgyMode ?? 'browse');
      setLiturgyRiteId(opts?.riteId);
      setLiturgyRunEntryId(opts?.runEntryId);
    } else {
      setLiturgyMode('browse');
      setLiturgyRiteId(undefined);
      setLiturgyRunEntryId(undefined);
    }
    if (target === 'subtleBody') {
      setSubtleBodyPane(opts?.subtleBodyPane ?? 'chakras');
      setSubtleBodyFocus(opts?.subtleBodyFocus);
    } else {
      setSubtleBodyFocus(undefined);
    }
    if (target === 'shamanism') {
      setShamanismPane(opts?.shamanismPane ?? 'worlds');
      setShamanismFocus(opts?.shamanismFocus);
      setShamanismRunEntryId(opts?.runEntryId);
    } else {
      setShamanismFocus(undefined);
      setShamanismRunEntryId(undefined);
    }
    if (target === 'translator') {
      setTranslatorPrefill(opts?.translatorPrefill);
      setTranslatorSource(opts?.translatorSource);
      setTranslatorTarget(opts?.translatorTarget);
    } else {
      setTranslatorPrefill(undefined);
      setTranslatorSource(undefined);
      setTranslatorTarget(undefined);
    }
    if (target === 'enochian') {
      setEnochianTab(opts?.enochianTab ?? 'tablets');
      setEnochianFocus(opts?.enochianFocus);
    } else {
      setEnochianFocus(undefined);
    }
    setActiveModule(target);
    setNavOpen(false);
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
        return (
          <JournalModule
            initialFilter={journalFilter}
            initialEntryId={journalEntryId}
          />
        );
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
        return (
          <ScriptTranslatorModule
            initialInput={translatorPrefill}
            initialSource={translatorSource}
            initialTarget={translatorTarget}
          />
        );
      case 'tree':
        return <TreeOfLifeModule onNavigate={navigateToModule} />;
      case 'correspondences':
        return (
          <CorrespondencesModule
            onNavigate={navigateToModule}
            initialQuery={correspondencesQuery}
          />
        );
      case 'atelier':
      case 'ritual':
      case 'solomonic':
      case 'talisman':
        return (
          <AtelierModule
            initialTab={atelierTab}
            initialTemplate={ritualTemplate}
            initialTalismanName={talismanPrefill}
            onNavigate={navigateToModule}
          />
        );
      case 'enochian':
        return (
          <EnochianModule
            onNavigate={navigateToModule}
            initialTab={enochianTab}
            initialFocus={enochianFocus}
          />
        );
      case 'liturgy':
        return (
          <LiturgyModule
            onNavigate={navigateToModule}
            initialRiteId={liturgyRiteId}
            initialRunEntryId={liturgyRunEntryId}
            initialMode={liturgyMode}
          />
        );
      case 'opus':
        return (
          <AlchemyModule
            onNavigate={navigateToModule}
            initialPane={opusPane}
            initialStageId={opusStageId}
            initialMetal={opusMetal}
          />
        );
      case 'subtleBody':
        return (
          <SubtleBodyModule
            onNavigate={navigateToModule}
            initialPane={subtleBodyPane}
            initialFocus={subtleBodyFocus}
          />
        );
      case 'shamanism':
        return (
          <ShamanismModule
            onNavigate={navigateToModule}
            initialPane={shamanismPane}
            initialFocus={shamanismFocus}
            initialRunEntryId={shamanismRunEntryId}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <>
            {isLoading && (
              <div className="flex min-h-screen items-center justify-center font-display text-ananael-gold">
                Opening Ananael…
              </div>
            )}
            {!isLoading && !isAuthenticated && !enteredAsGuest && (
              <SplashPage onEnterGuest={() => setEnteredAsGuest(true)} />
            )}
            {!isLoading && (isAuthenticated || enteredAsGuest) && (
              <HomePage
                activeModule={activeModule}
                navigateToModule={navigateToModule}
                renderModule={renderModule}
                navOpen={navOpen}
                setNavOpen={setNavOpen}
                menuButtonRef={menuButtonRef}
                drawerRef={drawerRef}
                drawerTitleId={drawerTitleId}
              />
            )}
          </>
        }
      />
      <Route path="/s/:type/:id" element={<SharePage />} />
      <Route path="/u/:username" element={<ProfilePage />} />
    </Routes>
  );
}

/**
 * HomePage component renders the main app layout with sidebar and active module
 */
interface HomePageProps {
  activeModule: ModuleId;
  navigateToModule: (module: ModuleId, opts?: AppNavigateOptions) => void;
  renderModule: () => React.ReactNode;
  navOpen: boolean;
  setNavOpen: (open: boolean) => void;
  menuButtonRef: React.RefObject<HTMLButtonElement>;
  drawerRef: React.RefObject<HTMLDivElement>;
  drawerTitleId: string;
}

function HomePage({
  activeModule,
  navigateToModule,
  renderModule,
  navOpen,
  setNavOpen,
  menuButtonRef,
  drawerRef,
  drawerTitleId,
}: HomePageProps) {
  return (
    <div className="flex min-h-screen bg-ananael-bg">
      <div className="sticky top-0 hidden h-screen md:block">
        <Sidebar activeModule={activeModule} onSelect={navigateToModule} />
      </div>

      {navOpen && (
        <div className="fixed inset-0 z-40 overflow-hidden md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/50"
            onClick={() => setNavOpen(false)}
          />
          <div
            ref={drawerRef}
            id="mobile-nav-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby={drawerTitleId}
            className="relative h-full w-64 max-w-[85vw]"
          >
            <h2 id={drawerTitleId} className="sr-only">
              Modules
            </h2>
            <Sidebar
              variant="drawer"
              activeModule={activeModule}
              onSelect={navigateToModule}
              onClose={() => setNavOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <div className="sticky top-0 z-30 border-b border-ananael-border/60 bg-ananael-surface px-4 py-3 md:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <button
                ref={menuButtonRef}
                type="button"
                aria-label="Open menu"
                aria-expanded={navOpen}
                aria-controls="mobile-nav-drawer"
                onClick={() => setNavOpen(true)}
                className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-md text-ananael-gold transition hover:bg-ananael-panel"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  aria-hidden
                >
                  <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              </button>
              <p className="font-display text-lg text-ananael-gold">Ananael</p>
            </div>
            <AccountMenu className="max-w-[9rem] shrink-0" />
          </div>
        </div>

        {/* overflow-x-clip (not hidden/auto) so main is not a scroll container — keeps sticky children viewport-anchored */}
        <main className="flex-1 overflow-x-clip px-4 py-6 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-6xl space-y-6">{renderModule()}</div>
        </main>
      </div>
    </div>
  );
}
