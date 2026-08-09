import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useAuth } from '../context/AuthContext';
import {
  GOETIA_RANK_LABELS,
  GOETIA_SPIRITS,
  getSpiritById,
} from '../data/arsGoetia';
import {
  absoluteRadius,
  applyConjurationTemplate,
  applyTraditionPreset,
  CENTER_GLYPH_LABELS,
  DEFAULT_TRIANGLE_BEARING,
  DEFAULT_TRIANGLE_ROTATION,
  buildCircleLayout,
  sanitizeCircleConfig,
  TRADITION_LABELS,
  WEEKDAY_LABELS,
  type CardinalDir,
  type CircleConfig,
  type GlyphSpec,
  type RingConfig,
  type TraditionId,
  type Weekday,
} from '../data/solomonicCircles';
import { apiFetch } from '../lib/api';
import { goetiaSealAssetPath } from '../lib/goetiaSealArt';
import { downloadJson, exportSvgAsPng } from '../lib/svgExport';
import CircleGlyph from './CircleGlyph';
import CircleLayoutModal from './CircleLayoutModal';
import {
  SVG_CENTER,
  SVG_SIZE,
  SVG_VIEWBOX,
  TRIANGLE_SIDE_NAMES,
  cardinalGlyphLayout,
  cardinalPositions,
  circleArcPath,
  conjurationViewBox,
  inscribedSquarePoints,
  triangleOfArt,
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
 * Solomonic Circles — Phase 5 circle builder + Phase 6 Goetia conjuration.
 * Parametric SVG from tradition presets, spirit picker, Triangle of Art + seal.
 */
export default function SolomonicCircleModule() {
  const { isAuthenticated } = useAuth();
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
  const [spiritFilter, setSpiritFilter] = useState('');
  const [layoutModalOpen, setLayoutModalOpen] = useState(false);
  const [sealArtFailed, setSealArtFailed] = useState(false);
  const [exportTransparentBg, setExportTransparentBg] = useState(false);

  const layout = buildCircleLayout(config);
  const cx = SVG_CENTER;
  const cy = SVG_CENTER;
  const selectedSpirit = layout.spiritId
    ? getSpiritById(layout.spiritId)
    : undefined;

  const loadHistory = useCallback(async () => {
    if (!isAuthenticated) {
      setHistory([]);
      return;
    }
    setHistoryError(null);
    try {
      const res = await apiFetch('/api/solomonic/circles');
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
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      void loadHistory();
    } else {
      setHistory([]);
    }
  }, [isAuthenticated, loadHistory]);

  useEffect(() => {
    const spirit = config.spiritId ? getSpiritById(config.spiritId) : undefined;
    if (!spirit) {
      setSealArtFailed(false);
      return;
    }
    setSealArtFailed(false);
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (!cancelled) setSealArtFailed(false);
    };
    img.onerror = () => {
      if (!cancelled) setSealArtFailed(true);
    };
    img.src = goetiaSealAssetPath(spirit.sealRef);
    return () => {
      cancelled = true;
    };
  }, [config.spiritId]);

  const markDirty = () => {
    setDirty(true);
    setSaveStatus(null);
  };

  const updateConfig = (patch: Partial<CircleConfig>) => {
    setConfig((prev) => ({ ...prev, ...patch }));
    markDirty();
  };

  const patchCenterGlyph = (patch: Partial<GlyphSpec>) => {
    updateConfig({
      centerGlyph: { ...config.centerGlyph, ...patch },
    });
  };

  const patchCardinalGlyph = (dir: CardinalDir, patch: Partial<GlyphSpec>) => {
    updateConfig({
      cardinalGlyphs: {
        ...config.cardinalGlyphs,
        [dir]: { ...config.cardinalGlyphs[dir], ...patch },
      },
    });
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
        cardinalGlyphs: config.cardinalGlyphs,
        showInnerSquare: config.showInnerSquare,
      })
    );
    setSavedId(null);
    setDirty(false);
    setSaveStatus(null);
    setSpiritFilter('');
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
          cardinalGlyphs: config.cardinalGlyphs,
          showInnerSquare: config.showInnerSquare,
        })
      );
      markDirty();
      return;
    }
    updateConfig({ weekday });
  };

  const onSpiritSelect = (spiritId: string) => {
    if (!spiritId) {
      updateConfig({
        spiritId: null,
        showTriangle: false,
        showSeal: false,
      });
      return;
    }
    const next = applyConjurationTemplate(spiritId, {
      weekday: config.weekday,
      useHebrew: config.useHebrew,
      showCompass: config.showCompass,
      centerGlyph: config.centerGlyph,
      cardinalGlyphs: config.cardinalGlyphs,
      showInnerSquare: config.showInnerSquare,
      triangleBearing: config.triangleBearing,
      triangleRotationDeg: config.triangleRotationDeg,
    });
    if (!next) return;
    // Preserve current ring text when switching spirits on an existing Goetia layout.
    setConfig({
      ...next,
      rings: config.tradition === 'goetia' ? config.rings : next.rings,
    });
    markDirty();
  };

  const updateRing = (id: string, patch: Partial<RingConfig>) => {
    setConfig((prev) => ({
      ...prev,
      rings: prev.rings.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));
    markDirty();
  };

  const exportJson = () => {
    downloadJson(
      {
        name: layoutName.trim() || 'Untitled circle',
        tradition: layout.tradition,
        config: layout,
        notes: notes.trim() || undefined,
      },
      layoutName.trim() || 'solomonic-circle',
      'solomonic-circle'
    );
  };

  const exportPng = async () => {
    const svg = svgRef.current;
    if (!svg) return;
    const vb = svg.getAttribute('viewBox')?.split(/\s+/).map(Number) ?? [
      0, 0, SVG_SIZE, SVG_SIZE,
    ];
    const vbW = vb[2] || SVG_SIZE;
    const vbH = vb[3] || SVG_SIZE;

    await exportSvgAsPng({
      svg,
      filenameBase: layoutName || 'solomonic-circle',
      fallbackName: 'solomonic-circle',
      width: vbW,
      height: vbH,
      background: exportTransparentBg ? null : '#0c0a12',
      prepareClone: async (clone) => {
        if (exportTransparentBg) {
          const pageBg = clone.querySelector('rect[fill="#0c0a12"]');
          pageBg?.remove();
        } else {
          const bg = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'rect'
          );
          bg.setAttribute('x', String(vb[0] ?? 0));
          bg.setAttribute('y', String(vb[1] ?? 0));
          bg.setAttribute('width', String(vbW));
          bg.setAttribute('height', String(vbH));
          bg.setAttribute('fill', '#0c0a12');
          clone.insertBefore(bg, clone.firstChild);
        }

        // Inline external seal <image> hrefs so PNG rasterization stays same-origin.
        const images = Array.from(clone.querySelectorAll('image'));
        await Promise.all(
          images.map(async (el) => {
            const href =
              el.getAttribute('href') ||
              el.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
            if (!href || href.startsWith('data:')) return;
            try {
              const res = await fetch(href);
              if (!res.ok) return;
              const text = await res.text();
              const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(text)}`;
              el.setAttribute('href', dataUrl);
              el.removeAttributeNS('http://www.w3.org/1999/xlink', 'href');
            } catch {
              /* leave href; seal may omit from export */
            }
          })
        );
      },
    });
  };

  const saveCircle = async () => {
    if (!isAuthenticated) return;
    setSaving(true);
    setSaveStatus(null);
    try {
      const body = {
        name: layoutName.trim() || 'Untitled circle',
        tradition: layout.tradition,
        config: layout,
        notes: notes.trim(),
      };
      const url = savedId
        ? `/api/solomonic/circles/${savedId}`
        : '/api/solomonic/circles';
      const res = await apiFetch(url, {
        method: savedId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
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
    setConfig(
      applyTraditionPreset(config.tradition, { weekday: config.weekday })
    );
    setLayoutName('Untitled circle');
    setNotes('');
    setSavedId(null);
    setDirty(false);
    setSaveStatus(null);
    setSpiritFilter('');
  };

  const outerR = Math.max(
    ...layout.rings.map((r) => ringPx(r.radius)),
    ringPx(0.5)
  );
  const innerR = Math.min(
    ...layout.rings.map((r) => ringPx(r.radius)),
    outerR
  );
  // Center glyph stays compact so cardinals fit inside the innermost circle.
  const glyphR = innerR * 0.32;
  const squareR = innerR * 0.72;
  const centerSpec = layout.centerGlyph;
  const compass = cardinalPositions(cx, cy, outerR + 22);
  const quarterGlyphs = cardinalGlyphLayout(cx, cy, innerR, glyphR * 1.15);

  const triangleSide = Math.max(outerR * 0.55, 110);
  const triangle =
    layout.showTriangle
      ? triangleOfArt(
          cx,
          cy,
          outerR + 6,
          layout.triangleBearing ?? DEFAULT_TRIANGLE_BEARING,
          triangleSide,
          layout.triangleRotationDeg ?? DEFAULT_TRIANGLE_ROTATION
        )
      : null;

  const viewBox =
    layout.showTriangle
      ? conjurationViewBox(layout.triangleBearing ?? DEFAULT_TRIANGLE_BEARING)
      : SVG_VIEWBOX;
  const viewBoxParts = viewBox.split(/\s+/).map(Number) as [
    number,
    number,
    number,
    number,
  ];

  const filteredSpirits = GOETIA_SPIRITS.filter((s) => {
    if (!spiritFilter.trim()) return true;
    const q = spiritFilter.trim().toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      String(s.number).includes(q) ||
      s.rank.includes(q) ||
      GOETIA_RANK_LABELS[s.rank].toLowerCase().includes(q)
    );
  });

  const spiritOptions =
    selectedSpirit && !filteredSpirits.some((s) => s.id === selectedSpirit.id)
      ? [selectedSpirit, ...filteredSpirits]
      : filteredSpirits;

  const sealSize = triangleSide * 0.28;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-display text-3xl text-ananael-gold">
          Solomonic Circles
        </h1>
        <p className="max-w-2xl text-sm text-ananael-muted">
          Build a magician&apos;s protective circle from Goetia, Heptameron, or
          generic presets. For Goetia conjuration, pick a spirit to place the
          Triangle of Art and a labeled seal slot. Export PNG or JSON; sign in
          to save.
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
        <button
          type="button"
          onClick={() => setLayoutModalOpen(true)}
          className="max-w-full rounded-md border border-ananael-border/70 px-3 py-1.5 text-xs text-zinc-300 transition hover:text-ananael-gold"
        >
          Weekday & Glyphs
          <span className="ml-1.5 inline-block max-w-[12rem] truncate align-bottom text-ananael-muted sm:max-w-[16rem]">
            · {WEEKDAY_LABELS[config.weekday]} ·{' '}
            {CENTER_GLYPH_LABELS[config.centerGlyph.kind]}
          </span>
        </button>

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
          <>
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
                    cardinalGlyphs: config.cardinalGlyphs,
                    showInnerSquare: config.showInnerSquare,
                    spiritId: config.spiritId,
                    showTriangle: config.showTriangle,
                    triangleBearing: config.triangleBearing,
                    triangleRotationDeg: config.triangleRotationDeg,
                    showSeal: config.showSeal,
                  })
                );
                markDirty();
              }}
              className="rounded-md border border-ananael-border/70 px-3 py-1.5 text-xs text-zinc-300 transition hover:text-ananael-gold"
            >
              Names: {config.useHebrew ? 'Hebrew' : 'Latin'}
            </button>
            <button
              type="button"
              disabled={!config.spiritId}
              onClick={() =>
                updateConfig({ showTriangle: !config.showTriangle })
              }
              className="rounded-md border border-ananael-border/70 px-3 py-1.5 text-xs text-zinc-300 transition hover:text-ananael-gold disabled:opacity-40"
            >
              Triangle {config.showTriangle ? 'On' : 'Off'}
            </button>
            <button
              type="button"
              disabled={!config.spiritId || !config.showTriangle}
              onClick={() => updateConfig({ showSeal: !config.showSeal })}
              className="rounded-md border border-ananael-border/70 px-3 py-1.5 text-xs text-zinc-300 transition hover:text-ananael-gold disabled:opacity-40"
            >
              Seal {config.showSeal ? 'On' : 'Off'}
            </button>
            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center">
              <label className="flex items-center gap-2 text-xs text-ananael-muted">
                Bearing
                <input
                  type="number"
                  min={0}
                  max={359}
                  step={1}
                  value={Math.round(config.triangleBearing)}
                  disabled={!config.showTriangle}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    const deg = Number.isFinite(n)
                      ? ((n % 360) + 360) % 360
                      : DEFAULT_TRIANGLE_BEARING;
                    updateConfig({ triangleBearing: deg });
                  }}
                  className="min-h-10 w-16 rounded-md border border-ananael-border bg-ananael-bg px-2 py-1.5 text-sm text-zinc-200 outline-none focus:border-ananael-violet disabled:opacity-40 sm:min-h-0"
                />
                °
              </label>
              <label className="flex items-center gap-2 text-xs text-ananael-muted">
                Rotate
                <input
                  type="number"
                  min={0}
                  max={359}
                  step={1}
                  value={Math.round(config.triangleRotationDeg ?? 0)}
                  disabled={!config.showTriangle}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    const deg = Number.isFinite(n)
                      ? ((n % 360) + 360) % 360
                      : DEFAULT_TRIANGLE_ROTATION;
                    updateConfig({ triangleRotationDeg: deg });
                  }}
                  className="min-h-10 w-16 rounded-md border border-ananael-border bg-ananael-bg px-2 py-1.5 text-sm text-zinc-200 outline-none focus:border-ananael-violet disabled:opacity-40 sm:min-h-0"
                />
                °
              </label>
            </div>
          </>
        )}
        <button
          type="button"
          onClick={newCircle}
          className="rounded-md border border-ananael-border/70 px-3 py-1.5 text-xs text-zinc-400 transition hover:text-zinc-200"
        >
          New
        </button>
      </div>

      {/* Spirit picker (Goetia) */}
      {config.tradition === 'goetia' && (
        <div className="space-y-2 rounded-xl border border-ananael-border/40 bg-ananael-surface p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <span className="text-xs uppercase tracking-wider text-ananael-muted">
              Spirit
            </span>
            <input
              type="search"
              value={spiritFilter}
              onChange={(e) => setSpiritFilter(e.target.value)}
              placeholder="Filter by name, number, rank…"
              className="w-full min-w-0 flex-1 rounded-md border border-ananael-border bg-ananael-bg px-2 py-1.5 text-sm text-zinc-200 outline-none focus:border-ananael-violet"
            />
            <select
              value={config.spiritId ?? ''}
              onChange={(e) => onSpiritSelect(e.target.value)}
              className="w-full min-w-0 rounded-md border border-ananael-border bg-ananael-bg px-2 py-1.5 text-sm text-zinc-200 outline-none focus:border-ananael-violet sm:w-auto sm:min-w-[14rem]"
            >
              <option value="">Circle only (no spirit)</option>
              {spiritOptions.map((s) => (
                <option key={s.id} value={s.id}>
                  #{s.number} {s.name} ({GOETIA_RANK_LABELS[s.rank]})
                </option>
              ))}
            </select>
            {selectedSpirit && (
              <span className="text-xs text-ananael-gold/90">
                #{selectedSpirit.number} {selectedSpirit.name} ·{' '}
                {GOETIA_RANK_LABELS[selectedSpirit.rank]}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_minmax(260px,300px)]">
        {/* Canvas */}
        <div className="overflow-hidden rounded-xl border border-ananael-border/50 bg-ananael-surface p-2 sm:p-4">
          <svg
            ref={svgRef}
            viewBox={viewBox}
            className="mx-auto h-auto w-full max-w-full select-none"
            role="img"
            aria-label={
              selectedSpirit
                ? `Solomonic conjuration for ${selectedSpirit.name}`
                : 'Solomonic magic circle'
            }
          >
            <rect
              x={viewBoxParts[0]}
              y={viewBoxParts[1]}
              width={viewBoxParts[2]}
              height={viewBoxParts[3]}
              fill="#0c0a12"
            />
            <defs>
              {layout.rings.map((r) => (
                <path
                  key={`path-${r.id}`}
                  id={`solomonic-ring-${r.id}`}
                  d={circleArcPath(cx, cy, ringPx(r.radius), true)}
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
                opacity={r.opacity ?? 0.85}
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

            <CircleGlyph
              spec={centerSpec}
              cx={cx}
              cy={cy}
              radius={glyphR}
              strokeWidth={1.25}
              labelFontSize={13}
              labelOutward={14}
            />

            {/* Cardinal quarter glyphs (Lesser Key style) */}
            {quarterGlyphs.map((q) => (
              <CircleGlyph
                key={`cardinal-${q.dir}`}
                spec={layout.cardinalGlyphs[q.dir]}
                cx={q.x}
                cy={q.y}
                radius={q.radius}
                strokeWidth={1}
                labelFontSize={9}
                labelOutward={8}
              />
            ))}

            {/* Curved ring text — clockwise paths keep lettering outside each ring */}
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

            {/* Triangle of Art */}
            {triangle && (
              <g>
                <polygon
                  points={triangle.points}
                  fill="#120e1a"
                  stroke="#c9a227"
                  strokeWidth={1.75}
                  opacity={0.95}
                />
                {triangle.sideMids.map((m, i) => {
                  // Keep labels upright along the edge (flip if upside-down).
                  let angle = m.angle;
                  if (angle > 90 || angle < -90) angle += 180;
                  return (
                    <text
                      key={TRIANGLE_SIDE_NAMES[i]}
                      x={m.x}
                      y={m.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#e8d48b"
                      fontSize={8}
                      fontFamily="Cinzel, Georgia, serif"
                      opacity={0.9}
                      transform={`rotate(${angle} ${m.x} ${m.y})`}
                    >
                      {TRIANGLE_SIDE_NAMES[i]}
                    </text>
                  );
                })}

                {layout.showSeal && selectedSpirit && (
                  <g>
                    <rect
                      x={triangle.center.x - sealSize / 2}
                      y={triangle.center.y - sealSize / 2}
                      width={sealSize}
                      height={sealSize}
                      rx={4}
                      fill="#0c0a12"
                      stroke="#7c5cbf"
                      strokeWidth={1.5}
                    />
                    {!sealArtFailed ? (
                      <>
                        <image
                          href={goetiaSealAssetPath(selectedSpirit.sealRef)}
                          x={triangle.center.x - sealSize * 0.42}
                          y={triangle.center.y - sealSize * 0.42}
                          width={sealSize * 0.84}
                          height={sealSize * 0.84}
                          preserveAspectRatio="xMidYMid meet"
                          onError={() => setSealArtFailed(true)}
                        />
                        <text
                          x={triangle.center.x}
                          y={triangle.center.y + sealSize * 0.46}
                          textAnchor="middle"
                          fill="#a78bfa"
                          fontSize={8}
                          fontFamily="Cinzel, Georgia, serif"
                        >
                          {selectedSpirit.name}
                        </text>
                      </>
                    ) : (
                      <>
                        <text
                          x={triangle.center.x}
                          y={triangle.center.y - sealSize * 0.22}
                          textAnchor="middle"
                          fill="#a78bfa"
                          fontSize={9}
                          fontFamily="Cinzel, Georgia, serif"
                        >
                          #{selectedSpirit.number}
                        </text>
                        <text
                          x={triangle.center.x}
                          y={triangle.center.y + 2}
                          textAnchor="middle"
                          fill="#c9a227"
                          fontSize={10}
                          fontFamily="Cinzel, Georgia, serif"
                        >
                          {selectedSpirit.name}
                        </text>
                        <text
                          x={triangle.center.x}
                          y={triangle.center.y + sealSize * 0.28}
                          textAnchor="middle"
                          fill="#71717a"
                          fontSize={7}
                          fontFamily="ui-monospace, monospace"
                        >
                          {selectedSpirit.sealRef}
                        </text>
                      </>
                    )}
                  </g>
                )}
              </g>
            )}

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
                <label className="flex items-center gap-2 text-[10px] text-ananael-muted">
                  Opacity
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={r.opacity ?? 0.85}
                    onChange={(e) =>
                      updateRing(r.id, {
                        opacity: Number(e.target.value),
                      })
                    }
                    className="h-1.5 flex-1 accent-ananael-gold"
                    aria-label={`${r.label} opacity`}
                  />
                  <span className="w-8 tabular-nums text-zinc-400">
                    {Math.round((r.opacity ?? 0.85) * 100)}%
                  </span>
                </label>
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

          <div className="flex flex-wrap items-center gap-2">
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
            <label className="flex items-center gap-1.5 text-xs text-zinc-400">
              <input
                type="checkbox"
                checked={exportTransparentBg}
                onChange={(e) => setExportTransparentBg(e.target.checked)}
                className="accent-ananael-gold"
              />
              Transparent background
            </label>
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
                {history.map((c) => {
                  const spirit = c.config?.spiritId
                    ? getSpiritById(c.config.spiritId)
                    : undefined;
                  return (
                    <li key={c._id}>
                      <button
                        type="button"
                        onClick={() => loadCircle(c)}
                        className="w-full rounded-md border border-transparent px-2 py-1.5 text-left text-xs text-zinc-300 transition hover:border-ananael-border/60 hover:bg-ananael-panel hover:text-ananael-gold"
                      >
                        <span className="font-medium">{c.name}</span>
                        <span className="mt-0.5 block text-[10px] text-ananael-muted">
                          {TRADITION_LABELS[c.tradition] ?? c.tradition}
                          {spirit ? ` · ${spirit.name}` : ''} ·{' '}
                          {new Date(c.date).toLocaleString()}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </div>

      <CircleLayoutModal
        open={layoutModalOpen}
        onClose={() => setLayoutModalOpen(false)}
        config={config}
        onWeekdayChange={onWeekdayChange}
        patchCenterGlyph={patchCenterGlyph}
        patchCardinalGlyph={patchCardinalGlyph}
      />
    </div>
  );
}

