import { useEffect, useRef } from 'react';
import {
  CARDINAL_DIRS,
  CARDINAL_DIR_LABELS,
  CENTER_GLYPH_GROUPS,
  CENTER_GLYPH_LABELS,
  WEEKDAY_LABELS,
  WEEKDAYS,
  glyphHasVertexLetters,
  glyphSupportsRotation,
  type CardinalDir,
  type CenterGlyph,
  type CircleConfig,
  type GlyphSpec,
  type Weekday,
} from '../data/solomonicCircles';

interface CircleLayoutModalProps {
  open: boolean;
  onClose: () => void;
  config: CircleConfig;
  onWeekdayChange: (weekday: Weekday) => void;
  patchCenterGlyph: (patch: Partial<GlyphSpec>) => void;
  patchCardinalGlyph: (dir: CardinalDir, patch: Partial<GlyphSpec>) => void;
}

function GlyphKindSelect({
  value,
  onChange,
  id,
  ariaLabel,
}: {
  value: CenterGlyph;
  onChange: (kind: CenterGlyph) => void;
  id?: string;
  ariaLabel?: string;
}) {
  return (
    <select
      id={id}
      value={value}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value as CenterGlyph)}
      className="rounded-md border border-ananael-border bg-ananael-bg px-2 py-1.5 text-sm text-zinc-200 outline-none focus:border-ananael-violet"
    >
      {CENTER_GLYPH_GROUPS.map((group) =>
        group.kinds.length === 1 && group.kinds[0] === 'none' ? (
          <option key="none" value="none">
            {CENTER_GLYPH_LABELS.none}
          </option>
        ) : (
          <optgroup key={group.label} label={group.label}>
            {group.kinds.map((g) => (
              <option key={g} value={g}>
                {CENTER_GLYPH_LABELS[g]}
              </option>
            ))}
          </optgroup>
        )
      )}
    </select>
  );
}

function RotationInput({
  value,
  onChange,
  ariaLabel,
}: {
  value: number;
  onChange: (deg: number) => void;
  ariaLabel?: string;
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-ananael-muted">
      Rotate
      <input
        type="number"
        min={0}
        max={359}
        step={1}
        value={Math.round(value)}
        aria-label={ariaLabel}
        onChange={(e) => {
          const n = Number(e.target.value);
          const deg = Number.isFinite(n) ? ((n % 360) + 360) % 360 : 0;
          onChange(deg);
        }}
        className="w-16 rounded-md border border-ananael-border bg-ananael-bg px-2 py-1.5 text-sm text-zinc-200 outline-none focus:border-ananael-violet"
      />
      °
    </label>
  );
}

/**
 * Modal for weekday and center/cardinal glyph controls.
 */
export default function CircleLayoutModal({
  open,
  onClose,
  config,
  onWeekdayChange,
  patchCenterGlyph,
  patchCardinalGlyph,
}: CircleLayoutModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    return () => {
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  const centerKind = config.centerGlyph.kind;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Close circle layout dialog"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="circle-layout-modal-title"
        tabIndex={-1}
        className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-ananael-border bg-ananael-panel p-5 shadow-lg outline-none"
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2
            id="circle-layout-modal-title"
            className="font-display text-lg text-ananael-gold"
          >
            Weekday & Glyphs
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-ananael-muted transition hover:text-zinc-200"
          >
            Close
          </button>
        </div>

        <div className="space-y-5">
          <label className="flex flex-col gap-1.5 text-xs text-ananael-muted">
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

          <section className="space-y-3 border-t border-ananael-border/40 pt-4">
            <h3 className="text-xs uppercase tracking-wider text-ananael-muted">
              Center glyph
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-ananael-muted">
                Kind
                <GlyphKindSelect
                  value={centerKind}
                  onChange={(kind) => patchCenterGlyph({ kind })}
                />
              </label>
              {glyphHasVertexLetters(centerKind) && (
                <label className="flex items-center gap-2 text-xs text-ananael-muted">
                  Letters
                  <input
                    type="text"
                    value={config.centerGlyph.letters}
                    onChange={(e) =>
                      patchCenterGlyph({
                        letters: e.target.value.slice(0, 16),
                      })
                    }
                    placeholder="YHVH"
                    maxLength={16}
                    className="w-24 rounded-md border border-ananael-border bg-ananael-bg px-2 py-1.5 text-sm text-zinc-200 outline-none focus:border-ananael-violet"
                  />
                </label>
              )}
              {glyphSupportsRotation(centerKind) && (
                <RotationInput
                  value={config.centerGlyph.rotationDeg}
                  onChange={(rotationDeg) =>
                    patchCenterGlyph({ rotationDeg })
                  }
                />
              )}
            </div>
          </section>

          <section className="space-y-3 border-t border-ananael-border/40 pt-4">
            <h3 className="text-xs uppercase tracking-wider text-ananael-muted">
              Cardinal glyphs
            </h3>
            <div className="space-y-3">
              {CARDINAL_DIRS.map((dir) => {
                const spec = config.cardinalGlyphs[dir];
                return (
                  <div
                    key={dir}
                    className="flex flex-wrap items-center gap-2 rounded-md border border-ananael-border/30 bg-ananael-bg/40 px-3 py-2"
                  >
                    <label className="flex items-center gap-2 text-xs text-ananael-muted">
                      {CARDINAL_DIR_LABELS[dir]}
                      <GlyphKindSelect
                        value={spec.kind}
                        onChange={(kind) =>
                          patchCardinalGlyph(dir, { kind })
                        }
                        ariaLabel={`Cardinal ${CARDINAL_DIR_LABELS[dir]} glyph`}
                      />
                    </label>
                    {glyphHasVertexLetters(spec.kind) && (
                      <label className="flex items-center gap-2 text-xs text-ananael-muted">
                        Letters
                        <input
                          type="text"
                          value={spec.letters}
                          onChange={(e) =>
                            patchCardinalGlyph(dir, {
                              letters: e.target.value.slice(0, 16),
                            })
                          }
                          placeholder="YHVH"
                          maxLength={16}
                          className="w-20 rounded-md border border-ananael-border bg-ananael-bg px-2 py-1.5 text-sm text-zinc-200 outline-none focus:border-ananael-violet"
                          aria-label={`${CARDINAL_DIR_LABELS[dir]} letters`}
                        />
                      </label>
                    )}
                    {glyphSupportsRotation(spec.kind) && (
                      <RotationInput
                        value={spec.rotationDeg}
                        onChange={(rotationDeg) =>
                          patchCardinalGlyph(dir, { rotationDeg })
                        }
                        ariaLabel={`${CARDINAL_DIR_LABELS[dir]} rotation`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
