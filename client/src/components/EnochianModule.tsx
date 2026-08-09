import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ENOCHIAN_CALLS,
  ENOCHIAN_TABLETS,
  getCall,
  type EnochianElement,
} from '../data/enochian';
import { apiFetch } from '../lib/api';
import type { ModuleId } from './Sidebar';
import type { TreeNavigateOptions } from './TreeOfLifeModule';

type TabId = 'tablets' | 'calls';

interface EnochianModuleProps {
  onNavigate?: (module: ModuleId, opts?: TreeNavigateOptions) => void;
}

interface NoteItem {
  _id: string;
  date: string;
  targetType: 'tablet' | 'call';
  targetId: string;
  userNotes: string;
}

/**
 * Enochian study — elemental tablet browser and Calls reader.
 */
export default function EnochianModule({ onNavigate }: EnochianModuleProps) {
  const { isAuthenticated } = useAuth();
  const [tab, setTab] = useState<TabId>('tablets');
  const [element, setElement] = useState<EnochianElement>('Fire');
  const [selected, setSelected] = useState<string | null>(null);
  const [callId, setCallId] = useState(ENOCHIAN_CALLS[0].id);
  const [lineIdx, setLineIdx] = useState(0);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [history, setHistory] = useState<NoteItem[]>([]);

  const tablet = ENOCHIAN_TABLETS.find((t) => t.element === element)!;
  const call = getCall(callId)!;

  useEffect(() => {
    if (!isAuthenticated) return;
    void (async () => {
      try {
        const res = await apiFetch('/api/enochian/notes');
        if (!res.ok) return;
        const data = (await res.json()) as { notes: NoteItem[] };
        setHistory(data.notes ?? []);
      } catch {
        /* ignore */
      }
    })();
  }, [isAuthenticated]);

  const saveNotes = async () => {
    if (!isAuthenticated || !notes.trim()) return;
    setStatus(null);
    try {
      const res = await apiFetch('/api/enochian/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetType: tab === 'tablets' ? 'tablet' : 'call',
          targetId: tab === 'tablets' ? element : callId,
          userNotes: notes,
        }),
      });
      const data = (await res.json()) as { message?: string; note?: NoteItem };
      if (!res.ok) throw new Error(data.message || 'Save failed');
      setStatus('Note saved.');
      if (data.note) setHistory((h) => [data.note!, ...h].slice(0, 40));
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Save failed');
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl text-ananael-gold">Enochian</h1>
        <p className="mt-2 max-w-2xl text-sm text-ananael-muted">
          Browse elemental tablet samples and read the Calls. Study excerpts for
          practice—deep-link letters into Gematria or Correspondences.
        </p>
      </header>

      <div className="flex flex-wrap gap-2 border-b border-ananael-border/40 pb-2">
        {(
          [
            { id: 'tablets' as const, label: 'Tablets' },
            { id: 'calls' as const, label: 'Calls' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={[
              'rounded-md px-3 py-1.5 text-sm transition',
              tab === t.id
                ? 'bg-ananael-violet/25 text-ananael-gold'
                : 'text-ananael-muted hover:text-zinc-200',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'tablets' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {ENOCHIAN_TABLETS.map((t) => (
              <button
                key={t.element}
                type="button"
                onClick={() => {
                  setElement(t.element);
                  setSelected(null);
                }}
                className={[
                  'rounded-md border px-3 py-1.5 text-sm',
                  element === t.element
                    ? 'border-ananael-violet bg-ananael-violet/20 text-ananael-gold'
                    : 'border-ananael-border text-zinc-300',
                ].join(' ')}
              >
                {t.element}
              </button>
            ))}
          </div>
          <div className="overflow-x-auto rounded-lg border border-ananael-border/60 bg-ananael-surface p-3">
            <div className="mx-auto grid w-max max-w-full grid-cols-5 gap-1 sm:gap-1.5">
              {tablet.grid.flatMap((row, ri) =>
                row.map((letter, ci) => {
                  const key = `${ri}-${ci}-${letter}`;
                  const active = selected === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelected(key)}
                      className={[
                        'flex h-8 w-8 items-center justify-center rounded font-display text-base sm:h-10 sm:w-10 sm:text-lg',
                        active
                          ? 'bg-ananael-violet/40 text-ananael-gold'
                          : 'bg-ananael-panel text-zinc-200 hover:text-ananael-gold',
                      ].join(' ')}
                    >
                      {letter}
                    </button>
                  );
                })
              )}
            </div>
          </div>
          {selected && (
            <div className="flex flex-wrap gap-2">
              <p className="w-full text-sm text-zinc-300">
                Selected:{' '}
                <span className="font-display text-ananael-gold">
                  {selected.split('-').pop()}
                </span>
              </p>
              <button
                type="button"
                onClick={() =>
                  onNavigate?.('gematria', {
                    gematriaPrefill: selected.split('-').pop(),
                  })
                }
                className="rounded-md border border-ananael-violet/50 px-3 py-1.5 text-xs text-zinc-100 hover:bg-ananael-violet/20"
              >
                Open in Gematria
              </button>
              <button
                type="button"
                onClick={() =>
                  onNavigate?.('correspondences', {
                    correspondencesQuery: element,
                  })
                }
                className="rounded-md border border-ananael-gold/50 px-3 py-1.5 text-xs text-ananael-gold hover:bg-ananael-gold/10"
              >
                Correspondences
              </button>
              <button
                type="button"
                onClick={() => onNavigate?.('translator')}
                className="rounded-md border border-ananael-bronze/60 px-3 py-1.5 text-xs text-zinc-200 hover:bg-ananael-panel"
              >
                Script Translator
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'calls' && (
        <div className="grid gap-6 lg:grid-cols-[14rem_1fr]">
          <ul className="space-y-1">
            {ENOCHIAN_CALLS.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => {
                    setCallId(c.id);
                    setLineIdx(0);
                  }}
                  className={[
                    'w-full rounded-md px-3 py-2 text-left text-sm',
                    callId === c.id
                      ? 'bg-ananael-violet/25 text-ananael-gold'
                      : 'text-zinc-300 hover:bg-ananael-panel',
                  ].join(' ')}
                >
                  {c.number}. {c.title}
                </button>
              </li>
            ))}
          </ul>
          <div>
            <h2 className="font-display text-xl text-ananael-gold">
              {call.title}
            </h2>
            <div className="mt-4 space-y-2">
              {call.lines.map((line, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setLineIdx(i)}
                  className={[
                    'block w-full rounded-md px-3 py-2 text-left text-sm leading-relaxed',
                    lineIdx === i
                      ? 'bg-ananael-violet/20 text-ananael-gold'
                      : 'text-zinc-300 hover:bg-ananael-panel/80',
                  ].join(' ')}
                >
                  {line}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <label className="block text-sm text-ananael-muted">
        Study notes
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet"
        />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        {isAuthenticated ? (
          <button
            type="button"
            onClick={() => void saveNotes()}
            className="rounded-md bg-ananael-violet px-4 py-2 text-sm text-white hover:bg-ananael-violet-deep"
          >
            Save note
          </button>
        ) : (
          <p className="text-sm text-ananael-muted">Sign in to save notes.</p>
        )}
        {status && <span className="text-sm text-ananael-gold">{status}</span>}
      </div>

      {history.length > 0 && (
        <section>
          <h2 className="font-display text-lg text-ananael-gold">
            Recent notes
          </h2>
          <ul className="mt-2 space-y-2 text-sm text-zinc-400">
            {history.slice(0, 5).map((n) => (
              <li key={n._id}>
                <span className="text-ananael-muted">
                  {n.targetType}:{n.targetId}
                </span>{' '}
                — {n.userNotes.slice(0, 80)}
                {n.userNotes.length > 80 ? '…' : ''}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
