import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import { metalForPlanet } from '../lib/alchemy';
import {
  getKamea,
  PLANET_ORDER,
  type KameaPlanet,
} from '../lib/kamea';
import {
  chaosSigilPoints,
  kameaSigilPath,
  pointsToPolyline,
} from '../lib/sigil';
import type { ModuleId } from './Sidebar';

type Tab = 'squares' | 'sigils';
type SigilMode = 'planetary' | 'chaos';

interface Props {
  onNavigate?: (module: ModuleId) => void;
  initialName?: string;
}

interface SavedDesign {
  _id: string;
  date: string;
  name: string;
  kind: 'kamea' | 'sigil';
  config: Record<string, unknown>;
  notes?: string;
}

const SIZE = 300;
const CONTROL =
  'rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet';
const GOLD_BUTTON =
  'rounded-md border border-ananael-gold/50 bg-ananael-gold/10 px-3 py-2 text-sm font-medium text-ananael-gold transition hover:bg-ananael-gold/20';
const VIOLET_BUTTON =
  'rounded-md border border-ananael-violet/50 bg-ananael-violet/10 px-3 py-2 text-sm font-medium text-zinc-100 transition hover:bg-ananael-violet/20';

export default function TalismanModule({
  onNavigate,
  initialName = '',
}: Props) {
  const { isAuthenticated } = useAuth();
  const svgRef = useRef<SVGSVGElement>(null);
  const [tab, setTab] = useState<Tab>('squares');
  const [planet, setPlanet] = useState<KameaPlanet>('Saturn');
  const [sigilMode, setSigilMode] = useState<SigilMode>('planetary');
  const [name, setName] = useState(initialName);
  const [overlay, setOverlay] = useState(Boolean(initialName));
  const [designName, setDesignName] = useState(
    initialName ? `${initialName} talisman` : 'Untitled talisman'
  );
  const [notes, setNotes] = useState('');
  const [savedId, setSavedId] = useState<string | null>(null);
  const [designs, setDesigns] = useState<SavedDesign[]>([]);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!initialName) return;
    setName(initialName);
    setOverlay(true);
  }, [initialName]);

  const grid = useMemo(() => getKamea(planet), [planet]);
  const points = useMemo(() => {
    if (tab === 'squares') {
      return overlay ? kameaSigilPath(planet, name, SIZE) : [];
    }
    return sigilMode === 'planetary'
      ? kameaSigilPath(planet, name, SIZE)
      : chaosSigilPoints(name, SIZE, SIZE);
  }, [tab, overlay, sigilMode, planet, name]);

  const loadHistory = useCallback(async () => {
    if (!isAuthenticated) {
      setDesigns([]);
      return;
    }
    try {
      const res = await apiFetch('/api/talisman/designs');
      const data = (await res.json()) as {
        designs?: SavedDesign[];
        message?: string;
      };
      if (!res.ok) throw new Error(data.message || 'Could not load designs');
      setDesigns(data.designs ?? []);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'History failed');
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const kind: SavedDesign['kind'] = tab === 'squares' ? 'kamea' : 'sigil';
  const config = () =>
    kind === 'kamea'
      ? { planet, overlay, overlayName: overlay ? name : '' }
      : { planet, mode: sigilMode, name };

  const exportJson = () => {
    const doc = {
      name: designName.trim() || 'Untitled talisman',
      kind,
      config: config(),
      notes: notes.trim() || undefined,
      exportedAt: new Date().toISOString(),
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' })
    );
    triggerDownload(url, `${slugify(doc.name)}.json`);
    URL.revokeObjectURL(url);
  };

  const exportPng = () => {
    const svg = svgRef.current;
    if (!svg) return;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', '1200');
    clone.setAttribute('height', '1200');
    const source = new XMLSerializer().serializeToString(clone);
    const url = URL.createObjectURL(
      new Blob([source], { type: 'image/svg+xml;charset=utf-8' })
    );
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 1200;
      const context = canvas.getContext('2d');
      if (context) {
        context.fillStyle = '#0c0a12';
        context.fillRect(0, 0, 1200, 1200);
        context.drawImage(image, 0, 0, 1200, 1200);
        triggerDownload(canvas.toDataURL('image/png'), `${slugify(designName)}.png`);
      }
      URL.revokeObjectURL(url);
    };
    image.onerror = () => {
      setStatus('PNG export failed.');
      URL.revokeObjectURL(url);
    };
    image.src = url;
  };

  const save = async () => {
    if (!isAuthenticated || !designName.trim()) return;
    setSaving(true);
    setStatus(null);
    try {
      const res = await apiFetch(
        savedId
          ? `/api/talisman/designs/${savedId}`
          : '/api/talisman/designs',
        {
          method: savedId ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: designName.trim(),
            kind,
            config: config(),
            notes: notes.trim(),
          }),
        }
      );
      const data = (await res.json()) as {
        design?: SavedDesign;
        message?: string;
      };
      if (!res.ok) throw new Error(data.message || 'Save failed');
      setSavedId(data.design?._id ?? savedId);
      setStatus(savedId ? 'Design updated.' : 'Design saved.');
      await loadHistory();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const load = (design: SavedDesign) => {
    const cfg = design.config ?? {};
    if (
      typeof cfg.planet === 'string' &&
      PLANET_ORDER.includes(cfg.planet as KameaPlanet)
    ) {
      setPlanet(cfg.planet as KameaPlanet);
    }
    if (design.kind === 'kamea') {
      setTab('squares');
      const loadedName =
        typeof cfg.overlayName === 'string' ? cfg.overlayName : '';
      setName(loadedName);
      setOverlay(typeof cfg.overlay === 'boolean' ? cfg.overlay : Boolean(loadedName));
    } else {
      setTab('sigils');
      setName(typeof cfg.name === 'string' ? cfg.name : '');
      setSigilMode(cfg.mode === 'chaos' ? 'chaos' : 'planetary');
    }
    setSavedId(design._id);
    setDesignName(design.name);
    setNotes(design.notes ?? '');
    setStatus(null);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl text-ananael-gold">
          Talisman Atelier
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ananael-muted">
          Build planetary magic squares and trace personal sigils. Export your
          work as PNG or JSON, or sign in to keep it in your profile.
        </p>
      </header>

      <div className="flex gap-1 rounded-lg border border-ananael-border/60 bg-ananael-surface p-1">
        {([
          ['squares', 'Squares'],
          ['sigils', 'Sigils'],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={[
              'rounded-md px-3 py-1.5 text-sm transition',
              tab === id
                ? 'bg-ananael-violet/25 text-ananael-gold'
                : 'text-ananael-muted hover:text-zinc-200',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            {(tab === 'squares' || sigilMode === 'planetary') && (
              <Field label="Planet">
                <select
                  value={planet}
                  onChange={(e) => setPlanet(e.target.value as KameaPlanet)}
                  className={CONTROL}
                >
                  {PLANET_ORDER.map((item) => (
                    <option key={item} value={item}>
                      {item} — {metalForPlanet(item)} (
                      {getKamea(item).length}×{getKamea(item).length})
                    </option>
                  ))}
                </select>
              </Field>
            )}
            {tab === 'sigils' && (
              <Field label="Method">
                <select
                  value={sigilMode}
                  onChange={(e) => setSigilMode(e.target.value as SigilMode)}
                  className={CONTROL}
                >
                  <option value="planetary">Planetary kamea</option>
                  <option value="chaos">Chaos letter elimination</option>
                </select>
              </Field>
            )}
            <label className="min-w-[220px] flex-1 text-sm text-ananael-muted">
              Name or intent
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={120}
                className="mt-1 w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet"
              />
            </label>
            {tab === 'squares' && (
              <label className="flex items-center gap-2 pb-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={overlay}
                  onChange={(e) => setOverlay(e.target.checked)}
                  className="accent-ananael-violet"
                />
                Overlay sigil
              </label>
            )}
          </div>

          <div className="rounded-xl border border-ananael-border/50 bg-ananael-surface p-3 sm:p-6">
            <Preview
              ref={svgRef}
              grid={grid}
              points={points}
              showNumbers={tab === 'squares'}
              showGrid={tab === 'squares' || sigilMode === 'planetary'}
            />
          </div>
          <p className="text-xs leading-relaxed text-ananael-muted">
            {tab === 'squares'
              ? `${planet}'s ${grid.length}×${grid.length} square uses 1–${grid.length ** 2}; every row, column, and diagonal has the same sum. Classical metal: ${metalForPlanet(planet)}.`
              : sigilMode === 'planetary'
                ? `Letters repeat on the Agrippan 1–9 key and join their kamea cell centers. Classical metal: ${metalForPlanet(planet)}.`
                : 'Vowels and repeated consonants are removed before the remaining letters trace the consonant wheel.'}
          </p>
        </section>

        <aside className="space-y-4">
          <Panel title="Export">
            <button type="button" onClick={exportPng} className={GOLD_BUTTON}>
              Export PNG
            </button>
            <button type="button" onClick={exportJson} className={VIOLET_BUTTON}>
              Export JSON
            </button>
          </Panel>
          <div className="space-y-3 rounded-xl border border-ananael-border/50 bg-ananael-surface p-4">
            <Field label="Design name">
              <input
                value={designName}
                onChange={(e) => setDesignName(e.target.value)}
                maxLength={100}
                className={`${CONTROL} w-full`}
              />
            </Field>
            <Field label="Notes">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                maxLength={5000}
                className={`${CONTROL} w-full`}
              />
            </Field>
            {isAuthenticated ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={saving || !designName.trim()}
                  onClick={() => void save()}
                  className={`${GOLD_BUTTON} disabled:opacity-50`}
                >
                  {saving ? 'Saving…' : savedId ? 'Update' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSavedId(null);
                    setDesignName('Untitled talisman');
                    setNotes('');
                  }}
                  className="rounded-md border border-ananael-border px-3 py-2 text-sm text-zinc-300"
                >
                  New
                </button>
              </div>
            ) : (
              <p className="text-xs text-ananael-muted">
                Sign in to save and reload designs.
              </p>
            )}
            {status && <p className="text-xs text-zinc-400">{status}</p>}
          </div>
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('planetary')}
              className="w-full rounded-md border border-ananael-border px-3 py-2 text-sm text-ananael-muted hover:text-ananael-gold"
            >
              Consult Celestial Timing
            </button>
          )}
        </aside>
      </div>

      {isAuthenticated && (
        <section className="rounded-xl border border-ananael-border/50 bg-ananael-surface p-5">
          <h2 className="font-display text-lg text-ananael-gold">
            Saved designs
          </h2>
          {designs.length === 0 ? (
            <p className="mt-2 text-sm text-ananael-muted">
              No saved talismans yet.
            </p>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {designs.map((design) => (
                <button
                  key={design._id}
                  type="button"
                  onClick={() => load(design)}
                  className="rounded-lg border border-ananael-border/60 bg-ananael-panel p-3 text-left hover:border-ananael-violet/50"
                >
                  <span className="font-display text-sm text-ananael-gold">
                    {design.name}
                  </span>
                  <span className="mt-1 block text-xs capitalize text-ananael-muted">
                    {design.kind} · {new Date(design.date).toLocaleString()}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

const Preview = forwardRef<
  SVGSVGElement,
  {
    grid: number[][];
    points: { x: number; y: number }[];
    showNumbers: boolean;
    showGrid: boolean;
  }
>(function Preview({ grid, points, showNumbers, showGrid }, ref) {
  const cell = SIZE / grid.length;
  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="mx-auto aspect-square w-full max-w-[620px]"
      role="img"
      aria-label="Talisman preview"
    >
      <rect width={SIZE} height={SIZE} fill="#0c0a12" />
      {showGrid &&
        grid.map((row, r) =>
          row.map((value, c) => (
            <g key={value}>
              <rect
                x={c * cell}
                y={r * cell}
                width={cell}
                height={cell}
                fill="none"
                stroke="#5b4a8a"
                strokeWidth={0.7}
              />
              {showNumbers && (
                <text
                  x={(c + 0.5) * cell}
                  y={(r + 0.5) * cell}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="#d9c675"
                  fontFamily="Georgia, serif"
                  fontSize={Math.max(9, cell * 0.28)}
                >
                  {value}
                </text>
              )}
            </g>
          ))
        )}
      {!showGrid && (
        <circle
          cx={150}
          cy={150}
          r={114}
          fill="none"
          stroke="#3d3554"
          strokeDasharray="4 6"
        />
      )}
      {points.length > 1 && (
        <polyline
          points={pointsToPolyline(points)}
          fill="none"
          stroke="#c9a227"
          strokeWidth={4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {points[0] && (
        <circle
          cx={points[0].x}
          cy={points[0].y}
          r={6}
          fill="#0c0a12"
          stroke="#c9a227"
          strokeWidth={3}
        />
      )}
    </svg>
  );
});

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm text-ananael-muted">
      {label}
      <span className="mt-1 block">{children}</span>
    </label>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 rounded-xl border border-ananael-border/50 bg-ananael-surface p-4">
      <p className="text-xs uppercase tracking-wider text-ananael-muted">
        {title}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </section>
  );
}

function triggerDownload(url: string, filename: string) {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
}

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 48) || 'talisman'
  );
}
