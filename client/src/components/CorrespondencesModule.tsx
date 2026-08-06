import { useMemo, useState, type ReactNode } from 'react';
import {
  CORRESPONDENCE_FACETS,
  FACET_LABELS,
  type CorrespondenceFacet,
  type CorrespondenceKey,
} from '../data/correspondences';
import { getCardById } from '../data/tarotDeck';
import {
  primaryCorrespondenceLabel,
  searchCorrespondences,
} from '../lib/correspondences';
import type { ModuleId } from './Sidebar';
import type { TreeNavigateOptions } from './TreeOfLifeModule';

interface CorrespondencesModuleProps {
  onNavigate: (module: ModuleId, opts?: TreeNavigateOptions) => void;
}

/**
 * Correspondence Encyclopedia — searchable Liber 777–style key scale (1–32).
 */
export default function CorrespondencesModule({
  onNavigate,
}: CorrespondencesModuleProps) {
  const [query, setQuery] = useState('');
  const [facet, setFacet] = useState<CorrespondenceFacet | null>(null);
  const [selectedKey, setSelectedKey] = useState<number | null>(null);

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
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl text-ananael-gold">
          Correspondence Encyclopedia
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ananael-muted">
          Digital Liber 777 — Golden Dawn key scale 1–32. Search by sephirah,
          planet, zodiac, Hebrew letter, angel, archangel, spirit, element,
          color, incense, stone, or plant.
        </p>
      </header>

      <div className="space-y-3 rounded-xl border border-ananael-border/50 bg-ananael-surface/40 p-4 sm:p-5">
        <label className="block">
          <span className="sr-only">Search correspondences</span>
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedKey(null);
            }}
            placeholder="Search — e.g. Venus, Haniel, Netzach, Rose…"
            className="w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2.5 text-sm text-zinc-100 outline-none placeholder:text-ananael-muted focus:border-ananael-violet"
          />
        </label>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Search facets">
          {CORRESPONDENCE_FACETS.map((f) => {
            const active = facet === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => toggleFacet(f)}
                className={[
                  'rounded-md border px-2.5 py-1 text-xs transition',
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
          className="rounded-xl border border-ananael-gold/30 bg-ananael-gold/5 p-5"
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
        <section className="space-y-2">
          <p className="text-xs uppercase tracking-wider text-ananael-muted">
            {result.matches.length} key
            {result.matches.length === 1 ? '' : 's'}
            {facet ? ` · ${FACET_LABELS[facet]}` : ''}
          </p>
          <ul className="max-h-[32rem] space-y-1 overflow-y-auto rounded-xl border border-ananael-border/50 bg-ananael-surface/40 p-2">
            {result.matches.length === 0 && (
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
                    onClick={() => setSelectedKey(key.key)}
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
        </section>

        <section>
          {selected ? (
            <KeyDetailPanel keyData={selected} onNavigate={onNavigate} />
          ) : (
            <div className="rounded-xl border border-ananael-border/50 bg-ananael-surface/40 p-5">
              <p className="text-sm text-ananael-muted">
                Select a key to view its full correspondences.
              </p>
            </div>
          )}
        </section>
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

  return (
    <div className="space-y-4 rounded-xl border border-ananael-border/50 bg-ananael-surface/40 p-5">
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
            onClick={() => onNavigate('tarot')}
            className="rounded-md border border-ananael-gold/50 bg-ananael-gold/10 px-3 py-1.5 text-xs font-medium text-ananael-gold transition hover:bg-ananael-gold/20"
          >
            View in Tarot
          </button>
        )}
      </div>
    </div>
  );
}
