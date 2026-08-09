import { useEffect, useMemo, useState } from 'react';
import {
  CLASSICAL_METALS,
  EMERALD_TABLET_LINES,
  HERMETICA_OUTLINES,
  STAGE_EMBLEMS,
  TRIA_PRIMA,
  type ClassicalMetal,
  type OpusStageId,
} from '../data/alchemy';
import { useAuth } from '../context/AuthContext';
import {
  getPrinciple,
  getStage,
  listStages,
  metalForPlanet,
  operationForDay,
  planetForMetal,
  scaleOfNature,
  type OpusStageDef,
} from '../lib/alchemy';
import {
  ALCHEMICAL_GLYPH_PATHS,
  ALCHEMICAL_VIEWBOX,
  type AlchemicalGlyphId,
} from '../lib/alchemicalGlyphPaths';
import { apiFetch } from '../lib/api';
import { buildDayCounsel } from '../lib/almanac';
import { buildJournalSky } from '../lib/journalSky';
import { getMoonPhase } from '../lib/moonPhase';
import { DAY_RULERS, type PlanetId } from '../lib/planetaryHours';
import type { ModuleId } from './Sidebar';
import type { TreeNavigateOptions } from './TreeOfLifeModule';

export type OpusPaneId = 'stages' | 'vessel' | 'emblem';

export type AlchemyNavigateOptions = TreeNavigateOptions & {
  opusPane?: OpusPaneId;
  stageId?: OpusStageId;
  metal?: string;
  planetaryPanel?: 'hours' | 'planets' | 'zodiac' | 'elections' | 'almanac';
  filter?: 'working' | 'ritual' | 'all';
};

interface AlchemyModuleProps {
  onNavigate: (module: ModuleId, opts?: AlchemyNavigateOptions) => void;
  initialPane?: OpusPaneId;
  initialStageId?: OpusStageId;
  initialMetal?: string;
}

const PLANETS: PlanetId[] = [
  'Saturn',
  'Jupiter',
  'Mars',
  'Sun',
  'Venus',
  'Mercury',
  'Moon',
];

function AlchemyGlyphMark({
  glyphId,
  size = 36,
}: {
  glyphId: AlchemicalGlyphId;
  size?: number;
}) {
  const paths = ALCHEMICAL_GLYPH_PATHS[glyphId];
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${ALCHEMICAL_VIEWBOX} ${ALCHEMICAL_VIEWBOX}`}
      className="shrink-0 text-ananael-gold"
      aria-hidden
    >
      <g fill="none" stroke="currentColor" strokeWidth={3}>
        {paths.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
    </svg>
  );
}

/**
 * Athanor — hermetic alchemy chamber: opus stages, vessel planner, emblems.
 */
export default function AlchemyModule({
  onNavigate,
  initialPane = 'stages',
  initialStageId,
  initialMetal,
}: AlchemyModuleProps) {
  const { isAuthenticated } = useAuth();
  const [pane, setPane] = useState<OpusPaneId>(initialPane);
  const [selectedStageId, setSelectedStageId] = useState<OpusStageId>(
    initialStageId ?? 'nigredo'
  );
  const [intent, setIntent] = useState('');
  const [materiaMetal, setMateriaMetal] = useState<ClassicalMetal>(() => {
    if (initialMetal) {
      const p = planetForMetal(initialMetal);
      if (p) return metalForPlanet(p);
    }
    return metalForPlanet(DAY_RULERS[new Date().getDay()]);
  });
  const [targetStageId, setTargetStageId] = useState<OpusStageId>(
    initialStageId ?? 'albedo'
  );
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [emblemTab, setEmblemTab] = useState<'emerald' | 'hermetica' | 'emblems'>(
    'emerald'
  );
  const [scalePlanet, setScalePlanet] = useState<PlanetId>(
    DAY_RULERS[new Date().getDay()]
  );

  useEffect(() => {
    if (initialPane) setPane(initialPane);
  }, [initialPane]);

  useEffect(() => {
    if (initialStageId) {
      setSelectedStageId(initialStageId);
      setTargetStageId(initialStageId);
    }
  }, [initialStageId]);

  useEffect(() => {
    if (!initialMetal) return;
    const p = planetForMetal(initialMetal);
    if (p) setMateriaMetal(metalForPlanet(p));
  }, [initialMetal]);

  const stages = listStages();
  const selectedStage = getStage(selectedStageId);
  const dayCounsel = useMemo(() => buildDayCounsel(new Date()), []);
  const todayOp = dayCounsel.operation;
  const materiaPlanet = planetForMetal(materiaMetal) ?? 'Sun';
  const targetStage = getStage(targetStageId);
  const principle = getPrinciple(targetStage.relatedPrinciple);
  const moon = getMoonPhase();
  const suggestedOp = operationForDay(materiaPlanet, moon.name);
  const scale = scaleOfNature(scalePlanet);

  const tabs: { id: OpusPaneId; label: string }[] = [
    { id: 'stages', label: 'Stages' },
    { id: 'vessel', label: 'Vessel' },
    { id: 'emblem', label: 'Emblem' },
  ];

  const logWorking = async () => {
    if (!isAuthenticated) return;
    setSaving(true);
    setStatus(null);
    try {
      const now = new Date();
      const sky = buildJournalSky(now);
      const body = [
        intent.trim() || 'Opus working from Athanor.',
        '',
        `Materia: ${materiaMetal} (${materiaPlanet})`,
        `Stage: ${targetStage.name} — ${targetStage.colorOfWork}`,
        `Principle: ${principle.name} (${principle.aspect})`,
        `Suggested operation: ${suggestedOp.counsel}`,
        '',
        'Spagyria framing: separate → purify → recombine.',
        targetStage.gloss,
      ].join('\n');
      const res = await apiFetch('/api/journal/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryType: 'working',
          title: intent.trim()
            ? `Opus: ${intent.trim().slice(0, 80)}`
            : `Opus — ${targetStage.name} / ${materiaMetal}`,
          body,
          status: 'active',
          tags: [
            'alchemy',
            'opus',
            targetStage.id,
            principle.id,
            materiaMetal.toLowerCase(),
          ],
          entities: [
            {
              kind: 'metal',
              id: materiaMetal.toLowerCase(),
              label: materiaMetal,
            },
            {
              kind: 'principle',
              id: principle.id,
              label: principle.name,
            },
            {
              kind: 'opusStage',
              id: targetStage.id,
              label: targetStage.name,
            },
            {
              kind: 'planet',
              id: materiaPlanet.toLowerCase(),
              label: materiaPlanet,
            },
          ],
          occurredAt: now.toISOString(),
          sky,
        }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) throw new Error(data.message || 'Failed to log working');
      setStatus('Working logged to Magical Journal.');
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl text-ananael-gold">Athanor</h1>
        <p className="mt-2 max-w-2xl text-sm text-ananael-muted">
          Hermetic alchemy for the oratory: opus stages, a vessel planner, and
          emblem study. Not laboratory chemistry — timings, correspondences, and
          logged workings.
        </p>
        <p className="mt-3 text-sm text-zinc-300">
          <span className="text-[11px] uppercase tracking-wider text-ananael-violet">
            Today&apos;s operation
          </span>
          <span className="mt-1 block">{todayOp.counsel}</span>
        </p>
      </header>

      <div className="flex flex-wrap gap-2 border-b border-ananael-border/40 pb-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setPane(t.id)}
            className={[
              'rounded-md px-3 py-1.5 text-sm transition',
              pane === t.id
                ? 'bg-ananael-violet/25 text-ananael-gold'
                : 'text-ananael-muted hover:text-zinc-200',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {pane === 'stages' && (
        <StagesPane
          stages={stages}
          selected={selectedStage}
          selectedId={selectedStageId}
          onSelect={setSelectedStageId}
          scalePlanet={scalePlanet}
          onScalePlanet={setScalePlanet}
          scale={scale}
          onNavigate={onNavigate}
        />
      )}

      {pane === 'vessel' && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <section className="space-y-4 rounded-xl border border-ananael-border/50 bg-ananael-surface p-5">
            <h2 className="font-display text-lg text-ananael-gold">
              Vessel planner
            </h2>
            <p className="text-xs text-ananael-muted">
              Spagyria as ritual metaphor: separate the crude, purify what
              serves, recombine into one intent. No lab procedure.
            </p>
            <label className="block text-sm text-ananael-muted">
              Intent
              <input
                value={intent}
                onChange={(e) => setIntent(e.target.value)}
                maxLength={200}
                placeholder="What is the One Thing of this working?"
                className="mt-1 w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet"
              />
            </label>
            <label className="block text-sm text-ananael-muted">
              Materia (metal)
              <select
                value={materiaMetal}
                onChange={(e) =>
                  setMateriaMetal(e.target.value as ClassicalMetal)
                }
                className="mt-1 w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet"
              >
                {CLASSICAL_METALS.map((m) => (
                  <option key={m} value={m}>
                    {m} — {planetForMetal(m)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-ananael-muted">
              Target stage
              <select
                value={targetStageId}
                onChange={(e) =>
                  setTargetStageId(e.target.value as OpusStageId)
                }
                className="mt-1 w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet"
              >
                {stages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.colorOfWork})
                  </option>
                ))}
              </select>
            </label>
          </section>

          <section className="space-y-4 rounded-xl border border-ananael-border/50 bg-ananael-surface p-5">
            <h2 className="font-display text-lg text-ananael-gold">Counsel</h2>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-ananael-muted">
                  Planet / metal
                </dt>
                <dd className="mt-1 text-zinc-100">
                  {materiaPlanet} — {materiaMetal}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-ananael-muted">
                  Principle
                </dt>
                <dd className="mt-1 flex items-center gap-2 text-zinc-100">
                  <AlchemyGlyphMark glyphId={principle.glyphId} size={28} />
                  {principle.name} — {principle.aspect}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[11px] uppercase tracking-wider text-ananael-muted">
                  Stage
                </dt>
                <dd className="mt-1 text-zinc-100">
                  {targetStage.name}: {targetStage.gloss}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[11px] uppercase tracking-wider text-ananael-muted">
                  Day / moon suggestion
                </dt>
                <dd className="mt-1 text-zinc-300">{suggestedOp.counsel}</dd>
                <dd className="mt-1 text-xs italic text-ananael-muted">
                  {suggestedOp.axiom}
                </dd>
              </div>
            </dl>
            <p className="text-xs text-ananael-muted">{principle.gloss}</p>
            <div className="flex flex-wrap gap-2 border-t border-ananael-border/40 pt-4">
              <button
                type="button"
                onClick={() =>
                  onNavigate('correspondences', {
                    correspondencesQuery: materiaMetal,
                  })
                }
                className="rounded-md border border-ananael-violet/50 px-3 py-1.5 text-xs text-zinc-100 hover:bg-ananael-violet/20"
              >
                Correspondences
              </button>
              <button
                type="button"
                onClick={() =>
                  onNavigate('talisman', { gematriaPrefill: intent || materiaMetal })
                }
                className="rounded-md border border-ananael-gold/50 px-3 py-1.5 text-xs text-ananael-gold hover:bg-ananael-gold/10"
              >
                Talisman ({materiaPlanet})
              </button>
              <button
                type="button"
                onClick={() =>
                  onNavigate('planetary', { planetaryPanel: 'almanac' })
                }
                className="rounded-md border border-ananael-bronze/60 px-3 py-1.5 text-xs text-zinc-200 hover:bg-ananael-panel"
              >
                Almanac
              </button>
              <button
                type="button"
                onClick={() => onNavigate('liturgy')}
                className="rounded-md border border-ananael-bronze/60 px-3 py-1.5 text-xs text-zinc-200 hover:bg-ananael-panel"
              >
                Alchemy rites
              </button>
              {isAuthenticated ? (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void logWorking()}
                  className="rounded-md bg-ananael-violet px-3 py-1.5 text-xs font-medium text-white hover:bg-ananael-violet-deep disabled:opacity-50"
                >
                  {saving ? 'Logging…' : 'Log working'}
                </button>
              ) : (
                <span className="text-xs text-ananael-muted">
                  Sign in to log a working
                </span>
              )}
            </div>
            {status && (
              <p className="text-sm text-ananael-gold">
                {status}{' '}
                {status.startsWith('Working') && (
                  <button
                    type="button"
                    className="underline"
                    onClick={() => onNavigate('journal', { filter: 'working' })}
                  >
                    Open journal
                  </button>
                )}
              </p>
            )}
          </section>
        </div>
      )}

      {pane === 'emblem' && (
        <EmblemPane
          emblemTab={emblemTab}
          onEmblemTab={setEmblemTab}
          onNavigate={onNavigate}
          onOpenStage={(id) => {
            setSelectedStageId(id);
            setPane('stages');
          }}
        />
      )}
    </div>
  );
}

function StagesPane({
  stages,
  selected,
  selectedId,
  onSelect,
  scalePlanet,
  onScalePlanet,
  scale,
  onNavigate,
}: {
  stages: OpusStageDef[];
  selected: OpusStageDef;
  selectedId: OpusStageId;
  onSelect: (id: OpusStageId) => void;
  scalePlanet: PlanetId;
  onScalePlanet: (p: PlanetId) => void;
  scale: ReturnType<typeof scaleOfNature>;
  onNavigate: (module: ModuleId, opts?: AlchemyNavigateOptions) => void;
}) {
  const principle = getPrinciple(selected.relatedPrinciple);
  return (
    <div className="grid gap-6 lg:grid-cols-[14rem_1fr]">
      <ul className="space-y-1">
        {stages.map((s, i) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => onSelect(s.id)}
              className={[
                'w-full rounded-md px-3 py-2 text-left text-sm',
                selectedId === s.id
                  ? 'bg-ananael-violet/25 text-ananael-gold'
                  : 'text-zinc-300 hover:bg-ananael-panel',
              ].join(' ')}
            >
              <span className="text-[10px] uppercase tracking-wider text-ananael-muted">
                {i + 1}
              </span>
              <span className="block">{s.name}</span>
              <span className="text-xs text-ananael-muted">{s.colorOfWork}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="space-y-5">
        <article className="rounded-xl border border-ananael-border/50 bg-ananael-surface p-5">
          <div className="flex flex-wrap items-start gap-3">
            <AlchemyGlyphMark glyphId={principle.glyphId} size={44} />
            <div>
              <h2 className="font-display text-xl text-ananael-gold">
                {selected.name}
              </h2>
              <p className="text-sm text-ananael-muted">
                Color of the work: {selected.colorOfWork} · Principle:{' '}
                {principle.name}
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-zinc-300">
            {selected.gloss}
          </p>
          <p className="mt-3 text-xs text-ananael-muted">
            Keywords: {selected.keywords.join(' · ')}
          </p>
          <p className="mt-2 text-xs text-ananael-muted">
            Operations: {selected.operations.join(', ')}
          </p>
          <p className="mt-2 text-xs text-zinc-400">
            Planets: {selected.planets.join(', ')} · Metals:{' '}
            {selected.planets.map((p) => metalForPlanet(p)).join(', ')}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                onNavigate('correspondences', {
                  correspondencesQuery: metalForPlanet(selected.planets[0]),
                })
              }
              className="rounded-md border border-ananael-violet/50 px-3 py-1.5 text-xs text-zinc-100 hover:bg-ananael-violet/20"
            >
              Correspondences
            </button>
            <button
              type="button"
              onClick={() =>
                onNavigate('planetary', { planetaryPanel: 'almanac' })
              }
              className="rounded-md border border-ananael-gold/50 px-3 py-1.5 text-xs text-ananael-gold hover:bg-ananael-gold/10"
            >
              Almanac
            </button>
            <button
              type="button"
              onClick={() => onNavigate('liturgy')}
              className="rounded-md border border-ananael-bronze/60 px-3 py-1.5 text-xs text-zinc-200 hover:bg-ananael-panel"
            >
              Ritual Library
            </button>
            <button
              type="button"
              onClick={() => onNavigate('tree')}
              className="rounded-md border border-ananael-bronze/60 px-3 py-1.5 text-xs text-zinc-200 hover:bg-ananael-panel"
            >
              Tree of Life
            </button>
          </div>
        </article>

        <section className="rounded-xl border border-ananael-border/50 bg-ananael-surface p-5">
          <h3 className="font-display text-lg text-ananael-gold">
            Scale of Nature
          </h3>
          <p className="mt-1 text-xs text-ananael-muted">
            Agrippa-style stack for a classical planet — element via Liber 777
            search, then metal, principle, and stage.
          </p>
          <label className="mt-3 block text-sm text-ananael-muted">
            Planet
            <select
              value={scalePlanet}
              onChange={(e) => onScalePlanet(e.target.value as PlanetId)}
              className="mt-1 w-full max-w-xs rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet"
            >
              {PLANETS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <ol className="mt-4 space-y-2 text-sm text-zinc-200">
            <li>
              <span className="text-ananael-muted">Planet</span> — {scale.planet}
            </li>
            <li>
              <span className="text-ananael-muted">Metal</span> — {scale.metal}
            </li>
            <li className="flex items-center gap-2">
              <span className="text-ananael-muted">Principle</span> —{' '}
              <AlchemyGlyphMark glyphId={scale.principle.glyphId} size={22} />
              {scale.principle.name} ({scale.principle.aspect})
            </li>
            <li>
              <span className="text-ananael-muted">Stage</span> —{' '}
              {scale.stage.name} ({scale.stage.colorOfWork})
            </li>
          </ol>
          <div className="mt-4 flex flex-wrap gap-3">
            {TRIA_PRIMA.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-2 rounded-md border border-ananael-border/40 px-2 py-1.5 text-xs text-zinc-300"
              >
                <AlchemyGlyphMark glyphId={p.glyphId} size={20} />
                {p.name}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              onNavigate('correspondences', {
                correspondencesQuery: scale.planet,
              })
            }
            className="mt-4 rounded-md border border-ananael-violet/50 px-3 py-1.5 text-xs text-zinc-100 hover:bg-ananael-violet/20"
          >
            Open {scale.planet} in Correspondences
          </button>
        </section>
      </div>
    </div>
  );
}

function EmblemPane({
  emblemTab,
  onEmblemTab,
  onNavigate,
  onOpenStage,
}: {
  emblemTab: 'emerald' | 'hermetica' | 'emblems';
  onEmblemTab: (t: 'emerald' | 'hermetica' | 'emblems') => void;
  onNavigate: (module: ModuleId, opts?: AlchemyNavigateOptions) => void;
  onOpenStage: (id: OpusStageId) => void;
}) {
  const lines =
    emblemTab === 'emerald'
      ? EMERALD_TABLET_LINES
      : emblemTab === 'hermetica'
        ? HERMETICA_OUTLINES
        : STAGE_EMBLEMS;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ['emerald', 'Emerald Tablet'],
            ['hermetica', 'Hermetica'],
            ['emblems', 'Stage emblems'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => onEmblemTab(id)}
            className={[
              'rounded-md px-3 py-1.5 text-sm transition',
              emblemTab === id
                ? 'bg-ananael-violet/25 text-ananael-gold'
                : 'text-ananael-muted hover:text-zinc-200',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="text-xs text-ananael-muted">
        Study outlines and public-domain tradition paraphrases — not a substitute
        for critical editions or laboratory instruction.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {lines.map((line) => (
          <article
            key={line.id}
            className="rounded-xl border border-ananael-border/50 bg-ananael-surface p-4"
          >
            <h3 className="font-display text-base text-ananael-gold">
              {line.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-300">
              {line.body}
            </p>
            <p className="mt-2 text-xs italic text-ananael-muted">{line.gloss}</p>
            {line.stageId && (
              <button
                type="button"
                onClick={() => onOpenStage(line.stageId!)}
                className="mt-3 text-xs text-ananael-violet underline-offset-2 hover:underline"
              >
                Open {getStage(line.stageId).name}
              </button>
            )}
          </article>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onNavigate('liturgy')}
        className="rounded-md border border-ananael-bronze/60 px-3 py-1.5 text-xs text-zinc-200 hover:bg-ananael-panel"
      >
        Related Alchemy rites in Ritual Library
      </button>
    </div>
  );
}
