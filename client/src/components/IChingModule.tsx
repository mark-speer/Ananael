import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getHexagram, type HexagramText } from '../data/iching';
import { apiFetch } from '../lib/api';
import { lineLabel } from '../lib/glyphs';
import {
  cast,
  isChanging,
  type CastMethod,
  type CastResult,
  type LineValue,
} from '../lib/iching';
import { buildJournalSky } from '../lib/journalSky';
import GlyphFrame from './glyphs/GlyphFrame';
import HexagramSvg from './glyphs/HexagramSvg';
import type { ModuleId } from './Sidebar';
import { getHexagramStructure } from '../data/ichingCorrespondences';
import { getMeridianForTrigram } from '../data/subtleBodyMaps';

const METHODS: { id: CastMethod; label: string; description: string }[] = [
  {
    id: 'coins',
    label: 'Three Coins',
    description: 'Classic three-coin probabilities',
  },
  {
    id: 'yarrow',
    label: 'Yarrow Stalks',
    description: 'Traditional yarrow probabilities',
  },
];

function HexagramPanel({
  title,
  hex,
  lines,
  changingLines,
}: {
  title: string;
  hex: HexagramText;
  lines?: LineValue[];
  changingLines?: number[];
}) {
  const structure = getHexagramStructure(hex.number);
  const lowerMeridians = structure
    ? getMeridianForTrigram(structure.lower.id)
    : [];
  const upperMeridians = structure
    ? getMeridianForTrigram(structure.upper.id)
    : [];
  const meridianNames = [
    ...new Set(
      [...lowerMeridians, ...upperMeridians].map((m) => m.name)
    ),
  ];

  return (
    <div className="rounded-xl border border-ananael-border/50 bg-ananael-surface p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-ananael-muted">
        {title}
      </p>
      <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-8">
        {lines && (
          <div className="shrink-0">
            <GlyphFrame>
              <HexagramSvg lines={lines} />
            </GlyphFrame>
          </div>
        )}
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h2 className="font-display text-xl text-ananael-gold">
              {hex.number}. {hex.name}
            </h2>
            <p className="mt-1 text-sm text-ananael-muted">{hex.chinese}</p>
          </div>
          {changingLines && changingLines.length > 0 && (
            <p className="text-xs text-ananael-gold">
              Changing lines:{' '}
              {changingLines.map((i) => i + 1).join(', ')} (bottom = 1)
            </p>
          )}
          <div>
            <p className="text-xs uppercase tracking-wider text-ananael-muted">
              Judgment
            </p>
            <p className="mt-1 text-sm leading-relaxed text-zinc-200">
              {hex.judgment}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-ananael-muted">
              Image
            </p>
            <p className="mt-1 text-sm leading-relaxed text-zinc-300">
              {hex.image}
            </p>
          </div>
          {structure && meridianNames.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wider text-ananael-muted">
                Subtle body (trigram bridge)
              </p>
              <p className="mt-1 text-sm text-zinc-300">
                {structure.lower.name} / {structure.upper.name} ↔{' '}
                {meridianNames.join(', ')} — comparative study map.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface IChingModuleProps {
  /** When true, hide the standalone page header (used inside Divination portal). */
  embedded?: boolean;
  onNavigate?: (module: ModuleId, opts?: { filter?: 'divination' }) => void;
}

/**
 * I Ching module: coin/yarrow cast, King Wen text, save to Magical Journal.
 */
export default function IChingModule({
  embedded = false,
  onNavigate,
}: IChingModuleProps) {
  const { isAuthenticated } = useAuth();
  const [method, setMethod] = useState<CastMethod>('coins');
  const [result, setResult] = useState<CastResult | null>(null);
  const [notes, setNotes] = useState('');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const doCast = () => {
    setSaveStatus(null);
    setResult(cast(method));
  };

  const saveCast = async () => {
    if (!isAuthenticated || !result) return;
    setSaving(true);
    setSaveStatus(null);
    try {
      const now = new Date();
      const sky = buildJournalSky(now);
      const primaryHex = getHexagram(result.primaryNumber);
      const entities = [
        {
          kind: 'hexagram' as const,
          id: String(result.primaryNumber),
          label: primaryHex
            ? `${result.primaryNumber}. ${primaryHex.name}`
            : `Hexagram ${result.primaryNumber}`,
        },
      ];
      if (result.relatingNumber != null) {
        const relHex = getHexagram(result.relatingNumber);
        entities.push({
          kind: 'hexagram',
          id: String(result.relatingNumber),
          label: relHex
            ? `${result.relatingNumber}. ${relHex.name}`
            : `Hexagram ${result.relatingNumber}`,
        });
      }

      const res = await apiFetch('/api/iching/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method: result.method,
          lines: result.lines,
          primaryNumber: result.primaryNumber,
          relatingNumber: result.relatingNumber,
          changingLines: result.changingLines,
          userNotes: notes,
          occurredAt: now.toISOString(),
          sky,
          entities,
        }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        throw new Error(data.message || 'Failed to save cast');
      }
      setSaveStatus('Saved to Magical Journal.');
    } catch (err) {
      setSaveStatus(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const primary = result ? getHexagram(result.primaryNumber) : undefined;
  const relating =
    result?.relatingNumber != null
      ? getHexagram(result.relatingNumber)
      : undefined;

  return (
    <div className="space-y-8">
      {!embedded && (
        <header>
          <h1 className="font-display text-2xl text-ananael-gold sm:text-3xl">I Ching</h1>
          <p className="mt-2 max-w-2xl text-sm text-ananael-muted">
            Cast with three coins or yarrow stalk probabilities. Changing lines
            yield a relating hexagram. Guests may cast freely; sign in to
            archive readings in the Magical Journal.
          </p>
        </header>
      )}

      <div className="flex flex-wrap gap-3">
        {METHODS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => {
              setMethod(m.id);
              setSaveStatus(null);
            }}
            className={[
              'rounded-md border px-4 py-3 text-left transition',
              method === m.id
                ? 'border-ananael-violet bg-ananael-violet/20 shadow-glow'
                : 'border-ananael-border bg-ananael-panel hover:border-ananael-gold/40',
            ].join(' ')}
          >
            <p className="text-sm font-medium text-zinc-100">{m.label}</p>
            <p className="text-xs text-ananael-muted">{m.description}</p>
          </button>
        ))}
      </div>

      <div>
        <button
          type="button"
          onClick={doCast}
          className="rounded-md bg-ananael-violet px-5 py-2.5 text-sm font-medium text-white transition hover:bg-ananael-violet-deep"
        >
          Cast Hexagram
        </button>
      </div>

      {result && primary && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-ananael-border/50 bg-ananael-surface">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-ananael-border/60 text-xs uppercase tracking-wider text-ananael-muted">
                  <th className="px-4 py-3 font-medium">Line</th>
                  <th className="px-4 py-3 font-medium">Value</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                </tr>
              </thead>
              <tbody>
                {[...result.lines]
                  .map((line, index) => ({ line, index }))
                  .reverse()
                  .map(({ line, index }) => (
                    <tr
                      key={index}
                      className="border-b border-ananael-border/30 last:border-0"
                    >
                      <td className="px-4 py-2 text-zinc-300">{index + 1}</td>
                      <td
                        className={[
                          'px-4 py-2 font-display',
                          isChanging(line)
                            ? 'text-ananael-gold'
                            : 'text-zinc-100',
                        ].join(' ')}
                      >
                        {line}
                      </td>
                      <td
                        className={[
                          'px-4 py-2',
                          isChanging(line)
                            ? 'text-ananael-gold'
                            : 'text-ananael-muted',
                        ].join(' ')}
                      >
                        {lineLabel(line)}
                        {isChanging(line) ? ' · changing' : ''}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <HexagramPanel
            title="Primary"
            hex={primary}
            lines={result.lines}
            changingLines={result.changingLines}
          />

          {relating && (
            <HexagramPanel title="Relating" hex={relating} />
          )}
        </div>
      )}

      {isAuthenticated && result && (
        <div className="max-w-xl space-y-3 rounded-lg border border-ananael-border/70 bg-ananael-panel p-4">
          <label className="block text-sm text-ananael-muted">
            Cast notes
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Question, reflections, or ritual context…"
              className="mt-1 w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet"
            />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={() => void saveCast()}
              className="rounded-md border border-ananael-gold/50 bg-ananael-gold/10 px-4 py-2 text-sm font-medium text-ananael-gold transition hover:bg-ananael-gold/20 disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save to Journal'}
            </button>
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('journal', { filter: 'divination' })}
                className="text-sm text-ananael-violet hover:underline"
              >
                Open Magical Journal
              </button>
            )}
          </div>
          {saveStatus && (
            <p className="text-sm text-zinc-400">
              {saveStatus}
              {saveStatus.startsWith('Saved') && onNavigate && (
                <>
                  {' '}
                  <button
                    type="button"
                    onClick={() =>
                      onNavigate('journal', { filter: 'divination' })
                    }
                    className="text-ananael-violet hover:underline"
                  >
                    View in Journal
                  </button>
                </>
              )}
            </p>
          )}
        </div>
      )}

      {isAuthenticated && !result && onNavigate && (
        <p className="text-sm text-ananael-muted">
          Past casts are in the{' '}
          <button
            type="button"
            onClick={() => onNavigate('journal', { filter: 'divination' })}
            className="text-ananael-violet hover:underline"
          >
            Magical Journal
          </button>
          .
        </p>
      )}

      {!isAuthenticated && (
        <p className="text-sm text-ananael-muted">
          Sign in to save casts to your Magical Journal.
        </p>
      )}
    </div>
  );
}
