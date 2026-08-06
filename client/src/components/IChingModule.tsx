import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getHexagram, type HexagramText } from '../data/iching';
import {
  cast,
  isChanging,
  isYang,
  type CastMethod,
  type CastResult,
  type LineValue,
} from '../lib/iching';

interface HistoryItem {
  _id: string;
  date: string;
  method: CastMethod;
  primaryNumber: number;
  relatingNumber: number | null;
  changingLines: number[];
  userNotes?: string;
}

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

function lineLabel(value: LineValue): string {
  switch (value) {
    case 6:
      return 'Old Yin';
    case 7:
      return 'Young Yang';
    case 8:
      return 'Young Yin';
    case 9:
      return 'Old Yang';
  }
}

function HexagramGlyph({ lines }: { lines: LineValue[] }) {
  // Display top line first (traditional visual order).
  const topFirst = [...lines].reverse();
  return (
    <div className="flex flex-col gap-1.5" aria-hidden>
      {topFirst.map((line, visualIndex) => {
        const bottomIndex = 5 - visualIndex;
        const changing = isChanging(line);
        const yang = isYang(line);
        return (
          <div
            key={bottomIndex}
            className="flex h-3 items-center justify-center gap-1.5"
            title={`Line ${bottomIndex + 1}: ${lineLabel(line)}`}
          >
            {yang ? (
              <div
                className={[
                  'h-2.5 w-28 rounded-sm',
                  changing ? 'bg-ananael-gold' : 'bg-zinc-200',
                ].join(' ')}
              />
            ) : (
              <>
                <div
                  className={[
                    'h-2.5 w-12 rounded-sm',
                    changing ? 'bg-ananael-gold' : 'bg-zinc-200',
                  ].join(' ')}
                />
                <div
                  className={[
                    'h-2.5 w-12 rounded-sm',
                    changing ? 'bg-ananael-gold' : 'bg-zinc-200',
                  ].join(' ')}
                />
              </>
            )}
            {changing && (
              <span className="ml-1 text-[10px] uppercase tracking-wider text-ananael-gold">
                ×
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

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
  return (
    <div className="rounded-xl border border-ananael-border/50 bg-ananael-surface/40 p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-ananael-muted">
        {title}
      </p>
      <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-8">
        {lines && (
          <div className="shrink-0">
            <HexagramGlyph lines={lines} />
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
        </div>
      </div>
    </div>
  );
}

/**
 * I Ching module: coin/yarrow cast, King Wen text, profile save + recent history.
 */
export default function IChingModule() {
  const { isAuthenticated, token } = useAuth();
  const [method, setMethod] = useState<CastMethod>('coins');
  const [result, setResult] = useState<CastResult | null>(null);
  const [notes, setNotes] = useState('');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    if (!token) {
      setHistory([]);
      return;
    }
    setHistoryError(null);
    try {
      const res = await fetch('/api/iching/history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as {
        casts?: HistoryItem[];
        message?: string;
      };
      if (!res.ok) {
        throw new Error(data.message || 'Failed to load history');
      }
      setHistory(data.casts ?? []);
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

  const doCast = () => {
    setSaveStatus(null);
    setResult(cast(method));
  };

  const saveCast = async () => {
    if (!token || !result) return;
    setSaving(true);
    setSaveStatus(null);
    try {
      const res = await fetch('/api/iching/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          method: result.method,
          lines: result.lines,
          primaryNumber: result.primaryNumber,
          relatingNumber: result.relatingNumber,
          changingLines: result.changingLines,
          userNotes: notes,
        }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        throw new Error(data.message || 'Failed to save cast');
      }
      setSaveStatus('Cast saved to your profile.');
      await loadHistory();
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
      <header>
        <h1 className="font-display text-3xl text-ananael-gold">I Ching</h1>
        <p className="mt-2 max-w-2xl text-sm text-ananael-muted">
          Cast with three coins or yarrow stalk probabilities. Changing lines
          yield a relating hexagram. Guests may cast freely; sign in to archive
          readings.
        </p>
      </header>

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
                : 'border-ananael-border bg-ananael-panel/40 hover:border-ananael-gold/40',
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
          <div className="overflow-x-auto rounded-xl border border-ananael-border/50 bg-ananael-surface/40">
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
        <div className="max-w-xl space-y-3 rounded-lg border border-ananael-border/70 bg-ananael-panel/50 p-4">
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
          <button
            type="button"
            disabled={saving}
            onClick={saveCast}
            className="rounded-md border border-ananael-gold/50 bg-ananael-gold/10 px-4 py-2 text-sm font-medium text-ananael-gold transition hover:bg-ananael-gold/20 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save Cast to Profile'}
          </button>
          {saveStatus && <p className="text-sm text-zinc-400">{saveStatus}</p>}
        </div>
      )}

      {isAuthenticated && (
        <div className="rounded-xl border border-ananael-border/50 bg-ananael-surface/40 p-5">
          <h2 className="font-display text-lg text-ananael-gold">
            Recent casts
          </h2>
          {historyError && (
            <p className="mt-2 text-sm text-red-400/90">{historyError}</p>
          )}
          {!historyError && history.length === 0 && (
            <p className="mt-2 text-sm text-ananael-muted">
              No saved casts yet.
            </p>
          )}
          {history.length > 0 && (
            <ul className="mt-4 space-y-3">
              {history.map((item) => {
                const hex = getHexagram(item.primaryNumber);
                const date = new Date(item.date);
                return (
                  <li
                    key={item._id}
                    className="border-b border-ananael-border/30 pb-3 last:border-0 last:pb-0"
                  >
                    <p className="text-sm text-zinc-200">
                      <span className="font-display text-ananael-gold">
                        {item.primaryNumber}. {hex?.name ?? 'Hexagram'}
                      </span>
                      {item.relatingNumber != null && (
                        <span className="text-ananael-muted">
                          {' '}
                          → {item.relatingNumber}.{' '}
                          {getHexagram(item.relatingNumber)?.name ?? 'Relating'}
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-xs text-ananael-muted">
                      {item.method === 'yarrow' ? 'Yarrow' : 'Coins'} ·{' '}
                      {date.toLocaleString()}
                      {item.changingLines.length > 0 &&
                        ` · lines ${item.changingLines.map((i) => i + 1).join(', ')}`}
                    </p>
                    {item.userNotes && (
                      <p className="mt-1 text-xs text-zinc-400 line-clamp-2">
                        {item.userNotes}
                      </p>
                    )}
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
