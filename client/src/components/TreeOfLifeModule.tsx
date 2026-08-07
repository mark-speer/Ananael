import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCardById } from '../data/tarotDeck';
import {
  getPath,
  getSephira,
  getSephiraCenter,
  PATHS,
  SEPHIROTH,
  TREE_VIEWBOX,
  type Sephira,
  type TreePath,
} from '../data/treeOfLife';
import { apiFetch } from '../lib/api';
import type { ModuleId } from './Sidebar';

export interface TreeNavigateOptions {
  gematriaPrefill?: string;
}

interface TreeOfLifeModuleProps {
  onNavigate: (module: ModuleId, opts?: TreeNavigateOptions) => void;
}

type Selection =
  | { kind: 'sephira'; id: number }
  | { kind: 'path'; id: number };

interface HistoryItem {
  _id: string;
  date: string;
  targetType: 'sephira' | 'path';
  targetId: number;
  userNotes?: string;
}

const SEPHIRA_RADIUS = 28;

function targetLabel(targetType: 'sephira' | 'path', targetId: number): string {
  if (targetType === 'sephira') {
    const s = getSephira(targetId);
    return s ? `${s.name} (${s.title})` : `Sephira ${targetId}`;
  }
  const p = getPath(targetId);
  return p
    ? `Path ${p.id} · ${p.letterName}`
    : `Path ${targetId}`;
}

/**
 * Interactive Glyph of the Sephiroth with GD correspondences and study notes.
 */
export default function TreeOfLifeModule({ onNavigate }: TreeOfLifeModuleProps) {
  const { isAuthenticated } = useAuth();
  const [selection, setSelection] = useState<Selection | null>({
    kind: 'sephira',
    id: 1,
  });
  const [notes, setNotes] = useState('');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    if (!isAuthenticated) {
      setHistory([]);
      return;
    }
    setHistoryError(null);
    try {
      const res = await apiFetch('/api/tree/notes');
      const data = (await res.json()) as {
        notes?: HistoryItem[];
        message?: string;
      };
      if (!res.ok) {
        throw new Error(data.message || 'Failed to load notes');
      }
      setHistory(data.notes ?? []);
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
    setNotes('');
    setSaveStatus(null);
  }, [selection?.kind, selection?.id]);

  const selectedSephira: Sephira | undefined =
    selection?.kind === 'sephira' ? getSephira(selection.id) : undefined;
  const selectedPath: TreePath | undefined =
    selection?.kind === 'path' ? getPath(selection.id) : undefined;

  const saveNote = async () => {
    if (!isAuthenticated || !selection || !notes.trim()) return;
    setSaving(true);
    setSaveStatus(null);
    try {
      const res = await apiFetch('/api/tree/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetType: selection.kind,
          targetId: selection.id,
          userNotes: notes,
        }),
      });
      const data = (await res.json()) as { message?: string };
      if (!res.ok) {
        throw new Error(data.message || 'Failed to save note');
      }
      setSaveStatus('Note saved to your profile.');
      setNotes('');
      await loadHistory();
    } catch (err) {
      setSaveStatus(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const selectSephira = (id: number) => {
    setSelection({ kind: 'sephira', id });
  };

  const selectPath = (id: number) => {
    setSelection({ kind: 'path', id });
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl text-ananael-gold">
          Tree of Life
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ananael-muted">
          Explore the Glyph of the Sephiroth with Golden Dawn path
          correspondences. Click a sphere or path for detail; sign in to save
          study notes.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
        <div className="rounded-xl border border-ananael-border/50 bg-ananael-surface p-3 sm:p-5">
          <svg
            viewBox={`0 0 ${TREE_VIEWBOX.width} ${TREE_VIEWBOX.height}`}
            className="mx-auto h-auto w-full max-w-none lg:max-w-lg"
            role="img"
            aria-label="Tree of Life diagram with ten sephiroth and twenty-two paths"
          >
            <title>Tree of Life</title>

            {PATHS.map((path) => {
              const a = getSephiraCenter(path.from);
              const b = getSephiraCenter(path.to);
              const selected =
                selection?.kind === 'path' && selection.id === path.id;
              return (
                <g key={path.id}>
                  <line
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={selected ? '#c9a227' : '#3f3f46'}
                    strokeWidth={selected ? 4 : 2.5}
                    strokeLinecap="round"
                    className="pointer-events-none"
                  />
                  {/* Wider invisible hit target */}
                  <line
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke="transparent"
                    strokeWidth={18}
                    strokeLinecap="round"
                    className="cursor-pointer"
                    tabIndex={0}
                    role="button"
                    aria-label={`Path ${path.id}, ${path.letterName}`}
                    aria-pressed={selected}
                    onClick={() => selectPath(path.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        selectPath(path.id);
                      }
                    }}
                  />
                </g>
              );
            })}

            {SEPHIROTH.map((s) => {
              const selected =
                selection?.kind === 'sephira' && selection.id === s.id;
              return (
                <g key={s.id}>
                  <circle
                    cx={s.center.x}
                    cy={s.center.y}
                    r={SEPHIRA_RADIUS}
                    fill={selected ? '#5b21b6' : '#18181b'}
                    stroke={selected ? '#c9a227' : '#7c3aed'}
                    strokeWidth={selected ? 3 : 2}
                    className="cursor-pointer outline-none focus-visible:stroke-[#c9a227]"
                    tabIndex={0}
                    role="button"
                    aria-label={`${s.name}, ${s.title}`}
                    aria-pressed={selected}
                    onClick={() => selectSephira(s.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        selectSephira(s.id);
                      }
                    }}
                  />
                  <text
                    x={s.center.x}
                    y={s.center.y - 4}
                    textAnchor="middle"
                    className="pointer-events-none select-none fill-ananael-gold font-display"
                    style={{ fontSize: 12 }}
                  >
                    {s.id}
                  </text>
                  <text
                    x={s.center.x}
                    y={s.center.y + 11}
                    textAnchor="middle"
                    className="pointer-events-none select-none fill-zinc-300"
                    style={{ fontSize: 9 }}
                  >
                    {s.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="space-y-4">
          {selectedSephira && (
            <DetailPanel
              eyebrow={`Sephira ${selectedSephira.id}`}
              title={selectedSephira.name}
              subtitle={`${selectedSephira.hebrew} · ${selectedSephira.title}`}
              correspondence={selectedSephira.correspondence}
              blurb={selectedSephira.blurb}
            />
          )}

          {selectedPath && (
            <DetailPanel
              eyebrow={`Path ${selectedPath.id}`}
              title={selectedPath.letterName}
              subtitle={`${selectedPath.letterGlyph} · ${selectedPath.letterLatin}`}
              correspondence={selectedPath.correspondence}
              blurb={selectedPath.blurb}
              extra={
                <>
                  <p className="text-sm text-zinc-300">
                    <span className="text-xs uppercase tracking-wider text-ananael-muted">
                      Connects
                    </span>
                    <br />
                    {getSephira(selectedPath.from)?.name} ↔{' '}
                    {getSephira(selectedPath.to)?.name}
                  </p>
                  <p className="text-sm text-zinc-300">
                    <span className="text-xs uppercase tracking-wider text-ananael-muted">
                      Tarot
                    </span>
                    <br />
                    {getCardById(selectedPath.tarotId)?.name ??
                      selectedPath.tarotId}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        onNavigate('gematria', {
                          gematriaPrefill: selectedPath.letterGlyph,
                        })
                      }
                      className="rounded-md border border-ananael-violet/50 bg-ananael-violet/10 px-3 py-1.5 text-xs font-medium text-zinc-100 transition hover:bg-ananael-violet/20"
                    >
                      Open in Gematria
                    </button>
                    <button
                      type="button"
                      onClick={() => onNavigate('tarot')}
                      className="rounded-md border border-ananael-gold/50 bg-ananael-gold/10 px-3 py-1.5 text-xs font-medium text-ananael-gold transition hover:bg-ananael-gold/20"
                    >
                      View in Tarot
                    </button>
                  </div>
                </>
              }
            />
          )}

          {!selection && (
            <div className="rounded-xl border border-ananael-border/50 bg-ananael-surface p-5">
              <p className="text-sm text-ananael-muted">
                Select a sephira or path on the glyph.
              </p>
            </div>
          )}

          {isAuthenticated && selection && (
            <div className="space-y-3 rounded-lg border border-ananael-border/70 bg-ananael-panel p-4">
              <label className="block text-sm text-ananael-muted">
                Study notes for{' '}
                <span className="text-zinc-300">
                  {selection.kind === 'sephira'
                    ? selectedSephira?.name
                    : `Path ${selectedPath?.id}`}
                </span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Correspondences, meditations, ritual notes…"
                  className="mt-1 w-full rounded-md border border-ananael-border bg-ananael-bg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-ananael-violet"
                />
              </label>
              <button
                type="button"
                disabled={saving || !notes.trim()}
                onClick={saveNote}
                className="rounded-md border border-ananael-gold/50 bg-ananael-gold/10 px-4 py-2 text-sm font-medium text-ananael-gold transition hover:bg-ananael-gold/20 disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save Note to Profile'}
              </button>
              {saveStatus && (
                <p className="text-sm text-zinc-400">{saveStatus}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {isAuthenticated && (
        <div className="rounded-xl border border-ananael-border/50 bg-ananael-surface p-5">
          <h2 className="font-display text-lg text-ananael-gold">
            Recent study notes
          </h2>
          {historyError && (
            <p className="mt-2 text-sm text-red-400/90">{historyError}</p>
          )}
          {!historyError && history.length === 0 && (
            <p className="mt-2 text-sm text-ananael-muted">
              No saved notes yet.
            </p>
          )}
          {history.length > 0 && (
            <ul className="mt-4 space-y-3">
              {history.map((item) => {
                const date = new Date(item.date);
                return (
                  <li
                    key={item._id}
                    className="border-b border-ananael-border/30 pb-3 last:border-0 last:pb-0"
                  >
                    <button
                      type="button"
                      className="text-left"
                      onClick={() =>
                        setSelection({
                          kind: item.targetType,
                          id: item.targetId,
                        })
                      }
                    >
                      <p className="text-sm text-zinc-200">
                        <span className="font-display text-ananael-gold">
                          {targetLabel(item.targetType, item.targetId)}
                        </span>
                      </p>
                      <p className="mt-1 text-xs text-ananael-muted">
                        {date.toLocaleString()}
                      </p>
                      {item.userNotes && (
                        <p className="mt-1 text-xs text-zinc-400 line-clamp-2">
                          {item.userNotes}
                        </p>
                      )}
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

function DetailPanel({
  eyebrow,
  title,
  subtitle,
  correspondence,
  blurb,
  extra,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  correspondence: string;
  blurb: string;
  extra?: ReactNode;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-ananael-border/50 bg-ananael-surface p-5">
      <p className="text-xs uppercase tracking-wider text-ananael-muted">
        {eyebrow}
      </p>
      <h2 className="font-display text-xl text-ananael-gold">{title}</h2>
      <p className="text-sm text-zinc-300">{subtitle}</p>
      <p className="text-sm text-zinc-300">
        <span className="text-xs uppercase tracking-wider text-ananael-muted">
          Correspondence
        </span>
        <br />
        {correspondence}
      </p>
      <p className="text-sm text-ananael-muted">{blurb}</p>
      {extra}
    </div>
  );
}
