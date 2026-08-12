import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import type { Chakra } from '../data/chakras';
import type { Meridian } from '../data/meridians';
import { LITURGY_RITES } from '../data/liturgy';
import { getComparativeMap } from '../data/subtleBodyMaps';
import {
  CHAKRA_SEPHIRAH_MAP,
  NEIDAN_STAGES,
  SUBTLE_BODY_PANES,
  chakraDisplayOrder,
  formatPeakHour,
  getOpusStageForNeidan,
  meridianDisplayOrder,
  relatedRitesForChakra,
  relatedRitesForMeridian,
  relatedRitesForNeidanStage,
  searchSubtleBody,
  type SubtleBodyPane,
} from '../lib/subtleBody';
import type { JournalEntryType } from '../lib/journal';
import type { ModuleId } from './Sidebar';
import type { TreeNavigateOptions } from './TreeOfLifeModule';

export interface SubtleBodyNavigateOptions extends TreeNavigateOptions {
  subtleBodyPane?: SubtleBodyPane;
  subtleBodyFocus?: string;
  filter?: JournalEntryType | 'all';
}

interface SubtleBodyModuleProps {
  onNavigate?: (module: ModuleId, opts?: SubtleBodyNavigateOptions) => void;
  initialPane?: SubtleBodyPane;
  initialFocus?: string;
}

const CHAKRA_Y: Record<string, number> = {
  sahasrara: 30,
  ajna: 75,
  vishuddha: 120,
  anahata: 165,
  manipura: 210,
  svadhisthana: 255,
  muladhara: 300,
};

/**
 * Subtle Body — chakra atlas, meridian reference, comparative maps, neidan study.
 */
export default function SubtleBodyModule({
  onNavigate,
  initialPane = 'chakras',
  initialFocus,
}: SubtleBodyModuleProps) {
  const { isAuthenticated } = useAuth();
  const [pane, setPane] = useState<SubtleBodyPane>(initialPane);
  const [query, setQuery] = useState('');
  const [focusId, setFocusId] = useState<string | null>(initialFocus ?? null);
  const [vesselName, setVesselName] = useState('Untitled practice');
  const [intent, setIntent] = useState('');
  const [neidanStageId, setNeidanStageId] = useState('jing');
  const [chakraId, setChakraId] = useState('');
  const [riteId, setRiteId] = useState('');
  const [vesselNotes, setVesselNotes] = useState('');
  const [savedVesselId, setSavedVesselId] = useState<string | null>(null);
  const [vessels, setVessels] = useState<
    { _id: string; name: string; date: string; config: Record<string, unknown> }[]
  >([]);
  const [vesselSaving, setVesselSaving] = useState(false);
  const [vesselStatus, setVesselStatus] = useState<string | null>(null);

  const loadVessels = useCallback(async () => {
    if (!isAuthenticated) {
      setVessels([]);
      return;
    }
    try {
      const res = await apiFetch('/api/practice/vessels');
      const data = (await res.json()) as {
        vessels?: typeof vessels;
      };
      if (res.ok) setVessels(data.vessels ?? []);
    } catch {
      /* ignore */
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void loadVessels();
  }, [loadVessels]);

  useEffect(() => {
    if (initialPane) setPane(initialPane);
  }, [initialPane]);

  useEffect(() => {
    if (initialFocus) setFocusId(initialFocus);
  }, [initialFocus]);

  const { chakras, meridians } = useMemo(
    () => searchSubtleBody(query, pane === 'maps' || pane === 'neidan' ? null : pane),
    [query, pane]
  );

  const displayChakras =
    pane === 'chakras' ? (chakras.length ? chakras : chakraDisplayOrder()) : [];
  const displayMeridians =
    pane === 'meridians'
      ? meridians.length
        ? meridians
        : meridianDisplayOrder()
      : [];

  const selectedChakra =
    displayChakras.find((c) => c.id === focusId) ?? displayChakras[0] ?? null;
  const selectedMeridian =
    displayMeridians.find((m) => m.id === focusId) ??
    displayMeridians[0] ??
    null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl text-ananael-gold">Subtle Body</h1>
        <p className="mt-2 max-w-2xl text-sm text-ananael-muted">
          Chakra atlas, meridian reference, comparative maps to the Tree of Life
          and I Ching, and neidan study outlines. For practice, launch rites
          from the Ritual Library.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {SUBTLE_BODY_PANES.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              setPane(p.id);
              setFocusId(null);
              setQuery('');
            }}
            className={[
              'rounded-md border px-3 py-1.5 text-xs font-medium transition',
              pane === p.id
                ? 'border-ananael-gold/60 bg-ananael-gold/15 text-ananael-gold'
                : 'border-ananael-border/60 text-ananael-muted hover:border-ananael-violet/50',
            ].join(' ')}
          >
            {p.label}
          </button>
        ))}
      </div>

      {(pane === 'chakras' || pane === 'meridians') && (
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            pane === 'chakras'
              ? 'Search chakras…'
              : 'Search meridians…'
          }
          className="w-full max-w-md rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet"
        />
      )}

      {pane === 'chakras' && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
          <ChakraSpineDiagram
            chakras={displayChakras}
            selectedId={selectedChakra?.id}
            onSelect={(id) => setFocusId(id)}
          />
          {selectedChakra ? (
            <ChakraDetail
              chakra={selectedChakra}
              onNavigate={onNavigate}
            />
          ) : (
            <EmptyDetail />
          )}
        </div>
      )}

      {pane === 'meridians' && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <ul className="max-h-[60vh] space-y-1 overflow-y-auto rounded-xl border border-ananael-border/50 bg-ananael-surface p-2">
            {displayMeridians.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => setFocusId(m.id)}
                  className={[
                    'flex w-full flex-col rounded-md px-3 py-2.5 text-left transition',
                    selectedMeridian?.id === m.id
                      ? 'bg-ananael-violet/20 text-ananael-gold'
                      : 'text-zinc-300 hover:bg-ananael-panel',
                  ].join(' ')}
                >
                  <span className="text-sm font-medium">{m.name}</span>
                  <span className="text-xs text-ananael-muted">
                    {m.pinyin} · {formatPeakHour(m)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {selectedMeridian ? (
            <MeridianDetail
              meridian={selectedMeridian}
              onNavigate={onNavigate}
            />
          ) : (
            <EmptyDetail />
          )}
        </div>
      )}

      {pane === 'maps' && (
        <section className="space-y-4 rounded-xl border border-ananael-border/50 bg-ananael-surface p-5">
          <h2 className="font-display text-lg text-ananael-gold">
            Chakra ↔ Sephirah (comparative)
          </h2>
          <p className="text-xs text-ananael-muted">
            Study map only — traditions disagree; not a claim of identity between
            systems.
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ananael-border/60 text-xs uppercase tracking-wider text-ananael-muted">
                  <th className="px-3 py-2">Chakra</th>
                  <th className="px-3 py-2">Sephirah</th>
                  <th className="px-3 py-2">Key</th>
                  <th className="px-3 py-2">Source</th>
                </tr>
              </thead>
              <tbody>
                {CHAKRA_SEPHIRAH_MAP.map((row) => (
                  <tr
                    key={row.chakraId}
                    className="border-b border-ananael-border/30 last:border-0"
                  >
                    <td className="px-3 py-2 text-zinc-200">{row.chakraId}</td>
                    <td className="px-3 py-2 text-zinc-200">{row.sephirahName}</td>
                    <td className="px-3 py-2 text-ananael-muted">{row.sephirahKey}</td>
                    <td className="px-3 py-2 text-xs text-ananael-muted">
                      {row.notes ?? row.source}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            onClick={() => onNavigate?.('correspondences')}
            className="rounded-md border border-ananael-violet/50 px-3 py-1.5 text-xs text-zinc-200 hover:bg-ananael-violet/10"
          >
            Open Correspondences
          </button>
        </section>
      )}

      {pane === 'neidan' && (
        <section className="space-y-4">
          <p className="text-sm text-ananael-muted">
            Taoist internal alchemy stages — study parallel to the Athanor opus.
            Not laboratory or clinical instruction.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {NEIDAN_STAGES.map((stage) => {
              const opusMap = getOpusStageForNeidan(stage.id);
              const rites = relatedRitesForNeidanStage(stage.id);
              return (
                <div
                  key={stage.id}
                  className="rounded-xl border border-ananael-border/50 bg-ananael-surface p-4"
                >
                  <p className="text-xs uppercase tracking-wider text-ananael-muted">
                    {stage.chinese}
                  </p>
                  <h3 className="mt-1 font-display text-lg text-ananael-gold">
                    {stage.name}
                  </h3>
                  <p className="mt-2 text-sm text-zinc-300">{stage.gloss}</p>
                  <p className="mt-2 text-xs text-ananael-muted">
                    {stage.keywords.join(' · ')}
                  </p>
                  {opusMap && (
                    <p className="mt-3 text-xs text-zinc-300">
                      Comparative opus:{' '}
                      <button
                        type="button"
                        onClick={() =>
                          onNavigate?.('opus', {
                            opusPane: 'stages',
                            stageId: opusMap.opusStageId,
                          })
                        }
                        className="text-ananael-gold hover:underline"
                      >
                        {opusMap.opusStageId}
                      </button>
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {rites.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() =>
                          onNavigate?.('liturgy', {
                            riteId: r.id,
                            liturgyMode: 'run',
                          })
                        }
                        className="rounded-md border border-ananael-violet/40 px-2 py-1 text-[11px] text-zinc-200 hover:bg-ananael-violet/10"
                      >
                        {r.title}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {pane === 'practice' && (
        <PracticePane
          isAuthenticated={isAuthenticated}
          vesselName={vesselName}
          setVesselName={setVesselName}
          intent={intent}
          setIntent={setIntent}
          neidanStageId={neidanStageId}
          setNeidanStageId={setNeidanStageId}
          chakraId={chakraId}
          setChakraId={setChakraId}
          riteId={riteId}
          setRiteId={setRiteId}
          vesselNotes={vesselNotes}
          setVesselNotes={setVesselNotes}
          savedVesselId={savedVesselId}
          setSavedVesselId={setSavedVesselId}
          vessels={vessels}
          vesselSaving={vesselSaving}
          setVesselSaving={setVesselSaving}
          vesselStatus={vesselStatus}
          setVesselStatus={setVesselStatus}
          onReload={loadVessels}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
}

function PracticePane({
  isAuthenticated,
  vesselName,
  setVesselName,
  intent,
  setIntent,
  neidanStageId,
  setNeidanStageId,
  chakraId,
  setChakraId,
  riteId,
  setRiteId,
  vesselNotes,
  setVesselNotes,
  savedVesselId,
  setSavedVesselId,
  vessels,
  vesselSaving,
  setVesselSaving,
  vesselStatus,
  setVesselStatus,
  onReload,
  onNavigate,
}: {
  isAuthenticated: boolean;
  vesselName: string;
  setVesselName: (v: string) => void;
  intent: string;
  setIntent: (v: string) => void;
  neidanStageId: string;
  setNeidanStageId: (v: string) => void;
  chakraId: string;
  setChakraId: (v: string) => void;
  riteId: string;
  setRiteId: (v: string) => void;
  vesselNotes: string;
  setVesselNotes: (v: string) => void;
  savedVesselId: string | null;
  setSavedVesselId: (v: string | null) => void;
  vessels: { _id: string; name: string; date: string; config: Record<string, unknown> }[];
  vesselSaving: boolean;
  setVesselSaving: (v: boolean) => void;
  vesselStatus: string | null;
  setVesselStatus: (v: string | null) => void;
  onReload: () => Promise<void>;
  onNavigate?: (module: ModuleId, opts?: SubtleBodyNavigateOptions) => void;
}) {
  const easternRites = LITURGY_RITES.filter((r) =>
    ['Yoga', 'Taoist', 'Buddhist', 'General'].includes(r.tradition)
  );

  const saveVessel = async () => {
    if (!isAuthenticated || !vesselName.trim()) return;
    setVesselSaving(true);
    setVesselStatus(null);
    try {
      const config = {
        intent: intent.trim(),
        neidanStageId,
        chakraId: chakraId || undefined,
        riteId: riteId || undefined,
      };
      const res = await apiFetch(
        savedVesselId
          ? `/api/practice/vessels/${savedVesselId}`
          : '/api/practice/vessels',
        {
          method: savedVesselId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: vesselName.trim(),
            config,
            notes: vesselNotes.trim(),
          }),
        }
      );
      const data = (await res.json()) as {
        vessel?: { _id: string };
        message?: string;
      };
      if (!res.ok) throw new Error(data.message || 'Save failed');
      setSavedVesselId(data.vessel?._id ?? savedVesselId);
      setVesselStatus(savedVesselId ? 'Practice updated.' : 'Practice saved.');
      await onReload();
    } catch (err) {
      setVesselStatus(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setVesselSaving(false);
    }
  };

  const logWorking = () => {
    onNavigate?.('journal', {
      filter: 'working',
    });
  };

  const loadVessel = (v: (typeof vessels)[0]) => {
    setSavedVesselId(v._id);
    setVesselName(v.name);
    const cfg = v.config ?? {};
    setIntent(typeof cfg.intent === 'string' ? cfg.intent : '');
    setNeidanStageId(
      typeof cfg.neidanStageId === 'string' ? cfg.neidanStageId : 'jing'
    );
    setChakraId(typeof cfg.chakraId === 'string' ? cfg.chakraId : '');
    setRiteId(typeof cfg.riteId === 'string' ? cfg.riteId : '');
    setVesselNotes('');
  };

  return (
    <section className="space-y-4">
      <p className="text-sm text-ananael-muted">
        Plan and save subtle-body practice intent — neidan stage, chakra focus,
        and linked rite. Sign in to persist vessels; log workings in the Journal.
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3 rounded-xl border border-ananael-border/50 bg-ananael-surface p-4">
          <label className="block text-sm text-ananael-muted">
            Intent
            <textarea
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet"
              placeholder="e.g. Daily kidney stillness, microcosmic orbit study…"
            />
          </label>
          <label className="block text-sm text-ananael-muted">
            Neidan stage
            <select
              value={neidanStageId}
              onChange={(e) => setNeidanStageId(e.target.value)}
              className="mt-1 w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100"
            >
              {NEIDAN_STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-ananael-muted">
            Chakra focus (optional)
            <select
              value={chakraId}
              onChange={(e) => setChakraId(e.target.value)}
              className="mt-1 w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100"
            >
              <option value="">—</option>
              {chakraDisplayOrder().map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm text-ananael-muted">
            Linked rite (optional)
            <select
              value={riteId}
              onChange={(e) => setRiteId(e.target.value)}
              className="mt-1 w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100"
            >
              <option value="">—</option>
              {easternRites.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>
          </label>
          {riteId && (
            <button
              type="button"
              onClick={() =>
                onNavigate?.('liturgy', { riteId, liturgyMode: 'run' })
              }
              className="rounded-md bg-ananael-violet px-3 py-1.5 text-xs font-medium text-white hover:bg-ananael-violet-deep"
            >
              Run linked rite
            </button>
          )}
        </div>
        <div className="space-y-3 rounded-xl border border-ananael-border/50 bg-ananael-surface p-4">
          {isAuthenticated ? (
            <>
              <label className="block text-sm text-ananael-muted">
                Vessel name
                <input
                  value={vesselName}
                  onChange={(e) => setVesselName(e.target.value)}
                  maxLength={100}
                  className="mt-1 w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={vesselSaving || !vesselName.trim()}
                  onClick={() => void saveVessel()}
                  className="rounded-md border border-ananael-gold/50 bg-ananael-gold/10 px-3 py-1.5 text-xs font-medium text-ananael-gold disabled:opacity-40"
                >
                  {vesselSaving
                    ? 'Saving…'
                    : savedVesselId
                      ? 'Update vessel'
                      : 'Save vessel'}
                </button>
                <button
                  type="button"
                  onClick={logWorking}
                  className="rounded-md border border-ananael-violet/50 px-3 py-1.5 text-xs text-zinc-200 hover:bg-ananael-violet/10"
                >
                  Log working
                </button>
              </div>
              {vesselStatus && (
                <p className="text-xs text-ananael-muted">{vesselStatus}</p>
              )}
              {vessels.length > 0 && (
                <ul className="space-y-1 border-t border-ananael-border/40 pt-3">
                  {vessels.map((v) => (
                    <li key={v._id}>
                      <button
                        type="button"
                        onClick={() => loadVessel(v)}
                        className="w-full rounded-md px-2 py-1.5 text-left text-xs text-zinc-300 hover:bg-ananael-bg hover:text-ananael-gold"
                      >
                        {v.name}
                        <span className="ml-2 text-ananael-muted">
                          {new Date(v.date).toLocaleDateString()}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p className="text-sm text-zinc-400">
              Sign in to save practice vessels. Guests can still run rites from
              the Ritual Library.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function EmptyDetail() {
  return (
    <div className="rounded-xl border border-ananael-border/50 bg-ananael-surface p-5">
      <p className="text-sm text-ananael-muted">Select an entry to view details.</p>
    </div>
  );
}

function ChakraSpineDiagram({
  chakras,
  selectedId,
  onSelect,
}: {
  chakras: Chakra[];
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <svg
      viewBox="0 0 120 340"
      className="mx-auto w-full max-w-[280px] rounded-xl border border-ananael-border/50 bg-ananael-surface p-4"
      role="img"
      aria-label="Chakra spine diagram"
    >
      <line
        x1="60"
        y1="20"
        x2="60"
        y2="320"
        stroke="#52525b"
        strokeWidth="2"
      />
      {chakras.map((c) => {
        const y = CHAKRA_Y[c.id] ?? 170;
        const active = c.id === selectedId;
        return (
          <g
            key={c.id}
            className="cursor-pointer"
            onClick={() => onSelect(c.id)}
            role="button"
            tabIndex={0}
            aria-label={c.name}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(c.id);
              }
            }}
          >
            <circle
              cx="60"
              cy={y}
              r={active ? 14 : 11}
              fill={active ? '#5b21b6' : '#18181b'}
              stroke={active ? '#c9a227' : '#7c3aed'}
              strokeWidth={active ? 3 : 2}
            />
            <text
              x="82"
              y={y + 4}
              className="fill-zinc-300 text-[10px]"
              style={{ fontSize: 10 }}
            >
              {c.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function ChakraDetail({
  chakra,
  onNavigate,
}: {
  chakra: Chakra;
  onNavigate?: (module: ModuleId, opts?: SubtleBodyNavigateOptions) => void;
}) {
  const map = getComparativeMap(chakra.id);
  const rites = relatedRitesForChakra(chakra.id);

  return (
    <div className="space-y-4 rounded-xl border border-ananael-border/50 bg-ananael-surface p-5">
      <div>
        <p className="text-xs uppercase tracking-wider text-ananael-muted">Chakra</p>
        <h2 className="font-display text-2xl text-ananael-gold">{chakra.name}</h2>
        <p className="text-sm text-ananael-muted">{chakra.sanskrit}</p>
      </div>
      <dl className="grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wider text-ananael-muted">Location</dt>
          <dd className="text-sm text-zinc-200">{chakra.location}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-ananael-muted">Color</dt>
          <dd className="text-sm text-zinc-200">{chakra.color}</dd>
        </div>
        {chakra.bija && (
          <div>
            <dt className="text-xs uppercase tracking-wider text-ananael-muted">Bija</dt>
            <dd className="text-sm text-zinc-200">
              {chakra.bija}{' '}
              <button
                type="button"
                onClick={() =>
                  onNavigate?.('translator', {
                    translatorPrefill: chakra.bija!.toLowerCase(),
                    translatorSource: 'latin',
                    translatorTarget: 'sanskrit',
                  })
                }
                className="text-ananael-gold hover:underline"
              >
                Transliterate
              </button>
            </dd>
          </div>
        )}
        {map && (
          <div className="sm:col-span-2">
            <dt className="text-xs uppercase tracking-wider text-ananael-muted">
              Comparative sephirah
            </dt>
            <dd className="text-sm text-zinc-200">
              {map.sephirahName} (Key {map.sephirahKey})
            </dd>
          </div>
        )}
      </dl>
      {chakra.notes && (
        <p className="text-xs text-ananael-muted">{chakra.notes}</p>
      )}
      <div className="flex flex-wrap gap-2 border-t border-ananael-border/40 pt-4">
        {rites.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() =>
              onNavigate?.('liturgy', { riteId: r.id, liturgyMode: 'run' })
            }
            className="rounded-md border border-ananael-violet/50 bg-ananael-violet/10 px-3 py-1.5 text-xs font-medium text-zinc-100 hover:bg-ananael-violet/20"
          >
            Run {r.title}
          </button>
        ))}
        <button
          type="button"
          onClick={() =>
            onNavigate?.('correspondences', {
              correspondencesQuery: chakra.id,
            })
          }
          className="rounded-md border border-ananael-gold/50 px-3 py-1.5 text-xs text-ananael-gold hover:bg-ananael-gold/10"
        >
          Correspondences
        </button>
      </div>
    </div>
  );
}

function MeridianDetail({
  meridian,
  onNavigate,
}: {
  meridian: Meridian;
  onNavigate?: (module: ModuleId, opts?: SubtleBodyNavigateOptions) => void;
}) {
  const rites = relatedRitesForMeridian(meridian.id);

  return (
    <div className="space-y-4 rounded-xl border border-ananael-border/50 bg-ananael-surface p-5">
      <div>
        <p className="text-xs uppercase tracking-wider text-ananael-muted">Meridian</p>
        <h2 className="font-display text-2xl text-ananael-gold">{meridian.name}</h2>
        <p className="text-sm text-ananael-muted">
          {meridian.chinese} · {meridian.pinyin}
        </p>
      </div>
      <dl className="grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wider text-ananael-muted">Element</dt>
          <dd className="text-sm text-zinc-200">{meridian.element}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-ananael-muted">Organ</dt>
          <dd className="text-sm text-zinc-200">{meridian.associatedOrgan}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-ananael-muted">Peak hour</dt>
          <dd className="text-sm text-zinc-200">{formatPeakHour(meridian)}</dd>
        </div>
      </dl>
      {meridian.notes && (
        <p className="text-xs text-ananael-muted">{meridian.notes}</p>
      )}
      <div className="flex flex-wrap gap-2 border-t border-ananael-border/40 pt-4">
        {rites.slice(0, 2).map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() =>
              onNavigate?.('liturgy', { riteId: r.id, liturgyMode: 'run' })
            }
            className="rounded-md border border-ananael-violet/50 bg-ananael-violet/10 px-3 py-1.5 text-xs font-medium text-zinc-100 hover:bg-ananael-violet/20"
          >
            Run {r.title}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onNavigate?.('planetary', { planetaryPanel: 'hours' })}
          className="rounded-md border border-ananael-gold/50 px-3 py-1.5 text-xs text-ananael-gold hover:bg-ananael-gold/10"
        >
          Celestial Timing
        </button>
      </div>
    </div>
  );
}
