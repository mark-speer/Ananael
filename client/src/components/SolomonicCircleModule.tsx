import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useAuth } from '../context/AuthContext';
import {
  absoluteRadius,
  applyTraditionPreset,
  buildCircleLayout,
  CENTER_GLYPH_LABELS,
  sanitizeCircleConfig,
  TRADITION_LABELS,
  WEEKDAY_LABELS,
  WEEKDAYS,
  type CenterGlyph,
  type CircleConfig,
  type RingConfig,
  type TraditionId,
  type Weekday,
} from '../data/solomonicCircles';
import {
  SVG_CENTER,
  SVG_SIZE,
  SVG_VIEWBOX,
  cardinalPositions,
  circleArcPath,
  hexagramTriangles,
  inscribedSquarePoints,
  pentagramPoints,
} from '../lib/solomonicGeometry';

function ringPx(relative: number): number {
  return absoluteRadius(relative);
}

interface SavedCircle {
  _id: string;
  name: string;
  date: string;
  tradition: TraditionId;
  config: CircleConfig;
  notes?: string;
}

/**
 * Solomonic Circles — Phase 5 magician's circle builder.
 * Parametric SVG from tradition presets + editable ring text.
 */
export default function SolomonicCircleModule() {
  const { isAuthenticated, token } = useAuth();
  const svgRef = useRef<SVGSVGElement>(null);

  const [config, setConfig] = useState<CircleConfig>(() =>
    applyTraditionPreset('goetia')
  );
  const [layoutName, setLayoutName] = useState('Untitled circle');
  const [notes, setNotes] = useState('');
  const [savedId, setSavedId] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [history, setHistory] = useState<SavedCircle[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const layout = buildCircleLayout(config);
  const cx = SVG_CENTER;
  const cy = SVG_CENTER;

  const loadHistory = useCallback(async () => {
    if (!token) {
      setHistory([]);
      return;
    }
    setHistoryError(null);
    try {
      const res = await fetch('/api/solomonic/circles', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as {
        circles?: SavedCircle[];
        message?: string;
      };
      if (!res.ok) {
        throw new Error(data.message || 'Failed to load circles');
      }
      setHistory(data.circles ?? []);
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : 'History failed');
    }
  }, [token]);

  useEffect(() => {
    if (isAuthenticated) {
      void loadHistory();
    } else {
      setHistory([]);
    }
  }, [isAuthenticated, loadHistory]);

  const markDirty = () => {
    setDirty(true);
    setSaveStatus(null);
  };

  const updateConfig = (patch: Partial<CircleConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
    markDirty();
  };

  const applyPreset = (tradition: TraditionId) => {
    if (
      dirty &&
      !window.confirm('Replace current circle with this tradition preset?')
    ) {
      return;
    }
    setConfig(
      applyTraditionPreset(tradition, {
        weekday: config.weekday,
        useHebrew: tradition === 'goetia' ? config.useHebrew : false,
        showCompass: config.showCompass,
        centerGlyph: config.centerGlyph,
        showInnerSquare: config.showInnerSquare,
      })
    );
    setSavedId(null);
    setDirty(false);
    setSaveStatus(null);
  };

  const onTraditionChange = (tradition: TraditionId) => {
    applyPreset(tradition);
  };

  const onWeekdayChange = (weekday: Weekday) => {
    if (config.tradition === 'heptameron') {
      setConfig(
        applyTraditionPreset('heptameron', {
          weekday,
          showCompass: config.showCompass,
          centerGlyph: config.centerGlyph,
          showInnerSquare: config.showInnerSquare,
        })
      );
      markDirty();
      return;
    }
    updateConfig({ weekday });
  };

  const updateRing = (id: string, patch: Partial<RingConfig>) => {
    setConfig((prev) => ({
      ...prev,
      rings: prev.rings.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));
    markDirty();
  };

  const exportJson = () => {
    const doc = {
      name: layoutName.trim() || 'Untitled circle',
      tradition: layout.tradition,
      config: layout,
      notes: notes.trim() || undefined,
    };
    const blob = new Blob([JSON.stringify(doc, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slugify(layoutName || 'solomonic-circle')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPng = async () => {
    const svg = svgRef.current;
    if (!svg) return;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', String(SVG_SIZE));
    clone.setAttribute('height', String(SVG_SIZE));
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('width', String(SVG_SIZE));
    bg.setAttribute('height', String(SVG_SIZE));
    bg.setAttribute('fill', '#0c0a12');
    clone.insertBefore(bg, clone.firstChild);

    const xml = new XMLSerializer().serializeToString(clone);
    const svgBlob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    try {
      const img = await loadImage(url);
      const canvas = document.createElement('canvas');
      canvas.width = SVG_SIZE;
      canvas.height = SVG_SIZE;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#0c0a12';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = `${slugify(layoutName || 'solomonic-circle')}.png`;
      a.click();
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  const saveCircle = async () => {
    if (!token) return;
    const name = layoutName.trim();
    if (!name) {
      setSaveStatus('Name is required.');
      return;
    }
    setSaving(true);
    setSaveStatus(null);
    try {
      const body = {
        name,
        tradition: layout.tradition,
        config: layout,
        notes: notes.trim() || undefined,
      };
      const url = savedId
        ? `/api/solomonic/circles/${savedId}`
        : '/api/solomonic/circles';
      const method = savedId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as {
        circle?: SavedCircle;
        message?: string;
      };
      if (!res.ok) {
        throw new Error(data.message || 'Save failed');
      }
      if (data.circle?._id) {
        setSavedId(data.circle._id);
      }
      setDirty(false);
      setSaveStatus(savedId ? 'Circle updated.' : 'Circle saved to your profile.');
      await loadHistory();
    } catch (err) {
      setSaveStatus(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const loadCircle = (circle: SavedCircle) => {
    if (
      dirty &&
      !window.confirm('Discard unsaved changes and load this circle?')
    ) {
      return;
    }
    const sanitized = sanitizeCircleConfig(circle.config);
    if (!sanitized) {
      setSaveStatus('Saved circle config is invalid.');
      return;
    }
    setConfig(sanitized);
    setLayoutName(circle.name);
    setNotes(circle.notes ?? '');
    setSavedId(circle._id);
    setDirty(false);
    setSaveStatus(null);
  };

  const newCircle = () => {
    if (
      dirty &&
      !window.confirm('Discard unsaved changes and start a new circle?')
    ) {
      return;
    }
    setConfig(applyTraditionPreset(config.tradition, { weekday: config.weekday }));
    setLayoutName('Untitled circle');
    setNotes('');
    setSavedId(null);
    setDirty(false);
    setSaveStatus(null);
  };

  const outerR = Math.max(...layout.rings.map((r) => ringPx(r.radius)), ringPx(0.5));
  const glyphR = Math.min(...layout.rings.map((r) => ringPx(r.radius))) * 0.72;
  const squareR = Math.min(...layout.rings.map((r) => ringPx(r.radius))) * 0.85;
  const hex = hexagramTriangles(cx, cy, glyphR);
  const compass = cardinalPositions(cx, cy, outerR + 22);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-display text-3xl text-ananael-gold">
          Solomonic Circles
        </h1>
        <p className="max-w-2xl text-sm text-ananael-muted">
          Build a magician&apos;s protective circle from Goetia, Heptameron, or
          generic presets. Edit ring names, toggle glyphs, and export PNG or
          JSON. Sign in to save circles to your profile.
        </p>
      </header>

      {/* Tradition + options */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-wider text-ananael-muted">
          Tradition
        </span>
        {(Object.keys(TRADITION_LABELS) as TraditionId[]).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => onTraditionChange(id)}
            className={[
              'rounded-md border px-3 py-1.5 text-xs font-medium transition',
              config.tradition === id
                ? 'border-ananael-gold/60 bg-ananael-gold/15 text-ananael-gold'
                : 'border-ananael-border/70 text-zinc-300 hover:border-ananael-violet/50 hover:text-ananael-gold',
            ].join(' ')}
          >
            {TRADITION_LABELS[id]}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-xs text-ananael-muted">
          Weekday
          <select
            value={config.weekday}
            onChange={(e) => onWeekdayChange(e.target.value as Weekday)}
            className="rounded-md border border-ananael-border bg-ananael-bg px-2 py-1.5 text-sm text-zinc-200 outline-none focus:border-ananael-violet"
          >
            {WEEKDAYS.map((d) => (
              <option key={d} value={d}>
                {WEEKDAY_LABELS[d]}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-xs text-ananael-muted">
          Center
          <select
            value={config.centerGlyph}
            onChange={(e) =>
              updateConfig({ centerGlyph: e.target.value as CenterGlyph })
            }
            className="rounded-md border border-ananael-border bg-ananael-bg px-2 py-1.5 text-sm text-zinc-200 outline-none focus:border-ananael-violet"
          >
            {(Object.keys(CENTER_GLYPH_LABELS) as CenterGlyph[]).map((g) => (
              <option key={g} value={g}>
                {CENTER_GLYPH_LABELS[g]}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={() => updateConfig({ showCompass: !config.showCompass })}
          className="rounded-md border border-ananael-border/70 px-3 py-1.5 text-xs text-zinc-300 transition hover:text-ananael-gold"
        >
          Compass {config.showCompass ? 'On' : 'Off'}
        </button>
        <button
          type="button"
          onClick={() =>
            updateConfig({ showInnerSquare: !config.showInnerSquare })
          }
          className="rounded-md border border-ananael-border/70 px-3 py-1.5 text-xs text-zinc-300 transition hover:text-ananael-gold"
        >
          Inner square {config.showInnerSquare ? 'On' : 'Off'}
        </button>
        {config.tradition === 'goetia' && (
          <button
            type="button"
            onClick={() => {
              const useHebrew = !config.useHebrew;
              setConfig(
                applyTraditionPreset('goetia', {
                  weekday: config.weekday,
                  useHebrew,
                  showCompass: config.showCompass,
                  centerGlyph: config.centerGlyph,
                  showInnerSquare: config.showInnerSquare,
                })
              );
              markDirty();
            }}
            className="rounded-md border border-ananael-border/70 px-3 py-1.5 text-xs text-zinc-300 transition hover:text-ananael-gold"
          >
            Names: {config.useHebrew ? 'Hebrew' : 'Latin'}
          </button>
        )}
        <button
          type="button"
          onClick={newCircle}
          className="rounded-md border border-ananael-border/70 px-3 py-1.5 text-xs text-zinc-400 transition hover:text-zinc-200"
        >
          New
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_minmax(260px,300px)]">
        {/* Canvas */}
        <div className="overflow-hidden rounded-xl border border-ananael-border/50 bg-ananael-surface/40 p-2 sm:p-4">
          <svg
            ref={svgRef}
            viewBox={SVG_VIEWBOX}
            className="mx-auto h-auto w-full max-w-full select-none"
            role="img"
            aria-label="Solomonic magic circle"
          >
            <defs>
              {layout.rings.map((r) => (
                <path
                  key={`path-${r.id}`}
                  id={`solomonic-ring-${r.id}`}
                  d={circleArcPath(cx, cy, ringPx(r.radius), r.clockwise)}
                  fill="none"
                />
              ))}
            </defs>

            {/* Soft vignette disk */}
            <circle
              cx={cx}
              cy={cy}
              r={outerR + 8}
              fill="#120e1a"
              stroke="#3d2f55"
              strokeWidth={1}
            />

            {/* Ring strokes */}
            {layout.rings.map((r) => (
              <circle
                key={`stroke-${r.id}`}
                cx={cx}
                cy={cy}
                r={ringPx(r.radius)}
                fill="none"
                stroke="#c9a227"
                strokeWidth={1.5}
                opacity={0.85}
              />
            ))}

            {/* Double outer accent */}
            <circle
              cx={cx}
              cy={cy}
              r={outerR + 6}
              fill="none"
              stroke="#7c5cbf"
              strokeWidth={1}
              opacity={0.5}
            />

            {layout.showInnerSquare && (
              <polygon
                points={inscribedSquarePoints(cx, cy, squareR)}
                fill="none"
                stroke="#c9a227"
                strokeWidth={1}
                opacity={0.7}
              />
            )}

            {layout.centerGlyph === 'hexagram' && (
              <g stroke="#c9a227" strokeWidth={1.25} fill="none" opacity={0.9}>
                <polygon points={hex.up} />
                <polygon points={hex.down} />
              </g>
            )}

            {layout.centerGlyph === 'pentagram' && (
              <polyline
                points={pentagramPoints(cx, cy, glyphR)}
                fill="none"
                stroke="#c9a227"
                strokeWidth={1.25}
                opacity={0.9}
              />
            )}

            {/* Curved ring text */}
            {layout.rings.map((r) =>
              r.text.trim() ? (
                <text
                  key={`text-${r.id}`}
                  fill="#e8d48b"
                  fontSize={r.script === 'hebrew' ? 11 : 10}
                  letterSpacing={r.script === 'hebrew' ? 1 : 1.5}
                  style={{
                    fontFamily:
                      r.script === 'hebrew'
                        ? 'serif'
                        : 'Cinzel, Georgia, serif',
                  }}
                >
                  <textPath
                    href={`#solomonic-ring-${r.id}`}
                    startOffset="0%"
                    method="align"
                    spacing="auto"
                  >
                    {r.text}
                  </textPath>
                </text>
              ) : null
            )}

            {layout.showCompass &&
              compass.map((c) => (
                <text
                  key={c.label}
                  x={c.x}
                  y={c.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="#a78bfa"
                  fontSize={12}
                  fontFamily="Cinzel, Georgia, serif"
                >
                  {c.label}
                </text>
              ))}

            {/* Center point */}
            <circle cx={cx} cy={cy} r={3} fill="#c9a227" />
          </svg>
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs uppercase tracking-wider text-ananael-muted">
              Layout name
            </label>
            <input
              type="text"
              value={layoutName}
              onChange={(e) => {
                setLayoutName(e.target.value);
                markDirty();
              }}
              maxLength={100}
              className="w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet"
            />
          </div>

          <div className="space-y-3">
            <p className="text-xs uppercase tracking-wider text-ananael-muted">
              Ring text
            </p>
            {layout.rings.map((r) => (
              <div key={r.id} className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs text-zinc-400">{r.label}</label>
                  <label className="flex items-center gap-1 text-[10px] text-ananael-muted">
                    r
                    <input
                      type="number"
                      min={0.08}
                      max={1}
                      step={0.02}
                      value={Number(r.radius.toFixed(2))}
                      onChange={(e) =>
                        updateRing(r.id, {
                          radius: Number(e.target.value) || 0.08,
                        })
                      }
                      className="w-14 rounded border border-ananael-border bg-ananael-bg px-1 py-0.5 text-xs text-zinc-200 outline-none focus:border-ananael-violet"
                    />
                  </label>
                </div>
                <textarea
                  value={r.text}
                  onChange={(e) => updateRing(r.id, { text: e.target.value })}
                  rows={2}
                  maxLength={500}
                  placeholder="Names along this ring…"
                  className="w-full rounded-md border border-ananael-border bg-ananael-bg px-2 py-1.5 text-xs text-zinc-100 outline-none focus:border-ananael-violet"
                  dir={r.script === 'hebrew' ? 'rtl' : 'ltr'}
                />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <label className="block text-xs uppercase tracking-wider text-ananael-muted">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                markDirty();
              }}
              rows={3}
              maxLength={5000}
              placeholder="Working notes, intent, timing…"
              className="w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void exportPng()}
              className="rounded-md border border-ananael-gold/50 bg-ananael-gold/10 px-3 py-1.5 text-xs font-medium text-ananael-gold transition hover:bg-ananael-gold/20"
            >
              Export PNG
            </button>
            <button
              type="button"
              onClick={exportJson}
              className="rounded-md border border-ananael-border/70 px-3 py-1.5 text-xs text-zinc-300 transition hover:text-ananael-gold"
            >
              Export JSON
            </button>
            {isAuthenticated && (
              <button
                type="button"
                disabled={saving}
                onClick={() => void saveCircle()}
                className="rounded-md border border-ananael-violet/50 bg-ananael-violet/15 px-3 py-1.5 text-xs font-medium text-zinc-100 transition hover:bg-ananael-violet/25 disabled:opacity-50"
              >
                {saving ? 'Saving…' : savedId ? 'Update' : 'Save'}
              </button>
            )}
          </div>
          {saveStatus && (
            <p className="text-xs text-ananael-muted">{saveStatus}</p>
          )}
          {!isAuthenticated && (
            <p className="text-xs text-ananael-muted">
              Sign in to save circles to your profile.
            </p>
          )}

          {isAuthenticated && (
            <div className="space-y-2 border-t border-ananael-border/40 pt-3">
              <p className="text-xs uppercase tracking-wider text-ananael-muted">
                Recent circles
              </p>
              {historyError && (
                <p className="text-xs text-red-300/90">{historyError}</p>
              )}
              {history.length === 0 && !historyError && (
                <p className="text-xs text-zinc-500">No saved circles yet.</p>
              )}
              <ul className="max-h-48 space-y-1 overflow-y-auto">
                {history.map((c) => (
                  <li key={c._id}>
                    <button
                      type="button"
                      onClick={() => loadCircle(c)}
                      className="w-full rounded-md border border-transparent px-2 py-1.5 text-left text-xs text-zinc-300 transition hover:border-ananael-border/60 hover:bg-ananael-panel hover:text-ananael-gold"
                    >
                      <span className="font-medium">{c.name}</span>
                      <span className="mt-0.5 block text-[10px] text-ananael-muted">
                        {TRADITION_LABELS[c.tradition] ?? c.tradition} ·{' '}
                        {new Date(c.date).toLocaleString()}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'solomonic-circle'
  );
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}
