import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  GEOMANTIC_FIGURES_BY_ID,
  figureIdFromRows,
  type FigureId,
  type GeomanticRows,
} from '../data/geomancy';
import { apiFetch } from '../lib/api';
import {
  deriveChart,
  randomMothers,
  type FigureTuple,
  type GeomanticChart,
} from '../lib/geomancy';
import { buildJournalSky } from '../lib/journalSky';
import type { ModuleId } from './Sidebar';

interface GeomancyModuleProps {
  embedded?: boolean;
  onNavigate?: (module: ModuleId, opts?: { filter?: 'divination' }) => void;
}

const ROW_NAMES = ['Fire', 'Air', 'Water', 'Earth'];
const GROUP_LABELS = ['First', 'Second', 'Third', 'Fourth'];

function FigureGlyph({ id }: { id: FigureId }) {
  return (
    <div className="flex flex-col items-center gap-1" aria-hidden>
      {GEOMANTIC_FIGURES_BY_ID[id].rows.map((single, row) => (
        <div key={row} className="flex h-3 items-center justify-center gap-2">
          <i className="h-2 w-2 rounded-full bg-ananael-gold" />
          {!single && <i className="h-2 w-2 rounded-full bg-ananael-gold" />}
        </div>
      ))}
    </div>
  );
}

function FigureCard({
  id,
  label,
  featured,
}: {
  id: FigureId;
  label: string;
  featured?: boolean;
}) {
  const figure = GEOMANTIC_FIGURES_BY_ID[id];
  return (
    <article
      className={`rounded-lg border p-3 text-center ${
        featured
          ? 'border-ananael-gold/60 bg-ananael-gold/10 shadow-glow'
          : 'border-ananael-border/60 bg-ananael-panel'
      }`}
    >
      <p className="text-[10px] uppercase tracking-wider text-ananael-muted">
        {label}
      </p>
      <div className="my-3"><FigureGlyph id={id} /></div>
      <h3 className="font-display text-base text-ananael-gold">{figure.latin}</h3>
      <p className="text-xs text-zinc-400">{figure.english}</p>
      <p className="mt-2 text-[11px] leading-relaxed text-ananael-muted">
        {figure.meaning}
      </p>
    </article>
  );
}

function FigureGroup({
  title,
  figures,
}: {
  title: string;
  figures: readonly FigureId[];
}) {
  return (
    <section>
      <h2 className="mb-3 font-display text-lg text-ananael-gold">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {figures.map((id, index) => (
          <FigureCard
            key={`${title}-${index}`}
            id={id}
            label={`${GROUP_LABELS[index]} ${title.slice(0, -1)}`}
          />
        ))}
      </div>
    </section>
  );
}

export default function GeomancyModule({
  embedded = false,
  onNavigate,
}: GeomancyModuleProps) {
  const { isAuthenticated } = useAuth();
  const [manualMode, setManualMode] = useState(false);
  const [manualRows, setManualRows] = useState<boolean[][]>(() =>
    Array.from({ length: 4 }, () => Array(4).fill(false) as boolean[])
  );
  const [chart, setChart] = useState<GeomanticChart | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const castRandom = () => {
    setSaveStatus(null);
    setChart(deriveChart(randomMothers()));
  };

  const deriveManual = () => {
    const mothers = manualRows.map((rows) =>
      figureIdFromRows(rows as unknown as GeomanticRows)
    ) as FigureTuple;
    setSaveStatus(null);
    setChart(deriveChart(mothers));
  };

  const toggleLine = (mother: number, row: number) => {
    setManualRows((current) =>
      current.map((lines, m) =>
        m === mother
          ? lines.map((single, r) => (r === row ? !single : single))
          : lines
      )
    );
  };

  const saveChart = async () => {
    if (!isAuthenticated || !chart) return;
    setSaving(true);
    setSaveStatus(null);
    try {
      const now = new Date();
      const res = await apiFetch('/api/geomancy/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...chart,
          userNotes: notes,
          occurredAt: now.toISOString(),
          sky: buildJournalSky(now),
          entities: [chart.judge, ...chart.mothers].map((id) => ({
            kind: 'other',
            id,
            label: GEOMANTIC_FIGURES_BY_ID[id].latin,
          })),
        }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) throw new Error(data.message || 'Failed to save chart');
      setSaveStatus('Saved to Magical Journal.');
    } catch (error) {
      setSaveStatus(error instanceof Error ? error.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {!embedded && (
        <header>
          <h1 className="font-display text-3xl text-ananael-gold">
            Western Geomancy
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ananael-muted">
            Cast four Mothers, then derive the classical shield chart by
            geomantic addition.
          </p>
        </header>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setManualMode(false)}
          className={`rounded-md border px-4 py-3 text-left ${
            !manualMode
              ? 'border-ananael-violet bg-ananael-violet/20 shadow-glow'
              : 'border-ananael-border bg-ananael-panel'
          }`}
        >
          <span className="block text-sm text-zinc-100">Random cast</span>
          <span className="text-xs text-ananael-muted">Generate sixteen lines</span>
        </button>
        <button
          type="button"
          onClick={() => setManualMode(true)}
          className={`rounded-md border px-4 py-3 text-left ${
            manualMode
              ? 'border-ananael-violet bg-ananael-violet/20 shadow-glow'
              : 'border-ananael-border bg-ananael-panel'
          }`}
        >
          <span className="block text-sm text-zinc-100">Manual sticks</span>
          <span className="text-xs text-ananael-muted">Set each mother line</span>
        </button>
      </div>

      {manualMode ? (
        <section className="space-y-4 rounded-xl border border-ananael-border/50 bg-ananael-surface p-4">
          <p className="text-sm text-ananael-muted">
            Toggle each Fire–Air–Water–Earth row between two points and one.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {manualRows.map((rows, mother) => (
              <div key={mother} className="rounded-lg bg-ananael-panel p-3">
                <p className="mb-2 text-center text-xs uppercase text-ananael-gold">
                  Mother {mother + 1}
                </p>
                {rows.map((single, row) => (
                  <button
                    key={row}
                    type="button"
                    onClick={() => toggleLine(mother, row)}
                    className="mb-2 flex w-full items-center justify-between rounded border border-ananael-border/50 px-2 py-1.5 text-xs text-ananael-muted hover:border-ananael-violet"
                  >
                    <span>{ROW_NAMES[row]}</span>
                    <span className="flex w-10 justify-center gap-2">
                      <i className="h-2 w-2 rounded-full bg-ananael-gold" />
                      {!single && <i className="h-2 w-2 rounded-full bg-ananael-gold" />}
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={deriveManual}
            className="rounded-md bg-ananael-violet px-5 py-2.5 text-sm text-white hover:bg-ananael-violet-deep"
          >
            Derive Shield Chart
          </button>
        </section>
      ) : (
        <button
          type="button"
          onClick={castRandom}
          className="rounded-md bg-ananael-violet px-5 py-2.5 text-sm text-white hover:bg-ananael-violet-deep"
        >
          Cast Geomancy
        </button>
      )}

      {chart && (
        <div className="space-y-7">
          <FigureGroup title="Mothers" figures={chart.mothers} />
          <FigureGroup title="Daughters" figures={chart.daughters} />
          <FigureGroup title="Nephews" figures={chart.nephews} />
          <section>
            <h2 className="mb-3 font-display text-lg text-ananael-gold">
              Witnesses & Judgment
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <FigureCard id={chart.witnesses[0]} label="Right Witness" />
              <FigureCard id={chart.witnesses[1]} label="Left Witness" />
              <FigureCard id={chart.judge} label="Judge" featured />
              <FigureCard id={chart.reconciler} label="Reconciler" />
            </div>
          </section>
        </div>
      )}

      {isAuthenticated && chart && (
        <div className="max-w-xl space-y-3 rounded-lg border border-ananael-border/70 bg-ananael-panel p-4">
          <label className="block text-sm text-ananael-muted">
            Reading notes
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={4}
              className="mt-1 w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet"
            />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={() => void saveChart()}
              className="rounded-md border border-ananael-gold/50 bg-ananael-gold/10 px-4 py-2 text-sm text-ananael-gold disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save to Journal'}
            </button>
            {saveStatus && <span className="text-sm text-zinc-400">{saveStatus}</span>}
            {saveStatus?.startsWith('Saved') && onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('journal', { filter: 'divination' })}
                className="text-sm text-ananael-violet hover:underline"
              >
                View in Journal
              </button>
            )}
          </div>
        </div>
      )}

      {!isAuthenticated && (
        <p className="text-sm text-ananael-muted">
          Sign in to save charts to your Magical Journal.
        </p>
      )}
    </div>
  );
}
