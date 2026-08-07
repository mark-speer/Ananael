import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { useAuth } from '../context/AuthContext';
import {
  applyTemplate,
  cellCenter,
  createItem,
  GRID_COLS,
  GRID_HEIGHT,
  GRID_ROWS,
  GRID_WIDTH,
  CELL_SIZE,
  gridCenterPx,
  nextQuarterLabel,
  sanitizeItems,
  shouldShowCircle,
  snapToCell,
  SVG_VIEWBOX,
  TEMPLATE_LABELS,
  TOOL_LABELS,
  type RitualItem,
  type RitualToolType,
  type TemplateId,
} from '../data/ritualTools';
import { apiFetch } from '../lib/api';

interface SavedLayout {
  _id: string;
  name: string;
  date: string;
  items: RitualItem[];
  showCompass: boolean;
  notes?: string;
}

type PlaceTool = RitualToolType | null;

interface RitualSpaceModuleProps {
  /** When set (e.g. from Ritual Library), apply this template on mount. */
  initialTemplate?: TemplateId;
}

/**
 * Ritual Space Planner — SVG grid altar layout with templates, export, and save.
 */
export default function RitualSpaceModule({
  initialTemplate,
}: RitualSpaceModuleProps) {
  const { isAuthenticated } = useAuth();
  const svgRef = useRef<SVGSVGElement>(null);

  const startTemplate: TemplateId = initialTemplate ?? 'lbrp';
  const [items, setItems] = useState<RitualItem[]>(() =>
    applyTemplate(startTemplate)
  );
  const [showCompass, setShowCompass] = useState(true);
  const [showCircle, setShowCircle] = useState(startTemplate === 'lbrp');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [placeTool, setPlaceTool] = useState<PlaceTool>('candle');
  const [dirty, setDirty] = useState(false);

  const [layoutName, setLayoutName] = useState('Untitled layout');
  const [notes, setNotes] = useState('');
  const [savedId, setSavedId] = useState<string | null>(null);
  const [history, setHistory] = useState<SavedLayout[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const dragRef = useRef<{
    id: string;
    pointerId: number;
  } | null>(null);

  const loadHistory = useCallback(async () => {
    if (!isAuthenticated) {
      setHistory([]);
      return;
    }
    setHistoryError(null);
    try {
      const res = await apiFetch('/api/ritual/layouts');
      const data = (await res.json()) as {
        layouts?: SavedLayout[];
        message?: string;
      };
      if (!res.ok) {
        throw new Error(data.message || 'Failed to load layouts');
      }
      setHistory(data.layouts ?? []);
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

  const markDirty = () => {
    setDirty(true);
    setSaveStatus(null);
  };

  const pointerToCell = (
    clientX: number,
    clientY: number
  ): { x: number; y: number } | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const local = pt.matrixTransform(ctm.inverse());
    return {
      x: snapToCell(local.x, GRID_COLS),
      y: snapToCell(local.y, GRID_ROWS),
    };
  };

  const onCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (dragRef.current) return;
    if (!placeTool) {
      setSelectedId(null);
      return;
    }
    const cell = pointerToCell(e.clientX, e.clientY);
    if (!cell) return;
    let quarterLabel: string | undefined;
    if (placeTool === 'quarter') {
      const existing = items.filter((i) => i.type === 'quarter').length;
      quarterLabel = (['N', 'E', 'S', 'W'] as const)[existing % 4];
    }
    const item = createItem(placeTool, cell.x, cell.y, quarterLabel);
    setItems((prev) => [...prev, item]);
    setSelectedId(item.id);
    markDirty();
  };

  const onItemPointerDown = (
    e: ReactPointerEvent<SVGGElement>,
    id: string
  ) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { id, pointerId: e.pointerId };
    setSelectedId(id);
    setPlaceTool(null);
  };

  const onItemPointerMove = (e: ReactPointerEvent<SVGGElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const cell = pointerToCell(e.clientX, e.clientY);
    if (!cell) return;
    setItems((prev) =>
      prev.map((it) =>
        it.id === drag.id ? { ...it, x: cell.x, y: cell.y } : it
      )
    );
    markDirty();
  };

  const onItemPointerUp = (e: ReactPointerEvent<SVGGElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    dragRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    setItems((prev) => prev.filter((i) => i.id !== selectedId));
    setSelectedId(null);
    markDirty();
  };

  const clearCanvas = () => {
    if (items.length === 0) return;
    if (dirty && !window.confirm('Clear the current layout?')) return;
    setItems([]);
    setSelectedId(null);
    setShowCircle(false);
    markDirty();
  };

  const applyTpl = (id: TemplateId) => {
    if (
      dirty &&
      items.length > 0 &&
      !window.confirm('Replace the current layout with this template?')
    ) {
      return;
    }
    setItems(applyTemplate(id));
    setSelectedId(null);
    setShowCircle(id === 'lbrp');
    setDirty(false);
    setSaveStatus(null);
  };

  const cycleQuarter = () => {
    if (!selectedId) return;
    setItems((prev) =>
      prev.map((it) =>
        it.id === selectedId && it.type === 'quarter'
          ? { ...it, label: nextQuarterLabel(it.label) }
          : it
      )
    );
    markDirty();
  };

  const exportJson = () => {
    const doc = {
      name: layoutName.trim() || 'Untitled layout',
      items,
      showCompass,
      notes: notes.trim() || undefined,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(doc, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slugify(doc.name)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPng = async () => {
    const svg = svgRef.current;
    if (!svg) return;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', String(GRID_WIDTH));
    clone.setAttribute('height', String(GRID_HEIGHT));
    // Opaque background for export
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bg.setAttribute('width', String(GRID_WIDTH));
    bg.setAttribute('height', String(GRID_HEIGHT));
    bg.setAttribute('fill', '#0c0a12');
    clone.insertBefore(bg, clone.firstChild);

    const xml = new XMLSerializer().serializeToString(clone);
    const svgBlob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    try {
      const img = await loadImage(url);
      const canvas = document.createElement('canvas');
      canvas.width = GRID_WIDTH;
      canvas.height = GRID_HEIGHT;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#0c0a12';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const pngUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = `${slugify(layoutName || 'ritual-layout')}.png`;
      a.click();
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  const saveLayout = async () => {
    if (!isAuthenticated) return;
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
        items,
        showCompass,
        notes: notes.trim() || undefined,
      };
      const url = savedId
        ? `/api/ritual/layouts/${savedId}`
        : '/api/ritual/layouts';
      const method = savedId ? 'PUT' : 'POST';
      const res = await apiFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as {
        layout?: SavedLayout;
        message?: string;
      };
      if (!res.ok) {
        throw new Error(data.message || 'Save failed');
      }
      if (data.layout?._id) {
        setSavedId(data.layout._id);
      }
      setDirty(false);
      setSaveStatus(savedId ? 'Layout updated.' : 'Layout saved to your profile.');
      await loadHistory();
    } catch (err) {
      setSaveStatus(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const loadLayout = (layout: SavedLayout) => {
    if (
      dirty &&
      !window.confirm('Discard unsaved changes and load this layout?')
    ) {
      return;
    }
    setItems(sanitizeItems(layout.items));
    setShowCompass(Boolean(layout.showCompass));
    setShowCircle(shouldShowCircle(layout.items));
    setLayoutName(layout.name);
    setNotes(layout.notes ?? '');
    setSavedId(layout._id);
    setSelectedId(null);
    setDirty(false);
    setSaveStatus(null);
  };

  const newLayout = () => {
    if (
      dirty &&
      !window.confirm('Discard unsaved changes and start a new layout?')
    ) {
      return;
    }
    setItems([]);
    setLayoutName('Untitled layout');
    setNotes('');
    setSavedId(null);
    setSelectedId(null);
    setShowCircle(false);
    setDirty(false);
    setSaveStatus(null);
  };

  const selected = items.find((i) => i.id === selectedId) ?? null;
  const { cx: centerCx, cy: centerCy } = gridCenterPx();

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-display text-3xl text-ananael-gold">
          Ritual Space Planner
        </h1>
        <p className="max-w-2xl text-sm text-ananael-muted">
          Arrange altar tools on a grid, apply LBRP or altar-cross templates, and
          export PNG or JSON. Sign in to save layouts to your profile.
        </p>
      </header>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-wider text-ananael-muted">
          Place
        </span>
        {(Object.keys(TOOL_LABELS) as RitualToolType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setPlaceTool(t);
              setSelectedId(null);
            }}
            className={[
              'rounded-md border px-3 py-1.5 text-xs font-medium transition',
              placeTool === t
                ? 'border-ananael-gold/60 bg-ananael-gold/15 text-ananael-gold'
                : 'border-ananael-border/70 text-zinc-300 hover:border-ananael-violet/50 hover:text-ananael-gold',
            ].join(' ')}
          >
            {TOOL_LABELS[t]}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setPlaceTool(null)}
          className={[
            'rounded-md border px-3 py-1.5 text-xs font-medium transition',
            placeTool === null
              ? 'border-ananael-violet/60 bg-ananael-violet/15 text-zinc-100'
              : 'border-ananael-border/70 text-zinc-400 hover:text-zinc-200',
          ].join(' ')}
        >
          Select / Move
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-wider text-ananael-muted">
          Templates
        </span>
        {(Object.keys(TEMPLATE_LABELS) as TemplateId[]).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => applyTpl(id)}
            className="rounded-md border border-ananael-border/70 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-ananael-gold/40 hover:text-ananael-gold"
          >
            {TEMPLATE_LABELS[id]}
          </button>
        ))}
        <span className="mx-1 hidden h-4 w-px bg-ananael-border/60 sm:inline-block" />
        <button
          type="button"
          onClick={() => setShowCompass((v) => !v)}
          className="rounded-md border border-ananael-border/70 px-3 py-1.5 text-xs text-zinc-300 transition hover:text-ananael-gold"
        >
          Compass {showCompass ? 'On' : 'Off'}
        </button>
        <button
          type="button"
          onClick={() => setShowCircle((v) => !v)}
          className="rounded-md border border-ananael-border/70 px-3 py-1.5 text-xs text-zinc-300 transition hover:text-ananael-gold"
        >
          Circle {showCircle ? 'On' : 'Off'}
        </button>
        <button
          type="button"
          disabled={!selectedId}
          onClick={deleteSelected}
          className="rounded-md border border-red-900/50 px-3 py-1.5 text-xs text-red-300/90 transition hover:bg-red-950/40 disabled:opacity-40"
        >
          Delete
        </button>
        <button
          type="button"
          onClick={clearCanvas}
          className="rounded-md border border-ananael-border/70 px-3 py-1.5 text-xs text-zinc-400 transition hover:text-zinc-200"
        >
          Clear
        </button>
        {selected?.type === 'quarter' && (
          <button
            type="button"
            onClick={cycleQuarter}
            className="rounded-md border border-ananael-violet/50 px-3 py-1.5 text-xs text-zinc-200 transition hover:bg-ananael-violet/20"
          >
            Cycle quarter ({selected.label ?? 'N'})
          </button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_minmax(240px,280px)]">
        {/* Canvas */}
        <div className="overflow-hidden rounded-xl border border-ananael-border/50 bg-ananael-surface p-2 sm:p-4">
          <svg
            ref={svgRef}
            viewBox={SVG_VIEWBOX}
            className="mx-auto h-auto w-full max-w-full touch-none select-none"
            role="img"
            aria-label="Ritual space grid"
            onClick={onCanvasClick}
            style={{ cursor: placeTool ? 'crosshair' : 'default' }}
          >
            <rect
              width={GRID_WIDTH}
              height={GRID_HEIGHT}
              fill="#0c0a12"
            />
            {/* Grid lines */}
            <g stroke="#2a2438" strokeWidth={0.5}>
              {Array.from({ length: GRID_COLS + 1 }, (_, i) => (
                <line
                  key={`v${i}`}
                  x1={i * CELL_SIZE}
                  y1={0}
                  x2={i * CELL_SIZE}
                  y2={GRID_HEIGHT}
                />
              ))}
              {Array.from({ length: GRID_ROWS + 1 }, (_, i) => (
                <line
                  key={`h${i}`}
                  x1={0}
                  y1={i * CELL_SIZE}
                  x2={GRID_WIDTH}
                  y2={i * CELL_SIZE}
                />
              ))}
            </g>

            {/* Center crosshair */}
            <g stroke="#3d3554" strokeWidth={1} strokeDasharray="4 4">
              <line
                x1={centerCx}
                y1={0}
                x2={centerCx}
                y2={GRID_HEIGHT}
              />
              <line
                x1={0}
                y1={centerCy}
                x2={GRID_WIDTH}
                y2={centerCy}
              />
            </g>

            {/* LBRP circle */}
            {showCircle && (
              <circle
                cx={centerCx}
                cy={centerCy}
                r={8 * CELL_SIZE}
                fill="none"
                stroke="#c9a227"
                strokeWidth={1.5}
                strokeOpacity={0.55}
              />
            )}

            {/* Altar cross guide when incense/blade/candle/cup pattern */}
            <g pointerEvents="none">
              {/* subtle altar square */}
              <rect
                x={centerCx - 4 * CELL_SIZE}
                y={centerCy - 4 * CELL_SIZE}
                width={8 * CELL_SIZE}
                height={8 * CELL_SIZE}
                fill="none"
                stroke="#5b4a8a"
                strokeWidth={1}
                strokeOpacity={0.25}
              />
            </g>

            {/* Compass rose */}
            {showCompass && <CompassRose />}

            {/* Items */}
            {items.map((item) => {
              const { cx, cy } = cellCenter(item.x, item.y);
              const selected = item.id === selectedId;
              return (
                <g
                  key={item.id}
                  transform={`translate(${cx}, ${cy}) rotate(${item.rotation ?? 0})`}
                  className="cursor-grab active:cursor-grabbing"
                  onPointerDown={(e) => onItemPointerDown(e, item.id)}
                  onPointerMove={onItemPointerMove}
                  onPointerUp={onItemPointerUp}
                  onClick={(e) => e.stopPropagation()}
                  role="button"
                  tabIndex={0}
                  aria-label={`${TOOL_LABELS[item.type]}${item.label ? ` ${item.label}` : ''}`}
                >
                  {selected && (
                    <circle
                      r={CELL_SIZE * 0.55}
                      fill="none"
                      stroke="#c9a227"
                      strokeWidth={2}
                      strokeDasharray="3 2"
                    />
                  )}
                  <ToolGlyph type={item.type} label={item.label} />
                </g>
              );
            })}
          </svg>
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          <div className="space-y-3 rounded-xl border border-ananael-border/50 bg-ananael-surface p-4">
            <p className="text-xs uppercase tracking-wider text-ananael-muted">
              Export
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={exportJson}
                className="rounded-md border border-ananael-violet/50 bg-ananael-violet/10 px-3 py-1.5 text-xs font-medium text-zinc-100 transition hover:bg-ananael-violet/20"
              >
                Download JSON
              </button>
              <button
                type="button"
                onClick={() => void exportPng()}
                className="rounded-md border border-ananael-gold/50 bg-ananael-gold/10 px-3 py-1.5 text-xs font-medium text-ananael-gold transition hover:bg-ananael-gold/20"
              >
                Download PNG
              </button>
            </div>
            <p className="text-xs text-ananael-muted">
              {items.length} item{items.length === 1 ? '' : 's'}
              {dirty ? ' · unsaved changes' : ''}
            </p>
          </div>

          {isAuthenticated ? (
            <div className="space-y-3 rounded-lg border border-ananael-border/70 bg-ananael-panel p-4">
              <label className="block text-sm text-ananael-muted">
                Layout name
                <input
                  type="text"
                  value={layoutName}
                  onChange={(e) => {
                    setLayoutName(e.target.value);
                    markDirty();
                  }}
                  maxLength={100}
                  className="mt-1 w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet"
                />
              </label>
              <label className="block text-sm text-ananael-muted">
                Notes
                <textarea
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value);
                    markDirty();
                  }}
                  rows={3}
                  placeholder="Intent, timing, notes…"
                  className="mt-1 w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={saving || !layoutName.trim()}
                  onClick={() => void saveLayout()}
                  className="rounded-md border border-ananael-gold/50 bg-ananael-gold/10 px-4 py-2 text-sm font-medium text-ananael-gold transition hover:bg-ananael-gold/20 disabled:opacity-60"
                >
                  {saving
                    ? 'Saving…'
                    : savedId
                      ? 'Update Layout'
                      : 'Save Layout'}
                </button>
                <button
                  type="button"
                  onClick={newLayout}
                  className="rounded-md border border-ananael-border/70 px-3 py-2 text-sm text-zinc-300 transition hover:text-ananael-gold"
                >
                  New
                </button>
              </div>
              {saveStatus && (
                <p className="text-sm text-zinc-400">{saveStatus}</p>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-ananael-border/50 bg-ananael-surface p-4">
              <p className="text-sm text-ananael-muted">
                Sign in to save and reload layouts on your profile. Export works
                without an account.
              </p>
            </div>
          )}
        </div>
      </div>

      {isAuthenticated && (
        <div className="rounded-xl border border-ananael-border/50 bg-ananael-surface p-5">
          <h2 className="font-display text-lg text-ananael-gold">
            Saved layouts
          </h2>
          {historyError && (
            <p className="mt-2 text-sm text-red-400/90">{historyError}</p>
          )}
          {!historyError && history.length === 0 && (
            <p className="mt-2 text-sm text-ananael-muted">
              No saved layouts yet.
            </p>
          )}
          {history.length > 0 && (
            <ul className="mt-4 space-y-3">
              {history.map((layout) => {
                const date = new Date(layout.date);
                return (
                  <li
                    key={layout._id}
                    className="flex min-w-0 flex-wrap items-start justify-between gap-3 border-b border-ananael-border/30 pb-3 last:border-0 last:pb-0"
                  >
                    <button
                      type="button"
                      className="text-left"
                      onClick={() => loadLayout(layout)}
                    >
                      <p className="text-sm text-zinc-200">
                        <span className="font-display text-ananael-gold">
                          {layout.name}
                        </span>
                        {savedId === layout._id && (
                          <span className="ml-2 text-[10px] uppercase tracking-wider text-ananael-muted">
                            loaded
                          </span>
                        )}
                      </p>
                      <p className="mt-1 text-xs text-ananael-muted">
                        {date.toLocaleString()} · {layout.items?.length ?? 0}{' '}
                        items
                      </p>
                      {layout.notes && (
                        <p className="mt-1 line-clamp-2 text-xs text-zinc-400">
                          {layout.notes}
                        </p>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => loadLayout(layout)}
                      className="shrink-0 rounded-md border border-ananael-border/70 px-2 py-1 text-xs text-zinc-300 transition hover:text-ananael-gold"
                    >
                      Load
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function ToolGlyph({
  type,
  label,
}: {
  type: RitualToolType;
  label?: string;
}) {
  const r = CELL_SIZE * 0.38;
  switch (type) {
    case 'candle':
      return (
        <g>
          <rect
            x={-3}
            y={-r + 2}
            width={6}
            height={r + 4}
            rx={1}
            fill="#e8d48b"
            stroke="#c9a227"
            strokeWidth={1}
          />
          <ellipse cx={0} cy={-r} rx={3} ry={5} fill="#f5a623" opacity={0.9} />
        </g>
      );
    case 'cup':
      return (
        <g>
          <path
            d={`M ${-r * 0.55} ${-r * 0.3} Q 0 ${r * 0.9} ${r * 0.55} ${-r * 0.3} L ${r * 0.4} ${-r * 0.5} Q 0 ${r * 0.5} ${-r * 0.4} ${-r * 0.5} Z`}
            fill="#6b8cae"
            stroke="#9eb6d4"
            strokeWidth={1}
          />
          <line
            x1={0}
            y1={r * 0.35}
            x2={0}
            y2={r * 0.7}
            stroke="#9eb6d4"
            strokeWidth={1.5}
          />
          <line
            x1={-4}
            y1={r * 0.7}
            x2={4}
            y2={r * 0.7}
            stroke="#9eb6d4"
            strokeWidth={1.5}
          />
        </g>
      );
    case 'blade':
      return (
        <g>
          <line
            x1={0}
            y1={-r}
            x2={0}
            y2={r * 0.4}
            stroke="#c0c8d8"
            strokeWidth={2.5}
            strokeLinecap="round"
          />
          <line
            x1={-5}
            y1={r * 0.15}
            x2={5}
            y2={r * 0.15}
            stroke="#c9a227"
            strokeWidth={2}
          />
          <circle cx={0} cy={r * 0.55} r={3} fill="#8b7355" />
        </g>
      );
    case 'incense':
      return (
        <g>
          <line
            x1={0}
            y1={-r * 0.2}
            x2={0}
            y2={r * 0.7}
            stroke="#a67c52"
            strokeWidth={2}
          />
          <path
            d={`M 0 ${-r * 0.2} Q 4 ${-r * 0.5} 2 ${-r} Q -2 ${-r * 0.6} 0 ${-r * 0.2}`}
            fill="none"
            stroke="#9b8ec4"
            strokeWidth={1.5}
            opacity={0.85}
          />
        </g>
      );
    case 'quarter':
      return (
        <g>
          <circle
            r={r * 0.85}
            fill="#1a1428"
            stroke="#c9a227"
            strokeWidth={1.5}
          />
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fill="#c9a227"
            fontSize={11}
            fontFamily="serif"
            style={{ pointerEvents: 'none' }}
          >
            {label ?? 'N'}
          </text>
        </g>
      );
    default:
      return <circle r={4} fill="#888" />;
  }
}

function CompassRose() {
  const cx = GRID_WIDTH - CELL_SIZE * 2.2;
  const cy = CELL_SIZE * 2.2;
  const arm = CELL_SIZE * 1.4;
  return (
    <g transform={`translate(${cx}, ${cy})`} pointerEvents="none" opacity={0.85}>
      <circle r={arm + 4} fill="#0c0a12" stroke="#3d3554" strokeWidth={1} />
      <line x1={0} y1={-arm} x2={0} y2={arm} stroke="#5b4a8a" strokeWidth={1} />
      <line x1={-arm} y1={0} x2={arm} y2={0} stroke="#5b4a8a" strokeWidth={1} />
      <polygon
        points={`0,${-arm} 3,${-arm + 8} -3,${-arm + 8}`}
        fill="#c9a227"
      />
      <text
        y={-arm - 6}
        textAnchor="middle"
        fill="#c9a227"
        fontSize={9}
        fontFamily="serif"
      >
        N
      </text>
      <text
        y={arm + 12}
        textAnchor="middle"
        fill="#8a8299"
        fontSize={8}
        fontFamily="serif"
      >
        S
      </text>
      <text
        x={arm + 8}
        y={3}
        textAnchor="middle"
        fill="#8a8299"
        fontSize={8}
        fontFamily="serif"
      >
        E
      </text>
      <text
        x={-arm - 8}
        y={3}
        textAnchor="middle"
        fill="#8a8299"
        fontSize={8}
        fontFamily="serif"
      >
        W
      </text>
    </g>
  );
}

function slugify(name: string): string {
  const s = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  return s || 'ritual-layout';
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to rasterize SVG'));
    img.src = url;
  });
}
