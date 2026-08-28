import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ENOCHIAN_AETHYRS,
  ENOCHIAN_CALLS,
  ENOCHIAN_TABLETS,
  HEPTARCHIA_COURTS,
  WATCHTOWERS,
  aethyrFocus,
  getAethyr,
  getCall,
  getWatchtower,
  heptarchiaFocus,
  isHeptarchiaPlanet,
  parseHierarchyFocus,
  watchtowerFocus,
  type EnochianElement,
  type HeptarchiaPlanet,
  type HierarchyPane,
} from '../data/enochian';
import { apiFetch } from '../lib/api';
import type { ModuleId } from './Sidebar';
import type { TreeNavigateOptions } from './TreeOfLifeModule';

export type EnochianTabId = 'tablets' | 'calls' | 'hierarchy';

interface EnochianModuleProps {
  onNavigate?: (module: ModuleId, opts?: TreeNavigateOptions) => void;
  initialTab?: EnochianTabId;
  initialFocus?: string;
}

interface NoteItem {
  _id: string;
  date: string;
  targetType: 'tablet' | 'call' | 'hierarchy';
  targetId: string;
  userNotes: string;
}

const TABS: { id: EnochianTabId; label: string }[] = [
  { id: 'tablets', label: 'Tablets' },
  { id: 'calls', label: 'Calls' },
  { id: 'hierarchy', label: 'Hierarchy' },
];

const HIERARCHY_PANES: { id: HierarchyPane; label: string }[] = [
  { id: 'heptarchia', label: 'Heptarchia' },
  { id: 'watchtowers', label: 'Watchtowers' },
  { id: 'aethyrs', label: 'Aethyrs' },
];

function noteTarget(
  tab: EnochianTabId,
  element: EnochianElement,
  callId: string,
  hierarchyId: string
): { targetType: NoteItem['targetType']; targetId: string } {
  if (tab === 'tablets') return { targetType: 'tablet', targetId: element };
  if (tab === 'calls') return { targetType: 'call', targetId: callId };
  return { targetType: 'hierarchy', targetId: hierarchyId };
}

/**
 * Enochian study — elemental tablet browser, Calls reader, and hierarchy tables.
 */
export default function EnochianModule({
  onNavigate,
  initialTab,
  initialFocus,
}: EnochianModuleProps) {
  const { isAuthenticated } = useAuth();
  const [tab, setTab] = useState<EnochianTabId>(initialTab ?? 'tablets');
  const [element, setElement] = useState<EnochianElement>('Fire');
  const [selected, setSelected] = useState<string | null>(null);
  const [callId, setCallId] = useState(ENOCHIAN_CALLS[0].id);
  const [lineIdx, setLineIdx] = useState(0);
  const [hierarchyPane, setHierarchyPane] =
    useState<HierarchyPane>('heptarchia');
  const [heptarchiaPlanet, setHeptarchiaPlanet] =
    useState<HeptarchiaPlanet>('Sun');
  const [watchtowerElement, setWatchtowerElement] =
    useState<EnochianElement>('Fire');
  const [aethyrId, setAethyrId] = useState(ENOCHIAN_AETHYRS[0].id);
  const [aethyrQuery, setAethyrQuery] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [history, setHistory] = useState<NoteItem[]>([]);

  const tablet = ENOCHIAN_TABLETS.find((t) => t.element === element)!;
  const call = getCall(callId)!;
  const hierarchyTargetId =
    hierarchyPane === 'heptarchia'
      ? heptarchiaFocus(heptarchiaPlanet)
      : hierarchyPane === 'watchtowers'
        ? watchtowerFocus(watchtowerElement)
        : aethyrFocus(aethyrId);

  useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    const parsed = parseHierarchyFocus(initialFocus);
    if (!parsed) return;
    setTab('hierarchy');
    setHierarchyPane(parsed.pane);
    if (parsed.pane === 'heptarchia' && parsed.key && isHeptarchiaPlanet(parsed.key)) {
      setHeptarchiaPlanet(parsed.key);
    }
    if (parsed.pane === 'watchtowers' && parsed.key) {
      const wt = getWatchtower(parsed.key as EnochianElement);
      if (wt) setWatchtowerElement(wt.element);
    }
    if (parsed.pane === 'aethyrs' && parsed.key) {
      const aethyr = getAethyr(parsed.key);
      if (aethyr) setAethyrId(aethyr.id);
    }
  }, [initialFocus]);

  useEffect(() => {
    if (!isAuthenticated) return;
    void (async () => {
      try {
        const res = await apiFetch('/api/enochian/notes');
        if (!res.ok) return;
        const data = (await res.json()) as { notes: NoteItem[] };
        setHistory(data.notes ?? []);
      } catch {
        /* ignore */
      }
    })();
  }, [isAuthenticated]);

  const saveNotes = async () => {
    if (!isAuthenticated || !notes.trim()) return;
    setStatus(null);
    try {
      const { targetType, targetId } = noteTarget(
        tab,
        element,
        callId,
        hierarchyTargetId
      );
      const res = await apiFetch('/api/enochian/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType,
          targetId,
          userNotes: notes,
        }),
      });
      const data = (await res.json()) as { message?: string; note?: NoteItem };
      if (!res.ok) throw new Error(data.message || 'Save failed');
      setStatus('Note saved.');
      if (data.note) setHistory((h) => [data.note!, ...h].slice(0, 40));
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Save failed');
    }
  };

  const filteredAethyrs = useMemo(() => {
    const q = aethyrQuery.trim().toLowerCase();
    if (!q) return ENOCHIAN_AETHYRS;
    return ENOCHIAN_AETHYRS.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        String(a.number).includes(q) ||
        a.governors.some(
          (g) =>
            g.name.toLowerCase().includes(q) ||
            g.part.toLowerCase().includes(q)
        )
    );
  }, [aethyrQuery]);

  const selectedAethyr =
    ENOCHIAN_AETHYRS.find((a) => a.id === aethyrId) ?? ENOCHIAN_AETHYRS[0];
  const selectedWatchtower =
    WATCHTOWERS.find((w) => w.element === watchtowerElement) ?? WATCHTOWERS[0];
  const selectedCourt =
    HEPTARCHIA_COURTS.find((c) => c.planet === heptarchiaPlanet) ??
    HEPTARCHIA_COURTS[0];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-2xl text-ananael-gold sm:text-3xl">
          Enochian
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ananael-muted">
          Browse elemental tablet samples, read the Calls, and study Heptarchia
          courts, Watchtower Kings, and the 91 Governors. Study excerpts for
          practice—deep-link letters into Gematria or Correspondences.
        </p>
      </header>

      <div className="flex flex-wrap gap-2 border-b border-ananael-border/40 pb-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={[
              'rounded-md px-3 py-1.5 text-sm transition',
              tab === t.id
                ? 'bg-ananael-violet/25 text-ananael-gold'
                : 'text-ananael-muted hover:text-zinc-200',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'tablets' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {ENOCHIAN_TABLETS.map((t) => (
              <button
                key={t.element}
                type="button"
                onClick={() => {
                  setElement(t.element);
                  setSelected(null);
                }}
                className={[
                  'rounded-md border px-3 py-1.5 text-sm',
                  element === t.element
                    ? 'border-ananael-violet bg-ananael-violet/20 text-ananael-gold'
                    : 'border-ananael-border text-zinc-300',
                ].join(' ')}
              >
                {t.element}
              </button>
            ))}
          </div>
          <div className="overflow-x-auto rounded-lg border border-ananael-border/60 bg-ananael-surface p-3">
            <div className="mx-auto grid w-max max-w-full grid-cols-5 gap-1 sm:gap-1.5">
              {tablet.grid.flatMap((row, ri) =>
                row.map((letter, ci) => {
                  const key = `${ri}-${ci}-${letter}`;
                  const active = selected === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelected(key)}
                      className={[
                        'flex h-10 w-10 items-center justify-center rounded font-display text-base sm:text-lg',
                        active
                          ? 'bg-ananael-violet/40 text-ananael-gold'
                          : 'bg-ananael-panel text-zinc-200 hover:text-ananael-gold',
                      ].join(' ')}
                    >
                      {letter}
                    </button>
                  );
                })
              )}
            </div>
          </div>
          {selected && (
            <div className="flex flex-wrap gap-2">
              <p className="w-full text-sm text-zinc-300">
                Selected:{' '}
                <span className="font-display text-ananael-gold">
                  {selected.split('-').pop()}
                </span>
              </p>
              <button
                type="button"
                onClick={() =>
                  onNavigate?.('gematria', {
                    gematriaPrefill: selected.split('-').pop(),
                  })
                }
                className="rounded-md border border-ananael-violet/50 px-3 py-1.5 text-xs text-zinc-100 hover:bg-ananael-violet/20"
              >
                Open in Gematria
              </button>
              <button
                type="button"
                onClick={() =>
                  onNavigate?.('correspondences', {
                    correspondencesQuery: element,
                  })
                }
                className="rounded-md border border-ananael-gold/50 px-3 py-1.5 text-xs text-ananael-gold hover:bg-ananael-gold/10"
              >
                Correspondences
              </button>
              <button
                type="button"
                onClick={() => onNavigate?.('translator')}
                className="rounded-md border border-ananael-bronze/60 px-3 py-1.5 text-xs text-zinc-200 hover:bg-ananael-panel"
              >
                Script Translator
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'calls' && (
        <div className="grid gap-6 lg:grid-cols-[14rem_1fr]">
          <ul className="space-y-1">
            {ENOCHIAN_CALLS.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => {
                    setCallId(c.id);
                    setLineIdx(0);
                  }}
                  className={[
                    'w-full rounded-md px-3 py-2 text-left text-sm',
                    callId === c.id
                      ? 'bg-ananael-violet/25 text-ananael-gold'
                      : 'text-zinc-300 hover:bg-ananael-panel',
                  ].join(' ')}
                >
                  {c.number}. {c.title}
                </button>
              </li>
            ))}
          </ul>
          <div>
            <h2 className="font-display text-xl text-ananael-gold">
              {call.title}
            </h2>
            <div className="mt-4 space-y-2">
              {call.lines.map((line, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setLineIdx(i)}
                  className={[
                    'block w-full rounded-md px-3 py-2 text-left text-sm leading-relaxed',
                    lineIdx === i
                      ? 'bg-ananael-violet/20 text-ananael-gold'
                      : 'text-zinc-300 hover:bg-ananael-panel/80',
                  ].join(' ')}
                >
                  {line}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'hierarchy' && (
        <div className="space-y-4">
          <p className="text-xs text-ananael-muted">
            Heptarchia names follow <em>Heptarchia Mystica</em>. Watchtower
            Kings and Seniors are Golden Dawn reconstruction. Governors are
            Parts of the Earth (geographic), not natal planets.
          </p>
          <div className="flex flex-wrap gap-2">
            {HIERARCHY_PANES.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setHierarchyPane(p.id)}
                className={[
                  'rounded-md border px-3 py-1.5 text-sm',
                  hierarchyPane === p.id
                    ? 'border-ananael-violet bg-ananael-violet/20 text-ananael-gold'
                    : 'border-ananael-border text-zinc-300',
                ].join(' ')}
              >
                {p.label}
              </button>
            ))}
          </div>

          {hierarchyPane === 'heptarchia' && (
            <div className="overflow-x-auto rounded-xl border border-ananael-border/50 bg-ananael-surface">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-ananael-border/60 text-xs uppercase tracking-wider text-ananael-muted">
                    <th className="px-4 py-3 font-medium">Planet</th>
                    <th className="px-4 py-3 font-medium">Day</th>
                    <th className="px-4 py-3 font-medium">King</th>
                    <th className="px-4 py-3 font-medium">Prince</th>
                  </tr>
                </thead>
                <tbody>
                  {HEPTARCHIA_COURTS.map((c) => (
                    <tr
                      key={c.planet}
                      className={[
                        'cursor-pointer border-b border-ananael-border/30 last:border-0',
                        heptarchiaPlanet === c.planet
                          ? 'bg-ananael-violet/15'
                          : '',
                      ].join(' ')}
                      onClick={() => setHeptarchiaPlanet(c.planet)}
                    >
                      <td className="px-4 py-2 font-medium text-zinc-100">
                        {c.planet}
                      </td>
                      <td className="px-4 py-2 text-zinc-300">{c.weekday}</td>
                      <td className="px-4 py-2 text-ananael-gold">{c.king}</td>
                      <td className="px-4 py-2 text-ananael-gold">
                        {c.prince}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="border-t border-ananael-border/40 px-4 py-3 text-xs text-ananael-muted">
                Selected for notes: {selectedCourt.king} · {selectedCourt.prince}{' '}
                ({heptarchiaFocus(selectedCourt.planet)})
              </p>
            </div>
          )}

          {hierarchyPane === 'watchtowers' && (
            <div className="grid gap-3 sm:grid-cols-2">
              {WATCHTOWERS.map((w) => (
                <button
                  key={w.element}
                  type="button"
                  onClick={() => setWatchtowerElement(w.element)}
                  className={[
                    'rounded-xl border p-4 text-left',
                    watchtowerElement === w.element
                      ? 'border-ananael-violet bg-ananael-violet/15'
                      : 'border-ananael-border/50 bg-ananael-surface',
                  ].join(' ')}
                >
                  <p className="font-display text-lg text-ananael-gold">
                    {w.element} · {w.quarter}
                  </p>
                  <p className="mt-1 text-sm text-zinc-200">
                    King {w.king} · Union {w.union}
                  </p>
                  <p className="mt-2 text-[11px] uppercase tracking-wider text-ananael-muted">
                    Seniors (study)
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    {w.seniors.map((s) => `${s.name} (${s.planet})`).join(' · ')}
                  </p>
                </button>
              ))}
              <p className="sm:col-span-2 text-xs text-ananael-muted">
                Selected for notes: {selectedWatchtower.king} ·{' '}
                {selectedWatchtower.union} (
                {watchtowerFocus(selectedWatchtower.element)})
              </p>
            </div>
          )}

          {hierarchyPane === 'aethyrs' && (
            <div className="space-y-3">
              <label className="block text-sm text-ananael-muted">
                Search Aires / Governors / Parts
                <input
                  type="search"
                  value={aethyrQuery}
                  onChange={(e) => setAethyrQuery(e.target.value)}
                  placeholder="LIL, Occodon, Egypt…"
                  className="mt-1 w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet"
                />
              </label>
              <div className="grid gap-4 lg:grid-cols-[14rem_1fr]">
                <ul className="max-h-[28rem] space-y-1 overflow-y-auto">
                  {filteredAethyrs.map((a) => (
                    <li key={a.id}>
                      <button
                        type="button"
                        onClick={() => setAethyrId(a.id)}
                        className={[
                          'w-full rounded-md px-3 py-2 text-left text-sm',
                          aethyrId === a.id
                            ? 'bg-ananael-violet/25 text-ananael-gold'
                            : 'text-zinc-300 hover:bg-ananael-panel',
                        ].join(' ')}
                      >
                        {a.number}. {a.name}
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="rounded-xl border border-ananael-border/50 bg-ananael-surface p-4">
                  <h2 className="font-display text-xl text-ananael-gold">
                    {selectedAethyr.number}. {selectedAethyr.name}
                  </h2>
                  <p className="mt-1 text-xs text-ananael-muted">
                    {selectedAethyr.governors.length} Governors · Parts of the
                    Earth (no natal geocode)
                  </p>
                  <ul className="mt-3 divide-y divide-ananael-border/30">
                    {selectedAethyr.governors.map((g) => (
                      <li
                        key={g.name}
                        className="flex flex-wrap items-baseline justify-between gap-2 py-2 text-sm"
                      >
                        <span className="text-ananael-gold">{g.name}</span>
                        <span className="text-zinc-300">{g.part}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <label className="block text-sm text-ananael-muted">
        Study notes
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet"
        />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        {isAuthenticated ? (
          <button
            type="button"
            onClick={() => void saveNotes()}
            className="rounded-md bg-ananael-violet px-4 py-2 text-sm text-white hover:bg-ananael-violet-deep"
          >
            Save note
          </button>
        ) : (
          <p className="text-sm text-ananael-muted">Sign in to save notes.</p>
        )}
        {status && <span className="text-sm text-ananael-gold">{status}</span>}
      </div>

      {history.length > 0 && (
        <section>
          <h2 className="font-display text-lg text-ananael-gold">
            Recent notes
          </h2>
          <ul className="mt-2 space-y-2 text-sm text-zinc-400">
            {history.slice(0, 5).map((n) => (
              <li key={n._id}>
                <span className="text-ananael-muted">
                  {n.targetType}:{n.targetId}
                </span>{' '}
                — {n.userNotes.slice(0, 80)}
                {n.userNotes.length > 80 ? '…' : ''}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
