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
import { downloadJson, exportSvg, exportSvgAsPng } from '../lib/svgExport';
import { transliterate } from '../lib/transliterate';
import type { ModuleId } from './Sidebar';

type Tab = 'squares' | 'sigils' | 'sutras';
type SigilMode = 'planetary' | 'chaos';

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
const DEFAULT_SIGIL_COLOR = '#c9a227';
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const DEFAULT_SUTRA_ID = SUTRA_PRESETS[0]!.id;
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
  const [tab, setTab] = useState<Tab>('squares');
  const [planet, setPlanet] = useState<KameaPlanet>('Saturn');
  const [sigilMode, setSigilMode] = useState<SigilMode>('planetary');
  const [name, setName] = useState(initialName);
  const [overlay, setOverlay] = useState(Boolean(initialName));
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
  const [sigilColorDraft, setSigilColorDraft] = useState(DEFAULT_SIGIL_COLOR);

  const sutraPreset = useMemo(
    () => getSutraPreset(sutraId) ?? SUTRA_PRESETS[0]!,
    [sutraId]
  );

  useEffect(() => {
    if (!initialName) return;
    setName(initialName);
    setOverlay(true);
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
    if (tab === 'squares') {
      return overlay ? kameaSigilPath(planet, name, SIZE) : [];
    }
    if (tab === 'sigils') {
      return sigilMode === 'planetary'
        ? kameaSigilPath(planet, name, SIZE)
        : chaosSigilPoints(name, SIZE, SIZE);
    }
    return [];
  }, [tab, overlay, sigilMode, planet, name]);

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

  const kind: SavedDesign['kind'] =
    tab === 'squares' ? 'kamea' : tab === 'sigils' ? 'sigil' : 'sutra';

  const config = () => {
    if (kind === 'kamea') {
      return {
        planet,
        overlay,
        overlayName: overlay ? name : '',
        sigilColor,
      };
    }
    if (kind === 'sigil') {
      return { planet, mode: sigilMode, name, sigilColor };
    }
    return {
      sutraId,
      sealText,
      showBonji,
      bonjiIast,
      dedication: name,
    };
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
        background: exportTransparentBg ? null : '#0c0a12',
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

  const showGridInPreview = tab === 'squares' || sigilMode === 'planetary';

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
    if (
      typeof cfg.sigilColor === 'string' &&
      HEX_COLOR.test(cfg.sigilColor)
    ) {
      setSigilColor(cfg.sigilColor);
      setSigilColorDraft(cfg.sigilColor);
    } else {
      setSigilColor(DEFAULT_SIGIL_COLOR);
      setSigilColorDraft(DEFAULT_SIGIL_COLOR);
    }
    if (design.kind === 'kamea') {
      setTab('squares');
      const loadedName =
        typeof cfg.overlayName === 'string' ? cfg.overlayName : '';
      setName(loadedName);
      setOverlay(typeof cfg.overlay === 'boolean' ? cfg.overlay : Boolean(loadedName));
    } else if (design.kind === 'sigil') {
      setTab('sigils');
      setName(typeof cfg.name === 'string' ? cfg.name : '');
      setSigilMode(cfg.mode === 'chaos' ? 'chaos' : 'planetary');
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
          ['squares', 'Squares'],
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
            {(tab === 'squares' || sigilMode === 'planetary') && tab !== 'sutras' && (
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
            {tab !== 'sutras' && (
              <Field label="Sigil color">
                <span className="flex items-center gap-2">
                  <input
                    type="color"
                    value={sigilColor}
                    onChange={(e) => {
                      setSigilColor(e.target.value);
                      setSigilColorDraft(e.target.value);
                    }}
                    aria-label="Sigil color"
                    className="h-10 w-12 cursor-pointer rounded-md border border-ananael-border bg-ananael-bg p-0.5"
                  />
                  <input
                    value={sigilColorDraft}
                    onChange={(e) => {
                      const next = e.target.value.trim();
                      setSigilColorDraft(next);
                      if (HEX_COLOR.test(next)) setSigilColor(next);
                    }}
                    onBlur={() => setSigilColorDraft(sigilColor)}
                    maxLength={7}
                    spellCheck={false}
                    aria-label="Sigil color hex"
                    className={`${CONTROL} w-[7.5rem] font-mono`}
                  />
                </span>
              </Field>
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
                showNumbers={tab === 'squares'}
                showGrid={showGridInPreview}
                sigilColor={sigilColor}
              />
            )}
          </div>
          <p className="text-xs leading-relaxed text-ananael-muted">
            {tab === 'sutras'
              ? `${sutraPreset.notes} Historical Shingon bonji used Siddham script; Devanagari here aligns with Script Translator for study.`
              : tab === 'squares'
                ? `${planet}'s ${grid.length}×${grid.length} square uses 1–${grid.length ** 2}; every row, column, and diagonal has the same sum. Classical metal: ${metalForPlanet(planet)}.`
                : sigilMode === 'planetary'
                  ? `Letters repeat on the Agrippan 1–9 key and join their kamea cell centers. Classical metal: ${metalForPlanet(planet)}.`
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

const OfudaPreview = forwardRef<SVGSVGElement, { layout: OfudaLayout }>(
  function OfudaPreview({ layout }, ref) {
    const sealChars = layout.seal ? [...layout.seal.text] : [];
    const sealFontSize = layout.seal
      ? Math.min(14, (layout.seal.size - 8) / Math.max(sealChars.length, 1))
      : 12;

    return (
      <svg
        ref={ref}
        viewBox={`0 0 ${OFUDA_WIDTH} ${OFUDA_HEIGHT}`}
        className="mx-auto w-full max-w-[280px]"
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

const Preview = forwardRef<
  SVGSVGElement,
  {
    grid: number[][];
    points: { x: number; y: number }[];
    showNumbers: boolean;
    showGrid: boolean;
    sigilColor: string;
  }
>(function Preview({ grid, points, showNumbers, showGrid, sigilColor }, ref) {
  const cell = SIZE / grid.length;
  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="mx-auto aspect-square w-full max-w-[620px]"
      role="img"
      aria-label="Talisman preview"
    >
      <rect data-talisman-bg width={SIZE} height={SIZE} fill="#0c0a12" />
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
          fill="#0c0a12"
          stroke={sigilColor}
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
