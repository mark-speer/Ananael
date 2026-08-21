import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  CORRESPONDENCE_FACETS,
  FACET_LABELS,
  PANTHEON_LABELS,
  PANTHEONS,
  type CorrespondenceFacet,
  type CorrespondenceKey,
} from '../data/correspondences';
import {
  getHexagramsForKey,
  getTrigramsForKey,
} from '../data/ichingCorrespondences';
import { getCardById } from '../data/tarotDeck';
import type { Chakra } from '../data/chakras';
import type { Meridian } from '../data/meridians';
import {
  MUDRA_HANDS_LABELS,
  MUDRA_IDS,
  MUDRA_TRADITION_LABELS,
  type Mudra,
  type MudraId,
} from '../data/mudras';
import { getComparativeMap, getChakraForSephirah } from '../data/subtleBodyMaps';
import {
  metalForPlanet,
  planetForMetal,
  scaleOfNature,
} from '../lib/alchemy';
import {
  primaryCorrespondenceLabel,
  searchCorrespondences,
} from '../lib/correspondences';
import type { PlanetId } from '../lib/planetaryHours';
import type { ModuleId } from './Sidebar';
import MudraSvg from './glyphs/MudraSvg';
import type { TreeNavigateOptions } from './TreeOfLifeModule';

const PLANET_IDS = new Set<string>([
  'Sun',
  'Moon',
  'Mars',
  'Mercury',
  'Jupiter',
  'Venus',
  'Saturn',
]);

interface CorrespondencesModuleProps {
  onNavigate: (module: ModuleId, opts?: TreeNavigateOptions) => void;
  initialQuery?: string;
}

/**
 * Correspondence Encyclopedia — searchable Liber 777–style key scale (1–32).
 */
export default function CorrespondencesModule({
  onNavigate,
  initialQuery = '',
}: CorrespondencesModuleProps) {
  const [query, setQuery] = useState(initialQuery);
  const [facet, setFacet] = useState<CorrespondenceFacet | null>(null);
  const [selectedKey, setSelectedKey] = useState<number | null>(null);
  const [selectedChakraId, setSelectedChakraId] = useState<string | null>(null);
  const [selectedMeridianId, setSelectedMeridianId] = useState<string | null>(
    null
  );
  const [selectedMudraId, setSelectedMudraId] = useState<string | null>(null);
  const [selectedShamanicId, setSelectedShamanicId] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      setSelectedKey(null);
      setSelectedChakraId(null);
      setSelectedMeridianId(null);
      setSelectedMudraId(null);
      setSelectedShamanicId(null);
    }
  }, [initialQuery]);

  const result = useMemo(
    () => searchCorrespondences(query, facet),
    [query, facet],
  );

  const selected =
    result.matches.find((k) => k.key === selectedKey) ??
    result.matches[0] ??
    null;

  const toggleFacet = (f: CorrespondenceFacet) => {
    setFacet((prev) => (prev === f ? null : f));
    setSelectedKey(null);
    setSelectedChakraId(null);
    setSelectedMeridianId(null);
    setSelectedMudraId(null);
    setSelectedShamanicId(null);
  };

  const showSubtlePrimary =
    facet === 'chakra' ||
    facet === 'meridian' ||
    facet === 'mudra' ||
    (result.chakras.length > 0 &&
      result.meridians.length === 0 &&
      result.mudras.length === 0 &&
      !result.matches.length) ||
    (result.meridians.length > 0 &&
      result.chakras.length === 0 &&
      result.mudras.length === 0 &&
      !result.matches.length) ||
    (result.mudras.length > 0 &&
      result.chakras.length === 0 &&
      result.meridians.length === 0 &&
      !result.matches.length);

  const selectedChakra =
    result.chakras.find((c) => c.id === selectedChakraId) ??
    result.chakras[0] ??
    null;
  const selectedMeridian =
    result.meridians.find((m) => m.id === selectedMeridianId) ??
    result.meridians[0] ??
    null;
  const selectedMudra =
    result.mudras.find((m) => m.id === selectedMudraId) ??
    result.mudras[0] ??
    null;
  const selectedWorld =
    result.worlds.find((w) => w.id === selectedShamanicId) ??
    (facet === 'world' ? result.worlds[0] : null) ??
    null;
  const selectedAlly =
    result.allies.find((a) => a.id === selectedShamanicId) ??
    (facet === 'ally' ? result.allies[0] : null) ??
    null;
  const selectedDirection =
    result.directions.find((d) => d.id === selectedShamanicId) ??
    (facet === 'direction' ? result.directions[0] : null) ??
    null;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl text-ananael-gold sm:text-3xl">
          Correspondence Encyclopedia
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ananael-muted">
          Digital Liber 777 — Golden Dawn key scale 1–32. Search by sephirah,
          planet, zodiac, Hebrew letter, angel, deity, hexagram, element, color,
          incense, stone, plant, chakra, meridian, world, ally, or direction. Pantheon parallels and I
          Ching hexagrams (via trigrams) relate on the same key.
        </p>
      </header>

      <div className="space-y-3 rounded-xl border border-ananael-border/50 bg-ananael-surface p-4 sm:p-5">
        <label className="block">
          <span className="sr-only">Search correspondences</span>
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedKey(null);
              setSelectedChakraId(null);
              setSelectedMeridianId(null);
            }}
            placeholder="Search — e.g. Venus, Hathor, Creative, Netzach…"
            className="w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-ananael-muted focus:border-ananael-violet"
          />
        </label>

        <div
          className="-mx-1 flex flex-nowrap gap-2 overflow-x-auto px-1 pb-1"
          role="group"
          aria-label="Search facets"
        >
          {CORRESPONDENCE_FACETS.map((f) => {
            const active = facet === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => toggleFacet(f)}
                className={[
                  'shrink-0 rounded-md border px-2.5 py-1 text-xs transition',
                  active
                    ? 'border-ananael-gold/60 bg-ananael-gold/15 text-ananael-gold'
                    : 'border-ananael-border/60 text-ananael-muted hover:border-ananael-violet/50 hover:text-zinc-200',
                ].join(' ')}
              >
                {FACET_LABELS[f]}
              </button>
            );
          })}
        </div>
      </div>

      {result.cluster && (
        <section
          className="rounded-xl border border-ananael-gold/30 bg-ananael-panel p-5"
          aria-label={`${result.cluster.label} correspondences`}
        >
          <p className="text-xs uppercase tracking-wider text-ananael-muted">
            Cluster
          </p>
          <h2 className="mt-1 font-display text-2xl text-ananael-gold">
            {result.cluster.label}
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {result.cluster.highlights.map((h) => (
              <li key={`${h.label}-${h.value}`}>
                <p className="text-xs uppercase tracking-wider text-ananael-muted">
                  {h.label}
                </p>
                <p className="text-sm text-zinc-200">{h.value}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <section className="space-y-4">
          {(facet === 'chakra' || (!facet && result.chakras.length > 0)) && (
            <SubtleBodyList
              label={`${result.chakras.length} chakra${result.chakras.length === 1 ? '' : 's'}`}
              items={result.chakras.map((c) => ({
                id: c.id,
                title: c.name,
                subtitle: c.sanskrit,
                active: selectedChakra?.id === c.id,
                onSelect: () => {
                  setSelectedChakraId(c.id);
                  setSelectedMeridianId(null);
                  setSelectedMudraId(null);
                  setSelectedKey(null);
                },
              }))}
            />
          )}
          {(facet === 'meridian' || (!facet && result.meridians.length > 0)) && (
            <SubtleBodyList
              label={`${result.meridians.length} meridian${result.meridians.length === 1 ? '' : 's'}`}
              items={result.meridians.map((m) => ({
                id: m.id,
                title: m.name,
                subtitle: m.pinyin,
                active: selectedMeridian?.id === m.id,
                onSelect: () => {
                  setSelectedMeridianId(m.id);
                  setSelectedChakraId(null);
                  setSelectedMudraId(null);
                  setSelectedKey(null);
                  setSelectedShamanicId(null);
                },
              }))}
            />
          )}
          {(facet === 'mudra' ||
            (!facet && result.mudras.length > 0 && query.trim())) && (
            <SubtleBodyList
              label={`${result.mudras.length} mudra${result.mudras.length === 1 ? '' : 's'}`}
              items={result.mudras.map((m) => ({
                id: m.id,
                title: m.name,
                subtitle: `${MUDRA_TRADITION_LABELS[m.tradition]} · ${m.sanskrit}`,
                active: selectedMudra?.id === m.id,
                onSelect: () => {
                  setSelectedMudraId(m.id);
                  setSelectedChakraId(null);
                  setSelectedMeridianId(null);
                  setSelectedKey(null);
                  setSelectedShamanicId(null);
                },
              }))}
            />
          )}
          {(facet === 'world' || (!facet && result.worlds.length > 0 && query.trim())) && (
            <SubtleBodyList
              label={`${result.worlds.length} world${result.worlds.length === 1 ? '' : 's'}`}
              items={result.worlds.map((w) => ({
                id: w.id,
                title: w.name,
                subtitle: w.keywords.slice(0, 3).join(' · '),
                active: selectedWorld?.id === w.id,
                onSelect: () => {
                  setSelectedShamanicId(w.id);
                  setSelectedChakraId(null);
                  setSelectedMeridianId(null);
                  setSelectedMudraId(null);
                  setSelectedKey(null);
                },
              }))}
            />
          )}
          {(facet === 'ally' || (!facet && result.allies.length > 0 && query.trim())) && (
            <SubtleBodyList
              label={`${result.allies.length} all${result.allies.length === 1 ? 'y' : 'ies'}`}
              items={result.allies.map((a) => ({
                id: a.id,
                title: a.name,
                subtitle: `${a.kind} · ${a.tradition}`,
                active: selectedAlly?.id === a.id,
                onSelect: () => {
                  setSelectedShamanicId(a.id);
                  setSelectedChakraId(null);
                  setSelectedMeridianId(null);
                  setSelectedMudraId(null);
                  setSelectedKey(null);
                },
              }))}
            />
          )}
          {(facet === 'direction' || (!facet && result.directions.length > 0 && query.trim())) && (
            <SubtleBodyList
              label={`${result.directions.length} direction${result.directions.length === 1 ? '' : 's'}`}
              items={result.directions.map((d) => ({
                id: d.id,
                title: d.name,
                subtitle: d.element ?? d.keywords[0] ?? '',
                active: selectedDirection?.id === d.id,
                onSelect: () => {
                  setSelectedShamanicId(d.id);
                  setSelectedChakraId(null);
                  setSelectedMeridianId(null);
                  setSelectedMudraId(null);
                  setSelectedKey(null);
                },
              }))}
            />
          )}
          {(!showSubtlePrimary || result.matches.length > 0) && (
            <>
              <p className="text-xs uppercase tracking-wider text-ananael-muted">
                {result.matches.length} key
                {result.matches.length === 1 ? '' : 's'}
                {facet &&
                facet !== 'chakra' &&
                facet !== 'meridian' &&
                facet !== 'mudra'
                  ? ` · ${FACET_LABELS[facet]}`
                  : ''}
              </p>
              <ul className="max-h-[50vh] space-y-1 overflow-y-auto rounded-xl border border-ananael-border/50 bg-ananael-surface p-2 sm:max-h-[32rem]">
                {result.matches.length === 0 &&
                  !result.chakras.length &&
                  !result.meridians.length &&
                  !result.mudras.length && (
                  <li className="px-3 py-4 text-sm text-ananael-muted">
                    No correspondences match this search.
                  </li>
                )}
                {result.matches.map((key) => {
                  const isActive = selected?.key === key.key;
                  return (
                    <li key={key.key}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedKey(key.key);
                          setSelectedChakraId(null);
                          setSelectedMeridianId(null);
                          setSelectedMudraId(null);
                        }}
                        className={[
                          'flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left transition',
                          isActive
                            ? 'bg-ananael-violet/20 text-ananael-gold'
                            : 'text-zinc-300 hover:bg-ananael-panel hover:text-ananael-gold',
                        ].join(' ')}
                      >
                        <span className="w-8 shrink-0 font-display text-sm tabular-nums text-ananael-muted">
                          {key.key}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium">{key.name}</span>
                          <span className="block truncate text-xs text-ananael-muted">
                            {primaryCorrespondenceLabel(key)}
                            {key.tarotId
                              ? ` · ${getCardById(key.tarotId)?.name ?? key.tarotId}`
                              : ''}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>

        <section>
          {selectedChakra && (facet === 'chakra' || selectedChakraId || showSubtlePrimary) ? (
            <ChakraDetailPanel chakra={selectedChakra} onNavigate={onNavigate} />
          ) : selectedMeridian &&
            (facet === 'meridian' || selectedMeridianId || showSubtlePrimary) ? (
            <MeridianDetailPanel meridian={selectedMeridian} onNavigate={onNavigate} />
          ) : selectedMudra &&
            (facet === 'mudra' || selectedMudraId || showSubtlePrimary) ? (
            <MudraDetailPanel mudra={selectedMudra} onNavigate={onNavigate} />
          ) : selectedWorld && (facet === 'world' || selectedShamanicId === selectedWorld.id) ? (
            <SimpleEntityPanel
              eyebrow="World"
              title={selectedWorld.name}
              lines={[
                selectedWorld.keywords.join(' · '),
                selectedWorld.typicalWork,
                selectedWorld.sephirahName
                  ? `Comparative sephirah: ${selectedWorld.sephirahName} (Key ${selectedWorld.sephirahKey}) — study map only`
                  : '',
              ]}
              onOpen={() =>
              onNavigate('shamanism', {
                  shamanismPane: 'worlds',
                  shamanismFocus: selectedWorld.id,
                })
              }
              openLabel="Open Shamanism"
            />
          ) : selectedAlly && (facet === 'ally' || selectedShamanicId === selectedAlly.id) ? (
            <SimpleEntityPanel
              eyebrow={selectedAlly.kind}
              title={selectedAlly.name}
              lines={[
                selectedAlly.tradition,
                selectedAlly.keywords.join(' · '),
                selectedAlly.notes ?? '',
              ]}
              onOpen={() =>
              onNavigate('shamanism', {
                  shamanismPane: 'allies',
                  shamanismFocus: selectedAlly.id,
                })
              }
              openLabel="Open Shamanism"
            />
          ) : selectedDirection &&
            (facet === 'direction' || selectedShamanicId === selectedDirection.id) ? (
            <SimpleEntityPanel
              eyebrow="Direction"
              title={selectedDirection.name}
              lines={[
                selectedDirection.element ?? '',
                selectedDirection.keywords.join(' · '),
                selectedDirection.notes ?? '',
              ]}
              onOpen={() =>
              onNavigate('shamanism', {
                  shamanismPane: 'directions',
                  shamanismFocus: selectedDirection.id,
                })
              }
              openLabel="Open Shamanism"
            />
          ) : selected ? (
            <KeyDetailPanel keyData={selected} onNavigate={onNavigate} />
          ) : (
            <div className="rounded-xl border border-ananael-border/50 bg-ananael-surface p-5">
              <p className="text-sm text-ananael-muted">
                Select a key, chakra, meridian, world, ally, or direction to view
                correspondences.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function SubtleBodyList({
  label,
  items,
}: {
  label: string;
  items: {
    id: string;
    title: string;
    subtitle: string;
    active: boolean;
    onSelect: () => void;
  }[];
}) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-wider text-ananael-muted">{label}</p>
      <ul className="max-h-[40vh] space-y-1 overflow-y-auto rounded-xl border border-ananael-border/50 bg-ananael-surface p-2">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={item.onSelect}
              className={[
                'flex w-full flex-col rounded-md px-3 py-2.5 text-left transition',
                item.active
                  ? 'bg-ananael-violet/20 text-ananael-gold'
                  : 'text-zinc-300 hover:bg-ananael-panel hover:text-ananael-gold',
              ].join(' ')}
            >
              <span className="text-sm font-medium">{item.title}</span>
              <span className="text-xs text-ananael-muted">{item.subtitle}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SimpleEntityPanel({
  eyebrow,
  title,
  lines,
  onOpen,
  openLabel,
}: {
  eyebrow: string;
  title: string;
  lines: string[];
  onOpen: () => void;
  openLabel: string;
}) {
  return (
    <div className="space-y-4 rounded-xl border border-ananael-border/50 bg-ananael-surface p-5">
      <div>
        <p className="text-xs uppercase tracking-wider text-ananael-muted">
          {eyebrow}
        </p>
        <h2 className="mt-1 font-display text-xl text-ananael-gold">{title}</h2>
      </div>
      {lines.filter(Boolean).map((line) => (
        <p key={line.slice(0, 40)} className="text-sm text-zinc-300">
          {line}
        </p>
      ))}
      <button
        type="button"
        onClick={onOpen}
        className="rounded-md border border-ananael-violet/50 px-3 py-1.5 text-xs text-zinc-200 hover:bg-ananael-violet/10"
      >
        {openLabel}
      </button>
    </div>
  );
}

function ChakraDetailPanel({
  chakra,
  onNavigate,
}: {
  chakra: Chakra;
  onNavigate: (module: ModuleId, opts?: TreeNavigateOptions) => void;
}) {
  const map = getComparativeMap(chakra.id);
  return (
    <div className="space-y-4 rounded-xl border border-ananael-border/50 bg-ananael-surface p-5">
      <div>
        <p className="text-xs uppercase tracking-wider text-ananael-muted">Chakra</p>
        <h2 className="mt-1 font-display text-xl text-ananael-gold">{chakra.name}</h2>
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
        {chakra.element && (
          <div>
            <dt className="text-xs uppercase tracking-wider text-ananael-muted">Element</dt>
            <dd className="text-sm text-zinc-200">{chakra.element}</dd>
          </div>
        )}
        {chakra.bija && (
          <div>
            <dt className="text-xs uppercase tracking-wider text-ananael-muted">Bija</dt>
            <dd className="text-sm text-zinc-200">
              {chakra.bija}{' '}
              <button
                type="button"
                onClick={() =>
                  onNavigate('translator', {
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
              {map.sephirahName} (Key {map.sephirahKey}) — {map.source}
            </dd>
          </div>
        )}
      </dl>
      {chakra.notes && (
        <p className="text-xs text-ananael-muted">{chakra.notes}</p>
      )}
      <div className="flex flex-wrap gap-2 border-t border-ananael-border/40 pt-4">
        <button
          type="button"
          onClick={() =>
            onNavigate('liturgy', { riteId: 'chakra-circulation', liturgyMode: 'run' })
          }
          className="rounded-md border border-ananael-violet/50 bg-ananael-violet/10 px-3 py-1.5 text-xs font-medium text-zinc-100 transition hover:bg-ananael-violet/20"
        >
          Run chakra circulation
        </button>
        {map && (
          <button
            type="button"
            onClick={() => onNavigate('tree')}
            className="rounded-md border border-ananael-gold/50 bg-ananael-gold/10 px-3 py-1.5 text-xs font-medium text-ananael-gold transition hover:bg-ananael-gold/20"
          >
            Open Tree of Life
          </button>
        )}
      </div>
    </div>
  );
}

function MudraDetailPanel({
  mudra,
  onNavigate,
}: {
  mudra: Mudra;
  onNavigate: (module: ModuleId, opts?: TreeNavigateOptions) => void;
}) {
  return (
    <div className="space-y-4 rounded-xl border border-ananael-border/50 bg-ananael-surface p-5">
      <div>
        <p className="text-xs uppercase tracking-wider text-ananael-muted">Mudra</p>
        <h2 className="mt-1 font-display text-xl text-ananael-gold">{mudra.name}</h2>
        <p className="text-sm text-ananael-muted">{mudra.sanskrit}</p>
      </div>
      {(MUDRA_IDS as readonly string[]).includes(mudra.id) && (
        <div className="flex flex-col items-center rounded-lg border border-ananael-border/40 bg-ananael-bg/80 px-3 py-3">
          <MudraSvg
            mudraId={mudra.id as MudraId}
            className="h-40 w-48"
            title={mudra.name}
          />
        </div>
      )}
      <dl className="grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wider text-ananael-muted">
            Tradition
          </dt>
          <dd className="text-sm text-zinc-200">
            {MUDRA_TRADITION_LABELS[mudra.tradition]}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-ananael-muted">Hands</dt>
          <dd className="text-sm text-zinc-200">{MUDRA_HANDS_LABELS[mudra.hands]}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs uppercase tracking-wider text-ananael-muted">
            Formation
          </dt>
          <dd className="text-sm text-zinc-200">{mudra.formation}</dd>
        </div>
      </dl>
      {mudra.notes && (
        <p className="text-xs text-ananael-muted">{mudra.notes}</p>
      )}
      <div className="flex flex-wrap gap-2 border-t border-ananael-border/40 pt-4">
        <button
          type="button"
          onClick={() =>
            onNavigate('subtleBody', {
              subtleBodyPane: 'mudras',
              subtleBodyFocus: mudra.id,
            })
          }
          className="rounded-md border border-ananael-violet/50 bg-ananael-violet/10 px-3 py-1.5 text-xs font-medium text-zinc-100 transition hover:bg-ananael-violet/20"
        >
          Open Subtle Body
        </button>
      </div>
    </div>
  );
}

function MeridianDetailPanel({
  meridian,
  onNavigate,
}: {
  meridian: Meridian;
  onNavigate: (module: ModuleId, opts?: TreeNavigateOptions) => void;
}) {
  return (
    <div className="space-y-4 rounded-xl border border-ananael-border/50 bg-ananael-surface p-5">
      <div>
        <p className="text-xs uppercase tracking-wider text-ananael-muted">Meridian</p>
        <h2 className="mt-1 font-display text-xl text-ananael-gold">{meridian.name}</h2>
        <p className="text-sm text-ananael-muted">{meridian.chinese} · {meridian.pinyin}</p>
      </div>
      <dl className="grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wider text-ananael-muted">Element</dt>
          <dd className="text-sm text-zinc-200">{meridian.element}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-ananael-muted">Yin / Yang</dt>
          <dd className="text-sm text-zinc-200">{meridian.yinYang}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-ananael-muted">Organ</dt>
          <dd className="text-sm text-zinc-200">{meridian.associatedOrgan}</dd>
        </div>
        {meridian.peakHourStart >= 0 && (
          <div>
            <dt className="text-xs uppercase tracking-wider text-ananael-muted">Peak hour</dt>
            <dd className="text-sm text-zinc-200">
              {meridian.peakHourStart}:00 – {meridian.peakHourEnd}:00
            </dd>
          </div>
        )}
      </dl>
      {meridian.notes && (
        <p className="text-xs text-ananael-muted">{meridian.notes}</p>
      )}
      <div className="flex flex-wrap gap-2 border-t border-ananael-border/40 pt-4">
        <button
          type="button"
          onClick={() =>
            onNavigate('liturgy', { riteId: 'microcosmic-orbit', liturgyMode: 'run' })
          }
          className="rounded-md border border-ananael-violet/50 bg-ananael-violet/10 px-3 py-1.5 text-xs font-medium text-zinc-100 transition hover:bg-ananael-violet/20"
        >
          Run microcosmic orbit
        </button>
        <button
          type="button"
          onClick={() => onNavigate('planetary', { planetaryPanel: 'hours' })}
          className="rounded-md border border-ananael-gold/50 bg-ananael-gold/10 px-3 py-1.5 text-xs font-medium text-ananael-gold transition hover:bg-ananael-gold/20"
        >
          Celestial Timing
        </button>
      </div>
    </div>
  );
}

function KeyDetailPanel({
  keyData,
  onNavigate,
}: {
  keyData: CorrespondenceKey;
  onNavigate: (module: ModuleId, opts?: TreeNavigateOptions) => void;
}) {
  const card = keyData.tarotId ? getCardById(keyData.tarotId) : undefined;
  const rows: { label: string; value: ReactNode }[] = [];

  rows.push({
    label: 'Kind',
    value: keyData.kind === 'sephira' ? 'Sephirah' : 'Path',
  });
  if (keyData.title) rows.push({ label: 'Title', value: keyData.title });
  if (keyData.hebrew) rows.push({ label: 'Hebrew', value: keyData.hebrew });
  if (keyData.letterName || keyData.letterGlyph) {
    rows.push({
      label: 'Hebrew letter',
      value: [keyData.letterName, keyData.letterGlyph]
        .filter(Boolean)
        .join(' · '),
    });
  }
  if (keyData.planet) rows.push({ label: 'Planet', value: keyData.planet });
  if (keyData.zodiac) rows.push({ label: 'Zodiac', value: keyData.zodiac });
  if (keyData.element) rows.push({ label: 'Element', value: keyData.element });
  if (keyData.day) rows.push({ label: 'Day', value: keyData.day });
  if (keyData.color.length) {
    rows.push({ label: 'Color', value: keyData.color.join(', ') });
  }
  if (keyData.metal) rows.push({ label: 'Metal', value: keyData.metal });

  const planetId =
    keyData.planet && PLANET_IDS.has(keyData.planet)
      ? (keyData.planet as PlanetId)
      : keyData.metal
        ? planetForMetal(keyData.metal)
        : undefined;
  const alchemyScale = planetId ? scaleOfNature(planetId) : null;
  if (alchemyScale) {
    if (!keyData.metal) {
      rows.push({
        label: 'Metal (classical)',
        value: metalForPlanet(alchemyScale.planet),
      });
    }
    rows.push({
      label: 'Principle',
      value: `${alchemyScale.principle.name} — ${alchemyScale.principle.aspect}`,
    });
    rows.push({
      label: 'Opus stage',
      value: `${alchemyScale.stage.name} (${alchemyScale.stage.colorOfWork})`,
    });
  }

  if (keyData.incense?.length) {
    rows.push({ label: 'Incense', value: keyData.incense.join(', ') });
  }
  if (keyData.stone?.length) {
    rows.push({ label: 'Stone', value: keyData.stone.join(', ') });
  }
  if (keyData.plant?.length) {
    rows.push({ label: 'Plant', value: keyData.plant.join(', ') });
  }
  if (keyData.archangel) {
    rows.push({ label: 'Archangel', value: keyData.archangel });
  }
  if (keyData.angel) rows.push({ label: 'Angel', value: keyData.angel });
  if (keyData.spirit) rows.push({ label: 'Spirit', value: keyData.spirit });
  if (keyData.divineName) {
    rows.push({ label: 'Divine name', value: keyData.divineName });
  }
  if (card || keyData.tarotId) {
    rows.push({
      label: 'Tarot',
      value: card?.name ?? keyData.tarotId,
    });
  }

  const deityRows = PANTHEONS.flatMap((p) => {
    const names = keyData.deities?.[p];
    if (!names?.length) return [];
    return [{ pantheon: p, label: PANTHEON_LABELS[p], names }];
  });

  const trigrams = getTrigramsForKey(keyData.key);
  const hexagrams = getHexagramsForKey(keyData.key);
  const comparativeChakra =
    keyData.kind === 'sephira' ? getChakraForSephirah(keyData.key) : undefined;

  return (
    <div className="space-y-4 rounded-xl border border-ananael-border/50 bg-ananael-surface p-5">
      <div>
        <p className="text-xs uppercase tracking-wider text-ananael-muted">
          Key {keyData.key}
        </p>
        <h2 className="mt-1 font-display text-xl text-ananael-gold">
          {keyData.name}
        </h2>
        {keyData.notes && (
          <p className="mt-2 text-sm text-ananael-muted">{keyData.notes}</p>
        )}
      </div>

      <dl className="grid gap-3 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label}>
            <dt className="text-xs uppercase tracking-wider text-ananael-muted">
              {row.label}
            </dt>
            <dd className="text-sm text-zinc-200">{row.value}</dd>
          </div>
        ))}
      </dl>

      {alchemyScale && (
        <p className="text-xs text-ananael-muted">
          Hermetic hints: classical metal, Tria Prima, and opus stage from the
          planetary key — study overlays, not Liber 777 columns.
        </p>
      )}

      {deityRows.length > 0 && (
        <div className="border-t border-ananael-border/40 pt-4">
          <h3 className="text-xs uppercase tracking-wider text-ananael-muted">
            Deities
          </h3>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            {deityRows.map((row) => (
              <div key={row.pantheon}>
                <dt className="text-xs uppercase tracking-wider text-ananael-muted">
                  {row.label}
                </dt>
                <dd className="text-sm text-zinc-200">{row.names.join(', ')}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs text-ananael-muted">
            Egyptian, Greek, Roman, Norse, and Hindu attributions follow Liber
            777 / Golden Dawn tables. Mesoamerican names follow planetary and
            elemental tradition maps (Crowley left Mexican columns blank). These
            are tradition maps on the key scale, not claims of identity between
            deities.
          </p>
        </div>
      )}

      {comparativeChakra && (
        <div className="border-t border-ananael-border/40 pt-4">
          <h3 className="text-xs uppercase tracking-wider text-ananael-muted">
            Comparative chakra
          </h3>
          <p className="mt-2 text-sm text-zinc-200">
            {comparativeChakra.name} ({comparativeChakra.sanskrit}) — study map
            only, not identity between systems.
          </p>
        </div>
      )}

      {trigrams.length > 0 && (
        <div className="border-t border-ananael-border/40 pt-4">
          <h3 className="text-xs uppercase tracking-wider text-ananael-muted">
            I Ching
          </h3>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs uppercase tracking-wider text-ananael-muted">
                Trigrams
              </dt>
              <dd className="text-sm text-zinc-200">
                {trigrams.map((t) => `${t.name} (${t.chinese})`).join(' · ')}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase tracking-wider text-ananael-muted">
                Related hexagrams ({hexagrams.length})
              </dt>
              <dd className="mt-1 max-h-40 overflow-y-auto text-sm text-zinc-200">
                {hexagrams.map((h) => (
                  <div key={h.number}>
                    {h.number}. {h.name}
                  </div>
                ))}
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-ananael-muted">
            Hexagrams whose upper or lower trigram maps to this key (Crowley
            Book of Thoth trigrams + elemental paths).
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-t border-ananael-border/40 pt-4">
        <button
          type="button"
          onClick={() => onNavigate('tree')}
          className="rounded-md border border-ananael-violet/50 bg-ananael-violet/10 px-3 py-1.5 text-xs font-medium text-zinc-100 transition hover:bg-ananael-violet/20"
        >
          Open Tree of Life
        </button>
        {keyData.letterGlyph && (
          <button
            type="button"
            onClick={() =>
              onNavigate('gematria', {
                gematriaPrefill: keyData.letterGlyph,
              })
            }
            className="rounded-md border border-ananael-violet/50 bg-ananael-violet/10 px-3 py-1.5 text-xs font-medium text-zinc-100 transition hover:bg-ananael-violet/20"
          >
            Open in Gematria
          </button>
        )}
        {keyData.tarotId && (
          <button
            type="button"
            onClick={() =>
              onNavigate('divination', { divinationTab: 'tarot' })
            }
            className="rounded-md border border-ananael-gold/50 bg-ananael-gold/10 px-3 py-1.5 text-xs font-medium text-ananael-gold transition hover:bg-ananael-gold/20"
          >
            View in Tarot
          </button>
        )}
        {trigrams.length > 0 && (
          <button
            type="button"
            onClick={() =>
              onNavigate('divination', { divinationTab: 'iching' })
            }
            className="rounded-md border border-ananael-gold/50 bg-ananael-gold/10 px-3 py-1.5 text-xs font-medium text-ananael-gold transition hover:bg-ananael-gold/20"
          >
            Open I Ching
          </button>
        )}
      </div>
    </div>
  );
}
