import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { AppNavigateOptions } from '../App';
import {
  getSutraPreset,
  SUTRA_PRESETS,
  SUTRA_PURPOSE_LABELS,
} from '../data/sutras';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';
import { metalForPlanet } from '../lib/alchemy';
import {
  getKamea,
  PLANET_ORDER,
  type KameaPlanet,
} from '../lib/kamea';
import {
  layoutOfuda,
  OFUDA_FONT_JP,
  OFUDA_FONT_LATIN,
  OFUDA_HEIGHT,
  OFUDA_WIDTH,
  type OfudaLayout,
} from '../lib/ofuda';
import {
  chaosSigilPoints,
  kameaSigilPath,
  pointsToPolyline,
} from '../lib/sigil';
import {
  CENTER_GLYPH_GROUPS,
  CENTER_GLYPH_LABELS,
  glyphHasVertexLetters,
  glyphSpec,
  sanitizeGlyphSpec,
  type CenterGlyph,
  type GlyphSpec,
} from '../data/solomonicCircles';
import { SCRIPT_CHAR_GROUPS, SCRIPT_CHARS } from '../data/scriptGlyphs';
import { polarToCartesian } from '../lib/solomonicGeometry';
import CircleGlyph from './CircleGlyph';
import { downloadJson, exportSvg, exportSvgAsPng } from '../lib/svgExport';
import { transliterate } from '../lib/transliterate';
import type { ModuleId } from './Sidebar';

type Tab = 'sigils' | 'sutras';
type SigilMode = 'planetary' | 'chaos';

/** Decorative circle drawn around the sigil. */
interface SigilRing {
  id: string;
  /** Radius in SVG px within the 300×300 viewBox. */
  radius: number;
  opacity: number;
}

/** A Solomonic glyph placed at a compass bearing around the sigil. */
interface SigilGlyph {
  id: string;
  spec: GlyphSpec;
  /** Compass degrees: 0 = 12 o'clock (North), clockwise. */
  angleDeg: number;
  /** Distance from center in SVG px. */
  radius: number;
  /** Glyph radius in SVG px. */
  size: number;
  /** UI-only: family shown in the two-step picker (not persisted). */
  family?: string;
  /** UI-only: saved-circle id backing this glyph when family is Saved. */
  savedRef?: string;
}

/** A saved Solomonic circle's center glyph, offered in the Saved family. */
interface SavedGlyphOption {
  id: string;
  name: string;
  spec: GlyphSpec;
}

interface Props {
  /** When true, hide the standalone page header (used inside Atelier portal). */
  embedded?: boolean;
  onNavigate?: (module: ModuleId, opts?: AppNavigateOptions) => void;
  initialName?: string;
}

interface SavedDesign {
  _id: string;
  date: string;
  name: string;
  kind: 'kamea' | 'sigil' | 'sutra';
  config: Record<string, unknown>;
  notes?: string;
}

const SIZE = 300;
const CENTER = SIZE / 2;
const DEFAULT_SIGIL_COLOR = '#c9a227';
const DEFAULT_RING_COLOR = '#c9a227';
const DEFAULT_GLYPH_COLOR = '#c9a227';
const DEFAULT_BG_COLOR = '#0c0a12';
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const DEFAULT_SUTRA_ID = SUTRA_PRESETS[0]!.id;
const MIN_RING_RADIUS = 40;
const MAX_RING_RADIUS = 148;
const MAX_RINGS = 8;
const MIN_GLYPH_SIZE = 8;
const MAX_GLYPH_SIZE = 48;
const MAX_GLYPHS = 16;
const DEFAULT_RING_OPACITY = 0.85;

/** Clock-position presets: 12 o'clock = 0°, 3 = 90°, 6 = 180°, 9 = 270°. */
const CLOCK_POSITIONS = Array.from({ length: 12 }, (_, i) => ({
  label: `${i === 0 ? 12 : i} o'clock`,
  angle: i * 30,
}));

const SCRIPT_FAMILY = 'Script characters';
const SAVED_FAMILY = 'Saved glyphs';

/** Geometric / alchemical families from the shared glyph groups. */
const GEOMETRIC_GLYPH_GROUPS = CENTER_GLYPH_GROUPS.filter(
  (group) => group.label !== 'None'
);

/** Family implied by a glyph spec (used when no explicit pick exists). */
function familyFromSpec(spec: GlyphSpec): string {
  if (spec.kind === 'script') return SCRIPT_FAMILY;
  return (
    GEOMETRIC_GLYPH_GROUPS.find((group) => group.kinds.includes(spec.kind))
      ?.label ?? GEOMETRIC_GLYPH_GROUPS[0]!.label
  );
}

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function readColor(value: unknown, fallback: string): string {
  return typeof value === 'string' && HEX_COLOR.test(value)
    ? value
    : fallback;
}

function normalizeAngle(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return ((Math.round(value) % 360) + 360) % 360;
}

/**
 * Largest center distance keeping a glyph (and its vertex letters, which sit
 * outside the glyph radius) inside the 300×300 viewBox.
 */
function maxGlyphDistance(spec: GlyphSpec, size: number): number {
  const labelOutward =
    glyphHasVertexLetters(spec.kind) && spec.letters
      ? Math.max(7, size * 0.5)
      : 0;
  return Math.max(0, MAX_RING_RADIUS - size - labelOutward);
}

function sanitizeRings(raw: unknown): SigilRing[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, MAX_RINGS).flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const r = item as Record<string, unknown>;
    const radius =
      typeof r.radius === 'number' && Number.isFinite(r.radius)
        ? clamp(Math.round(r.radius), MIN_RING_RADIUS, MAX_RING_RADIUS)
        : MAX_RING_RADIUS;
    const opacity =
      typeof r.opacity === 'number' && Number.isFinite(r.opacity)
        ? clamp(r.opacity, 0.05, 1)
        : DEFAULT_RING_OPACITY;
    return [{ id: uid('ring'), radius, opacity }];
  });
}

function sanitizeGlyphPlacements(raw: unknown): SigilGlyph[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, MAX_GLYPHS).flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const g = item as Record<string, unknown>;
    const spec = sanitizeGlyphSpec(g.spec);
    if (spec.kind === 'none') return [];
    const angleDeg =
      typeof g.angleDeg === 'number' ? normalizeAngle(g.angleDeg) : 0;
    const size =
      typeof g.size === 'number' && Number.isFinite(g.size)
        ? clamp(Math.round(g.size), MIN_GLYPH_SIZE, MAX_GLYPH_SIZE)
        : 16;
    const radius =
      typeof g.radius === 'number' && Number.isFinite(g.radius)
        ? clamp(Math.round(g.radius), 0, maxGlyphDistance(spec, size))
        : Math.min(130, maxGlyphDistance(spec, size));
    return [{ id: uid('glyph'), spec, angleDeg, radius, size }];
  });
}
const CONTROL =
  'rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet';
const GOLD_BUTTON =
  'rounded-md border border-ananael-gold/50 bg-ananael-gold/10 px-3 py-2 text-sm font-medium text-ananael-gold transition hover:bg-ananael-gold/20';
const VIOLET_BUTTON =
  'rounded-md border border-ananael-violet/50 bg-ananael-violet/10 px-3 py-2 text-sm font-medium text-zinc-100 transition hover:bg-ananael-violet/20';

export default function TalismanModule({
  embedded = false,
  onNavigate,
  initialName = '',
}: Props) {
  const { isAuthenticated } = useAuth();
  const svgRef = useRef<SVGSVGElement>(null);
  const [tab, setTab] = useState<Tab>('sigils');
  const [planet, setPlanet] = useState<KameaPlanet>('Saturn');
  const [sigilMode, setSigilMode] = useState<SigilMode>('planetary');
  const [name, setName] = useState(initialName);
  const [showNumbers, setShowNumbers] = useState(true);
  const [rings, setRings] = useState<SigilRing[]>([]);
  const [glyphs, setGlyphs] = useState<SigilGlyph[]>([]);
  const [sutraId, setSutraId] = useState(DEFAULT_SUTRA_ID);
  const [sealText, setSealText] = useState(
    () => getSutraPreset(DEFAULT_SUTRA_ID)?.sealDefault ?? '護符'
  );
  const [showBonji, setShowBonji] = useState(true);
  const [bonjiIast, setBonjiIast] = useState(
    () => getSutraPreset(DEFAULT_SUTRA_ID)?.bonjiIast ?? ''
  );
  const [designName, setDesignName] = useState(
    initialName ? `${initialName} talisman` : 'Untitled talisman'
  );
  const [notes, setNotes] = useState('');
  const [savedId, setSavedId] = useState<string | null>(null);
  const [designs, setDesigns] = useState<SavedDesign[]>([]);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [hideGridOnExport, setHideGridOnExport] = useState(false);
  const [exportTransparentBg, setExportTransparentBg] = useState(false);
  const [sigilColor, setSigilColor] = useState(DEFAULT_SIGIL_COLOR);
  const [ringColor, setRingColor] = useState(DEFAULT_RING_COLOR);
  const [glyphColor, setGlyphColor] = useState(DEFAULT_GLYPH_COLOR);
  const [bgColor, setBgColor] = useState(DEFAULT_BG_COLOR);

  const sutraPreset = useMemo(
    () => getSutraPreset(sutraId) ?? SUTRA_PRESETS[0]!,
    [sutraId]
  );

  useEffect(() => {
    if (!initialName) return;
    setName(initialName);
  }, [initialName]);

  const handleSutraChange = (id: string) => {
    setSutraId(id);
    const preset = getSutraPreset(id);
    if (preset) {
      setSealText(preset.sealDefault);
      setBonjiIast(preset.bonjiIast ?? '');
    }
  };

  const grid = useMemo(() => getKamea(planet), [planet]);
  const points = useMemo(() => {
    if (tab !== 'sigils') return [];
    return sigilMode === 'planetary'
      ? kameaSigilPath(planet, name, SIZE)
      : chaosSigilPoints(name, SIZE, SIZE);
  }, [tab, sigilMode, planet, name]);

  const bonjiDevanagari = useMemo(() => {
    if (!showBonji || !bonjiIast.trim()) return '';
    return transliterate(bonjiIast.trim(), 'latin', 'sanskrit').output;
  }, [showBonji, bonjiIast]);

  const ofudaLayout = useMemo(
    (): OfudaLayout =>
      layoutOfuda({
        titleJp: sutraPreset.titleJp,
        purposeLabel: SUTRA_PURPOSE_LABELS[sutraPreset.purpose],
        columns: sutraPreset.columns,
        bonjiDevanagari: showBonji ? bonjiDevanagari : undefined,
        sealText,
        dedication: name,
      }),
    [sutraPreset, showBonji, bonjiDevanagari, sealText, name]
  );

  const [savedGlyphs, setSavedGlyphs] = useState<SavedGlyphOption[]>([]);

  const loadSavedGlyphs = useCallback(async () => {
    if (!isAuthenticated) {
      setSavedGlyphs([]);
      return;
    }
    try {
      const res = await apiFetch('/api/solomonic/circles');
      const data = (await res.json()) as {
        circles?: { _id: string; name: string; config?: Record<string, unknown> }[];
      };
      if (!res.ok) return;
      setSavedGlyphs(
        (data.circles ?? []).flatMap((c) => {
          const spec = sanitizeGlyphSpec(c.config?.centerGlyph);
          if (spec.kind === 'none') return [];
          return [{ id: c._id, name: c.name, spec }];
        })
      );
    } catch {
      // Saved-glyph family is simply unavailable when circles can't load.
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void loadSavedGlyphs();
  }, [loadSavedGlyphs]);

  /** Family shown for a glyph; falls back to spec when Saved is unavailable. */
  const glyphFamily = (g: SigilGlyph): string => {
    if (g.family === SAVED_FAMILY && savedGlyphs.length === 0) {
      return familyFromSpec(g.spec);
    }
    return g.family ?? familyFromSpec(g.spec);
  };

  const changeGlyphFamily = (g: SigilGlyph, family: string) => {
    if (family === SAVED_FAMILY) {
      // Keep the current drawing until a saved glyph is chosen.
      updateGlyph(g.id, { family, savedRef: '' });
      return;
    }
    if (family === SCRIPT_FAMILY) {
      updateGlyph(g.id, {
        family,
        savedRef: '',
        spec:
          g.spec.kind === 'script'
            ? g.spec
            : glyphSpec('script', 'A', g.spec.rotationDeg),
      });
      return;
    }
    const group = GEOMETRIC_GLYPH_GROUPS.find((gr) => gr.label === family);
    const kind = group?.kinds.includes(g.spec.kind)
      ? g.spec.kind
      : group?.kinds[0] ?? 'pentagram';
    updateGlyph(g.id, {
      family,
      savedRef: '',
      spec: glyphSpec(
        kind,
        g.spec.kind === 'script' ? '' : g.spec.letters,
        g.spec.rotationDeg
      ),
    });
  };

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

  const kind: SavedDesign['kind'] = tab === 'sigils' ? 'sigil' : 'sutra';

  const config = () => {
    if (kind === 'sigil') {
      return {
        planet,
        mode: sigilMode,
        name,
        sigilColor,
        ringColor,
        glyphColor,
        bgColor,
        showNumbers,
        rings: rings.map(({ radius, opacity }) => ({ radius, opacity })),
        glyphs: glyphs.map(({ spec, angleDeg, radius, size }) => ({
          spec,
          angleDeg,
          radius,
          size,
        })),
      };
    }
    return {
      sutraId,
      sealText,
      showBonji,
      bonjiIast,
      dedication: name,
    };
  };

  const addRing = () => {
    setRings((prev) => {
      if (prev.length >= MAX_RINGS) return prev;
      const innermost = prev.length
        ? Math.min(...prev.map((r) => r.radius))
        : MAX_RING_RADIUS + 14;
      const radius = clamp(innermost - 14, MIN_RING_RADIUS, MAX_RING_RADIUS);
      return [
        ...prev,
        { id: uid('ring'), radius, opacity: DEFAULT_RING_OPACITY },
      ];
    });
  };

  const updateRing = (id: string, patch: Partial<Omit<SigilRing, 'id'>>) => {
    setRings((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
    );
  };

  const removeRing = (id: string) => {
    setRings((prev) => prev.filter((r) => r.id !== id));
  };

  const addGlyph = () => {
    setGlyphs((prev) => {
      if (prev.length >= MAX_GLYPHS) return prev;
      return [
        ...prev,
        {
          id: uid('glyph'),
          spec: glyphSpec('pentagram'),
          angleDeg: (prev.length * 30) % 360,
          radius: Math.min(130, maxGlyphDistance(glyphSpec('pentagram'), 16)),
          size: 16,
        },
      ];
    });
  };

  const updateGlyph = (id: string, patch: Partial<Omit<SigilGlyph, 'id'>>) => {
    setGlyphs((prev) =>
      prev.map((g) => {
        if (g.id !== id) return g;
        const next = { ...g, ...patch };
        return {
          ...next,
          radius: clamp(next.radius, 0, maxGlyphDistance(next.spec, next.size)),
        };
      })
    );
  };

  const removeGlyph = (id: string) => {
    setGlyphs((prev) => prev.filter((g) => g.id !== id));
  };

  const exportJson = () => {
    downloadJson(
      {
        name: designName.trim() || 'Untitled talisman',
        kind,
        config: config(),
        notes: notes.trim() || undefined,
        exportedAt: new Date().toISOString(),
      },
      designName.trim() || 'Untitled talisman',
      'talisman'
    );
  };

  const prepareExportClone = (clone: SVGSVGElement) => {
    if (hideGridOnExport) {
      clone.querySelectorAll('[data-talisman-grid]').forEach((el) => {
        el.remove();
      });
    }
    if (exportTransparentBg) {
      clone.querySelector('[data-talisman-bg]')?.remove();
      clone.querySelectorAll('[data-talisman-start]').forEach((el) => {
        el.setAttribute('fill', 'none');
      });
    }
  };

  const exportPng = () => {
    const svg = svgRef.current;
    if (!svg) return;
    const isOfuda = tab === 'sutras';
    void (async () => {
      if (isOfuda && document.fonts?.ready) {
        await document.fonts.ready;
      }
      await exportSvgAsPng({
        svg,
        filenameBase: designName || 'talisman',
        fallbackName: 'talisman',
        width: isOfuda ? 900 : 1200,
        height: isOfuda ? 1950 : 1200,
        background: exportTransparentBg
          ? null
          : isOfuda
            ? '#0c0a12'
            : bgColor,
        prepareClone: prepareExportClone,
      });
    })().catch(() => {
      setStatus('PNG export failed.');
    });
  };

  const exportSvgFile = () => {
    const svg = svgRef.current;
    if (!svg) return;
    void exportSvg({
      svg,
      filenameBase: designName || 'talisman',
      fallbackName: 'talisman',
      prepareClone: prepareExportClone,
    }).catch(() => {
      setStatus('SVG export failed.');
    });
  };

  const showGridInPreview = tab === 'sigils' && sigilMode === 'planetary';

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
    setSigilColor(readColor(cfg.sigilColor, DEFAULT_SIGIL_COLOR));
    setRingColor(readColor(cfg.ringColor, DEFAULT_RING_COLOR));
    setGlyphColor(readColor(cfg.glyphColor, DEFAULT_GLYPH_COLOR));
    setBgColor(readColor(cfg.bgColor, DEFAULT_BG_COLOR));
    if (design.kind === 'kamea') {
      // Legacy Squares-tab design: open in the merged sigil editor.
      setTab('sigils');
      setSigilMode('planetary');
      setName(typeof cfg.overlayName === 'string' ? cfg.overlayName : '');
      setShowNumbers(true);
      setRings([]);
      setGlyphs([]);
    } else if (design.kind === 'sigil') {
      setTab('sigils');
      setName(typeof cfg.name === 'string' ? cfg.name : '');
      setSigilMode(cfg.mode === 'chaos' ? 'chaos' : 'planetary');
      setShowNumbers(
        typeof cfg.showNumbers === 'boolean' ? cfg.showNumbers : true
      );
      setRings(sanitizeRings(cfg.rings));
      setGlyphs(sanitizeGlyphPlacements(cfg.glyphs));
    } else {
      setTab('sutras');
      if (typeof cfg.sutraId === 'string' && getSutraPreset(cfg.sutraId)) {
        setSutraId(cfg.sutraId);
      }
      setSealText(
        typeof cfg.sealText === 'string'
          ? cfg.sealText
          : getSutraPreset(
              typeof cfg.sutraId === 'string' ? cfg.sutraId : DEFAULT_SUTRA_ID
            )?.sealDefault ?? '護符'
      );
      setShowBonji(typeof cfg.showBonji === 'boolean' ? cfg.showBonji : true);
      setBonjiIast(typeof cfg.bonjiIast === 'string' ? cfg.bonjiIast : '');
      setName(
        typeof cfg.dedication === 'string'
          ? cfg.dedication
          : typeof cfg.name === 'string'
            ? cfg.name
            : ''
      );
    }
    setSavedId(design._id);
    setDesignName(design.name);
    setNotes(design.notes ?? '');
    setStatus(null);
  };

  const deleteDesign = async (design: SavedDesign) => {
    if (
      !window.confirm(`Delete "${design.name}"? This cannot be undone.`)
    ) {
      return;
    }
    try {
      const res = await apiFetch(`/api/talisman/designs/${design._id}`, {
        method: 'DELETE',
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) throw new Error(data.message || 'Delete failed');
      if (savedId === design._id) setSavedId(null);
      setStatus('Design deleted.');
      await loadHistory();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      {!embedded && (
        <header>
          <h1 className="font-display text-2xl text-ananael-gold sm:text-3xl">Talismans</h1>
          <p className="mt-2 max-w-2xl text-sm text-ananael-muted">
            Build planetary magic squares, trace personal sigils, and craft sutra
            ofuda talismans. Export your work as PNG, SVG, or JSON, or sign in to keep
            it in your profile.
          </p>
        </header>
      )}

      <div className="flex gap-1 rounded-lg border border-ananael-border/60 bg-ananael-surface p-1">
        {([
          ['sigils', 'Sigils'],
          ['sutras', 'Sutras'],
        ] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={[
              'min-h-10 flex-1 rounded-md px-3 py-1.5 text-sm transition',
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
            {tab === 'sutras' && (
              <>
                <Field label="Sutra">
                  <select
                    value={sutraId}
                    onChange={(e) => handleSutraChange(e.target.value)}
                    className={CONTROL}
                  >
                    {SUTRA_PRESETS.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.title} — {SUTRA_PURPOSE_LABELS[preset.purpose]}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Seal (kanji)">
                  <input
                    value={sealText}
                    onChange={(e) => setSealText(e.target.value)}
                    maxLength={6}
                    className={`${CONTROL} w-28`}
                  />
                </Field>
                <label className="flex items-center gap-2 pb-2 text-sm text-zinc-300">
                  <input
                    type="checkbox"
                    checked={showBonji}
                    onChange={(e) => setShowBonji(e.target.checked)}
                    className="accent-ananael-violet"
                  />
                  Sanskrit / bonji column
                </label>
                {showBonji && (
                  <Field label="Bonji (IAST)">
                    <input
                      value={bonjiIast}
                      onChange={(e) => setBonjiIast(e.target.value)}
                      maxLength={120}
                      className={`${CONTROL} w-full min-w-0 sm:min-w-[220px]`}
                    />
                  </Field>
                )}
              </>
            )}
            {tab === 'sigils' && sigilMode === 'planetary' && (
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
            <label className="min-w-0 flex-1 text-sm text-ananael-muted sm:min-w-[220px]">
              {tab === 'sutras' ? 'Dedication or intent' : 'Name or intent'}
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={120}
                className="mt-1 w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet"
              />
            </label>
            {tab === 'sigils' && sigilMode === 'planetary' && (
              <label className="flex items-center gap-2 pb-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={showNumbers}
                  onChange={(e) => setShowNumbers(e.target.checked)}
                  className="accent-ananael-violet"
                />
                Show numbers
              </label>
            )}
            {tab !== 'sutras' && (
              <>
                <ColorField
                  label="Sigil color"
                  value={sigilColor}
                  onChange={setSigilColor}
                />
                <ColorField
                  label="Background"
                  value={bgColor}
                  onChange={setBgColor}
                />
              </>
            )}
          </div>

          {tab === 'sutras' && showBonji && onNavigate && (
            <button
              type="button"
              onClick={() =>
                onNavigate('translator', {
                  translatorPrefill: bonjiIast,
                  translatorTarget: 'sanskrit',
                })
              }
              className="rounded-md border border-ananael-violet/50 bg-ananael-violet/10 px-3 py-1.5 text-xs font-medium text-zinc-100 transition hover:bg-ananael-violet/20"
            >
              Open in Script Translator
            </button>
          )}

          <div className="rounded-xl border border-ananael-border/50 bg-ananael-surface p-3 sm:p-6">
            {tab === 'sutras' ? (
              <OfudaPreview ref={svgRef} layout={ofudaLayout} />
            ) : (
              <Preview
                ref={svgRef}
                grid={grid}
                points={points}
                showNumbers={showNumbers}
                showGrid={showGridInPreview}
                sigilColor={sigilColor}
                ringColor={ringColor}
                glyphColor={glyphColor}
                bgColor={bgColor}
                rings={rings}
                glyphs={glyphs}
              />
            )}
          </div>

          {tab === 'sigils' && (
            <div className="grid gap-4 xl:grid-cols-2">
              <section className="space-y-3 rounded-xl border border-ananael-border/50 bg-ananael-surface p-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <p className="pb-2 text-xs uppercase tracking-wider text-ananael-muted">
                    Rings
                  </p>
                  <span className="flex flex-wrap items-end gap-3">
                    <ColorField
                      label="Ring color"
                      value={ringColor}
                      onChange={setRingColor}
                    />
                    <button
                      type="button"
                      onClick={addRing}
                      disabled={rings.length >= MAX_RINGS}
                      className={`${GOLD_BUTTON} mb-1.5 px-2 py-1 text-xs disabled:opacity-50`}
                    >
                      Add ring
                    </button>
                  </span>
                </div>
                {rings.length === 0 ? (
                  <p className="text-xs text-ananael-muted">
                    Add concentric circles around the sigil; the sigil scales
                    to fit inside the innermost ring.
                  </p>
                ) : (
                  rings.map((ringItem, i) => (
                    <div
                      key={ringItem.id}
                      className="space-y-2 rounded-lg border border-ananael-border/60 bg-ananael-panel px-3 py-2 text-xs text-zinc-300"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-ananael-muted">#{i + 1}</span>
                        <button
                          type="button"
                          onClick={() => removeRing(ringItem.id)}
                          className="rounded-md border border-ananael-border px-2 py-1 text-xs text-zinc-400 hover:text-red-300"
                        >
                          Remove
                        </button>
                      </div>
                      <label className="flex items-center gap-2">
                        <span className="w-14 shrink-0">Radius</span>
                        <input
                          type="range"
                          min={MIN_RING_RADIUS}
                          max={MAX_RING_RADIUS}
                          value={ringItem.radius}
                          onChange={(e) =>
                            updateRing(ringItem.id, {
                              radius: Number(e.target.value),
                            })
                          }
                          className="min-w-0 flex-1 accent-ananael-gold"
                        />
                        <span className="w-8 shrink-0 text-right">
                          {ringItem.radius}
                        </span>
                      </label>
                      <label className="flex items-center gap-2">
                        <span className="w-14 shrink-0">Opacity</span>
                        <input
                          type="range"
                          min={0.1}
                          max={1}
                          step={0.05}
                          value={ringItem.opacity}
                          onChange={(e) =>
                            updateRing(ringItem.id, {
                              opacity: Number(e.target.value),
                            })
                          }
                          className="min-w-0 flex-1 accent-ananael-gold"
                        />
                        <span className="w-8 shrink-0 text-right">
                          {Math.round(ringItem.opacity * 100)}%
                        </span>
                      </label>
                    </div>
                  ))
                )}
              </section>
              <section className="space-y-3 rounded-xl border border-ananael-border/50 bg-ananael-surface p-4">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <p className="pb-2 text-xs uppercase tracking-wider text-ananael-muted">
                    Glyphs
                  </p>
                  <span className="flex flex-wrap items-end gap-3">
                    <ColorField
                      label="Glyph color"
                      value={glyphColor}
                      onChange={setGlyphColor}
                    />
                    <button
                      type="button"
                      onClick={addGlyph}
                      disabled={glyphs.length >= MAX_GLYPHS}
                      className={`${GOLD_BUTTON} mb-1.5 px-2 py-1 text-xs disabled:opacity-50`}
                    >
                      Add glyph
                    </button>
                  </span>
                </div>
                {glyphs.length === 0 ? (
                  <p className="text-xs text-ananael-muted">
                    Place stars, polygons, alchemical marks, script
                    characters, or center glyphs from your saved circles at
                    any degree or clock position.
                  </p>
                ) : (
                  glyphs.map((g) => {
                    const family = glyphFamily(g);
                    return (
                    <div
                      key={g.id}
                      className="space-y-2 rounded-lg border border-ananael-border/60 bg-ananael-panel px-3 py-2 text-xs text-zinc-300"
                    >
                      <div className="flex items-center gap-2">
                        <select
                          value={family}
                          onChange={(e) =>
                            changeGlyphFamily(g, e.target.value)
                          }
                          aria-label="Glyph family"
                          className={`${CONTROL} flex-1 py-1.5`}
                        >
                          {GEOMETRIC_GLYPH_GROUPS.map((group) => (
                            <option key={group.label} value={group.label}>
                              {group.label}
                            </option>
                          ))}
                          <option value={SCRIPT_FAMILY}>{SCRIPT_FAMILY}</option>
                          {savedGlyphs.length > 0 && (
                            <option value={SAVED_FAMILY}>{SAVED_FAMILY}</option>
                          )}
                        </select>
                        <button
                          type="button"
                          onClick={() => removeGlyph(g.id)}
                          className="rounded-md border border-ananael-border px-2 py-1 text-xs text-zinc-400 hover:text-red-300"
                        >
                          Remove
                        </button>
                      </div>
                      {family === SCRIPT_FAMILY ? (
                        <select
                          value={
                            SCRIPT_CHARS.has(g.spec.letters)
                              ? g.spec.letters
                              : ''
                          }
                          onChange={(e) => {
                            if (!e.target.value) return;
                            updateGlyph(g.id, {
                              spec: glyphSpec(
                                'script',
                                e.target.value,
                                g.spec.rotationDeg
                              ),
                            });
                          }}
                          aria-label="Script character"
                          className={`${CONTROL} w-full py-1.5`}
                        >
                          <option value="">Custom…</option>
                          {SCRIPT_CHAR_GROUPS.map((group) => (
                            <optgroup key={group.label} label={group.label}>
                              {group.options.map((o) => (
                                <option key={o.char} value={o.char}>
                                  {o.label}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                      ) : family === SAVED_FAMILY ? (
                        <select
                          value={g.savedRef ?? ''}
                          onChange={(e) => {
                            const picked = savedGlyphs.find(
                              (s) => s.id === e.target.value
                            );
                            if (!picked) return;
                            updateGlyph(g.id, {
                              savedRef: picked.id,
                              spec: { ...picked.spec },
                            });
                          }}
                          aria-label="Saved glyph"
                          className={`${CONTROL} w-full py-1.5`}
                        >
                          <option value="">Choose a saved glyph…</option>
                          {savedGlyphs.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} — {CENTER_GLYPH_LABELS[s.spec.kind]}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <select
                          value={g.spec.kind}
                          onChange={(e) =>
                            updateGlyph(g.id, {
                              spec: glyphSpec(
                                e.target.value as CenterGlyph,
                                g.spec.letters,
                                g.spec.rotationDeg
                              ),
                            })
                          }
                          aria-label="Glyph kind"
                          className={`${CONTROL} w-full py-1.5`}
                        >
                          {(
                            GEOMETRIC_GLYPH_GROUPS.find(
                              (group) => group.label === family
                            )?.kinds ?? []
                          ).map((k) => (
                            <option key={k} value={k}>
                              {CENTER_GLYPH_LABELS[k]}
                            </option>
                          ))}
                        </select>
                      )}
                      <div className="flex flex-wrap items-center gap-3">
                        <label className="flex items-center gap-2">
                          Clock
                          <select
                            value={
                              g.angleDeg % 30 === 0 ? String(g.angleDeg) : ''
                            }
                            onChange={(e) => {
                              if (e.target.value === '') return;
                              updateGlyph(g.id, {
                                angleDeg: Number(e.target.value),
                              });
                            }}
                            aria-label="Clock position"
                            className={`${CONTROL} py-1.5`}
                          >
                            <option value="">Custom</option>
                            {CLOCK_POSITIONS.map((c) => (
                              <option key={c.angle} value={c.angle}>
                                {c.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="flex items-center gap-2">
                          Degrees
                          <input
                            type="number"
                            min={0}
                            max={359}
                            value={g.angleDeg}
                            onChange={(e) =>
                              updateGlyph(g.id, {
                                angleDeg: normalizeAngle(
                                  Number(e.target.value)
                                ),
                              })
                            }
                            aria-label="Angle in degrees"
                            className={`${CONTROL} w-20 py-1.5`}
                          />
                        </label>
                        <label className="flex items-center gap-2">
                          Rotation
                          <input
                            type="number"
                            min={0}
                            max={359}
                            value={g.spec.rotationDeg}
                            onChange={(e) =>
                              updateGlyph(g.id, {
                                spec: glyphSpec(
                                  g.spec.kind,
                                  g.spec.letters,
                                  normalizeAngle(Number(e.target.value))
                                ),
                              })
                            }
                            aria-label="Glyph rotation"
                            className={`${CONTROL} w-20 py-1.5`}
                          />
                        </label>
                      </div>
                      <label className="flex items-center gap-2">
                        <span className="w-14 shrink-0">Distance</span>
                        <input
                          type="range"
                          min={0}
                          max={maxGlyphDistance(g.spec, g.size)}
                          value={g.radius}
                          onChange={(e) =>
                            updateGlyph(g.id, {
                              radius: Number(e.target.value),
                            })
                          }
                          className="min-w-0 flex-1 accent-ananael-gold"
                        />
                        <span className="w-8 shrink-0 text-right">{g.radius}</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <span className="w-14 shrink-0">Size</span>
                        <input
                          type="range"
                          min={MIN_GLYPH_SIZE}
                          max={MAX_GLYPH_SIZE}
                          value={g.size}
                          onChange={(e) =>
                            updateGlyph(g.id, {
                              size: Number(e.target.value),
                            })
                          }
                          className="min-w-0 flex-1 accent-ananael-gold"
                        />
                        <span className="w-8 shrink-0 text-right">{g.size}</span>
                      </label>
                      {g.spec.kind === 'script' && (
                        <label className="flex items-center gap-2">
                          Characters
                          <input
                            value={g.spec.letters}
                            onChange={(e) =>
                              updateGlyph(g.id, {
                                spec: glyphSpec(
                                  'script',
                                  e.target.value,
                                  g.spec.rotationDeg
                                ),
                              })
                            }
                            maxLength={8}
                            className={`${CONTROL} min-w-0 flex-1 py-1.5 sm:w-36 sm:flex-none`}
                          />
                        </label>
                      )}
                      {glyphHasVertexLetters(g.spec.kind) && (
                        <label className="flex items-center gap-2">
                          Vertex letters
                          <input
                            value={g.spec.letters}
                            onChange={(e) =>
                              updateGlyph(g.id, {
                                spec: glyphSpec(
                                  g.spec.kind,
                                  e.target.value,
                                  g.spec.rotationDeg
                                ),
                              })
                            }
                            maxLength={16}
                            className={`${CONTROL} min-w-0 flex-1 py-1.5 sm:w-36 sm:flex-none`}
                          />
                        </label>
                      )}
                    </div>
                    );
                  })
                )}
              </section>
            </div>
          )}

          <p className="text-xs leading-relaxed text-ananael-muted">
            {tab === 'sutras'
              ? `${sutraPreset.notes} Historical Shingon bonji used Siddham script; Devanagari here aligns with Script Translator for study.`
              : sigilMode === 'planetary'
                ? `${planet}'s ${grid.length}×${grid.length} square uses 1–${grid.length ** 2}; letters repeat on the Agrippan 1–9 key and join their kamea cell centers. Classical metal: ${metalForPlanet(planet)}.`
                : 'Vowels and repeated consonants are removed before the remaining letters trace the consonant wheel.'}
          </p>
        </section>

        <aside className="space-y-4">
          <Panel title="Export">
            {showGridInPreview && (
              <label className="mb-1 flex w-full items-center gap-2 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={hideGridOnExport}
                  onChange={(e) => setHideGridOnExport(e.target.checked)}
                  className="accent-ananael-violet"
                />
                Hide kamea grid on export
              </label>
            )}
            <label className="mb-1 flex w-full items-center gap-2 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={exportTransparentBg}
                onChange={(e) => setExportTransparentBg(e.target.checked)}
                className="accent-ananael-violet"
              />
              Transparent background
            </label>
            <button type="button" onClick={exportPng} className={GOLD_BUTTON}>
              Export PNG
            </button>
            <button type="button" onClick={exportSvgFile} className={GOLD_BUTTON}>
              Export SVG
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
                <div
                  key={design._id}
                  className="flex flex-col rounded-lg border border-ananael-border/60 bg-ananael-panel p-3 hover:border-ananael-violet/50"
                >
                  <button
                    type="button"
                    onClick={() => load(design)}
                    className="block w-full text-left"
                  >
                    <div className="rounded-md border border-ananael-border/40 bg-ananael-bg p-2">
                      <DesignThumbnail design={design} />
                    </div>
                    <span className="mt-2 block font-display text-sm text-ananael-gold">
                      {design.name}
                    </span>
                    <span className="mt-1 block text-xs capitalize text-ananael-muted">
                      {design.kind} · {new Date(design.date).toLocaleString()}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteDesign(design)}
                    className="mt-2 self-start rounded-md border border-red-900/60 px-2 py-1 text-xs text-red-300 transition hover:bg-red-900/20"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

const OfudaPreview = forwardRef<
  SVGSVGElement,
  { layout: OfudaLayout; className?: string }
>(
  function OfudaPreview(
    { layout, className = 'mx-auto w-full max-w-[280px]' },
    ref
  ) {
    const sealChars = layout.seal ? [...layout.seal.text] : [];
    const sealFontSize = layout.seal
      ? Math.min(14, (layout.seal.size - 8) / Math.max(sealChars.length, 1))
      : 12;

    return (
      <svg
        ref={ref}
        viewBox={`0 0 ${OFUDA_WIDTH} ${OFUDA_HEIGHT}`}
        className={className}
        style={{ aspectRatio: `${OFUDA_WIDTH} / ${OFUDA_HEIGHT}` }}
        role="img"
        aria-label="Sutra ofuda preview"
      >
        <rect
          data-talisman-bg
          width={OFUDA_WIDTH}
          height={OFUDA_HEIGHT}
          fill="#0c0a12"
        />
        <rect
          x={4}
          y={4}
          width={OFUDA_WIDTH - 8}
          height={OFUDA_HEIGHT - 8}
          fill="none"
          stroke="#b91c1c"
          strokeWidth={2}
        />
        <rect
          x={8}
          y={8}
          width={OFUDA_WIDTH - 16}
          height={OFUDA_HEIGHT - 16}
          fill="none"
          stroke="#b91c1c"
          strokeWidth={0.8}
        />
        <rect
          x={12}
          y={12}
          width={OFUDA_WIDTH - 24}
          height={OFUDA_HEIGHT - 24}
          fill="none"
          stroke="#5b4a8a"
          strokeWidth={0.6}
        />
        <text
          x={OFUDA_WIDTH / 2}
          y={28}
          textAnchor="middle"
          fill="#c9a227"
          fontFamily={OFUDA_FONT_JP}
          fontSize={16}
        >
          {layout.titleJp}
        </text>
        <text
          x={OFUDA_WIDTH / 2}
          y={44}
          textAnchor="middle"
          fill="#8b7aa8"
          fontFamily={OFUDA_FONT_LATIN}
          fontSize={9}
          letterSpacing={1}
        >
          {layout.purposeLabel.toUpperCase()}
        </text>
        {layout.glyphs.map((glyph, i) => (
          <text
            key={`${glyph.x}-${glyph.y}-${glyph.char}-${i}`}
            x={glyph.x}
            y={glyph.y}
            textAnchor="middle"
            dominantBaseline="hanging"
            fill={glyph.fill}
            fontFamily={glyph.fontFamily}
            fontSize={glyph.fontSize}
          >
            {glyph.char}
          </text>
        ))}
        {layout.seal && (
          <g>
            <rect
              x={layout.seal.x}
              y={layout.seal.y}
              width={layout.seal.size}
              height={layout.seal.size}
              fill="none"
              stroke="#b91c1c"
              strokeWidth={1.5}
            />
            {sealChars.map((ch, i) => (
              <text
                key={`seal-${i}`}
                x={layout.seal!.x + layout.seal!.size / 2}
                y={
                  layout.seal!.y +
                  (layout.seal!.size - sealChars.length * sealFontSize) / 2 +
                  i * sealFontSize +
                  sealFontSize * 0.85
                }
                textAnchor="middle"
                fill="#dc2626"
                fontFamily={OFUDA_FONT_JP}
                fontSize={sealFontSize}
              >
                {ch}
              </text>
            ))}
          </g>
        )}
        {layout.dedication && (
          <text
            x={OFUDA_WIDTH / 2}
            y={OFUDA_HEIGHT - 12}
            textAnchor="middle"
            fill="#6b7280"
            fontFamily={OFUDA_FONT_LATIN}
            fontSize={8}
            fontStyle="italic"
          >
            {layout.dedication.length > 48
              ? `${layout.dedication.slice(0, 45)}…`
              : layout.dedication}
          </text>
        )}
      </svg>
    );
  }
);

interface SigilArtProps {
  grid: number[][];
  points: { x: number; y: number }[];
  showNumbers: boolean;
  showGrid: boolean;
  sigilColor: string;
  ringColor: string;
  glyphColor: string;
  bgColor: string;
  rings: SigilRing[];
  glyphs: SigilGlyph[];
}

/**
 * SVG body for a sigil design (grid, sigil path, rings, glyph placements).
 * Shared by the live editor preview and saved-design thumbnails.
 */
function SigilArt({
  grid,
  points,
  showNumbers,
  showGrid,
  sigilColor,
  ringColor,
  glyphColor,
  bgColor,
  rings,
  glyphs,
}: SigilArtProps) {
  const cell = SIZE / grid.length;
  const innerRadius = rings.length
    ? Math.min(...rings.map((r) => r.radius))
    : null;
  // Inscribe the square sigil content inside the innermost ring.
  const scale =
    innerRadius === null ? 1 : (innerRadius * Math.SQRT2 * 0.96) / SIZE;
  const offset = CENTER * (1 - scale);
  return (
    <>
      <g
        transform={
          scale === 1 ? undefined : `translate(${offset},${offset}) scale(${scale})`
        }
      >
        {showGrid &&
          grid.map((row, r) =>
            row.map((value, c) => (
              <g key={value} data-talisman-grid>
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
            cx={CENTER}
            cy={CENTER}
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
            stroke={sigilColor}
            strokeWidth={4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {points[0] && (
          <circle
            data-talisman-start
            cx={points[0].x}
            cy={points[0].y}
            r={6}
            fill={bgColor}
            stroke={sigilColor}
            strokeWidth={3}
          />
        )}
      </g>
      {rings.map((ringItem) => (
        <circle
          key={ringItem.id}
          data-talisman-ring
          cx={CENTER}
          cy={CENTER}
          r={ringItem.radius}
          fill="none"
          stroke={ringColor}
          strokeWidth={1.5}
          opacity={ringItem.opacity}
        />
      ))}
      {glyphs.map((g) => {
        const pos = polarToCartesian(CENTER, CENTER, g.radius, g.angleDeg);
        return (
          <CircleGlyph
            key={g.id}
            spec={g.spec}
            cx={pos.x}
            cy={pos.y}
            radius={g.size}
            stroke={glyphColor}
            strokeWidth={1.4}
            labelFontSize={Math.max(7, g.size * 0.45)}
            labelOutward={Math.max(7, g.size * 0.5)}
          />
        );
      })}
    </>
  );
}

const Preview = forwardRef<SVGSVGElement, SigilArtProps>(
  function Preview(props, ref) {
    return (
      <svg
        ref={ref}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="mx-auto aspect-square w-full max-w-[620px]"
        role="img"
        aria-label="Talisman preview"
      >
        <rect data-talisman-bg width={SIZE} height={SIZE} fill={props.bgColor} />
        <SigilArt {...props} />
      </svg>
    );
  }
);

/** Live SVG thumbnail for a saved design, derived from its stored config. */
function DesignThumbnail({ design }: { design: SavedDesign }) {
  const cfg = design.config ?? {};

  if (design.kind === 'sutra') {
    const sutraId =
      typeof cfg.sutraId === 'string' && getSutraPreset(cfg.sutraId)
        ? cfg.sutraId
        : DEFAULT_SUTRA_ID;
    const preset = getSutraPreset(sutraId) ?? SUTRA_PRESETS[0]!;
    const showBonji = typeof cfg.showBonji === 'boolean' ? cfg.showBonji : true;
    const bonjiIast = typeof cfg.bonjiIast === 'string' ? cfg.bonjiIast : '';
    const bonji =
      showBonji && bonjiIast.trim()
        ? transliterate(bonjiIast.trim(), 'latin', 'sanskrit').output
        : '';
    const layout = layoutOfuda({
      titleJp: preset.titleJp,
      purposeLabel: SUTRA_PURPOSE_LABELS[preset.purpose],
      columns: preset.columns,
      bonjiDevanagari: bonji || undefined,
      sealText:
        typeof cfg.sealText === 'string' ? cfg.sealText : preset.sealDefault,
      dedication: typeof cfg.dedication === 'string' ? cfg.dedication : '',
    });
    return <OfudaPreview layout={layout} className="mx-auto h-28 w-auto" />;
  }

  // Legacy kamea designs map through the same rules as load().
  const isKamea = design.kind === 'kamea';
  const planet =
    typeof cfg.planet === 'string' &&
    PLANET_ORDER.includes(cfg.planet as KameaPlanet)
      ? (cfg.planet as KameaPlanet)
      : 'Saturn';
  const mode: SigilMode =
    !isKamea && cfg.mode === 'chaos' ? 'chaos' : 'planetary';
  const name = isKamea
    ? typeof cfg.overlayName === 'string'
      ? cfg.overlayName
      : ''
    : typeof cfg.name === 'string'
      ? cfg.name
      : '';
  const sigilColor = readColor(cfg.sigilColor, DEFAULT_SIGIL_COLOR);
  const ringColor = readColor(cfg.ringColor, DEFAULT_RING_COLOR);
  const glyphColor = readColor(cfg.glyphColor, DEFAULT_GLYPH_COLOR);
  const bgColor = readColor(cfg.bgColor, DEFAULT_BG_COLOR);
  const showNumbers = isKamea
    ? true
    : typeof cfg.showNumbers === 'boolean'
      ? cfg.showNumbers
      : true;
  const rings = isKamea ? [] : sanitizeRings(cfg.rings);
  const glyphs = isKamea ? [] : sanitizeGlyphPlacements(cfg.glyphs);
  const grid = getKamea(planet);
  const points =
    mode === 'planetary'
      ? kameaSigilPath(planet, name, SIZE)
      : chaosSigilPoints(name, SIZE, SIZE);

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="mx-auto h-28 w-28"
      role="img"
      aria-label={`${design.name} preview`}
    >
      <rect width={SIZE} height={SIZE} fill={bgColor} />
      <SigilArt
        grid={grid}
        points={points}
        showNumbers={showNumbers}
        showGrid={mode === 'planetary'}
        sigilColor={sigilColor}
        ringColor={ringColor}
        glyphColor={glyphColor}
        bgColor={bgColor}
        rings={rings}
        glyphs={glyphs}
      />
    </svg>
  );
}

/** Native color input paired with a validated hex text field. */
function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => {
    setDraft(value);
  }, [value]);
  return (
    <Field label={label}>
      <span className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setDraft(e.target.value);
          }}
          aria-label={label}
          className="h-10 w-12 cursor-pointer rounded-md border border-ananael-border bg-ananael-bg p-0.5"
        />
        <input
          value={draft}
          onChange={(e) => {
            const next = e.target.value.trim();
            setDraft(next);
            if (HEX_COLOR.test(next)) onChange(next);
          }}
          onBlur={() => setDraft(value)}
          maxLength={7}
          spellCheck={false}
          aria-label={`${label} hex`}
          className={`${CONTROL} w-[7.5rem] font-mono`}
        />
      </span>
    </Field>
  );
}

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
